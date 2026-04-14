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
import { usePantry } from "../hooks/usePantry";

const isMobile = window.innerWidth <= 768;

function SortableItem({ item, selected, onToggle, onDelete, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...styles.item, ...style,
        background: selected ? "#f0fdf4" : "#fff",
        borderColor: selected ? "#86efac" : "#e5e7eb",
      }}
    >
      <span
        {...attributes}
        {...listeners}
        style={styles.dragHandle}
      >
        ⠿
      </span>
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(item.id)}
        style={styles.checkbox}
      />
      <span
        contentEditable
        suppressContentEditableWarning
        onDragStart={e => e.stopPropagation()}
        onBlur={e => onEdit(item.id, e.target.innerText)}
        style={styles.itemText}
      >
        {item.text}
      </span>
      <button style={styles.deleteBtn} onClick={() => onDelete(item.id)}>✕</button>
    </div>
  );
}

export default function PantryModal({ onClose }) {
  const { pantryItems, setPantryItems } = usePantry();
  const [inputValue, setInputValue] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [added, setAdded] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setPantryItems(prev => {
        const oldIndex = prev.findIndex(i => i.id === active.id);
        const newIndex = prev.findIndex(i => i.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setPantryItems(prev => [...prev, { id: Date.now(), text: trimmed }]);
    setInputValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAdd();
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const deleteItem = (id) => {
    setPantryItems(prev => prev.filter(item => item.id !== id));
    setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  const editItem = (id, text) => {
    setPantryItems(prev => prev.map(item => item.id === id ? { ...item, text } : item));
  };

  const addToGroceryList = () => {
    const toAdd = pantryItems.filter(item => selected.has(item.id));
    const existing = JSON.parse(localStorage.getItem("groceryList") || "[]");
    const newItems = toAdd.map(item => ({
      id: Date.now() + Math.random(),
      text: item.text,
      checked: false,
    }));
    localStorage.setItem("groceryList", JSON.stringify([...existing, ...newItems]));
    setSelected(new Set());
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={styles.modalHeader}>
          <div>
            <h3 style={styles.modalTitle}>Pantry</h3>
            <p style={styles.modalSubtitle}>{pantryItems.length} items</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Input */}
        <div style={styles.inputRow}>
          <input
            type="text"
            placeholder="Add an item..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            style={styles.input}
          />
          <button style={styles.addBtn} onClick={handleAdd}>Add</button>
        </div>

        {/* List */}
        <div style={styles.list}>
          {pantryItems.length === 0 && (
            <p style={styles.empty}>No items yet — add your staples above.</p>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={pantryItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
              {pantryItems.map(item => (
                <SortableItem
                  key={item.id}
                  item={item}
                  selected={selected.has(item.id)}
                  onToggle={toggleSelect}
                  onDelete={deleteItem}
                  onEdit={editItem}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Sticky footer */}
        <div style={styles.footer}>
          <button
            style={{
              ...styles.groceryBtn,
              opacity: selected.size === 0 ? 0.4 : 1,
              background: added ? "#16a34a" : "#111827",
            }}
            disabled={selected.size === 0}
            onClick={addToGroceryList}
          >
            {added ? "✓ Added!" : `Add ${selected.size > 0 ? selected.size : ""} to Grocery List`}
          </button>
        </div>

      </div>
    </div>
  );
}

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
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "20px 24px 12px", borderBottom: "1px solid #e5e7eb",
    flexShrink: 0,
  },
  modalTitle: { fontSize: "16px", fontWeight: "500", marginBottom: "2px" },
  modalSubtitle: { fontSize: "12px", color: "#9ca3af" },
  closeBtn: {
    background: "none", border: "none", fontSize: "18px",
    cursor: "pointer", color: "#9ca3af", padding: "4px 8px",
  },
  inputRow: {
    display: "flex", gap: "8px", padding: "16px 24px",
    borderBottom: "1px solid #f3f4f6", flexShrink: 0,
  },
  input: {
    flex: 1, padding: "10px 14px", border: "1px solid #e5e7eb",
    borderRadius: "8px", fontSize: "16px", outline: "none", fontFamily: "inherit",
  },
  addBtn: {
    padding: "10px 20px", background: "#111827", color: "#fff",
    border: "none", borderRadius: "8px", fontSize: "14px",
    fontWeight: "500", cursor: "pointer",
  },
  list: {
    flex: 1, overflowY: "auto", padding: "12px 24px",
    display: "flex", flexDirection: "column", gap: "6px",
  },
  empty: { fontSize: "14px", color: "#9ca3af", textAlign: "center", padding: "40px 0" },
  item: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "12px 14px", border: "1px solid #e5e7eb",
    borderRadius: "8px", transition: "all 0.1s",
    userSelect: "none", WebkitUserSelect: "none",
  },
  dragHandle: {
    color: "#d1d5db", fontSize: "16px", cursor: "grab",
    userSelect: "none", touchAction: "none", padding: "8px",
    WebkitUserSelect: "none", WebkitTouchCallout: "none",
    WebkitTapHighlightColor: "transparent",
  },
  checkbox: { width: "16px", height: "16px", cursor: "pointer", flexShrink: 0, accentColor: "#16a34a" },
  itemText: { flex: 1, fontSize: "14px", outline: "none", cursor: "text" },
  deleteBtn: {
    background: "none", border: "none", color: "#d1d5db",
    cursor: "pointer", fontSize: "14px", padding: "2px 4px",
  },
  footer: {
    padding: "16px 24px", borderTop: "1px solid #e5e7eb", flexShrink: 0,
  },
  groceryBtn: {
    width: "100%", padding: "12px", color: "#fff",
    border: "none", borderRadius: "8px", fontSize: "14px",
    fontWeight: "500", cursor: "pointer", transition: "background 0.2s",
  },
};
