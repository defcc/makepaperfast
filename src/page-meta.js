import { PAPER_TYPES } from './paper-catalog.js';

export function pageMeta(type) {
  const info = PAPER_TYPES[type];
  if (!info) {
    return {
      title: 'MakePaperFast — Free Printable Paper Generator',
      description: 'Create graph, dot grid, lined, coordinate, isometric, Cornell and music staff paper with MakePaperFast. Customize your page and download a free printable PDF.',
    };
  }
  const paperName = info.name.replace(/\b[a-z]/g, letter => letter.toUpperCase());
  return {
    title: `Modern ${paperName} Generator — Free Printable PDF in Seconds`,
    description: `${info.description} Choose a paper size from A5 to a 24 × 36 inch poster and download your ${info.name.toLowerCase()} as a free printable PDF.`,
  };
}
