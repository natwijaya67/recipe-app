import {useState} from "react";

const TAG_COLORS = [
  { bg: "#fef3c7", text: "#000000" },
  { bg: "#dbeafe", text: "#000000" },
  { bg: "#dcfce7", text: "#000000" },
  { bg: "#fce7f3", text: "#000000" },
  { bg: "#ede9fe", text: "#000000" },
  { bg: "#ffedd5", text: "#000000" },
  { bg: "#cffafe", text: "#000000" },
  { bg: "#f1f5f9", text: "#000000" },
];

function getTagColor(tag) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export function TagChip({ tag, onRemove }) {
  const color = getTagColor(tag);
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "500",
      background: color.bg,
      color: color.text,
      whiteSpace: "nowrap",
    }}>
      {tag}
      {onRemove && (
        <button
          onMouseDown={e => e.preventDefault()}
          onClick={() => onRemove(tag)}
          style={{
            background: "none", border: "none",
            cursor: "pointer", color: color.text,
            fontSize: "12px", padding: "0 2px",
            lineHeight: 1, opacity: 0.7,
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}

export default function TagInput({ tags = [], onChange, styles }) {
  const [input, setInput] = useState("");

  const addTag = (value) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || tags.includes(trimmed)) return;
    onChange([...tags, trimmed]);
    setInput("");
  };

  const removeTag = (tag) => {
    onChange(tags.filter(t => t !== tag));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div>
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        padding: "8px",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        minHeight: "44px",
        alignItems: "center",
        background: "#fff",
      }}>
        {tags.map(tag => (
          <TagChip key={tag} tag={tag} onRemove={removeTag} />
        ))}
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (input) addTag(input); }}
          placeholder={tags.length === 0 ? "Add tags... (press Enter)" : ""}
          style={{
            border: "none", outline: "none",
            fontSize: "13px", flex: 1,
            minWidth: "100px", padding: "2px 4px",
            fontFamily: "inherit", background: "transparent",
          }}
        />
      </div>
      <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>
        Press Enter or comma to add a tag
      </p>
    </div>
  );
}