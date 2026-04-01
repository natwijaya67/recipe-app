import { useState } from "react";
import { useRecipes } from "../hooks/useRecipes";
import RecipePopup from "../components/RecipePopup";
import AddRecipeModal from "../components/AddRecipeModal";
import EditRecipeModal from "../components/EditRecipeModal";

const isMobile = window.innerWidth <= 768;

export default function Collection() {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const {recipes, setRecipes} = useRecipes();
  const [editingRecipe, setEditingRecipe] = useState(null);      
  const [editingRecipeIndex, setEditingRecipeIndex] = useState(null); 

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
    e.stopPropagation(); // prevent opening the popup
    setRecipes(prev => prev.filter((_, idx) => idx !== i));
  };

  const openEdit = (e, recipe, i) => {
    e.stopPropagation();
    setEditingRecipe(JSON.parse(JSON.stringify(recipe))); // deep copy
    setEditingRecipeIndex(i);
  };

  return (
    <div style={styles.page}>

      {/* Page Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>My Collection</h2>
          <p style={styles.count}>{recipes.length} recipes</p>
        </div>
        <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>
          + Add Recipe
        </button>
      </div>

      {/* Recipe Grid */}
      <div style={styles.grid}>
        {recipes.map((recipe, i) => (
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
          styles={styles}
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
            // setActiveVersionId(null);
          }}
          onClose={() => {
            setEditingRecipe(null);
            setEditingRecipeIndex(null);
            // setActiveVersionId(null);
          }}
          styles={styles}
        />
      )}

      {/* Add Recipe Modal */}
      {showAddModal && (
      <AddRecipeModal
        onClose={() => setShowAddModal(false)}
        onSave={recipe => setRecipes(prev => [...prev, recipe])}
        styles={styles}
        />
)}

    </div>
  );
}

const styles = {
  page: { maxWidth: "900px", margin: "48px auto", padding: "0 24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" },
  title: { fontSize: "22px", fontWeight: "500", marginBottom: "4px" },
  count: { fontSize: "13px", color: "#9ca3af" },
  addBtn: {
    padding: "8px 16px", background: "#111827", color: "#fff",
    border: "none", borderRadius: "8px", fontSize: "13px",
    fontWeight: "500", cursor: "pointer",
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
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
  },
  popup: {
    background: "#fff", borderRadius: "12px", width: "100%",
    maxWidth: "680px", maxHeight: "80vh", overflow: "hidden",
    display: "flex", flexDirection: "column", margin: "0 16px",
  },
  popupHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "24px 24px 16px", borderBottom: "1px solid #e5e7eb",
  },
  popupTitle: { fontSize: "20px", fontWeight: "500", marginBottom: "4px" },
  popupMeta: { fontSize: "13px", color: "#9ca3af" },
  closeBtn: {
    background: "none", border: "none", fontSize: "18px",
    cursor: "pointer", color: "#9ca3af", padding: "4px 8px",
  },
  popupBody: {
    overflowY: "auto", padding: "24px",
    display: "flex", flexDirection: "column", gap: "28px",
  },
  section: {},
  sectionTitle: {
    fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em",
    textTransform: "uppercase", color: "#9ca3af", marginBottom: "12px",
  },
  ingredientRow: {
    display: "flex", gap: "12px", padding: "8px 0",
    borderBottom: "1px solid #f3f4f6", fontSize: "14px",
  },
  ingredientAmount: { minWidth: "80px", color: "#6b7280" },
  ingredientItem: { color: "#111827" },
  step: { fontSize: "14px", lineHeight: "1.7", color: "#374151", marginBottom: "12px" },
  // modal: {
  //   background: "#fff", borderRadius: "12px", width: "100%",
  //   maxWidth: "480px", margin: "0 16px", overflow: "hidden",
  //   maxHeight: "85vh",        // ← add this
  //   overflowY: "auto",        // ← add this
  // },
  modal: {
    background: "#fff",
    borderRadius: isMobile ? "0" : "12px",
    width: "100%",
    maxWidth: isMobile ? "100%" : "480px",
    margin: isMobile ? "0" : "0 16px",
    height: isMobile ? "100%" : "auto",
    maxHeight: isMobile ? "100%" : "85vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },
  modalHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "20px 24px", borderBottom: "1px solid #e5e7eb",
  },
  modalTitle: { fontSize: "16px", fontWeight: "500" },
  tabs: {
    display: "flex", borderBottom: "1px solid #e5e7eb",
    padding: "0 24px",
  },
  tab: {
    padding: "12px 16px", background: "none", border: "none",
    fontSize: "13px", color: "#9ca3af", cursor: "pointer",
    borderBottom: "2px solid transparent", marginBottom: "-1px",
  },
  tabActive: { color: "#000", borderBottomColor: "#000", fontWeight: 'bold' },
  modalBody: { 
    padding: isMobile ? "16px" : "24px", 
    flex: 1,           
    overflowY: "auto", 
  },
  inputLabel: { fontSize: "13px", fontWeight: "500", marginBottom: "6px", color: "#374151" },
  // input: {
  //   width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb",
  //   borderRadius: "8px", fontSize: "14px", outline: "none",
  //   fontFamily: "inherit", boxSizing: "border-box",
  // },
  input: {
  width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb",
  borderRadius: "8px", fontSize: "16px", outline: "none",  // ← 16px prevents iOS zoom
  fontFamily: "inherit", boxSizing: "border-box",
},
  inputHint: { fontSize: "12px", color: "#9ca3af", marginTop: "4px" },
  submitBtn: {
    width: "100%", marginTop: "20px", padding: "10px",
    background: "#111827", color: "#fff", border: "none",
    borderRadius: "8px", fontSize: "14px", fontWeight: "500", cursor: "pointer",
  },
  deleteCardBtn: {
    position: "absolute",
    top: "8px",
    right: "8px",
    background: "none",
    border: "none",
    color: "#d1d5db",
    cursor: "pointer",
    fontSize: "14px",
    padding: "2px 6px",
    borderRadius: "4px",
    lineHeight: 1,
},
editCardBtn: {
  marginTop: "10px", width: "100%", padding: "7px",
  background: "none", border: "1px solid #e5e7eb",
  borderRadius: "6px", fontSize: "12px", color: "#6b7280",
  cursor: "pointer",
},
addRowBtn: {
  background: "none", border: "1px dashed #e5e7eb",
  borderRadius: "8px", padding: "8px 14px",
  fontSize: "13px", color: "#9ca3af", cursor: "pointer",
  width: "100%", marginTop: "4px",
},
removeRowBtn: {
  background: "none", border: "none",
  color: "#d1d5db", cursor: "pointer",
  fontSize: "14px", padding: "8px 4px", flexShrink: 0,
},
emojiBtn: {
  padding: "8px 12px", background: "none",
  border: "1px solid #e5e7eb", borderRadius: "8px",
  cursor: "pointer", fontSize: "18px", flexShrink: 0,
},
};
