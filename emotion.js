// Light emotion/intent detection (keywords, runs on the device) + Opu's temporary state.
// The state is NOT saved: it resets when the page reloads. It only colours tone.
const MOODS = [
  ["sad", /\b(sad|crying|cry|heartbroken|hurt|depressed|down today|miss(ing)? (her|him|them|home))\b/i, { concern: .4, affection: .15, playfulness: -.3, energy: -.1 }],
  ["lonely", /\b(lonely|alone|nobody|no one (cares|talks))\b/i, { concern: .4, affection: .2, playfulness: -.3 }],
  ["angry", /\b(angry|furious|hate|pissed|so annoyed)\b/i, { concern: .2, playfulness: -.4, energy: .1 }],
  ["frustrated", /\b(frustrat\w*|fed up|stuck|nothing works|ugh)\b/i, { concern: .2, playfulness: -.2 }],
  ["stressed", /\b(stress\w*|overwhelm\w*|too much|deadline|pressure)\b/i, { concern: .3, playfulness: -.2 }],
  ["nervous", /\b(nervous|anxious|scared|afraid|worried|worry)\b/i, { concern: .3, affection: .1, playfulness: -.2 }],
  ["tired", /\b(tired|exhausted|sleepy|drained|burnt? ?out)\b/i, { concern: .15, energy: -.3, playfulness: -.1 }],
  ["confused", /\b(confused|don'?t understand|no idea|lost)\b/i, { concern: .1 }],
  ["disappointed", /\b(disappointed|let down|failed|failure|didn'?t (make|get) it)\b/i, { concern: .3, affection: .1, playfulness: -.3 }],
  ["excited", /\b(excited|can'?t wait|so happy|amazing|finally)\b|!{2,}/i, { energy: .3, playfulness: .25, affection: .1 }],
  ["happy", /\b(happy|great day|good news|yay|glad)\b/i, { energy: .2, playfulness: .2 }],
  ["proud", /\b(proud|i did it|finished|completed|passed|won)\b/i, { energy: .2, affection: .1, playfulness: .1 }],
  ["playful", /\b(lol|lmao|haha+|jk|just kidding)\b/i, { playfulness: .35, energy: .1 }],
  ["romantic", /\b(love you|miss you|my love|cutie)\b/i, { affection: .3 }],
  ["demotivated", /\b(give up|no motivation|can'?t do this|what'?s the point)\b/i, { concern: .35, affection: .15, playfulness: -.3 }]
];
const INTENTS = [
  ["decision", /\b(should i|what should i do|can'?t decide|whether (i|to)|which (one )?is better|is it (a )?(good|bad) idea)\b/i],
  ["procrastinating", /\b(procrastinat\w*|can'?t start|don'?t feel like|putting (it )?off|lazy)\b/i],
  ["technical", /\b(code|error|bug|api|install|html|javascript|python|how do i|how to)\b/i],
  ["failure", /\b(failed|failure|lost|didn'?t (make|get) it|rejected)\b/i]
];

export const state = { mood: "neutral", energy: .5, affection: .5, concern: 0, playfulness: .5 };
const clamp = v => Math.max(0, Math.min(1, +v.toFixed(2)));

export function analyze(text) {
  // drift back toward neutral each turn
  state.concern = clamp(state.concern * .7);
  state.playfulness = clamp(.5 + (state.playfulness - .5) * .7);
  state.energy = clamp(.5 + (state.energy - .5) * .7);
  state.affection = clamp(.5 + (state.affection - .5) * .8);

  const hits = MOODS.filter(([, re]) => re.test(text));
  state.mood = hits.length ? hits[0][0] : "neutral";
  hits.forEach(([, , fx]) => Object.keys(fx).forEach(k => { state[k] = clamp(state[k] + fx[k]); }));
  return {
    moods: hits.map(h => h[0]),
    intents: INTENTS.filter(([, re]) => re.test(text)).map(i => i[0]),
    state: { ...state }
  };
}
