# ChartForge

A Think-Cell competitor for power users who need McKinsey / BCG / Bain exhibits and don’t have time to draw them.

Upload a **PPTX**. ChartForge reads the slides, pastes **native** waterfalls, clustered/stacked bars, Mekkos, combos, Gantts — and keeps every value editable. Download is a real PowerPoint file (Office charts + labeled shapes), not a flattened image.

## Why not screenshots

Think-Cell wins because the chart is an object: change 412 to 430 and the bar moves. ChartForge does the same.

- **In the browser:** live data sheet (add rows/series, edit labels and numbers, the slide redraws)
- **In PowerPoint:** clustered/stacked/100% bars, lines, pies, combos, and Excel-style waterfalls are **native charts** (right-click → Edit Data)
- Mekko, Gantt, tornado, funnel export as **shapes with editable text**
- Re-open the downloaded PPTX in ChartForge and the data round-trips (`ppt/chartforge/deck.json` + slide notes)

## Workflow

1. **Open PPTX** — filmstrip of your slides, original text preserved
2. **AI-fill the deck** (Gemini) or **insert** a waterfall / clustered bar / Mekko yourself
3. Edit the action title, subtitle, source, and every cell
4. **Download PPTX (native)** — partner-ready 16:9, firm palettes (McKinsey, BCG, Bain)

Gallery exhibits work with no API key. AI fill needs a [Gemini key](https://aistudio.google.com/apikey) stored only in your browser.

```bash
npm install
npm run dev
```

## Chart set

Waterfall / stacked waterfall · stacked & 100% stacked columns · clustered columns · ranked bars · tornado · Marimekko · line + CAGR · stacked area · pie/donut · bubble map · combo · funnel · Gantt

## Stack

React, Vite, D3, pptxgenjs, JSZip, SheetJS, Gemini 2.5 Pro.
