import { readSpecialty } from './specialty-settings.js';

// Each paper owns its controls. Navigation and forms use the same catalog.
export const CATEGORIES = [
  { id: 'grid', name: 'Graph & grid' },
  { id: 'writing', name: 'Writing & notes' },
  { id: 'music', name: 'Music paper' },
];

export const PAPER_TYPES = {
  graph: { name: 'Graph paper', short: 'Graph Paper', category: 'grid', description: 'Square grids, just the way you need them.', spacingLabel: 'Grid spacing', spacing: 5, controls: ['spacing', 'majorEvery'], more: [] },
  dot: { name: 'Dot grid paper', short: 'Dot grid', category: 'grid', description: 'Make a square or triangular dot grid with your choice of spacing and dot diameter.', spacingLabel: 'Dot spacing', spacing: 5, controls: ['dotLayout', 'spacing', 'dotSize'], more: [] },
  isometric: { name: 'Isometric paper', short: 'Isometric', category: 'grid', description: 'Equilateral guides for drawing in three dimensions.', spacingLabel: 'Triangle side', spacing: 8, controls: ['spacing', 'isoStyle', 'isoOrientation'], more: ['dotSize'] },
  hex: { name: 'Hexagonal graph paper', short: 'Hex grid', category: 'grid', description: 'Print honeycomb grids for chemistry, maps and quilt designs. Set a hexagon side length or flat-to-flat distance.', spacingLabel: 'Hex size', spacing: 5, controls: ['spacing', 'hexOrientation', 'hexLabels'], more: [] },
  coordinate: { name: 'Coordinate paper', short: 'Coordinate', category: 'grid', description: 'Set the range, quadrants, and labels for your graph.', spacingLabel: 'Grid spacing', spacing: 5, controls: ['quadrants', 'axisRange', 'showNumbers'], more: ['majorEvery'] },
  lined: { name: 'Lined paper', short: 'Lined', category: 'writing', description: 'Print narrow, college, or wide ruled sheets with custom margins and line styles.', spacingLabel: 'Line spacing', spacing: 25.4 * 9 / 32, controls: ['spacing', 'ruleMargin'], more: [] },
  handwriting: { name: 'Handwriting paper', short: 'Handwriting', category: 'writing', description: 'Make printable two-line, three-line, or four-line handwriting practice paper with your choice of letter height and row gap.', spacingLabel: 'Letter height', spacing: 12, controls: ['practiceRuling', 'spacing', 'rowGap', 'midlineStyle', 'practiceText'], more: [] },
  calligraphy: { color: '#000000', name: 'Calligraphy guide paper', short: 'Calligraphy', category: 'writing', description: 'Print writing guides with custom x-height, ascender and descender proportions, and slant lines.', controls: [], more: [], spacing: 5 },
  cornell: { name: 'Cornell notes', short: 'Cornell notes', category: 'writing', description: 'Design a Cornell sheet with a cue column, a ruled or gridded notes area, and space for a summary.', spacingLabel: 'Note spacing', spacing: 8, controls: ['noteStyle', 'cueWidth', 'summaryHeight'], more: ['spacing', 'dotSize'] },
  music: { name: 'Music staff paper', short: 'Music staff', category: 'music', description: 'Print manuscript paper for piano, organ, choir, guitar TAB, or percussion with editable staves and signatures.', spacingLabel: 'Staff gap', spacing: 12, controls: ['staffCount', 'staffSpacing'], more: [] },
};

const options = (values, suffix = '') => values.map(value => ({ value, label: `${value}${suffix}` }));
export const POINTS_PER_MM = 72 / 25.4;
export const MAX_PAGE_COUNT = 500;
export function readPageCount(value) {
  const count = Number(value);
  return Number.isSafeInteger(count) ? Math.max(1, Math.min(count, MAX_PAGE_COUNT)) : 1;
}
export const LINE_THICKNESS_PT = { min: 0.1, max: 2, default: 0.5 };

// Older shared links and preferences store lineWeight in millimeters.
export function readThicknessPt(input) {
  const raw = input.lineWeightPt ?? input.lineWeight;
  if (raw == null || String(raw).trim() === '') return LINE_THICKNESS_PT.default;
  const points = input.lineWeightPt != null ? Number(raw) : Number(raw) * POINTS_PER_MM;
  if (!Number.isFinite(points)) return LINE_THICKNESS_PT.default;
  return Math.min(LINE_THICKNESS_PT.max, Math.max(LINE_THICKNESS_PT.min, points));
}
const quadrantPresets = [
  { value: 'four', label: 'All four', x: 0, y: 0 },
  { value: 'second', label: 'Quadrant II', x: -1, y: 1 },
  { value: 'first', label: 'Quadrant I', x: 1, y: 1 },
  { value: 'third', label: 'Quadrant III', x: -1, y: -1 },
  { value: 'fourth', label: 'Quadrant IV', x: 1, y: -1 },
];

export function quadrantBounds(quadrants, x, y) {
  const preset = quadrantPresets.find(option => option.value === quadrants) ?? quadrantPresets[0];
  return {
    xMin: preset.x > 0 ? 0 : -x, axisRange: preset.x < 0 ? 0 : x,
    yMin: preset.y > 0 ? 0 : -y, yRange: preset.y < 0 ? 0 : y,
  };
}

export const FIELDS = {
  spacing: { label: 'Spacing', type: 'number', min: 2, max: 25.4, options: options([2, 3, 4, 5, 6, 6.35, 7, 8, 10, 12, 15, 20], ' mm') },
  majorEvery: { label: 'Bold grid lines', type: 'number', options: [0, 2, 4, 5, 10].map(value => ({ value, label: guideLabel(value) })) },
  dotLayout: { label: 'Dot layout', type: 'string', options: [{ value: 'square', label: 'Square' }, { value: 'triangular', label: 'Triangular' }] },
  dotSize: { label: 'Dot diameter', type: 'number', min: 0.2, max: 2, options: options([0.2, 0.35, 0.5, 0.7, 1, 1.2, 2], ' mm') },
  axisRange: { label: 'Axis range', type: 'number', options: options([5, 10, 20]) },
  quadrants: { label: 'Quadrants', type: 'string', options: quadrantPresets },
  showNumbers: { label: 'Axis numbers', type: 'boolean', options: [{ value: 'true', label: 'Show' }, { value: 'false', label: 'Hide' }] },
  isoOrientation: { label: 'Grid orientation', type: 'string', options: [{ value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }] },
  hexLabels: { label: 'Map coordinates', type: 'boolean', options: [{ value: 'false', label: 'Off' }, { value: 'true', label: 'Column–row' }] },
  hexOrientation: { label: 'Hex orientation', type: 'string', options: [{ value: 'flat', label: 'Flat top' }, { value: 'pointy', label: 'Pointy top' }] },
  isoStyle: { label: 'Grid style', type: 'string', options: [{ value: 'lines', label: 'Lines' }, { value: 'dots', label: 'Dots' }] },
  noteStyle: { label: 'Notes area', type: 'string', options: [{ value: 'lined', label: 'Lined' }, { value: 'dot', label: 'Dot grid' }, { value: 'grid', label: 'Square grid' }, { value: 'blank', label: 'Blank' }] },
  cueWidth: { label: 'Cue column', type: 'number', min: 18, max: 35, options: options([18, 20, 25, 30, 35], '%') },
  summaryHeight: { label: 'Summary area', type: 'number', min: 0, max: 65, options: [{ value: 0, label: 'None' }, ...options([20, 30, 40, 50.8, 55, 65], ' mm')] },
  staffCount: { label: 'Staves per page', type: 'number', min: 1, max: 24, options: options([1, 2, 4, 6, 8, 10, 12, 16, 20, 24]) },
  staffSpacing: { label: 'Staff line spacing', type: 'number', options: options([1.5, 2, 2.5, 3, 4], ' mm') },
};

export const marginSides = ['Top', 'Bottom', 'Left', 'Right'];
export const rulingStyles = ['Solid', 'Dashed', 'Dotted'].map(label => ({ label, value: label.toLowerCase() }));
export const NOTEBOOK_LAYOUT = {
  headingSpace: 32, ruleMargin: 32, rightGuide: 0, margin: 0, color: '#91add0', marginColor: '#d79099',
  rightMarginColor: '#d79099',
  separateMargins: false, marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
  rulingStyle: 'solid', maxLines: 0,
};

export const LETTER_BOX_WIDTH = { min: 4, max: 30, default: 10 };
export const SPACER_WIDTH = { min: 0.1, max: 30 };
export function letterSpacerWidth(paper, boxWidth = paper.boxWidth) {
  return paper.spacerWidth ?? boxWidth / 5;
}
export const HANDWRITING_LAYOUT = {
  practiceRuling: 'three', rowGap: 6, descenderDepth: PAPER_TYPES.handwriting.spacing / 2, midlineStyle: 'dashed', lowercaseHeight: 50,
  practiceText: '', topLineStyle: 'solid', baselineStyle: 'solid', bottomLineStyle: 'solid', boxLineStyle: 'dotted',
  topLineColor: null, midlineColor: null, bottomLineColor: null, boxLineColor: null,
  baselineColor: '#c56b72', color: '#84a2c6',
  highlightLowercase: false, highlightColor: '#fff2d8',
  letterBoxes: false, boxWidth: LETTER_BOX_WIDTH.default, boxSpacers: false, spacerWidth: null,
};

export const MAX_AXIS_RANGE = 50;
export const numberIntervals = [0, 1, 2, 5, 10];

export function coordinateSettings(input) {
  function endpoint(value, fallback) {
    const n = Number(value);
    return value != null && String(value).trim() && Number.isInteger(n) && Math.abs(n) <= MAX_AXIS_RANGE ? n : fallback;
  }
  const xExtent = Math.abs(endpoint(input.axisRange, 10)) || Math.abs(endpoint(input.xMin, 10)) || 10;
  const yExtent = Math.abs(endpoint(input.yRange, xExtent)) || Math.abs(endpoint(input.yMin, xExtent)) || xExtent;
  const preset = quadrantBounds(input.quadrants, xExtent, yExtent);
  function bounds(minimum, maximum, presetMin, presetMax) {
    // Without an explicit minimum, older links specify a preset and its extent.
    if (minimum == null) return [presetMin, presetMax];
    const min = endpoint(minimum, presetMin), max = endpoint(maximum, presetMax);
    return min < max ? [min, max] : [presetMin, presetMax];
  }
  const [xMin, axisRange] = bounds(input.xMin, input.axisRange, preset.xMin, preset.axisRange);
  const [yMin, yRange] = bounds(input.yMin, input.yRange, preset.yMin, preset.yRange);
  const side = (min, max) => min === 0 ? 1 : max === 0 ? -1 : min === -max ? 0 : null;
  const quadrants = quadrantPresets.find(p => p.x === side(xMin, axisRange) && p.y === side(yMin, yRange))?.value ?? 'custom';
  const interval = Number(input.labelEvery);
  return { xMin, axisRange, yMin, yRange, quadrants,
    labelEvery: numberIntervals.includes(interval) ? interval : 0 };
}

export function coordinateRangeLabel(paper) {
  const range = (min, max) => (min + ' to ' + max).replaceAll('-', '−');
  const x = range(paper.xMin, paper.axisRange);
  return paper.xMin === paper.yMin && paper.axisRange === paper.yRange ? x
    : 'x ' + x + ' · y ' + range(paper.yMin, paper.yRange);
}

export function defaultsFor(type) {
  return { ...readSpecialty(type), ...(type === 'music' && { separateMargins: false }), pageCount: 1, spacing: PAPER_TYPES[type].spacing, margin: 12, lineWeightPt: LINE_THICKNESS_PT.default, majorEvery: 0, axisRange: 10, showNumbers: true, dotLayout: 'square', dotSize: 0.5, ruleMargin: 0, quadrants: 'four', isoStyle: 'lines', ...(type === 'hex' && { hexOrientation: 'flat', hexLabels: false, spacingUnit: 'mm' }), ...(type === 'isometric' && { isoOrientation: 'horizontal', spacingUnit: 'mm' }), cueWidth: 25, summaryHeight: 40, noteStyle: 'lined', staffCount: 12, staffSpacing: 2, ...(type === 'coordinate' && coordinateSettings({})), ...(type === 'calligraphy' && { color: PAPER_TYPES.calligraphy.color }), ...(type === 'lined' && NOTEBOOK_LAYOUT), ...(type === 'handwriting' && HANDWRITING_LAYOUT) };
}

export function maxSpacing(type) {
  if (type === 'hex') return 50.8;
  return type === 'handwriting' ? 28.575 : FIELDS.spacing.max;
}

export function minSpacing(type) {
  return type === 'graph' ? 25.4 / 16 : FIELDS.spacing.min;
}

export function guideLabel(interval) {
  if (!interval) return 'None';
  return interval === 1 ? 'Every square' : `Every ${interval} squares`;
}

export function guideInterval(value, fallback) {
  if (value == null || String(value).trim() === '') return fallback;
  const interval = Number(value);
  return Number.isSafeInteger(interval) && interval >= 0 ? interval : fallback;
}
