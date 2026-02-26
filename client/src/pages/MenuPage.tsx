import { useState, useEffect } from "react";
import { getMenus, placeOrder, checkOrderForDate, deleteOrder, getAvailableDates } from "../api";
import type { Menu } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
} from "@mui/material";
import { CheckCircle, Login, Delete } from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/de";
import { Link } from "react-router-dom";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" });
}

export default function MenuPage() {
  const { user } = useAuth();
  const today = dayjs();

  const [selectedDate, setSelectedDate] = useState<Dayjs>(today);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasOrder, setHasOrder] = useState(false);
  const [orderedMenuId, setOrderedMenuId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    getAvailableDates().then(setAvailableDates);
  }, []);

  useEffect(() => {
    setLoading(true);
    const dateStr = selectedDate.format('YYYY-MM-DD');
    getMenus(dateStr)
      .then(setMenus)
      .finally(() => setLoading(false));
  }, [selectedDate]);

  useEffect(() => {
    if (user) {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      checkOrderForDate(user.id, dateStr).then((res) => {
        setHasOrder(res.hasOrder);
        setOrderedMenuId(res.menuId);
      });
    } else {
      setHasOrder(false);
      setOrderedMenuId(null);
    }
    setError(null);
    setSuccess(null);
  }, [user, selectedDate]);

  const handleOrder = async (menu: Menu) => {
    if (!user) {
      setError("Bitte melde dich an, um zu bestellen.");
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const result = await placeOrder({
        customer_name: `${user.firstname} ${user.lastname}`,
        user_id: user.id,
        order_date: dateStr,
        menu_id: menu.id,
        quantity: 1,
      });

      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(`Bestellung erfolgreich! ${menu.name} für ${formatDate(dateStr)}`);
        setHasOrder(true);
        setOrderedMenuId(menu.id);
      }
    } catch (err) {
      setError("Fehler beim Bestellen. Bitte versuche es erneut.");
    }
  };

  const handleCancelOrder = async (event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!user) return;

    setError(null);
    setSuccess(null);

    try {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const result = await deleteOrder(user.id, dateStr);

      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess("Bestellung erfolgreich storniert.");
        setHasOrder(false);
        setOrderedMenuId(null);
      }
    } catch (err) {
      setError("Fehler beim Stornieren. Bitte versuche es erneut.");
    }
  };

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 2 }}>
        Speisekarte
      </Typography>

      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
        <Box sx={{ mb: 4 }}>
          <DatePicker
            label="Datum wählen"
            value={selectedDate}
            onChange={(newValue) => newValue && setSelectedDate(newValue)}
            shouldDisableDate={(date) => {
              const dateStr = date.format('YYYY-MM-DD');
              const isBeforeToday = date.isBefore(today, 'day');
              const isAvailable = availableDates.includes(dateStr);
              return isBeforeToday || !isAvailable;
            }}
            slotProps={{
              textField: {
                fullWidth: true,
                sx: { maxWidth: 400 }
              }
            }}
            format="dddd, DD. MMMM YYYY"
          />
        </Box>
      </LocalizationProvider>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && menus.length === 0 && (
        <Typography color="text.secondary">
          Keine Menüs für diesen Tag verfügbar.
        </Typography>
      )}

      {!loading && (
        <Grid container spacing={3}>
          {menus.map((menu) => {
            const isOrdered = orderedMenuId === menu.id;
            
            return (
              <Grid item xs={12} sm={6} md={4} key={menu.id}>
                <Card
                  elevation={2}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.2s",
                    border: isOrdered ? 2 : 0,
                    borderColor: isOrdered ? "success.main" : "transparent",
                    "&:hover": {
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {menu.name}
                      </Typography>
                      {isOrdered && (
                        <Chip
                          icon={<CheckCircle />}
                          label="Bestellt"
                          color="success"
                          size="small"
                          onDelete={handleCancelOrder}
                          deleteIcon={
                            <IconButton
                              size="small"
                              sx={{ 
                                padding: 0,
                                "&:hover": { color: "error.main" }
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          }
                        />
                      )}
                    </Box>
                    
                    {menu.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: "pre-line" }}>
                        {menu.description}
                      </Typography>
                    )}

                    <Box sx={{ mt: "auto", pt: 2, borderTop: 1, borderColor: "divider" }}>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 700, mb: 2, whiteSpace: "nowrap" }}>
                        {menu.price.toFixed(2).replace('.', ',')}&nbsp;€
                      </Typography>
                      
                      {!user ? (
                        <Button
                          fullWidth
                          variant="outlined"
                          component={Link}
                          to="/login"
                          startIcon={<Login />}
                        >
                          Anmelden zum Bestellen
                        </Button>
                      ) : isOrdered ? (
                        <Button
                          fullWidth
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle />}
                          disabled
                        >
                          Bereits bestellt
                        </Button>
                      ) : hasOrder ? (
                        <Button
                          fullWidth
                          variant="outlined"
                          disabled
                        >
                          Bereits für heute bestellt
                        </Button>
                      ) : (
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={() => handleOrder(menu)}
                        >
                          Jetzt bestellen
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
