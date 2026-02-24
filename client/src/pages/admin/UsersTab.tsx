import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { getUsers, createUser, updateUser, deleteUser } from "../../api";
import type { User } from "../../types";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  user: "Benutzer",
};

const EMPTY_FORM = { firstname: "", lastname: "", role: "user" };

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [qrModal, setQrModal] = useState<User | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const load = () => {
    setLoading(true);
    getUsers().then(setUsers).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (qrModal && qrCanvasRef.current) {
      const loginUrl = `${window.location.origin}/login/${qrModal.qr_token}`;
      QRCode.toCanvas(qrCanvasRef.current, loginUrl, { width: 240, margin: 2 });
    }
  }, [qrModal]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const openEdit = (u: User) => {
    setEditId(u.id);
    setForm({ firstname: u.firstname, lastname: u.lastname, role: u.role });
  };

  const resetForm = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleSave = async () => {
    if (!form.firstname.trim() || !form.lastname.trim()) return;
    setSaving(true);
    try {
      if (editId !== null) {
        await updateUser(editId, form);
        showToast("Benutzer gespeichert.");
      } else {
        const result = await createUser(form);
        showToast(`Benutzer erstellt. QR-Token: ${result.qr_token}`);
      }
      resetForm();
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`"${u.firstname} ${u.lastname}" wirklich löschen?`)) return;
    await deleteUser(u.id);
    showToast("Benutzer gelöscht.");
    load();
  };

  return (
    <div className="flex gap-6">
      {/* Table */}
      <div className="flex-1 min-w-0">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Benutzerverwaltung</h2>
        {loading ? (
          <p className="text-gray-400">Lade Benutzer…</p>
        ) : (
          <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Rolle</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-orange-50 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{u.firstname} {u.lastname}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === "admin" ? "bg-red-100 text-red-600" :
                        u.role === "manager" ? "bg-blue-100 text-blue-600" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => setQrModal(u)}
                          className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100 transition"
                        >
                          QR-Code
                        </button>
                        <button
                          onClick={() => openEdit(u)}
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="px-2 py-1 text-xs bg-red-50 text-red-500 rounded hover:bg-red-100 transition"
                        >
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                      Keine Benutzer vorhanden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="w-72 shrink-0">
        <div className="sticky top-6 bg-white rounded-xl shadow border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">
            {editId !== null ? "Benutzer bearbeiten" : "Neuer Benutzer"}
          </h3>

          <label className="block text-sm text-gray-600 mb-1">Vorname</label>
          <input
            value={form.firstname}
            onChange={(e) => setForm((f) => ({ ...f, firstname: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-300"
            placeholder="z.B. Maria"
          />

          <label className="block text-sm text-gray-600 mb-1">Nachname</label>
          <input
            value={form.lastname}
            onChange={(e) => setForm((f) => ({ ...f, lastname: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-300"
            placeholder="z.B. Müller"
          />

          <label className="block text-sm text-gray-600 mb-1">Rolle</label>
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="user">Benutzer</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.firstname.trim() || !form.lastname.trim()}
              className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition disabled:opacity-40 text-sm"
            >
              {saving ? "Speichere…" : editId !== null ? "Speichern" : "Erstellen"}
            </button>
            {editId !== null && (
              <button
                onClick={resetForm}
                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition text-sm"
              >
                Abbrechen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QR Modal */}
      {qrModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setQrModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4 max-w-xs w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800">
              {qrModal.firstname} {qrModal.lastname}
            </h3>
            <p className="text-xs text-gray-500 text-center">
              QR-Code scannen zum Anmelden
            </p>
            <canvas ref={qrCanvasRef} className="rounded-lg" />
            <p className="text-xs text-gray-400 break-all text-center font-mono">
              /login/{qrModal.qr_token}
            </p>
            <button
              onClick={() => setQrModal(null)}
              className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}
