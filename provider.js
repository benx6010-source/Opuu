// AI provider layer. To add Claude/another model later, add a class here
// with the same three methods and register it in `providers`.
import { CONFIG } from "./config.js";

export const getKey = () => localStorage.getItem("opu_api_key") || "";
export const setKey = k => localStorage.setItem("opu_api_key", k.trim());

class GeminiProvider {
  async call(system, messages, json) {
    const key = getKey();
    if (!key) throw new Error("No API key yet. Open Settings and paste your Gemini key.");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.model}:generateContent?key=${encodeURIComponent(key)}`;
    const body = {
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map(m => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.text }] })),
      generationConfig: { temperature: CONFIG.temperature, ...(json ? { responseMimeType: "application/json" } : {}) }
    };
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error?.message || `Request failed (${r.status})`);
    return (d.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
  }
  sendMessage(system, messages) { return this.call(system, messages, false); }
  async *streamResponse(system, messages) { yield await this.sendMessage(system, messages); } // real streaming: later
  async generateStructuredOutput(system, messages) {
    const t = await this.call(system, messages, true);
    try { return JSON.parse(t.replace(/```json|```/g, "").trim()); }
    catch { return { reply: t, memory_ops: [] }; }
  }
}

const providers = { gemini: GeminiProvider };
export const provider = new providers[CONFIG.provider]();
