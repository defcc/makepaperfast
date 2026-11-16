export function hexSideLength(paper) {
  return paper.hexMeasure === 'flats' ? paper.spacing / Math.sqrt(3) : paper.spacing;
}

// A flat-top column is staggered by half a cell relative to its neighbor.
// Pointy-top paper uses the same lattice with the page axes exchanged.
export function hexGridLayout(paper, bounds) {
  const side = hexSideLength(paper);
  const height = side * Math.sqrt(3);
  const pointy = paper.hexOrientation === 'pointy';
  const widthAvailable = pointy ? bounds.areaHeight : bounds.areaWidth;
  const heightAvailable = pointy ? bounds.areaWidth : bounds.areaHeight;
  const rows = Math.floor(heightAvailable / height);
  const staggered = Math.max(0, Math.floor(heightAvailable / height - 0.5));
  let columns = Math.max(0, 1 + Math.floor((widthAvailable - 2 * side) / (1.5 * side)));
  if (staggered === 0 && columns > 0 && columns % 2 === 0) columns--;
  const widthUsed = (columns - 1) * 1.5 * side + 2 * side;
  const heightUsed = Math.max(rows, columns > 1 && staggered ? staggered + 0.5 : 0) * height;
  const left = (widthAvailable - widthUsed) / 2;
  const top = (heightAvailable - heightUsed) / 2;
  const instances = [];
  const strips = [];
  const variants = new Map();
  for (let col = 0; col < columns && rows > 0; col++) {
    const odd = col % 2 === 1;
    const count = odd ? staggered : rows;
    if (!count) continue;
    const previous = col === 0 ? 0 : odd ? rows : staggered;
    const key = [odd, count, previous].join('/');
    if (!variants.has(key)) {
      variants.set(key, strips.length);
      strips.push(makeStrip(side, height, count, previous, odd));
    }
    const x = left + col * 1.5 * side;
    const y = top + (odd ? height / 2 : 0);
    instances.push({ col, count, strip: variants.get(key), x: bounds.left + (pointy ? y : x), y: bounds.top + (pointy ? x : y) });
  }
  return { kind: 'hexGrid', pointy, instances, strips, color: paper.color, weight: paper.lineWeight };
}

export function drawHexLabels(grid, side, text) {
  const height = side * Math.sqrt(3);
  const size = Math.min(2.7, side * 0.32);
  const number = n => String(n + 1).padStart(2, '0');
  for (const { x, y, col, count } of grid.instances) {
    for (let row = 0; row < count; row++) {
      const across = (row + 0.5) * height;
      const cx = x + (grid.pointy ? across : side);
      const cy = y + (grid.pointy ? side : across);
      const id = grid.pointy ? number(row) + '-' + number(col) : number(col) + '-' + number(row);
      text(cx, cy - 0.24 * side, id, size, 'middle', grid.color);
    }
  }
}

function makeStrip(side, height, count, previous, odd) {
  const paths = [];
  for (let row = 0; row < count; row++) {
    const y = row * height;
    const a = [side / 2, y], b = [1.5 * side, y], c = [2 * side, y + height / 2];
    const d = [b[0], y + height], e = [a[0], d[1]], f = [0, c[1]];
    // Top and right edges belong to this cell. Only close exposed bottom/left edges.
    const outline = [a, b, c, d];
    if (row === count - 1) outline.push(e);
    paths.push(outline);
    const upper = odd ? row : row - 1;
    const lower = upper + 1;
    if (upper < 0 || upper >= previous) paths.push([f, a]);
    if (lower >= previous) paths.push([e, f]);
  }
  return { paths, width: 2 * side, height: count * height };
}

export function hexGridSVG(grid, format) {
  const defs = grid.strips.map(({ paths }, i) => {
    const d = paths.map(points => 'M' + points.map(([x, y]) => format(x) + ' ' + format(y)).join('L')).join('');
    return `<path id="hex-strip-${i}" d="${d}"/>`;
  });
  const matrix = grid.pointy ? '0 1 1 0' : '1 0 0 1';
  const uses = grid.instances.map(({ strip, x, y }) =>
    `<use href="#hex-strip-${strip}" transform="matrix(${matrix} ${format(x)} ${format(y)})"/>`);
  return `<defs>${defs.join('')}</defs><g fill="none" stroke="${grid.color}" stroke-width="${format(grid.weight)}" stroke-linejoin="round" stroke-linecap="round">${uses.join('')}</g>`;
}

// Reuse a small number of vector strips even on a dense poster or a multi-page PDF.
export function hexGridPDF(grid, units, pageHeight, format, strokeColor) {
  const forms = grid.strips.map(strip => {
    const commands = [strokeColor + ' RG', format(grid.weight) + ' w 1 J 1 j'];
    for (const points of strip.paths) {
      commands.push(points.map(([x, y], i) => format(x) + ' ' + format(y) + (i ? ' l' : ' m')).join(' '));
    }
    const stream = commands.join('\n') + '\nS\n';
    const pad = grid.weight;
    const box = [-pad, -pad, strip.width + pad, strip.height + pad].map(format).join(' ');
    return `<< /Type /XObject /Subtype /Form /BBox [${box}] /Resources << >> /Length ${stream.length} >>\nstream\n${stream}endstream`;
  });
  const matrix = (grid.pointy ? [0, -units, units, 0] : [units, 0, 0, -units]).map(format).join(' ');
  const commands = grid.instances.map(({ strip, x, y }) =>
    `q ${matrix} ${format(x * units)} ${format((pageHeight - y) * units)} cm /Hex${strip} Do Q`);
  return { forms, commands };
}
