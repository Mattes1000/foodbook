import { useState, useEffect } from "react";
import { getAllMeals, getMeal, createMeal, updateMeal, deleteMeal, copyMeal } from "../api";
import type { MealPayload } from "../api";
import type { Meal } from "../types";
import UsersTab from "./admin/UsersTab";
import OrdersTab from "./admin/OrdersTab";
import MenusTab from "./admin/MenusTab";
import { useAuth } from "../context/AuthContext";
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Checkbox,
  FormControlLabel,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { ContentCopy, Delete, Edit as EditIcon, Lock } from "@mui/icons-material";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
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

type Tab = "menus" | "meals" | "users" | "orders";

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("menus");
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
        <Card sx={{ maxWidth: 400, textAlign: "center" }}>
          <CardContent sx={{ p: 5 }}>
            <Lock sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Kein Zugriff
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Du benötigst die Rolle Manager oder Admin, um diese Seite aufzurufen.
            </Typography>
          </CardContent>
        </Card>
      </Box>
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
      ...form,
      name: meal.name,
      description: meal.description || "",
      price: meal.price.toString(),
      active: meal.active,
      dates: meal.dates || [],
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

  const isEditing = editId !== null || form.name !== "";

  const tabs: { id: Tab; label: string; visible: boolean }[] = [
    { id: "menus",  label: "📋 Menüs",        visible: true },
    { id: "meals",  label: "🍽 Speisen",      visible: true },
    { id: "users",  label: "👤 Benutzer",     visible: user.role === "admin" },
    { id: "orders", label: "📦 Bestellungen", visible: true },
  ];

  return (
    <Box>
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
      >
        {tabs.filter((t) => t.visible).map((t) => (
          <Tab key={t.id} label={t.label} value={t.id} />
        ))}
      </Tabs>

      {activeTab === "menus" && <MenusTab />}
      {activeTab === "users" && user.role === "admin" && <UsersTab />}
      {activeTab === "orders" && <OrdersTab />}

      {activeTab === "meals" && (
        <Box sx={{ display: "flex", gap: 3, flexDirection: isMobile ? "column" : "row" }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography variant="h2">Speisen</Typography>
              <Button variant="contained" onClick={openNew} startIcon={<EditIcon />}>
                Neue Speise
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell align="right">Preis</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Aktionen</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {meals.map((meal) => (
                      <TableRow key={meal.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {meal.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>
                            {meal.description}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>
                            {meal.price.toFixed(2)} €
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={meal.active ? "Aktiv" : "Inaktiv"}
                            color={meal.active ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                            <IconButton size="small" color="primary" onClick={() => openEdit(meal.id)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="warning" onClick={() => handleCopy(meal.id)}>
                              <ContentCopy fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDelete(meal.id, meal.name)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                    {meals.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography color="text.secondary">Keine Speisen vorhanden.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          <Box sx={{ width: isMobile ? "100%" : 320, flexShrink: 0 }}>
            <Card sx={{ position: isMobile ? "relative" : "sticky", top: 24 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
                  {editId !== null ? "Speise bearbeiten" : "Neue Speise"}
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="z.B. Tomatensuppe"
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Beschreibung"
                    multiline
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Kurze Beschreibung…"
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label="Preis (€)"
                    type="number"
                    inputProps={{ step: 0.1, min: 0 }}
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="0.00"
                  />

                  <FormControl size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={form.active}
                      label="Status"
                      onChange={(e) => setForm((f) => ({ ...f, active: parseInt(e.target.value as string) }))}
                    >
                      <MenuItem value={1}>Aktiv</MenuItem>
                      <MenuItem value={0}>Inaktiv</MenuItem>
                    </Select>
                  </FormControl>

                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Verfügbar an
                    </Typography>
                    <Box sx={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0.5 }}>
                      {suggestedDates.map((d) => (
                        <FormControlLabel
                          key={d}
                          control={
                            <Checkbox
                              size="small"
                              checked={form.dates.includes(d)}
                              onChange={() => toggleDate(d)}
                            />
                          }
                          label={
                            <Typography variant="body2">
                              {new Date(d).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })}
                            </Typography>
                          }
                        />
                      ))}
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleSave}
                      disabled={saving || !form.name.trim()}
                    >
                      {saving ? "Speichere…" : editId !== null ? "Speichern" : "Erstellen"}
                    </Button>
                    {isEditing && (
                      <Button
                        variant="outlined"
                        onClick={() => { setForm({ ...EMPTY_FORM }); setEditId(null); }}
                      >
                        Abbrechen
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

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
