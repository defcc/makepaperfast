import { renderToReadableStream } from 'react-dom/server.browser';
import { Editor } from './editor.jsx';
import { SiteFooter } from './site-footer.jsx';
import { infoPages, SiteInfo } from './site-info.jsx';
import { pageMeta } from './page-meta.js';
import { hasType, paths, pageType } from './paper-state.js';

const favicon =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect x='8' y='4' width='25' height='32' rx='4' fill='%232a302c'/%3E%3Cpath d='M14 13h13M14 20h13M14 27h8' stroke='%23fff' stroke-width='2'/%3E%3C/svg%3E";

function Document({ url, type, info }) {
  const { title, description } = info ?? pageMeta(type);
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#f4f5f1" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url.origin + url.pathname} />
        <link rel="icon" href={favicon} />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        {info ? <SiteInfo page={info} /> : <div id="editor">
          <Editor url={url} />
        </div>}
        <SiteFooter pathname={url.pathname} />
        {!info && <noscript>
          <p className="fixed inset-x-5 bottom-5 rounded-xl border border-[#dce5d1] bg-white p-5 text-center text-sm print:hidden">Enable JavaScript to customize your paper and download a PDF.</p>
        </noscript>}
        {!info && <script type="module" src="/app.js"></script>}
      </body>
    </html>
  );
}

export default {
  async fetch(request) {
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const url = new URL(request.url);
    const respond = (body, contentType, status = 200) =>
      new Response(request.method === 'HEAD' ? null : body, {
        status,
        headers: { 'Content-Type': contentType + '; charset=utf-8' },
      });
    if (url.pathname === '/robots.txt') {
      return respond(`User-agent: *\nAllow: /\nSitemap: ${url.origin}/sitemap.xml\n`, 'text/plain');
    }
    if (url.pathname === '/sitemap.xml') {
      const entries = [...Object.values(paths), ...Object.keys(infoPages)]
        .map((path) => `<url><loc>${url.origin}${path}</loc></url>`)
        .join('');
      return respond(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`,
        'application/xml',
      );
    }
    const legacy = url.searchParams.get('paper');
    if (url.pathname === '/graph-paper' || url.pathname === '/graph-paper/') {
      url.pathname = paths.graph;
      url.searchParams.delete('paper');
      return Response.redirect(url.href, 301);
    }
    if (url.pathname === '/index.html' || (url.pathname === '/' && hasType(legacy))) {
      url.pathname = hasType(legacy) ? paths[legacy] : '/';
      url.searchParams.delete('paper');
      return Response.redirect(url.href, 301);
    }
    const type = pageType(url.pathname);
    const info = infoPages[url.pathname];
    if (!type && !info) return respond('Page not found', 'text/plain', 404);
    const stream =
      request.method === 'HEAD' ? null : await renderToReadableStream(<Document url={url} type={type} info={info} />);
    return respond(stream, 'text/html');
  },
};
