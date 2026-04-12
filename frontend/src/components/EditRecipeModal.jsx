import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TagInput from "./TagInput";

const isMobile = window.innerWidth <= 768;

const styles = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
  },
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
  modalBody: {
    padding: isMobile ? "16px" : "24px",
    flex: 1,
    overflowY: "auto",
  },
  inputLabel: { fontSize: "13px", fontWeight: "500", marginBottom: "6px", color: "#374151" },
  input: {
    width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb",
    borderRadius: "8px", fontSize: "16px", outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
  },
  submitBtn: {
    width: "100%", marginTop: "20px", padding: "10px",
    background: "#111827", color: "#fff", border: "none",
    borderRadius: "8px", fontSize: "14px", fontWeight: "500", cursor: "pointer",
  },
  addRowBtn: {
    background: "none", border: "1px dashed #e5e7eb",
    borderRadius: "8px", padding: "8px 14px",
    fontSize: "13px", color: "#9ca3af", cursor: "pointer",
    width: "100%", marginTop: "4px",
  },
};

function SortableInstruction({ id, instruction, index, onChange, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={{ ...style, display: "flex", gap: "8px", alignItems: "stretch" }}>
      <div
        {...attributes}
        {...listeners}
        style={{
          width: "32px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: "14px",
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          WebkitTapHighlightColor: "transparent",
          background: isDragging ? "#f3f4f6" : "transparent",
          borderRadius: "6px",
        }}
      >
        <span style={{ fontSize: "13px", color: "#9ca3af" }}>{index + 1}.</span>
      </div>

      <textarea
        style={{
          ...styles.input,
          resize: "none",
          overflow: "hidden",
          minHeight: isMobile ? "100px" : "60px",
          flex: 1,
        }}
        value={typeof instruction === "object" ? instruction.text || "" : instruction}
        onChange={e => {
          e.target.style.height = "auto";
          e.target.style.height = e.target.scrollHeight + "px";
          onChange(e.target.value);
        }}
      />

      <button
        onMouseDown={e => e.preventDefault()}
        onClick={onDelete}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#9ca3af", fontSize: "18px",
          padding: "12px", minWidth: "44px", minHeight: "44px",
          touchAction: "manipulation",
          alignSelf: "flex-start",
        }}
      >
        ✕
      </button>
    </div>
  );
}

export default function EditRecipeModal({ rcp, rcpIndex, onSave, onClose }) {
  const [activeVersionId, setActiveVersionId] = useState(rcp.versions[0].id);
  const [editingRecipe, setEditingRecipe] = useState(() => {
    // Convert plain string instructions to {id, text} objects
    return {
      ...rcp,
      versions: rcp.versions.map(v => ({
        ...v,
        instructions: v.instructions.map((inst, i) =>
          typeof inst === "string"
            ? { id: `inst-${v.id}-${i}`, text: inst }
            : inst
        ),
      }))
    };
  });

  const activeVersion = editingRecipe?.versions.find(v => v.id === activeVersionId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } })
  );

  if (!editingRecipe) return null;

  const saveEdit = () => {
    // Convert {id, text} back to plain strings before saving
    const finalRecipe = {
      ...editingRecipe,
      versions: editingRecipe.versions.map(v => ({
        ...v,
        instructions: v.instructions.map(inst =>
          typeof inst === "object" ? inst.text : inst
        ),
      }))
    };
    onSave(finalRecipe, rcpIndex);
  };

  const closeEdit = () => onClose();

  const updateActiveVersion = (changes) => {
    setEditingRecipe(prev => ({
      ...prev,
      versions: prev.versions.map(v =>
        v.id === activeVersionId ? { ...v, ...changes } : v
      )
    }));
  };

  const handleInstructionDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const instructions = activeVersion.instructions;
      const oldIndex = instructions.findIndex(inst => inst.id === active.id);
      const newIndex = instructions.findIndex(inst => inst.id === over.id);
      updateActiveVersion({ instructions: arrayMove(instructions, oldIndex, newIndex) });
    }
  };

  const addVersion = () => {
    const newVersion = {
      id: Date.now(),
      tab_name: "New Version",
      ingredients: JSON.parse(JSON.stringify(activeVersion.ingredients)),
      instructions: activeVersion.instructions.map((inst, i) => ({
        id: `inst-${Date.now()}-${i}`,
        text: typeof inst === "object" ? inst.text : inst,
      })),
    };
    setEditingRecipe(prev => ({
      ...prev,
      versions: [...prev.versions, newVersion]
    }));
    setActiveVersionId(newVersion.id);
  };

  const deleteVersion = (id) => {
    if (editingRecipe.versions.length === 1) return;
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
      <div style={{ padding: "12px 24px", borderBottom: "1px solid #e5e7eb" }}>
        <p style={styles.inputLabel}>Tags</p>
            <TagInput
            tags={editingRecipe.tags || []}
            onChange={tags => setEditingRecipe({ ...editingRecipe, tags })}
            />
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
        <button style={{ ...styles.tab, color: "#9ca3af" }} onClick={addVersion}>
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
                onMouseDown={e => e.preventDefault()}
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
          onMouseDown={e => e.preventDefault()}
          onClick={() => updateActiveVersion({
            ingredients: [...activeVersion.ingredients, { amount: "", unit: "", item: "" }]
          })}
        >
          + Add ingredient
        </button>

        {/* Instructions */}
        <p style={{ ...styles.inputLabel, marginTop: "20px" }}>Instructions</p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleInstructionDragEnd}
        >
          <SortableContext
            items={activeVersion.instructions.map(inst => inst.id)}
            strategy={verticalListSortingStrategy}
          >
            {activeVersion.instructions.map((instruction, i) => (
              <SortableInstruction
                key={instruction.id}
                id={instruction.id}
                instruction={instruction}
                index={i}
                onChange={value => {
                  const updated = activeVersion.instructions.map(inst =>
                    inst.id === instruction.id ? { ...inst, text: value } : inst
                  );
                  updateActiveVersion({ instructions: updated });
                }}
                onDelete={() => {
                  const updated = activeVersion.instructions.filter(inst => inst.id !== instruction.id);
                  updateActiveVersion({ instructions: updated });
                }}
              />
            ))}
          </SortableContext>
        </DndContext>
        <button
          style={styles.addRowBtn}
          onMouseDown={e => e.preventDefault()}
          onClick={() => updateActiveVersion({
            instructions: [
              ...activeVersion.instructions,
              { id: `inst-${Date.now()}`, text: "" }
            ]
          })}
        >
          + Add step
        </button>

        {/* Notes */}
        <p style={{ ...styles.inputLabel, marginTop: "20px" }}>Notes</p>
        <textarea
          style={{ ...styles.input, resize: "vertical", minHeight: "80px" }}
          placeholder="Personal tweaks, tips, substitutions..."
          value={activeVersion.notes || ""}
          onChange={e => updateActiveVersion({ notes: e.target.value })}
        />

        {/* Save */}
        <div style={{
          position: "sticky", bottom: 0,
          background: "#fff", padding: "12px 24px",
          borderTop: "1px solid #e5e7eb",
          display: "flex", gap: "10px", marginTop: "24px",
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
  );
}