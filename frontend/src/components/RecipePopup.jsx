import { useState } from "react";
import { scaleAmount } from "../utils/scaleAmount";
import { TagChip } from "./TagInput";

export default function RecipePopup({ recipe, onClose, onEdit, onAddToGroceries, styles }) {
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
              {recipe.versions?.[0]?.ingredients?.length || 0} ingredients
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
                onClick={() => onAddToGroceries(recipe, activeVersion)}  // ← pass activeVersion
                >
                + Add to Grocery List
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
                  <p key={i} style={styles.step}>{i + 1}. {step}</p>
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}