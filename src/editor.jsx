import { matchingTemplate } from './music-staves.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PAPER_TYPES, defaultsFor } from './paper-catalog.js';
import { getDimensions, getMusicLayout, renderSVG, buildPDF } from './paper-engine.js';
import {
  INKS,
  initialPaper,
  fitPaper,
  pageType,
  previewNote,
  readPreferences,
  savePreferences,
  sharePath,
} from './paper-state.js';
import { PaperToolbar, Chevron } from './fields.jsx';
import { PaperGuide } from './paper-guide.jsx';
import { Header } from './header.jsx';
import { PrintTips } from './dialogs.jsx';

const MIN_ZOOM = 0.75;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;
const zoomButton = 'inline-flex size-[27px] items-center justify-center rounded-lg p-[6px] text-[#8b9589] enabled:hover:bg-[#e8ede3] enabled:hover:text-[#394d3d] disabled:opacity-40 max-[901px]:size-[25px] [&_svg]:size-[15px]';

// The PDF's built-in Helvetica covers western text. Use the browser's fallback
// font for part names in other scripts, preserving the preview's alignment.
function renderLabelMask(shape) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const font = (shape.bold ? 'bold ' : '') + '64px Helvetica, Arial, sans-serif';
  ctx.font = font;
  ctx.textAlign = shape.anchor === 'end' ? 'right' : shape.anchor === 'middle' ? 'center' : 'left';
  const align = ctx.textAlign;
  const m = ctx.measureText(shape.value);
  const left = Math.ceil(m.actualBoundingBoxLeft) + 1;
  const ascent = Math.ceil(m.actualBoundingBoxAscent) + 1;
  canvas.width = Math.max(1, left + Math.ceil(m.actualBoundingBoxRight) + 1);
  canvas.height = Math.max(1, ascent + Math.ceil(m.actualBoundingBoxDescent) + 1);
  ctx.font = font;
  ctx.textAlign = align;
  ctx.fillText(shape.value, left, ascent);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const stride = Math.ceil(canvas.width / 8);
  const mask = new Uint8Array(stride * canvas.height);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (pixels[4 * (y * canvas.width + x) + 3] >= 128) mask[y * stride + (x >> 3)] |= 128 >> (x % 8);
    }
  }
  return { w: canvas.width, h: canvas.height, left, ascent, scale: shape.size / 64,
    hex: Array.from(mask, byte => byte.toString(16).padStart(2, '0')).join('') };
}

function download(paper, extension) {
  const suffix =
    paper.type === 'coordinate'
      ? `${paper.quadrants}-range-${paper.xMin}_${paper.axisRange}x${paper.yMin}_${paper.yRange}`
      : paper.type === 'music'
        ? `${matchingTemplate(paper.staves)?.id ?? 'custom'}-${getMusicLayout(paper).count}-systems`
        : paper.type === 'cornell'
          ? paper.noteStyle
          : `${paper.type === 'calligraphy' ? paper.xHeight : paper.spacing}mm`;
  const blob =
    extension === 'pdf' ? buildPDF(paper, renderLabelMask) : new Blob([renderSVG(paper)], { type: 'image/svg+xml' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = `makepaperfast-${paper.type}-${paper.size}-${paper.orientation}-${suffix}.${extension}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 10000);
}

export function Editor({ url }) {
  const [paper, setPaper] = useState(() => initialPaper(url));
  const routeType = pageType(url.pathname);
  const [zoom, setZoom] = useState(1);
  const [message, setMessage] = useState('');
  const [preparing, setPreparing] = useState(false);
  const timer = useRef();
  const tips = useRef(null);
  const info = PAPER_TYPES[paper.type];
  const dimensions = getDimensions(paper);
  const exportBlocked = paper.type === 'music' && !getMusicLayout(paper).count;
  const otherOrientation = paper.orientation === 'landscape' ? 'portrait' : 'landscape';
  const canRotateToFit = exportBlocked && getMusicLayout({ ...paper, orientation: otherOrientation }).count > 0;
  const svg = useMemo(() => renderSVG(paper), [paper]);

  useEffect(() => {
    function restore() {
      const saved = readPreferences();
      const current = new URL(location.href);
      const snapshot = new URL(history.state?.paperPath ?? current.href, current);
      const next = initialPaper(snapshot.pathname === current.pathname ? snapshot : current, saved);
      history.replaceState({ paperPath: sharePath(next) }, '');
      setMessage('');
      setPaper(next);
      savePreferences(next);
      setZoom(1);
    }
    restore();
    const onPageShow = (event) => {
      if (event.persisted) restore();
    };
    window.addEventListener('popstate', restore);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      window.removeEventListener('popstate', restore);
      window.removeEventListener('pageshow', onPageShow);
      clearTimeout(timer.current);
    };
  }, []);

  function notify(text) {
    setMessage(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(''), 2800);
  }
  function updateAddress(next) {
    const path = sharePath(next);
    history.replaceState({ paperPath: path }, '', path);
  }
  function update(changes) {
    const next = fitPaper({ ...paper, ...changes });
    setPaper(next);
    savePreferences(next);
    updateAddress(next);
    if (changes.size || changes.orientation) setZoom(1);
  }
  function reset() {
    update({ color: INKS[0].value, ...defaultsFor(paper.type), orientation: 'portrait', background: '#ffffff', gridBackground: null });
    notify('This paper is back to its defaults.');
  }
  async function exportPaper(extension) {
    if (exportBlocked) return;
    setPreparing(true);
    try {
      await new Promise(requestAnimationFrame);
      download(paper, extension);
      notify(extension === 'pdf' ? 'PDF downloaded. Print at 100% for the right size.' : 'SVG downloaded.');
    } catch (error) {
      console.error('Paper export failed', error);
      notify('Couldn’t create the file. Please try again.');
    } finally {
      setPreparing(false);
    }
  }
  async function share() {
    const href = new URL(sharePath(paper), location.origin).href;
    try {
      await navigator.clipboard.writeText(href);
      notify('Link copied, settings and all.');
    } catch {
      updateAddress(paper);
      notify('Copy the address from your browser to share these settings.');
    }
  }
  return (
    <>
      <style>{`@page { size: ${dimensions.width}mm ${dimensions.height}mm; margin: 0; }`}</style>
      <div
        id="paper-app" className="grid h-dvh min-w-0 grid-rows-[auto_minmax(0,1fr)]"
        style={{
          '--print-width': dimensions.width + 'mm',
          '--print-height': dimensions.height + 'mm',
          '--sheet-ratio': dimensions.width / dimensions.height,
          '--zoom': zoom,
        }}
      >
        <div><Header {...{ paper, reset, exportPaper, share, preparing, exportBlocked }} />
          {exportBlocked && <div id="music-fit-warning" role="status" className="flex flex-wrap items-center justify-center gap-x-3 bg-white px-3 py-2 text-[13px] print:hidden">
            No complete system fits on this page.
            <button type="button" className="font-semibold underline" onClick={() => canRotateToFit
              ? update({ orientation: otherOrientation }) : document.getElementById('dock-page')?.click()}>
              {canRotateToFit ? 'Switch to ' + otherOrientation : 'Adjust paper size or margins'}
            </button>
          </div>}
        </div>
        <main className="relative grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto_44px] px-10 min-[1500px]:px-[52px] max-[1101px]:px-[25px] max-[901px]:grid-rows-[minmax(0,1fr)_auto_38px] max-[901px]:px-4 max-[361px]:px-3 short-screen:grid-rows-[minmax(0,1fr)_auto_34px]" id="workspace">
          <h1 className="sr-only">{info.name}</h1>
          <div
            className="flex min-h-0 min-w-0 overflow-auto px-5 pt-0.5 [container-type:size] [scrollbar-width:thin] max-[901px]:px-2 max-[901px]:pt-0"
            id="preview-viewport"
            role="region"
            aria-label="Live paper preview"
          >
            <div className="m-auto flex w-[calc(min(100cqw,(100cqh_-_54px)*var(--sheet-ratio))*var(--zoom))] shrink-0 flex-col items-center gap-[15px] pt-0.5 pb-2.5 max-[901px]:gap-3 max-[901px]:pb-2" id="paper-center">
              <div
                className="relative aspect-(--sheet-ratio) w-full shrink-0 bg-white shadow-[0_2px_4px_#26311d06,0_8px_30px_#26311d06] outline outline-[#27301d0a] [&>svg]:size-full"
                id="paper-sheet"
                aria-label={info.name + ' preview'}
                dangerouslySetInnerHTML={{ __html: svg }}
              />
              {Array.from({ length: paper.pageCount - 1 }, (_, index) => (
                <svg key={index} aria-hidden="true" className="hidden print:block print:break-before-page"
                  viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                  style={{ width: 'var(--print-width)', height: 'var(--print-height)' }}>
                  <use href="#paper-drawing" />
                </svg>
              ))}
              <div className="flex min-h-[17px] w-full flex-wrap items-center justify-between gap-x-3 gap-y-0.5 px-px text-xs leading-[1.4] tracking-[.16px] text-muted tabular-nums max-[901px]:gap-x-2 print:hidden">
                <span id="paper-spec">
                  {dimensions.label} · {dimensions.width} × {dimensions.height} mm{paper.pageCount > 1 && ` · ${paper.pageCount} pages`}
                </span>
                <span id="preview-note">{previewNote(paper)}</span>
              </div>
            </div>
          </div>

          <PaperToolbar key={paper.type} paper={paper} update={update} />
          <footer className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-0.5 pb-[9px] max-[901px]:pb-1.5 max-[361px]:-mx-2.5 print:hidden">
            <button
              id="print-tip-button"
              onClick={() => tips.current.showModal()}
              className="inline-flex items-center justify-self-start gap-[7px] rounded py-[5px] text-xs text-muted hover:text-[#63765b] max-[901px]:gap-[5px] [&_svg]:size-[13px]"
              type="button"
              title="Printing tips"
            >
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="5.8" stroke="currentColor" strokeWidth="1.1" />
                <path d="M8 7v4M8 4.8v.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span className="max-[541px]:hidden">Made to print. At 100% scale.</span>
              <span className="hidden whitespace-nowrap max-[541px]:inline">Print tips</span>
            </button>
            <a
              href="#about-this-paper"
              className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 max-[361px]:px-0.5 text-[13px] font-medium whitespace-nowrap text-muted hover:bg-[#e8ede3] hover:text-ink"
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                const heading = document.getElementById('about-this-paper');
                if (!heading) return;
                event.preventDefault();
                heading.focus({ preventScroll: true });
                heading.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
              }}
            >
              About this paper
              <Chevron />
            </a>
            <div className="flex items-center justify-self-end gap-1 max-[901px]:gap-0.5 max-[361px]:gap-0" role="group" aria-label="Preview zoom">
              <button
                id="zoom-out"
                onClick={() => setZoom(value => Math.max(MIN_ZOOM, value - ZOOM_STEP))}
                disabled={zoom <= MIN_ZOOM}
                title={zoom <= MIN_ZOOM ? `Minimum zoom: ${MIN_ZOOM * 100}%` : 'Zoom out'}
                className={zoomButton}
                type="button"
                aria-label="Zoom out"
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d="M4 8h8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <button
                id="zoom-fit"
                onClick={() => setZoom(1)}
                type="button"
                className="h-[27px] min-w-[31px] rounded-[5px] px-1 text-xs text-[#8b987e] tabular-nums hover:bg-[#e7ecdf] hover:text-[#465d3b]"
                title="Fit paper to screen"
              >
                {zoom === 1 ? 'Fit' : zoom * 100 + '%'}
              </button>
              <button
                id="zoom-in"
                onClick={() => setZoom(value => Math.min(MAX_ZOOM, value + ZOOM_STEP))}
                disabled={zoom >= MAX_ZOOM}
                title={zoom >= MAX_ZOOM ? `Maximum zoom: ${MAX_ZOOM * 100}%` : 'Zoom in'}
                className={zoomButton}
                type="button"
                aria-label="Zoom in"
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d="M4 8h8M8 4v8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </footer>
        </main>
      </div>

      <PaperGuide type={routeType} currentType={paper.type} />
      <PrintTips tips={tips} />
      <div id="toast" className="fixed bottom-[151px] left-1/2 z-90 max-w-[min(420px,calc(100vw-32px))] -translate-x-1/2 animate-toast rounded-[10px] border border-[#415038] bg-[#3a4932] px-[17px] py-[11px] text-center text-xs leading-normal text-[#f3f7ed] shadow-lg max-[901px]:bottom-[calc(186px+env(safe-area-inset-bottom))] max-[901px]:w-max print:hidden" role="status" aria-live="polite" hidden={!message}>
        {message}
      </div>
    </>
  );
}
