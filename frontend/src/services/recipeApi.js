export async function parseRecipeFromUrl(url) {
  const res = await fetch("http://localhost:8000/api/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) throw new Error("Failed to parse recipe");
  return res.json();
}