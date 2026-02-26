import { useState, useEffect } from "react";
import { getAllMenus, getMenu, createMenu, updateMenu, deleteMenu, copyMenu } from "../../api";
import type { MenuPayload } from "../../api";
import type { Menu } from "../../types";
import {
  Box,
  Typography,
  Button,
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
} from "@mui/material";
import { ContentCopy, Delete, Edit as EditIcon, ArrowUpward, ArrowDownward } from "@mui/icons-material";

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

export default function MenusTab() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "price" | "status">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const suggestedDates = getNextDays(7);

  const load = () => {
    setLoading(true);
    getAllMenus()
      .then((menusData) => {
        setMenus(menusData);
      })
      .finally(() => setLoading(false));
  };

  const handleSort = (column: "name" | "price" | "status") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const sortedMenus = [...menus].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "name") {
      comparison = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    } else if (sortBy === "price") {
      comparison = a.price - b.price;
    } else if (sortBy === "status") {
      comparison = (a.active ? 1 : 0) - (b.active ? 1 : 0);
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  useEffect(() => {
    load();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const openNew = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
  };

  const openEdit = async (id: number) => {
    const menu = await getMenu(id);
    setEditId(id);
    setForm({
      name: menu.name,
      description: menu.description || "",
      price: menu.price.toString(),
      active: menu.active,
      dates: menu.dates || [],
    });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) {
      showToast("Bitte alle Pflichtfelder ausfüllen.");
      return;
    }

    setSaving(true);
    try {
      const payload: MenuPayload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        active: form.active,
        dates: form.dates,
      };

      if (editId !== null) {
        await updateMenu(editId, payload);
        showToast("Menü gespeichert.");
      } else {
        await createMenu(payload);
        showToast("Menü erstellt.");
      }

      setForm({ ...EMPTY_FORM });
      setEditId(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async (id: number) => {
    await copyMenu(id);
    showToast("Menü kopiert.");
    load();
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" wirklich löschen?`)) return;
    await deleteMenu(id);
    showToast("Menü gelöscht.");
    load();
  };

  const toggleDate = (date: string) => {
    setForm((prev) => ({
      ...prev,
      dates: prev.dates.includes(date)
        ? prev.dates.filter((d) => d !== date)
        : [...prev.dates, date],
    }));
  };

  const isEditing = editId !== null || form.name !== "";

  return (
    <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", md: "row" } }}>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h2">Menüs</Typography>
          <Button variant="contained" onClick={openNew} startIcon={<EditIcon />}>
            Neues Menü
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
                  <TableCell 
                    onClick={() => handleSort("name")}
                    sx={{ cursor: "pointer", userSelect: "none" }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      Name
                      {sortBy === "name" && (
                        sortOrder === "asc" ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>Speisen</TableCell>
                  <TableCell 
                    align="right"
                    onClick={() => handleSort("price")}
                    sx={{ cursor: "pointer", userSelect: "none" }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                      Preis
                      {sortBy === "price" && (
                        sortOrder === "asc" ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell 
                    onClick={() => handleSort("status")}
                    sx={{ cursor: "pointer", userSelect: "none" }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      Status
                      {sortBy === "status" && (
                        sortOrder === "asc" ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedMenus.map((menu) => (
                  <TableRow key={menu.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {menu.name}
                      </Typography>
                      {menu.description && (
                        <Typography variant="caption" color="text.secondary">
                          {menu.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {menu.description || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>
                        {menu.price.toFixed(2)} €
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={menu.active ? "Aktiv" : "Inaktiv"}
                        color={menu.active ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                        <IconButton size="small" color="primary" onClick={() => openEdit(menu.id)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="warning" onClick={() => handleCopy(menu.id)}>
                          <ContentCopy fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(menu.id, menu.name)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {menus.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary">Keine Menüs vorhanden.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Box sx={{ width: { xs: "100%", md: 380 }, flexShrink: 0 }}>
        <Card sx={{ position: { xs: "relative", md: "sticky" }, top: 24 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
              {editId !== null ? "Menü bearbeiten" : "Neues Menü"}
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="z.B. Tagesmenü"
              />

              <TextField
                fullWidth
                size="small"
                label="Beschreibung"
                multiline
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Beschreibe das Menü..."
              />

              <TextField
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
