import { useState, useEffect } from "react";
import { getMeals, placeOrder } from "../api";
import type { CartItem, Meal } from "../types";
import MealCard from "../components/MealCard";
import { useAuth } from "../context/AuthContext";

const CATEGORY_LABELS: Record<string, string> = {
  starter: "🥗 Vorspeisen",
  main: "🍽 Hauptgänge",
  dessert: "🍰 Nachtische",
};
const CATEGORY_ORDER = ["starter", "main", "dessert"];

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" });
}

export default function MenuPage() {
  const { user } = useAuth();
  const today = new Date();
  const dates = [0, 1, 2].map((o) => { const d = new Date(today); d.setDate(today.getDate() + o); return toDateStr(d); });

  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) setCustomerName(`${user.firstname} ${user.lastname}`);
  }, [user]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getMeals(selectedDate)
      .then(setMeals)
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const addToCart = (meal: Meal) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.meal.id === meal.id);
      if (existing) return prev.map((i) => i.meal.id === meal.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { meal, quantity: 1 }];
    });
  };

  const removeFromCart = (meal: Meal) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.meal.id === meal.id);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((i) => i.meal.id !== meal.id);
      return prev.map((i) => i.meal.id === meal.id ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.meal.price * i.quantity, 0);

  const handleOrder = async () => {
    if (!customerName.trim()) { setError("Bitte gib deinen Namen ein."); return; }
    if (!cart.length) { setError("Bitte wähle mindestens eine Speise."); return; }
    setError(null);
    try {
      const result = await placeOrder({
        customer_name: customerName,
        user_id: user?.id,
        items: cart.map((i) => ({ meal_id: i.meal.id, quantity: i.quantity })),
      });
      setSuccess(`Bestellung #${result.id} wurde aufgegeben! Gesamt: ${result.total.toFixed(2)} €`);
      setCart([]);
      if (user) setCustomerName(`${user.firstname} ${user.lastname}`);
      else setCustomerName("");
    } catch {
      setError("Fehler beim Bestellen. Bitte versuche es erneut.");
    }
  };

  const byCategory = CATEGORY_ORDER.reduce<Record<string, Meal[]>>((acc, cat) => {
    acc[cat] = meals.filter((m) => m.category === cat);
    return acc;
  }, {});

  return (
    <div className="flex gap-6">
      {/* Menu */}
      <div className="flex-1 min-w-0">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Speisekarte</h1>

        {/* Date selector */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {dates.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                d === selectedDate
                  ? "bg-orange-500 text-white shadow"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-orange-50"
              }`}
            >
              {formatDate(d)}
            </button>
          ))}
        </div>

        {loading && <p className="text-gray-400">Lade Speisen…</p>}

        {!loading && meals.length === 0 && (
          <p className="text-gray-500">Keine Speisen für diesen Tag verfügbar.</p>
        )}

        {!loading && CATEGORY_ORDER.map((cat) => {
          const catMeals = byCategory[cat];
          if (!catMeals?.length) return null;
          return (
            <section key={cat} className="mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-3">{CATEGORY_LABELS[cat]}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {catMeals.map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    cartItem={cart.find((i) => i.meal.id === meal.id)}
                    onAdd={addToCart}
                    onRemove={removeFromCart}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Cart sidebar */}
      <div className="w-72 shrink-0">
        <div className="sticky top-6 bg-white rounded-xl shadow border border-gray-100 p-5">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🛒 Warenkorb</h2>

          {cart.length === 0 ? (
            <p className="text-sm text-gray-400">Noch nichts ausgewählt.</p>
          ) : (
            <ul className="divide-y divide-gray-100 mb-4">
              {cart.map((item) => (
                <li key={item.meal.id} className="py-2 flex justify-between text-sm">
                  <span className="text-gray-700">{item.meal.name} ×{item.quantity}</span>
                  <span className="font-medium text-gray-800">
                    {(item.meal.price * item.quantity).toFixed(2)} €
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-between font-bold text-gray-800 mb-4">
            <span>Gesamt</span>
            <span>{cartTotal.toFixed(2)} €</span>
          </div>

          <input
            type="text"
            placeholder="Dein Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />

          {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
          {success && <p className="text-green-600 text-xs mb-2">{success}</p>}

          <button
            onClick={handleOrder}
            disabled={!cart.length}
            className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Jetzt bestellen
          </button>
        </div>
      </div>
    </div>
  );
}
