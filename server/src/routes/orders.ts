import { db } from "../db";

export async function handleOrders(req: Request, url: URL): Promise<Response | null> {
  const path = url.pathname;

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
      LEFT JOIN meals m ON m.id = oi.meal_id
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
      items: { meal_id: number; quantity: number }[];
    };
    const { customer_name, user_id, items } = body;
    if (!customer_name || !items?.length) {
      return new Response("Bad Request", { status: 400 });
    }

    let total = 0;
    for (const item of items) {
      const meal = db.query("SELECT price FROM meals WHERE id = $id").get({ $id: item.meal_id }) as { price: number } | null;
      if (meal) total += meal.price * item.quantity;
    }

    db.query("INSERT INTO orders (customer_name, user_id, total) VALUES ($name, $user_id, $total)")
      .run({ $name: customer_name, $user_id: user_id ?? null, $total: total });
    const order = db.query("SELECT last_insert_rowid() as id").get() as { id: number };

    const insertItem = db.prepare(
      "INSERT INTO order_items (order_id, meal_id, quantity, price_at_order) VALUES ($order_id, $meal_id, $quantity, $price)"
    );
    for (const item of items) {
      const meal = db.query("SELECT price FROM meals WHERE id = $id").get({ $id: item.meal_id }) as { price: number } | null;
      if (meal) {
        insertItem.run({ $order_id: order.id, $meal_id: item.meal_id, $quantity: item.quantity, $price: meal.price });
      }
    }

    return Response.json({ id: order.id, total }, { status: 201 });
  }

  return null;
}
