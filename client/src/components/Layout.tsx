import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  user: "Benutzer",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-200 text-red-800",
  manager: "bg-blue-200 text-blue-800",
  user: "bg-gray-200 text-gray-700",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  const canAccessAdmin = user?.role === "admin" || user?.role === "manager";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-orange-600 text-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold tracking-tight">
            🍽 Foodbook
          </Link>
          <div className="flex items-center gap-4">
            <nav className="flex gap-2">
              <Link
                to="/"
                className={`px-3 py-1 rounded font-medium transition ${
                  pathname === "/" ? "bg-white text-orange-600" : "hover:bg-orange-500"
                }`}
              >
                Speisekarte
              </Link>
              {canAccessAdmin && (
                <Link
                  to="/admin"
                  className={`px-3 py-1 rounded font-medium transition ${
                    pathname === "/admin" ? "bg-white text-orange-600" : "hover:bg-orange-500"
                  }`}
                >
                  Administration
                </Link>
              )}
            </nav>
            {user ? (
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ROLE_COLORS[user.role]}`}>
                  {ROLE_LABELS[user.role]}
                </span>
                <span className="text-sm font-medium">{user.firstname} {user.lastname}</span>
                <button
                  onClick={logout}
                  className="text-xs px-2 py-1 bg-orange-700 hover:bg-orange-800 rounded transition"
                >
                  Abmelden
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-sm px-3 py-1 bg-white text-orange-600 font-semibold rounded hover:bg-orange-50 transition"
              >
                Anmelden
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">{children}</main>
      <footer className="text-center text-gray-400 text-sm py-4">
        © {new Date().getFullYear()} Foodbook
      </footer>
    </div>
  );
}
