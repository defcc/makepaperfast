import { CATEGORIES, PAPER_TYPES } from './paper-catalog.js';
import { paths } from './paper-state.js';

export function SiteFooter({ pathname }) {
  return (
    <footer className="border-t border-[#dfe5d8] bg-desk print:hidden">
      <div className="mx-auto max-w-4xl px-5 py-6 sm:px-10">
        <nav aria-label="Paper generators" className="grid grid-cols-2 gap-x-5 gap-y-5 pb-6 sm:grid-cols-3">
          {CATEGORIES.map(category => (
            <div key={category.id}>
              <h2 className="mb-2 text-sm font-semibold">{category.name}</h2>
              <ul className="space-y-1 text-[13px] leading-5 text-muted">
                {Object.entries(PAPER_TYPES).filter(([, paper]) => paper.category === category.id).map(([type, paper]) => (
                  <li key={type}><a href={paths[type]} className="inline-block py-0.5 hover:text-ink hover:underline">{paper.name}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="flex flex-col items-start gap-1 border-t border-[#dfe5d8] pt-5 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-5">
          <a href="/" className="text-lg font-semibold tracking-tight hover:underline">MakePaperFast.com</a>
          <p className="text-sm leading-relaxed text-muted">
            A free graph paper generator. Make your own printable grid in seconds.
          </p>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 text-[13px] text-muted">
          <p>© {new Date().getUTCFullYear()} MakePaperFast.com</p>
          <nav aria-label="Site information" className="flex gap-5">
            <a href="/about" aria-current={pathname === '/about' ? 'page' : undefined} className="py-2 hover:text-ink hover:underline">About</a>
            <a href="/privacy" aria-current={pathname === '/privacy' ? 'page' : undefined} className="py-2 hover:text-ink hover:underline">Privacy</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
