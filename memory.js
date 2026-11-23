// Long-term memory. Stored only in this browser (localStorage).
// Item: { id, category, key, value, created, updated }
const KEY = "opu_memory";
export const CATEGORIES = ["personal", "preferences", "goals", "projects", "relationships", "events", "emotional_preferences", "notes"];

const empty = () => ({ version: 1, items: [] });
let data = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || empty(); } catch { return empty(); } })();
const save = () => localStorage.setItem(KEY, JSON.stringify(data));
const newId = () => Math.random().toString(36).slice(2, 8);
const find = id => data.items.find(m => m.id === id);

export const Memory = {
  all: () => data.items,
  add({ category, key, value }) {
    if (!key || !value) return null;
    if (!CATEGORIES.includes(category)) category = "notes";
    const now = new Date().toISOString();
    const old = data.items.find(m => m.category === category && m.key === key);
    if (old) { old.value = String(value); old.updated = now; save(); return old; }
    const m = { id: newId(), category, key: String(key), value: String(value), created: now, updated: now };
    data.items.push(m); save(); return m;
  },
  edit(id, value) { const m = find(id); if (m && value) { m.value = value; m.updated = new Date().toISOString(); save(); } },
  remove(id) { const n = data.items.length; data.items = data.items.filter(m => m.id !== id); save(); return n !== data.items.length; },
  clear() { data = empty(); save(); },
  export: () => JSON.stringify(data, null, 2),
  describe() {
    if (!data.items.length) return "I don’t have anything saved about you yet. Tell me something and ask me to remember it.";
    const lines = CATEGORIES.map(c => {
      const xs = data.items.filter(m => m.category === c);
      return xs.length ? c.replace("_", " ") + ":\n" + xs.map(m => `- ${m.key.replace(/_/g, " ")}: ${m.value}`).join("\n") : "";
    }).filter(Boolean);
    return "Here’s everything I have saved:\n\n" + lines.join("\n\n");
  },
  // Apply the changes the AI proposes. Returns short labels for the UI.
  applyOps(ops) {
    const done = [];
    for (const o of Array.isArray(ops) ? ops : []) {
      if (o.op === "delete") {
        const m = find(o.id);
        if (m && this.remove(o.id)) done.push("Forgot: " + m.key.replace(/_/g, " "));
      } else if (o.op === "add" || o.op === "update") {
        const m = find(o.id);
        if (m && o.value) { this.edit(o.id, String(o.value)); done.push("Updated: " + m.key.replace(/_/g, " ")); }
        else { const n = this.add(o); if (n) done.push("Remembered: " + n.key.replace(/_/g, " ")); }
      }
    }
    return done;
  }
};
