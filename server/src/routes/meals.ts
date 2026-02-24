import { db } from "../db";

export async function handleMeals(req: Request, url: URL): Promise<Response | null> {
  const path = url.pathname;

  // GET /api/meals?date=YYYY-MM-DD
  if (req.method === "GET" && path === "/api/meals") {
    const date = url.searchParams.get("date") ?? new Date().toISOString().split("T")[0];
    const rows = db.query(`
      SELECT m.*, GROUP_CONCAT(md.available_date) as dates
      FROM meals m
      JOIN meal_days md ON md.meal_id = m.id
      WHERE m.active = 1 AND md.available_date = $date
      GROUP BY m.id
      ORDER BY m.category, m.name
    `).all({ $date: date });
    return Response.json(rows);
  }

  // GET /api/meals/all (admin)
  if (req.method === "GET" && path === "/api/meals/all") {
    const rows = db.query(`
      SELECT m.*, GROUP_CONCAT(md.available_date) as dates
      FROM meals m
      LEFT JOIN meal_days md ON md.meal_id = m.id
      GROUP BY m.id
      ORDER BY m.category, m.name
    `).all();
    return Response.json(rows);
  }

  // GET /api/meals/:id
  const matchGet = path.match(/^\/api\/meals\/(\d+)$/);
  if (req.method === "GET" && matchGet) {
    const id = parseInt(matchGet[1]);
    const meal = db.query(`SELECT * FROM meals WHERE id = $id`).get({ $id: id });
    if (!meal) return new Response("Not Found", { status: 404 });
    const dates = db.query(`SELECT available_date FROM meal_days WHERE meal_id = $id ORDER BY available_date`).all({ $id: id });
    return Response.json({ ...meal as object, dates: (dates as { available_date: string }[]).map((d) => d.available_date) });
  }

  // POST /api/meals
  if (req.method === "POST" && path === "/api/meals") {
    return handleCreate(req);
  }

  // PUT /api/meals/:id
  const matchPut = path.match(/^\/api\/meals\/(\d+)$/);
  if (req.method === "PUT" && matchPut) {
    return handleUpdate(req, parseInt(matchPut[1]));
  }

  // POST /api/meals/:id/copy
  const matchCopy = path.match(/^\/api\/meals\/(\d+)\/copy$/);
  if (req.method === "POST" && matchCopy) {
    return handleCopy(parseInt(matchCopy[1]));
  }

  // DELETE /api/meals/:id
  const matchDel = path.match(/^\/api\/meals\/(\d+)$/);
  if (req.method === "DELETE" && matchDel) {
    db.query("UPDATE meals SET active = 0 WHERE id = $id").run({ $id: parseInt(matchDel[1]) });
    return Response.json({ ok: true });
  }

  return null;
}

async function handleCreate(req: Request): Promise<Response> {
  const body = await req.json() as { name: string; description: string; price: number; category: string; dates?: string[] };
  const { name, description, price, category, dates = [] } = body;
  db.query("INSERT INTO meals (name, description, price, category) VALUES ($name, $description, $price, $category)")
    .run({ $name: name, $description: description, $price: price, $category: category });
  const row = db.query("SELECT last_insert_rowid() as id").get() as { id: number };
  const insertDay = db.prepare("INSERT OR IGNORE INTO meal_days (meal_id, available_date) VALUES ($meal_id, $date)");
  for (const date of dates) insertDay.run({ $meal_id: row.id, $date: date });
  return Response.json({ id: row.id }, { status: 201 });
}

async function handleUpdate(req: Request, id: number): Promise<Response> {
  const body = await req.json() as { name: string; description: string; price: number; category: string; active?: number; dates?: string[] };
  const { name, description, price, category, active = 1, dates = [] } = body;
  db.query("UPDATE meals SET name=$name, description=$description, price=$price, category=$category, active=$active WHERE id=$id")
    .run({ $name: name, $description: description, $price: price, $category: category, $active: active, $id: id });
  db.query("DELETE FROM meal_days WHERE meal_id = $id").run({ $id: id });
  const insertDay = db.prepare("INSERT OR IGNORE INTO meal_days (meal_id, available_date) VALUES ($meal_id, $date)");
  for (const date of dates) insertDay.run({ $meal_id: id, $date: date });
  return Response.json({ ok: true });
}

function handleCopy(id: number): Response {
  const meal = db.query("SELECT * FROM meals WHERE id = $id").get({ $id: id }) as { name: string; description: string; price: number; category: string } | null;
  if (!meal) return new Response("Not Found", { status: 404 });
  db.query("INSERT INTO meals (name, description, price, category) VALUES ($name, $description, $price, $category)")
    .run({ $name: `${meal.name} (Kopie)`, $description: meal.description, $price: meal.price, $category: meal.category });
  const row = db.query("SELECT last_insert_rowid() as id").get() as { id: number };
  return Response.json({ id: row.id }, { status: 201 });
}
