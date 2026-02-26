import type { Menu, Order, User } from "./types";

const BASE = "/api";

// Menu API
export async function getMenus(date?: string): Promise<Menu[]> {
  const q = date ? `?date=${date}` : "";
  const res = await fetch(`${BASE}/menus${q}`);
  return res.json();
}

export async function getAllMenus(): Promise<Menu[]> {
  const res = await fetch(`${BASE}/menus/all`);
  return res.json();
}

export async function getMenu(id: number): Promise<Menu & { dates: string[] }> {
  const res = await fetch(`${BASE}/menus/${id}`);
  return res.json();
}

export interface MenuPayload {
  name: string;
  description: string;
  price: number;
  active?: number;
  dates: string[];
}

export async function createMenu(data: MenuPayload): Promise<{ id: number }> {
  const res = await fetch(`${BASE}/menus`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateMenu(id: number, data: MenuPayload): Promise<void> {
  await fetch(`${BASE}/menus/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function copyMenu(id: number): Promise<{ id: number }> {
  const res = await fetch(`${BASE}/menus/${id}/copy`, { method: "POST" });
  return res.json();
}

export async function deleteMenu(id: number): Promise<void> {
  await fetch(`${BASE}/menus/${id}`, { method: "DELETE" });
}

export async function checkOrderForDate(userId: number, date: string): Promise<{ hasOrder: boolean; menuId: number | null }> {
  const res = await fetch(`${BASE}/orders/check?user_id=${userId}&date=${date}`);
  return res.json();
}

export async function placeOrder(data: {
  customer_name: string;
  user_id?: number;
  order_date?: string;
  menu_id: number;
  quantity?: number;
}): Promise<{ id: number; total: number } | { error: string }> {
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

export async function deleteOrder(userId: number, date: string): Promise<{ success: boolean } | { error: string }> {
  const res = await fetch(`${BASE}/orders?user_id=${userId}&date=${date}`, {
    method: "DELETE",
  });
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

export async function regenerateQrToken(id: number): Promise<{ qr_token: string }> {
  const res = await fetch(`${BASE}/users/${id}/regenerate-qr`, {
    method: "POST",
  });
  return res.json();
}
