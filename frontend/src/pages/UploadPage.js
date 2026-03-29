import { useState, useRef } from "react";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f || f.type !== "application/pdf") return setError("PDF files only");
    if (f.size > 10 * 1024 * 1024) return setError("Max file size is 10 MB");
    setError(null);
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const handleParse = async () => {
    // TODO: extract text with PDF.js, then call Claude API
  };

return (
    <div style={styles.page}>

      {/* Drop zone */}
      <div
        style={styles.dropZone}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current.click()}
      >
        <p style={styles.dropTitle}>Drop your recipe PDF here</p>
        <p style={styles.dropSub}>or click to browse</p>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        accept=".pdf"
        ref={inputRef}
        style={{ display: "none" }}
        onChange={e => handleFile(e.target.files[0])}
      />

      {/* Error message */}
      {error && <p style={styles.error}>{error}</p>}

      {/* File pill */}
      {file && (
        <div style={styles.pill}>
          📎 {file.name} ({(file.size / 1024).toFixed(0)} KB)
          <button onClick={() => { setFile(null); setError(null); }} style={styles.remove}>✕</button>
        </div>
      )}

      {/* Parse button */}
      {file && (
        <button style={styles.parseBtn} onClick={handleParse}>
          Parse Recipe →
        </button>
      )}

    </div>
  );
}

const styles = {
  page: {
    maxWidth: "560px",
    margin: "60px auto",
    padding: "0 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  dropZone: {
    width: "100%",
    border: "1.5px dashed #d1d5db",
    borderRadius: "12px",
    padding: "48px 24px",
    textAlign: "center",
    cursor: "pointer",
    background: "#f9fafb",
  },
  dropTitle: { fontSize: "15px", fontWeight: "500", marginBottom: "6px" },
  dropSub: { fontSize: "13px", color: "#6b7280" },
  error: { fontSize: "13px", color: "#dc2626" },
  pill: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "10px 16px", borderRadius: "8px",
    background: "#f3f4f6", fontSize: "13px", width: "100%",
  },
  remove: {
    marginLeft: "auto", background: "none",
    border: "none", cursor: "pointer", color: "#9ca3af",
  },
  parseBtn: {
    width: "100%", padding: "12px",
    background: "#111827", color: "#fff",
    border: "none", borderRadius: "8px",
    fontSize: "14px", fontWeight: "500", cursor: "pointer",
  },
};