import { db } from "../db";
import { randomUUID } from "crypto";

export async function handleUsers(req: Request, url: URL): Promise<Response | null> {
  const path = url.pathname;

  // POST /api/auth/login  — Username+Password Login
  if (req.method === "POST" && path === "/api/auth/login") {
    const body = await req.json() as { username: string; password: string };
    const { username, password } = body;
    if (!username || !password) return new Response("Bad Request", { status: 400 });

    const user = db.query(
      "SELECT id, firstname, lastname, role, qr_token, password_hash FROM users WHERE username = $username"
    ).get({ $username: username }) as {
      id: number; firstname: string; lastname: string; role: string; qr_token: string; password_hash: string;
    } | null;

    if (!user || !user.password_hash) return new Response("Unauthorized", { status: 401 });

    const valid = await Bun.password.verify(password, user.password_hash);
    if (!valid) return new Response("Unauthorized", { status: 401 });

    const { password_hash: _, ...safeUser } = user;
    return Response.json(safeUser);
  }

  // GET /api/auth/qr/:token  — QR-Login
  const matchQr = path.match(/^\/api\/auth\/qr\/(.+)$/);
  if (req.method === "GET" && matchQr) {
    const token = matchQr[1];
    const user = db.query("SELECT id, firstname, lastname, role, qr_token FROM users WHERE qr_token = $token").get({ $token: token }) as {
      id: number; firstname: string; lastname: string; role: string; qr_token: string;
    } | null;
    if (!user) return new Response("Unauthorized", { status: 401 });
    return Response.json(user);
  }

  // GET /api/users  — alle User (admin/manager)
  if (req.method === "GET" && path === "/api/users") {
    const rows = db.query("SELECT id, firstname, lastname, role, qr_token, created_at FROM users ORDER BY role, lastname").all();
    return Response.json(rows);
  }

  // POST /api/users  — neuen User anlegen
  if (req.method === "POST" && path === "/api/users") {
    const body = await req.json() as { firstname: string; lastname: string; role: string };
    const { firstname, lastname, role } = body;
    if (!firstname || !lastname || !["admin", "manager", "user"].includes(role)) {
      return new Response("Bad Request", { status: 400 });
    }
    const qr_token = randomUUID();
    db.query("INSERT INTO users (firstname, lastname, role, qr_token) VALUES ($firstname, $lastname, $role, $qr_token)")
      .run({ $firstname: firstname, $lastname: lastname, $role: role, $qr_token: qr_token });
    const row = db.query("SELECT last_insert_rowid() as id").get() as { id: number };
    return Response.json({ id: row.id, qr_token }, { status: 201 });
  }

  // PUT /api/users/:id
  const matchPut = path.match(/^\/api\/users\/(\d+)$/);
  if (req.method === "PUT" && matchPut) {
    const id = parseInt(matchPut[1]);
    const body = await req.json() as { firstname: string; lastname: string; role: string };
    const { firstname, lastname, role } = body;
    db.query("UPDATE users SET firstname=$firstname, lastname=$lastname, role=$role WHERE id=$id")
      .run({ $firstname: firstname, $lastname: lastname, $role: role, $id: id });
    return Response.json({ ok: true });
  }

  // DELETE /api/users/:id
  const matchDel = path.match(/^\/api\/users\/(\d+)$/);
  if (req.method === "DELETE" && matchDel) {
    const id = parseInt(matchDel[1]);
    db.query("DELETE FROM users WHERE id = $id").run({ $id: id });
    return Response.json({ ok: true });
  }

  return null;
}
