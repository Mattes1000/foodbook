import type { CartItem, Meal } from "../types";

interface Props {
  meal: Meal;
  cartItem?: CartItem;
  onAdd: (meal: Meal) => void;
  onRemove: (meal: Meal) => void;
}

export default function MealCard({ meal, cartItem, onAdd, onRemove }: Props) {
  const qty = cartItem?.quantity ?? 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-2 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-800">{meal.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{meal.description}</p>
        </div>
        <span className="text-orange-600 font-bold whitespace-nowrap">
          {meal.price.toFixed(2)} €
        </span>
      </div>
      <div className="flex items-center gap-2 mt-auto pt-2">
        {qty > 0 ? (
          <>
            <button
              onClick={() => onRemove(meal)}
              className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold text-lg hover:bg-orange-200 transition"
            >
              −
            </button>
            <span className="font-semibold w-6 text-center">{qty}</span>
          </>
        ) : null}
        <button
          onClick={() => onAdd(meal)}
          className="ml-auto px-4 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
        >
          + Bestellen
        </button>
      </div>
    </div>
  );
}
