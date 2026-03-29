const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export async function parseRecipeFromUrl(url) {
  const res = await fetch(`${BASE_URL}/api/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error("Failed to parse recipe");
  return res.json();
}