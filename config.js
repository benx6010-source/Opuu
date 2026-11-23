// Change these values to tune Opu. No other file needs editing for this.
export const CONFIG = {
  provider: "gemini",          // key in provider.js -> providers
  model: "gemini-2.5-flash",   // if Google retires it, try "gemini-2.5-flash-lite"
  temperature: 0.9,
  historyLimit: 14,            // recent messages sent to the AI
  maxMemoriesInPrompt: 80
};
