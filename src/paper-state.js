import { matchingTemplate } from './music-staves.js';
import { specialtyFields, readSpecialty } from './specialty-settings.js';
import { PAPER_TYPES, FIELDS, coordinateSettings, coordinateRangeLabel, readPageCount, readThicknessPt, defaultsFor, minSpacing, maxSpacing, guideInterval, marginSides } from './paper-catalog.js';
import { fitsHexCell, getCalligraphyLayout, getMusicLayout, paperSizeSettings, maxPageMargin, linedLayout, musicMargins, handwritingLayout } from './paper-engine.js';

import { spacingLabel } from './spacing.js';

export const paths = {
  graph: '/',
  dot: '/dot-grid-paper',
  lined: '/lined-paper',
  handwriting: '/handwriting-paper',
  coordinate: '/coordinate-paper',
  isometric: '/isometric-paper',
  hex: '/hexagonal-graph-paper',
  calligraphy: '/calligraphy-guide-paper',
  cornell: '/cornell-notes',
  music: '/music-staff-paper',
};
export const INKS = [
  { name: 'Sage', value: '#a4b5ae' },
  { name: 'Green', value: '#48845b' },
  { name: 'Blue', value: '#9baecc' },
  { name: 'Clay', value: '#c39a90' },
  { name: 'Graphite', value: '#929797' },
  { name: 'Light gray', value: '#c8c8c8' },
  { name: 'Black', value: '#000000' },
  { name: 'Dark blue', value: '#365b91' },
  { name: 'Red', value: '#bb5151' },
];
export const storageKey = 'paperman-playground-v1';
export const hasType = (value) => Object.hasOwn(PAPER_TYPES, value);
const validHex = (value) => /^#[a-f\d]{6}$/i.test(value || '');
const finite = (value, fallback, min, max) =>
  value != null && value !== '' && Number.isFinite(Number(value))
    ? Math.max(min, Math.min(max, Number(value)))
    : fallback;

function optionsFor(type, input) {
  const options = defaultsFor(type);
  for (const [key, field] of Object.entries(FIELDS)) {
    const value = input[key];
    if (key === 'majorEvery') {
      options[key] = guideInterval(value, options[key]);
    } else if (field.type === 'boolean') {
      if ([true, false, 'true', 'false'].includes(value)) options[key] = String(value) === 'true';
    } else if (key === 'spacing') {
      options.spacing = finite(value, options.spacing, minSpacing(type), maxSpacing(type));
    } else if (field.min !== undefined) {
      options[key] = finite(value, options[key], field.min, field.max);
    } else if (field.options.some((option) => String(option.value) === String(value))) {
      options[key] = field.type === 'number' ? Number(value) : value;
    }
  }
  if (type === 'lined') {
    Object.assign(options, linedLayout(input));
    options.color = validHex(input.color) ? input.color.toLowerCase() : options.color;
  }
  if (type === 'calligraphy' && validHex(input.color)) options.color = input.color.toLowerCase();
  if (type === 'coordinate') Object.assign(options, coordinateSettings(input));
  if (type === 'music') Object.assign(options, musicMargins(input));
  if (type === 'handwriting') Object.assign(options, handwritingLayout(input));
  options.margin = finite(input.margin, options.margin, 0, 30);
  options.pageCount = readPageCount(input.pageCount);
  options.lineWeightPt = readThicknessPt(input);
  return options;
}

export function pageType(pathname) {
  return Object.keys(paths).find((type) => paths[type] === pathname);
}

export function initialPaper(url, saved) {
  const query = url.searchParams;
  const requested = query.get('paper');
  const type =
    pageType(url.pathname) ||
    (hasType(requested) && requested) ||
    (hasType(saved?.type) && saved.type) ||
    'graph';
  const input = { ...saved?.common, ...saved?.perType?.[type], ...Object.fromEntries(query) };
  if (type === 'music' && query.has('musicTemplate') && !query.has('staves')) delete input.staves;
  // Shared sheets created before page counts always exported one page.
  if (query.has('size') && query.has('orientation') && !query.has('pageCount')) input.pageCount = 1;
  if (type === 'isometric' && query.has('size') && query.has('isoStyle')) {
    input.isoOrientation = query.get('isoOrientation');
    input.spacingUnit = query.get('spacingUnit');
  }
  if (type === 'coordinate' && (query.has('axisRange') || query.has('quadrants'))) {
    Object.assign(input, coordinateSettings(Object.fromEntries(query)));
  }
  if (specialtyFields[type] && query.has('size') && query.has('orientation')) {
    Object.assign(input, readSpecialty(type, Object.fromEntries(query)));
    if (type === 'music') Object.assign(input, musicMargins(Object.fromEntries(query)));
  }
  if (type === 'calligraphy') {
    // Older preferences kept the last active paper's ink in common.
    input.color = query.get('color') ?? saved?.perType?.calligraphy?.color
      ?? (saved?.type === type ? saved.common?.color : undefined);
  }
  if (type === 'handwriting') input.color = query.get('color') ?? saved?.perType?.handwriting?.color;
  if (type === 'handwriting' && query.has('size') && query.has('practiceRuling') && query.has('orientation')) {
    Object.assign(input, handwritingLayout(Object.fromEntries(query)));
  }
  if (type === 'handwriting' && query.has('boxSpacers')) input.spacerWidth = query.get('spacerWidth');
  // A shared lined sheet contains its layout. Older links predate the optional guides.
  if (type === 'lined' && query.has('ruleMargin') && query.has('margin')) {
    Object.assign(input, linedLayout(Object.fromEntries(query)));
  }
  // Older graph links stored a single background plus an optional grid-only scope.
  const colors = query.has('background') ? Object.fromEntries(query) : input;
  const legacyGridOnly = type === 'graph' && colors.backgroundScope === 'grid' && !colors.gridBackground;
  // An empty value is an enabled grid background awaiting a color. Null follows the page.
  const gridBackground = type === 'graph' ? (legacyGridOnly ? colors.background : colors.gridBackground) : null;
  if (query.has('lineWeight') && !query.has('lineWeightPt')) delete input.lineWeightPt;
  if (query.has('numbers')) input.showNumbers = query.get('numbers') !== '0';
  return fitPaper({
    type,
    ...paperSizeSettings(input),
    orientation: input.orientation === 'landscape' ? 'landscape' : 'portrait',
    background: !legacyGridOnly && validHex(input.background) ? input.background.toLowerCase() : '#ffffff',
    gridBackground: validHex(gridBackground) ? gridBackground.toLowerCase() : gridBackground === '' ? '' : null,
    color: validHex(input.color) ? input.color.toLowerCase() : INKS[0].value,
    ...optionsFor(type, input),
    ...readSpecialty(type, input),
    spacingUnit: ['mm', 'in'].includes(input.spacingUnit) ? input.spacingUnit : ['hex', 'isometric'].includes(type) ? 'mm' : undefined,
  });
}

export function fitPaper(paper) {
  const maxMargin = maxPageMargin(paper);
  if (paper.margin > maxMargin) paper = { ...paper, margin: maxMargin };
  if (paper.type === 'calligraphy') return { ...paper, marginX: Math.min(maxMargin, paper.marginX), marginY: Math.min(maxMargin, paper.marginY) };
  if (paper.type === 'coordinate') return { ...paper, ...coordinateSettings(paper) };
  if (paper.type === 'lined') return { ...paper, ...linedLayout(paper) };
  if (paper.type === 'music') return { ...paper, ...musicMargins(paper) };
  return paper;
}

export function sharePath(paper) {
  const info = PAPER_TYPES[paper.type];
  const keys = ['size', 'pageCount', 'orientation', 'color', 'background', 'margin', 'lineWeightPt', ...info.controls, ...info.more, ...Object.keys(specialtyFields[paper.type] ?? {})];
  if (paper.type === 'lined') {
    keys.push('headingSpace', 'marginColor', 'rightMarginColor', 'rightGuide', 'rulingStyle', 'maxLines');
  }
  if (paper.type === 'lined' || paper.type === 'music') {
    keys.push('separateMargins');
    if (paper.separateMargins) keys.push(...marginSides.map(side => 'margin' + side));
  }
  if (paper.type === 'coordinate') keys.push('xMin', 'yMin', 'yRange', 'labelEvery');
  if (paper.type === 'graph' && paper.gridBackground != null) keys.push('gridBackground');
  if (paper.type === 'handwriting') keys.push('lowercaseHeight', 'descenderDepth', 'topLineStyle', 'baselineStyle', 'bottomLineStyle', 'baselineColor', 'highlightLowercase', 'highlightColor', 'letterBoxes', 'boxWidth', 'boxSpacers');
  if (paper.type === 'handwriting') {
    keys.push('boxLineStyle');
    for (const key of ['topLineColor', 'midlineColor', 'bottomLineColor', 'boxLineColor']) {
      if (paper[key]) keys.push(key);
    }
  }
  if (paper.type === 'handwriting' && paper.spacerWidth != null) keys.push('spacerWidth');
  if (paper.spacingUnit) keys.push('spacingUnit');
  if (paper.size === 'custom') keys.push('customWidth', 'customHeight');
  const params = new URLSearchParams(keys.map((key) => [key, paper[key]]));
  if (paper.type === 'music') {
    const preset = matchingTemplate(paper.staves);
    if (preset) params.set('musicTemplate', preset.id);
    else params.set('staves', JSON.stringify(paper.staves));
  }
  return paths[paper.type] + '?' + params;
}

export function readPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return saved?.version === 1 ? saved : null;
  } catch {
    return null;
  }
}

export function savePreferences(paper) {
  const { type, size, customWidth, customHeight, orientation, color, background, ...options } = paper;
  try {
    const saved = readPreferences();
    const perType = { ...saved?.perType };
    if (saved?.type === 'calligraphy' && !perType.calligraphy?.color && validHex(saved.common?.color)) {
      perType.calligraphy = { ...perType.calligraphy, color: saved.common.color };
    }
    perType[type] = type === 'handwriting' || type === 'calligraphy' ? { ...options, color } : options;
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        version: 1,
        type,
        common: { size, customWidth, customHeight, orientation, color: type === 'calligraphy' ? saved?.common?.color : color, background },
        perType,
      }),
    );
  } catch {
    /* Private browsing remains usable. */
  }
}

export function previewNote(current) {
  const interval = spacingLabel(current);
  switch (current.type) {
    case 'graph':
      return `${interval} squares${current.majorEvery ? ` · Bold every ${current.majorEvery}` : ''}`;
    case 'dot':
      return `${interval} apart · ${current.dotSize} mm dots`;
    case 'handwriting':
      return interval + ' letter height · ' + current.rowGap + ' mm row gap';
    case 'lined':
      return `${interval} lines${current.ruleMargin || current.rightGuide ? ' · Margin guide' : ''}`;
    case 'coordinate':
      return `${coordinateRangeLabel(current)} · ${current.showNumbers ? 'Numbered' : 'No numbers'}`;
    case 'hex':
      if (!fitsHexCell(current)) return 'No whole hex fits. Reduce the hex size or page margins.';
      return interval + (current.hexMeasure === 'flats' ? ' across flats' : ' sides') + ' · ' + (current.hexOrientation === 'pointy' ? 'Pointy top' : 'Flat top');
    case 'isometric':
      return `${interval} sides · ${current.isoStyle === 'dots' ? 'Dots' : 'Lines'}`;
    case 'cornell':
      return current.cueWidth + '% cues' + (current.summaryHeight ? ' · Summary' : ' · No summary');
    case 'calligraphy':
      if (!current.horizontalOn) return [current.verticalOn && 'Vertical', current.slantOn && current.slantAngle + '°', current.secondOn && current.secondAngle + '°'].filter(Boolean).join(' · ') || 'Blank practice sheet';
      if (!getCalligraphyLayout(current).count) return 'No complete row fits. Reduce guide heights or margins.';
      return current.xHeight + ' mm x-height' + (current.slantOn ? ' · ' + current.slantAngle + '° slant' : '');
    case 'music': {
      const { count, paired } = getMusicLayout(current);
      if (!count) return 'No system fits. Reduce staff spacing or margins.';
      return count + (paired ? (count === 1 ? ' system' : ' systems') : (count === 1 ? ' staff' : ' staves')) + (paired ? ' · ' + current.staves.length + ' staves per system' : '');
    }
  }
}
