export interface Meal {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  active: number;
  dates: string;
}

export interface Menu {
  id: number;
  name: string;
  description: string;
  price: number;
  active: number;
  dates: string;
  created_at?: string;
}

export interface CartItem {
  menu: Menu;
  quantity: number;
}

export interface User {
  id: number;
  firstname: string;
  lastname: string;
  role: "admin" | "manager" | "user";
  qr_token: string;
  created_at?: string;
}

export interface Order {
  id: number;
  user_id: number | null;
  user_fullname: string | null;
  user_role: string | null;
  customer_name: string;
  order_date: string;
  total: number;
  items: string;
  created_at: string;
}
