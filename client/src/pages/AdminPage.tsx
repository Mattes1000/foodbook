import { useState, useEffect } from "react";
import { getAllMeals, getMeal, createMeal, updateMeal, deleteMeal, copyMeal } from "../api";
import type { MealPayload } from "../api";
import type { Meal } from "../types";
import UsersTab from "./admin/UsersTab";
import OrdersTab from "./admin/OrdersTab";
import { useAuth } from "../context/AuthContext";

const CATEGORY_LABELS: Record<string, string> = {
  starter: "Vorspeise",
  main: "Hauptgang",
  dessert: "Nachtisch",
};

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  category: "main" as Meal["category"],
  active: 1,
  dates: [] as string[],
};

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function getNextDays(n: number): string[] {
  const today = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return toDateStr(d);
  });
}

type Tab = "meals" | "users" | "orders";

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("meals");
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [toast, setToast] = useState<string | null>(null);

  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="bg-white rounded-xl shadow p-10 text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Kein Zugriff</h2>
          <p className="text-gray-500 text-sm">Du benötigst die Rolle Manager oder Admin, um diese Seite aufzurufen.</p>
        </div>
      </div>
    );
  }

  const suggestedDates = getNextDays(7);

  const load = () => {
    setLoading(true);
    getAllMeals()
      .then(setMeals)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const openNew = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
  };

  const openEdit = async (id: number) => {
    const meal = await getMeal(id);
    setEditId(id);
    setForm({
      name: meal.name,
      description: meal.description ?? "",
      price: String(meal.price),
      category: meal.category,
      active: meal.active,
      dates: meal.dates ?? [],
    });
  };

  const toggleDate = (date: string) => {
    setForm((f) => ({
      ...f,
      dates: f.dates.includes(date) ? f.dates.filter((d) => d !== date) : [...f.dates, date],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) return;
    setSaving(true);
    const payload: MealPayload = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      category: form.category,
      active: form.active,
      dates: form.dates,
    };
    try {
      if (editId !== null) {
        await updateMeal(editId, payload);
        showToast("Speise gespeichert.");
      } else {
        await createMeal(payload);
        showToast("Speise erstellt.");
      }
      setForm({ ...EMPTY_FORM });
      setEditId(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" wirklich deaktivieren?`)) return;
    await deleteMeal(id);
    showToast("Speise deaktiviert.");
    load();
  };

  const handleCopy = async (id: number) => {
    await copyMeal(id);
    showToast("Speise kopiert.");
    load();
  };

  const filtered = filterCat === "all" ? meals : meals.filter((m) => m.category === filterCat);
  const isEditing = editId !== null || form.name !== "";

  const tabs: { id: Tab; label: string; visible: boolean }[] = [
    { id: "meals",  label: "🍽 Speisen",      visible: true },
    { id: "users",  label: "👤 Benutzer",     visible: user.role === "admin" },
    { id: "orders", label: "📋 Bestellungen", visible: true },
  ];

  return (
    <div>
      {/* Tab navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-0">
        {tabs.filter((t) => t.visible).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition -mb-px border-b-2 ${
              activeTab === t.id
                ? "border-orange-500 text-orange-600 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "users" && user.role === "admin" && <UsersTab />}
      {activeTab === "orders" && <OrdersTab />}

      {activeTab === "meals" && (
      <div className="flex gap-6">
      {/* Table */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Speisen</h1>
          <button
            onClick={openNew}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition text-sm"
          >
            + Neue Speise
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {["all", "starter", "main", "dessert"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                filterCat === cat
                  ? "bg-orange-500 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-orange-50"
              }`}
            >
              {cat === "all" ? "Alle" : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-gray-400">Lade Speisen…</p>
        ) : (
          <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Kategorie</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Preis</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((meal) => (
                  <tr key={meal.id} className="hover:bg-orange-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{meal.name}</div>
                      <div className="text-xs text-gray-400 truncate max-w-xs">{meal.description}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{CATEGORY_LABELS[meal.category]}</td>
                    <td className="px-4 py-3 text-right font-medium text-orange-600">
                      {meal.price.toFixed(2)} €
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          meal.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {meal.active ? "Aktiv" : "Inaktiv"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => openEdit(meal.id)}
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleCopy(meal.id)}
                          className="px-2 py-1 text-xs bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition"
                        >
                          Kopieren
                        </button>
                        <button
                          onClick={() => handleDelete(meal.id, meal.name)}
                          className="px-2 py-1 text-xs bg-red-50 text-red-500 rounded hover:bg-red-100 transition"
                        >
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                      Keine Speisen gefunden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form panel */}
      <div className="w-80 shrink-0">
        <div className="sticky top-6 bg-white rounded-xl shadow border border-gray-100 p-5">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            {editId !== null ? "Speise bearbeiten" : "Neue Speise"}
          </h2>

          <label className="block text-sm text-gray-600 mb-1">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-300"
            placeholder="z.B. Tomatensuppe"
          />

          <label className="block text-sm text-gray-600 mb-1">Beschreibung</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
            placeholder="Kurze Beschreibung…"
          />

          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Preis (€)</label>
              <input
                type="number"
                step="0.10"
                min="0"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                placeholder="0.00"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Kategorie</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Meal["category"] }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="starter">Vorspeise</option>
                <option value="main">Hauptgang</option>
                <option value="dessert">Nachtisch</option>
              </select>
            </div>
          </div>

          <label className="block text-sm text-gray-600 mb-1">Status</label>
          <select
            value={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: parseInt(e.target.value) }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value={1}>Aktiv</option>
            <option value={0}>Inaktiv</option>
          </select>

          <label className="block text-sm text-gray-600 mb-2">Verfügbar an</label>
          <div className="flex flex-col gap-1 mb-4 max-h-48 overflow-y-auto pr-1">
            {suggestedDates.map((d) => (
              <label key={d} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.dates.includes(d)}
                  onChange={() => toggleDate(d)}
                  className="accent-orange-500"
                />
                <span className="text-gray-700">
                  {new Date(d).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })}
                </span>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-40 text-sm"
            >
              {saving ? "Speichere…" : editId !== null ? "Speichern" : "Erstellen"}
            </button>
            {isEditing && (
              <button
                onClick={() => { setForm({ ...EMPTY_FORM }); setEditId(null); }}
                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition text-sm"
              >
                Abbrechen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}
    </div>
      )}
    </div>
  );
}
