import { FIELDS } from './paper-catalog.js';
import { PAPER_SIZES } from './paper-engine.js';

const mmPerInch = 25.4;
const fractions = ['1/10', '1/8', '1/5', '1/4', '3/8', '1/2', '3/4'];

function parseInches(text) {
  const fraction = /^(?:(\d+)[ -]+)?(\d+)\s*\/\s*(\d+)$/.exec(text.replace(/⅛$/, ' 1/8').trim());
  if (fraction) return Number(fraction[1] || 0) + Number(fraction[2]) / Number(fraction[3]);
  return /^(?:\d+\.?\d*|\.\d+)$/.test(text) ? Number(text) : NaN;
}

export function spacingInMm(text, unit) {
  if (unit === 'mm') return Number(text);
  return Number((parseInches(text.trim()) * mmPerInch).toFixed(9));
}

function inchPreset(inches, label = inches + ' in', detail) {
  return { inches, value: spacingInMm(inches, 'in'), label, detail };
}

const inchOptions = fractions.map(inches => inchPreset(inches));

const graphOptions = [
  ['1/16', '16'], ['1/12', '12'], ['1/10', '10'], ['1/8', '8'], ['1/6', '6'], ['1/5', '5'], ['1/4', '4'],
  ['1/3', '3'], ['3/8', '2⅔'], ['1/2', '2'], ['3/4', '1⅓'], ['1', '1'],
].map(([inches, perInch]) => inchPreset(
  inches, inches + ' in', perInch + (perInch === '1' ? ' square/in' : ' squares/in'),
));

const usRuledOptions = [
  inchPreset('9/32', 'College ruled', '9/32 in'),
  inchPreset('11/32', 'Wide ruled', '11/32 in'),
];

export const notebookRulings = [
  inchPreset('1/4', 'Narrow ruled'),
  ...usRuledOptions,
];
export const classroomRulings = ['3/8', '1/2', '5/8', '3/4', '1 1/8'].map(inches => inchPreset(inches));

const ruledOptions = [...usRuledOptions, ...inchOptions];

const inchLabels = new Map(
  [...graphOptions, ...ruledOptions, ...classroomRulings].map(({ value, inches }) => [value, inches]),
);

export function spacingUnit(paper) {
  return paper.spacingUnit ?? (PAPER_SIZES[paper.size]?.system === 'US' ? 'in' : 'mm');
}

const hexInches = ['1/8', '1/5', '1/4', '3/8', '1/2', '3/4', '1', '1 1/2', '2'].map(value => inchPreset(value));
for (const { value, inches } of hexInches) inchLabels.set(value, inches);

export function spacingOptions(paper) {
  if (paper.type === 'hex') return spacingUnit(paper) === 'in' ? hexInches
    : [3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 50].map(value => ({ value, label: value + ' mm' }));
  if (spacingUnit(paper) === 'mm') return FIELDS.spacing.options;
  if (paper.type === 'graph') return graphOptions;
  if (paper.type === 'lined' || (paper.type === 'cornell' && paper.noteStyle === 'lined')) return ruledOptions;
  return inchOptions;
}

export function spacingText(mm, unit) {
  if (unit === 'mm') return String(mm);
  return inchLabels.get(mm) ?? String(Number((mm / mmPerInch).toFixed(6)));
}

export function spacingLabel(paper) {
  const unit = spacingUnit(paper);
  return spacingText(paper.spacing, unit) + ' ' + unit;
}
