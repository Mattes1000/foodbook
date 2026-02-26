import { useState } from "react";
import UsersTab from "./admin/UsersTab";
import OrdersTab from "./admin/OrdersTab";
import MenusTab from "./admin/MenusTab";
import { useAuth } from "../context/AuthContext";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
} from "@mui/material";
import { Lock } from "@mui/icons-material";

type Tab = "menus" | "users" | "orders";

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("menus");

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

  const tabs: { id: Tab; label: string; visible: boolean }[] = [
    { id: "menus",  label: "📋 Menüs",        visible: true },
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
    </Box>
  );
}
