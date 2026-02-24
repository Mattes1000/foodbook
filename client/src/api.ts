import type { Meal, Order, User } from "./types";

export interface MealPayload {
  name: string;
  description: string;
  price: number;
  category: Meal["category"];
  active?: number;
  dates: string[];
}

const BASE = "/api";

export async function getMeals(date?: string): Promise<Meal[]> {
  const q = date ? `?date=${date}` : "";
  const res = await fetch(`${BASE}/meals${q}`);
  return res.json();
}

export async function getAllMeals(): Promise<Meal[]> {
  const res = await fetch(`${BASE}/meals/all`);
  return res.json();
}

export async function getMeal(id: number): Promise<Meal & { dates: string[] }> {
  const res = await fetch(`${BASE}/meals/${id}`);
  return res.json();
}

export async function createMeal(data: MealPayload): Promise<{ id: number }> {
  const res = await fetch(`${BASE}/meals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateMeal(id: number, data: MealPayload): Promise<void> {
  await fetch(`${BASE}/meals/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function copyMeal(id: number): Promise<{ id: number }> {
  const res = await fetch(`${BASE}/meals/${id}/copy`, { method: "POST" });
  return res.json();
}

export async function deleteMeal(id: number): Promise<void> {
  await fetch(`${BASE}/meals/${id}`, { method: "DELETE" });
}

export async function placeOrder(data: {
  customer_name: string;
  user_id?: number;
  items: { meal_id: number; quantity: number }[];
}): Promise<{ id: number; total: number }> {
  const res = await fetch(`${BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getOrders(userId?: number): Promise<Order[]> {
  const q = userId ? `?user_id=${userId}` : "";
  const res = await fetch(`${BASE}/orders${q}`);
  return res.json();
}

export async function loginByQr(token: string): Promise<User | null> {
  const res = await fetch(`${BASE}/auth/qr/${token}`);
  if (!res.ok) return null;
  return res.json();
}

export async function loginByPassword(username: string, password: string): Promise<User | null> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${BASE}/users`);
  return res.json();
}

export async function createUser(data: { firstname: string; lastname: string; role: string }): Promise<{ id: number; qr_token: string }> {
  const res = await fetch(`${BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateUser(id: number, data: { firstname: string; lastname: string; role: string }): Promise<void> {
  await fetch(`${BASE}/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: number): Promise<void> {
  await fetch(`${BASE}/users/${id}`, { method: "DELETE" });
}
