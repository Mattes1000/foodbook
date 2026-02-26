import { useState, useEffect } from "react";
import { getOrders } from "../../api";
import type { Order } from "../../types";
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
  Chip,
  CircularProgress,
  Button,
} from "@mui/material";
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/de";

const ROLE_COLORS: Record<string, "error" | "info" | "default"> = {
  admin: "error",
  manager: "info",
  user: "default",
};

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"id" | "user" | "date" | "total">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterDate, setFilterDate] = useState<Dayjs | null>(null);

  useEffect(() => {
    getOrders().then(setOrders).finally(() => setLoading(false));
  }, []);

  const handleSort = (column: "id" | "user" | "date" | "total") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const filteredOrders = filterDate
    ? orders.filter((o) => {
        const orderDate = dayjs(o.order_date).format('YYYY-MM-DD');
        const selectedDate = filterDate.format('YYYY-MM-DD');
        return orderDate === selectedDate;
      })
    : orders;

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "id") {
      comparison = a.id - b.id;
    } else if (sortBy === "user") {
      const nameA = (a.user_fullname ?? a.customer_name).toLowerCase();
      const nameB = (b.user_fullname ?? b.customer_name).toLowerCase();
      comparison = nameA.localeCompare(nameB);
    } else if (sortBy === "date") {
      comparison = new Date(a.order_date).getTime() - new Date(b.order_date).getTime();
    } else if (sortBy === "total") {
      comparison = a.total - b.total;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h2">
          Bestellungen
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Filtern nach Datum:
            </Typography>
            <DatePicker
              value={filterDate}
              onChange={(newValue) => setFilterDate(newValue)}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { width: 200 }
                }
              }}
              format="DD.MM.YYYY"
            />
            {filterDate && (
              <Button
                size="small"
                onClick={() => setFilterDate(null)}
                variant="outlined"
              >
                Filter zurücksetzen
              </Button>
            )}
          </Box>
        </LocalizationProvider>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : orders.length === 0 ? (
        <Typography color="text.secondary">
          Noch keine Bestellungen vorhanden.
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell 
                  onClick={() => handleSort("id")}
                  sx={{ cursor: "pointer", userSelect: "none" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    #
                    {sortBy === "id" && (
                      sortOrder === "asc" ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  onClick={() => handleSort("user")}
                  sx={{ cursor: "pointer", userSelect: "none" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    Benutzer
                    {sortBy === "user" && (
                      sortOrder === "asc" ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>Speisen</TableCell>
                <TableCell 
                  onClick={() => handleSort("date")}
                  sx={{ cursor: "pointer", userSelect: "none" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    Datum
                    {sortBy === "date" && (
                      sortOrder === "asc" ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  align="right"
                  onClick={() => handleSort("total")}
                  sx={{ cursor: "pointer", userSelect: "none" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                    Gesamt
                    {sortBy === "total" && (
                      sortOrder === "asc" ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedOrders.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      #{o.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {o.user_fullname ?? o.customer_name}
                    </Typography>
                    {o.user_role && (
                      <Chip
                        label={o.user_role}
                        color={ROLE_COLORS[o.user_role]}
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        maxWidth: 300,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {o.items ?? "–"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(o.order_date).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>
                      {o.total.toFixed(2)} €
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
