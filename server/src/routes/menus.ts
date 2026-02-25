import { db } from "../db";

export async function handleMenus(req: Request, url: URL): Promise<Response | null> {
  const path = url.pathname;

  // GET /api/menus?date=YYYY-MM-DD
  if (req.method === "GET" && path === "/api/menus") {
    const date = url.searchParams.get("date") ?? new Date().toISOString().split("T")[0];
    const rows = db.query(`
      SELECT 
        m.*,
        GROUP_CONCAT(md.available_date) as dates
      FROM menus m
      JOIN menu_days md ON md.menu_id = m.id
      WHERE m.active = 1 AND md.available_date = $date
      GROUP BY m.id
      ORDER BY m.name
    `).all({ $date: date });
    return Response.json(rows);
  }

  // GET /api/menus/all (admin)
  if (req.method === "GET" && path === "/api/menus/all") {
    const rows = db.query(`
      SELECT 
        m.*,
        GROUP_CONCAT(md.available_date) as dates
      FROM menus m
      LEFT JOIN menu_days md ON m.id = md.menu_id
      GROUP BY m.id
      ORDER BY m.created_at DESC
    `).all();
    return Response.json(rows);
  }

  // GET /api/menus/:id
  const matchGet = path.match(/^\/api\/menus\/(\d+)$/);
  if (req.method === "GET" && matchGet) {
    const id = parseInt(matchGet[1]);
    const menu = db.query(`SELECT * FROM menus WHERE id = $id`).get({ $id: id });
    if (!menu) return new Response("Not Found", { status: 404 });
    const dates = db.query(`SELECT available_date FROM menu_days WHERE menu_id = $id ORDER BY available_date`).all({ $id: id });
    return Response.json({ ...menu as object, dates: (dates as { available_date: string }[]).map((d) => d.available_date) });
  }

  // POST /api/menus
  if (req.method === "POST" && path === "/api/menus") {
    return handleCreate(req);
  }

  // PUT /api/menus/:id
  const matchPut = path.match(/^\/api\/menus\/(\d+)$/);
  if (req.method === "PUT" && matchPut) {
    return handleUpdate(req, parseInt(matchPut[1]));
  }

  // POST /api/menus/:id/copy
  const matchCopy = path.match(/^\/api\/menus\/(\d+)\/copy$/);
  if (req.method === "POST" && matchCopy) {
    return handleCopy(parseInt(matchCopy[1]));
  }

  // DELETE /api/menus/:id
  const matchDelete = path.match(/^\/api\/menus\/(\d+)$/);
  if (req.method === "DELETE" && matchDelete) {
    return handleDelete(parseInt(matchDelete[1]));
  }

  return null;
}

async function handleCreate(req: Request): Promise<Response> {
  const body = await req.json();
  const { name, description, price, active = 1, dates = [] } = body;
  
  const result = db.query(`
    INSERT INTO menus (name, description, price, active)
    VALUES ($name, $description, $price, $active)
  `).run({
    $name: name,
    $description: description || "",
    $price: price,
    $active: active,
  });
  
  const menuId = result.lastInsertRowid as number;
  
  // Insert dates
  if (dates.length > 0) {
    const insertDate = db.prepare("INSERT INTO menu_days (menu_id, available_date) VALUES ($menu_id, $date)");
    for (const date of dates) {
      insertDate.run({ $menu_id: menuId, $date: date });
    }
  }
  
  return Response.json({ id: menuId });
}

async function handleUpdate(req: Request, id: number): Promise<Response> {
  const body = await req.json();
  const { name, description, price, active, dates = [] } = body;
  
  db.query(`
    UPDATE menus 
    SET name = $name, description = $description, price = $price, active = $active
    WHERE id = $id
  `).run({
    $name: name,
    $description: description || "",
    $price: price,
    $active: active,
    $id: id,
  });
  
  // Update dates
  db.query("DELETE FROM menu_days WHERE menu_id = $id").run({ $id: id });
  
  if (dates.length > 0) {
    const insertDate = db.prepare("INSERT INTO menu_days (menu_id, available_date) VALUES ($menu_id, $date)");
    for (const date of dates) {
      insertDate.run({ $menu_id: id, $date: date });
    }
  }
  
  return Response.json({ success: true });
}

function handleCopy(id: number): Response {
  const original = db.query("SELECT * FROM menus WHERE id = $id").get({ $id: id }) as any;
  
  if (!original) return new Response("Not Found", { status: 404 });
  
  const result = db.query(`
    INSERT INTO menus (name, description, price, active)
    VALUES ($name, $description, $price, $active)
  `).run({
    $name: `${original.name} (Kopie)`,
    $description: original.description,
    $price: original.price,
    $active: 0,
  });
  
  return Response.json({ id: result.lastInsertRowid });
}

function handleDelete(id: number): Response {
  db.query("DELETE FROM menus WHERE id = $id").run({ $id: id });
  return Response.json({ success: true });
}
