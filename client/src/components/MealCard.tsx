import type { CartItem, Meal } from "../types";
import { Card, CardContent, Typography, Box, IconButton, Button, Tooltip } from "@mui/material";
import { Add, Remove, Login } from "@mui/icons-material";

interface Props {
  meal: Meal;
  cartItem?: CartItem;
  onAdd: (meal: Meal) => void;
  onRemove: (meal: Meal) => void;
  disabled?: boolean;
}

export default function MealCard({ meal, cartItem, onAdd, onRemove, disabled = false }: Props) {
  const qty = cartItem?.quantity ?? 0;

  return (
    <Card
      elevation={1}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 0.5 }}>
              {meal.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {meal.description}
            </Typography>
          </Box>
          <Typography
            variant="h6"
            color="primary"
            sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
          >
            {meal.price.toFixed(2)} €
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: "auto" }}>
          {qty > 0 && !disabled && (
            <>
              <IconButton
                size="small"
                onClick={() => onRemove(meal)}
                sx={{
                  bgcolor: "primary.light",
                  color: "white",
                  "&:hover": { bgcolor: "primary.main" },
                }}
              >
                <Remove />
              </IconButton>
              <Typography sx={{ fontWeight: 600, minWidth: 24, textAlign: "center" }}>
                {qty}
              </Typography>
            </>
          )}
          {disabled ? (
            <Tooltip title="Bitte anmelden, um zu bestellen">
              <span style={{ marginLeft: "auto" }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Login />}
                  disabled
                  sx={{ ml: "auto" }}
                >
                  Anmelden
                </Button>
              </span>
            </Tooltip>
          ) : (
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={() => onAdd(meal)}
              sx={{ ml: "auto" }}
            >
              Bestellen
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
