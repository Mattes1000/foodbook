import { db } from "../db";

export async function handleOrders(req: Request, url: URL): Promise<Response | null> {
  const path = url.pathname;

  // GET /api/orders/check?user_id=X&date=YYYY-MM-DD
  if (req.method === "GET" && path === "/api/orders/check") {
    const userId = url.searchParams.get("user_id");
    const date = url.searchParams.get("date") ?? new Date().toISOString().split("T")[0];
    
    if (!userId) {
      return Response.json({ hasOrder: false, menuId: null });
    }

    const existingOrder = db.query(`
      SELECT o.id, oi.menu_id
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = $user_id AND o.order_date = $date
      LIMIT 1
    `).get({ $user_id: parseInt(userId), $date: date }) as { id: number; menu_id: number } | null;
    
    return Response.json({ 
      hasOrder: !!existingOrder,
      menuId: existingOrder?.menu_id ?? null
    });
  }

  // GET /api/orders?user_id=X
  if (req.method === "GET" && path === "/api/orders") {
    const userId = url.searchParams.get("user_id");
    const rows = db.query(`
      SELECT o.*,
             u.firstname || ' ' || u.lastname as user_fullname,
             u.role as user_role,
             GROUP_CONCAT(m.name || ' x' || oi.quantity) as items
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN menus m ON m.id = oi.menu_id
      ${userId ? "WHERE o.user_id = $user_id" : ""}
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `).all(userId ? { $user_id: parseInt(userId) } : {});
    return Response.json(rows);
  }

  // POST /api/orders
  if (req.method === "POST" && path === "/api/orders") {
    const body = await req.json() as {
      customer_name: string;
      user_id?: number;
      order_date?: string;
      menu_id: number;
      quantity?: number;
    };
    const { customer_name, user_id, order_date, menu_id, quantity = 1 } = body;
    if (!customer_name || !menu_id) {
      return new Response("Bad Request", { status: 400 });
    }

    const targetDate = order_date || new Date().toISOString().split("T")[0];

    // Check if user already has an order for this date
    if (user_id) {
      const existingOrder = db.query(`
        SELECT id FROM orders 
        WHERE user_id = $user_id AND order_date = $order_date
      `).get({ $user_id: user_id, $order_date: targetDate });
      
      if (existingOrder) {
        return Response.json(
          { error: "Du hast bereits eine Bestellung für diesen Tag." },
          { status: 400 }
        );
      }
    }

    // Get menu price
    const menu = db.query("SELECT price FROM menus WHERE id = $id").get({ $id: menu_id }) as { price: number } | null;
    if (!menu) {
      return Response.json({ error: "Menü nicht gefunden." }, { status: 404 });
    }

    const total = menu.price * quantity;

    db.query("INSERT INTO orders (customer_name, user_id, order_date, total) VALUES ($name, $user_id, $order_date, $total)")
      .run({ $name: customer_name, $user_id: user_id ?? null, $order_date: targetDate, $total: total });
    const order = db.query("SELECT last_insert_rowid() as id").get() as { id: number };

    db.query("INSERT INTO order_items (order_id, menu_id, quantity, price_at_order) VALUES ($order_id, $menu_id, $quantity, $price)")
      .run({ $order_id: order.id, $menu_id: menu_id, $quantity: quantity, $price: menu.price });

    return Response.json({ id: order.id, total }, { status: 201 });
  }

  // DELETE /api/orders/:id - Admin löscht Bestellung nach ID
  const matchDelete = path.match(/^\/api\/orders\/(\d+)$/);
  if (req.method === "DELETE" && matchDelete) {
    const orderId = parseInt(matchDelete[1]);
    
    const order = db.query("SELECT id FROM orders WHERE id = $id").get({ $id: orderId }) as { id: number } | null;
    
    if (!order) {
      return Response.json({ error: "Bestellung nicht gefunden." }, { status: 404 });
    }

    db.query("DELETE FROM order_items WHERE order_id = $order_id").run({ $order_id: orderId });
    db.query("DELETE FROM orders WHERE id = $order_id").run({ $order_id: orderId });

    return Response.json({ success: true });
  }

  // DELETE /api/orders?user_id=X&date=YYYY-MM-DD
  if (req.method === "DELETE" && path === "/api/orders") {
    const userId = url.searchParams.get("user_id");
    const date = url.searchParams.get("date");
    
    if (!userId || !date) {
      return new Response("Bad Request: user_id and date required", { status: 400 });
    }

    const order = db.query(`
      SELECT id FROM orders 
      WHERE user_id = $user_id AND order_date = $date
    `).get({ $user_id: parseInt(userId), $date: date }) as { id: number } | null;
    
    if (!order) {
      return Response.json({ error: "Keine Bestellung gefunden." }, { status: 404 });
    }

    db.query("DELETE FROM order_items WHERE order_id = $order_id").run({ $order_id: order.id });
    db.query("DELETE FROM orders WHERE id = $order_id").run({ $order_id: order.id });

    return Response.json({ success: true });
  }

  return null;
}
