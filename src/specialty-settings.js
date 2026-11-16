import { readStaves } from './music-staves.js';

const choices = (label, initial, pairs) => ({
  label, initial, options: pairs.map(([value, name]) => ({ value, label: name })),
});
const numeric = (label, initial, min, max, step = 'any') => ({ label, initial, min, max, step });
const switchSetting = (label, initial = false) => ({ label, initial });
const rules = [['solid', 'Solid'], ['dashed', 'Dashed'], ['dotted', 'Dotted']];
const guideRules = [...rules, ['off', 'Hidden']];

export const specialtyFields = {
  hex: {
    hexMeasure: choices('Use this size for', 'side', [['side', 'Side length'], ['flats', 'Across flats']]),
  },
  cornell: {
    dividerStyle: choices('Line style', 'solid', rules),
    dividerThicknessPt: numeric('Thickness (pt)', 0.75, 0.1, 2),
    dividerColor: { label: 'Divider color', initial: '#535953', kind: 'color' },
    noteHeader: choices('Page heading', 'none', [['none', 'None'], ['topic', 'Topic & date'], ['course', 'Course, topic & date']]),
    cueRuling: choices('Cue column ruling', 'blank', [['blank', 'Blank'], ['lined', 'Lined']]),
    summaryRuling: choices('Summary ruling', 'blank', [['blank', 'Blank'], ['lined', 'Lined'], ['grid', 'Square grid']]),
    summaryPitch: numeric('Summary spacing (mm)', 4, 2, 20),
    sectionLabels: switchSetting('Print section labels'),
  },
  music: {
    staffLayout: choices('Staff layout', 'standard', [['standard', 'Single staff'], ['piano', 'Piano grand staff'], ['tab', 'TAB only'], ['combined', 'Staff + TAB']]),
    tabStrings: numeric('Number of strings', 6, 3, 8, 1),
    clef: choices('Clef', 'none', [['none', 'Blank'], ['treble', 'Treble'], ['bass', 'Bass'], ['alto', 'Alto'], ['tenor', 'Tenor'], ['percussion', 'Percussion (two bars)'], ['percussionAlt', 'Percussion (rectangle)']]),
    keyFifths: choices('Key signature', 0, Array.from({ length: 15 }, (_, i) => {
      const keys = ['C♭', 'G♭', 'D♭', 'A♭', 'E♭', 'B♭', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯'];
      const minor = ['A♭', 'E♭', 'B♭', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯', 'G♯', 'D♯', 'A♯'];
      return [i - 7, keys[i] + ' major / ' + minor[i] + ' minor' + (i === 7 ? '' : ' · ' + Math.abs(i - 7) + (i < 7 ? '♭' : '♯'))];
    })),
    meter: choices('Time signature', 'none', ['none', '2/4', '3/4', '4/4', '5/4', '6/8', '9/8', '12/8', '2/2', '3/8'].map(v => [v, v === 'none' ? 'Blank' : v]).concat([['common', 'C · Common time'], ['cut', '¢ · Cut time']])),
    repeatSigns: choices('Print time signature', 'first', [['first', 'First system'], ['all', 'Every system']]),
    musicHeading: switchSetting('Title and composer fields'),
    lyricLine: switchSetting('Lyric lines'),
    printPartNames: switchSetting('Print part names on the first system'),
    systemGapMode: choices('Space between systems', 'auto', [['auto', 'Fill page'], ['fixed', 'Fixed gap']]),
    systemGap: numeric('Gap between systems (mm)', 12, 1, 100),
    measures: numeric('Measures per system (0 for blank)', 0, 0, 16, 1),
  },
  calligraphy: {
    xHeight: numeric('X-height (mm)', 5, 0.1, 300),
    nibRuling: switchSetting('Use nib widths'),
    ascRatio: numeric('Ascender (× x-height)', 2, 0, 10),
    descRatio: numeric('Descender (× x-height)', 2, 0, 10),
    groupGap: numeric('Row gap (mm)', 6, 0, 30),
    marginX: numeric('Left and right (mm)', 15, 0, 30),
    marginY: numeric('Top and bottom (mm)', 15, 0, 30),
    horizontalOn: switchSetting('Show X-lines (horizontal)', true),
    horizontalTint: numeric('Horizontal line strength (%)', 50, 5, 100, 1),
    baselineRule: choices('Baseline', 'solid', guideRules),
    waistRule: choices('Waistline', 'solid', guideRules),
    outerRule: choices('Ascender line', 'solid', guideRules),
    descRule: choices('Descender line', 'solid', guideRules),
    showDescenders: switchSetting('Include descender space', true),
    innerRule: choices('First ascender and descender guides', 'dashed', guideRules),
    guideLabels: choices('Row markers', 'baseline', [['none', 'None'], ['baseline', 'Baseline (X)'], ['all', 'All']]),
    emphasis: choices('Emphasis', 'color', [['none', 'None'], ['color', 'Color both lines'], ['band', 'Shade x-height']]),
    waistColor: { label: 'Waistline color', initial: '#466fb8', kind: 'color' },
    accentColor: { label: 'Accent color', initial: '#c75a61', kind: 'color' },
    digitGuide: switchSetting('Add a figure-height guide (1½ × x-height)'),
    subdivisions: numeric('Divisions per x-height', 1, 1, 12, 1),
    subdivisionRule: choices('Subdivision lines', 'off', guideRules),
    verticalOn: switchSetting('Show Y-lines (vertical)'),
    verticalPitch: numeric('Y-line spacing (mm)', 15, 1, 2000),
    verticalRule: choices('Vertical line style', 'solid', rules),
    verticalTint: numeric('Vertical strength (%)', 20, 5, 100, 1),
    throughGap: switchSetting('Extend vertical and slant lines across row gaps', true),
    slantOn: switchSetting('Show first slant lines', true),
    slantAngle: numeric('Angle from baseline (°)', 55, 15, 165),
    slantSpacing: numeric('Spacing (mm)', 15, 0.5, 60),
    slantRule: choices('Slant line style', 'solid', rules),
    secondOn: switchSetting('Show second slant lines'),
    secondAngle: numeric('Second angle (°)', 25, 15, 165),
    secondSpacing: numeric('Second spacing (mm)', 20, 0.5, 60),
    secondRule: choices('Second line style', 'solid', rules),
    guideTint: numeric('Slant guide strength (%)', 20, 5, 100, 1),
    secondTint: numeric('Second slant strength (%)', 25, 5, 100, 1),
    guideInfo: switchSetting('Print guide dimensions', true),
    dateField: switchSetting('Print a date field', true),
  },
};

export function readSpecialty(type, input = {}) {
  if (type === 'calligraphy') {
    // Old shared sheets used one margin, one outer style and one header switch.
    input = { ...input, marginX: input.marginX ?? input.margin, marginY: input.marginY ?? input.margin,
      descRule: input.descRule ?? input.outerRule, secondTint: input.secondTint ?? input.guideTint,
      dateField: input.dateField ?? input.guideInfo };
  }
  const values = {};
  for (const [key, field] of Object.entries(specialtyFields[type] ?? {})) {
    const raw = input[key];
    let value = field.initial;
    if (raw != null && raw !== '') {
      if (field.options) value = field.options.find(option => String(option.value) === String(raw))?.value ?? value;
      else if (field.kind === 'color') value = /^#[0-9a-f]{6}$/i.test(raw) ? raw.toLowerCase() : value;
      else if (typeof value === 'boolean') value = ['true', 'false'].includes(String(raw)) ? String(raw) === 'true' : value;
      else if (Number.isFinite(Number(raw))) {
        const n = field.step === 1 ? Math.round(Number(raw)) : Number(raw);
        value = Math.max(field.min, Math.min(field.max, n));
      }
    }
    values[key] = value;
  }
  if (type === 'music') {
    values.staves = readStaves(input, values);
    const oldGap = values.staves.at(-1).gap;
    if (input.systemGapMode == null && oldGap > 0) {
      values.systemGapMode = 'fixed';
      values.systemGap = oldGap;
    }
  }
  if (type === 'calligraphy') {
    // Earlier sheets measured slant spacing along the baseline.
    for (const [spacing, pitch, angle] of [['slantSpacing', 'slantPitch', 'slantAngle'], ['secondSpacing', 'secondPitch', 'secondAngle']]) {
      if (input[spacing] == null && Number(input[pitch]) > 0) {
        const oldPitch = Math.min(60, Math.max(2, Number(input[pitch])));
        const oldAngle = input[angle] == null && angle === 'secondAngle' ? 90 : values[angle];
        values[angle] = oldAngle;
        values[spacing] = oldPitch * Math.sin(oldAngle * Math.PI / 180);
      }
    }
    if (input.nibRuling == null) values.nibRuling = values.subdivisions > 1 || values.subdivisionRule !== 'off'
      || ![1, 1.5, 2].includes(values.ascRatio) || (values.descRatio > 0 && values.descRatio !== values.ascRatio);
  }
  return values;
}

// Resolve the active ruling once for both the controls and the printed sheet.
// Numeric guides use a fixed ratio. Keep the editable heights for when they are turned off.
export function calligraphyRuling(paper) {
  const ascRatio = paper.digitGuide ? 2 : paper.ascRatio;
  const descRatio = paper.showDescenders && paper.descRatio > 0 ? (paper.digitGuide ? 2 : paper.descRatio) : 0;
  const custom = !paper.digitGuide && paper.nibRuling;
  let markers = paper.guideLabels;
  if (custom && markers === 'baseline') markers = 'all';
  if (!custom && paper.xHeight < 4) markers = 'none';
  else if (paper.digitGuide) markers = 'baseline';
  return { ascRatio, descRatio, custom, markers, innerRule: paper.digitGuide ? 'dashed' : paper.innerRule };
}
