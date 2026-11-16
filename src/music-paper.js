// Bravura outlines in staff spaces (one space is the distance between adjacent lines).
import { lyricStaffIndices } from './music-staves.js';
import symbols from './music-symbols/outlines.json' with { type: 'json' };

const anchors = { treble: 3, vocalTenor: 3, bass: 1, alto: 2, tenor: 1, percussion: 2, percussionAlt: 2 };
const symbolFor = clef => clef === 'tenor' ? 'alto' : clef;
const keySteps = {
  treble: [[0, 3, -1, 2, 5, 1, 4], [4, 1, 5, 2, 6, 3, 7]],
  bass: [[2, 5, 1, 4, 7, 3, 6], [6, 3, 7, 4, 8, 5, 9]],
  alto: [[1, 4, 0, 3, 6, 2, 5], [5, 2, 6, 3, 7, 4, 8]],
  tenor: [[-1, 2, 5, 1, 4, 0, 3], [3, 0, 4, 1, 5, 2, 6]],
};

export function musicLayout(state, { top, areaHeight, areaWidth }) {
  const { staves, staffSpacing } = state;
  const paired = staves.length > 1;
  const lyricRows = state.lyricLine ? lyricStaffIndices(staves) : [];
  let bottom = 0;
  const rows = staves.map((staff, index) => {
    const height = staff.height ?? (staff.lines - 1) * staffSpacing;
    const space = staff.lines > 1 ? height / (staff.lines - 1) : staffSpacing;
    const offset = bottom;
    bottom += height;
    const lyricOffset = lyricRows.includes(index) ? bottom + Math.max(7, 3 * space) : null;
    if (lyricOffset !== null) bottom = lyricOffset;
    if (index < staves.length - 1) bottom += staff.gap ?? 3 * staffSpacing;
    return { ...staff, height, space, offset, lyricOffset };
  });
  const staffHeight = bottom;
  const symbolPad = row => {
    if (row.clef === 'none') return 0;
    // Clefs use a five-line reference frame even on a one-line staff.
    return Math.max(0, 4.5 * row.space - row.height / 2);
  };
  const topPad = symbolPad(rows[0]);
  const bottomPad = symbolPad(rows.at(-1));
  const heading = state.musicHeading ? 14 : 0;
  const minimumGap = Math.max(2, topPad + bottomPad, paired ? 4 * staffSpacing : 0);
  const fixed = state.systemGapMode === 'fixed';
  const between = fixed ? state.systemGap : minimumGap;
  const usable = areaHeight - heading - topPad - bottomPad;
  const connectorInset = rows.some(row => row.brace || row.bracket) ? 2 * staffSpacing : 0;
  const labelInset = state.printPartNames ? Math.max(...rows.map(row => Array.from(row.name).length)) * 2.6 + 2 : 0;
  const startInset = connectorInset + labelInset;
  const prefix = Math.max(...rows.map(row => (prefixWidth(state, row.clef) + 2) * row.space));
  const capacity = areaWidth >= startInset + prefix
    ? Math.max(0, Math.floor((usable + between) / (staffHeight + between)))
    : 0;
  const count = Math.min(state.staffCount, capacity);
  const gap = fixed ? between : count > 1 ? (usable - count * staffHeight) / (count - 1) : 0;
  const first = top + heading + topPad + (fixed || count > 1 ? 0 : (usable - staffHeight) / 2);
  return { capacity, count, requestedCount: state.staffCount, staffSpacing, paired, staffHeight, first, gap, rows, startInset, labelInset };
}

const pitches = clef => keySteps[clef === 'vocalTenor' ? 'treble' : clef];
const hasKey = (state, clef) => pitches(clef) && state.keyFifths !== 0;
function digitWidth(digits) {
  return Array.from(digits, d => symbols[d].bounds[2]).reduce((sum, width) => sum + width, 0);
}

function clefWidth(clef) {
  if (clef === 'none') return 0;
  return clef === 'tab' ? 2.5 : 1.3 + symbols[symbolFor(clef)].bounds[2];
}

function prefixWidth(state, clef, meter = true) {
  if (clef === 'none') return 0;
  let width = clefWidth(clef);
  if (hasKey(state, clef)) width += 1.25 * Math.abs(state.keyFifths) + 0.5;
  if (meter && state.meter !== 'none') {
    const meterWidth = symbols[state.meter]?.bounds[2] ?? Math.max(...state.meter.split('/').map(digitWidth));
    width += meterWidth + 0.7;
  }
  return width;
}

export function drawMusic(state, bounds, line, shapes, text, faint) {
  const { count, rows, first, gap, staffHeight, startInset, labelInset } = musicLayout(state, bounds);
  const { left, right } = bounds;
  let start = left + startInset;
  const space = state.staffSpacing;
  if (state.musicHeading) {
    const size = Math.min(3, bounds.areaWidth / 26);
    const y = bounds.top + 4;
    const composerX = left + bounds.areaWidth * 0.6;
    text(left, y, 'Title', size, 'start', state.color);
    line(left + size * 2.4, y, composerX - 3, y, faint);
    text(composerX, y, 'Composer', size, 'start', state.color);
    line(composerX + size * 5.2, y, right, y, faint);
  }
  function symbol(name, x, y, scaleX = space, scaleY = space) {
    const commands = symbols[name].commands.map(([op, ...coords]) => [op, ...coords.map((value, i) =>
      i % 2 ? y - value * scaleY : x + value * scaleX)]);
    shapes.push({ kind: 'filledPath', commands, color: state.color });
  }
  function signs(row, staffTop, signatures) {
    const { clef, space } = row;
    const y = staffTop + row.height / 2 - 2 * space;
    if (clef === 'none') return;
    if (clef === 'tab') {
      for (const [i, letter] of Array.from('TAB').entries()) {
        text(start + space, y + (0.9 + i * 1.5) * space, letter, 1.65 * space, 'middle', state.color, true);
      }
    } else {
      symbol(symbolFor(clef), start + space * 0.45, y + anchors[clef] * space, space, space);
    }
    let x = start + clefWidth(clef) * space;
    if (hasKey(state, clef)) {
      const sharp = state.keyFifths > 0;
      for (const step of pitches(clef)[sharp ? 0 : 1].slice(0, Math.abs(state.keyFifths))) {
        symbol(sharp ? 'sharp' : 'flat', x, y + step * space / 2, space, space);
        x += 1.25 * space;
      }
      x += 0.5 * space;
    }
    if (!signatures) return;
    if (state.meter === 'common' || state.meter === 'cut') {
      symbol(state.meter, x, y + 2 * space, space, space);
    } else if (state.meter !== 'none') {
      const parts = state.meter.split('/');
      const width = Math.max(...parts.map(digitWidth));
      parts.forEach((part, row) => {
        let digitX = x + (width - digitWidth(part)) * space / 2;
        for (const d of part) {
          symbol(d, digitX, y + (1 + 2 * row) * space, space, space);
          digitX += symbols[d].bounds[2] * space;
        }
      });
    }
  }
  for (let group = 0; group < count; group++) {
    start = left + startInset - (group ? labelInset : 0);
    const y = first + group * (staffHeight + gap);
    const signatures = group === 0 || state.repeatSigns === 'all';
    const topLine = row => y + row.offset + (row.lines === 1 ? row.height / 2 : 0);
    const bottomLine = row => topLine(row) + (row.lines - 1) * row.space;
    const joined = new Set();
    rows.forEach((row, i) => {
      const top = topLine(row);
      if (group === 0 && state.printPartNames) {
        text(left + labelInset - 2, y + row.offset + row.height / 2 + 0.9, row.name, 2.6, 'end', state.color);
      }
      if (row.lyricOffset !== null) line(start, y + row.lyricOffset, right, y + row.lyricOffset, faint);
      for (let n = 0; n < row.lines; n++) line(start, top + n * row.space, right, top + n * row.space);
      signs(row, y + row.offset, signatures);
      const span = Math.max(row.join, row.bracket, row.brace ? 2 : 0);
      for (let j = i; j < i + span - 1; j++) joined.add(j);
      if (row.brace) {
        const end = bottomLine(rows[i + 1]);
        symbol('brace', start - 1.5 * space, end, 4 * space, (end - top) / 4);
      }
      if (row.bracket) {
        const end = bottomLine(rows[i + row.bracket - 1]);
        const x = start - (row.brace ? 2 : 1) * space;
        line(x, top, x, end, state.color, state.lineWeight * 2);
        line(x, top, x + 0.65 * space, top);
        line(x, end, x + 0.65 * space, end);
      }
    });
    for (let i = 0; i < rows.length; i++) {
      const nextJoined = joined.has(i), previousJoined = joined.has(i - 1);
      if (nextJoined || previousJoined) line(start, topLine(rows[i]), start,
        nextJoined ? topLine(rows[i + 1]) : bottomLine(rows[i]));
    }
    const contentX = start + Math.max(...rows.map(row => prefixWidth(state, row.clef, signatures) * row.space));
    for (let bar = 1; bar <= state.measures; bar++) {
      const x = contentX + (right - contentX) * bar / state.measures;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i], half = row.lines === 1 ? row.space : 0;
        const top = topLine(row) - half;
        let end = bottomLine(row) + half;
        if (row.brace) end = bottomLine(rows[++i]);
        line(x, top, x, end);
      }
    }
  }
}
