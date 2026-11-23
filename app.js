// User interface only. Talks to conversation.js and memory.js.
import { handleMessage, getHistory, clearHistory } from "./conversation.js";
import { Memory } from "./memory.js";
import { getKey, setKey } from "./provider.js";

const $ = id => document.getElementById(id);
const chat = $("chat"), input = $("input"), send = $("send");

function add(cls, text) {
  const d = document.createElement("div");
  d.className = cls; d.textContent = text;   // textContent = safe, no HTML injection
  chat.appendChild(d); chat.scrollTop = chat.scrollHeight;
  return d;
}

function renderHistory() {
  chat.innerHTML = "";
  const h = getHistory();
  if (!h.length) add("msg opu", "Hey. You’re here.");
  h.forEach(m => add(m.role === "user" ? "msg me" : "msg opu", m.text));
  if (!getKey()) add("note", "To start talking, open Settings and paste your free Gemini API key.");
}

$("form").addEventListener("submit", async e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = ""; send.disabled = true;
  add("msg me", text);
  const typing = add("note", "Opu is typing…");
  try {
    const { reply, changes } = await handleMessage(text);
    typing.remove();
    add("msg opu", reply);
    changes.forEach(c => add("note", c));
  } catch (err) {
    typing.remove();
    add("err", err.message);
  }
  send.disabled = false; input.focus();
});

// Memory manager
function renderMemory() {
  const list = $("memList"); list.innerHTML = "";
  if (!Memory.all().length) list.textContent = "Nothing saved yet.";
  Memory.all().forEach(m => {
    const row = document.createElement("div"); row.className = "mem";
    const info = document.createElement("div");
    info.textContent = `${m.key.replace(/_/g, " ")}: ${m.value}`;
    const cat = document.createElement("small"); cat.textContent = m.category.replace("_", " ");
    info.appendChild(cat);
    const edit = document.createElement("button"); edit.textContent = "Edit";
    edit.onclick = () => { const v = prompt("New value", m.value); if (v) { Memory.edit(m.id, v.trim()); renderMemory(); } };
    const del = document.createElement("button"); del.textContent = "Delete"; del.className = "danger";
    del.onclick = () => { Memory.remove(m.id); renderMemory(); };
    row.append(info, edit, del); list.appendChild(row);
  });
}
$("memBtn").onclick = () => { renderMemory(); $("memDlg").showModal(); };
$("memClose").onclick = () => $("memDlg").close();
$("memExport").onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([Memory.export()], { type: "application/json" }));
  a.download = "opu-memory.json"; a.click();
};

// Settings + privacy
$("setBtn").onclick = () => { $("key").value = getKey(); $("setDlg").showModal(); };
$("setClose").onclick = () => $("setDlg").close();
$("keySave").onclick = () => { setKey($("key").value); $("setDlg").close(); renderHistory(); };
$("clearChat").onclick = () => { if (confirm("Clear this conversation? Saved memories stay.")) { clearHistory(); $("setDlg").close(); renderHistory(); } };
$("clearAll").onclick = () => {
  if (confirm("Delete ALL data (memories, chat, API key) from this device?")) { localStorage.clear(); location.reload(); }
};

// Optional voice input: only starts when you tap Mic, and only fills the text box.
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SR) $("mic").hidden = true;
else $("mic").onclick = () => {
  const r = new SR(); r.lang = "en-IN";
  r.onresult = e => { input.value = e.results[0][0].transcript; input.focus(); };
  r.start();
};

renderHistory();
