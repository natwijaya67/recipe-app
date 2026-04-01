import { useState } from "react";
// import { useRecipes } from "../hooks/useRecipes";
const isMobile = window.innerWidth <= 768;

export default function EditRecipeModal({ rcp, rcpIndex,  onSave, onClose, styles }) {
// const {recipes, setRecipes} = useRecipes();
const [activeVersionId, setActiveVersionId] = useState(rcp.versions[0].id);
const [editingRecipe, setEditingRecipe] = useState(rcp);    
const activeVersion = editingRecipe?.versions.find(v => v.id === activeVersionId);
if (!editingRecipe) return null;   

  const saveEdit = () => {
    onSave(editingRecipe, rcpIndex); // ← pass up to parent
  };

  const closeEdit = () => {
    onClose(); // ← call parent's close
  };

  const updateActiveVersion = (changes) => {
    setEditingRecipe(prev => ({
      ...prev,
      versions: prev.versions.map(v =>
        v.id === activeVersionId ? { ...v, ...changes } : v
      )
    }));
  };

  const addVersion = () => {
    const newVersion = {
      id: Date.now(),
      tab_name: "New Version",
      ingredients: JSON.parse(JSON.stringify(activeVersion.ingredients)),
      instructions: [...activeVersion.instructions],
    };
    setEditingRecipe(prev => ({
      ...prev,
      versions: [...prev.versions, newVersion]
    }));
    setActiveVersionId(newVersion.id);
  };
const deleteVersion = (id) => {
    if (editingRecipe.versions.length === 1) return; // keep at least one
    setEditingRecipe(prev => ({
      ...prev,
      versions: prev.versions.filter(v => v.id !== id)
    }));
    setActiveVersionId(editingRecipe.versions[0].id);
  };

    return (
        <div style={styles.overlay} onClick={closeEdit}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit — {editingRecipe.name}</h3>
              <button style={styles.closeBtn} onClick={closeEdit}>✕</button>
            </div>

            {/* Version tabs */}
            <div style={{ ...styles.tabs, padding: "0 24px", display: "flex", alignItems: "center" }}>
              {editingRecipe.versions.map(v => (
                <div key={v.id} style={{ display: "flex", alignItems: "center" }}>
                  <button
                    style={{ ...styles.tab, ...(v.id === activeVersionId ? styles.tabActive : {}) }}
                    onClick={() => setActiveVersionId(v.id)}
                  >
                    {v.tab_name}
                  </button>
                  {editingRecipe.versions.length > 1 && (
                    <button
                      onClick={() => deleteVersion(v.id)}
                      style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: "11px", padding: "0 4px" }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                style={{ ...styles.tab, color: "#9ca3af" }}
                onClick={addVersion}
              >
                + Add version
              </button>
            </div>

            <div style={styles.modalBody}>

              {/* Tab name */}
              <div style={{ marginBottom: "16px" }}>
                <p style={styles.inputLabel}>Tab name</p>
                <input
                  style={styles.input}
                  value={activeVersion.tab_name}
                  onChange={e => updateActiveVersion({ tab_name: e.target.value })}
                />
              </div>

              {/* Ingredients */}
              <p style={styles.inputLabel}>Ingredients</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "8px" }}>
                {activeVersion.ingredients.map((ing, i) => (
                  <div key={i} style={{ 
                    display: "flex", 
                    flexDirection: isMobile ? "column" : "row",
                    gap: "8px",
                    padding: isMobile ? "12px 0" : "0",
                    borderBottom: isMobile ? "1px solid #f3f4f6" : "none",
                  }}>
                    {isMobile && <p style={{ fontSize: "12px", color: "#9ca3af", margin: "0" }}>Amount</p>}
                    <input
                      style={{ ...styles.input, width: isMobile ? "100%" : "80px" }}
                      placeholder="amt"
                      value={ing.amount || ""}
                      onChange={e => {
                        const updated = [...activeVersion.ingredients];
                        updated[i] = { ...updated[i], amount: e.target.value };
                        updateActiveVersion({ ingredients: updated });
                      }}
                    />
                    {isMobile && <p style={{ fontSize: "12px", color: "#9ca3af", margin: "0" }}>Unit</p>}
                    <input
                      style={{ ...styles.input, width: isMobile ? "100%" : "80px" }}
                      placeholder="unit"
                      value={ing.unit || ""}
                      onChange={e => {
                        const updated = [...activeVersion.ingredients];
                        updated[i] = { ...updated[i], unit: e.target.value };
                        updateActiveVersion({ ingredients: updated });
                      }}
                    />
                    {isMobile && <p style={{ fontSize: "12px", color: "#9ca3af", margin: "0" }}>Ingredient</p>}
                    <input
                      style={{ ...styles.input, flex: 1 }}
                      placeholder="ingredient"
                      value={ing.item || ""}
                      onChange={e => {
                        const updated = [...activeVersion.ingredients];
                        updated[i] = { ...updated[i], item: e.target.value };
                        updateActiveVersion({ ingredients: updated });
                      }}
                    />
                    <button
                      onClick={() => {
                        const updated = activeVersion.ingredients.filter((_, idx) => idx !== i);
                        updateActiveVersion({ ingredients: updated });
                      }}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#9ca3af", fontSize: "18px",
                        padding: "12px", minWidth: "44px", minHeight: "44px",
                        touchAction: "manipulation",
                        alignSelf: isMobile ? "flex-end" : "center",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                style={styles.addRowBtn}
                onClick={() => updateActiveVersion({
                  ingredients: [...activeVersion.ingredients, { amount: "", unit: "", item: "" }]
                })}
              >
                + Add ingredient
              </button>

              {/* Instructions */}
              <p style={{ ...styles.inputLabel, marginTop: "20px" }}>Instructions</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "8px" }}>
                {activeVersion.instructions.map((instruction, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <span style={{ paddingTop: "10px", fontSize: "13px", color: "#9ca3af", minWidth: "20px" }}>
                      {i + 1}.
                    </span>
                    <textarea
                      style={{
                        ...styles.input,
                        resize: "none",
                        overflow: "hidden",
                        minHeight: isMobile ? "100px" : "60px",
                        flex: 1,
                      }}
                      value={instruction}
                      onChange={e => {
                        e.target.style.height = "auto";
                        e.target.style.height = e.target.scrollHeight + "px";
                        const updated = [...activeVersion.instructions];
                        updated[i] = e.target.value;
                        updateActiveVersion({ instructions: updated });
                      }}
                    />
                    <button
                      onClick={() => {
                        const updated = activeVersion.instructions.filter((_, idx) => idx !== i);
                        updateActiveVersion({ instructions: updated });
                      }}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#9ca3af", fontSize: "18px",
                        padding: "12px", minWidth: "44px", minHeight: "44px",
                        touchAction: "manipulation",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                style={styles.addRowBtn}
                onClick={() => updateActiveVersion({
                  instructions: [...activeVersion.instructions, ""]
                })}
              >
                + Add step
              </button>
            
              {/* Save */}
              <div style={{
                    position: "sticky",
                    bottom: 0,
                    background: "#fff",
                    padding: "12px 24px",
                    borderTop: "1px solid #e5e7eb",
                    display: "flex",
                    gap: "10px",
                    marginTop: "24px",
                    }}>
                <button
                  style={{ ...styles.submitBtn, background: "#f3f4f6", color: "#111827", marginTop: 0 }}
                  onMouseDown={e => e.preventDefault()}
                  onClick={closeEdit}
                >
                  Cancel
                </button>
                <button
                  style={{ ...styles.submitBtn, marginTop: 0 }}
                  onMouseDown={e => e.preventDefault()}
                  onClick={saveEdit}
                >
                  Save Changes
                </button>
              </div>

            </div>
          </div>
        </div>
    )
};