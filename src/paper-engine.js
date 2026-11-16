/**
 * MakePaperFast's dependency-free paper renderer.
 * All geometry is expressed in millimetres; SVG and PDF share the same scene.
 * Both coordinate axes use the same physical distance per unit.
 */

import { hexSideLength, drawHexLabels, hexGridLayout, hexGridSVG, hexGridPDF } from './hex-grid.js';
import { musicLayout, drawMusic } from './music-paper.js';
import { calligraphyLayout, drawCalligraphy, drawCornell } from './writing-paper.js';
import { readSpecialty } from './specialty-settings.js';
import { measurePracticeLetters, practicePaths, readPracticeText } from './practice-text.js';
import { coordinateSettings, FIELDS, HANDWRITING_LAYOUT, LETTER_BOX_WIDTH, SPACER_WIDTH, letterSpacerWidth, NOTEBOOK_LAYOUT, PAPER_TYPES, POINTS_PER_MM, readPageCount, readThicknessPt, minSpacing, maxSpacing, guideInterval, marginSides, rulingStyles } from './paper-catalog.js';

export const PAPER_SIZES = Object.freeze({
  a2: { system: 'ISO', width: 420, height: 594, label: 'A2' },
  a3: { system: 'ISO', width: 297, height: 420, label: 'A3' },
  a4: { system: 'ISO', width: 210, height: 297, label: 'A4' },
  a5: { system: 'ISO', width: 148, height: 210, label: 'A5' },
  letter: { system: 'US', width: 215.9, height: 279.4, label: 'US Letter' },
  legal: { system: 'US', width: 215.9, height: 355.6, label: 'Legal' },
  tabloid: { system: 'US', width: 279.4, height: 431.8, label: 'Tabloid' },
  poster: { system: 'US', width: 609.6, height: 914.4, label: 'Poster' },
});

export const CUSTOM_MIN_MM = 50;
export const CUSTOM_MAX_MM = 1000;

export function paperSizeSettings(input) {
  if (input.size === 'custom') {
    const width = Number(input.customWidth), height = Number(input.customHeight);
    if ([width, height].every(n => n >= CUSTOM_MIN_MM && n <= CUSTOM_MAX_MM)) {
      return { size: 'custom', customWidth: Math.min(width, height), customHeight: Math.max(width, height) };
    }
  }
  return { size: Object.hasOwn(PAPER_SIZES, input.size) ? input.size : 'a4' };
}

export function maxPageMargin(input) {
  if (input.size !== 'custom') return 30;
  // Reserve space for the grid, axis labels and note columns on small sheets.
  const { width, height } = getDimensions(input);
  const reserved = input.type === 'handwriting' ? 40 : 36;
  return Math.min(30, Math.floor((Math.min(width, height) - reserved) / 2));
}
const number = (value, fallback, min, max) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const validColor = (value, fallback) => /^#[a-f\d]{6}$/i.test(value || '') ? value : fallback;
const rounded = (n) => Number(n.toFixed(4)).toString();
const xml = (value) => String(value).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
}[c]));
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const mix = (first, second, amount) => {
  const a = rgb(first), b = rgb(second);
  return '#' + a.map((v, i) => Math.round(v * (1 - amount) + b[i] * amount).toString(16).padStart(2, '0')).join('');
};

const oppositeSide = { Top: 'Bottom', Bottom: 'Top', Left: 'Right', Right: 'Left' };
export function musicMarginLimit(input, side) {
  const { width, height } = getDimensions(input);
  const length = side === 'Left' || side === 'Right' ? width : height;
  return Math.max(0, length - (input['margin' + oppositeSide[side]] ?? 0) - 2);
}

export function musicMargins(input) {
  const separateMargins = String(input.separateMargins) === 'true';
  const uniform = number(input.margin ?? 12, 12, 0, maxPageMargin(input));
  const sides = { separateMargins };
  const { width, height } = getDimensions(input);
  for (const [first, last, length] of [['marginLeft', 'marginRight', width], ['marginTop', 'marginBottom', height]]) {
    sides[first] = separateMargins ? number(input[first] ?? uniform, uniform, 0, length - 2) : uniform;
    sides[last] = separateMargins ? number(input[last] ?? uniform, uniform, 0, length - 2 - sides[first]) : uniform;
  }
  return sides;
}

export function linedLayout(input) {
  const separateMargins = String(input.separateMargins) === 'true';
  const maxMargin = maxPageMargin(input);
  const margin = number(input.margin ?? 0, 0, 0, maxMargin);
  const sides = {};
  for (const side of marginSides) {
    const key = 'margin' + side;
    sides[key] = separateMargins ? number(input[key] ?? margin, margin, 0, maxMargin) : margin;
  }
  const { width, height } = getDimensions(input);
  const maxGuide = Math.min(60, Math.floor(width - sides.marginLeft - sides.marginRight - 2));
  const maxHeading = Math.min(50, Math.floor(height - sides.marginTop - sides.marginBottom - 2));
  const leftGuide = number(input.ruleMargin, NOTEBOOK_LAYOUT.ruleMargin, 0, maxGuide);
  const marginColor = validColor(input.marginColor, NOTEBOOK_LAYOUT.marginColor);
  return {
    separateMargins, ...sides,
    headingSpace: number(input.headingSpace, input.ruleMargin == null ? NOTEBOOK_LAYOUT.headingSpace : 0, 0, maxHeading),
    ruleMargin: leftGuide, rightGuide: number(input.rightGuide, 0, 0, Math.min(maxGuide, Math.floor(width - sides.marginLeft - sides.marginRight - leftGuide - 2))),
    marginColor, rightMarginColor: validColor(input.rightMarginColor, marginColor),
    rulingStyle: rulingStyles.some(style => style.value === input.rulingStyle) ? input.rulingStyle : 'solid',
    maxLines: Math.floor(number(input.maxLines, 0, 0, 500)),
  };
}

export function handwritingLayout(input) {
  const defaults = HANDWRITING_LAYOUT;
  const spacerWidth = Number(input.spacerWidth);
  const practiceRuling = ['two', 'three', 'four'].includes(input.practiceRuling) ? input.practiceRuling : defaults.practiceRuling;
  const guideStyle = (key, fallback = defaults[key]) => rulingStyles.some(option => option.value === input[key]) ? input[key] : fallback;
  return {
    practiceRuling,
    practiceText: readPracticeText(input.practiceText),
    rowGap: number(input.rowGap, defaults.rowGap, 2, 25),
    topLineStyle: guideStyle('topLineStyle'),
    midlineStyle: guideStyle('midlineStyle', practiceRuling === 'two' ? 'solid' : defaults.midlineStyle),
    baselineStyle: guideStyle('baselineStyle'),
    boxLineStyle: guideStyle('boxLineStyle'),
    bottomLineStyle: guideStyle('bottomLineStyle'),
    lowercaseHeight: number(input.lowercaseHeight, defaults.lowercaseHeight, 0, 100),
    descenderDepth: number(input.descenderDepth,
      number(input.spacing, PAPER_TYPES.handwriting.spacing, minSpacing('handwriting'), maxSpacing('handwriting')) / 2,
      0.1, maxSpacing('handwriting')),
    topLineColor: validColor(input.topLineColor, null)?.toLowerCase() ?? null,
    midlineColor: validColor(input.midlineColor, null)?.toLowerCase() ?? null,
    bottomLineColor: validColor(input.bottomLineColor, null)?.toLowerCase() ?? null,
    boxLineColor: validColor(input.boxLineColor, null)?.toLowerCase() ?? null,
    baselineColor: validColor(input.baselineColor, defaults.baselineColor).toLowerCase(),
    highlightLowercase: String(input.highlightLowercase) === 'true',
    highlightColor: validColor(input.highlightColor, defaults.highlightColor).toLowerCase(),
    letterBoxes: String(input.letterBoxes) === 'true',
    boxSpacers: String(input.boxSpacers) === 'true',
    spacerWidth: spacerWidth >= SPACER_WIDTH.min && spacerWidth <= SPACER_WIDTH.max ? spacerWidth : null,
    boxWidth: number(input.boxWidth, defaults.boxWidth, LETTER_BOX_WIDTH.min, LETTER_BOX_WIDTH.max),
    color: validColor(input.color, defaults.color).toLowerCase(),
  };
}

function normalize(input = {}) {
  const specialty = readSpecialty(input.type, input);
  const notebook = input.type === 'lined' ? NOTEBOOK_LAYOUT : {};
  return {
    ...specialty,
    ...(input.type === 'cornell' && { dividerWeight: specialty.dividerThicknessPt / POINTS_PER_MM }),
    type: Object.hasOwn(PAPER_TYPES, input.type) ? input.type : 'graph',
    ...paperSizeSettings(input),
    orientation: input.orientation === 'landscape' ? 'landscape' : 'portrait',
    spacing: number(input.spacing, PAPER_TYPES[input.type]?.spacing ?? 5, minSpacing(input.type), maxSpacing(input.type)),
    margin: Math.min(number(input.margin, notebook.margin ?? 12, 0, 30), maxPageMargin(input)),
    color: validColor(input.color, notebook.color ?? PAPER_TYPES[input.type]?.color ?? '#9ab5b0'),
    background: validColor(input.background, '#ffffff'),
    gridBackground: (input.type ?? 'graph') === 'graph' ? validColor(input.gridBackground, null) : null,
    lineWeight: readThicknessPt(input) / POINTS_PER_MM,
    majorEvery: guideInterval(input.majorEvery, 5),
    ...(input.type === 'coordinate' && coordinateSettings(input)),
    showNumbers: String(input.showNumbers) !== 'false',
    dotLayout: input.dotLayout === 'triangular' ? 'triangular' : 'square',
    dotSize: number(input.dotSize, 0.5, FIELDS.dotSize.min, FIELDS.dotSize.max),
    ...(input.type === 'lined' && linedLayout(input)),
    ...(input.type === 'music' && musicMargins(input)),
    ...(input.type === 'handwriting' && handwritingLayout(input)),
    isoOrientation: input.isoOrientation === 'vertical' ? 'vertical' : 'horizontal',
    hexLabels: String(input.hexLabels) === 'true',
    hexOrientation: input.hexOrientation === 'pointy' ? 'pointy' : 'flat',
    isoStyle: input.isoStyle === 'dots' ? 'dots' : 'lines',
    cueWidth: number(input.cueWidth, 25, 18, 35),
    summaryHeight: number(input.summaryHeight, 40, 0, 65),
    noteStyle: ['lined', 'dot', 'grid', 'blank'].includes(input.noteStyle) ? input.noteStyle : 'lined',
    staffCount: Math.round(number(input.staffCount, 12, 1, 24)),
    staffSpacing: [1.5, 2, 2.5, 3, 4].includes(Number(input.staffSpacing)) ? Number(input.staffSpacing) : 2,
    title: String(input.title || '').trim().slice(0, 100),
  };
}

export function getDimensions(input = {}) {
  const settings = paperSizeSettings(input);
  const size = settings.size === 'custom'
    ? { width: settings.customWidth, height: settings.customHeight, label: 'Custom' }
    : PAPER_SIZES[settings.size];
  const landscape = input.orientation === 'landscape';
  return {
    width: landscape ? size.height : size.width,
    height: landscape ? size.width : size.height,
    label: size.label,
    orientation: landscape ? 'landscape' : 'portrait',
  };
}

function drawingBounds(state) {
  const dimensions = getDimensions(state);
  const hasDots = state.type === 'dot'
    || (state.type === 'isometric' && state.isoStyle === 'dots')
    || (state.type === 'cornell' && state.noteStyle === 'dot');
  // Include the outer half of every mark in the requested page margins.
  const markInset = Math.max(state.lineWeight * 0.8, (state.dividerWeight ?? 0) / 2, hasDots ? state.dotSize / 2 : 0);
  const inset = state.margin + markInset;
  const limit = state.type === 'calligraphy' ? maxPageMargin(state) : 0;
  const horizontal = state.type === 'calligraphy' ? Math.min(limit, state.marginX) : state.margin;
  const vertical = state.type === 'calligraphy' ? Math.min(limit, state.marginY) : state.margin;
  const left = (state.marginLeft ?? horizontal) + markInset;
  const right = dimensions.width - (state.marginRight ?? horizontal) - markInset;
  const topInset = (state.marginTop ?? vertical) + markInset;
  const top = state.title ? Math.max(topInset, 4) + 12 : topInset;
  const bottom = dimensions.height - (state.marginBottom ?? vertical) - markInset;
  return { ...dimensions, inset, left, right, top, bottom,
    areaWidth: right - left, areaHeight: bottom - top };
}

export function fitsHexCell(input) {
  const state = normalize(input);
  const { areaWidth, areaHeight } = drawingBounds(state);
  const side = hexSideLength(state), flats = side * Math.sqrt(3);
  return state.hexOrientation === 'pointy'
    ? areaWidth >= flats && areaHeight >= 2 * side
    : areaHeight >= flats && areaWidth >= 2 * side;
}

export function getCalligraphyLayout(input) {
  const state = normalize(input);
  return calligraphyLayout(state, drawingBounds(state));
}

/** Shared staff geometry for preview, export and the toolbar. */
export function getMusicLayout(input = {}) {
  const state = normalize({ ...input, type: 'music' });
  return musicLayout(state, drawingBounds(state));
}

function handwritingLayoutForPage(state, { left, areaWidth, top, bottom }) {
  const tail = state.practiceRuling === 'four' ? state.descenderDepth : 0;
  const pitch = state.spacing + tail + state.rowGap;
  const baseline = top + state.spacing;
  const waist = baseline - state.spacing * state.lowercaseHeight / 100;
  const depth = tail || Math.min(state.spacing / 3, state.rowGap * 0.8, bottom - baseline);
  const example = measurePracticeLetters(state, { baseline, waist, depth });
  const autoWidth = state.letterBoxes && example.letters.length > 0;
  // Reserve 10% of each cell as breathing room around the widest letter.
  const boxWidth = autoWidth
    ? Math.max(LETTER_BOX_WIDTH.min, ...example.letters.map(letter => letter.advance / 0.9)) : state.boxWidth;
  const spacer = state.boxSpacers ? letterSpacerWidth(state, boxWidth) : 0;
  const boxPitch = boxWidth + spacer;
  const boxCount = state.letterBoxes ? Math.floor((areaWidth + spacer + 1e-8) / boxPitch) : 0;
  const rowWidth = boxCount ? boxCount * boxPitch - spacer : areaWidth;
  const rowLeft = left + (areaWidth - rowWidth) / 2;
  const visible = [];
  let used = 0;
  let hint = example.hint;
  if (baseline + tail <= bottom) {
    for (const letter of example.letters) {
      if (state.letterBoxes ? visible.length >= boxCount : used + letter.advance > areaWidth + 1e-8) break;
      visible.push(letter);
      used += letter.advance;
    }
    if (visible.length < example.letters.length) hint = 'Only the first ' + visible.length + ' characters fit on this row.';
  } else if (example.letters.length) {
    hint = 'Reduce the letter height or margins to fit a practice row.';
  }
  return { tail, pitch, spacer, boxWidth, boxPitch, boxCount, rowLeft, rowRight: rowLeft + rowWidth,
    visible, baseline, autoWidth, hint };
}

export function getHandwritingPageLayout(input) {
  const state = normalize(input);
  return handwritingLayoutForPage(state, drawingBounds(state));
}

/** A geometric scene, independent of DOM, browser pixels, or export format. */
function createScene(input) {
  const state = normalize(input);
  const { width, height, label, inset, left, right, top, bottom, areaWidth, areaHeight } = drawingBounds(state);
  const shapes = [];
  const line = (x1, y1, x2, y2, color = state.color, weight = state.lineWeight, style = 'solid') => {
    shapes.push({ kind: 'line', x1, y1, x2, y2, color, weight, style });
  };
  const text = (x, y, value, size = 2.2, anchor = 'start', color = '#697770', bold = false) => {
    shapes.push({ kind: 'text', x, y, value: String(value), size, anchor, color, bold });
  };
  shapes.push({ kind: 'rect', x: 0, y: 0, width, height, color: state.background });

  if (state.title) {
    const titleLeft = Math.max(inset, 4);
    const titleSize = Math.min(4.2, (right - titleLeft) / Math.max(1, textWidth(state.title, 1)));
    text(titleLeft, Math.max(inset, 4) + 4.5, state.title, titleSize, 'start', '#303832', true);
  }
  const faint = mix(state.color, state.gridBackground ?? state.background, 0.25);
  const centered = (lo, hi, step) => {
    const count = Math.floor((hi - lo) / step);
    return { start: lo + ((hi - lo) - count * step) / 2, count };
  };

  function ruledGrid(xAxis, yAxis, axisWeight = 0) {
    const isMajor = i => state.majorEvery > 0 && i % state.majorEvery === 0;
    const weight = major => state.lineWeight * (major ? 1.35 : 1);
    function edges({ first, last, at, axisIndex }) {
      const a = at(first), b = at(last);
      const sign = b < a ? -1 : 1;
      const half = i => (i === axisIndex ? axisWeight : weight(isMajor(i))) / 2;
      return [a - sign * half(first), b + sign * half(last)];
    }
    const [xStart, xEnd] = edges(xAxis);
    const [yStart, yEnd] = edges(yAxis);
    if (state.gridBackground && xAxis.last > xAxis.first && yAxis.last > yAxis.first) {
      shapes.push({ kind: 'rect', x: xStart, y: Math.min(yStart, yEnd), width: xEnd - xStart,
        height: Math.abs(yEnd - yStart), color: state.gridBackground });
    }
    // Both directions of the fine grid go underneath all bold guides.
    for (const major of [false, true]) {
      const ink = major ? state.color : faint;
      for (let i = xAxis.first; i <= xAxis.last; i++) {
        if (i !== xAxis.axisIndex && isMajor(i) === major) line(xAxis.at(i), yStart, xAxis.at(i), yEnd, ink, weight(major));
      }
      for (let i = yAxis.first; i <= yAxis.last; i++) {
        if (i !== yAxis.axisIndex && isMajor(i) === major) line(xStart, yAxis.at(i), xEnd, yAxis.at(i), ink, weight(major));
      }
    }
  }

  const triangularDots = state.type === 'dot' && state.dotLayout === 'triangular';
  if (state.type === 'graph' || (state.type === 'dot' && !triangularDots)) {
    const xs = centered(left, right, state.spacing);
    const ys = centered(top, bottom, state.spacing);
    if (state.type === 'dot') {
      for (let y = 0; y <= ys.count; y++) {
        for (let x = 0; x <= xs.count; x++) {
          shapes.push({ kind: 'circle', x: xs.start + x * state.spacing,
            y: ys.start + y * state.spacing, radius: state.dotSize / 2, color: state.color });
        }
      }
    } else {
      ruledGrid({ first: 0, last: xs.count, at: i => xs.start + i * state.spacing },
        { first: 0, last: ys.count, at: i => ys.start + i * state.spacing });
    }
  }

  if (state.type === 'handwriting') {
    // All rulings reserve the full ascender height. Two-line paper leaves the top unmarked.
    const rows = handwritingLayoutForPage(state, { left, areaWidth, top, bottom });
    const { tail, pitch, spacer, boxWidth, boxPitch, boxCount, rowLeft, rowRight } = rows;
    for (let cap = top; cap + state.spacing + tail <= bottom; cap += pitch) {
      const baseline = cap + state.spacing;
      const waist = baseline - state.spacing * state.lowercaseHeight / 100;
      if (state.highlightLowercase && waist < baseline) {
        shapes.push({ kind: 'rect', x: rowLeft, y: waist, width: rowRight - rowLeft, height: baseline - waist, color: state.highlightColor });
      }
      if (boxCount) {
        const boxTop = state.practiceRuling === 'two' ? waist : cap;
        const divider = x => line(x, boxTop, x, baseline + tail, state.boxLineColor ?? state.color, state.lineWeight, state.boxLineStyle);
        divider(rowLeft);
        for (let i = 0; i < boxCount; i++) {
          const x = rowLeft + i * boxPitch;
          if (spacer && i > 0) divider(x);
          divider(x + boxWidth);
        }
      }
      if (state.practiceRuling !== 'two') line(rowLeft, cap, rowRight, cap, state.topLineColor ?? state.color, state.lineWeight, state.topLineStyle);
      line(rowLeft, waist, rowRight, waist, state.midlineColor ?? state.color, state.lineWeight, state.midlineStyle);
      line(rowLeft, baseline, rowRight, baseline, state.baselineColor, state.lineWeight, state.baselineStyle);
      if (state.practiceRuling === 'four') line(rowLeft, baseline + tail, rowRight, baseline + tail, state.bottomLineColor ?? state.color, state.lineWeight, state.bottomLineStyle);
    }
    for (const commands of practicePaths(rows)) {
      shapes.push({ kind: 'practiceGlyph', commands, color: '#303832' });
    }
  }

  if (state.type === 'lined') {
    const first = state.headingSpace > 0
      ? Math.min(top + state.headingSpace, bottom)
      : centered(top, bottom, state.spacing).start;
    const capacity = 1 + Math.floor((bottom - first) / state.spacing + 1e-9);
    const count = Math.min(capacity, state.maxLines || capacity);
    for (let row = 0; row < count; row++) {
      const y = first + row * state.spacing;
      line(left, y, right, y, state.color, state.lineWeight, state.rulingStyle);
    }
    if (state.ruleMargin > 0) {
      const marginX = left + state.ruleMargin;
      line(marginX, top, marginX, bottom, state.marginColor);
    }
    if (state.rightGuide > 0) {
      const marginX = right - state.rightGuide;
      line(marginX, top, marginX, bottom, state.rightMarginColor);
    }
  }

  if (state.type === 'coordinate') {
    const { xMin, axisRange: xMax, yMin, yRange: yMax } = state;
    const unit = Math.min((areaWidth - 14) / (xMax - xMin), (areaHeight - 14) / (yMax - yMin));
    const gridWidth = unit * (xMax - xMin), gridHeight = unit * (yMax - yMin);
    const x0 = (left + right - gridWidth) / 2, x1 = x0 + gridWidth;
    const y0 = (top + bottom - gridHeight) / 2, y1 = y0 + gridHeight;
    const xAt = value => x0 + (value - xMin) * unit;
    const yAt = value => y1 - (value - yMin) * unit;
    const hasXAxis = yMin <= 0 && yMax >= 0;
    const hasYAxis = xMin <= 0 && xMax >= 0;
    const cx = hasYAxis ? xAt(0) : x0;
    const cy = hasXAxis ? yAt(0) : y1;
    const axis = mix(state.color, '#23382d', 0.55);
    const axisWeight = Math.max(0.27, state.lineWeight * 1.6);
    ruledGrid({ first: xMin, last: xMax, at: xAt, axisIndex: hasYAxis ? 0 : xMin },
      { first: yMin, last: yMax, at: yAt, axisIndex: hasXAxis ? 0 : yMin }, axisWeight);
    const headWidth = Math.max(1, axisWeight * 1.25);
    if (hasXAxis) {
      line(x0 - 1.5, cy, x1 + 1, cy, axis, axisWeight);
      shapes.push({ kind: 'triangle', points: [[x1 + 3, cy], [x1 + 0.8, cy - headWidth], [x1 + 0.8, cy + headWidth]], color: axis });
    } else {
      line(x0 - axisWeight / 2, cy, x1 + axisWeight / 2, cy, axis, axisWeight);
    }
    if (hasYAxis) {
      line(cx, y1 + 1.5, cx, y0 - 1, axis, axisWeight);
      shapes.push({ kind: 'triangle', points: [[cx, y0 - 3], [cx - headWidth, y0 - 0.8], [cx + headWidth, y0 - 0.8]], color: axis });
    } else {
      line(cx, y1 + axisWeight / 2, cx, y0 - axisWeight / 2, axis, axisWeight);
    }
    text(x1 + 4.5, cy + 0.9, 'x', 2.7, 'middle', axis);
    text(cx + 2.7, y0 - 3.2, 'y', 2.7, 'middle', axis);
    if (state.showNumbers) {
      const autoInterval = [1, 2, 5, 10, 20, 50].find(step => step * unit >= 7) ?? 50;
      const interval = state.labelEvery || autoInterval;
      const fontSize = Math.min(2.3, unit * interval * 0.46);
      function axisNumber(x, y, value, anchor) {
        const width = textWidth(String(value), fontSize);
        const left = anchor === 'middle' ? x - width / 2 : x - width;
        const pad = fontSize * 0.15;
        shapes.push({ kind: 'rect', x: left - pad, y: y - fontSize * 0.82 - pad,
          width: width + 2 * pad, height: fontSize + 2 * pad, color: state.background });
        text(x, y, value, fontSize, anchor, axis);
      }
      for (const direction of ['x', 'y']) {
        const [min, max] = direction === 'x' ? [xMin, xMax] : [yMin, yMax];
        for (let i = Math.ceil(min / interval) * interval; i <= max; i += interval) {
          if (i === 0 && hasXAxis && hasYAxis) continue;
          if (direction === 'x') {
            const px = xAt(i);
            line(px, cy - 0.65, px, cy + 0.65, axis, axisWeight);
            axisNumber(px, cy + 3.3, i, 'middle');
          } else {
            const py = yAt(i);
            line(cx - 0.65, py, cx + 0.65, py, axis, axisWeight);
            axisNumber(cx - 2.2, py + fontSize * 0.32, i, 'end');
          }
        }
      }
      if (hasXAxis && hasYAxis) axisNumber(cx - 2.2, cy + 3.3, '0', 'end');
    }
  }

  if (state.type === 'hex') {
    const grid = hexGridLayout(state, { left, top, areaWidth, areaHeight });
    shapes.push(grid);
    if (state.hexLabels) drawHexLabels(grid, hexSideLength(state), text);
  }

  if (state.type === 'isometric' || triangularDots) {
    const rowHeight = state.spacing * Math.sqrt(3) / 2;
    const vertical = state.type === 'isometric' && state.isoOrientation === 'vertical';
    const rows = vertical ? centered(left, right, rowHeight) : centered(top, bottom, rowHeight);
    const [startEdge, endEdge] = vertical ? [top, bottom] : [left, right];
    // Index staggered vertices in half-side steps. Row and column have the same parity.
    const halfSide = state.spacing / 2;
    const center = (startEdge + endEdge) / 2;
    const minColumn = Math.ceil((startEdge - center) / halfSide);
    const maxColumn = Math.floor((endEdge - center) / halfSide);
    function vertex(column, row) {
      const along = center + column * halfSide;
      const across = rows.start + row * rowHeight;
      return vertical ? [across, along] : [along, across];
    }
    const dots = triangularDots || state.isoStyle === 'dots';
    for (let row = 0; row <= rows.count; row++) {
      const first = minColumn + Math.abs((minColumn - row) % 2);
      const last = maxColumn - Math.abs((maxColumn - row) % 2);
      if (dots) {
        for (let column = first; column <= last; column += 2) {
          const [x, y] = vertex(column, row);
          shapes.push({ kind: 'circle', x, y, radius: state.dotSize / 2, color: state.color });
        }
      } else if (first < last) {
        line(...vertex(first, row), ...vertex(last, row));
      }
    }
    if (!dots) {
      // Each diagonal advances one half-column per row. Draw one continuous
      // stroke between its first and last in-bounds vertices.
      for (const direction of [-1, 1]) {
        const low = direction === 1 ? minColumn : -maxColumn;
        const high = direction === 1 ? maxColumn : -minColumn;
        for (let start = 2 * Math.ceil((low - rows.count) / 2); start <= high; start += 2) {
          const first = Math.max(0, low - start);
          const last = Math.min(rows.count, high - start);
          if (first < last) line(...vertex(direction * (start + first), first), ...vertex(direction * (start + last), last));
        }
      }
    }
  }

  if (state.type === 'music' || state.type === 'cornell' || state.type === 'calligraphy') {
    const bounds = { left, top, right, bottom, areaWidth, areaHeight };
    if (state.type === 'music') drawMusic(state, bounds, line, shapes, text, faint);
    if (state.type === 'cornell') drawCornell(state, bounds, { line, text, shapes });
    if (state.type === 'calligraphy') drawCalligraphy(state, bounds, { line, text, mix, shapes });
  }

  return { state, width, height, label, shapes };
}

function dashPattern(style, weight) {
  if (style === 'dashed') return [2, 1];
  // A short painted mark with round caps stays visible at fit-to-page scale.
  if (style === 'dotted') return [weight * 0.65, Math.max(0.45, weight * 3)];
  return [];
}

export function renderSVG(input = {}) {
  const scene = createScene(input);
  const { width, height, state, shapes, label } = scene;
  const elements = shapes.map((shape) => {
    if (shape.kind === 'hexGrid') return hexGridSVG(shape, rounded);
    if (shape.kind === 'rect') return `<rect x="${rounded(shape.x)}" y="${rounded(shape.y)}" width="${rounded(shape.width)}" height="${rounded(shape.height)}" fill="${shape.color}"/>`;
    if (shape.kind === 'line') {
      const dash = dashPattern(shape.style, shape.weight);
      const pattern = dash.length ? ` stroke-dasharray="${dash.map(rounded).join(' ')}"` : '';
      const cap = shape.style === 'dotted' ? ' stroke-linecap="round"' : '';
      return `<line x1="${rounded(shape.x1)}" y1="${rounded(shape.y1)}" x2="${rounded(shape.x2)}" y2="${rounded(shape.y2)}" stroke="${shape.color}" stroke-width="${rounded(shape.weight)}"${pattern}${cap}/>`;
    }
    if (shape.kind === 'triangle') return `<polygon points="${shape.points.map(pair => pair.map(rounded).join(',')).join(' ')}" fill="${shape.color}"/>`;
    if (shape.kind === 'practiceGlyph' || shape.kind === 'filledPath') {
      const d = shape.commands.map(([op, ...coords]) => op + coords.map(rounded).join(' ')).join('');
      return `<path d="${d}" fill="${shape.color}"/>`;
    }
    if (shape.kind === 'circle') return `<circle cx="${rounded(shape.x)}" cy="${rounded(shape.y)}" r="${rounded(shape.radius)}" fill="${shape.color}"/>`;
    return `<text x="${rounded(shape.x)}" y="${rounded(shape.y)}" fill="${shape.color}" font-family="Helvetica, Arial, sans-serif" font-size="${rounded(shape.size)}" font-weight="${shape.bold ? 700 : 400}" text-anchor="${shape.anchor}">${xml(shape.value)}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${rounded(width)} ${rounded(height)}" width="${rounded(width)}mm" height="${rounded(height)}mm" role="img" aria-label="${xml(`${label} ${PAPER_TYPES[state.type].name} preview`)}"><title>${xml(`${label} ${PAPER_TYPES[state.type].name}`)}</title><g id="paper-drawing">${elements.join('')}</g></svg>`;
}

// Standard Helvetica metrics for ASCII labels, in 1/1000 em. Used for PDF text
// alignment, so axis labels have the same centered/end anchor as SVG text.
const ASCII_WIDTHS = [
  278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,
  556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,
  1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,
  667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,
  333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,
  556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,
];
const PDF_CP1252 = new Map([
  [0x20ac, 128], [0x201a, 130], [0x0192, 131], [0x201e, 132], [0x2026, 133],
  [0x2020, 134], [0x2021, 135], [0x02c6, 136], [0x2030, 137], [0x0160, 138],
  [0x2039, 139], [0x0152, 140], [0x017d, 142], [0x2018, 145], [0x2019, 146],
  [0x201c, 147], [0x201d, 148], [0x2022, 149], [0x2013, 150], [0x2014, 151],
  [0x02dc, 152], [0x2122, 153], [0x0161, 154], [0x203a, 155], [0x0153, 156],
  [0x017e, 158], [0x0178, 159], [0x2212, 45],
]);
function pdfText(value) {
  let out = '';
  for (const character of String(value)) {
    const cp = character.codePointAt(0);
    const byte = cp >= 32 && cp <= 255 ? cp : PDF_CP1252.get(cp) || 63;
    if (byte < 32 || byte > 126) out += `\\${byte.toString(8).padStart(3, '0')}`;
    else if (byte === 40 || byte === 41 || byte === 92) out += '\\' + String.fromCharCode(byte);
    else out += String.fromCharCode(byte);
  }
  return out;
}
function textWidth(value, size) {
  return Array.from(String(value)).reduce((sum, c) => sum + (ASCII_WIDTHS[c.charCodeAt(0) - 32] || 556), 0) / 1000 * size;
}

/** Return a vector PDF whose pages share one drawing stream. No network or fonts needed. */
export function buildPDF(input = {}, renderLabelMask) {
  const { state, width, height, shapes } = createScene(input);
  const p = (n) => rounded(n * POINTS_PER_MM);
  const py = (n) => p(height - n);
  const components = [];
  const forms = [];
  let lastStroke = '', lastFill = '', lastWidth = '';
  let lastDash = '';
  const pdfColor = (color) => rgb(color).map((v) => rounded(v / 255)).join(' ');
  const fill = (color) => {
    if (color !== lastFill) { components.push(`${pdfColor(color)} rg`); lastFill = color; }
  };
  for (const shape of shapes) {
    if (shape.kind === 'hexGrid') {
      const grid = hexGridPDF(shape, POINTS_PER_MM, height, rounded, pdfColor(shape.color));
      forms.push(...grid.forms);
      components.push(...grid.commands);
    } else if (shape.kind === 'line') {
      const dash = dashPattern(shape.style, shape.weight).map(p).join(' ');
      if (dash !== lastDash) {
        components.push(`[${dash}] 0 d`, shape.style === 'dotted' ? '1 J' : '0 J');
        lastDash = dash;
      }
      if (shape.color !== lastStroke) {
        components.push(`${pdfColor(shape.color)} RG`);
        lastStroke = shape.color;
      }
      const lineWidth = p(shape.weight);
      if (lineWidth !== lastWidth) { components.push(`${lineWidth} w`); lastWidth = lineWidth; }
      components.push(`${p(shape.x1)} ${py(shape.y1)} m ${p(shape.x2)} ${py(shape.y2)} l S`);
    } else if (shape.kind === 'rect') {
      fill(shape.color);
      components.push(`${p(shape.x)} ${py(shape.y + shape.height)} ${p(shape.width)} ${p(shape.height)} re f`);
    } else if (shape.kind === 'triangle') {
      fill(shape.color);
      for (const [i, [x, y]] of shape.points.entries()) components.push(`${p(x)} ${py(y)} ${i ? 'l' : 'm'}`);
      components.push('h f');
    } else if (shape.kind === 'circle') {
      fill(shape.color);
      const x = shape.x, y = height - shape.y, r = shape.radius, c = r * 0.5522847498;
      components.push(`${p(x + r)} ${p(y)} m`,
        `${p(x + r)} ${p(y + c)} ${p(x + c)} ${p(y + r)} ${p(x)} ${p(y + r)} c`,
        `${p(x - c)} ${p(y + r)} ${p(x - r)} ${p(y + c)} ${p(x - r)} ${p(y)} c`,
        `${p(x - r)} ${p(y - c)} ${p(x - c)} ${p(y - r)} ${p(x)} ${p(y - r)} c`,
        `${p(x + c)} ${p(y - r)} ${p(x + r)} ${p(y - c)} ${p(x + r)} ${p(y)} c f`);
    } else if (shape.kind === 'practiceGlyph' || shape.kind === 'filledPath') {
      fill(shape.color);
      for (const [op, ...coords] of shape.commands) {
        const points = coords.map((v, i) => i % 2 ? py(v) : p(v));
        components.push([...points, { M: 'm', L: 'l', C: 'c', Z: 'h' }[op]].join(' '));
      }
      components.push('f');
    } else if (shape.kind === 'text') {
      fill(shape.color);
      if (renderLabelMask && Array.from(shape.value).some(c => c.codePointAt(0) > 255 && !PDF_CP1252.has(c.codePointAt(0)))) {
        const { w, h, left, ascent, scale, hex } = renderLabelMask(shape);
        components.push(`q ${p(w * scale)} 0 0 ${p(h * scale)} ${p(shape.x - left * scale)} ${py(shape.y + (h - ascent) * scale)} cm`,
          `BI /W ${w} /H ${h} /IM true /BPC 1 /D [1 0] /F /AHx ID
${hex}>
EI Q`);
        continue;
      }
      const factor = shape.anchor === 'middle' ? 0.5 : shape.anchor === 'end' ? 1 : 0;
      const x = shape.x - factor * textWidth(shape.value, shape.size);
      components.push(`BT /${shape.bold ? 'F2' : 'F1'} ${p(shape.size)} Tf 1 0 0 1 ${p(x)} ${py(shape.y)} Tm (${pdfText(shape.value)}) Tj ET`);
    }
  }
  const content = components.join('\n') + '\n';
  const pageCount = readPageCount(input.pageCount);
  // Objects 1–6 hold the catalog, page tree, drawing, fonts and document info.
  const pageRefs = Array.from({ length: pageCount }, (_, index) => (7 + index) + ' 0 R');
  const formResources = forms.map((_, i) => '/Hex' + i + ' ' + (7 + pageCount + i) + ' 0 R').join(' ');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pageRefs.join(' ')}] /Count ${pageCount} /MediaBox [0 0 ${p(width)} ${p(height)}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> /XObject << ${formResources} >> >> >>`,
    `<< /Length ${content.length} >>\nstream\n${content}endstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    `<< /Title (${pdfText(`${PAPER_TYPES[state.type].name} - MakePaperFast`)}) /Creator (MakePaperFast) /Producer (MakePaperFast vector paper engine) >>`,
    ...pageRefs.map(() => '<< /Type /Page /Parent 2 0 R /Contents 3 0 R >>'),
    ...forms,
  ];
  let output = '%PDF-1.4\n%MakePaperFast vector paper\n';
  const offsets = [0];
  objects.forEach((object, i) => {
    offsets.push(output.length);
    output += `${i + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = output.length;
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  output += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([new TextEncoder().encode(output)], { type: 'application/pdf' });
}
