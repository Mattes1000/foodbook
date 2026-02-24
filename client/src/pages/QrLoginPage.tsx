import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { loginByQr } from "../api";
import { useAuth } from "../context/AuthContext";

export default function QrLoginPage() {
  const { token } = useParams<{ token: string }>();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) { setError(true); return; }
    loginByQr(token).then((user) => {
      if (user) {
        login(user);
        navigate("/", { replace: true });
      } else {
        setError(true);
      }
    });
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Ungültiger QR-Code</h1>
          <p className="text-gray-500 text-sm">Dieser QR-Code wurde nicht gefunden.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow p-8 text-center">
        <div className="text-5xl mb-4 animate-spin">⏳</div>
        <p className="text-gray-600">Anmeldung läuft…</p>
      </div>
    </div>
  );
}
