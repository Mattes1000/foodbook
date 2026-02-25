import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { getUsers, createUser, updateUser, deleteUser } from "../../api";
import type { User } from "../../types";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardContent,
  IconButton,
} from "@mui/material";
import { QrCode2, Edit, Delete } from "@mui/icons-material";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  user: "Benutzer",
};

const ROLE_COLORS: Record<string, "error" | "info" | "default"> = {
  admin: "error",
  manager: "info",
  user: "default",
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
    <Box sx={{ display: "flex", gap: 3 }}>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="h2" sx={{ mb: 3 }}>
          Benutzerverwaltung
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Rolle</TableCell>
                  <TableCell align="right">Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {u.firstname} {u.lastname}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ROLE_LABELS[u.role]}
                        color={ROLE_COLORS[u.role]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => setQrModal(u)}
                        >
                          <QrCode2 fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => openEdit(u)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(u)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography color="text.secondary">
                        Keine Benutzer vorhanden.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Box sx={{ width: 320, flexShrink: 0 }}>
        <Card sx={{ position: "sticky", top: 24 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
              {editId !== null ? "Benutzer bearbeiten" : "Neuer Benutzer"}
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Vorname"
                value={form.firstname}
                onChange={(e) => setForm((f) => ({ ...f, firstname: e.target.value }))}
                placeholder="z.B. Maria"
              />

              <TextField
                fullWidth
                size="small"
                label="Nachname"
                value={form.lastname}
                onChange={(e) => setForm((f) => ({ ...f, lastname: e.target.value }))}
                placeholder="z.B. Müller"
              />

              <FormControl fullWidth size="small">
                <InputLabel>Rolle</InputLabel>
                <Select
                  value={form.role}
                  label="Rolle"
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  <MenuItem value="user">Benutzer</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving || !form.firstname.trim() || !form.lastname.trim()}
                >
                  {saving ? "Speichere…" : editId !== null ? "Speichern" : "Erstellen"}
                </Button>
                {editId !== null && (
                  <Button variant="outlined" onClick={resetForm}>
                    Abbrechen
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Dialog open={!!qrModal} onClose={() => setQrModal(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: "center" }}>
          {qrModal?.firstname} {qrModal?.lastname}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <Typography variant="caption" color="text.secondary" textAlign="center">
            QR-Code scannen zum Anmelden
          </Typography>
          <canvas ref={qrCanvasRef} style={{ borderRadius: 8 }} />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontFamily: "monospace", wordBreak: "break-all", textAlign: "center" }}
          >
            /login/{qrModal?.qr_token}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrModal(null)} fullWidth>
            Schließen
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="success" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
}
