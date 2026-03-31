import { useState, useEffect } from "react";

export function useRecipes() {
  const [recipes, setRecipes] = useState(() => {
    return JSON.parse(localStorage.getItem("recipes") || "[]");
  });

  useEffect(() => {
    localStorage.setItem("recipes", JSON.stringify(recipes));
  }, [recipes]);

  return { recipes, setRecipes };
}