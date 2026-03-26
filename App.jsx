import { useState, useEffect, useMemo, useRef, useCallback } from "react";

const SUPABASE_URL = "https://xohvonnbaocatlhffzhw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvaHZvbm5iYW9jYXRsaGZmemh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MzA5MzgsImV4cCI6MjA5MDEwNjkzOH0.wfMTf3ogFkqSUVXuQNYGt9qlSLIJUbtjqI2ApiP77HA";
const HEADERS = { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` };
const TABLE = `${SUPABASE_URL}/rest/v1/travel_items`;

async function dbLoad() {
  const r = await fetch(`${TABLE}?select=*&order=sort_order.asc,created_at.asc`, { headers: HEADERS });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()).map(fromDb);
}
async function dbInsert(rows) {
  const r = await fetch(TABLE, { method: "POST", headers: { ...HEADERS, Prefer: "return=minimal" }, body: JSON.stringify(rows) });
  if (!r.ok) throw new Error(await r.text());
}
async function dbUpdate(id, data) {
  const r = await fetch(`${TABLE}?id=eq.${id}`, { method: "PATCH", headers: { ...HEADERS, Prefer: "return=minimal" }, body: JSON.stringify(data) });
  if (!r.ok) throw new Error(await r.text());
}
async function dbDelete(id) {
  const r = await fetch(`${TABLE}?id=eq.${id}`, { method: "DELETE", headers: HEADERS });
  if (!r.ok) throw new Error(await r.text());
}

function toDb(item) {
  return { id: item.id, title: item.title, category: item.category, city: item.city || "", state: item.state || "", country: item.country || "", your_rating: item.yourRating || 0, her_rating: item.herRating || 0, cost: item.cost || 0, kids_trip: item.kidsTrip || false, notes: item.notes || "", status: item.status || "active", sort_order: item.sortOrder || 0 };
}
function fromDb(row) {
  return { id: row.id, title: row.title, category: row.category, city: row.city || "", state: row.state || "", country: row.country || "", yourRating: row.your_rating || 0, herRating: row.her_rating || 0, cost: row.cost || 0, kidsTrip: row.kids_trip || false, notes: row.notes || "", status: row.status || "active", sortOrder: row.sort_order || 0 };
}
function genId() { return Math.random().toString(36).slice(2, 10); }

const CATEGORIES = ["City", "Museum", "Restaurant", "Hotel", "Experience", "Nature", "Entertainment", "Other"];
const SORT_OPTIONS = ["Priority Score", "Your Rating", "Her Rating", "Cost: Low to High", "Cost: High to Low", "Name", "Country"];
const COST_LEVELS = [1, 2, 3, 4, 5];
const CAT_COLORS = { City: "#185FA5", Museum: "#533AB7", Restaurant: "#D85A30", Hotel: "#1D9E75", Experience: "#D4537E", Nature: "#3B6D11", Entertainment: "#BA7517", Other: "#888780" };
const KIDS_BADGE = { background: "#FAC775", color: "#412402", borderRadius: 10, padding: "2px 9px", fontSize: 11, fontWeight: 500 };
const labelStyle = { fontSize: 11, fontWeight: 500, color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 };
const inputStyle = { width: "100%", boxSizing: "border-box", background: "#ffffff", border: "2px solid #d0d0d8", borderRadius: 10, padding: "11px 13px", fontSize: 16, color: "#1c1c1e", outline: "none", fontFamily: "inherit" };

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill="#185FA5" />
        <circle cx="24" cy="24" r="13" stroke="white" strokeWidth="1.5" fill="none" opacity="0.3" />
        <ellipse cx="24" cy="24" rx="6" ry="13" stroke="white" strokeWidth="1.5" fill="none" opacity="0.3" />
        <line x1="11" y1="24" x2="37" y2="24" stroke="white" strokeWidth="1.5" opacity="0.3" />
        <line x1="13" y1="18" x2="35" y2="18" stroke="white" strokeWidth="1.5" opacity="0.3" />
        <line x1="13" y1="30" x2="35" y2="30" stroke="white" strokeWidth="1.5" opacity="0.3" />
        <text x="24" y="27" textAnchor="middle" fill="white" fontSize="13" fontWeight="700" fontFamily="system-ui,sans-serif">S&J</text>
      </svg>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#1c1c1e", letterSpacing: "-0.02em", lineHeight: 1.1 }}>Steve <span style={{ color: "#185FA5" }}>&</span> Jenn</div>
        <div style={{ fontSize: 11, fontWeight: 500, color: "#888780", textTransform: "uppercase", letterSpacing: "0.1em" }}>Travel List</div>
      </div>
    </div>
  );
}

function PriorityBadge({ score }) {
  const bg = score >= 8 ? "#1D9E75" : score >= 5 ? "#BA7517" : "#888780";
  return <span style={{ background: bg, color: "#fff", borderRadius: 12, padding: "2px 9px", fontSize: 12, fontWeight: 500, display: "inline-block" }}>{score}</span>;
}
function CostDisplay({ cost }) {
  if (!cost) return <span style={{ fontSize: 12, color: "#aaa" }}>—</span>;
  return <span style={{ fontSize: 13, fontWeight: 600 }}><span style={{ color: "#1D9E75" }}>{"$".repeat(cost)}</span><span style={{ color: "#d0d0d8" }}>{"$".repeat(5 - cost)}</span></span>;
}
function CostPicker({ value, onChange }) {
  const labels = ["Free", "Budget", "Moderate", "Pricey", "Luxury"];
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {COST_LEVELS.map(i => (
        <button key={i} onClick={() => onChange(value === i ? 0 : i)} style={{ flex: 1, borderRadius: 10, padding: "10px 4px", border: value === i ? "2px solid #1D9E75" : "2px solid #d0d0d8", background: value === i ? "#EAF3DE" : "#fff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}><span style={{ color: "#1D9E75" }}>{"$".repeat(i)}</span><span style={{ color: "#d0d0d8" }}>{"$".repeat(5 - i)}</span></span>
          <span style={{ fontSize: 10, color: value === i ? "#3B6D11" : "#aaa", fontWeight: value === i ? 500 : 400 }}>{labels[i - 1]}</span>
        </button>
      ))}
    </div>
  );
}
function StarRating({ value, onChange, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <span style={{ fontSize: 11, fontWeight: 500, color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>}
      <div style={{ display: "flex", gap: 2 }}>
        {[1, 2, 3, 4, 5].map(i => <span key={i} onClick={() => onChange && onChange(i)} style={{ cursor: onChange ? "pointer" : "default", fontSize: 28, color: i <= value ? "#EF9F27" : "#d0d0d8", lineHeight: 1 }}>★</span>)}
      </div>
    </div>
  );
}
function CategoryBadge({ cat }) { return <span style={{ background: CAT_COLORS[cat] || "#888780", color: "#fff", borderRadius: 10, padding: "2px 9px", fontSize: 11, fontWeight: 500 }}>{cat}</span>; }
function StatusBadge({ status }) { return status === "complete" ? <span style={{ background: "#d1fae5", color: "#065f46", borderRadius: 10, padding: "2px 9px", fontSize: 11, fontWeight: 500 }}>Done</span> : null; }
function SectionCard({ children }) { return <div style={{ background: "#ffffff", borderRadius: 14, padding: "14px 16px", border: "0.5px solid #e5e5e7", marginBottom: 10 }}>{children}</div>; }
function Field({ label, children }) { return <div style={{ display: "flex", flexDirection: "column" }}>{label && <label style={labelStyle}>{label}</label>}{children}</div>; }
function PrimaryBtn({ onClick, children, disabled }) { return <button onClick={onClick} disabled={disabled} style={{ flex: 1, background: disabled ? "#e5e5e7" : "#185FA5", color: disabled ? "#888780" : "#fff", border: "none", borderRadius: 12, padding: "14px", fontSize: 16, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit" }}>{children}</button>; }
function GhostBtn({ onClick, children, danger, disabled }) { return <button onClick={onClick} disabled={disabled} style={{ flex: 1, background: "#fff", color: danger ? "#A32D2D" : "#888780", border: `0.5px solid ${danger ? "#f87171" : "#d0d0d8"}`, borderRadius: 12, padding: "14px", fontSize: 16, cursor: "pointer", opacity: disabled ? 0.5 : 1, fontFamily: "inherit" }}>{children}</button>; }

function Panel({ title, onClose, children }) {
  return (
    <div style={{ background: "#EEEEF0", borderRadius: 16, padding: "1rem", marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>{title}</h2>
        <button onClick={onClose} style={{ background: "rgba(0,0,0,0.1)", border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: 20, cursor: "pointer", color: "#888780", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>×</button>
      </div>
      {children}
    </div>
  );
}

function ItemForm({ item, onSave, onClose, saving, error }) {
  const blank = { title: "", category: "Experience", city: "", state: "", country: "", yourRating: 0, herRating: 0, cost: 0, kidsTrip: false, notes: "", status: "active" };
  const [form, setForm] = useState(item || blank);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Panel title={item ? "Edit item" : "New destination"} onClose={onClose}>
      {error && <div style={{ background: "#FCEBEB", color: "#A32D2D", borderRadius: 10, padding: "10px 14px", marginBottom: 10, fontSize: 14 }}>{error}</div>}
      <SectionCard><Field label="Destination name"><input placeholder="e.g. Tsukiji Fish Market" value={form.title} onChange={e => set("title", e.target.value)} style={inputStyle} /></Field></SectionCard>
      <SectionCard>
        <label style={labelStyle}>Category</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
          {CATEGORIES.map(c => <button key={c} onClick={() => set("category", c)} style={{ background: form.category === c ? CAT_COLORS[c] : "#f5f5f7", color: form.category === c ? "#fff" : "#888780", border: form.category === c ? "none" : "0.5px solid #d0d0d8", borderRadius: 10, padding: "9px 4px", fontSize: 12, cursor: "pointer", fontWeight: form.category === c ? 500 : 400, fontFamily: "inherit" }}>{c}</button>)}
        </div>
      </SectionCard>
      <SectionCard>
        <label style={labelStyle}>Location</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <Field label="City"><input placeholder="Tokyo" value={form.city} onChange={e => set("city", e.target.value)} style={inputStyle} /></Field>
          <Field label="State"><input placeholder="Optional" value={form.state} onChange={e => set("state", e.target.value)} style={inputStyle} /></Field>
          <Field label="Country"><input placeholder="Japan" value={form.country} onChange={e => set("country", e.target.value)} style={inputStyle} /></Field>
        </div>
      </SectionCard>
      <SectionCard>
        <label style={labelStyle}>Ratings</label>
        <div style={{ display: "flex", justifyContent: "space-around", paddingBottom: 12 }}>
          <StarRating value={form.yourRating} onChange={v => set("yourRating", v)} label="Steve" />
          <div style={{ width: "0.5px", background: "#e5e5e7" }} />
          <StarRating value={form.herRating} onChange={v => set("herRating", v)} label="Jenn" />
        </div>
        <div style={{ borderTop: "0.5px solid #e5e5e7", paddingTop: 10, textAlign: "center", fontSize: 13, color: "#888780" }}>
          Priority score: <span style={{ fontWeight: 500, color: "#1c1c1e" }}>{form.yourRating + form.herRating}/10</span>
        </div>
      </SectionCard>
      <SectionCard><label style={labelStyle}>Estimated cost</label><CostPicker value={form.cost} onChange={v => set("cost", v)} /></SectionCard>
      <SectionCard>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "#1c1c1e" }}>Kids trip</div>
            <div style={{ fontSize: 12, color: "#888780", marginTop: 2 }}>Flag this as a trip to do with the kids</div>
          </div>
          <div onClick={() => set("kidsTrip", !form.kidsTrip)} style={{ width: 48, height: 28, borderRadius: 14, background: form.kidsTrip ? "#EF9F27" : "#d0d0d8", cursor: "pointer", position: "relative", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: 3, left: form.kidsTrip ? 23 : 3, width: 22, height: 22, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
          </div>
        </div>
      </SectionCard>
      <SectionCard><Field label="Notes, tips & itinerary"><textarea placeholder="Add details, links, tips..." value={form.notes} onChange={e => set("notes", e.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} /></Field></SectionCard>
      {item && <SectionCard><div style={{ display: "flex", alignItems: "center", gap: 10 }}><input type="checkbox" id="done" checked={form.status === "complete"} onChange={e => set("status", e.target.checked ? "complete" : "active")} style={{ width: 18, height: 18, cursor: "pointer" }} /><label htmlFor="done" style={{ fontSize: 15, color: "#1c1c1e", cursor: "pointer" }}>Mark as completed</label></div></SectionCard>}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <GhostBtn onClick={onClose} disabled={saving}>Cancel</GhostBtn>
        <PrimaryBtn onClick={() => { if (form.title.trim()) onSave(form); }} disabled={!form.title.trim() || saving}>{saving ? "Saving…" : item ? "Save changes" : "Add to list"}</PrimaryBtn>
      </div>
    </Panel>
  );
}

function BulkImport({ onImport, onClose, saving, error }) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("Experience");
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  return (
    <Panel title="Bulk import" onClose={onClose}>
      {error && <div style={{ background: "#FCEBEB", color: "#A32D2D", borderRadius: 10, padding: "10px 14px", marginBottom: 10, fontSize: 14 }}>{error}</div>}
      <SectionCard><p style={{ fontSize: 14, color: "#888780", margin: 0, lineHeight: 1.6 }}>One item per line. Optional: <code style={{ fontSize: 13, background: "#f5f5f7", padding: "2px 6px", borderRadius: 6 }}>Title, City, State, Country</code></p></SectionCard>
      <SectionCard>
        <label style={labelStyle}>Default category</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
          {CATEGORIES.map(c => <button key={c} onClick={() => setCategory(c)} style={{ background: category === c ? CAT_COLORS[c] : "#f5f5f7", color: category === c ? "#fff" : "#888780", border: category === c ? "none" : "0.5px solid #d0d0d8", borderRadius: 10, padding: "9px 4px", fontSize: 12, cursor: "pointer", fontWeight: category === c ? 500 : 400, fontFamily: "inherit" }}>{c}</button>)}
        </div>
      </SectionCard>
      <SectionCard>
        <label style={labelStyle}>Paste your list</label>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder={"Eiffel Tower, Paris, , France\nNobu, New York, NY, USA\nKyoto"} rows={8} style={{ ...inputStyle, fontFamily: "monospace", fontSize: 13, resize: "vertical" }} />
        <p style={{ fontSize: 12, color: "#888780", margin: "8px 0 0" }}>{lines.length} item{lines.length !== 1 ? "s" : ""} detected</p>
      </SectionCard>
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <GhostBtn onClick={onClose} disabled={saving}>Cancel</GhostBtn>
        <PrimaryBtn onClick={() => onImport(lines.map(line => { const p = line.split(",").map(s => s.trim()); return { id: genId(), title: p[0] || line, city: p[1] || "", state: p[2] || "", country: p[3] || "", category, yourRating: 0, herRating: 0, cost: 0, kidsTrip: false, notes: "", status: "active" }; }))} disabled={!lines.length || saving}>{saving ? "Saving…" : `Import ${lines.length || ""} items`}</PrimaryBtn>
      </div>
    </Panel>
  );
}

function ItemDetail({ item, onSave, onDelete, onClose, saving, error }) {
  const [editing, setEditing] = useState(false);
  if (editing) return <ItemForm item={item} onSave={async v => { await onSave(v); setEditing(false); }} onClose={() => setEditing(false)} saving={saving} error={error} />;
  const loc = [item.city, item.state, item.country].filter(Boolean).join(", ");
  const costLabels = ["", "Free", "Budget", "Moderate", "Pricey", "Luxury"];
  return (
    <Panel title={item.title} onClose={onClose}>
      {error && <div style={{ background: "#FCEBEB", color: "#A32D2D", borderRadius: 10, padding: "10px 14px", marginBottom: 10, fontSize: 14 }}>{error}</div>}
      <SectionCard>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: loc ? 6 : 0 }}>
          <CategoryBadge cat={item.category} /><StatusBadge status={item.status} />
          {item.kidsTrip && <span style={KIDS_BADGE}>Kids trip</span>}
        </div>
        {loc && <p style={{ margin: 0, fontSize: 14, color: "#888780" }}>{loc}</p>}
      </SectionCard>
      <SectionCard>
        <div style={{ display: "flex", justifyContent: "space-around", paddingBottom: 12 }}>
          <StarRating value={item.yourRating} label="Steve" />
          <div style={{ width: "0.5px", background: "#e5e5e7" }} />
          <StarRating value={item.herRating} label="Jenn" />
        </div>
        <div style={{ borderTop: "0.5px solid #e5e5e7", paddingTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#888780" }}>Priority score</span>
          <PriorityBadge score={item.yourRating + item.herRating} />
        </div>
      </SectionCard>
      {item.cost > 0 && <SectionCard><label style={labelStyle}>Estimated cost</label><div style={{ display: "flex", alignItems: "center", gap: 10 }}><CostDisplay cost={item.cost} /><span style={{ fontSize: 13, color: "#888780" }}>{costLabels[item.cost]}</span></div></SectionCard>}
      {item.notes && <SectionCard><label style={labelStyle}>Notes & itinerary</label><div style={{ fontSize: 15, lineHeight: 1.7, color: "#1c1c1e", whiteSpace: "pre-wrap" }}>{item.notes}</div></SectionCard>}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <GhostBtn danger onClick={() => { if (confirm("Delete this item?")) onDelete(item.id); }} disabled={saving}>Delete</GhostBtn>
        <GhostBtn onClick={() => onSave({ ...item, status: item.status === "complete" ? "active" : "complete" })} disabled={saving}>{item.status === "complete" ? "Mark active" : "Mark done"}</GhostBtn>
        <PrimaryBtn onClick={() => setEditing(true)} disabled={saving}>Edit</PrimaryBtn>
      </div>
    </Panel>
  );
}

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [panel, setPanel] = useState(null);
  const [filterCat, setFilterCat] = useState("All");
  const [filterStatus, setFilterStatus] = useState("active");
  const [filterCost, setFilterCost] = useState("All");
  const [filterKids, setFilterKids] = useState("All");
  const [sortBy, setSortBy] = useState("Priority Score");
  const [manualOrder, setManualOrder] = useState(null);
  const [search, setSearch] = useState("");
  const dragItem = useRef(null);
  const dragOver = useRef(null);

  useEffect(() => {
    dbLoad().then(rows => { setItems(rows); setLoading(false); }).catch(e => { setError(`Could not load: ${e.message}`); setLoading(false); });
  }, []);

  const addItem = useCallback(async (form) => {
    setSaving(true); setError(null);
    try {
      const newItem = { ...form, id: genId(), sortOrder: items.length };
      await dbInsert([toDb(newItem)]);
      setItems(prev => [newItem, ...prev]);
      setPanel(null);
    } catch (e) { setError(`Failed to save: ${e.message}`); }
    setSaving(false);
  }, [items.length]);

  const updateItem = useCallback(async (form) => {
    setSaving(true); setError(null);
    try {
      await dbUpdate(form.id, toDb(form));
      setItems(prev => prev.map(i => i.id === form.id ? { ...form } : i));
      setPanel({ item: { ...form } });
    } catch (e) { setError(`Failed to update: ${e.message}`); }
    setSaving(false);
  }, []);

  const deleteItem = useCallback(async (id) => {
    setSaving(true); setError(null);
    try {
      await dbDelete(id);
      setItems(prev => prev.filter(i => i.id !== id));
      setPanel(null);
    } catch (e) { setError(`Failed to delete: ${e.message}`); }
    setSaving(false);
  }, []);

  const importItems = useCallback(async (newItems) => {
    setSaving(true); setError(null);
    try {
      const withOrder = newItems.map((item, i) => ({ ...item, sortOrder: i }));
      await dbInsert(withOrder.map(toDb));
      setItems(prev => [...withOrder, ...prev]);
      setPanel(null);
    } catch (e) { setError(`Failed to import: ${e.message}`); }
    setSaving(false);
  }, []);

  async function saveOrder(orderedIds) {
    setManualOrder(orderedIds);
    orderedIds.forEach((id, i) => dbUpdate(id, { sort_order: i }));
  }

  const scored = useMemo(() => items.map(i => ({ ...i, score: i.yourRating + i.herRating })), [items]);
  const filtered = useMemo(() => {
    let l = scored;
    if (filterStatus !== "all") l = l.filter(i => i.status === filterStatus);
    if (filterCat !== "All") l = l.filter(i => i.category === filterCat);
    if (filterCost !== "All") l = l.filter(i => i.cost === parseInt(filterCost));
    if (filterKids !== "All") l = l.filter(i => filterKids === "yes" ? i.kidsTrip : !i.kidsTrip);
    if (search.trim()) { const q = search.toLowerCase(); l = l.filter(i => i.title.toLowerCase().includes(q) || i.city?.toLowerCase().includes(q) || i.country?.toLowerCase().includes(q)); }
    return l;
  }, [scored, filterCat, filterStatus, filterCost, filterKids, search]);

  const sorted = useMemo(() => {
    if (manualOrder) { const m = Object.fromEntries(filtered.map(i => [i.id, i])); return [...manualOrder.filter(id => m[id]).map(id => m[id]), ...filtered.filter(i => !manualOrder.includes(i.id))]; }
    const l = [...filtered];
    if (sortBy === "Priority Score") l.sort((a, b) => b.score - a.score);
    else if (sortBy === "Your Rating") l.sort((a, b) => b.yourRating - a.yourRating);
    else if (sortBy === "Her Rating") l.sort((a, b) => b.herRating - a.herRating);
    else if (sortBy === "Cost: Low to High") l.sort((a, b) => (a.cost || 0) - (b.cost || 0));
    else if (sortBy === "Cost: High to Low") l.sort((a, b) => (b.cost || 0) - (a.cost || 0));
    else if (sortBy === "Name") l.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === "Country") l.sort((a, b) => (a.country || "").localeCompare(b.country || ""));
    return l;
  }, [filtered, sortBy, manualOrder]);

  function handleDragStart(e, id) { dragItem.current = id; }
  function handleDragEnter(e, id) { dragOver.current = id; }
  function handleDragEnd(e) {
    e.currentTarget.style.opacity = "1";
    if (!dragItem.current || !dragOver.current || dragItem.current === dragOver.current) { dragItem.current = null; dragOver.current = null; return; }
    const ids = sorted.map(i => i.id); const f = ids.indexOf(dragItem.current); const t = ids.indexOf(dragOver.current);
    const no = [...ids]; no.splice(f, 1); no.splice(t, 0, dragItem.current);
    saveOrder(no); dragItem.current = null; dragOver.current = null;
  }

  const isFiltered = search.trim() || filterCat !== "All" || filterStatus !== "active" || filterCost !== "All" || filterKids !== "All";
  const totalAll = items.length, totalActive = items.filter(i => i.status === "active").length, totalDone = items.filter(i => i.status === "complete").length;
  const costLabels = { 1: "Free", 2: "Budget", 3: "Moderate", 4: "Pricey", 5: "Luxury" };

  if (loading) return <div style={{ padding: "2rem", textAlign: "center", color: "#888780" }}>Loading…</div>;

  return (
    <div style={{ padding: "1rem 0", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <Logo />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setError(null); setPanel("bulk"); }} style={{ fontSize: 13, fontFamily: "inherit", background: "#fff", border: "0.5px solid #d0d0d8", borderRadius: 8, padding: "8px 14px", cursor: "pointer", color: "#1c1c1e" }}>Bulk import</button>
          <button onClick={() => { setError(null); setPanel("add"); }} style={{ background: "#185FA5", color: "#fff", border: "none", fontSize: 15, fontWeight: 500, padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit" }}>+ Add item</button>
        </div>
      </div>

      {panel === "add" && <ItemForm onSave={addItem} onClose={() => { setPanel(null); setError(null); }} saving={saving} error={error} />}
      {panel === "bulk" && <BulkImport onImport={importItems} onClose={() => { setPanel(null); setError(null); }} saving={saving} error={error} />}
      {panel?.item && <ItemDetail item={panel.item} onSave={updateItem} onDelete={deleteItem} onClose={() => { setPanel(null); setError(null); }} saving={saving} error={error} />}

      {error && !panel && <div style={{ background: "#FCEBEB", color: "#A32D2D", borderRadius: 10, padding: "10px 14px", marginBottom: "1rem", fontSize: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>{error}<button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#A32D2D", fontSize: 18 }}>×</button></div>}

      <div style={{ display: "flex", gap: 6, marginBottom: "1rem" }}>
        {[{ label: "Total", val: totalAll }, { label: "To go", val: totalActive }, { label: "Done", val: totalDone }].map(s => (
          <div key={s.label} style={{ flex: 1, background: "#f0f0f2", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1c1c1e", lineHeight: 1.1 }}>{s.val}</div>
            <div style={{ fontSize: 11, color: "#888780", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ position: "relative", marginBottom: 8 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", zIndex: 1 }}>
          <circle cx="6.5" cy="6.5" r="4.5" stroke="#888780" strokeWidth="1.5" />
          <line x1="10" y1="10" x2="14" y2="14" stroke="#888780" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input placeholder="Search destinations..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ display: "block", width: "100%", boxSizing: "border-box", paddingLeft: "36px", paddingRight: search ? "36px" : "12px", paddingTop: "11px", paddingBottom: "11px", fontSize: "15px", border: "2px solid #185FA5", borderRadius: "10px", background: "#ffffff", color: "#1c1c1e", outline: "none", fontFamily: "inherit" }} />
        {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#888780", padding: 2, lineHeight: 1 }}>×</button>}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "0.75rem", alignItems: "center" }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ fontFamily: "inherit" }}>
          <option value="active">Active</option><option value="complete">Completed</option><option value="all">All</option>
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ fontFamily: "inherit" }}>
          <option value="All">All categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterCost} onChange={e => setFilterCost(e.target.value)} style={{ fontFamily: "inherit" }}>
          <option value="All">All costs</option>
          {COST_LEVELS.map(i => <option key={i} value={i}>{"$".repeat(i)} — {costLabels[i]}</option>)}
        </select>
        <select value={filterKids} onChange={e => setFilterKids(e.target.value)} style={{ fontFamily: "inherit" }}>
          <option value="All">All trips</option><option value="yes">Kids trip</option><option value="no">Just us</option>
        </select>
        <select value={manualOrder ? "Manual" : sortBy} onChange={e => { if (e.target.value !== "Manual") { setManualOrder(null); setSortBy(e.target.value); } }} style={{ fontFamily: "inherit" }}>
          {SORT_OPTIONS.map(s => <option key={s}>{s}</option>)}
          {manualOrder && <option value="Manual">Manual order</option>}
        </select>
        {manualOrder && <button onClick={() => setManualOrder(null)} style={{ fontSize: 12, fontFamily: "inherit" }}>Clear order</button>}
      </div>

      <div style={{ fontSize: 13, color: "#888780", marginBottom: 8 }}>
        {isFiltered ? <span>Showing <strong style={{ color: "#1c1c1e" }}>{sorted.length}</strong> of <strong style={{ color: "#1c1c1e" }}>{totalAll}</strong> destinations</span> : <span><strong style={{ color: "#1c1c1e" }}>{sorted.length}</strong> destination{sorted.length !== 1 ? "s" : ""}</span>}
      </div>

      {sorted.length === 0 && !panel && <div style={{ padding: "3rem 0", textAlign: "center", color: "#888780", fontSize: 14 }}>{items.length === 0 ? "Add your first destination above." : "No items match your filters."}</div>}

      <div style={{ display: "grid", gap: 8 }}>
        {sorted.map(item => {
          const loc = [item.city, item.state, item.country].filter(Boolean).join(", ");
          return (
            <div key={item.id} draggable
              onDragStart={e => { handleDragStart(e, item.id); e.currentTarget.style.opacity = "0.4"; }}
              onDragEnter={e => handleDragEnter(e, item.id)}
              onDragEnd={handleDragEnd}
              style={{ background: "#ffffff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.07)", display: "flex", alignItems: "stretch", overflow: "hidden", opacity: item.status === "complete" ? 0.55 : 1, userSelect: "none" }}>
              <div onClick={e => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, width: 28, background: "#f0f0f2", borderRight: "1px solid rgba(0,0,0,0.07)", cursor: "grab", flexShrink: 0, padding: "0 6px" }}>
                {[0, 1, 2, 3, 4, 5].map(i => <div key={i} style={{ width: 12, height: 2, borderRadius: 1, background: "#b0b0b8" }} />)}
              </div>
              <div style={{ width: 4, background: CAT_COLORS[item.category] || "#888780", flexShrink: 0 }} />
              <div onClick={() => { setError(null); setPanel({ item }); }} style={{ flex: 1, minWidth: 0, padding: "12px 14px", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: loc ? 4 : 0 }}>
                  <span style={{ fontWeight: 500, fontSize: 15, color: item.status === "complete" ? "#888780" : "#1c1c1e" }}>{item.title}</span>
                  <CategoryBadge cat={item.category} />
                  {item.status === "complete" && <StatusBadge status={item.status} />}
                  {item.kidsTrip && <span style={KIDS_BADGE}>Kids trip</span>}
                </div>
                {loc && <div style={{ fontSize: 12, color: "#888780" }}>{loc}</div>}
              </div>
              <div onClick={() => { setError(null); setPanel({ item }); }} style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center", gap: 5, padding: "12px 14px", flexShrink: 0, cursor: "pointer" }}>
                <PriorityBadge score={item.score} />
                {item.cost > 0 && <CostDisplay cost={item.cost} />}
                <div style={{ fontSize: 11, color: "#888780", whiteSpace: "nowrap" }}>
                  S{"★".repeat(item.yourRating)}{"☆".repeat(5 - item.yourRating)} · J{"★".repeat(item.herRating)}{"☆".repeat(5 - item.herRating)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
