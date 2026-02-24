export interface Meal {
  id: number;
  name: string;
  description: string;
  price: number;
  category: "starter" | "main" | "dessert";
  image_url: string | null;
  active: number;
  dates: string;
}

export interface CartItem {
  meal: Meal;
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
