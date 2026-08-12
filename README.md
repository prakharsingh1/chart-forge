# ChartForge

Think-Cell for people who don’t want to draw the chart. Brief the AI like an engagement manager: it picks the exhibit, writes the action title, reconciles the bridge, labels every bar, and exports a 16:9 slide.

## What it is

A consulting chart studio — McKinsey / BCG / Bain visual language — not a generic dashboard.

- **Waterfall / bridge** with connectors and reconciling totals
- **Stacked waterfall**, **Mekko**, **100% stacked**, **tornado**
- **Line + CAGR**, **combo** (columns + margin line)
- **Gantt** with milestones
- **Scatter / bubble** with quadrant lines
- Live **data sheet** (edit numbers, the slide redraws)
- Export **PowerPoint, PNG, SVG, Excel**
- Palettes: McKinsey, BCG, Bain, Think-Cell, mono

## How to use it

```bash
npm install
npm run dev
```

1. Open a **signature exhibit** from the gallery (no API key) and edit the data sheet.
2. Or paste a **brief** with real numbers and generate.
3. Or drop **Excel / CSV / PDF**. PDFs are extracted with Gemini.

Generation uses a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey). The key stays in your browser (`localStorage`).

## Brief example

> Build an EBIT bridge FY23–FY24: start 370, volume +14, price +31, mix +17, COGS −28, OpEx +8, end 412. $M. Action title on price/mix, not volume.

## Stack

React, Vite, D3, pptxgenjs, SheetJS, Papa Parse, Gemini 2.5 Pro.
