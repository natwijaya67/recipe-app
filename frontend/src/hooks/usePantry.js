import { useState, useEffect } from "react";

export function usePantry() {
  const [pantryItems, setPantryItems] = useState(() => {
    return JSON.parse(localStorage.getItem("pantry") || "[]");
  });

  useEffect(() => {
    localStorage.setItem("pantry", JSON.stringify(pantryItems));
  }, [pantryItems]);

  return { pantryItems, setPantryItems };
}
