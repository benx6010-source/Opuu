// Change these values to tune Opu. No other file needs editing for this.
export const CONFIG = {
  provider: "gemini",          // key in provider.js -> providers
  model: "gemini-3.8-flash",   // if Google retires it, the error message names the new model
  temperature: 0.9,
  historyLimit: 14,            // recent messages sent to the AI
  maxMemoriesInPrompt: 80
};
