import { FIELDS, PAPER_TYPES, minSpacing } from './paper-catalog.js';
import { spacingOptions, spacingText } from './spacing.js';

const graphMin = minSpacing('graph');
const graphMax = FIELDS.spacing.max;
const metricPresets = spacingOptions({ type: 'graph', spacingUnit: 'mm' }).map(option => option.value).join(', ');
const inchPresets = spacingOptions({ type: 'graph', spacingUnit: 'in' }).map(option => option.inches).join(', ');

const guides = {
  graph: {
    heading: 'Printable Graph Paper Generator',
    intro: 'Graph paper, also called squared paper, has evenly spaced horizontal and vertical lines. Each square is the same size in both directions, so you can use it as a unit of length, a stitch, or a space for a digit. Make a sheet to fit your project and download it as a free printable PDF.',
    featuresHeading: 'What can you customize on your graph paper?',
    features: [
      ['Grid spacing', <>
        Set the side length of each printed square. For example, a 1/4-inch grid gives you four squares per inch.
        <span className="mt-2 block"><strong>Millimeter presets:</strong> {metricPresets} mm.</span>
        <span className="mt-1 block"><strong>Inch presets:</strong> {inchPresets} in.</span>
        <span className="mt-1 block"><strong>Custom spacing:</strong> Enter {graphMin}–{graphMax} mm or {spacingText(graphMin, 'in')}–{spacingText(graphMax, 'in')} in. Inches accept fractions and decimals, so 3/16 and 0.1875 give you the same grid.</span>
      </>],
      ['Bold grid lines', 'Keep all lines uniform or add a heavier line at a regular interval. On a ¼-inch grid, a bold line every four squares marks off one-inch blocks.'],
      ['Line thickness and color', 'Set the grid lines from 0.1 to 2 pt. A thin gray line leaves pencil marks easy to see. A darker, thicker line is easier to follow across a large sheet.'],
      ['Page and grid backgrounds', 'Give the whole sheet one color, or set a separate color for the grid area. For example, you can put a cream grid inside a white margin.'],
      ['Sheet size and margins', 'Choose A2–A5, US Letter, Legal, Tabloid, a 24 × 36 inch poster, or your own dimensions. Set the orientation and margins to fit a binder, sketchbook, or drawing.'],
    ],
    useCases: [
      ['Draw a floor plan', 'On a ¼-inch grid, let each square represent one foot. A 12-by-10-foot room fills 12 by 10 squares, and a three-foot doorway spans three squares.'],
      ['Plot data by hand', 'To graph a week of temperatures, mark one day per square across and one degree per square up. Plot each reading where its day and temperature meet.'],
      ['Line up arithmetic', 'Use 1 cm squares and write one digit in each box. The columns keep ones, tens, and hundreds aligned when adding or subtracting numbers of different lengths.'],
      ['Chart a cross-stitch pattern', 'Color one square per stitch. Add a bold line every ten squares so you can count a 30-stitch border in three blocks.'],
      ['Sketch pixel art', 'Outline a 16-by-16-square area on a 5 mm grid. Fill each square with a single color to see how an icon will look at 16 by 16 pixels.'],
      ['Plan a vegetable bed', 'Let each square represent six inches. On that scale, a four-foot-wide bed spans eight squares, and planting spots a foot apart are two squares apart.'],
    ],
    faq: [
      ['Which spacing gives me four or five squares per inch?', 'Choose ¼ inch for four squares per inch or ⅕ inch for five. If an assignment calls for 5 mm paper, choose 5 mm in the metric presets. Two of those squares measure exactly 1 cm.'],
      ['Why are my printed squares smaller than I selected?', 'Match the printer’s paper size to the PDF and select Actual Size or 100%. “Fit to page” can shrink the grid. To check a 5 mm grid, measure from the center of one line to the center of the line ten squares away. It should measure 50 mm.'],
      ['Why is there extra space around the grid?', 'The generator centers whole squares inside your margins. When another full square won’t fit, the space left over is split between the two edges.'],
      ['How can I make faint lines easier to see in print?', 'Choose a darker line color, such as Graphite or Black. If the lines still look faint on a test sheet, increase Line thickness. The squares keep the same spacing.'],
    ],
  },
  dot: {
    heading: 'Free Dot Grid Paper Maker',
    intro: 'Dot grid paper, also called dotted paper, uses evenly spaced dots as drawing guides. A square grid gives you rows and columns for writing or planning. A triangular grid gives you three directions for geometry and isometric sketches. Make a sheet for your notebook or planner and download it as a free printable PDF.',
    featuresHeading: 'What can you customize on your dot grid paper?',
    features: [
      ['Dot layout', 'Choose Square for aligned rows and columns, or Triangular for staggered rows. In the triangular layout, three neighboring dots form an equilateral triangle.'],
      ['Dot spacing', <>
        Spacing measures the center-to-center distance between nearest neighbors. On a triangular grid with 5 mm spacing, each triangle has 5 mm sides and the rows are about 4.33 mm apart.
        <span className="mt-2 block"><strong>Millimeter presets:</strong> {metricPresets} mm.</span>
        <span className="mt-1 block"><strong>Inch presets:</strong> {spacingOptions({ type: 'dot', spacingUnit: 'in' }).map(option => option.inches).join(', ')} in.</span>
        <span className="mt-1 block"><strong>Custom spacing:</strong> Choose any distance from {minSpacing('dot')} to {FIELDS.spacing.max} mm. You can also enter inches as a fraction or decimal, such as 3/16 or 0.1875.</span>
      </>],
      ['Dot diameter', <>Choose {FIELDS.dotSize.options.map(option => option.value).join(', ')} mm or enter a custom diameter from {FIELDS.dotSize.min} to {FIELDS.dotSize.max} mm. Larger dots are easier to see at the same spacing.</>],
      ['Dot and page colors', 'Choose a preset or pick a custom color for the dots. Set the page background separately. For a journal you write in with black ink, try light gray dots on white.'],
      ['Notebook and planner sizes', 'Choose A5 for a journal insert, US Letter for a binder, or enter the dimensions of your own notebook. Adjust the margins to leave space for binding.'],
    ],
    useCases: [
      ['Sketch an isometric cube', 'Choose Triangular and start at one dot. Draw three edges of equal length along grid directions 120 degrees apart, then complete each face with parallel edges.'],
      ['Lay out a weekly spread', 'Give each day a column four gaps wide. Seven columns take 28 gaps, so a 5 mm grid needs 140 mm of dotted space across.'],
      ['Make a habit tracker', 'Draw one row per habit and one box per day. On a 5 mm grid, a 31-day month spans 155 mm. Use landscape if you need more room for the habit names.'],
      ['Practice hand lettering', 'On a 5 mm grid, use one row of dots as the baseline and the next as the top of your lowercase letters. Leave another row above for tall strokes.'],
      ['Sketch a journal table', 'For a reading log, use the dots to line up columns for the date, book title, and rating. Give the title more gaps than the date before drawing the borders.'],
    ],
    faq: [
      ['What dot spacing should I use for a bullet journal?', 'Try a 5 mm square grid for everyday notes and checklists. If your handwriting feels cramped, try 6 or 7 mm. For a habit tracker with lots of columns, 4 mm leaves room for more days across the page.'],
      ['How can I make the dots less noticeable behind my handwriting?', 'Try Light gray dots on a white page with a 0.35 mm dot diameter. Write a line on a test print with your usual pen or pencil. If the dots are hard to see while writing, try 0.5 mm in the same color.'],
      ['Can I print refills for my A5 binder?', 'Choose A5 in Paper settings. To leave room for the rings, measure from the edge of an existing refill to just past its punched holes and use that distance for Page margins. Print on A5 paper at Actual Size or 100% to keep the dot spacing you chose.'],
    ],
  },
  lined: {
    heading: 'Free Lined Paper Maker',
    intro: 'Lined paper, also called ruled paper, has evenly spaced horizontal lines that guide your handwriting. Make a blank sheet for class notes, letters, or journal entries. Choose your line spacing and page count, then download a free printable PDF with the same ruling on every page.',
    featuresHeading: 'What can you customize on your lined paper?',
    features: [
      ['Notebook layout', 'Start with narrow, college, or wide ruling. Adjust Heading space to leave room for a name or date, and limit the number of writing lines if you want a blank area below.'],
      ['Notebook ruling', 'Choose Narrow ruled (¼ inch, 6.35 mm), College ruled (9/32 inch, about 7.14 mm), or Wide ruled (11/32 inch, about 8.73 mm). Each measurement is the distance from the center of one line to the center of the next.'],
      ['Line spacing', <>Metric presets cover {metricPresets} mm. For a different spacing, enter a value from {minSpacing('lined')} to {FIELDS.spacing.max} mm, or its equivalent in inches. Inch inputs accept fractions and decimals.</>],
      ['Margin lines', 'Turn the left and right margin lines on or off independently. For each line, choose a color and set its distance in millimeters from that end of the horizontal ruling. The Line thickness setting applies to both the ruling and the margin lines.'],
      ['Line appearance', 'Choose solid, dashed, or dotted ruling, a line color, and a thickness from 0.1 to 2 pt. For a letter written in dark ink, try thin light gray lines on a white background.'],
      ['Paper size and margins', 'Choose US Letter, A5, or your own refill size. Leave Page margins at zero for full-width ruling, or set each side separately to leave extra binding space. A printer with non-printable edges may leave a small white strip.'],
    ],
    useCases: [
      ['Take class notes', 'Use college ruling for notes with several lines per paragraph. Add a left margin line if you want a separate column for dates, questions, or corrections.'],
      ['Practice handwriting', <>Use wider ruling for large letters. For grouped practice rows with a midline and room for descenders, use the <a className="underline" href="/handwriting-paper">handwriting paper generator</a>.</>],
      ['Write a letter', 'Leave the vertical margin line off and choose a spacing that suits your writing. For a clean first page, leave the top few lines for the date and greeting.'],
      ['Refill a journal or planner', 'Measure a page that already fits the cover. Use its dimensions for the paper size, then match its ruling so entries continue at the same spacing on the new sheets.'],
    ],
    faq: [
      ['Should I choose college ruled or wide ruled?', 'If your teacher specifies a ruling, choose it by name. For your own notebook, try wide ruled if your letters feel cramped. College ruled fits more lines on the same sheet, which helps with longer notes.'],
      ['How do I match the lines in a notebook I already own?', 'Measure from the first line to the eleventh and divide by ten. A 70 mm measurement gives a 7 mm spacing. Print on matching paper at Actual Size or 100% and lay the test sheet beside your notebook.'],
      ['How much room should I leave for a hole punch?', 'Measure from the binding edge of an existing refill to just past the holes. Use that distance for the binding-side page margin to keep the ruling clear of the punch. To mark where writing starts, add a left guide under Margin lines.'],
    ],
  },
  handwriting: {
    heading: 'Printable Handwriting Paper Generator',
    intro: 'Handwriting practice paper gives letters a place to sit and a height to aim for. Make blank practice rows for print or cursive, with room below each baseline for the tails of letters such as g and y.',
    featuresHeading: 'What can you customize on handwriting paper?',
    features: [
      ['Practice ruling', 'Two-line rows mark the midline and baseline. Three-line rows add a top line for tall letters such as b and h. Four-line rows also mark how far the tails of letters such as g and y extend below the baseline.'],
      ['Ruling size presets', 'Choose a letter height of ⅜, ½, ⅝, ¾ or 1⅛ inches. Each preset places the midline halfway between the top line and baseline.'],
      ['Letter height and row gap', 'Set the height of a tall letter in millimeters or inches. Row gap controls the space between practice rows. On four-line paper, measure it from the bottom guide of one row to the top line of the next.'],
      ['Writing guides', 'Choose a color and a solid, dashed or dotted stroke for each horizontal guide. Turn on the lowercase highlight to shade the space where letters such as a, c and o sit. Choose a highlight color in Writing guides and adjust the band’s height in Letter height.'],
      ['Practice text', 'Add a letter pair, word or name on the first row for a learner to copy. With letter boxes, each letter or space takes one box. Leave the text empty for a blank practice sheet.'],
      ['Letter boxes', 'Divide each writing row into equal boxes. Give the vertical lines their own color and choose a solid, dashed or dotted stroke. Practice text sets the box width for every row to fit the widest letter. On a blank sheet you can set the width yourself.'],
    ],
    useCases: [
      ['Match classroom paper', 'Compare the ruling with a sheet from school. Match the tall letter height first, then adjust the midline and the space between practice rows.'],
      ['Practice letter families', 'Practice a and o between the midline and baseline, then try b and d to use the tall letter space.'],
      ['Leave room for cursive', 'Use four-line paper to practice the loops in j, g and y below the baseline. Increase the row gap if you want more space between rows of writing.'],
    ],
    faq: [
      ['Which ruling matches my child’s workbook?', 'Look at a letter with a tail, such as g. If the workbook marks both the top of tall letters and the bottom of the tail, choose Four-line. If it marks only the top, choose Three-line. For a workbook that marks just the height of short letters and the baseline, choose Two-line.'],
      ['How can I make the baseline easier to see?', 'Open Writing guides and choose a darker baseline color. A lighter guide color can also help the baseline stand out.'],
      ['Why does my printed letter height measure smaller?', 'Choose the same sheet size in the generator and printer. Print the PDF at Actual size or 100% so the printer preserves the guide spacing.'],
    ],
  },
  coordinate: {
    heading: 'Free Coordinate Paper Maker',
    intro: 'Coordinate paper, also called Cartesian graph paper, has an x-axis and a y-axis that meet at the origin. Each pair of coordinates identifies a point on the grid. Use it to plot data, draw a function, or practise reading ordered pairs.',
    features: [
      ['Choose a quadrant', 'Print the full coordinate plane or just quadrant I, II, III, or IV. A single quadrant gives you more room to plot points with the same pair of signs.'],
      ['Axis range', 'Set both axes to 5, 10, or 20 with a preset, or set a minimum and maximum for each axis using whole numbers from −50 to 50. Each small square measures one unit in both directions.'],
      ['Numbers and bold grid lines', 'Label the axes every 1, 2, 5, or 10 units, let the generator choose an interval that fits the sheet, or hide the numbers. Bold grid lines have their own interval.'],
    ],
    useCases: [
      ['Practice ordered pairs', 'Use all four quadrants to plot points such as (−3, 2) and (3, −2). Ask a partner to read the coordinates back from the graph.'],
      ['Sketch a function', 'For y = x², set x from −4 to 4 and y from 0 to 16. The points (−4, 16) and (4, 16) both fit on the sheet.'],
      ['Plot data over time', 'Use the first quadrant for a series of daily measurements. Mark the day on the horizontal axis and its reading on the vertical axis.'],
    ],
    faq: [
      ['Which layout do I need to plot (−3, 2)?', 'Choose quadrant II, or use all four if your exercise includes points in other quadrants. From the origin, move three squares left for x = −3, then two squares up for y = 2.'],
      ['How much is each square worth if the labels go up by five?', 'Each square is one unit. From zero, count five squares to reach the tick labeled 5. Change Axis numbers to Every 1 to label each unit.'],
      ['Can I make a worksheet for students to label?', 'Hide Axis numbers. The axes, arrows, and x and y labels stay on the sheet, so students can mark the origin and fill in the scale.'],
    ],
  },
  hex: {
    heading: 'Printable Hexagonal Graph Paper Generator',
    intro: 'Hexagonal graph paper, also called hex grid or honeycomb paper, has six equal sides around each cell. Trace the edges to draw a ring structure, or use the cells as tiles on a map. Each tile shares an edge with six neighbors.',
    featuresHeading: 'What can you customize on your hex paper?',
    features: [
      ['Hex size', 'Choose Side length to measure along one edge, or Across flats to measure between opposite parallel edges. Pick a preset in millimeters or inches, or enter a custom size from 2 mm to 2 inches. Inch inputs accept fractions such as 1/5.'],
      ['Flat top or pointy top', 'Choose a horizontal edge or an upward-facing corner at the top of each cell. You can rotate the grid independently of portrait or landscape paper.'],
      ['Map coordinates', 'Print a column and row inside each cell so you can refer to a location such as 03-07 in your encounter notes. Leave coordinates off for chemistry or quilting.'],
      ['Printable grid and margins', 'The generator centers complete hexagons inside the margins. Set a light line color for tracing bonds or increase the line thickness for a map. Download a multi-page PDF or a single editable SVG.'],
    ],
    useCases: [
      ['Draw organic structures', 'Start with a 1/5 inch side and a pale grid. Trace six edges for a ring, then extend a chain from a vertex along the grid.'],
      ['Plan a tabletop encounter', 'Choose Across flats and enter 1 inch for a one-inch map scale. Count movement from cell center to neighboring cell center.'],
      ['Design a quilt', 'Set the side length to the finished edge of a fabric hexagon. Shade the cells to plan a flower motif or test the repeat before cutting fabric.'],
    ],
    faq: [
      ['What does “1/4 inch hexagons” mean?', 'Check how your notebook or template measures a hex. A 1/4 inch side gives about 0.433 inch across the flats. If the stated size measures the whole cell between parallel edges, choose Across flats instead.'],
      ['How do I match an existing hex map?', 'Measure from the center of one hex to the center of the next across their shared edge. Use that distance for Across flats and match the direction of the top edge.'],
      ['Why is there extra white space at the edges?', 'Only whole cells print. The space left after fitting them at the chosen size is shared between opposite margins. To keep that size on paper, print the PDF at Actual size or 100%.'],
    ],
  },
  isometric: {
    heading: 'Free Isometric Paper Maker',
    intro: 'Isometric paper uses a grid of equilateral triangles. The edges give you three directions for drawing the height, width, and depth of an object. Use it to sketch a cube, plan a block model, or show how a piece of furniture fits together.',
    features: [
      ['Triangle side length', 'Set the distance between adjacent vertices in millimeters or inches. For example, a ¼ inch side gives four grid steps per inch along any grid line.'],
      ['Grid orientation', 'Choose Vertical for upright edges when sketching boxes or furniture. Choose Horizontal for a level base when drawing triangles. Both orientations work with lines or dots.'],
      ['Lines or dots', 'Use lines to follow the edges of each triangle, or show just the intersections for a cleaner outline around your sketch.'],
      ['Guide visibility', 'Adjust line thickness for a ruled grid. In dot mode, adjust dot diameter independently of triangle size.'],
    ],
    faq: [
      ['How do I keep a cube’s edges the same length?', 'Start at one intersection and count the same number of grid steps along each of the three directions. Complete the faces by drawing the remaining edges parallel to those first three.'],
      ['Why are the rows closer together than the triangle side I chose?', 'The side length measures an edge between neighbouring points. The gap between horizontal rows is the height of a triangle. An 8 mm side gives a row height of about 6.9 mm.'],
      ['Can I draw with vertical edges on this grid?', 'Select Vertical under Grid orientation. One set of guides runs straight up the page, and the other two slope at 30 degrees to the horizontal. This works on both portrait and landscape sheets.'],
    ],
  },
  cornell: {
    heading: 'Free Cornell Notes Paper Maker',
    intro: 'A Cornell notes page keeps questions beside the notes that answer them and leaves space at the bottom to sum up the lesson. Print a blank template for class, then fold or cover the notes column to quiz yourself from the cues.',
    featuresHeading: 'What can you customize on your Cornell notes?',
    features: [
      ['Page heading and labels', 'Leave the top open, add Topic and Date, or include a Course field. Print Cues, Notes, and Summary labels when introducing the format to a class.'],
      ['Divider lines and ruling', 'Set the section dividers to solid, dashed, or dotted and choose their color and thickness. Give the writing lines, squares, or dots a lighter color to keep your notes easy to read.'],
      ['Cue and notes columns', 'Give the cue column 18% to 35% of the writing width. Leave it blank or add lines. The notes column can be lined, dotted, squared, or blank. Choose the distance between notes in millimeters or inches.'],
      ['Summary area', 'Set a height up to 65 mm or enter zero to omit it. Choose blank space, lines, or squares with their own spacing. For example, pair 8 mm lecture notes with a 4 mm summary grid for small diagrams.'],
    ],
    useCases: [
      ['Review a lecture', 'Write a question beside each main idea. Cover the right column the next day and answer the questions aloud.'],
      ['Work through a science problem', 'Put the formula in the cue column, show the calculation on squared paper, and use the summary to explain what the result means.'],
      ['Take reading notes', 'Record a page number or keyword on the left and the supporting passage on the right. Use the bottom section for your own interpretation.'],
    ],
    faq: [
      ['How wide should I make the cue column?', 'Try 25% for keywords or page references. Choose 35% if you want to write a full review question beside each topic.'],
      ['Can I put a diagram under lined notes?', 'Yes. Choose Lined for the notes area and Square grid under Summary area. The summary has its own spacing control.'],
      ['Can I make continuation sheets without a summary?', 'Set the summary height to zero. Both columns then extend to the bottom margin.'],
    ],
  },
  music: {
    heading: 'Free Printable Music Staff Paper',
    intro: 'Music staff paper, also called manuscript paper, gives you five lines for writing pitches. Print single staves for a melody, paired treble and bass staves for piano, or tablature with one line for each string.',
    featuresHeading: 'What can you customize on your sheet music?',
    features: [
      ['Staff layout', 'Start with piano, organ with pedals, choir with or without piano, guitar or bass TAB, or single-line percussion. Edit individual staves to set their clefs, line counts, heights, and spacing. Add a brace for a pair or a bracket across a section.'],
      ['Clefs and signatures', 'Start with a blank staff or print treble, bass, alto, tenor, or percussion clefs. Pitched staves repeat the key signature at the start of each system. Print a numeric time signature, common time (C), or cut time (¢) on notation and TAB. Show it on the first system or every system. Percussion staves offer two-bar and rectangle clefs.'],
      ['Space for the player', 'Set the distance between neighboring staff lines from 1.5 to 4 mm. Choose how many complete systems you want per page. Spread systems evenly down the page or set a fixed gap in millimeters. Set each margin independently to leave room for a binder or notes.'],
      ['Title and lyrics', 'Print title and composer fields above the first system and choose which voices need space for lyrics. Enable part names in Edit staves to label the first system on each sheet.'],
      ['Bar lines', 'Leave a system open or divide it into up to 16 measures. In Staff + TAB, the bar lines align so the fingering sits under the corresponding notes.'],
    ],
    useCases: [
      ['Write a piano part', 'Use the grand staff for the right and left hands. Add a meter and four measures per system to sketch a short phrase.'],
      ['Transcribe a guitar riff', 'Choose Guitar staff + TAB. Write the rhythm and pitches above and the fret numbers below.'],
      ['Teach note placement', 'Use a single treble staff with 4 mm spaces and fewer staves per page to make room for large noteheads and pencil corrections.'],
    ],
    faq: [
      ['Can I print blank five-line staves without any symbols?', 'Yes. Choose the Blank staff template and leave Measures per system at zero.'],
      ['How do I print four-string bass TAB?', 'Choose Bass TAB under Guitar & bass. Choose Bass staff + TAB to add a bass clef staff above the four strings.'],
      ['How can I leave space for lyrics?', 'Open Staves per page (Systems per page for multiple staves) and enable Lyric lines. In a voice and piano layout, the line goes below the singer. In a choir, select the voices that need lyrics.'],
    ],
  },
  calligraphy: {
    heading: 'Free Calligraphy Guide Sheet Generator',
    intro: 'A calligraphy guide sheet gives you a baseline for the letters to sit on, a waistline for their lowercase bodies, and slant lines to follow with the pen. Print a sheet to write on or place it beneath translucent practice paper.',
    featuresHeading: 'What can you customize on your writing guides?',
    features: [
      ['Letter heights and proportions', 'Choose a ratio and set the x-height in millimeters. With a 5 mm x-height and a 2:1:2 ratio, the ascender, body and descender are 10, 5 and 10 mm tall. For a broad-edge pen, choose Custom, enter the nib width and set how many nib widths each zone occupies.'],
      ['X-Lines (horizontal)', 'Give the ascender, waistline, baseline and descender their own line styles. Mark the baseline in a contrasting color, shade the lowercase band, or mark each baseline with a small X inside the row. Select All to label the ascender and descender zones. On custom rulings, All prints a nib-width scale at the left edge.'],
      ['Y-Lines (vertical)', 'Set the spacing and darkness of the vertical guides. Choose solid, dashed or dotted lines.'],
      ['Slant lines', 'Set up to two stroke angles, each with its own spacing, darkness and line style. Spacing is the shortest distance between neighboring parallel lines.'],
      ['Practice templates', 'Open Templates to start with a pointed-pen or broad-edge layout, an envelope address, a square grid or oval drills. For broad-edge practice, subdivide the x-height into equal nib widths. For addresses, add a figure guide at one and a half times the x-height.'],
      ['Printed sheet', 'Set side margins separately from top and bottom margins. Add the guide dimensions, a date field, or both to the printed page.'],
    ],
    useCases: [
      ['Practise Copperplate downstrokes', 'Start with the 55° preset. Write parallel strokes across the group and check their inclination against the slant lines.'],
      ['Set up for a broad-edge nib', 'If your exercise calls for an x-height of five nib widths, a 2 mm nib needs a 10 mm x-height. Set the letter proportions to match your exemplar.'],
      ['Address an envelope', 'Choose Envelope address to give house numbers a taller guide above the lowercase letters. Print the sheet at actual size and slip it inside a translucent envelope.'],
      ['Prepare a guide for a light pad', 'Choose a darker line color and raise the slant guide strength until the guides show through your writing paper.'],
    ],
    faq: [
      ['Where is x-height measured?', 'Measure from the baseline to the waistline. A lowercase x fills that band. Ascenders rise above it and descenders extend below the baseline.'],
      ['Is the slant measured from vertical or horizontal?', 'The angle starts at the horizontal baseline. At 55° the guides lean to the right as they rise. At 90° they are vertical.'],
      ['How do I keep the printed guides exactly 5 mm high?', 'Set x-height to 5 mm and print the PDF at Actual size or 100%. Measure from baseline to waistline with a ruler.'],
    ],
  },
};

const headingStyle = 'text-xl font-semibold tracking-tight text-ink';

function GuideList({ heading, items }) {
  return (
    <section>
      <h2 className={headingStyle}>{heading}</h2>
      <ol className="mt-4 max-w-prose list-decimal space-y-3 pl-6 marker:font-semibold">
        {items.map(([name, detail]) => (
          <li key={name}>
            <strong className="font-semibold">{name}</strong>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function PaperGuide({ type, currentType }) {
  const paperType = type ?? currentType;
  const guide = guides[paperType];
  const generatorName = paperType === 'cornell' ? 'Cornell notes' : PAPER_TYPES[paperType].name.toLowerCase();
  return (
    <article aria-label="About this generator" className="border-t border-[#dfe5d8] bg-[#fafbf8] print:hidden">
      <div className="mx-auto max-w-4xl space-y-10 px-5 py-12 sm:px-10 sm:py-16">
        <section>
          <h2 id="about-this-paper" tabIndex={-1} className={headingStyle}>{guide.heading}</h2>
          <p className="mt-3 max-w-prose text-base leading-relaxed text-muted">{guide.intro}</p>
        </section>
        <GuideList heading={guide.featuresHeading ?? `What features does our ${generatorName} generator support?`} items={guide.features} />
        {guide.useCases && <GuideList heading={`What can you use ${generatorName} for?`} items={guide.useCases} />}
        <section>
          <h2 className={headingStyle}>Have questions?</h2>
          <div className="mt-4 divide-y divide-[#dfe5d8] border-y border-[#dfe5d8]">
            {guide.faq.map(([question, answer]) => (
              <details key={question}>
                <summary className="cursor-pointer py-3.5 text-base font-medium marker:text-muted">{question}</summary>
                <p className="max-w-prose pb-4 text-sm leading-relaxed text-muted">{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
