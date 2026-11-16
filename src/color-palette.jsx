import { useEffect, useEffectEvent, useRef, useState } from 'react';

const paletteStorageKey = 'makepaperfast.saved-ink-colors';

function readSavedColors() {
  const colors = JSON.parse(localStorage.getItem(paletteStorageKey) ?? '[]');
  if (!Array.isArray(colors)) return [];
  return [...new Set(colors.filter(color => typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color))
    .map(color => color.toLowerCase()))];
}

export function useSavedColors() {
  const [saved, setSaved] = useState([]);
  const [sessionOnly, setSessionOnly] = useState(false);
  useEffect(() => {
    function refresh() {
      try { setSaved(readSavedColors()); } catch { /* Keep the in-session palette. */ }
    }
    function onStorage(event) {
      if (!event.key || event.key === paletteStorageKey) refresh();
    }
    refresh();
    window.addEventListener('storage', onStorage);
    window.addEventListener('pageshow', refresh);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('pageshow', refresh);
    };
  }, []);

  function changeSaved(next) {
    setSaved(next);
    try {
      localStorage.setItem(paletteStorageKey, JSON.stringify(next));
      setSessionOnly(false);
    } catch {
      setSessionOnly(true);
    }
  }

  return { saved, sessionOnly, changeSaved };
}

export function ColorPalette({ color, onChange, presets, palette }) {
  const picker = useRef(null);
  const picking = useRef(null);
  const { saved, sessionOnly, changeSaved } = palette;
  const commitColor = useEffectEvent(event => {
    const value = event.target.value;
    const session = picking.current;
    // Some native pickers send several changes during one visit.
    const colors = session?.added ? saved.filter(ink => ink !== session.added) : saved;
    const add = value !== session?.start && !colors.includes(value) && !presets.some(ink => ink.value === value);
    if (session) session.added = add ? value : null;
    if (add || colors.length !== saved.length) changeSaved(add ? [...colors, value] : colors);
    if (value !== color) onChange(value);
  });
  useEffect(() => {
    const input = picker.current;
    input.addEventListener('change', commitColor);
    return () => input.removeEventListener('change', commitColor);
  }, []);
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {presets.map(choice => (
          <button type="button" key={choice.value} aria-pressed={choice.value === color}
            onClick={() => onChange(choice.value)}
            className="flex min-h-9 items-center gap-1.5 rounded-lg border border-[#dfe5d7] px-2 text-[13px] hover:bg-desk aria-pressed:border-[#899f7e] aria-pressed:bg-[#edf3e8] max-[361px]:flex-col max-[361px]:justify-center max-[361px]:gap-1 max-[361px]:py-2">
            <span className="size-3.5 shrink-0 rounded-full ring-1 ring-black/10" style={{ backgroundColor: choice.value }} />{choice.name}
          </button>
        ))}
      </div>
      <div className="mt-3 border-t border-[#edf0e7] pt-3">
        {saved.length > 0 && <fieldset className="mb-3 border-b border-[#edf0e7] pb-3">
          <legend className="mb-2 text-[13px] text-muted">Custom colors</legend>
          <ul className="flex flex-wrap gap-1.5">
            {saved.map(ink => <li key={ink} className="group relative flex items-center">
              <button type="button" aria-label={ink.toUpperCase()} title={ink.toUpperCase()} aria-pressed={color === ink} onClick={() => onChange(ink)}
                className="grid size-8 place-items-center rounded-full border-2 border-transparent hover:bg-desk aria-pressed:border-[#647c5c]">
                <span className="size-5 rounded-full ring-1 ring-black/15" style={{ backgroundColor: ink }} />
              </button>
              <button type="button" aria-label={'Remove ' + ink} title="Remove color"
                onClick={() => {
                  changeSaved(saved.filter(value => value !== ink));
                  picker.current?.focus();
                }}
                className="pointer-events-none absolute -right-1 -top-1 grid size-4 place-items-center rounded-full border border-[#dfe5d7] bg-white text-muted opacity-0 hover:text-ink group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 [@media(hover:none)]:static [@media(hover:none)]:size-6 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100">
                <svg viewBox="0 0 20 20" className="size-3" fill="none" aria-hidden="true"><path d="m6 6 8 8m0-8-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </li>)}
          </ul>
        </fieldset>}
        <div className="flex min-h-9 items-center gap-2">
          <label className="relative inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#dfe5d7] px-3 text-[13px] font-medium hover:bg-desk has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#718b73]">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m14 6 4 4m-2-2 3-3a2.1 2.1 0 0 1 3 3l-3 3M14 8 5 17l-1 4 4-1 9-9" />
            </svg>
            Pick a color
            <input ref={picker} type="color" className="absolute inset-0 size-full! cursor-pointer opacity-0"
              value={color || '#ffffff'} onClick={() => { picking.current = { start: color, added: null }; }}
              onChange={event => onChange(event.target.value)} />
          </label>
        </div>
        {sessionOnly && <p role="status" className="mt-2 text-xs text-muted">Browser storage is unavailable. Changes apply to this session only.</p>}
      </div>
    </>
  );
}
