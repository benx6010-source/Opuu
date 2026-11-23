// Conversation manager: runs each message through the pipeline
// message -> memory retrieval -> emotion/intent -> personality -> AI -> memory extraction.
import { provider } from "./provider.js";
import { Memory } from "./memory.js";
import { analyze } from "./emotion.js";
import { buildSystemPrompt } from "./personality.js";
import { CONFIG } from "./config.js";

const HKEY = "opu_history";
let history = (() => { try { return JSON.parse(localStorage.getItem(HKEY)) || []; } catch { return []; } })();
const saveHistory = () => localStorage.setItem(HKEY, JSON.stringify(history.slice(-40)));

export const getHistory = () => history;
export function clearHistory() { history = []; saveHistory(); }

export async function handleMessage(text) {
  // 1. Memory questions are answered from the real saved data, never from the AI's guess.
  if (/^\s*(what do you (remember|know)( about me)?|show (me )?(my )?memor(y|ies))\b/i.test(text)) {
    const reply = Memory.describe();
    history.push({ role: "user", text }, { role: "model", text: reply });
    saveHistory();
    return { reply, changes: [] };
  }

  // 2. Emotion + intent, 3. memory retrieval, 4. personality prompt
  const emotion = analyze(text);
  const noSave = /\b(don'?t|do not) (remember|save|store)\b/i.test(text);
  const system = buildSystemPrompt(Memory.all().slice(-CONFIG.maxMemoriesInPrompt), emotion, noSave);

  // 5. AI call (recent messages only; Gemini needs the first one to be from the user)
  const recent = history.slice(-CONFIG.historyLimit);
  while (recent.length && recent[0].role !== "user") recent.shift();
  const out = await provider.generateStructuredOutput(system, [...recent, { role: "user", text }]);

  // 6. Memory extraction: apply only what the AI proposed (deletes always allowed)
  const ops = (Array.isArray(out.memory_ops) ? out.memory_ops : []).filter(o => !noSave || o.op === "delete");
  const changes = Memory.applyOps(ops);

  const reply = String(out.reply || "I lost my words for a second. Say that again?").trim();
  history.push({ role: "user", text }, { role: "model", text: reply });
  saveHistory();
  return { reply, changes };
}
