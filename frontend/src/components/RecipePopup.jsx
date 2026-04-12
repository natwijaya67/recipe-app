import { useState } from "react";
import { scaleAmount } from "../utils/scaleAmount";
import { TagChip } from "./TagInput";

const styles = {
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
  groceryBtn: {
    padding: "7px 14px", background: "#111827", color: "#fff",
    border: "none", borderRadius: "8px", fontSize: "13px",
    fontWeight: "500", cursor: "pointer",
  },
  closeBtn: {
    background: "none", border: "none", fontSize: "18px",
    cursor: "pointer", color: "#9ca3af", padding: "4px 8px",
  },
  tabs: {
    display: "flex", borderBottom: "1px solid #e5e7eb", padding: "0 24px",
  },
  tab: {
    padding: "12px 16px", background: "none", border: "none",
    fontSize: "13px", color: "#9ca3af", cursor: "pointer",
    borderBottom: "2px solid transparent", marginBottom: "-1px",
  },
  tabActive: { color: "#000", borderBottomColor: "#000", fontWeight: "bold" },
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
};

export default function RecipePopup({ recipe, onClose, onEdit, onAddToGroceries }) {
  const [activeVersionId, setActiveVersionId] = useState(recipe.versions[0].id);
  const [servingMultiplier, setServingMultiplier] = useState(1);

  const activeVersion = recipe.versions?.find(v => v.id === activeVersionId) || recipe.versions?.[0];

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.popup} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={styles.popupHeader}>
          <div>
            <h2 style={styles.popupTitle}>{recipe.name}</h2>
            <a style={styles.popupMeta} href={recipe.url} target="_blank" rel="noreferrer">
              🔗 Link to original recipe webpage
            </a>
            <p style={styles.popupMeta}>
              {recipe.total_time && `${recipe.total_time} mins · `}
              Serves{" "}
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={servingMultiplier}
                onChange={e => setServingMultiplier(parseFloat(e.target.value) || 1)}
                style={{
                  width: "48px", padding: "2px 6px", border: "1px solid #e5e7eb",
                  borderRadius: "6px", fontSize: "13px", textAlign: "center",
                  outline: "none", fontFamily: "inherit",
                }}
              />
              {recipe.servings && ` (original: ${recipe.servings})`}
              {" · "}
              <span style={{ whiteSpace: "nowrap" }}>
                {recipe.versions?.[0]?.ingredients?.length || 0} ingredients
              </span>
            </p>
            {recipe.tags?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                {recipe.tags.map(tag => (
                  <TagChip key={tag} tag={tag} />
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              style={styles.groceryBtn}
              onMouseDown={e => e.preventDefault()}
              onClick={() => onAddToGroceries(recipe, activeVersion)}
            >
              + Grocery List
            </button>
            <button
              style={styles.groceryBtn}
              onMouseDown={e => e.preventDefault()}
              onClick={onEdit}
            >
              Edit
            </button>
            <button style={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Version tabs */}
        {recipe.versions?.length > 1 && (
          <div style={styles.tabs}>
            {recipe.versions.map(v => (
              <button
                key={v.id}
                style={{ ...styles.tab, ...(v.id === activeVersionId ? styles.tabActive : {}) }}
                onClick={() => setActiveVersionId(v.id)}
              >
                {v.tab_name}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div style={styles.popupBody}>
          {activeVersion && (
            <>
              <div style={styles.section}>
                <p style={styles.sectionTitle}>Ingredients</p>
                {activeVersion.ingredients.map((ing, i) => (
                  <div key={i} style={styles.ingredientRow}>
                    <span style={styles.ingredientAmount}>
                      {[scaleAmount(ing.amount, servingMultiplier), ing.unit].filter(Boolean).join(" ") || "—"}
                    </span>
                    <span style={styles.ingredientItem}>{ing.item}</span>
                  </div>
                ))}
              </div>
              <div style={styles.section}>
                <p style={styles.sectionTitle}>Instructions</p>
                {activeVersion.instructions.map((step, i) => (
                  <p key={i} style={styles.step}>{i + 1}. {typeof step === "object" ? step.text : step}</p>
                ))}
              </div>
              {activeVersion.notes && (
                <div style={styles.section}>
                  <p style={styles.sectionTitle}>Notes</p>
                  <p style={{ ...styles.step, whiteSpace: "pre-wrap" }}>{activeVersion.notes}</p>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}