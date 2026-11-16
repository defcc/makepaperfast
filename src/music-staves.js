export const MAX_STAVES = 12;
export const staffClefs = { none: 'Blank', treble: 'Treble', bass: 'Bass', alto: 'Alto', tenor: 'Tenor (C clef)', vocalTenor: 'Vocal tenor (treble 8 below)', percussion: 'Percussion (two bars)', percussionAlt: 'Percussion (rectangle)', tab: 'TAB' };

function staff(name, clef, options = {}) {
  return { name, clef, lines: 5, height: null, gap: null, brace: false, bracket: 0, join: 0, lyrics: null, ...options };
}
const piano = [
  staff('Right hand', 'treble', { brace: true, join: 2 }),
  staff('Left hand', 'bass'),
];
const voices = {
  S: ['Soprano', 'treble'], A: ['Alto', 'treble'], T: ['Tenor', 'vocalTenor'], B: ['Bass', 'bass'],
};
function choir(parts, accompaniment = false) {
  const rows = Array.from(parts, (part, i) => staff(...voices[part], { lyrics: true, ...(i === 0 && { bracket: parts.length, join: parts.length + (accompaniment ? 2 : 0) }) }));
  return accompaniment ? [...rows, ...piano] : rows;
}
function tab(name, lines) { return staff(name, 'tab', { lines }); }
export const musicTemplates = [
  ['blank', 'Blank staff', 'Single staff', [staff('Staff', 'none')]],
  ...['treble', 'bass', 'alto', 'tenor'].map(clef => [clef, staffClefs[clef] + ' clef', 'Single staff', [staff('Staff', clef)]]),
  ['piano', 'Piano grand staff', 'Keyboard', piano],
  ['voice-piano', 'Voice + piano', 'Keyboard', [staff('Voice', 'treble', { join: 3, lyrics: true }), ...piano]],
  ['organ', 'Organ with pedals', 'Keyboard', [{ ...piano[0], join: 3 }, piano[1], staff('Pedals', 'bass')]],
  ['satb', 'SATB', 'Choir', choir('SATB')],
  ['satb-piano', 'SATB + piano', 'Choir', choir('SATB', true)],
  ['sab', 'SAB', 'Choir', choir('SAB')],
  ['ssa', 'SSA', 'Choir', choir('SSA')],
  ['guitar', 'Guitar TAB', 'Guitar & bass', [tab('Guitar', 6)]],
  ['bass-tab', 'Bass TAB', 'Guitar & bass', [tab('Bass guitar', 4)]],
  ['guitar-score', 'Guitar staff + TAB', 'Guitar & bass', [staff('Notation', 'treble', { join: 2 }), tab('Guitar', 6)]],
  ['bass-score', 'Bass staff + TAB', 'Guitar & bass', [staff('Notation', 'bass', { join: 2 }), tab('Bass guitar', 4)]],
  ['drums', 'Drum kit', 'Percussion', [staff('Drums', 'percussion')]],
  ['single-drum', 'Single-line percussion', 'Percussion', [staff('Percussion', 'percussion', { lines: 1 })]],
  ['drums-alt', 'Drum kit · rectangle clef', 'Percussion', [staff('Drums', 'percussionAlt')]],
  ['single-drum-alt', 'Single line · rectangle clef', 'Percussion', [staff('Percussion', 'percussionAlt', { lines: 1 })]],
].map(([id, label, group, staves]) => ({ id, label, group, staves }));

function number(value, fallback, min, max) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}
export function readStaves(input, legacy) {
  let rows = input.staves;
  if (typeof rows === 'string') {
    try { rows = JSON.parse(rows); } catch { rows = null; }
  }
  if (Array.isArray(rows) && rows.length && rows.length <= MAX_STAVES && rows.every(r => r && typeof r === 'object')) {
    let previousBraced = false;
    return rows.map((row, i) => {
      const remaining = rows.length - i;
      const brace = row.brace === true && remaining >= 2 && !previousBraced;
      previousBraced = brace;
      const span = value => value >= 2 ? Math.floor(number(value, 0, 0, remaining)) : 0;
      return staff(String(row.name || 'Staff').slice(0, 32), Object.hasOwn(staffClefs, row.clef) ? row.clef : 'none', {
        lines: Math.round(number(row.lines, 5, 1, 20)), height: number(row.height, null, 1, 80),
        gap: number(row.gap, null, 0, 60), brace,
        bracket: remaining >= 2 ? span(row.bracket) : 0, join: remaining >= 2 ? span(row.join) : 0, lyrics: typeof row.lyrics === 'boolean' ? row.lyrics : null,
      });
    });
  }
  const preset = musicTemplates.find(t => t.id === input.musicTemplate);
  if (preset) return preset.staves;
  if (legacy.staffLayout === 'piano') return piano;
  const notation = staff('Staff', legacy.clef);
  const oldTab = staff('Tablature', 'none', { lines: legacy.tabStrings });
  if (legacy.staffLayout === 'tab') return [oldTab];
  if (legacy.staffLayout === 'combined') return [{ ...notation, join: 2 }, oldTab];
  return [notation];
}
export function matchingTemplate(staves) {
  const value = JSON.stringify(staves);
  return musicTemplates.find(template => JSON.stringify(template.staves) === value);
}

// Keep a connector attached to the surviving parts when a row is inserted or removed.
export function changeStaffList(staves, index, insert) {
  const rows = staves.map((row, i) => {
    if (i >= index) return row;
    const next = { ...row };
    for (const key of ['bracket', 'join']) {
      if (i + row[key] > index) {
        const span = row[key] + (insert ? 1 : -1);
        next[key] = span >= 2 ? span : 0;
      }
    }
    if (i + 1 === index && row.brace) next.brace = false;
    return next;
  });
  if (insert) rows.splice(index, 0, { ...insert, brace: false, bracket: 0, join: 0 });
  else rows.splice(index, 1);
  return rows;
}

// Anonymous layouts from older links placed their lyric line under the last staff.
export function lyricStaffIndices(staves) {
  if (staves.length === 1) return [0];
  if (staves.some(row => row.lyrics != null)) return staves.flatMap((row, i) => row.lyrics ? [i] : []);
  const voices = staves.flatMap((row, i) => /^(Voice|Soprano|Alto|Tenor|Bass)$/i.test(row.name) ? [i] : []);
  return voices.length ? voices : [staves.length - 1];
}
