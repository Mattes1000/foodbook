import { db } from "./db";
import { randomUUID } from "crypto";

const today = new Date();
const dates = [0, 1, 2].map((offset) => {
  const d = new Date(today);
  d.setDate(today.getDate() + offset);
  return d.toISOString().split("T")[0];
});

const existingUsers = db.query("SELECT COUNT(*) as count FROM users").get() as { count: number };
const existingMenus = db.query("SELECT COUNT(*) as count FROM menus").get() as { count: number };

// Always ensure admin user exists (idempotent)
const adminExists = db.query("SELECT id FROM users WHERE username = 'admin'").get();
if (!adminExists) {
  const adminHash = await Bun.password.hash("admin", { algorithm: "bcrypt" });
  db.query(
    "INSERT INTO users (firstname, lastname, role, qr_token, username, password_hash) VALUES ($fn, $ln, $role, $token, $username, $hash)"
  ).run({ $fn: "Admin", $ln: "User", $role: "admin", $token: randomUUID(), $username: "admin", $hash: adminHash });
  console.log("Created admin user (username: admin, password: admin).");
}

// Always ensure test user exists (idempotent)
const userExists = db.query("SELECT id FROM users WHERE username = 'user'").get();
if (!userExists) {
  const userHash = await Bun.password.hash("user", { algorithm: "bcrypt" });
  db.query(
    "INSERT INTO users (firstname, lastname, role, qr_token, username, password_hash) VALUES ($fn, $ln, $role, $token, $username, $hash)"
  ).run({ $fn: "Test", $ln: "User", $role: "user", $token: randomUUID(), $username: "user", $hash: userHash });
  console.log("Created test user (username: user, password: user).");
}

if (existingMenus.count > 0 && existingUsers.count > 0) {
  console.log("Seed already applied, skipping.");
  process.exit(0);
}

// Seed users
if (existingUsers.count === 0) {
  const dummyUsers: { firstname: string; lastname: string; role: string }[] = [
    { firstname: "Anna",   lastname: "Müller",   role: "admin"   },
    { firstname: "Klaus",  lastname: "Schmidt",  role: "manager" },
    { firstname: "Maria",  lastname: "Wagner",   role: "user"    },
    { firstname: "Felix",  lastname: "Becker",   role: "user"    },
    { firstname: "Sophie", lastname: "Hoffmann", role: "user"    },
  ];

  const insertUser = db.prepare(
    "INSERT INTO users (firstname, lastname, role, qr_token) VALUES ($firstname, $lastname, $role, $qr_token)"
  );

  db.transaction(() => {
    for (const u of dummyUsers) {
      insertUser.run({ $firstname: u.firstname, $lastname: u.lastname, $role: u.role, $qr_token: randomUUID() });
    }
  })();

  console.log(`Seeded ${dummyUsers.length} users.`);
}

// Seed menus
const menus: { name: string; description: string; price: number }[] = [
  { 
    name: "Klassisches Menü", 
    description: "Tomatensuppe\nWiener Schnitzel mit Kartoffelsalat\nTiramisu",
    price: 26.9 
  },
  { 
    name: "Fisch-Menü", 
    description: "Bruschetta\nLachsfilet mit Dillsauce und Reis\nPanna Cotta",
    price: 28.9 
  },
  { 
    name: "Veganes Menü", 
    description: "Caesar Salad\nVegane Buddha Bowl\nApfelstrudel",
    price: 24.9 
  },
  { 
    name: "Italienisches Menü", 
    description: "Bruschetta\nSpaghetti Carbonara\nTiramisu",
    price: 23.9 
  },
  { 
    name: "Premium-Menü", 
    description: "Caesar Salad\nRinderfilet mit Pfefferrahmsauce\nSchokoladenmousse",
    price: 35.9 
  },
];

const insertMenu = db.prepare(
  "INSERT INTO menus (name, description, price) VALUES ($name, $description, $price)"
);
const insertMenuDay = db.prepare(
  "INSERT OR IGNORE INTO menu_days (menu_id, available_date) VALUES ($menu_id, $available_date)"
);

const insertAllMenus = db.transaction(() => {
  for (const menu of menus) {
    insertMenu.run({ 
      $name: menu.name, 
      $description: menu.description, 
      $price: menu.price 
    });
    const row = db.query("SELECT last_insert_rowid() as id").get() as { id: number };
    for (const date of dates) {
      insertMenuDay.run({ $menu_id: row.id, $available_date: date });
    }
  }
});

insertAllMenus();
console.log(`Seeded ${menus.length} menus for dates: ${dates.join(", ")}`);
