import { useState } from "react";
import { parseRecipeFromUrl } from "../services/recipeApi";
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
  inputHint: { fontSize: "12px", color: "#9ca3af", marginTop: "4px" },
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
  emojiBtn: {
    padding: "8px 12px", background: "none",
    border: "1px solid #e5e7eb", borderRadius: "8px",
    cursor: "pointer", fontSize: "18px", flexShrink: 0,
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

      {/* Left drag zone — full height, no symbol */}
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

      {/* Textarea */}
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
          onChange(e.target.value);
        }}
      />

      {/* Delete button */}
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

export default function AddRecipeModal({ onClose, onSave, onImport }) {
  const [activeTab, setActiveTab] = useState("url");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState(null);
  const [modalStep, setModalStep] = useState("input");
  const [parsedRecipe, setParsedRecipe] = useState(null);
  const [selectedEmoji, setSelectedEmoji] = useState("😀");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [importError, setImportError] = useState(null);

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!Array.isArray(imported)) throw new Error("File must contain an array of recipes.");
        onImport(imported);
        onClose();
      } catch (err) {
        setImportError(err.message || "Invalid file format.");
      }
    };
    reader.readAsText(file);
  };

const handleAddFromUrl = async () => {
  if (!url) return;
  setLoading(true);
  setUrlError(null);
  try {
    const parsed = await parseRecipeFromUrl(url);
    // console.log('parsed: ' + parsed.versions[0].instructions)
    const structured = {
      url: parsed.url,
      name: parsed.name,
      image: parsed.image,
      servings: parsed.servings,
      total_time: parsed.total_time,
      tags: [],
      versions: [{
        id: Date.now(),
        tab_name: "Original",
        ingredients: parsed.versions[0].ingredients || [],
        instructions: (parsed.versions[0].instructions || []).map((text, i) => ({
          id: `inst-${Date.now()}-${i}`,
          text,
        })),
      }]
    };
    // console.log('structured: ' + structured.versions[0].instructions)
    setParsedRecipe(structured);
    // setParsedRecipe(parsed);
    setModalStep("review");
  } catch (err) {
    setUrlError(err.message || "Could not parse this URL. Please try another.");
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
        name: selectedEmoji + (parsedRecipe.name || ""),
        versions: parsedRecipe.versions.map(v => ({
        ...v,
        instructions: v.instructions.map(inst =>
            typeof inst === "object" ? inst.text : inst  // ← convert back to plain strings
        ),
        }))
    };
        onSave(finalRecipe);
        onClose();
    };

  const handleBack = () => {
    setModalStep("input");
    setParsedRecipe(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 5 } })
    );

    const handleInstructionDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const instructions = parsedRecipe.versions[0].instructions;
            const oldIndex = instructions.findIndex(inst => inst.id === active.id);
            const newIndex = instructions.findIndex(inst => inst.id === over.id);
            const reordered = arrayMove(instructions, oldIndex, newIndex);
            setParsedRecipe({
            ...parsedRecipe,
            versions: [{ ...parsedRecipe.versions[0], instructions: reordered }]
            });
        }
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
        <button
        style={{ ...styles.tab, ...(activeTab === "import" ? styles.tabActive : {}) }}
        onClick={() => setActiveTab("import")}
        >
        Import JSON
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
                <button
                    onClick={() => {
                        setParsedRecipe({
                        url: "",
                        name: "Test Recipe",
                        image: null,
                        servings: null,
                        total_time: null,
                        versions: [{
                            id: 1,
                            tab_name: "Original",
                            ingredients: [
                            { amount: "2", unit: "cups", item: "flour" },
                            ],
                            instructions: [
                            { id: "inst-1", text: "Step one here" },
                            { id: "inst-2", text: "Step two here" },
                            { id: "inst-3", text: "Step three here" },
                            ],
                        }]
                        });
                        setModalStep("review");
                    }}
                    style={styles.addRowBtn}
                    >
                    Add Manual recipe
                    </button>
            </div>
            )}

            {modalStep === "review" && parsedRecipe.versions[0] && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* {console.log("instructions:", parsedRecipe.versions[0].instructions)} */}
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
                        // Pasta & Rice
                        "🍝","🍜","🍚","🍛","🫕","🥘","🍣","🍱",
                        // Beef
                        "🥩","🍖","🥪","🌮","🌯","🍔","🌭","🥓",
                        // Chicken & Poultry
                        "🍗","🐔","🦃","🥚","🍳",
                        // Seafood
                        "🐟","🐠","🦐","🦞","🦀","🦑","🐙","🦪","🍤","🦈",
                        // Vegetables
                        "🥦","🥕","🧄","🧅","🫑","🌽","🍆","🥑","🥗","🥬","🍅","🫛","🥔","🌿","🫚",
                        // Bread & Dough
                        "🍕","🫓","🥨","🧀","🥞","🧇","🥐","🍞","🥖","🫔","🥙",
                        // Eggs & Dairy
                        "🧈","🥛",
                        // Soup & Stews
                        "🍲","🥣",
                        // Snacks & Sides
                        "🍟","🧆","🥜","🌰","🍿","🧂","🥫",
                        // Sweet
                        "🍰","🎂","🧁","🍮","🍩","🍪","🍫","🍬","🍭","🍧","🍨","🥧",
                        // Fruit
                        "🍓","🫐","🍋","🍊","🍇","🍉","🍑","🍒","🍍","🥭","🍌","🍎","🍐","🍏",
                        // Drinks
                        "☕","🍵","🧋","🥤","🧃","🍺","🍷","🥂","🍾","🧊",
                        // Japanese & Asian
                        "🍙","🍘","🍥","🥮","🍡","🫙",
                        // Condiments & Other
                        "🍯","🧴","🫗",
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
                <p>
                    <p style={styles.inputLabel}>Total Time (mins) </p>
                    <input
                    style={styles.input}
                    value={parsedRecipe.total_time}
                    onChange={e => setParsedRecipe({ ...parsedRecipe, total_time: e.target.value })}
                    />
                </p>
                )}

                {parsedRecipe.servings && (
                <p>
                    <p style={styles.inputLabel}>Servings</p>
                    <input
                    style={styles.input}
                    value={parsedRecipe.servings}
                    onChange={e => setParsedRecipe({ ...parsedRecipe, servings: e.target.value })}
                    />
                </p>
                )}

                <p style={styles.inputLabel}>Tags</p>
                    <TagInput
                    tags={parsedRecipe.tags || []}
                    onChange={tags => setParsedRecipe({ ...parsedRecipe, tags })}
                    />

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
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleInstructionDragEnd}
                    >
                    <SortableContext
                        items={parsedRecipe.versions[0].instructions.map(inst => inst.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {parsedRecipe.versions[0].instructions.map((instruction, i) => (
                        <SortableInstruction
                            key={instruction.id}
                            id={instruction.id}
                            instruction={instruction.text || ""}
                            index={i}
                            onChange={value => {
                                const updated = parsedRecipe.versions[0].instructions.map(inst =>
                                    inst.id === instruction.id ? { ...inst, text: value } : inst
                                );
                                setParsedRecipe({
                                    ...parsedRecipe,
                                    versions: [{ ...parsedRecipe.versions[0], instructions: updated }]
                                });
                                }}
                                onDelete={() => {
                                const updated = parsedRecipe.versions[0].instructions.filter(inst => inst.id !== instruction.id);
                                setParsedRecipe({
                                    ...parsedRecipe,
                                    versions: [{ ...parsedRecipe.versions[0], instructions: updated }]
                                });
                                }}
                        />
                        ))}
                    </SortableContext>  
                </DndContext>
                <button
                        onMouseDown={e => e.preventDefault()}
                style={styles.addRowBtn}
                onClick={() => setParsedRecipe({
                    ...parsedRecipe,
                    versions: [{
                        ...parsedRecipe.versions[0],
                        instructions: [
                        ...parsedRecipe.versions[0].instructions,
                        { id: `inst-${Date.now()}`, text: "" }  // ← object not string
                        ]
                    }]
                    })}
                >
                + Add step
                </button>

                <p style={{ ...styles.inputLabel, marginTop: "20px" }}>Notes</p>
                <textarea
                    style={{ ...styles.input, resize: "vertical", minHeight: "80px" }}
                    placeholder="Personal tweaks, tips, substitutions..."
                    value={parsedRecipe.versions[0].notes || ""}
                    onChange={e => setParsedRecipe({
                        ...parsedRecipe,
                        versions: [{ ...parsedRecipe.versions[0], notes: e.target.value }]
                    })}
                />

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

        {activeTab === "import" && (
        <div>
            <p style={styles.inputLabel}>Import from JSON file</p>
            <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>
            Select a <strong>cookmark-recipes.json</strong> file you previously exported. This will merge the recipes into your collection.
            </p>
            <label style={{
            display: "block", border: "2px dashed #e5e7eb", borderRadius: "10px",
            padding: "32px", textAlign: "center", cursor: "pointer",
            }}>
            <input type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
            <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Tap to choose file</p>
            <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "6px" }}>
                .json files only
            </p>
            </label>
            {importError && (
            <p style={{ fontSize: "13px", color: "#dc2626", marginTop: "12px" }}>{importError}</p>
            )}
        </div>
        )}
    </div>
    </div>
</div>
  )
};