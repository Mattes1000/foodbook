import { useState, useEffect } from "react";
import { getOrders } from "../../api";
import type { Order } from "../../types";

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrders().then(setOrders).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Bestellungen</h2>
      {loading ? (
        <p className="text-gray-400">Lade Bestellungen…</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">Noch keine Bestellungen vorhanden.</p>
      ) : (
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Benutzer</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Speisen</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Datum</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Gesamt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-orange-50 transition">
                  <td className="px-4 py-3 text-gray-500">#{o.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">
                      {o.user_fullname ?? o.customer_name}
                    </div>
                    {o.user_role && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        o.user_role === "admin" ? "bg-red-100 text-red-600" :
                        o.user_role === "manager" ? "bg-blue-100 text-blue-600" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {o.user_role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{o.items ?? "–"}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(o.created_at).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-orange-600">
                    {o.total.toFixed(2)} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
