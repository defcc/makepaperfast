import { PaperIcon } from './paper-icon.jsx';

const closeButton = 'inline-flex shrink-0 items-center justify-center rounded-lg p-[5px] text-[#8b9589] hover:bg-[#e8ede3] hover:text-[#394d3d] [&_svg]:size-5';
const doneButton = 'min-h-[35px] rounded-lg border border-[#35472e] bg-[#36482e] px-[18px] py-2 text-xs font-medium text-white hover:bg-[#4b623f] max-[901px]:min-h-[39px]';

export function dismissBackdrop(event) {
  if (event.target !== event.currentTarget) return;
  const rect = event.target.getBoundingClientRect();
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  )
    event.target.close();
}

export function PrintTips({ tips }) {
  return (
    <dialog
      ref={tips}
      onClick={dismissBackdrop}
      id="print-dialog"
      className="fixed inset-0 m-auto h-fit max-h-[calc(100dvh-40px)] w-[382px] max-w-[calc(100vw-32px)] overflow-auto rounded-[20px] p-[35px] backdrop:bg-[#2c382719] backdrop:backdrop-blur-[2px] max-[901px]:rounded-[18px] max-[901px]:p-[29px]"
      aria-labelledby="print-title"
    >
      <button
        id="close-print-tip"
        onClick={() => tips.current.close()}
        className={`${closeButton} absolute top-3 right-3 size-[34px]`}
        type="button"
        aria-label="Close printing tips"
      >
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="m5 5 10 10M5 15 15 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      <PaperIcon className="mb-[21px] block h-[46px] w-[35px] text-[#8ca77b]" type="graph" />
      <h2 id="print-title" className="mb-4 text-[23px] leading-tight font-[550] tracking-[-.65px] max-[901px]:text-[22px]">A good page, at the right size.</h2>
      <p className="mb-[13px] text-xs leading-[1.8] text-[#7d8d71]">
        Download the PDF, match your printer’s paper size, and choose <strong className="font-[550] text-[#4d6941]">100% or Actual Size</strong>{' '}
        in the print dialog.
      </p>
      <p className="mb-[13px] text-xs leading-[1.8] text-muted">
        The preview is scaled to your screen. Check a few squares with a ruler after your first print.
      </p>
      <button id="got-it" onClick={() => tips.current.close()} className={`${doneButton} mt-[13px] w-full`} type="button">
        Got it
      </button>
    </dialog>
  );
}
