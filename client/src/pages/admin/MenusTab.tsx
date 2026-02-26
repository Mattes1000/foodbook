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
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { ContentCopy, Delete, Edit as EditIcon, ArrowUpward, ArrowDownward, Add } from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";
import "dayjs/locale/de";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  active: 1,
  dates: [] as string[],
};


export default function MenusTab() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "price" | "status">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

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

  const activeMenus = menus.filter(m => m.active === 1);
  const inactiveMenus = menus.filter(m => m.active === 0);

  const sortMenus = (menuList: Menu[]) => {
    return [...menuList].sort((a, b) => {
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
  };

  const sortedActiveMenus = sortMenus(activeMenus);
  const sortedInactiveMenus = sortMenus(inactiveMenus);

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
    setDialogOpen(true);
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
    setDialogOpen(true);
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
      setDialogOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ ...EMPTY_FORM });
    setEditId(null);
    setDialogOpen(false);
  };

  const handleCopy = async (id: number) => {
    await copyMenu(id);
    showToast("Menü kopiert!");
    load();
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" wirklich löschen?`)) return;
    await deleteMenu(id);
    showToast("Menü gelöscht.");
    load();
  };

  const addDate = () => {
    if (!selectedDate) return;
    const dateStr = selectedDate.format('YYYY-MM-DD');
    if (!form.dates.includes(dateStr)) {
      setForm((prev) => ({
        ...prev,
        dates: [...prev.dates, dateStr].sort(),
      }));
    }
    setSelectedDate(null);
  };

  const removeDate = (date: string) => {
    setForm((prev) => ({
      ...prev,
      dates: prev.dates.filter((d) => d !== date),
    }));
  };

  const renderMenuTable = (menuList: Menu[], title: string) => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        {title}
      </Typography>
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
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {menuList.map((menu) => (
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
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                    {menu.price.toFixed(2).replace('.', ',')}&nbsp;€
                  </Typography>
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
            {menuList.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography color="text.secondary">Keine Menüs vorhanden.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box>
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
          <>
            {renderMenuTable(sortedActiveMenus, "Aktive Menüs")}
            {renderMenuTable(sortedInactiveMenus, "Inaktive Menüs")}
          </>
        )}

      <Dialog
        open={dialogOpen}
        onClose={handleCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editId !== null ? "Menü bearbeiten" : "Neues Menü"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
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
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                  <DatePicker
                    label="Datum hinzufügen"
                    value={selectedDate}
                    onChange={(newValue) => setSelectedDate(newValue)}
                    format="DD.MM.YYYY"
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={addDate}
                    disabled={!selectedDate}
                    startIcon={<Add />}
                    sx={{ minWidth: 120 }}
                  >
                    Hinzufügen
                  </Button>
                </Box>
              </LocalizationProvider>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, maxHeight: 150, overflowY: "auto" }}>
                {form.dates.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Keine Daten ausgewählt
                  </Typography>
                ) : (
                  form.dates.map((d) => (
                    <Chip
                      key={d}
                      label={new Date(d).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}
                      onDelete={() => removeDate(d)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Abbrechen</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
          >
            {saving ? "Speichere…" : editId !== null ? "Speichern" : "Erstellen"}
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
