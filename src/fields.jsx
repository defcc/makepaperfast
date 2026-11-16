import { musicTemplates, matchingTemplate, staffClefs, lyricStaffIndices, changeStaffList, MAX_STAVES } from './music-staves.js';
import { calligraphyRuling, specialtyFields } from './specialty-settings.js';
import { useEffect, useRef, useState } from 'react';
import { MAX_PRACTICE_TEXT } from './practice-text.js';
import { ColorPalette, useSavedColors } from './color-palette.jsx';
import { classroomRulings, notebookRulings, spacingUnit, spacingOptions, spacingText, spacingInMm, spacingLabel } from './spacing.js';
import { INKS } from './paper-state.js';
import { quadrantBounds, coordinateRangeLabel, MAX_AXIS_RANGE, numberIntervals, FIELDS, LETTER_BOX_WIDTH, SPACER_WIDTH, MAX_PAGE_COUNT, LINE_THICKNESS_PT, NOTEBOOK_LAYOUT, PAPER_TYPES, minSpacing, maxSpacing, guideLabel, marginSides, rulingStyles } from './paper-catalog.js';
import { getHandwritingPageLayout, getMusicLayout, getDimensions, maxPageMargin, musicMarginLimit, PAPER_SIZES, CUSTOM_MIN_MM, CUSTOM_MAX_MM } from './paper-engine.js';

export function Chevron() {
  return (
    <svg viewBox="0 0 16 16" className="size-[13px] text-[#91998d]" aria-hidden="true">
      <path d="m5 6 3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function extraFields(paper) {
  return PAPER_TYPES[paper.type].more.filter((key) => {
    if (key === 'dotSize')
      return (
        (paper.isoStyle === 'dots' && paper.type === 'isometric') ||
        (paper.noteStyle === 'dot' && paper.type === 'cornell')
      );
    return key !== 'spacing' || paper.type !== 'cornell' || paper.noteStyle !== 'blank' || paper.cueRuling === 'lined';
  });
}

function IsometricOrientationDiagram({ orientation, dots }) {
  const corners = [[16, 0], [8, 13.856], [-8, 13.856], [-16, 0], [-8, -13.856], [8, -13.856]];
  return (
    <svg aria-hidden="true" viewBox="-20 -20 40 40" className="mx-auto mb-1 size-10 text-[#61775e]">
      <g transform={orientation === 'vertical' ? 'rotate(90)' : undefined}>
        {dots ? [[0, 0], ...corners].map(([x, y]) =>
          <circle key={x + ',' + y} cx={x} cy={y} r="1.8" fill="currentColor" />)
          : <g fill="none" stroke="currentColor" strokeWidth="1.2">
            <polygon points={corners.map(point => point.join(',')).join(' ')} />
            {corners.slice(0, 3).map(([x, y]) => <line key={x} x1={x} y1={y} x2={-x} y2={-y} />)}
          </g>}
      </g>
    </svg>
  );
}

function HexDiagram({ orientation, measure }) {
  // The marked length either follows one edge or joins the midpoints of two opposite edges.
  return (
    <svg viewBox="-25 -25 50 50" aria-hidden="true" className="mx-auto size-11">
      <g transform={orientation === 'pointy' ? 'rotate(90)' : undefined}>
        <path d="M-10 -17.32h20L20 0 10 17.32h-20L-20 0Z" fill="none" stroke="#82937e" strokeWidth="1.3" />
        {measure && <path d={measure === 'side' ? 'M-10 -17.32h20' : 'M0 -17.32v34.64'} stroke="#354b39" strokeWidth="2.6" />}
      </g>
    </svg>
  );
}

function DotSpacingDiagram({ paper }) {
  const triangular = paper.dotLayout === 'triangular';
  const pitch = 24;
  const rowHeight = triangular ? pitch * Math.sqrt(3) / 2 : pitch;
  const start = { x: 38, y: triangular ? 8 : 8 + rowHeight };
  const end = { x: start.x + (triangular ? pitch / 2 : pitch), y: 8 + rowHeight };
  return (
    <figure className="mb-3 flex items-center gap-3 rounded-lg bg-desk px-3 py-1.5">
      <svg viewBox="0 0 108 64" className="h-16 w-[108px]" aria-hidden="true">
        {[0, 1, 2].map(row => (
          <g key={row} transform={`translate(${triangular && row === 1 ? pitch / 2 : 0} ${8 + row * rowHeight})`}>
            {[0, 1, 2, 3].map(column => <circle key={column} cx={14 + column * pitch} cy="0" r="2" fill="#9ca99b" />)}
          </g>
        ))}
        <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#36482e" strokeWidth="2" />
        {[start, end].map(point => (
          <circle key={point.x} cx={point.x} cy={point.y} r="3.5" fill="#36482e" />
        ))}
      </svg>
      <figcaption className="text-xs leading-relaxed text-muted">
        <strong className="block text-sm font-semibold text-ink">{spacingLabel(paper)} center to center</strong>
        {triangular ? 'Along one side of an equilateral triangle.' : 'Between adjacent dots in a row or column.'}
      </figcaption>
    </figure>
  );
}

function GuideDistance({ label, value, min, max, unit, onChange, list }) {
  const [draft, setDraft] = useState(null);
  function text(mm) {
    const sixteenths = Math.round(mm / 25.4 * 16);
    if (unit === 'in' && sixteenths % 2 === 1 && Math.abs(mm - sixteenths * 25.4 / 16) < 1e-8) return sixteenths + '/16';
    return spacingText(Number(mm.toFixed(6)), unit);
  }
  const distance = draft === null ? value : spacingInMm(draft, unit);
  const valid = Number.isFinite(distance) && distance >= min && distance <= max;
  return (
    <label className="flex flex-col items-center text-xs text-muted">
      <span className="inline-flex h-7 items-center gap-1 rounded-md border border-[#d8dfd2] bg-white px-1.5 focus-within:border-[#718b73]">
        <input aria-label={label + ' (' + unit + ')'} list={list} className="w-[8ch] bg-transparent text-center text-[13px] tabular-nums text-ink" aria-invalid={!valid} type="text" inputMode={unit === 'mm' ? 'decimal' : 'text'}
        value={draft ?? text(value)} onChange={event => {
          const raw = event.target.value;
          setDraft(raw);
          const mm = spacingInMm(raw, unit);
          if (mm >= min && mm <= max) onChange(mm);
        }} onBlur={() => setDraft(null)} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} />
        <span aria-hidden="true">{unit}</span>
      </span>
      {!valid && <span>Enter {text(min)}–{text(max)} {unit}.</span>}
    </label>
  );
}

function LetterHeightPanel({ paper, update }) {
  const unit = spacingUnit(paper);
  const lower = Number((paper.spacing * paper.lowercaseHeight / 100).toFixed(9));
  const upper = Number((paper.spacing - lower).toFixed(9));
  const limit = maxSpacing('handwriting');
  const minimum = minSpacing('handwriting');
  const two = paper.practiceRuling === 'two';
  const four = paper.practiceRuling === 'four';
  function setHeights(top, bottom) {
    const spacing = Number((top + bottom).toFixed(9));
    update({ spacing, lowercaseHeight: 100 * bottom / spacing });
  }
  const guides = [
    { name: two ? 'Tall letter top' : 'Top line', hidden: two, style: paper.topLineStyle, color: paper.topLineColor, value: upper,
      min: Math.max(0.1, minimum - lower), max: limit - lower, change: mm => setHeights(mm, lower) },
    { name: 'Midline', style: paper.midlineStyle, color: paper.midlineColor, value: lower,
      min: Math.max(0.1, minimum - upper), max: limit - upper, change: mm => setHeights(upper, mm) },
    { name: 'Baseline', color: paper.baselineColor, style: paper.baselineStyle },
  ];
  if (four) {
    Object.assign(guides[2], { value: paper.descenderDepth, min: 0.1, max: limit, change: descenderDepth => update({ descenderDepth }) });
    guides.push({ name: 'Bottom line', style: paper.bottomLineStyle, color: paper.bottomLineColor });
  }
  const matchesPreset = paper.lowercaseHeight === 50
    && (!four || paper.descenderDepth === paper.spacing / 2);
  return (
    <FieldPanel id="spacing" label="Letter height" summary={spacingLabel(paper)} width="20rem">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs text-muted">Top to baseline</span>
        <GuideDistance label="Total letter height" unit={unit} value={paper.spacing} min={minimum} max={limit}
          list="letter-height-options" onChange={spacing => update({ spacing })} />
        <datalist id="letter-height-options">{spacingOptions(paper).map(option =>
          <option key={option.value} value={spacingText(option.value, unit)} />)}</datalist>
        <div role="group" aria-label="Measurement unit" className="flex rounded-md bg-desk p-0.5">
          {['mm', 'in'].map(choice => <button key={choice} type="button" aria-pressed={choice === unit}
            onClick={() => update({ spacingUnit: choice })}
            className="min-h-7 rounded px-2 text-xs aria-pressed:bg-white aria-pressed:font-semibold aria-pressed:shadow-sm">{choice}</button>)}
        </div>
      </div>
      <div role="group" aria-label="Guide heights" className="rounded-lg bg-desk px-2 py-1.5">
        {guides.map((guide, i) => <div key={guide.name}>
          <div className="flex h-4 items-center gap-2">
            <span className="w-[5.2rem] shrink-0 text-xs text-muted">{guide.name}</span>
            {!guide.hidden && <span aria-hidden="true" className="grow border-t" style={{
              borderColor: guide.color ?? paper.color, borderTopStyle: guide.style ?? 'solid',
            }} />}
          </div>
          {guide.change && <div className="ml-[5.7rem] grid place-items-center"
            style={{ minHeight: Math.max(28, Math.min(44, 64 * guide.value / paper.spacing)) }}>
            <GuideDistance label={guide.name + ' to ' + guides[i + 1].name.toLowerCase()} unit={unit}
              value={guide.value} min={guide.min} max={guide.max} onChange={guide.change} />
          </div>}
        </div>)}
      </div>
      <fieldset className="mt-3">
        <legend className="mb-1.5 text-xs text-muted">Ruling size presets (in)</legend>
        <Choices options={classroomRulings.map(option => ({
          ...option, label: <>{option.inches}<span className="sr-only"> in</span></>,
        }))} columns="grid-cols-5" value={matchesPreset ? paper.spacing : null}
          onChange={spacing => update({ spacing, lowercaseHeight: 50, descenderDepth: spacing / 2 })} />
        <p className="mt-1.5 text-xs text-muted">Presets place the midline halfway between the top line and baseline.</p>
      </fieldset>
    </FieldPanel>
  );
}

function PaperField({ name, paper, update }) {
  const field = FIELDS[name];
  const spacingForm = useRef(null);
  const diameterForm = useRef(null);
  const label = name === 'spacing' ? PAPER_TYPES[paper.type].spacingLabel : field.label;
  const unit = spacingUnit(paper);
  const overrides = name === 'staffSpacing' ? paper.staves.filter(row => row.height !== null && row.lines > 1).length : 0;
  let options = name === 'spacing' ? spacingOptions(paper) : field.options;
  const showNotebookRulings = paper.type === 'lined' && name === 'spacing';
  if (showNotebookRulings) options = options.filter(option => !notebookRulings.some(ruling => ruling.value === option.value));
  let value = paper[name];
  if (name !== 'spacing' && field.min !== undefined && !options.some((option) => option.value === value)) {
    options = [...options, { value, label: value + (name === 'cueWidth' ? '%' : ' mm') }].sort(
      (a, b) => a.value - b.value,
    );
  }
  let columns;
  if (name === 'spacing') {
    columns = paper.type === 'graph' && unit === 'in'
      ? 'grid-cols-3 gap-2 max-[361px]:gap-1 max-sm:[&>button]:px-0.5'
      : 'grid-cols-[repeat(auto-fit,minmax(96px,1fr))] gap-2';
  }
  const selected = options.find(option => String(option.value) === String(value));
  return (
    <FieldPanel id={name} label={label} summary={name === 'spacing' ? spacingLabel(paper) + (paper.type === 'hex' ? (paper.hexMeasure === 'flats' ? ' across flats' : ' side') : '') : overrides ? selected.label + ' · ' + overrides + ' custom' : selected?.label ?? 'Custom'}
      onClose={() => {
        diameterForm.current?.reset();
        spacingForm.current?.reset();
        spacingForm.current?.elements.spacing.setCustomValidity('');
      }}>
      {close => (
        <>
          {overrides > 0 && <p className="mb-2 text-xs text-muted">{overrides} {overrides === 1 ? 'staff uses' : 'staves use'} a custom height. Choose Follow page in Edit staves to use this spacing.</p>}
          {paper.type === 'hex' && name === 'spacing' && <fieldset className="mb-3">
            <legend className="mb-1.5 text-xs text-muted">Use this size for</legend>
            <Choices columns="grid-cols-2" value={paper.hexMeasure}
              options={specialtyFields.hex.hexMeasure.options.map(option => ({
                ...option, label: <><HexDiagram orientation={paper.hexOrientation} measure={option.value} />{option.label}</>,
              }))} onChange={hexMeasure => update({ hexMeasure })} />
          </fieldset>}
          {paper.type === 'dot' && name === 'spacing' && <DotSpacingDiagram paper={paper} />}
          {name === 'spacing' && (
            <div role="group" aria-label="Spacing unit" className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-desk p-1">
              {['mm', 'in'].map(choice => (
                <button key={choice} type="button" aria-pressed={choice === unit} onClick={() => update({ spacingUnit: choice })}
                  className="min-h-8 rounded-md text-[13px] text-muted aria-pressed:bg-white aria-pressed:font-semibold aria-pressed:text-ink aria-pressed:shadow-sm">
                  {choice}
                </button>
              ))}
            </div>
          )}
          {showNotebookRulings && (
            <fieldset className="mb-3">
              <legend className="mb-1.5 text-xs text-muted">Notebook ruling</legend>
              <Choices columns="grid-cols-3 gap-1.5" value={value}
                options={notebookRulings.map(ruling => ({
                  ...ruling,
                  detail: unit === 'mm' ? Number(ruling.value.toFixed(2)) + ' mm' : ruling.inches + ' in',
                }))}
                onChange={spacing => { update({ spacing }); close(); }} />
            </fieldset>
          )}
          <Choices options={name === 'isoOrientation' ? options.map(option => ({
            ...option, label: <><IsometricOrientationDiagram orientation={option.value} dots={paper.isoStyle === 'dots'} />{option.label} grid</>,
          })) : name === 'hexOrientation' ? options.map(option => ({
            ...option, label: <><HexDiagram orientation={option.value} />{option.label}</>,
          })) : options} value={value} columns={columns}
            onChange={next => {
              update({ [name]: field.type === 'boolean' ? next === 'true' : next });
              close();
            }} />
          {paper.type === 'dot' && name === 'dotSize' && (
            <form key={value} ref={diameterForm} className="mt-3 border-t border-[#edf0e7] pt-3"
              onSubmit={event => {
                event.preventDefault();
                update({ dotSize: event.currentTarget.elements.diameter.valueAsNumber });
                close();
              }}>
              <label htmlFor="custom-diameter" className="mb-1.5 block text-xs text-muted">Custom diameter ({field.min}–{field.max} mm)</label>
              <div className="flex items-center gap-2">
                <input id="custom-diameter" name="diameter" className={inputStyle} type="number" inputMode="decimal"
                  min={field.min} max={field.max} step="any" required defaultValue={value} />
                <button type="submit" className="min-h-9 rounded-lg bg-[#36482e] px-3 text-[13px] font-medium text-white">Apply</button>
              </div>
            </form>
          )}
          {name === 'spacing' && (
            <form key={unit + value} ref={spacingForm} className="mt-3 border-t border-[#edf0e7] pt-3"
              onSubmit={event => {
                event.preventDefault();
                const input = event.currentTarget.elements.spacing;
                const mm = input.value === spacingText(value, unit) ? value : spacingInMm(input.value, unit);
                if (!Number.isFinite(mm) || mm < minSpacing(paper.type) || mm > maxSpacing(paper.type)) {
                  const minInches = spacingText(minSpacing(paper.type), 'in');
                  input.setCustomValidity(`Enter a fraction or decimal from ${minInches} to ${spacingText(maxSpacing(paper.type), 'in')} in.`);
                  input.reportValidity();
                  return;
                }
                update({ spacing: mm });
                close();
              }}>
              <label htmlFor="custom-spacing" className="mb-1.5 block text-xs text-muted">{paper.type === 'hex' ? (paper.hexMeasure === 'flats' ? 'Custom flat-to-flat distance' : 'Custom side length') : 'Custom spacing'} ({unit})</label>
              <div className="flex items-center gap-2">
                <input id="custom-spacing" name="spacing" className={inputStyle} type={unit === 'mm' ? 'number' : 'text'} inputMode={unit === 'mm' ? 'decimal' : 'text'}
                  min={unit === 'mm' ? minSpacing(paper.type) : undefined} max={unit === 'mm' ? maxSpacing(paper.type) : undefined} step={unit === 'mm' ? 'any' : undefined}
                  required defaultValue={spacingText(value, unit)} onInput={event => event.currentTarget.setCustomValidity('')} />
                <button type="submit" className="min-h-9 rounded-lg bg-[#36482e] px-3 text-[13px] font-medium text-white">Apply</button>
              </div>
            </form>
          )}
          {fieldHints[name] && <p className="mt-3 text-xs leading-relaxed text-muted">{fieldHints[name]}</p>}
        </>
      )}
    </FieldPanel>
  );
}

function BoldGuides({ paper, update }) {
  const form = useRef(null);
  const unit = spacingUnit(paper);
  const cells = (unit === 'in' ? 25.4 : 10) / paper.spacing;
  const nearest = Math.round(cells);
  const wholeUnit = paper.type === 'graph' && Math.abs(cells - nearest) < 1e-7 ? nearest : 0;
  const options = [...FIELDS.majorEvery.options];
  if (wholeUnit && !options.some(option => option.value === wholeUnit)) {
    options.push({ value: wholeUnit, label: guideLabel(wholeUnit) });
  }
  return (
    <FieldPanel id="majorEvery" label={FIELDS.majorEvery.label} summary={guideLabel(paper.majorEvery)} onClose={() => form.current?.reset()}>
      {close => (
        <>
          <Choices options={options} value={paper.majorEvery} columns="grid-cols-2 gap-2"
            onChange={majorEvery => { update({ majorEvery }); close(); }} />
          <form ref={form} key={paper.majorEvery} className="mt-3 border-t border-[#edf0e7] pt-3"
            onSubmit={event => {
              event.preventDefault();
              update({ majorEvery: event.currentTarget.elements.interval.valueAsNumber });
              close();
            }}>
            <label htmlFor="guide-interval" className="mb-1.5 block text-xs text-muted">Custom interval (squares)</label>
            <div className="flex items-center gap-2">
              <input id="guide-interval" name="interval" type="number" inputMode="numeric" min="1" max={Number.MAX_SAFE_INTEGER}
                step="1" required defaultValue={paper.majorEvery || ''} placeholder="e.g. 8" className={inputStyle} />
              <button type="submit" className="min-h-9 rounded-lg bg-[#36482e] px-3 text-[13px] font-medium text-white">Apply</button>
            </div>
          </form>
        </>
      )}
    </FieldPanel>
  );
}

const fieldHints = {
  hexLabels: 'Identify each cell by column and row, starting at 01-01 in the upper left.',
  cueWidth: 'Percentage of the writing area reserved for cues.',
  staffCount: 'Available counts depend on page size, margins, and staff line spacing.',
};
const sizeSystems = ['ISO', 'US', 'Custom'];
const orientations = [{ value: 'portrait', label: 'Portrait' }, { value: 'landscape', label: 'Landscape' }];

function Choices({ options, value, onChange, columns = 'grid-cols-[repeat(auto-fit,minmax(78px,1fr))]' }) {
  return (
    <div className={`grid gap-1.5 ${columns}`}>
      {options.map(option => (
        <button key={option.value} type="button" data-detailed={option.detail ? true : undefined} aria-pressed={String(option.value) === String(value)}
          onClick={() => onChange(option.value)}
          className="min-h-9 rounded-lg border border-[#dfe5d7] px-2 py-1.5 text-[13px] data-[detailed]:py-2 hover:bg-desk aria-pressed:border-[#899f7e] aria-pressed:bg-[#edf3e8] aria-pressed:font-semibold">
          {option.label}
          {option.detail && <span className="mt-0.5 block text-xs font-normal text-muted">{option.detail}</span>}
        </button>
      ))}
    </div>
  );
}

function FieldPanel({ id, label, summary, children, onClose, wide = false, summaryOnly = false, width, moreOptions }) {
  const panel = useRef(null);
  const moreButton = useRef(null);
  const backButton = useRef(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const hasMore = Boolean(moreOptions);
  const expanded = moreOpen && hasMore;
  useEffect(() => {
    if (expanded) backButton.current?.focus({ preventScroll: true });
    else if (!hasMore && moreOpen) setMoreOpen(false);
  }, [expanded, hasMore, moreOpen]);
  function back() {
    setMoreOpen(false);
    requestAnimationFrame(() => moreButton.current?.focus({ preventScroll: true }));
  }
  function open(event) {
    const trigger = event.currentTarget;
    const parent = trigger.closest('dialog');
    const anchor = parent && !trigger.closest('[data-side-panel]') && document.querySelector('[aria-controls="' + parent.id + '"]');
    const bounds = (anchor || trigger).getBoundingClientRect();
    const style = panel.current.style;
    style.setProperty('--anchor-x', bounds.left + bounds.width / 2 + 'px');
    style.setProperty('--space-below', Math.max(0, document.documentElement.clientHeight - bounds.top + 10 - 12) + 'px');
    panel.current.showModal();
    panel.current.scrollTop = 0;
  }
  const close = () => panel.current.close();
  const card = 'min-w-0 rounded-2xl border border-[#dfe5d7] bg-white p-4 shadow-[0_20px_65px_#27381e16,0_3px_10px_#27381e07]';
  return (
    <>
      <button id={'dock-' + id} type="button" onClick={open} aria-haspopup="dialog" aria-controls={'panel-' + id}
        className={summaryOnly
          ? 'ml-auto flex min-h-9 items-center rounded-lg px-2.5 hover:bg-desk'
          : 'flex min-w-0 flex-col items-start gap-1 rounded-lg px-3 py-2 text-left hover:bg-desk max-sm:px-1.5'}>
        <span className={summaryOnly ? 'sr-only' : 'text-xs text-muted'}>{label}</span>
        <span className="flex items-center gap-1.5 text-[13px] font-semibold">
          {summary}<Chevron />
        </span>
      </button>
      <dialog id={'panel-' + id} ref={panel} aria-labelledby={(expanded ? 'more-title-' : 'title-') + id}
        onClose={event => {
          if (event.target !== event.currentTarget) return;
          setMoreOpen(false);
          onClose?.(event);
        }}
        onCancel={event => {
          if (event.target === event.currentTarget && expanded) {
            event.preventDefault();
            back();
          }
        }}
        onClick={event => { if (event.target === event.currentTarget) close(); }}
        style={{ '--panel-width': width ?? (wide || ['spacing', 'majorEvery'].includes(id) ? '24rem' : '18rem') }}
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none flex-col overflow-y-auto overscroll-contain border-0 bg-transparent py-3 shadow-none [scrollbar-width:none] open:flex backdrop:bg-transparent sm:after:flex-[0_1_var(--space-below)] sm:after:content-[''] max-sm:pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className={`mt-auto flex shrink-0 items-end gap-2 ml-[clamp(12px,calc(var(--anchor-x)-var(--panel-width)/2),calc(100%-var(--group-width)-12px))] w-(--group-width) max-w-[calc(100%-24px)] [--group-width:var(--panel-width)] max-sm:mx-auto max-sm:w-[calc(100%-24px)] max-sm:max-w-sm ${expanded ? 'min-[46rem]:[--group-width:calc(2*var(--panel-width)+0.5rem)]' : ''}`}>
          <div className={`${card} flex-1 max-[361px]:in-[#panel-spacing]:px-2 ${expanded ? 'max-[46rem]:hidden' : ''}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id={'title-' + id} className="text-base font-semibold">{label}</h2>
              <button type="button" aria-label={'Close ' + label} onClick={close}
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-desk">
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-4"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
            {typeof children === 'function' ? children(close) : children}
            {hasMore && <button ref={moreButton} type="button" aria-expanded={expanded} aria-controls={'more-' + id}
              onClick={() => expanded ? back() : setMoreOpen(true)}
              className="mt-3 flex min-h-9 w-full items-center justify-between rounded-lg px-2 text-[13px] font-semibold hover:bg-desk aria-expanded:bg-desk">
              More options <span className="-rotate-90"><Chevron /></span>
            </button>}
          </div>
          {hasMore && <section id={'more-' + id} data-side-panel="" aria-labelledby={'more-title-' + id}
            hidden={!expanded} className={card + ' flex-1'}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 id={'more-title-' + id} className="text-base font-semibold">{label} options</h3>
              <button type="button" ref={backButton} onClick={back} aria-label={'Back to ' + label}
                className="min-h-8 rounded-lg px-2 text-[13px] text-muted hover:bg-desk">
                <span aria-hidden="true">← </span>Back
              </button>
            </div>
            {moreOptions}
          </section>}
        </div>
      </dialog>
    </>
  );
}

function Range({ id, label, value, min, max, step, onChange, unit = 'mm' }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 flex justify-between text-[13px] text-muted">
        {label}<output className="text-ink tabular-nums">{value} {unit}</output>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value}
        onChange={event => onChange(Number(event.target.value))} />
    </div>
  );
}

const inputStyle = 'h-9 w-full min-w-0 rounded-lg border border-[#d8dfd2] bg-white px-2.5 text-[14px] text-ink';
const inputLabel = 'flex min-w-0 flex-col gap-1.5 text-xs text-muted';

function LayoutNumber({ label, value, max, onChange, min = 0, step = 'any' }) {
  return (
    <label className={inputLabel}>{label}
      <input key={value} className={inputStyle} type="number" min={min} max={max} step={step} required defaultValue={value}
        onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }}
        onBlur={event => {
          const input = event.currentTarget;
          if (input.validity.valid) onChange(input.valueAsNumber);
          else { input.reportValidity(); input.value = String(value); }
        }} />
    </label>
  );
}

function CoordinateQuadrants({ paper, update }) {
  const options = FIELDS.quadrants.options;
  const current = options.find(option => option.value === paper.quadrants);
  return (
    <FieldPanel id="quadrants" label="Quadrants" summary={current?.label ?? 'Custom'}>
      {close => <div className="grid grid-cols-2 gap-1.5">
        {options.map(option => (
          <button key={option.value} type="button" aria-pressed={option.value === paper.quadrants}
            className={`rounded-lg border border-[#dfe5d7] px-2 py-2 text-[13px] hover:bg-desk aria-pressed:border-[#899f7e] aria-pressed:bg-[#edf3e8] aria-pressed:font-semibold ${option.value === 'four' ? 'col-span-2' : ''}`}
            onClick={() => {
              const x = Math.max(Math.abs(paper.xMin), Math.abs(paper.axisRange));
              const y = Math.max(Math.abs(paper.yMin), Math.abs(paper.yRange));
              update(quadrantBounds(option.value, x, y));
              close();
            }}>
            {option.label}
            {option.x !== 0 && <span className="mt-0.5 block text-xs font-normal text-muted">
              {option.x > 0 ? '+x' : '−x'}, {option.y > 0 ? '+y' : '−y'}
            </span>}
          </button>
        ))}
      </div>}
    </FieldPanel>
  );
}

function CoordinateRange({ paper, update }) {
  const form = useRef(null);
  const xExtent = Math.max(Math.abs(paper.xMin), Math.abs(paper.axisRange));
  const yExtent = Math.max(Math.abs(paper.yMin), Math.abs(paper.yRange));
  const equal = paper.xMin === paper.yMin && paper.axisRange === paper.yRange;
  const summary = equal ? coordinateRangeLabel(paper) : `x ${paper.xMin}…${paper.axisRange} · y ${paper.yMin}…${paper.yRange}`;
  function apply(event, close) {
    event.preventDefault();
    const inputs = event.currentTarget.elements;
    for (const [min, max] of [['xMin', 'axisRange'], ['yMin', 'yRange']]) {
      if (inputs[min].valueAsNumber >= inputs[max].valueAsNumber) {
        inputs[max].setCustomValidity('Maximum must be greater than minimum.');
        inputs[max].reportValidity();
        return;
      }
    }
    update(Object.fromEntries(['xMin', 'axisRange', 'yMin', 'yRange'].map(key => [key, inputs[key].valueAsNumber])));
    close();
  }
  return (
    <FieldPanel id="axisRange" label="Axis range" summary={summary} onClose={() => form.current?.reset()}>
      {close => <>
        <fieldset>
          <legend className="mb-2 text-xs text-muted">Extent from zero on both axes</legend>
          <Choices columns="grid-cols-3" options={FIELDS.axisRange.options.map(({ value }) => ({
            value, label: value + ' units',
          }))} value={xExtent === yExtent && paper.quadrants !== 'custom' ? xExtent : null}
            onChange={max => { update(quadrantBounds(paper.quadrants, max, max)); close(); }} />
        </fieldset>
        <form key={summary} ref={form} className="mt-3 border-t border-[#edf0e7] pt-3"
          onSubmit={event => apply(event, close)}
          onInput={event => {
            event.currentTarget.elements.axisRange.setCustomValidity('');
            event.currentTarget.elements.yRange.setCustomValidity('');
          }} onReset={event => {
            event.currentTarget.elements.axisRange.setCustomValidity('');
            event.currentTarget.elements.yRange.setCustomValidity('');
          }}>
          <div className="grid grid-cols-2 gap-2">
            {[['xMin', 'X minimum'], ['axisRange', 'X maximum'], ['yMin', 'Y minimum'], ['yRange', 'Y maximum']].map(([key, label]) =>
              <label key={key} className={inputLabel}>{label}
                <input className={inputStyle} name={key} type="number" min={-MAX_AXIS_RANGE} max={MAX_AXIS_RANGE}
                  step={1} required defaultValue={paper[key]} />
              </label>)}
          </div>
          <button className="mt-3 min-h-9 w-full rounded-lg bg-[#36482e] text-[13px] font-medium text-white" type="submit">Apply range</button>
        </form>
      </>}
    </FieldPanel>
  );
}

function CoordinateNumbers({ paper, update }) {
  const intervalLabel = n => n ? 'Every ' + n : 'Auto';
  return (
    <FieldPanel id="showNumbers" label="Axis numbers" summary={paper.showNumbers ? intervalLabel(paper.labelEvery) : 'Hidden'}>
      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" checked={paper.showNumbers} onChange={event => update({ showNumbers: event.target.checked })} />
        Show numbers on the axes
      </label>
      {paper.showNumbers && <fieldset className="mt-3">
        <legend className="mb-2 text-xs text-muted">Numbering interval (units)</legend>
        <Choices columns="grid-cols-3" options={numberIntervals.map(value => ({ value, label: intervalLabel(value) }))}
          value={paper.labelEvery} onChange={labelEvery => update({ labelEvery })} />
      </fieldset>}
    </FieldPanel>
  );
}

function PracticeRuling({ paper, update }) {
  const choices = [
    { value: 'two', label: 'Two-line' },
    { value: 'three', label: 'Three-line' },
    { value: 'four', label: 'Four-line' },
  ];
  const summary = choices.find(choice => choice.value === paper.practiceRuling).label;
  return (
    <FieldPanel id="practiceRuling" label="Ruling" summary={summary} wide>
      {close => <div className="grid grid-cols-3 gap-2">
        {choices.map(({ value, label }) => (
          <button key={value} type="button" aria-pressed={paper.practiceRuling === value}
            onClick={() => {
              if (paper.practiceRuling !== value) {
                update({ practiceRuling: value });
              }
              close();
            }}
            className="rounded-lg border border-[#dfe5d7] px-2 py-2 text-[13px] hover:bg-desk aria-pressed:border-[#899f7e] aria-pressed:bg-[#edf3e8] aria-pressed:font-semibold">
            <svg viewBox="0 0 122 52" aria-hidden="true" className="mb-1.5 w-full rounded bg-white">
              {value !== 'two' && <path d="M5 9h112" stroke="#84a2c6" />}
              <path d="M5 21h112" stroke="#84a2c6" strokeDasharray={value !== 'two' ? '4 3' : undefined} />
              <path d="M5 33h112" stroke="#c56b72" />
              {value === 'four' && <path d="M5 45h112" stroke="#84a2c6" />}
              <g fill="none" stroke="#3c4541" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M38 22c-7-4-13 2-11 8 2 6 10 2 11-3m0-6v12" />
                <path d="M54 9v24m0-6c2-8 13-8 12-1-1 7-9 9-12 5" />
                <path d="M88 22c-8-4-14 3-11 9 3 5 11 1 11-5m0-5v15c0 8-8 10-12 6" />
              </g>
            </svg>
            {label}
          </button>
        ))}
      </div>}
    </FieldPanel>
  );
}

function GuideStroke({ guide, label, paper, update, palette }) {
  const styleKey = guide + 'Style';
  const colorKey = guide + 'Color';
  const color = paper[colorKey] ?? paper.color;
  return (
    <div role="group" aria-label={label + ' style'} className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-1 max-[360px]:grid-cols-[minmax(0,1fr)_auto]">
      <span className="text-xs text-muted max-[360px]:col-span-2">{label}</span>
      <Choices columns="grid-cols-3" options={rulingStyles} value={paper[styleKey]} onChange={value => update({ [styleKey]: value })} />
      <FieldPanel id={guide + '-color'} label={label + ' color'} summaryOnly wide
        summary={<span aria-hidden="true" className="size-4 rounded-full ring-1 ring-black/15" style={{ backgroundColor: color }} />}>
        <ColorPalette color={color} onChange={value => update({ [colorKey]: value })} presets={INKS} palette={palette} />
        {guide !== 'baseline' && paper[colorKey] && <button type="button" className="mt-2 text-xs underline"
          onClick={() => update({ [colorKey]: null })}>Use toolbar line color</button>}
      </FieldPanel>
    </div>
  );
}

function PracticeGuides({ paper, update, palette, layout }) {
  const unit = spacingUnit(paper);
  const lines = [
    ['topLine', 'Top line', paper.practiceRuling !== 'two'],
    ['midline', 'Midline', true],
    ['baseline', 'Baseline', true],
    ['bottomLine', 'Bottom line', paper.practiceRuling === 'four'],
  ];
  return (
    <FieldPanel id="midlineStyle" label="Writing guides" summary={rulingStyles.find(style => style.value === paper.midlineStyle).label + ' midline'} wide>
      <div className="grid gap-1.5">
        {lines.filter(([, , visible]) => visible).map(([guide, label]) =>
          <GuideStroke key={guide} guide={guide} label={label} paper={paper} update={update} palette={palette} />)}
      </div>
      <div className="mt-2 border-t border-[#e9ede4] pt-2">
        <label className="flex min-h-9 items-center gap-2 text-[13px]">
          <input type="checkbox" checked={paper.highlightLowercase}
            onChange={event => update({ highlightLowercase: event.target.checked })} />
          Highlight lowercase writing area
        </label>
        {paper.highlightLowercase && <ColorPanel id="highlight-color" label="Highlight color" color={paper.highlightColor} inline
          onChange={highlightColor => update({ highlightColor })} presets={backgroundPresets} palette={palette} />}
      </div>
      <div className="mt-2 border-t border-[#e9ede4] pt-2">
        <label className="flex min-h-9 items-center gap-2 text-[13px]">
          <input type="checkbox" checked={paper.letterBoxes}
            onChange={event => update({ letterBoxes: event.target.checked })} />
          Letter boxes
        </label>
        {paper.letterBoxes && <GuideStroke guide="boxLine" label="Box line" paper={paper} update={update} palette={palette} />}
        {paper.letterBoxes && <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-muted">Box width</span>
          {layout.autoWidth ? <span className="text-xs text-muted">Auto · {Number((unit === 'in' ? layout.boxWidth / 25.4 : layout.boxWidth).toFixed(3))} {unit}</span> :
            <GuideDistance label="Box width" value={paper.boxWidth} unit={unit}
            min={LETTER_BOX_WIDTH.min} max={LETTER_BOX_WIDTH.max} onChange={boxWidth => update({ boxWidth })} />}
        </div>}
        {paper.letterBoxes && <label className="flex min-h-9 items-center gap-2 text-[13px]">
          <input type="checkbox" checked={paper.boxSpacers} onChange={event => update({ boxSpacers: event.target.checked })} />
          Add narrow spaces between letters
        </label>}
        {paper.letterBoxes && paper.boxSpacers && <div className="flex items-center justify-between gap-2">
          <div className="grid justify-items-start gap-1 text-xs text-muted">
            <span>Spacer width</span>
            {paper.spacerWidth == null ? <span>Auto · ⅕ of box width</span> :
              <button type="button" className="underline hover:text-ink" onClick={() => update({ spacerWidth: null })}>Reset to ⅕</button>}
          </div>
          <GuideDistance label="Spacer width" value={layout.spacer} unit={spacingUnit(paper)}
            min={SPACER_WIDTH.min} max={SPACER_WIDTH.max} onChange={spacerWidth => update({ spacerWidth })} />
        </div>}
      </div>
    </FieldPanel>
  );
}

function NotebookLayout({ paper, update }) {
  const lastLimit = useRef(10);
  return (
    <FieldPanel id="notebook" label="Notebook layout" summary={paper.headingSpace ? paper.headingSpace + ' mm heading' : 'No heading'}>
      <fieldset>
        <legend className="mb-2 text-xs text-muted">Apply a page preset</legend>
        <div className="grid grid-cols-3 gap-1.5">
          {notebookRulings.map(ruling => (
            <button type="button" key={ruling.inches} aria-label={ruling.label}
              className="min-h-9 rounded-lg border border-[#dfe5d7] px-2 text-[13px] hover:bg-desk"
              onClick={() => update({ ...NOTEBOOK_LAYOUT, spacing: ruling.value })}>{ruling.label.replace(/ ruled$/, '')}</button>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-4"><legend className="mb-2 text-xs text-muted">Horizontal line style</legend>
        <Choices options={rulingStyles} columns="grid-cols-3" value={paper.rulingStyle} onChange={rulingStyle => update({ rulingStyle })} />
      </fieldset>
      <div className="mt-4 border-t border-[#edf0e7] pt-3">
        <Range id="heading-space" label="Heading space" value={paper.headingSpace} min={0}
          max={Math.min(50, Math.floor(getDimensions(paper).height - paper.marginTop - paper.marginBottom - 2))} step={1}
          onChange={headingSpace => update({ headingSpace })} />
        <p className="mt-1 text-xs text-muted">Extra space above the first ruled line, inside the page margins.</p>
      </div>
      <fieldset className="mt-3">
        <legend className="mb-2 text-xs text-muted">Writing lines</legend>
        <Choices columns="grid-cols-2" options={[{ value: 'fill', label: 'Fill page' }, { value: 'limit', label: 'Limit lines' }]}
          value={paper.maxLines ? 'limit' : 'fill'} onChange={mode => {
            if (paper.maxLines) lastLimit.current = paper.maxLines;
            update({ maxLines: mode === 'fill' ? 0 : lastLimit.current });
          }} />
        {paper.maxLines > 0 && <div className="mt-2">
          <LayoutNumber label="Maximum lines" value={paper.maxLines} min={1} step={1} max={500}
            onChange={maxLines => update({ maxLines })} />
        </div>}
      </fieldset>
    </FieldPanel>
  );
}

function MarginLine({ side, distance, max, onDistance, color, onColor, palette }) {
  const [draft, setDraft] = useState(null);
  const lastDistance = useRef(NOTEBOOK_LAYOUT.ruleMargin);
  const label = side + ' margin line';
  return (
    <div className="border-b border-[#edf0e7] py-3 first:pt-0 last:border-0 last:pb-0">
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" className="accent-[#657d5b]" checked={distance > 0} disabled={!distance && max <= 0}
          onChange={event => {
            if (distance) lastDistance.current = distance;
            setDraft(null);
            onDistance(event.target.checked ? Math.min(max, lastDistance.current) : 0);
          }} />
        {label}
      </label>
      {(distance > 0 || draft !== null) && <div className="mt-2 grid gap-1">
        <label className="flex items-center justify-between gap-2 text-xs text-muted">
          From {side.toLowerCase()} end of ruling (mm)
          <input className={inputStyle + ' max-w-20'} type="number" inputMode="decimal" min="0" max={max} step="any"
            value={draft ?? distance} onChange={event => {
              const input = event.currentTarget;
              setDraft(input.value);
              if (input.validity.valid && Number.isFinite(input.valueAsNumber)) {
                if (distance > 0) lastDistance.current = distance;
                onDistance(input.valueAsNumber);
              }
            }}
            onBlur={() => setDraft(null)} />
        </label>
        <ColorPanel id={side.toLowerCase() + '-margin-color'} label={label + ' color'} color={color} inline
          onChange={onColor} presets={INKS} palette={palette} />
      </div>}
    </div>
  );
}

function MarginLines({ paper, update, palette }) {
  const width = getDimensions(paper).width - paper.marginLeft - paper.marginRight;
  const summary = paper.ruleMargin && paper.rightGuide ? 'Both sides' : paper.ruleMargin ? 'Left' : paper.rightGuide ? 'Right' : 'None';
  return (
    <FieldPanel id="ruleMargin" label="Margin lines" summary={summary}>
      <MarginLine side="Left" distance={paper.ruleMargin} max={Math.min(60, Math.floor(width - paper.rightGuide - 2))}
        onDistance={ruleMargin => update({ ruleMargin })} color={paper.marginColor}
        onColor={marginColor => update({ marginColor })} palette={palette} />
      <MarginLine side="Right" distance={paper.rightGuide} max={Math.min(60, Math.floor(width - paper.ruleMargin - 2))}
        onDistance={rightGuide => update({ rightGuide })} color={paper.rightMarginColor}
        onColor={rightMarginColor => update({ rightMarginColor })} palette={palette} />
    </FieldPanel>
  );
}

const weightPresets = [
  { label: 'Fine', value: 0.25 },
  { label: 'Standard', value: LINE_THICKNESS_PT.default },
  { label: 'Heavy', value: 1.5 },
];

function LineWeight({ value, update, label = 'Line thickness' }) {
  const form = useRef(null);
  return (
    <FieldPanel id="weight" label={label} summary={Number(value.toFixed(4)) + ' pt'} onClose={() => form.current?.reset()}>
      {close => (
        <>
          <div className="grid grid-cols-3 gap-1.5">
            {weightPresets.map(preset => (
              <button key={preset.value} type="button" aria-pressed={value === preset.value}
                onClick={() => { update({ lineWeightPt: preset.value }); close(); }}
                className="grid justify-items-center gap-1 rounded-lg border border-[#dfe5d7] px-1 py-2 text-[13px] hover:bg-desk aria-pressed:border-[#899f7e] aria-pressed:bg-[#edf3e8] aria-pressed:font-semibold">
                <span aria-hidden="true" className="my-1 w-9 self-center rounded-full bg-current" style={{ height: preset.value * 3 }} />
                {preset.label}
                <span className="text-xs font-normal text-muted">{preset.value} pt</span>
              </button>
            ))}
          </div>
          <form key={value} ref={form} className="mt-3 border-t border-[#edf0e7] pt-3"
            onSubmit={event => {
              event.preventDefault();
              update({ lineWeightPt: event.currentTarget.elements.weight.valueAsNumber });
              close();
            }}>
            <label htmlFor="custom-weight" className="mb-1.5 block text-xs text-muted">Custom thickness ({LINE_THICKNESS_PT.min}–{LINE_THICKNESS_PT.max} pt)</label>
            <div className="flex items-center gap-2">
              <input id="custom-weight" name="weight" className={inputStyle} type="number" inputMode="decimal"
                min={LINE_THICKNESS_PT.min} max={LINE_THICKNESS_PT.max} step="any" required defaultValue={value} />
              <button type="submit" className="min-h-9 rounded-lg bg-[#36482e] px-3 text-[13px] font-medium text-white">Apply</button>
            </div>
          </form>
          <input id="weight-input" type="range" className="mt-2" aria-label={label + ' in points'} aria-valuetext={value + ' pt'}
            min={LINE_THICKNESS_PT.min} max={LINE_THICKNESS_PT.max} step={0.01} value={value} onChange={event => update({ lineWeightPt: event.currentTarget.valueAsNumber })} />
        </>
      )}
    </FieldPanel>
  );
}

function CustomDimensions({ dimensions, update, unit, setUnit }) {
  const factor = unit === 'in' ? 25.4 : 1;
  const display = mm => Number((mm / factor).toFixed(6));
  const [width, setWidth] = useState(() => String(display(dimensions.width)));
  const [height, setHeight] = useState(() => String(display(dimensions.height)));
  const inMm = value => Number((Number(value) * factor).toFixed(4));
  const w = inMm(width), h = inMm(height);
  const valid = [w, h].every(n => n >= CUSTOM_MIN_MM && n <= CUSTOM_MAX_MM);
  function changeUnit(next) {
    const divisor = next === 'in' ? 25.4 : 1;
    const convert = value => value === '' ? '' : String(Number((inMm(value) / divisor).toFixed(6)));
    setWidth(convert(width));
    setHeight(convert(height));
    setUnit(next);
  }
  return (
    <form className="space-y-2.5" onSubmit={event => {
      event.preventDefault();
      if (valid) update({ size: 'custom', customWidth: Math.min(w, h), customHeight: Math.max(w, h),
        orientation: w > h ? 'landscape' : 'portrait' });
    }}>
      <div className="grid grid-cols-[1fr_1fr_60px] gap-2">
        <label className={inputLabel}>Width<input className={inputStyle} required type="number" step="any" value={width} onChange={e => setWidth(e.target.value)} /></label>
        <label className={inputLabel}>Height<input className={inputStyle} required type="number" step="any" value={height} onChange={e => setHeight(e.target.value)} /></label>
        <label className={inputLabel}>Unit<select className={inputStyle} value={unit} onChange={e => changeUnit(e.target.value)}><option>mm</option><option>in</option></select></label>
      </div>
      {!valid && <p role="status" className="text-xs text-muted">Each side must be between {CUSTOM_MIN_MM} and {CUSTOM_MAX_MM} mm.</p>}
      <button type="submit" disabled={!valid || (w === dimensions.width && h === dimensions.height)} className="min-h-8 rounded-lg bg-[#36482e] px-3 text-xs font-medium text-white disabled:cursor-default disabled:opacity-50">Apply size</button>
    </form>
  );
}

function PaperSizePicker({ paper, update }) {
  const [unit, setUnit] = useState('mm');
  const system = PAPER_SIZES[paper.size]?.system ?? 'Custom';
  const dimensions = getDimensions(paper);
  function switchSystem(next) {
    if (next === system) return;
    if (next === 'Custom') {
      update({ size: 'custom', customWidth: Math.min(dimensions.width, dimensions.height), customHeight: Math.max(dimensions.width, dimensions.height) });
    } else {
      update({ size: next === 'ISO' ? 'a4' : 'letter' });
    }
  }
  return (
    <fieldset className="space-y-2.5">
      <legend className="mb-2 text-[13px] text-muted">Paper size</legend>
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-desk p-1">
        {sizeSystems.map((label) => <button key={label} type="button" aria-pressed={label === system} onClick={() => switchSystem(label)}
          className="min-h-8 rounded-md text-[13px] text-muted aria-pressed:bg-white aria-pressed:font-semibold aria-pressed:text-ink aria-pressed:shadow-sm">{label}</button>)}
      </div>
      {system === 'Custom' ? (
        <CustomDimensions key={dimensions.width + 'x' + dimensions.height} dimensions={dimensions} update={update} unit={unit} setUnit={setUnit} />
      ) : (
        <div>
          <Choices
            columns="grid-cols-2"
            options={Object.entries(PAPER_SIZES)
              .filter(([, size]) => size.system === system)
              .map(([value, size]) => ({ value, label: size.label }))}
            value={paper.size}
            onChange={size => update({ size })}
          />
          <p className="mt-1.5 text-xs text-muted tabular-nums">{system === 'ISO'
            ? dimensions.width + ' × ' + dimensions.height + ' mm'
            : Number((dimensions.width / 25.4).toFixed(2)) + ' × ' + Number((dimensions.height / 25.4).toFixed(2)) + ' in'}</p>
        </div>
      )}
    </fieldset>
  );
}

const backgroundPresets = [
  { name: 'White', value: '#ffffff' }, { name: 'Ivory', value: '#fffdf0' },
  { name: 'Cream', value: '#fff2d8' }, { name: 'Sand', value: '#f2e5cf' },
  { name: 'Gray', value: '#f1f2f3' }, { name: 'Blue', value: '#e9f2fb' },
  { name: 'Mint', value: '#eaf4ed' }, { name: 'Blush', value: '#fbecee' },
  { name: 'Lavender', value: '#f1edf9' },
];

function ColorPanel({ id, label, color, onChange, presets, palette, inline, summaryOnly, description, swatchOnly = false }) {
  const summary = color ? <><span title={color.toUpperCase()} className={`${swatchOnly ? 'size-4' : 'size-3'} shrink-0 rounded-full ring-1 ring-black/10`} style={{ backgroundColor: color }} /><span className={swatchOnly ? 'sr-only' : undefined}>{color.toUpperCase()}</span></> : 'Choose color';
  const panel = (
    <FieldPanel id={id} label={label} summary={summary} summaryOnly={inline || summaryOnly || swatchOnly} wide>
      {description && <p className="mb-3 text-[13px] text-muted">{description}</p>}
      <ColorPalette color={color} onChange={onChange} presets={presets} palette={palette} />
    </FieldPanel>
  );
  if (!inline) return panel;
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted">{label}</span>
      {panel}
    </div>
  );
}

function SpecialtySetting({ name, paper, update }) {
  const field = specialtyFields[paper.type][name];
  const value = paper[name];
  const change = next => update({ [name]: next });
  if (field.options) return (
    <fieldset>
      <legend className="mb-1.5 text-xs text-muted">{field.label}</legend>
      <Choices options={field.options} value={value} onChange={change}
        columns={field.options.length >= 9 ? 'grid-cols-3' : 'grid-cols-2'} />
    </fieldset>
  );
  if (typeof field.initial === 'boolean') return (
    <label className="flex min-h-8 items-center gap-2 text-[13px]">
      <input type="checkbox" className="accent-[#647c5c]" checked={value} onChange={event => change(event.target.checked)} />
      {field.label}
    </label>
  );
  return <LiveNumber label={field.label} value={value} min={field.min} max={field.max} step={field.step} onChange={change} />;
}

function LiveNumber({ label, value, min, max, step = 'any', onChange }) {
  const [draft, setDraft] = useState(null);
  return <label className={inputLabel}>{label}
    <input className={inputStyle} type="number" required min={min} max={max} step={step} value={draft ?? value}
      onChange={event => {
        setDraft(event.target.value);
        if (event.target.validity.valid) onChange(event.target.valueAsNumber);
      }} onBlur={() => setDraft(null)} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} />
  </label>;
}

function nibHeights(width, ascender, body, descender) {
  return { nibRuling: true, xHeight: Number((width * body).toFixed(8)), subdivisions: body,
    ascRatio: ascender / body, descRatio: descender / body };
}

const broadEdge = { guideLabels: 'all', emphasis: 'none', innerRule: 'off', verticalOn: true,
  verticalPitch: 5, verticalTint: 10, slantOn: false };
const calligraphyTemplates = [
  { name: 'Copperplate', group: 'Pointed pen', detail: 'Shaded strokes · 55°' },
  { name: 'Spencerian', group: 'Pointed pen', detail: 'Flowing cursive · 52°', xHeight: 4, groupGap: 2, slantAngle: 52 },
  { name: 'Madarasz Script', group: 'Pointed pen', detail: 'Ornamental script · 45°', orientation: 'landscape', xHeight: 9, showDescenders: false,
    groupGap: 9, slantAngle: 45, slantSpacing: 5, guideTint: 10, emphasis: 'none' },
  { name: 'Foundational Hand', group: 'Broad-edge pen', detail: 'Upright, rounded letters', ...broadEdge, ...nibHeights(3.8, 3, 4, 3) },
  { name: 'Fraktur', group: 'Broad-edge pen', detail: 'Curved blackletter strokes', ...broadEdge, ...nibHeights(3, 3, 5, 3) },
  { name: 'Italic', group: 'Broad-edge pen', detail: 'Gently sloping letters', ...broadEdge, ...nibHeights(3, 5, 5, 5), groupGap: 3, verticalOn: false,
    slantOn: true, slantAngle: 85, slantSpacing: 5, guideTint: 10 },
  { name: 'Textura', group: 'Broad-edge pen', detail: 'Narrow, angular blackletter', ...broadEdge, ...nibHeights(3, 2, 4, 4) },
  { name: 'Envelope address', group: 'Practice layouts', detail: 'Address lines and numbers', xHeight: 4, showDescenders: false, digitGuide: true, groupGap: 2,
    horizontalTint: 100, verticalOn: true, verticalTint: 100, guideTint: 70, throughGap: true },
  { name: 'Oval drills', group: 'Practice layouts', detail: 'Large rows for oval strokes', guideLabels: 'none', xHeight: 18, ascRatio: 1, descRatio: 1,
    slantOn: false, groupGap: 0, emphasis: 'none' },
  { name: 'Square grid', group: 'Practice layouts', detail: '4 mm squares for lettering', guideLabels: 'none', xHeight: 4, slantOn: false, verticalOn: true,
    verticalPitch: 4, groupGap: 0, emphasis: 'none', innerRule: 'solid' },
].map(({ name, group, detail, ...values }) => ({
  label: name, value: name, group, detail,
  settings: {
    horizontalOn: true, nibRuling: false, xHeight: 5, ascRatio: 2, descRatio: 2, subdivisions: 1,
    horizontalTint: 50, groupGap: 4, showDescenders: true, digitGuide: false, throughGap: false,
    outerRule: 'solid', waistRule: 'solid', baselineRule: 'solid', descRule: 'solid', innerRule: 'dashed',
    subdivisionRule: 'off', emphasis: 'color', guideLabels: 'baseline', verticalOn: false,
    verticalPitch: 15, verticalRule: 'solid', verticalTint: 20,
    slantOn: true, slantAngle: 55, slantSpacing: 10, slantRule: 'solid', guideTint: 20,
    secondOn: false, ...values,
  },
}));

function CalligraphyTemplates({ paper, update }) {
  const templates = calligraphyTemplates.map(template => {
    if (template.value === 'Envelope address') {
      const writingWidth = getDimensions(paper).width - 2 * paper.marginX;
      return { ...template, settings: { ...template.settings, verticalPitch: Math.ceil(writingWidth / 2) + 1 } };
    }
    return template;
  });
  const selected = templates.find(({ settings }) =>
    Object.entries(settings).every(([key, value]) => paper[key] === value));
  return <FieldPanel id="templates" label="Templates" summary={selected?.label ?? 'Custom'} width="28rem">
    {close => <div className="space-y-3">
      {['Pointed pen', 'Broad-edge pen', 'Practice layouts'].map(group => (
        <fieldset key={group}>
          <legend className="mb-1.5 text-[13px] font-semibold">{group}</legend>
          <Choices columns={group === 'Broad-edge pen' ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}
            options={templates.filter(template => template.group === group)}
            value={selected?.value} onChange={name => {
              update(templates.find(template => template.value === name).settings);
              close();
            }} />
        </fieldset>
      ))}
    </div>}
  </FieldPanel>;
}

const fixedRatios = [[1, '1:1:1'], [2, '2:1:2'], [1.5, '3:2:3']];
const rounded = value => Number(value.toFixed(6));

function CalligraphyHeights({ paper, update, ruling }) {
  const body = paper.subdivisions;
  const width = rounded(paper.xHeight / body);
  const asc = rounded(paper.ascRatio * body);
  const desc = rounded(paper.descRatio * body);
  const apply = (w, a, b, d) => update(nibHeights(w, a, b, d));
  function choose(ratio) {
    if (ratio === 'custom') {
      if (ruling.custom) return;
      const units = paper.ascRatio === 1.5 ? 2 : 1;
      update({ ...nibHeights(paper.xHeight / units, paper.ascRatio * units, units, ruling.descRatio * units),
        showDescenders: ruling.descRatio > 0 });
    } else {
      update({ nibRuling: false, ascRatio: ratio, descRatio: ratio, subdivisions: 1,
        xHeight: Math.min(25, Math.max(1, paper.xHeight)), subdivisionRule: 'off' });
    }
  }
  return <>
    <fieldset disabled={paper.digitGuide} className="disabled:opacity-50">
      <legend className="mb-1 text-xs text-muted">Ascender / x-height / descender</legend>
      <Choices columns="grid-cols-4" options={[...fixedRatios, ['custom','Custom']].map(([value,label]) => ({value,label}))}
        value={ruling.custom ? 'custom' : ruling.ascRatio} onChange={choose} />
    </fieldset>
    {paper.digitGuide && <p className="text-xs text-muted">Figure guides use 2:1:2. Turn them off in More options to change the ratio.</p>}
    {ruling.custom ? <>
      <LiveNumber label="Nib width (mm)" value={width} min={0.1} max={25}
        onChange={w => apply(w, asc, body, desc)} />
      <fieldset><legend className="mb-1 text-xs text-muted">Height in nib widths</legend>
        <div className="grid grid-cols-3 gap-2">
          <LiveNumber label="Ascender" min={1} max={10} step={1} value={asc} onChange={a => apply(width, a, body, desc)} />
          <LiveNumber label="Body" min={1} max={12} step={1} value={body} onChange={b => apply(width, asc, b, desc)} />
          <LiveNumber label="Descender" min={0} max={10} step={1} value={desc}
            onChange={d => update({ ...nibHeights(width, asc, body, d), showDescenders: d > 0 })} />
        </div>
      </fieldset>
      <p className="text-xs text-muted">Ascender {rounded(width * asc)} mm · Body {paper.xHeight} mm · Descender {rounded(paper.xHeight * ruling.descRatio)} mm</p>
    </> : <LiveNumber label="X-height (mm)" value={paper.xHeight} min={1} max={25} onChange={xHeight => update({ xHeight })} />}
  </>;
}

function CalligraphyPanels({ paper, update, palette }) {
  const setting = name => <SpecialtySetting name={name} paper={paper} update={update} />;
  const ruling = calligraphyRuling(paper);
  const styles = (name, { value = paper[name], options = specialtyFields.calligraphy[name].options, disabled = false } = {}) => {
    const field = specialtyFields.calligraphy[name];
    return <fieldset key={name} disabled={disabled} className="disabled:opacity-50"><legend className="mb-1 text-xs text-muted">{field.label}</legend>
      <Choices columns={options.length === 4 ? 'grid-cols-4' : options.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} options={options} value={value} onChange={next => update({[name]: next})} />
    </fieldset>;
  };
  function selectSetting(name, value = paper[name], disabled = false, options = specialtyFields.calligraphy[name].options) {
    return <select id={'calligraphy-' + name} className={inputStyle + ' disabled:opacity-50'} value={value} disabled={disabled}
      onChange={event => update({ [name]: event.target.value })}>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>;
  }
  function darkness(name) {
    const field = specialtyFields.calligraphy[name];
    return <Range id={name} label="Darkness" unit="%" min={field.min} max={field.max} step={1}
      value={paper[name]} onChange={value => update({ [name]: value })} />;
  }
  function slant(toggle, angle, pitch, style, tint) {
    return <div className="space-y-2">{setting(toggle)}
      {paper[toggle] && <>
        <div className="grid grid-cols-2 gap-2">{setting(angle)}{setting(pitch)}</div>
        <p className="text-xs text-muted">Spacing is measured perpendicular to the lines.</p>
        {darkness(tint)}{styles(style)}
      </>}
    </div>;
  }
  const colorsEnabled = paper.emphasis === 'color';
  const markerOptions = specialtyFields.calligraphy.guideLabels.options.filter(option => !ruling.custom || option.value !== 'baseline');
  const markersLocked = paper.digitGuide || (!ruling.custom && paper.xHeight < 4);
  const moreOptions = paper.horizontalOn && (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <label htmlFor="calligraphy-emphasis">Emphasis</label>
        <div className="w-40">{selectSetting('emphasis')}</div>
      </div>
      {paper.emphasis === 'band' && <ColorPanel id="guide-accent" label="Band color" inline color={paper.accentColor}
        onChange={accentColor => update({ accentColor })} presets={INKS} palette={palette} />}
      <div className="space-y-1 border-y border-[#e5e9df] py-2">
        {['outerRule', 'waistRule', 'baselineRule', 'descRule'].map(name => {
          if (name === 'descRule' && !ruling.descRatio) return null;
          const label = specialtyFields.calligraphy[name].label;
          return <div key={name} className="grid grid-cols-[minmax(0,1fr)_6rem_3rem] items-center gap-x-1.5 text-[13px]">
            <label htmlFor={'calligraphy-' + name}>{label}</label>
            {selectSetting(name)}
            {colorsEnabled && name === 'waistRule' && <ColorPanel id="waist-color" label="Waistline color" swatchOnly
              color={paper.waistColor} onChange={waistColor => update({ waistColor })} presets={INKS} palette={palette} />}
            {colorsEnabled && name === 'baselineRule' && <ColorPanel id="guide-accent" label="Baseline color" swatchOnly
              color={paper.accentColor} onChange={accentColor => update({ accentColor })} presets={INKS} palette={palette} />}
          </div>;
        })}
        {!ruling.custom && <label className="flex min-h-8 items-center gap-2 text-[13px]">
          <input type="checkbox" className="accent-[#647c5c]" checked={ruling.descRatio > 0}
            onChange={event => update({ showDescenders: event.target.checked, descRatio: paper.descRatio || paper.ascRatio || 1 })} />
          Include descender space
        </label>}
      </div>
      <details>
        <summary className="cursor-pointer py-1 text-[13px] font-semibold">Extra guides &amp; row markers</summary>
        <div className="space-y-2 pt-2">
          {!ruling.custom && setting('digitGuide')}
          {!ruling.custom && ruling.ascRatio > 1 && <label className={inputLabel}>First ascender and descender guides
            {selectSetting('innerRule', ruling.innerRule, paper.digitGuide)}
          </label>}
          {ruling.custom && <label className={inputLabel}>Subdivision lines{selectSetting('subdivisionRule')}</label>}
          <div className="flex items-center justify-between gap-2 text-[13px]">
            <label htmlFor="calligraphy-guideLabels">Row markers</label>
            <div className="w-40">{selectSetting('guideLabels', ruling.markers, markersLocked, markerOptions)}</div>
          </div>
          {(markersLocked || ruling.markers === 'all') && <p className="text-xs text-muted">{ruling.custom
            ? 'Prints a nib-width scale beside each row.'
            : paper.xHeight < 4 ? 'Row markers need an x-height of at least 4 mm.'
            : paper.digitGuide ? 'Figure guides use dashed inner lines and a baseline X.'
            : 'X marks the baseline. A and D mark the ascender and descender zones.'}</p>}
        </div>
      </details>
    </div>
  );
  return <>
    <CalligraphyTemplates paper={paper} update={update} />
    <FieldPanel id="x-lines" label="X-Lines" summary={paper.horizontalOn ? paper.xHeight + ' mm' : 'Off'} width="22rem" moreOptions={moreOptions}>
      <div className="space-y-3">{setting('horizontalOn')}
        {paper.horizontalOn && <>
          <CalligraphyHeights paper={paper} update={update} ruling={ruling} />
          {setting('groupGap')}
          {setting('throughGap')}
          {darkness('horizontalTint')}
        </>}
      </div>
    </FieldPanel>
    <FieldPanel id="y-lines" label="Y-Lines" summary={paper.verticalOn ? paper.verticalPitch + ' mm' : 'Off'}>
      <div className="space-y-3">{setting('verticalOn')}
        {paper.verticalOn && <>{setting('verticalPitch')}{darkness('verticalTint')}{styles('verticalRule')}</>}
      </div>
    </FieldPanel>
    <FieldPanel id="slantGuides" label="Slant lines" summary={[paper.slantOn && paper.slantAngle + '°', paper.secondOn && paper.secondAngle + '°'].filter(Boolean).join(' / ') || 'Off'} width="22rem">
      <div className="space-y-3">
        {slant('slantOn', 'slantAngle', 'slantSpacing', 'slantRule', 'guideTint')}
        {slant('secondOn', 'secondAngle', 'secondSpacing', 'secondRule', 'secondTint')}
      </div>
    </FieldPanel>
  </>;
}

function MusicTemplates({ paper, update }) {
  const preset = matchingTemplate(paper.staves);
  const [browsing, setBrowsing] = useState(null);
  const group = browsing ?? preset?.group ?? 'Single staff';
  return <FieldPanel id="music-templates" label="Templates" summary={preset?.label ?? 'Custom'} width="29rem"
    onClose={() => setBrowsing(null)}>
    {close => <>
      <fieldset>
        <legend className="sr-only">Instrument or ensemble</legend>
        <div className="grid grid-cols-6 gap-1 rounded-lg bg-desk p-1 sm:flex">
          {[...new Set(musicTemplates.map(t => t.group))].map(name =>
            <label key={name} className="col-span-2 flex min-h-9 cursor-pointer items-center justify-center whitespace-nowrap rounded-md px-2 text-[13px] text-muted hover:text-ink has-checked:bg-white has-checked:font-semibold has-checked:text-ink has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-[#728d70] sm:flex-auto max-sm:nth-last-[-n+2]:col-span-3">
              <input className="sr-only" type="radio" name="music-template-group" checked={group === name}
                onChange={() => setBrowsing(name)} />
              {name}
            </label>)}
        </div>
      </fieldset>
      <div className="mt-3"><Choices columns="grid-cols-2" value={preset?.id}
        options={musicTemplates.filter(t => t.group === group).map(t => ({ label: t.label, value: t.id }))}
        onChange={id => { update({ staves: musicTemplates.find(t => t.id === id).staves }); close(); }} /></div>
    </>}
  </FieldPanel>;
}

function MusicStaffEditor({ paper, update }) {
  const [selected, select] = useState(0);
  const rows = paper.staves;
  const i = Math.min(selected, rows.length - 1), row = rows[i];
  const remaining = rows.length - i;
  const braceConflict = rows[i - 1]?.brace || rows[i + 1]?.brace;
  const edit = patch => update({ staves: rows.map((r, j) => j === i ? { ...r, ...patch } : r) });
  const compactButton = 'min-h-8 rounded-lg px-2 text-[13px] hover:bg-desk disabled:opacity-40';
  function insert(copy) {
    const next = copy ? row : musicTemplates[0].staves[0];
    update({ staves: changeStaffList(rows, i + 1, next) });
    select(i + 1);
  }
  return <FieldPanel id="music-staves" label="Edit staves" summary={rows.length + (rows.length === 1 ? ' staff' : ' staves')}
    onClose={() => select(0)}>
    <div className="space-y-3">
      <label className={inputLabel}>Staff to edit
        <select className={inputStyle} value={i} onChange={e => select(Number(e.target.value))}>
          {rows.map((r, j) => <option key={j} value={j}>{j + 1}. {r.name}</option>)}
        </select>
      </label>
      <label className={inputLabel}>Part name
        <input className={inputStyle} key={i + '-' + row.name} maxLength={32} defaultValue={row.name}
          onBlur={event => {
            const name = event.target.value.trim() || 'Staff';
            if (name !== row.name) edit({ name });
            else event.target.value = name;
          }}
          onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} />
      </label>
      <div className="grid grid-cols-2 gap-2" key={i}>
        <label className={inputLabel}>Clef<select className={inputStyle} value={row.clef} onChange={e => edit({ clef: e.target.value })}>
          {Object.entries(staffClefs).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <LiveNumber label={row.clef === 'tab' ? 'Strings' : 'Lines'} min={1} max={20} step={1} value={row.lines} onChange={lines => edit({ lines })} />
        {remaining > 1 && <LiveNumber label="Space below (mm)" min={0} max={60} value={row.gap ?? 3 * paper.staffSpacing} onChange={gap => edit({ gap })} />}
      </div>
      <fieldset><legend className="mb-1.5 text-xs text-muted">Staff height</legend>
        <Choices columns="grid-cols-2" value={row.height === null ? 'page' : 'custom'}
          options={[{value: 'page', label: 'Follow page · ' + paper.staffSpacing + ' mm'}, {value: 'custom', label: 'Custom height'}]}
          onChange={mode => edit({ height: mode === 'page' ? null : row.height ?? Math.max(1, Math.min(80, (row.lines - 1) * paper.staffSpacing)) })} />
        {row.height !== null && <div className="mt-2"><LiveNumber label={row.lines === 1 ? 'Staff area (mm)' : 'Staff height (mm)'} min={1} max={80} value={row.height} onChange={height => edit({ height })} /></div>}
      </fieldset>
      <SpecialtySetting name="printPartNames" paper={paper} update={update} />
      {remaining > 1 && <details className="border-t border-[#edf0e7] pt-2">
        <summary className="cursor-pointer text-[13px] font-semibold">Group connections</summary>
        <label className="my-2 flex items-center gap-2 text-[13px]"><input type="checkbox" checked={row.brace} disabled={braceConflict}
          onChange={e => edit({ brace: e.target.checked })} />Brace with next staff</label>
        {braceConflict && <p className="mb-2 text-xs text-muted">Remove the adjoining brace to pair these staves.</p>}
        <div className="grid grid-cols-2 gap-2">{[['bracket','Bracket'], ['join','Left barline']].map(([field, label]) =>
          <label key={field} className={inputLabel}>{label}<select className={inputStyle} value={row[field]}
            onChange={e => edit({ [field]: Number(e.target.value) })}><option value={0}>None</option>
            {Array.from({ length: remaining - 1 }, (_, n) => <option key={n} value={n + 2}>To staff {i + n + 2}</option>)}
          </select></label>)}</div>
      </details>}
      <div className="flex justify-between gap-1 border-t border-[#edf0e7] pt-2">
        <button className={compactButton} type="button" disabled={rows.length >= MAX_STAVES} onClick={() => insert(false)}>Add staff</button>
        <button className={compactButton} type="button" disabled={rows.length >= MAX_STAVES} onClick={() => insert(true)}>Duplicate</button>
        <button className={compactButton} type="button" disabled={rows.length === 1} onClick={() => {
          update({ staves: changeStaffList(rows, i, null) }); select(Math.min(i, rows.length - 2));
        }}>Remove</button>
      </div>
    </div>
  </FieldPanel>;
}

function MusicSignatures({ paper, update }) {
  const pitched = paper.staves.some(row => ['treble', 'bass', 'alto', 'tenor', 'vocalTenor'].includes(row.clef));
  const [section, setSection] = useState('key');
  if (paper.staves.every(row => row.clef === 'none')) return null;
  const key = specialtyFields.music.keyFifths.options.find(option => option.value === paper.keyFifths);
  const meter = { common: 'C', cut: '¢', none: '' }[paper.meter] ?? paper.meter;
  const summary = [pitched && paper.keyFifths !== 0 && key.label.split(' ')[0], meter].filter(Boolean).join(' · ') || 'Blank';
  return <FieldPanel id="signatures" label="Signatures" summary={summary} width="21rem">
    {pitched && <Choices columns="mb-3 grid-cols-2" value={section} onChange={setSection}
      options={[{ value: 'key', label: 'Key' }, { value: 'time', label: 'Time' }]} />}
    {pitched && section === 'key' ? <>
      <label className={inputLabel}>Key signature<select className={inputStyle} value={paper.keyFifths}
        onChange={event => update({ keyFifths: Number(event.target.value) })}>
        {specialtyFields.music.keyFifths.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select></label><p className="mt-2 text-xs text-muted">Printed at the start of every system.</p>
    </> : <div className="space-y-3"><SpecialtySetting name="meter" paper={paper} update={update} />
      {paper.meter !== 'none' && <SpecialtySetting name="repeatSigns" paper={paper} update={update} />}</div>}
  </FieldPanel>;
}

function MusicLyrics({ paper, update }) {
  const selected = lyricStaffIndices(paper.staves);
  return <>
    <SpecialtySetting name="lyricLine" paper={paper} update={update} />
    {paper.lyricLine && paper.staves.length > 1 && <fieldset className="ml-2">
      <legend className="mb-1 text-xs text-muted">Write lyrics below</legend>
      {paper.staves.map((row, i) => <label key={i} className="flex min-h-8 items-center gap-2 text-[13px]">
        <input type="checkbox" checked={selected.includes(i)} onChange={event => update({
          staves: paper.staves.map((r, j) => ({ ...r, lyrics: j === i ? event.target.checked : selected.includes(j) })),
        })} />{i + 1}. {row.name}
      </label>)}</fieldset>}
  </>;
}

function SpecialtyPanels({ paper, update, palette }) {
  const setting = name => <SpecialtySetting key={name} name={name} paper={paper} update={update} />;
  function panel(id, label, summary, content) {
    return <FieldPanel id={id} label={label} summary={summary}>
      <div className="space-y-3">{content}</div>
    </FieldPanel>;
  }
  if (paper.type === 'cornell') return <>
    {panel('cornellLayout', 'Page layout', paper.noteHeader === 'none' ? 'No heading' : 'With heading', <>
      {setting('noteHeader')}{setting('cueRuling')}{setting('sectionLabels')}
    </>)}
    {panel('divider-lines', 'Divider lines', <span><span className="capitalize">{paper.dividerStyle}</span> · {paper.dividerThicknessPt} pt</span>, <>
      <fieldset>
        <legend className="mb-1.5 text-xs text-muted">Line style</legend>
        <Choices options={specialtyFields.cornell.dividerStyle.options} columns="grid-cols-3"
          value={paper.dividerStyle} onChange={dividerStyle => update({ dividerStyle })} />
      </fieldset>
      {setting('dividerThicknessPt')}
      <ColorPanel id="divider-color" label="Divider color" inline color={paper.dividerColor}
        onChange={dividerColor => update({ dividerColor })} presets={INKS} palette={palette} />
    </>)}
  </>;
  if (paper.type === 'music') {
    return <>
      <MusicTemplates paper={paper} update={update} />
      <MusicStaffEditor paper={paper} update={update} />
      <MusicSignatures paper={paper} update={update} />
      {panel('measures', 'Bar lines', paper.measures ? paper.measures + ' measures' : 'Blank', setting('measures'))}
    </>;
  }
  return paper.type === 'calligraphy' ? <CalligraphyPanels paper={paper} update={update} palette={palette} /> : null;
}

export function PaperToolbar({ paper, update }) {
  const palette = useSavedColors();
  const hasSeparateMargins = paper.type === 'lined' || paper.type === 'music';
  const handwriting = paper.type === 'handwriting' ? getHandwritingPageLayout(paper) : null;
  const fields = [...PAPER_TYPES[paper.type].controls, ...extraFields(paper)];
  const hasLines = paper.type !== 'dot' && !(paper.type === 'isometric' && paper.isoStyle === 'dots');
  return (
    <div className="flex min-w-0 justify-center py-2 print:hidden">
      <div role="group" aria-label="Customize your paper"
        className="flex max-w-full flex-wrap items-stretch justify-center gap-1 rounded-2xl border border-[#dfe5d8] bg-white p-2 shadow-[0_2px_12px_#34442908] max-sm:grid max-sm:w-full max-sm:grid-cols-3 max-sm:gap-0 max-sm:p-1">
        <FieldPanel id="page" label="Paper settings" summary={getDimensions(paper).label}>
          <div className="space-y-4">
            <PaperSizePicker paper={paper} update={update} />
            <LayoutNumber label="Number of pages (PDF & print)" value={paper.pageCount} min={1} max={MAX_PAGE_COUNT}
              step={1} onChange={pageCount => update({ pageCount })} />
            <fieldset><legend className="mb-2 text-[13px] text-muted">Orientation</legend>
              <Choices options={orientations} value={paper.orientation} onChange={orientation => update({ orientation })} />
            </fieldset>
            {hasSeparateMargins && <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={paper.separateMargins} onChange={event => update({ separateMargins: event.target.checked })} />
              Set each page margin separately
            </label>}
            {hasSeparateMargins && paper.separateMargins ? (
              <div className="grid grid-cols-2 gap-2">
                {marginSides.map(side => <LayoutNumber key={side} label={side + ' (mm)'} value={paper['margin' + side]}
                  max={paper.type === 'music' ? musicMarginLimit(paper, side) : maxPageMargin(paper)} onChange={value => update({ ['margin' + side]: value })} />)}
              </div>
            ) : paper.type === 'calligraphy' ? <fieldset><legend className="mb-2 text-xs text-muted">Page margins</legend>
              <div className="grid grid-cols-2 gap-2">{['marginX','marginY'].map(name => <LiveNumber key={name} label={specialtyFields.calligraphy[name].label}
                value={paper[name]} min={0} max={maxPageMargin(paper)} onChange={value => update({[name]: value})} />)}</div>
            </fieldset> : <Range id="margin-input" label="Page margins" value={paper.margin} min={0} max={maxPageMargin(paper)} step={1} onChange={margin => update({ margin })} />}
            {paper.type === 'calligraphy' && <fieldset><legend className="text-xs text-muted">Printed heading</legend>
              <SpecialtySetting name="guideInfo" paper={paper} update={update} />
              <SpecialtySetting name="dateField" paper={paper} update={update} />
            </fieldset>}
            <div className="border-t border-[#edf0e7] pt-1">
              <ColorPanel id="background" label={paper.type === 'graph' ? 'Page background' : 'Background color'} color={paper.background} inline
                onChange={background => update({ background })} presets={backgroundPresets} palette={palette} />
              {paper.type === 'graph' && <div className="mt-1 border-t border-[#edf0e7] pt-1">
                <div className="flex min-h-9 items-center justify-between gap-2 text-xs text-muted">
                  <span>Grid background</span>
                  <label className="inline-flex min-h-8 cursor-pointer items-center gap-1.5">
                    <input type="checkbox" className="accent-[#647c5c]" checked={paper.gridBackground == null}
                      onChange={event => update({ gridBackground: event.target.checked ? null : '' })} />
                    Same as page
                  </label>
                </div>
                {paper.gridBackground != null && <ColorPanel id="grid-background" label="Grid background" summaryOnly
                  color={paper.gridBackground} onChange={gridBackground => update({ gridBackground })}
                  presets={backgroundPresets} palette={palette} />}
              </div>}
            </div>
          </div>
        </FieldPanel>
        <SpecialtyPanels paper={paper} update={update} palette={palette} />
        {paper.type === 'lined' && <NotebookLayout paper={paper} update={update} />}
        {fields.map(name => {
          if (name === 'spacing' && paper.type === 'handwriting') return <LetterHeightPanel key={name} paper={paper} update={update} />;
          if (name === 'summaryHeight') return (
            <FieldPanel key={name} id={name} label="Summary area" summary={paper.summaryHeight ? paper.summaryHeight + ' mm' : 'None'}>
              <div className="space-y-3">
                <LiveNumber label="Requested height (mm, 0 to hide)" value={paper.summaryHeight} min={0} max={65} onChange={summaryHeight => update({ summaryHeight })} />
                <p className="text-xs text-muted">On short sheets, the summary can use up to 55% of the space below the heading.</p>
                {paper.summaryHeight > 0 && <SpecialtySetting name="summaryRuling" paper={paper} update={update} />}
                {paper.summaryHeight > 0 && paper.summaryRuling !== 'blank' && <SpecialtySetting name="summaryPitch" paper={paper} update={update} />}
              </div>
            </FieldPanel>
          );
          if (name === 'staffCount') {
            const { count, capacity, paired } = getMusicLayout(paper);
            const label = paired ? 'Systems per page' : 'Staves per page';
            const max = Math.min(capacity, FIELDS.staffCount.max);
            const unit = paired ? 'system' : 'staff';
            return <FieldPanel key={name} id={name} label={label} summary={String(count)}>
              {paired && <p className="mb-2 text-[13px] text-muted">Each system contains your {paper.staves.length} staves, played together.</p>}
              {max > 1 ? <Range id="music-count" label={label} value={count} min={1} max={max} step={1} unit=""
                onChange={staffCount => update({ staffCount })} /> : null}
              <p className="my-2 text-xs text-muted">{max === 0
                ? 'No complete staff fits. Reduce staff height or margins, or choose a larger sheet.'
                : max === 1 ? `Only one ${unit} fits on this sheet.`
                  : `Choose 1–${max} ${paired ? 'systems' : 'staves'} at the current size and spacing.`}</p>
              <SpecialtySetting name="systemGapMode" paper={paper} update={update} />
              {paper.systemGapMode === 'fixed' && <div className="mt-2"><SpecialtySetting name="systemGap" paper={paper} update={update} />
                <p className="mt-1 text-xs text-muted">From the last staff or lyric line to the next system.</p></div>}
              <SpecialtySetting name="musicHeading" paper={paper} update={update} />
              <MusicLyrics paper={paper} update={update} />
            </FieldPanel>;
          }
          if (name === 'quadrants') return <CoordinateQuadrants key={name} paper={paper} update={update} />;
          if (name === 'axisRange') return <CoordinateRange key={name} paper={paper} update={update} />;
          if (name === 'showNumbers') return <CoordinateNumbers key={name} paper={paper} update={update} />;
          if (name === 'practiceRuling') return <PracticeRuling key={name} paper={paper} update={update} />;
          if (name === 'midlineStyle') return <PracticeGuides layout={handwriting} key={name} paper={paper} update={update} palette={palette} />;
          if (name === 'practiceText') return (
            <FieldPanel key={name} id={name} label="Practice text" summary={<span className="max-w-24 truncate">{paper.practiceText.trim() || 'Blank'}</span>}>
              <label className="grid gap-2 text-[13px] text-muted">
                First-row example
                <input type="text" maxLength={MAX_PRACTICE_TEXT} className={inputStyle} placeholder="Aa, cat, or a name"
                  value={paper.practiceText} onChange={event => update({ practiceText: event.target.value })} />
              </label>
              <p aria-live="polite" className="mt-2 text-xs text-muted">{handwriting.hint || 'The remaining rows are blank for copying.'}</p>
            </FieldPanel>
          );
          if (name === 'rowGap') return (
            <FieldPanel key={name} id={name} label="Row gap" summary={paper.rowGap + ' mm'}>
              <Range id="practice-gap" label={paper.practiceRuling === 'four' ? 'Bottom guide to next top line' : 'Space below each baseline'} value={paper.rowGap} min={2} max={25} step={0.5}
                onChange={rowGap => update({ rowGap })} />
            </FieldPanel>
          );
          if (name === 'ruleMargin') return <MarginLines key={name} paper={paper} update={update} palette={palette} />;
          if (name === 'majorEvery') return <BoldGuides key={name} paper={paper} update={update} />;
          return <PaperField key={name} name={name} paper={paper} update={update} />;
        })}
        {hasLines && <LineWeight label={paper.type === 'cornell' ? 'Ruling thickness' : undefined} value={paper.lineWeightPt} update={update} />}
        <ColorPanel id="ink" label={paper.type === 'cornell' ? 'Ruling color' : hasLines ? 'Line color' : 'Dot color'} color={paper.color}
          description={paper.type === 'calligraphy' && paper.emphasis === 'color' ? 'Set waistline and baseline colors in X-Lines → More options.' : undefined}
          onChange={color => update({ color })} presets={INKS} palette={palette} />
      </div>
    </div>
  );
}
