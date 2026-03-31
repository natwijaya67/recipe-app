import { useState } from "react";
import { parseRecipeFromUrl } from "../services/recipeApi";

const isMobile = window.innerWidth <= 768;

export default function AddRecipeModal({ onClose, onSave, styles }) {
  const [activeTab, setActiveTab] = useState("url");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState(null);
  const [modalStep, setModalStep] = useState("input");
  const [parsedRecipe, setParsedRecipe] = useState(null);
  const [selectedEmoji, setSelectedEmoji] = useState("😀");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleAddFromUrl = async () => {
    if (!url) return;
    setLoading(true);
    setUrlError(null);
    try {
      const parsed = await parseRecipeFromUrl(url);
      setParsedRecipe(parsed);
      setModalStep("review");
    } catch (err) {
      setUrlError("Could not parse this URL. Please try another.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!parsedRecipe.name || parsedRecipe.name.trim() === "") {
      alert("Please add a recipe name before saving.");
      return;
    }
    const finalRecipe = {
      ...parsedRecipe,
      name: selectedEmoji + (parsedRecipe.name || "")
    };
    onSave(finalRecipe);
    onClose();
  };

  const handleBack = () => {
    setModalStep("input");
    setParsedRecipe(null);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
    <div style={styles.modal} onClick={e => e.stopPropagation()}>

    {/* Modal Header */}
    <div style={styles.modalHeader}>
        <h3 style={styles.modalTitle}>Add Recipe</h3>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>
    </div>

    {/* Tabs */}
    <div style={styles.tabs}>
        <button
        style={{ ...styles.tab, ...(activeTab === "url" ? styles.tabActive : {}) }}
        onClick={() => setActiveTab("url")}
        >
        Paste a URL
        </button>
    </div>

    {/* Tab Content */}
    <div style={styles.modalBody}>

        {activeTab === "url" && (
        <div>
            {modalStep === "input" && (
            <div>
                <p style={styles.inputLabel}>Recipe URL</p>
                <input
                type="text"
                placeholder="https://www.allrecipes.com/recipe/..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                style={styles.input}
                />
                <p style={styles.inputHint}>Paste a link from any recipe website</p>
                {urlError && (
                <p style={{ fontSize: "13px", color: "#dc2626", marginTop: "8px" }}>
                    {urlError}
                </p>
                )}
                <button
                style={{ ...styles.submitBtn, opacity: url && !loading ? 1 : 0.5 }}
                onClick={handleAddFromUrl}
                disabled={!url || loading}
                >
                {loading ? "Parsing..." : "Parse Recipe"}
                </button>
            </div>
            )}

            {modalStep === "review" && parsedRecipe.versions[0] && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                <p style={styles.inputLabel}>Recipe Name</p>
                <div style={{ position: "relative", display: "flex", gap: "8px" }}>
                <button
                style={styles.emojiBtn}
                onClick={() => setShowEmojiPicker(prev => !prev)}
                >
                {selectedEmoji}
                </button>
                <input
                style={{ ...styles.input, flex: 1 }}
                value={parsedRecipe.name || ""}
                onChange={e => setParsedRecipe({ ...parsedRecipe, name: e.target.value })}
                />
                {showEmojiPicker && (
                <div style={{
                    position: "absolute", top: "44px", left: 0, zIndex: 1000,
                    background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px",
                    padding: "12px", display: "grid", gridTemplateColumns: "repeat(8, 1fr)",
                    gap: "4px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", width: "280px"
                }}>
                    {[
                    "🍝","🍜","🍲","🍛","🍣","🍱","🍤","🍙",
                    "🥗","🥘","🫕","🍚","🍖","🍗","🥩","🥚",
                    "🧆","🥙","🌮","🌯","🫔","🥪","🍔","🍟",
                    "🍕","🫓","🥨","🧀","🥞","🧇","🥓","🌭",
                    "🍜","🍝","🍠","🍢","🍡","🍧","🍨","🍦",
                    "🥧","🧁","🍰","🎂","🍮","🍭","🍬","🍫",
                    "🍿","🍩","🍪","🌰","🥜","🍯","🧃","🥤",
                    "🫖","☕","🍵","🧋","🍺","🍷","🥂","🍾",
                    ].map(emoji => (
                    <button
                        onMouseDown={e => e.preventDefault()}
                        key={emoji}
                        onClick={() => {
                        setSelectedEmoji(emoji)
                        setShowEmojiPicker(false);
                        }}
                        style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: "20px", padding: "4px", borderRadius: "6px",
                        lineHeight: 1,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                        {emoji}
                    </button>
                    ))}
                </div>
                )}
            </div>

                {parsedRecipe.total_time && (
                <>
                    <p style={styles.inputLabel}>Total Time (mins)</p>
                    <input
                    style={styles.input}
                    value={parsedRecipe.total_time}
                    onChange={e => setParsedRecipe({ ...parsedRecipe, total_time: e.target.value })}
                    />
                </>
                )}

                {parsedRecipe.servings && (
                <>
                    <p style={styles.inputLabel}>Servings</p>
                    <input
                    style={styles.input}
                    value={parsedRecipe.servings}
                    onChange={e => setParsedRecipe({ ...parsedRecipe, servings: e.target.value })}
                    />
                </>
                )}

                <p style={styles.inputLabel}>Ingredients</p>
                {parsedRecipe.versions[0].ingredients.map((ing, i) => (
                <div key={i} style={{ 
                    display: "flex", 
                    flexDirection: isMobile ? "column" : "row",  // ← stack on mobile
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
                        const updated = [...parsedRecipe.versions[0].ingredients];
                        updated[i] = { ...updated[i], amount: e.target.value };
                        setParsedRecipe({
                        ...parsedRecipe,
                        versions: [{ ...parsedRecipe.versions[0], ingredients: updated }]
                        });
                    }}
                    />
                    {isMobile && <p style={{ fontSize: "12px", color: "#9ca3af", margin: "0" }}>Unit</p>}
                    <input
                    style={{ ...styles.input, width: isMobile ? "100%" : "80px" }}
                    placeholder="unit"
                    value={ing.unit || ""}
                    onChange={e => {
                        const updated = [...parsedRecipe.versions[0].ingredients];
                        updated[i] = { ...updated[i], unit: e.target.value };
                        setParsedRecipe({
                        ...parsedRecipe,
                        versions: [{ ...parsedRecipe.versions[0], ingredients: updated }]
                        });
                    }}
                    />
                    {isMobile && <p style={{ fontSize: "12px", color: "#9ca3af", margin: "0" }}>Ingredient</p>}
                    <input
                    style={{ ...styles.input, flex: 1 }}
                    placeholder="ingredient"
                    value={ing.item || ""}
                    onChange={e => {
                        const updated = [...parsedRecipe.versions[0].ingredients];
                        updated[i] = { ...updated[i], item: e.target.value };
                        setParsedRecipe({
                        ...parsedRecipe,
                        versions: [{ ...parsedRecipe.versions[0], ingredients: updated }]
                        });
                    }}
                    />
                    <button
                        onMouseDown={e => e.preventDefault()}
                    onClick={() => {
                        const updated = parsedRecipe.versions[0].ingredients.filter((_, idx) => idx !== i);
                        setParsedRecipe({
                        ...parsedRecipe,
                        versions: [{ ...parsedRecipe.versions[0], ingredients: updated }]
                        });
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
                <button
                        onMouseDown={e => e.preventDefault()}
                style={styles.addRowBtn}
                onClick={() => setParsedRecipe({
                    ...parsedRecipe,
                    ingredients: [...parsedRecipe.versions[0].ingredients, { amount: "", unit: "", item: "" }]
                })}
                >
                + Add ingredient
                </button>

                <p style={styles.inputLabel}>Instructions</p>
                {parsedRecipe.versions[0].instructions.map((instruction, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <span style={{ paddingTop: "10px", fontSize: "13px", color: "#9ca3af", minWidth: "20px" }}>
                        {i + 1}.
                    </span>
                    <textarea
                        style={{
                        ...styles.input,
                        resize: "none",
                        overflow: "hidden",
                        minHeight: "120px",
                        flex: 1,
                        }}
                        value={instruction}
                        onChange={e => {
                        e.target.style.height = "auto";
                        e.target.style.height = e.target.scrollHeight + "px";
                        const updated = [...parsedRecipe.versions[0].instructions];
                        updated[i] = e.target.value;
                        setParsedRecipe({
                            ...parsedRecipe,
                            versions: [{ ...parsedRecipe.versions[0], instructions: updated }]
                        });
                        }}
                    />
                    <button
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                        const updated = parsedRecipe.versions[0].instructions.filter((_, idx) => idx !== i);
                        setParsedRecipe({
                            ...parsedRecipe,
                            versions: [{ ...parsedRecipe.versions[0], instructions: updated }]
                        });
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
                <button
                        onMouseDown={e => e.preventDefault()}
                style={styles.addRowBtn}
                onClick={() => 
                    setParsedRecipe({
                    ...parsedRecipe,
                    versions: [{...parsedRecipe.versions[0], instructions: ""}]
                })}
                >
                + Add step
                </button>

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
                        onMouseDown={e => e.preventDefault()}
                        style={{ ...styles.submitBtn, background: "#f3f4f6", color: "#111827", marginTop: 0 }}
                        onClick={handleBack}
                    >
                        ← Back
                    </button>
                    <button
                        onMouseDown={e => e.preventDefault()}
                        style={{ ...styles.submitBtn, marginTop: 0 }}
                        onClick={() => handleConfirm(selectedEmoji)}
                    >
                        Save to Collection
                    </button>
                    </div>
            </div>
            )}
        </div>
        )}
    </div>
    </div>
</div>
  )
};