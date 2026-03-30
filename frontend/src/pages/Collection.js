import { useState, useEffect } from "react";
import { parseRecipeFromUrl } from "../services/recipeApi";
// import EmojiPicker from "emoji-picker-react";
const isMobile = window.innerWidth <= 768;

export default function Collection() {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState("url");
  const [url, setUrl] = useState("");
  // const [manualRecipe, setManualRecipe] = useState({
  //   name: "",
  //   ingredients: "",
  //   instructions: "",
  // });
  const [recipes, setRecipes] = useState(() => {
    const saved = localStorage.getItem("recipes");
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState(null);
  const [modalStep, setModalStep] = useState("input");
  const [parsedRecipe, setParsedRecipe] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);      
  const [editingRecipeIndex, setEditingRecipeIndex] = useState(null); 
  const [activeVersionId, setActiveVersionId] = useState(null);
  const [activePopupVersionId, setActivePopupVersionId] = useState(null); 
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState("😀");

  useEffect(() => {
    localStorage.setItem("recipes", JSON.stringify(recipes));
  }, [recipes]);

  const handleAddFromUrl = async () => {
    if (!url) return;
    setLoading(true);
    setUrlError(null);

    try {
      const parsed = await parseRecipeFromUrl(url);
      // setRecipes(prev => [...prev, parsed]);

      setParsedRecipe(parsed);
      setModalStep("review");
    } catch (err) {
      setUrlError("Could not parse this URL. Please try another.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = (emoji = null) => {
    const finalRecipe = emoji
      ? { ...parsedRecipe, name: emoji + ' ' + (parsedRecipe.name || "") }
      : parsedRecipe;
    setRecipes(prev => [...prev, finalRecipe]);
    setShowAddModal(false);
    setModalStep("input");
    setParsedRecipe(null);
    setUrl("");
  };

  const handleBack = () => {
    setModalStep("input");
    setParsedRecipe(null);
  };

  // const handleAddManual = () => {
  //   // TODO: save manual recipe
  //   console.log("Manual recipe:", manualRecipe);
  //   setShowAddModal(false);
  //   setManualRecipe({ name: "", ingredients: "", instructions: "" });
  // };

  const addToGroceries = (recipe) => {
    const existing = JSON.parse(localStorage.getItem("groceryList") || "[]");
    const version = recipe.versions?.find(v => v.id === activePopupVersionId) || recipe.versions?.[0];
    const ingredients = version?.ingredients || [];
    const newItems = ingredients.map(ing => ({
      id: Date.now() + Math.random(),
      text: [ing.item].filter(Boolean).join(" "),
      checked: false,
    }));
    localStorage.setItem("groceryList", JSON.stringify([...existing, ...newItems]));
    alert(`Added ${newItems.length} ingredients to your grocery list!`);
  };

  const deleteCard = (e, i) => {
    e.stopPropagation(); // prevent opening the popup
    setRecipes(prev => prev.filter((_, idx) => idx !== i));
  };

  const openEdit = (e, recipe, i) => {
  e.stopPropagation();
  setEditingRecipe(JSON.parse(JSON.stringify(recipe))); // deep copy
  setEditingRecipeIndex(i);
  setActiveVersionId(recipe.versions[0].id);
  };

  const closeEdit = () => {
    setEditingRecipe(null);
    setEditingRecipeIndex(null);
    setActiveVersionId(null);
  };

  const saveEdit = () => {
    const updated = [...recipes];
    updated[editingRecipeIndex] = editingRecipe;
    setRecipes(updated);
    closeEdit();
  };

  const activeVersion = editingRecipe?.versions.find(v => v.id === activeVersionId);

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

  const scaleAmount = (amount) => {
    if (!amount) return null;
    const num = parseFloat(amount);
    if (isNaN(num)) return amount; // return as-is if not a number (e.g. "½")
    const scaled = num * servingMultiplier;
    // Show clean decimals
    return scaled % 1 === 0 ? String(scaled) : scaled.toFixed(2).replace(/\.?0+$/, "");
  };

  return (
    <div style={styles.page}>

      {/* Page Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>My Collection</h2>
          <p style={styles.count}>{recipes.length} recipes</p>
        </div>
        <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>
          + Add Recipe
        </button>
      </div>

      {/* Recipe Grid */}
      <div style={styles.grid}>
        {recipes.map((recipe, i) => (
          <div
            key={i}
            style={{...styles.card, position: "relative"}}
            onClick={() => {
              setSelectedRecipe(recipe);
              setActivePopupVersionId(recipe.versions[0].id);
              setServingMultiplier(1);
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#9ca3af"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
          >
            <button
              style={styles.deleteCardBtn}
              onClick={e => deleteCard(e, i)}
            >
              ✕
            </button>
            {/* {recipe.image && (
              <img src={recipe.image} alt={recipe.name} style={styles.cardImage} />
            )} */}
            <div style={styles.cardBody}>
              <p style={styles.cardName}>{recipe.name}</p>
              <p style={styles.cardMeta}>
                {recipe.total_time && `${recipe.total_time} mins · `}
                {recipe.versions?.[0]?.ingredients?.length || 0} ingredients
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recipe Detail Popup */}
      {selectedRecipe && (
        <div style={styles.overlay} onClick={() => setSelectedRecipe(null)}>
          <div style={styles.popup} onClick={e => e.stopPropagation()}>
            <div style={styles.popupHeader}>
              <div>
                <h2 style={styles.popupTitle}>{selectedRecipe.name}</h2>
                <a style={styles.popupMeta} href={selectedRecipe.url} target="_blank" rel="noreferrer">
                  🔗 Link to original recipe webpage
                </a>
                <p style={styles.popupMeta}>
                  {selectedRecipe.total_time && `${selectedRecipe.total_time} mins · `}
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
                    {selectedRecipe.servings && ` (original: ${selectedRecipe.servings})`}
                  {selectedRecipe.versions?.[0]?.ingredients?.length || 0}  ingredients
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  style={styles.groceryBtn}
                  onClick={() => addToGroceries(selectedRecipe)}
                >
                  + Add to Grocery List
                </button>
                <button
                  style={styles.groceryBtn}
                  onClick={e => {
                    const i = recipes.findIndex(r => r.url === selectedRecipe.url);
                    openEdit(e, selectedRecipe, i);
                    setSelectedRecipe(null); // close the detail popup
                  }}
                  >
                    Edit
                </button>
              <button style={styles.closeBtn} onClick={() => setSelectedRecipe(null)}>✕</button>
            </div>
            </div>

            {/* Version tabs */}
            {selectedRecipe.versions?.length > 1 && (
              <div style={styles.tabs}>
                {selectedRecipe.versions.map(v => (
                  <button
                    key={v.id}
                    style={{ ...styles.tab, ...(v.id === activePopupVersionId ? styles.tabActive : {}) }}
                    onClick={() => setActivePopupVersionId(v.id)}
                  >
                    {v.tab_name}
                  </button>
                ))}
              </div>
            )}

            <div style={styles.popupBody}>
              {/* <div style={styles.section}>
                <p style={styles.sectionTitle}>Ingredients</p>
                {selectedRecipe.versions?.[0]?.ingredients.map((ing, i) => (
                  <div key={i} style={styles.ingredientRow}>
                    <span style={styles.ingredientAmount}>
                      {[ing.amount, ing.unit].filter(Boolean).join(" ") || "—"}
                    </span>
                    <span style={styles.ingredientItem}>{ing.item}</span>
                  </div>
                ))}
              </div>
              <div style={styles.section}>
                <p style={styles.sectionTitle}>Instructions</p>
                {selectedRecipe.versions?.[0]?.instructions.map((step, i) => (
                  <p key={i} style={styles.step}>{i + 1}. {step}</p>
                ))}
              </div> */}
              {(() => {
                const version = selectedRecipe.versions?.find(v => v.id === activePopupVersionId) 
                  || selectedRecipe.versions?.[0];
                return (
                  <>
                    <div style={styles.section}>
                      <p style={styles.sectionTitle}>Ingredients</p>
                      {version.ingredients.map((ing, i) => (
                        <div key={i} style={styles.ingredientRow}>
                          <span style={styles.ingredientAmount}>
                            {[scaleAmount(ing.amount), ing.unit].filter(Boolean).join(" ") || "—"}
                          </span>
                          <span style={styles.ingredientItem}>{ing.item}</span>
                        </div>
                      ))}
                    </div>
                    <div style={styles.section}>
                      <p style={styles.sectionTitle}>Instructions</p>
                      {version.instructions.map((step, i) => (
                        <p key={i} style={styles.step}>{i + 1}. {step}</p>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {editingRecipe && activeVersion && (
        <div style={styles.overlay} onClick={closeEdit}>
          <div style={{ ...styles.modal, maxWidth: "620px", maxHeight: "85vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>

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
                  <div key={i} style={{ display: "flex", gap: "8px" }}>
                    <input
                      style={{ ...styles.input, width: "80px" }}
                      placeholder="amt"
                      value={ing.amount || ""}
                      onChange={e => {
                        const updated = [...activeVersion.ingredients];
                        updated[i] = { ...updated[i], amount: e.target.value };
                        updateActiveVersion({ ingredients: updated });
                      }}
                    />
                    <input
                      style={{ ...styles.input, width: "80px" }}
                      placeholder="unit"
                      value={ing.unit || ""}
                      onChange={e => {
                        const updated = [...activeVersion.ingredients];
                        updated[i] = { ...updated[i], unit: e.target.value };
                        updateActiveVersion({ ingredients: updated });
                      }}
                    />
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
                      style={styles.removeRowBtn}
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
                      style={{ ...styles.input, resize: "vertical", flex: 1 }}
                      value={instruction}
                      onChange={e => {
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
                      style={styles.removeRowBtn}
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
              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                <button
                  style={{ ...styles.submitBtn, background: "#f3f4f6", color: "#111827", marginTop: 0 }}
                  onClick={closeEdit}
                >
                  Cancel
                </button>
                <button
                  style={{ ...styles.submitBtn, marginTop: 0 }}
                  onClick={saveEdit}
                >
                  Save Changes
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Add Recipe Modal */}
      {showAddModal && (
        <div style={styles.overlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add Recipe</h3>
              <button style={styles.closeBtn} onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            {/* Tabs */}
            <div style={styles.tabs}>
              <button
                style={{ ...styles.tab, ...(activeTab === "url" ? styles.tabActive : {}) }}
                onClick={() => setActiveTab("url")}
              >
                Paste a URL
              </button>
              {/* <button
                style={{ ...styles.tab, ...(activeTab === "manual" ? styles.tabActive : {}) }}
                onClick={() => setActiveTab("manual")}
              >
                Type manually
              </button> */}
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
                              style={{ ...styles.submitBtn, background: "#f3f4f6", color: "#111827", marginTop: 0 }}
                              onClick={handleBack}
                            >
                              ← Back
                            </button>
                            <button
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

              

              {/* {activeTab === "manual" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <p style={styles.inputLabel}>Recipe Name</p>
                    <input
                      type="text"
                      placeholder="e.g. Grandma's Lasagna"
                      value={manualRecipe.name}
                      onChange={e => setManualRecipe({ ...manualRecipe, name: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div>
                    <p style={styles.inputLabel}>Ingredients</p>
                    <textarea
                      placeholder={"2 cups flour\n1 tsp salt\n3 eggs"}
                      value={manualRecipe.ingredients}
                      onChange={e => setManualRecipe({ ...manualRecipe, ingredients: e.target.value })}
                      style={{ ...styles.input, height: "100px", resize: "vertical" }}
                    />
                    <p style={styles.inputHint}>One ingredient per line</p>
                  </div>
                  <div>
                    <p style={styles.inputLabel}>Instructions</p>
                    <textarea
                      placeholder={"Mix the flour and salt.\nAdd eggs and stir."}
                      value={manualRecipe.instructions}
                      onChange={e => setManualRecipe({ ...manualRecipe, instructions: e.target.value })}
                      style={{ ...styles.input, height: "120px", resize: "vertical" }}
                    />
                    <p style={styles.inputHint}>One step per line</p>
                  </div>
                  <button
                    style={{ ...styles.submitBtn, opacity: manualRecipe.name ? 1 : 0.5 }}
                    onClick={handleAddManual}
                    disabled={!manualRecipe.name}
                  >
                    Add Recipe
                  </button>
                </div>
              )} */}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  page: { maxWidth: "900px", margin: "48px auto", padding: "0 24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" },
  title: { fontSize: "22px", fontWeight: "500", marginBottom: "4px" },
  count: { fontSize: "13px", color: "#9ca3af" },
  addBtn: {
    padding: "8px 16px", background: "#111827", color: "#fff",
    border: "none", borderRadius: "8px", fontSize: "13px",
    fontWeight: "500", cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "16px",
  },
  card: {
    border: "1px solid #e5e7eb", borderRadius: "10px",
    overflow: "hidden", cursor: "pointer", background: "#fff",
    transition: "border-color 0.15s",
  },
  cardImage: { width: "100%", height: "130px", objectFit: "cover" },
  cardBody: { padding: "12px" },
  cardName: { fontSize: "14px", fontWeight: "500", marginBottom: "4px" },
  cardMeta: { fontSize: "12px", color: "#9ca3af" },
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
  closeBtn: {
    background: "none", border: "none", fontSize: "18px",
    cursor: "pointer", color: "#9ca3af", padding: "4px 8px",
  },
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
  // modal: {
  //   background: "#fff", borderRadius: "12px", width: "100%",
  //   maxWidth: "480px", margin: "0 16px", overflow: "hidden",
  //   maxHeight: "85vh",        // ← add this
  //   overflowY: "auto",        // ← add this
  // },
  modal: {
    background: "#fff",
    borderRadius: isMobile ? "0" : "12px",
    width: "100%",
    maxWidth: isMobile ? "100%" : "480px",
    margin: isMobile ? "0" : "0 16px",
    height: isMobile ? "100%" : "auto",
    maxHeight: isMobile ? "100%" : "85vh",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "20px 24px", borderBottom: "1px solid #e5e7eb",
  },
  modalTitle: { fontSize: "16px", fontWeight: "500" },
  tabs: {
    display: "flex", borderBottom: "1px solid #e5e7eb",
    padding: "0 24px",
  },
  tab: {
    padding: "12px 16px", background: "none", border: "none",
    fontSize: "13px", color: "#9ca3af", cursor: "pointer",
    borderBottom: "2px solid transparent", marginBottom: "-1px",
  },
  tabActive: { color: "#000", borderBottomColor: "#000", fontWeight: 'bold' },
  modalBody: { padding: "24px" },
  inputLabel: { fontSize: "13px", fontWeight: "500", marginBottom: "6px", color: "#374151" },
  // input: {
  //   width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb",
  //   borderRadius: "8px", fontSize: "14px", outline: "none",
  //   fontFamily: "inherit", boxSizing: "border-box",
  // },
  input: {
  width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb",
  borderRadius: "8px", fontSize: "16px", outline: "none",  // ← 16px prevents iOS zoom
  fontFamily: "inherit", boxSizing: "border-box",
},
  inputHint: { fontSize: "12px", color: "#9ca3af", marginTop: "4px" },
  submitBtn: {
    width: "100%", marginTop: "20px", padding: "10px",
    background: "#111827", color: "#fff", border: "none",
    borderRadius: "8px", fontSize: "14px", fontWeight: "500", cursor: "pointer",
  },
  deleteCardBtn: {
    position: "absolute",
    top: "8px",
    right: "8px",
    background: "none",
    border: "none",
    color: "#d1d5db",
    cursor: "pointer",
    fontSize: "14px",
    padding: "2px 6px",
    borderRadius: "4px",
    lineHeight: 1,
},
editCardBtn: {
  marginTop: "10px", width: "100%", padding: "7px",
  background: "none", border: "1px solid #e5e7eb",
  borderRadius: "6px", fontSize: "12px", color: "#6b7280",
  cursor: "pointer",
},
addRowBtn: {
  background: "none", border: "1px dashed #e5e7eb",
  borderRadius: "8px", padding: "8px 14px",
  fontSize: "13px", color: "#9ca3af", cursor: "pointer",
  width: "100%", marginTop: "4px",
},
removeRowBtn: {
  background: "none", border: "none",
  color: "#d1d5db", cursor: "pointer",
  fontSize: "14px", padding: "8px 4px", flexShrink: 0,
},
emojiBtn: {
  padding: "8px 12px", background: "none",
  border: "1px solid #e5e7eb", borderRadius: "8px",
  cursor: "pointer", fontSize: "18px", flexShrink: 0,
},
};
