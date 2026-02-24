import { db } from "./db";
import { randomUUID } from "crypto";

const today = new Date();
const dates = [0, 1, 2].map((offset) => {
  const d = new Date(today);
  d.setDate(today.getDate() + offset);
  return d.toISOString().split("T")[0];
});

const existingMeals = db.query("SELECT COUNT(*) as count FROM meals").get() as { count: number };
const existingUsers = db.query("SELECT COUNT(*) as count FROM users").get() as { count: number };

// Always ensure admin user exists (idempotent)
const adminExists = db.query("SELECT id FROM users WHERE username = 'admin'").get();
if (!adminExists) {
  const adminHash = await Bun.password.hash("admin", { algorithm: "bcrypt" });
  db.query(
    "INSERT INTO users (firstname, lastname, role, qr_token, username, password_hash) VALUES ($fn, $ln, $role, $token, $username, $hash)"
  ).run({ $fn: "Admin", $ln: "User", $role: "admin", $token: randomUUID(), $username: "admin", $hash: adminHash });
  console.log("Created admin user (username: admin, password: admin).");
}

if (existingMeals.count > 0 && existingUsers.count > 0) {
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

if (existingMeals.count > 0) {
  console.log("Meals already seeded, skipping meals.");
  process.exit(0);
}

const meals: { name: string; description: string; price: number; category: string }[] = [
  { name: "Tomatensuppe", description: "Cremige Tomatensuppe mit Basilikum und Croutons", price: 5.9, category: "starter" },
  { name: "Bruschetta", description: "Geröstetes Brot mit Tomaten, Knoblauch und Olivenöl", price: 6.5, category: "starter" },
  { name: "Wiener Schnitzel", description: "Klassisches Wiener Schnitzel mit Kartoffelsalat und Zitrone", price: 16.9, category: "main" },
  { name: "Lachsfilet", description: "Gebratenes Lachsfilet mit Dillsauce und Reis", price: 18.5, category: "main" },
  { name: "Vegane Buddha Bowl", description: "Quinoa, geröstete Kichererbsen, Avocado und Tahini-Dressing", price: 13.9, category: "main" },
  { name: "Tiramisu", description: "Klassisches Tiramisu mit Mascarpone und Espresso", price: 6.9, category: "dessert" },
  { name: "Schokoladenmousse", description: "Luftiges Schokoladenmousse mit Schlagsahne", price: 5.9, category: "dessert" },
];

const insertMeal = db.prepare(
  "INSERT INTO meals (name, description, price, category) VALUES ($name, $description, $price, $category)"
);
const insertDay = db.prepare(
  "INSERT OR IGNORE INTO meal_days (meal_id, available_date) VALUES ($meal_id, $available_date)"
);

const insertAll = db.transaction(() => {
  for (const meal of meals) {
    insertMeal.run({ $name: meal.name, $description: meal.description, $price: meal.price, $category: meal.category });
    const row = db.query("SELECT last_insert_rowid() as id").get() as { id: number };
    for (const date of dates) {
      insertDay.run({ $meal_id: row.id, $available_date: date });
    }
  }
});

insertAll();
console.log(`Seeded ${meals.length} meals for dates: ${dates.join(", ")}`);
