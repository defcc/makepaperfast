import { useEffect, useRef, useState } from 'react';
import { PAPER_TYPES } from './paper-catalog.js';
import { paths } from './paper-state.js';
import { PaperIcon } from './paper-icon.jsx';

const paperTypes = Object.keys(paths);

function PaperLink({ type, selected, overflow = false, menuItem = false }) {
  return (
    <a
      href={paths[type]}
      data-paper={type}
      data-overflow={overflow || undefined}
      aria-current={selected ? 'page' : undefined}
      className={menuItem
        ? 'flex min-h-11 w-full items-center justify-start gap-2.5 rounded-lg border border-transparent px-3 text-left text-xs font-medium text-[#7d877b] hover:bg-[#ecefe7] aria-[current=page]:border-[#dce3d6] aria-[current=page]:text-[#35463a]'
        : "inline-flex shrink-0 items-center data-[overflow]:invisible data-[overflow]:absolute data-[overflow]:left-0 max-[541px]:[&>span:first-child]:hidden gap-[9px] rounded-[10px] border border-transparent px-[13px] py-[9px] text-xs font-medium whitespace-nowrap text-[#7d877b] no-underline hover:bg-[#ecefe7] hover:text-[#3b4a3f] aria-[current=page]:border-[#dce3d6] aria-[current=page]:bg-white aria-[current=page]:text-[#35463a] min-[1351px]:max-[1440px]:px-2 min-[1351px]:min-h-[52px] min-[1351px]:justify-center max-[1351px]:min-h-[44px] max-[1351px]:gap-1.5 max-[1351px]:px-2.5 max-[541px]:px-1.5 focus-visible:-outline-offset-2"}
    >
      <PaperIcon type={type} />
      <span>{PAPER_TYPES[type].short}</span>
    </a>
  );
}

function navigateTabs(event) {
  if (!['Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  const links = [...event.currentTarget.querySelectorAll('a,summary')].filter(
    link => link.getClientRects().length && getComputedStyle(link).visibility === 'visible',
  );
  const i = links.indexOf(event.target);
  if (i < 0) return;
  event.preventDefault();
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? links.length - 1
        : (i + (event.key === 'ArrowRight' ? 1 : -1) + links.length) % links.length;
  links[next].focus();
}

export function Header({ paper, reset, exportPaper, share, preparing, exportBlocked }) {
  const [menu, setMenu] = useState(false);
  const [visibleCount, setVisibleCount] = useState(paperTypes.length);
  const paperNav = useRef(null);
  const more = useRef(null);
  const menuWrap = useRef(null);
  useEffect(() => {
    const closeOutside = (event) => {
      if (!more.current.contains(event.target)) more.current.open = false;
      if (!menuWrap.current?.contains(event.target)) setMenu(false);
    };
    const escape = (event) => {
      if (event.key !== 'Escape') return;
      if (more.current.open) {
        more.current.open = false;
        more.current.querySelector('summary').focus();
      }
      setMenu(false);
    };
    document.addEventListener('click', closeOutside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('click', closeOutside);
      document.removeEventListener('keydown', escape);
    };
  }, []);

  useEffect(() => {
    const nav = paperNav.current;
    const items = [...nav.querySelectorAll(':scope > a')];
    const trigger = more.current.querySelector('summary');
    function fitPapers() {
      const gap = parseFloat(getComputedStyle(nav).columnGap);
      const widths = items.map(item => item.getBoundingClientRect().width);
      const available = nav.clientWidth;
      let count = items.length;
      if (widths.reduce((sum, width) => sum + width, 0) + gap * (count - 1) > available) {
        let used = trigger.getBoundingClientRect().width;
        count = 0;
        for (const width of widths) {
          used += gap + width;
          if (used > available) break;
          count++;
        }
      }
      setVisibleCount(count);
      if (count === items.length) more.current.open = false;
    }
    fitPapers();
    const observer = new ResizeObserver(fitPapers);
    [nav, trigger, ...items].forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const overflowTypes = paperTypes.slice(visibleCount);
  return (
    <div className="relative z-30 min-w-0 bg-desk print:hidden">
      <header className="grid min-h-[82px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-5 border-b border-[#e1e5dc] px-10 min-[1500px]:px-[52px] max-[1101px]:gap-[13px] max-[1101px]:px-[22px] max-[901px]:min-h-16 max-[1351px]:grid-cols-[minmax(0,1fr)_auto] max-[901px]:gap-2.5 max-[901px]:px-[17px] max-[541px]:gap-1.5 max-[541px]:px-2.5 short-screen:min-h-[68px]">
        <a href="/" className="inline-flex items-center justify-self-start gap-[11px] text-inherit no-underline max-[1351px]:hidden">
          <svg className="h-[34px] w-7 text-[#4c5b4f]" viewBox="0 0 32 36" fill="none" aria-hidden="true">
            <path
              d="M7 6 3 8v23a2 2 0 0 0 2 2h19l3-3"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="8" y="3" width="21" height="26" rx="2" stroke="currentColor" strokeWidth="1.7" />
            <path
              d="M13 10h11M13 15h11M13 20h7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="whitespace-nowrap text-[21px] leading-tight font-[650] tracking-[-0.8px]">
            MakePaperFast<span className="text-[#879c83]">.</span>com
          </span>
        </a>

        <nav ref={paperNav} onKeyDown={navigateTabs} aria-label="Paper types"
          className={`relative flex min-w-0 items-center gap-[5px] min-[1351px]:justify-center max-[541px]:gap-0.5 min-[1500px]:gap-2 ${overflowTypes.length ? '' : 'overflow-x-auto [scrollbar-width:none]'}`}>
          {paperTypes.map((type, index) => (
            <PaperLink key={type} type={type} selected={type === paper.type} overflow={index >= visibleCount} />
          ))}
          <details ref={more} className={overflowTypes.length ? 'group shrink-0 sm:relative' : 'invisible absolute left-0'}>
            <summary aria-label={overflowTypes.includes(paper.type) ? 'More paper types, current: ' + PAPER_TYPES[paper.type].short : 'More paper types'}
              data-selected={overflowTypes.includes(paper.type) || undefined}
              className="flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-[10px] border border-transparent px-2 text-xs font-medium text-muted hover:bg-[#ecefe7] data-[selected]:border-[#dce3d6] data-[selected]:bg-white data-[selected]:text-[#35463a] [&::-webkit-details-marker]:hidden">
              More
              <svg className="size-3 group-open:rotate-180" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="m3 4.5 3 3 3-3" stroke="currentColor" strokeWidth="1.4" /></svg>
            </summary>
            <div className="absolute right-0 top-full z-50 mt-1.5 grid max-h-[65dvh] w-44 max-sm:max-w-full overflow-y-auto rounded-xl border border-[#dfe5d8] bg-white p-1.5 shadow-lg">
              {overflowTypes.map(type => <PaperLink menuItem key={type} type={type} selected={type === paper.type} />)}
            </div>
          </details>
        </nav>

        <div className="flex items-center justify-end justify-self-end gap-[13px] max-[901px]:gap-0">
          <button
            id="reset-button"
            onClick={reset}
            className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-lg bg-transparent p-[7px] text-[#8b9589] hover:bg-[#e8ede3] hover:text-[#394d3d] max-[1101px]:hidden [&_svg]:size-5"
            type="button"
            title="Reset this paper"
            aria-label="Reset this paper"
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M4.5 8A6 6 0 1 1 4 12M4.5 8V3.5M4.5 8H9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="relative" ref={menuWrap}>
            <div className="flex items-stretch rounded-[9px] border border-[#303b31] bg-[#303a31] shadow-[0_2px_3px_#20302208]">
              <button
                id="download-button"
                onClick={() => {
                  setMenu(false);
                  exportPaper('pdf');
                }}
                aria-label="Download PDF"
                disabled={preparing || exportBlocked} aria-describedby={exportBlocked ? "music-fit-warning" : undefined}
                aria-busy={preparing}
                type="button"
                className="inline-flex h-[39px] min-w-[145px] items-center justify-center gap-[9px] rounded-l-lg disabled:opacity-50 bg-transparent px-3.5 text-xs font-[520] tracking-[-.1px] whitespace-nowrap text-white hover:bg-[#455245] max-[1101px]:min-w-[131px] max-[901px]:h-9 max-[901px]:min-w-[126px] max-[901px]:gap-[7px] max-[901px]:px-2.5 max-[541px]:min-w-[35px] max-[541px]:px-[7px] [&_svg]:size-[17px] [&_svg]:text-[#e1e7de] max-[901px]:[&_svg]:size-[15px]"
              >
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M10 3v9m-3-3 3 3 3-3M4 13.5v3h12v-3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span id="download-label" className="max-[541px]:sr-only">{preparing ? 'Preparing…' : 'Download PDF'}</span>
              </button>
              <button
                id="export-menu-button"
                onClick={() => setMenu(!menu)}
                className="flex w-[29px] items-center justify-center rounded-r-lg border-l border-white/15 bg-transparent text-[#e4e9e2] hover:bg-[#455245] max-[901px]:w-[26px] [&_svg]:size-3.5"
                type="button"
                aria-label="More options"
                aria-haspopup="menu"
                aria-expanded={menu}
                aria-controls="export-menu"
              >
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="m5 6 3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div id="export-menu" className="absolute top-[calc(100%+12px)] right-0 z-60 w-[245px] rounded-[14px] border border-[#dee5d8] bg-white p-[7px] shadow-[0_12px_40px_#2c3b2412,0_2px_7px_#2c3b2407] max-[901px]:w-[234px]" role="menu" hidden={!menu}>
              <button
                id="print-button" disabled={exportBlocked}
                onClick={() => {
                  setMenu(false);
                  window.print();
                }}
                type="button"
                role="menuitem" className="block w-full rounded-lg px-3 py-[11px] text-left text-xs hover:bg-[#f0f4eb] focus-visible:bg-[#f0f4eb]"
              >
                <span>{paper.pageCount > 1 ? `Print ${paper.pageCount} pages` : 'Print this page'}</span>
                <small className="mt-1 block text-xs font-normal text-muted">100% / Actual size</small>
              </button>
              <button
                id="svg-button" disabled={exportBlocked}
                onClick={() => {
                  setMenu(false);
                  exportPaper('svg');
                }}
                type="button"
                role="menuitem" className="block w-full rounded-lg px-3 py-[11px] text-left text-xs hover:bg-[#f0f4eb] focus-visible:bg-[#f0f4eb]"
              >
                <span>Download SVG</span>
                <small className="mt-1 block text-xs font-normal text-muted">Editable vector</small>
              </button>
              <button
                id="share-button"
                onClick={() => {
                  setMenu(false);
                  share();
                }}
                type="button"
                role="menuitem" className="block w-full rounded-lg px-3 py-[11px] text-left text-xs hover:bg-[#f0f4eb] focus-visible:bg-[#f0f4eb]"
              >
                <span>Copy link to this paper</span>
                <small className="mt-1 block text-xs font-normal text-muted">Keep these settings</small>
              </button>
              <button
                type="button"
                role="menuitem"
                className="hidden w-full rounded-lg border-t border-[#edf0e7] px-3 py-3 text-left text-xs hover:bg-[#f0f4eb] max-[1101px]:block"
                onClick={() => { setMenu(false); reset(); }}
              >
                Reset this paper
              </button>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
