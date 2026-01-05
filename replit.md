# ResoBingo 2026

A mobile-first Progressive Web App (PWA) for tracking New Year's resolutions in a 5x5 Bingo format.

## Overview
ResoBingo 2026 is a gamified resolution tracker that displays 24 standard resolutions + 1 "Boss Battle" center square. Users tap squares to mark them complete with a digital ink effect.

## Technical Stack
- **Frontend:** React + Vite + TypeScript
- **Styling:** Tailwind CSS (Mobile-first)
- **State:** LocalStorage persistence
- **Libraries:** canvas-confetti (win animations)

## Project Structure
```
client/
├── public/
│   ├── icons/
│   │   ├── icon-192.png      # PWA icon
│   │   └── icon-512.png      # PWA icon
│   ├── apple-touch-icon.png  # iOS icon
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker
│   └── favicon.png
├── src/
│   ├── components/
│   │   ├── ui/               # Shadcn components
│   │   ├── BingoGrid.tsx     # 5x5 grid component
│   │   └── BingoSquare.tsx   # Individual square with ink effect
│   ├── data/
│   │   └── resolutions.ts    # 35 Standard + 12 Boss resolutions
│   ├── lib/
│   │   ├── boardUtils.ts     # Board generation, localStorage, bingo detection
│   │   └── utils.ts
│   ├── pages/
│   │   └── home.tsx          # Main game page
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
└── index.html                # PWA meta tags, iOS support
```

## Key Files
- **Manifest:** `/client/public/manifest.json`
- **Icons:** `/client/public/icons/` and `/client/public/apple-touch-icon.png`
- **Grid Renderer:** `/client/src/components/BingoGrid.tsx`
- **Resolution Data:** `/client/src/data/resolutions.ts`

## Features
- PWA installable on iOS and Android
- 5x5 bingo grid with unique resolutions
- Center square is "Boss Battle" (harder resolution)
- Digital ink stamp effect with mix-blend-mode: multiply
- LocalStorage persistence (board + marks survive refresh)
- Confetti animation on bingo win
- "New Card" and "Reset Progress" controls

## Development
The app runs on port 5000 via `npm run dev`.
