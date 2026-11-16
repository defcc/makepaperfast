export const infoPages = {
  '/about': {
    heading: 'About MakePaperFast',
    title: 'About MakePaperFast | Why I Made This Graph Paper Generator',
    description: 'Why I built MakePaperFast: a clean workspace for making printable paper, with live previews and fine control over grid spacing, margins, and line styles.',
    intro: 'MakePaperFast is a free printable paper generator. Open it and there’s already a sheet of graph paper on your desk, ready to adjust or print.',
    sections: [
      ['Why I made this graph paper generator', 'The graph paper generators I tried reminded me of the early web. Even choosing a grid size felt like filling out a form. I wanted the freedom to fine-tune every sheet and the ease of picking up a piece of paper that’s already on my desk.'],
      ['The paper is the interface', 'I wanted a clean workspace where the sheet gets most of the screen. A small toolbar sits below it. Choose a wider grid and the squares grow in front of you. Lighten the lines and you can judge their color against the page. When it looks right, that’s the sheet you download.'],
      ['As much control as you need', 'The default sheet is ready to print. For a scale drawing, you might want four squares per inch, a bold line every four squares, and pale gray lines so your pencil marks stand out. Open just the settings you need, then close them to see the whole sheet again.'],
      ['From screen to paper', 'Download a PDF with the number of copies you need, print directly from your browser, or export one sheet as an editable SVG. To keep the measurements you chose, print the PDF at Actual Size or 100%.'],
    ],
  },
  '/privacy': {
    heading: 'Privacy',
    title: 'Privacy | MakePaperFast',
    description: 'Learn how MakePaperFast handles paper settings, downloads, shared links, and website requests.',
    intro: 'You can use the paper generators without an account. Here is what happens to your settings when you make, download, or share a sheet.',
    sections: [
      ['Settings saved in your browser', 'MakePaperFast uses local storage to remember your paper settings and saved colors on this device. You can remove those preferences by clearing the site data for MakePaperFast.com in your browser settings.'],
      ['Downloads and printing', 'Your browser creates the PDF or SVG on your device. Downloaded copies stay wherever you save them. Clearing site data does not delete those files.'],
      ['Settings in links', 'As you customize a sheet, its settings become part of the page address. This can include handwriting practice text or a custom music part name. Anyone you give that link to can see those settings. Opening or reloading the address also sends it to the website.'],
      ['Hosting and request logs', 'MakePaperFast runs on Cloudflare. Cloudflare processes requests to deliver the site, and request logs can include the requested URL and technical details used to diagnose errors.'],
    ],
  },
};

export function SiteInfo({ page }) {
  return (
    <>
      <header className="border-b border-[#dfe5d8] bg-desk print:hidden">
        <div className="mx-auto max-w-4xl px-5 py-5 sm:px-10">
          <a href="/" className="text-xl font-semibold tracking-tight">MakePaperFast.com</a>
        </div>
      </header>
      <main className="bg-[#fafbf8]">
        <article className="mx-auto max-w-4xl px-5 py-12 sm:px-10 sm:py-16">
          <h1 className="text-3xl font-semibold tracking-tight">{page.heading}</h1>
          <p className="mt-4 max-w-prose text-base leading-relaxed text-muted">{page.intro}</p>
          {page.sections.map(([heading, body]) => (
            <section key={heading} className="mt-8 max-w-prose">
              <h2 className="text-lg font-semibold">{heading}</h2>
              <p className="mt-2 text-base leading-relaxed text-muted">{body}</p>
            </section>
          ))}
        </article>
      </main>
    </>
  );
}
