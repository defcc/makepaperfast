import { calligraphyRuling } from './specialty-settings.js';

export function drawCornell(state, bounds, { line, text, shapes }) {
  const { left, right, top, bottom, areaHeight, areaWidth } = bounds;
  const headerHeight = state.noteHeader === 'none' ? 0 : Math.min(state.noteHeader === 'course' ? 20 : 12, areaHeight * 0.25);
  const bodyTop = top + headerHeight;
  const cueX = left + areaWidth * state.cueWidth / 100;
  const summaryHeight = Math.min(state.summaryHeight, (bottom - bodyTop) * 0.55);
  const summaryY = bottom - summaryHeight;
  const labelSize = Math.min(2.8, areaWidth / 22, areaHeight / 18);
  function label(x, baseline, value) { text(x, baseline, value, labelSize); }
  function divider(x1, y1, x2, y2) {
    line(x1, y1, x2, y2, state.dividerColor, state.dividerWeight, state.dividerStyle);
  }
  if (headerHeight) {
    const last = bodyTop - 2;
    if (state.noteHeader === 'course') label(left, top + headerHeight * 0.42, 'Course');
    label(left, last, 'Topic');
    label(left + areaWidth * 0.7, last, 'Date');
    divider(left, bodyTop, right, bodyTop);
  }
  divider(cueX, bodyTop, cueX, summaryY);
  if (summaryHeight) divider(left, summaryY, right, summaryY);
  const labelSpace = state.sectionLabels ? labelSize * 2 : 0;
  if (state.sectionLabels) {
    label(left, bodyTop + labelSize * 1.5, 'Cues');
    label(cueX + 2, bodyTop + labelSize * 1.5, 'Notes');
    if (summaryHeight) label(left, summaryY + labelSize * 1.5, 'Summary');
  }
  function ruling(style, x1, y1, x2, y2, pitch) {
    if (style === 'blank' || x2 <= x1 || y2 <= y1) return;
    if (style === 'dot') {
      const nx = Math.floor((x2 - x1) / pitch), ny = Math.floor((y2 - y1) / pitch);
      const startX = (x1 + x2 - nx * pitch) / 2, startY = (y1 + y2 - ny * pitch) / 2;
      for (let row = 0; row <= ny; row++) for (let col = 0; col <= nx; col++) {
        shapes.push({ kind: 'circle', x: startX + col * pitch, y: startY + row * pitch, radius: state.dotSize / 2, color: state.color });
      }
    } else if (style === 'grid') {
      const cols = Math.floor((x2 - x1) / pitch), rows = Math.floor((y2 - y1) / pitch);
      if (!cols || !rows) return;
      const lastX = x1 + cols * pitch, lastY = y1 + rows * pitch;
      for (let row = 0; row <= rows; row++) line(x1, y1 + row * pitch, lastX, y1 + row * pitch);
      for (let col = 0; col <= cols; col++) line(x1 + col * pitch, y1, x1 + col * pitch, lastY);
    } else {
      for (let y = y1 + pitch; y <= y2; y += pitch) line(x1, y, x2, y);
    }
  }
  ruling(state.cueRuling, left, bodyTop + labelSpace, cueX - 2, summaryY - 1, state.spacing);
  ruling(state.noteStyle, cueX + 3, bodyTop + labelSpace + (state.noteStyle === 'grid' ? 1 : 0), right, summaryY - 1, state.spacing);
  if (summaryHeight) ruling(state.summaryRuling, left, summaryY + labelSpace + 1, right, bottom, state.summaryPitch);
}

export function calligraphyLayout(state, { top, bottom }) {
  const header = state.guideInfo || state.dateField ? 9 : 0;
  const ruling = calligraphyRuling(state);
  const height = state.xHeight * (ruling.ascRatio + 1 + ruling.descRatio);
  const count = Math.max(0, Math.floor((bottom - top - header + state.groupGap) / (height + state.groupGap)));
  return { top: top + header, height, count, ruling };
}

// Clip each parallel line against the writing area. The shared origin keeps the
// angle and phase continuous when a row gap interrupts the stroke.
function directionLines(line, left, right, top, bottom, originY, angle, pitch, color, weight, style, skipOrigin = false) {
  const radians = angle * Math.PI / 180;
  const slope = angle === 90 ? 0 : 1 / Math.tan(radians);
  const baselineStep = pitch / Math.sin(radians);
  const offset = (originY - bottom) * slope;
  const run = (bottom - top) * slope;
  const first = Math.ceil((-offset - Math.max(0, run)) / baselineStep);
  const last = Math.floor((right - left - offset - Math.min(0, run)) / baselineStep);
  for (let i = first; i <= last; i++) {
    if (skipOrigin && i === 0) continue;
    const x = left + i * baselineStep + offset;
    let a = 0, b = 1;
    if (run !== 0) {
      const l = (left - x) / run, r = (right - x) / run;
      a = Math.max(0, Math.min(l, r));
      b = Math.min(1, Math.max(l, r));
    }
    if (b > a) line(x + a * run, bottom - a * (bottom - top), x + b * run, bottom - b * (bottom - top), color, weight, style);
  }
}

export function drawCalligraphy(state, bounds, { line, text, mix, shapes }) {
  const { left, right, areaWidth } = bounds;
  const { top, count, height, ruling } = calligraphyLayout(state, bounds);
  const angles = [state.slantOn && state.slantAngle + '°', state.secondOn && state.secondAngle + '°'].filter(Boolean);
  const label = [state.horizontalOn && state.xHeight + ' mm', state.horizontalOn && [ruling.ascRatio, 1, ruling.descRatio].map(n => Number(n.toFixed(2))).join(':'), ...angles].filter(Boolean).join(' / ');
  const size = Math.min(2.8, areaWidth / 38);
  if (state.guideInfo && label) text(bounds.left, bounds.top + 4, label, size);
  if (state.dateField) text(right, bounds.top + 4, 'Date __________', size, 'end');

  const strength = state.horizontalTint / 100;
  const ink = amount => mix(state.background, state.color, amount);
  const main = ink(strength);
  const waistInk = state.emphasis === 'color' ? mix(state.background, state.waistColor, strength) : main;
  const baseInk = state.emphasis === 'color' ? mix(state.background, state.accentColor, strength) : main;
  const rows = Array.from({ length: count }, (_, index) => {
    const start = top + index * (height + state.groupGap);
    const waist = start + ruling.ascRatio * state.xHeight;
    return { start, waist, base: waist + state.xHeight, end: start + height };
  });
  if (state.horizontalOn && state.emphasis === 'band') {
    for (const row of rows) shapes.push({ kind: 'rect', x: left, y: row.waist, width: right - left,
      height: state.xHeight, color: mix(state.background, state.accentColor, 0.18) });
  }

  function direction(topEdge, bottomEdge) {
    if (state.verticalOn) directionLines(line, left, right, topEdge, bottomEdge, top, 90, state.verticalPitch, ink(state.verticalTint / 100), state.lineWeight, state.verticalRule, true);
    if (state.slantOn) directionLines(line, left, right, topEdge, bottomEdge, top, state.slantAngle, state.slantSpacing, ink(state.guideTint / 100), state.lineWeight, state.slantRule);
    if (state.secondOn) directionLines(line, left, right, topEdge, bottomEdge, top, state.secondAngle, state.secondSpacing, ink(state.secondTint / 100), state.lineWeight, state.secondRule);
  }
  if (!state.horizontalOn) {
    direction(top, bounds.bottom);
    return;
  }
  if ((state.throughGap || !state.groupGap) && rows.length) direction(top, rows[rows.length - 1].end);
  else for (const row of rows) direction(row.start, row.end);

  function guide(y, style, color) {
    if (style !== 'off') line(left, y, right, y, color, state.lineWeight, style);
  }

  function mark(y, label) {
    const baseline = label === 'X';
    text(left + 0.5, y - 0.9, label, baseline ? 3.7 : 2.65, 'start', main, baseline);
  }

  function nibScale(row) {
    const nib = state.xHeight / state.subdivisions;
    let index = 0;
    for (const [start, end] of [[row.start, row.waist], [row.waist, row.base], [row.base, row.end]]) {
      // A fractional nib at the top of a zone keeps the remaining marks aligned with its lower guide.
      const count = Math.ceil((end - start) / nib - 1e-8);
      for (let i = 0; i < count; i++, index++) {
        const y = Math.max(start, end - (count - i) * nib);
        shapes.push({ kind: 'rect', x: left + (index % 2 ? 0 : 2), y,
          width: 2, height: end - (count - i - 1) * nib - y, color: main });
      }
    }
  }

  for (const [index, row] of rows.entries()) {
    const split = !ruling.custom && ruling.ascRatio > 1;
    if (split) {
      guide((row.start + row.waist) / 2, ruling.innerRule, main);
      if (ruling.descRatio) guide((row.base + row.end) / 2, ruling.innerRule, main);
    }
    const digitY = row.base - 1.5 * state.xHeight;
    const digitInside = state.digitGuide && digitY > row.start + 0.001;
    if (ruling.custom && state.subdivisionRule !== 'off') {
      const step = state.xHeight / state.subdivisions;
      for (const [start, end] of [[row.start, row.waist], [row.waist, row.base], [row.base, row.end]]) {
        for (let y = start + step; y < end - 0.001; y += step) {
          if (!digitInside || Math.abs(digitY - y) > 0.001) guide(y, state.subdivisionRule, main);
        }
      }
    }
    const sharedEdge = index > 0 && state.groupGap === 0 && (ruling.descRatio > 0 ? state.descRule : state.baselineRule) !== 'off';
    if (ruling.ascRatio > 0 && !sharedEdge) guide(row.start, state.outerRule, main);
    if (ruling.ascRatio > 0 || !sharedEdge) guide(row.waist, state.waistRule, waistInk);
    if (digitInside) guide(digitY, 'dashed', main);
    guide(row.base, state.baselineRule, baseInk);
    if (ruling.descRatio > 0) guide(row.end, state.descRule, main);

    if (ruling.markers === 'none') continue;
    if (ruling.custom) {
      nibScale(row);
      continue;
    }
    if (ruling.markers === 'all') {
      if (split && ruling.innerRule !== 'off') mark((row.start + row.waist) / 2, 'A2');
      if (state.waistRule !== 'off') mark(row.waist, split ? 'A1' : 'A');
    }
    if (state.baselineRule !== 'off') mark(row.base, 'X');
    if (ruling.markers === 'all' && ruling.descRatio) {
      if (split && ruling.innerRule !== 'off') mark((row.base + row.end) / 2, 'D1');
      if (state.descRule !== 'off') mark(row.end, split ? 'D2' : 'D');
    }
  }
}
