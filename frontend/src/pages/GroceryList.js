import { useState, useEffect } from "react";

export default function GroceryList() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("groceryList");
    return saved ? JSON.parse(saved) : [];
  });
  const [inputValue, setInputValue] = useState("");
  const [dragIndex, setDragIndex] = useState(null);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("groceryList", JSON.stringify(items));
  }, [items]);

  // Add item
  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setItems(prev => [...prev, { id: Date.now(), text: trimmed, checked: false }]);
    setInputValue("");
  };

  // Handle enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAdd();
  };

    // Toggle checked
    const toggleCheck = (id) => {
        setItems(prev => {
            const updated = prev.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
            );
            const unchecked = updated.filter(item => !item.checked);
            const checked = updated.filter(item => item.checked);
            return [...unchecked, ...checked];
        });
    };

  // Delete single item
  const deleteItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Clear all
  const clearAll = () => {
    if (window.confirm("Clear all items?")) setItems([]);
  };

  // Clear checked
  const clearChecked = () => {
    setItems(prev => prev.filter(item => !item.checked));
  };

  // Drag handlers
  const handleDragStart = (i) => setDragIndex(i);

  const handleDragOver = (e, i) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) return;
    const updated = [...items];
    const dragged = updated.splice(dragIndex, 1)[0];
    updated.splice(i, 0, dragged);
    setDragIndex(i);
    setItems(updated);
  };

  const handleDragEnd = () => setDragIndex(null);

  const checkedCount = items.filter(i => i.checked).length;

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Grocery List</h2>
          <p style={styles.count}>{items.length} items · {checkedCount} checked</p>
        </div>
        <div style={styles.headerBtns}>
          <button
            style={styles.clearBtn}
            onClick={clearChecked}
            disabled={checkedCount === 0}
          >
            Clear checked
          </button>
          <button
            style={{ ...styles.clearBtn, ...styles.clearAllBtn }}
            onClick={clearAll}
            disabled={items.length === 0}
          >
            Clear all
          </button>
        </div>
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
        {items.length === 0 && (
          <p style={styles.empty}>No items yet — add something above.</p>
        )}
        {items.map((item, i) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(i)}
            // draggable={dragIndex === i}
            onDragOver={e => handleDragOver(e, i)}
            onDragEnd={handleDragEnd}
            style={{
              ...styles.item,
              opacity: dragIndex === i ? 0.5 : 1,
              background: item.checked ? "#f9fafb" : "#fff",
            }}
          >
            {/* Drag handle */}
            <span
                style={styles.dragHandle}
                // onMouseDown={() => setDragIndex(i)}
                // onMouseUp={() => setDragIndex(null)}
                // draggable
                // onDragStart={() => handleDragStart(i)}
            >
            ⠿
            </span>

            {/* Checkbox */}
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggleCheck(item.id)}
              style={styles.checkbox}
            />

            {/* Text */}
            <span 
                contentEditable
                suppressContentEditableWarning
                onMouseDown={e => e.currentTarget.closest('[draggable]').setAttribute('draggable', false)}
                onDragStart={e => e.stopPropagation()}
                onBlur={e => {
                    const updated = items.map(i =>
                    i.id === item.id ? { ...i, text: e.target.innerText } : i
                    );
                    setItems(updated);
                }}
                style={{
                ...styles.itemText,
                textDecoration: item.checked ? "line-through" : "none",
                color: item.checked ? "#111827" : "#111827",
            }}>
              {item.text}
            </span>

            {/* Delete */}
            <button
              style={styles.deleteBtn}
              onClick={() => deleteItem(item.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}

const styles = {
  page: { maxWidth: "600px", margin: "48px auto", padding: "0 24px" },
  header: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: "24px",
  },
  title: { fontSize: "22px", fontWeight: "500", marginBottom: "4px" },
  count: { fontSize: "13px", color: "#9ca3af" },
  headerBtns: { display: "flex", gap: "8px" },
  clearBtn: {
    padding: "7px 14px", background: "none",
    border: "1px solid #e5e7eb", borderRadius: "8px",
    fontSize: "13px", color: "#6b7280", cursor: "pointer",
  },
  clearAllBtn: { color: "#dc2626", borderColor: "#fca5a5" },
  inputRow: { display: "flex", gap: "8px", marginBottom: "20px" },
  input: {
    flex: 1, padding: "10px 14px", border: "1px solid #e5e7eb",
    borderRadius: "8px", fontSize: "14px", outline: "none", fontFamily: "inherit",
  },
  addBtn: {
    padding: "10px 20px", background: "#111827", color: "#fff",
    border: "none", borderRadius: "8px", fontSize: "14px",
    fontWeight: "500", cursor: "pointer",
  },
  list: { display: "flex", flexDirection: "column", gap: "6px" },
  empty: { fontSize: "14px", color: "#9ca3af", textAlign: "center", padding: "40px 0" },
  item: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "12px 14px", border: "1px solid #e5e7eb",
    borderRadius: "8px", cursor: "grab", transition: "background 0.15s",
  },
  dragHandle: { color: "#d1d5db", fontSize: "16px", cursor: "grab", userSelect: "none" },
  checkbox: { width: "16px", height: "16px", cursor: "pointer", flexShrink: 0 },
  itemText: { flex: 1, fontSize: "14px", outline: "none",cursor: "text", },
  deleteBtn: {
    background: "none", border: "none", color: "#d1d5db",
    cursor: "pointer", fontSize: "14px", padding: "2px 4px",
  },
};