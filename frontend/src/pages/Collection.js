import { useState } from "react";
import { useRecipes } from "../hooks/useRecipes";
import RecipePopup from "../components/RecipePopup";
import AddRecipeModal from "../components/AddRecipeModal";
import EditRecipeModal from "../components/EditRecipeModal";
import PantryModal from "../components/PantryModal";
import { TagChip } from "../components/TagInput";


export default function Collection() {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPantry, setShowPantry] = useState(false);
  const {recipes, setRecipes} = useRecipes();
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [editingRecipeIndex, setEditingRecipeIndex] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);

  const exportRecipes = () => {
    const blob = new Blob([JSON.stringify(recipes, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cookmark-recipes.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const addToGroceries = (recipe, version) => {
    const existing = JSON.parse(localStorage.getItem("groceryList") || "[]");
    const activeIngredients = version?.ingredients || recipe.versions?.[0]?.ingredients || [];
    const newItems = activeIngredients.map(ing => ({
      id: Date.now() + Math.random(),
      text: [ing.item].filter(Boolean).join(" "),
      checked: false,
    }));
    localStorage.setItem("groceryList", JSON.stringify([...existing, ...newItems]));
    alert(`Added ${newItems.length} ingredients to your grocery list!`);
  };

  const deleteCard = (e, i) => {
    e.stopPropagation();
    setDeleteIndex(i);
  };

  const confirmDelete = () => {
    setRecipes(prev => prev.filter((_, idx) => idx !== deleteIndex));
    setDeleteIndex(null);
  };
  const openEdit = (e, recipe, i) => {
    e.stopPropagation();
    setEditingRecipe(JSON.parse(JSON.stringify(recipe))); 
    setEditingRecipeIndex(i);
  };
  const [activeTags, setActiveTags] = useState([]);
  const [sortOrder, setSortOrder] = useState("recent");
  const allTags = [...new Set(recipes.flatMap(r => r.tags || []))];
  const filteredRecipes = (() => {
    const filtered = activeTags.length === 0
      ? [...recipes]
      : recipes.filter(r => activeTags.some(tag => r.tags?.includes(tag)));
    const textOnly = name => name.replace(/^[^\p{L}\p{N}]+/u, "").trim();
    if (sortOrder === "az") filtered.sort((a, b) => textOnly(a.name).localeCompare(textOnly(b.name)));
    if (sortOrder === "za") filtered.sort((a, b) => textOnly(b.name).localeCompare(textOnly(a.name)));
    return filtered;
  })();



  return (
    <div style={styles.page}>

      {/* Page Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>My Collection</h2>
        <p style={styles.count}>
          {filteredRecipes.length === recipes.length
            ? `${recipes.length} recipes`
            : `${filteredRecipes.length} of ${recipes.length} recipes`}
        </p>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "12px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button style={styles.pantryBtn} onClick={() => setShowPantry(true)}>
            🥫 Pantry
          </button>
          <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>
            + Add Recipe
          </button>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            style={styles.sortSelect}
          >
            <option value="recent">Recently Added</option>
            <option value="az">Name A–Z</option>
            <option value="za">Name Z–A</option>
          </select>
          <button style={styles.exportBtn} onClick={exportRecipes}>
            Export
          </button>
        </div>
      </div>

      {allTags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
          {allTags.map(tag => {
            const isActive = activeTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => {
                  setActiveTags(prev =>
                    isActive ? prev.filter(t => t !== tag) : [...prev, tag]
                  );
                }}
                style={{
                  padding: "5px 12px",
                  borderRadius: "20px",
                  border: `1px solid ${isActive ? "#122711" : "#e5e7eb"}`,
                  background: isActive ? "#192711" : "#fff",
                  color: isActive ? "#fff" : "#6b7280",
                  fontSize: "12px",
                  fontWeight: isActive ? "500" : "400",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {tag}
              </button>
            );
          })}
          {activeTags.length > 0 && (
            <button
              onClick={() => setActiveTags([])}
              style={{
                padding: "5px 12px",
                borderRadius: "20px",
                border: "1px solid #fca5a5",
                background: "none",
                color: "#dc2626",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Recipe Grid */}
      <div style={styles.grid}>
        {filteredRecipes.map((recipe, i) => (
          <div
            key={i}
            style={{...styles.card, position: "relative"}}
            onClick={() => {
              setSelectedRecipe(recipe);
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#9ca3af"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
          >
            <button
              style={styles.deleteCardBtn}
              onClick={e => deleteCard(e, i)}
            >
              ✕
            </button>
            <div style={styles.cardBody}>
              <p style={styles.cardName}>{recipe.name}</p>
              <p style={styles.cardMeta}>
                {recipe.total_time && `${recipe.total_time} mins · `}
                {recipe.versions?.[0]?.ingredients?.length || 0} ingredients
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "8px" }}>
                  {recipe.tags?.map(tag => (
                  <TagChip key={tag} tag={tag} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recipe Detail Popup */}
      {selectedRecipe && (
        <RecipePopup
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onEdit={e => {
            const i = recipes.findIndex(r => r.url === selectedRecipe.url);
            openEdit(e, selectedRecipe, i);
            setSelectedRecipe(null);
          }}
          onAddToGroceries={addToGroceries}
        />
      )}

      {editingRecipe 
      // && activeVersion 
      && (
        <EditRecipeModal
          rcp={editingRecipe}
          rcpIndex={editingRecipeIndex}
          onSave={(updatedRecipe, index) => {
            const updated = [...recipes];
            updated[index] = updatedRecipe;
            setRecipes(updated);
            setEditingRecipe(null);
            setEditingRecipeIndex(null);
          }}
          onClose={() => {
            setEditingRecipe(null);
            setEditingRecipeIndex(null);
          }}
        />
      )}

      {showPantry && <PantryModal onClose={() => setShowPantry(false)} />}

      {deleteIndex !== null && (
        <div style={styles.overlay} onClick={() => setDeleteIndex(null)}>
          <div style={styles.confirmModal} onClick={e => e.stopPropagation()}>
            <p style={styles.confirmTitle}>Delete recipe?</p>
            <p style={styles.confirmSub}>{recipes[deleteIndex]?.name}</p>
            <div style={styles.confirmBtns}>
              <button style={styles.cancelBtn} onClick={() => setDeleteIndex(null)}>Cancel</button>
              <button style={styles.deleteBtn} onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Recipe Modal */}
      {showAddModal && (
      <AddRecipeModal
        onClose={() => setShowAddModal(false)}
        onSave={recipe => setRecipes(prev => [...prev, recipe])}
        onImport={imported => setRecipes(prev => [...prev, ...imported])}
        />
)}

    </div>
  );
}

const styles = {
  page: { maxWidth: "900px", margin: "48px auto", padding: "0 24px" },
  header: { marginBottom: "28px" },
  title: { fontSize: "22px", fontWeight: "500", marginBottom: "4px" },
  count: { fontSize: "13px", color: "#9ca3af" },
  addBtn: {
    padding: "8px 16px", background: "#111827", color: "#fff",
    border: "none", borderRadius: "8px", fontSize: "13px",
    fontWeight: "500", cursor: "pointer",
  },
  pantryBtn: {
    padding: "8px 16px", background: "none", color: "#6b7280",
    border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "13px",
    fontWeight: "500", cursor: "pointer",
  },
  exportBtn: {
    padding: "8px 16px", background: "none", color: "#6b7280",
    border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "13px",
    fontWeight: "500", cursor: "pointer",
  },
  sortSelect: {
    padding: "8px 12px", background: "none", color: "#6b7280",
    border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "13px",
    cursor: "pointer", fontFamily: "inherit",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "16px",
  },
  card: {
    border: "1px solid #e5e7eb", borderRadius: "10px",
    overflow: "hidden", cursor: "pointer", background: "#fff",
    transition: "border-color 0.15s",
  },
  cardImage: { width: "100%", height: "130px", objectFit: "cover" },
  cardBody: { padding: "12px" },
  cardName: { fontSize: "14px", fontWeight: "500", marginBottom: "4px" },
  cardMeta: { fontSize: "12px", color: "#9ca3af" },
  deleteCardBtn: {
    position: "absolute", top: "8px", right: "8px",
    background: "none", border: "none", color: "#d1d5db",
    cursor: "pointer", fontSize: "14px", padding: "2px 6px",
    borderRadius: "4px", lineHeight: 1,
  },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
  },
  confirmModal: {
    background: "#fff", borderRadius: "12px", padding: "24px",
    width: "100%", maxWidth: "320px", margin: "0 16px", textAlign: "center",
  },
  confirmTitle: { fontSize: "16px", fontWeight: "500", marginBottom: "6px" },
  confirmSub: { fontSize: "13px", color: "#9ca3af", marginBottom: "20px" },
  confirmBtns: { display: "flex", gap: "8px" },
  cancelBtn: {
    flex: 1, padding: "10px", background: "#f3f4f6", color: "#111827",
    border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "500", cursor: "pointer",
  },
  deleteBtn: {
    flex: 1, padding: "10px", background: "#dc2626", color: "#fff",
    border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "500", cursor: "pointer",
  },
  editCardBtn: {
    marginTop: "10px", width: "100%", padding: "7px",
    background: "none", border: "1px solid #e5e7eb",
    borderRadius: "6px", fontSize: "12px", color: "#6b7280", cursor: "pointer",
  },
};
