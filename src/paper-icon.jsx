function miniPaper(type) {
  let marks = '';
  const line = (x1, y1, x2, y2) => `<path d='M${x1} ${y1}L${x2} ${y2}'/>`;
  if (type === 'graph') {
    for (const x of [8, 12, 16]) marks += line(x, 6, x, 22);
    for (const y of [10, 14, 18]) marks += line(4, y, 20, y);
  } else if (type === 'dot') {
    for (const x of [7, 12, 17])
      for (const y of [8, 13, 18, 23])
        marks += `<circle cx='${x}' cy='${y}' r='.7' fill='currentColor' stroke='none'/>`;
  } else if (type === 'lined') {
    for (const y of [8, 12, 16, 20, 24]) marks += line(6, y, 18, y);
  } else if (type === 'handwriting') {
    for (const y of [6, 17]) {
      marks += line(5, y, 19, y) + line(5, y + 6, 19, y + 6);
      marks += `<path d='M5 ${y + 3}h14' stroke-dasharray='1.5 2'/>`;
    }
  } else if (type === 'calligraphy') {
    marks += line(5, 8, 19, 8) + line(5, 15, 19, 15) + line(5, 22, 19, 22);
    marks += line(6, 22, 15, 8) + line(12, 22, 19, 11);
  } else if (type === 'coordinate') {
    marks += `<path d='M6 14h13m-7-8v17m-2-15 2-2 2 2m3 4 2 2-2 2'/>`;
    for (const y of [10, 18]) marks += line(11, y, 13, y);
  } else if (type === 'hex') {
    marks += "<path d='m5 13 3-5h6l3 5-3 5H8Zm9 5 3 5m0-10h3M8 18l-3 5'/>";
  } else if (type === 'isometric') {
    marks += `<path d='m5 10 14 8m-14 0 14-8M12 6v17M5 10v8l7 4 7-4v-8l-7-4-7 4Z'/>`;
  } else if (type === 'cornell') {
    marks += `<path d='M9 6v14M5 20h14M12 9h5m-5 4h5m-5 4h5'/>`;
  } else if (type === 'music') {
    for (const y of [8, 11, 14, 17, 20]) marks += line(5, y, 19, y);
  } else {
    marks += `<circle cx='7' cy='14' r='1' fill='currentColor'/><circle cx='12' cy='14' r='1' fill='currentColor'/><circle cx='17' cy='14' r='1' fill='currentColor'/>`;
  }
  return `<svg viewBox='0 0 24 30' fill='none' aria-hidden='true'><rect x='2.5' y='1.5' width='19' height='27' rx='2' stroke='currentColor' stroke-width='1.1' opacity='.5'/><g stroke='currentColor' stroke-width='.85' stroke-linecap='round' stroke-linejoin='round'>${marks}</g></svg>`;
}

export function PaperIcon({ type, className = 'inline-flex h-[29px] w-[22px] shrink-0 items-center justify-center text-[#8b9b87] group-aria-[current=page]/link:text-[#607d60] max-[1101px]:h-[25px] max-[1101px]:w-[18px]' }) {
  return <span className={`${className} [&>svg]:size-full`} dangerouslySetInnerHTML={{ __html: miniPaper(type) }} />;
}
