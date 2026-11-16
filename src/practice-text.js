import glyphs from './practice-font/glyphs.json' with { type: 'json' };

export const MAX_PRACTICE_TEXT = 100;
export function readPracticeText(value) {
  return String(value ?? '').normalize('NFC').replace(/[\r\n\t]/g, ' ').slice(0, MAX_PRACTICE_TEXT);
}

// ABeeZee's nominal cap height is 700 units and its x-height is 520.
// Scale a complete outline uniformly, including accents and detached dots.
const shortLowercase = /^[acegijmnopqrsuvwxyzæœøı]/u;
export function measurePracticeLetters(state, { baseline, waist, depth }) {
  const text = readPracticeText(state.practiceText);
  const letters = text.trim() ? Array.from(text) : [];
  const missing = letters.find(letter => !Object.hasOwn(glyphs, letter));
  if (missing) return { letters: [], hint: 'This letter set does not include “' + missing + '”.' };
  return { letters: letters.map(letter => {
    const [width, height, descent, outline] = glyphs[letter];
    let scale = shortLowercase.test(letter.normalize('NFD'))
      ? (baseline - waist) / 520 : state.spacing / 700;
    if (height > 0) scale = Math.min(scale, state.spacing / height);
    if (descent > 0 && depth > 0) scale = Math.min(scale, depth / descent);
    return { outline, advance: width * scale, scale };
  }), hint: '' };
}

export function practicePaths({ visible, rowLeft, baseline, boxCount, boxWidth, boxPitch }) {
  let cursor = rowLeft;
  const paths = [];
  for (const { outline, advance, scale } of visible) {
    const start = boxCount ? cursor + (boxWidth - advance) / 2 : cursor;
    if (outline.length && scale > 0) paths.push(outline.map(([op, ...coords]) => [
      op, ...coords.map((v, i) => i % 2 ? baseline - v * scale : start + v * scale),
    ]));
    cursor += boxCount ? boxPitch : advance;
  }
  return paths;
}
