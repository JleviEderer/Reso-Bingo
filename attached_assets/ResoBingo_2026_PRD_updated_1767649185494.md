# Product Requirements Document: ResoBingo 2026

## 1. Executive Summary
**Product:** ResoBingo 2026
**Type:** Mobile-First Progressive Web App (PWA)
**Goal:** A viral, gamified tool for tracking New Year's resolutions in a 5x5 Bingo format.
**Business Objective:** Serve as a viral marketing funnel for the "Compounded" habit tracker.

## 2. Technical Stack
* **Frontend:** React (Vite)
* **Styling:** Tailwind CSS (Mobile-first utility classes)
* **State Management:** React Context API
* **Persistence:** LocalStorage (Browser-based save state)
* **Key Libraries:**
    * `canvas-confetti` (Win state animation)
    * `html2canvas` (Export card to image)

## 3. Core Features & Functionality

### A. The Grid (The Game Board)
* **Layout:** Standard 5x5 Bingo grid.
* **Responsiveness:** Must fit vertically on a mobile screen without scrolling.
* **Content Logic:**
    * **Squares 1-12 & 14-25:** Populated randomly from a `StandardResolutions` list (e.g., "Read 5 books", "Drink more water").
    * **Square 13 (Center):** This is **NOT** a free space. It is the **"Boss Battle"**. It must populate from a separate `HardModeResolutions` list (e.g., "Run a Marathon", "Save $10k").
    * **Randomization Rules (Deterministic):**
        * The board must contain **24 unique** items from `StandardResolutions` + **1** center item from `HardModeResolutions` (Square 13).
        * **No duplicates** are allowed on the same board.
        * If the lists are too short (e.g., <24 Standard or <1 Hard), the app must **fail gracefully** by showing an in-app error state (and optionally a "Regenerate" button) rather than rendering duplicates silently.

    * **Visual Distinction:** The Center Square must have a distinct border (Gold/Red) or icon to signify difficulty.

### B. "Digital Ink" Interaction (The Design)
* **Action:** Tapping a square toggles it between **"Unmarked"** and **"Marked"** (avoid ambiguous terms like "Active").
* **Visual Style (Crucial):** Do not use checkboxes or solid fills. Simulate a **Bingo Dabber/Ink Stamp**.
    * **CSS Implementation:** Use a semi-transparent colored circle (e.g., `bg-red-500` at 50% opacity) layered *over* the text.
    * **Blend Mode:** Use `mix-blend-mode: multiply` so the text remains legible and looks like ink soaking into paper.
    * **Animation:** A quick "scale-in" bounce effect when clicked.

### C. Win State & Upsell
* **Logic:** Detect 5 completed squares in any row, column, or diagonal.
* **Trigger:** Upon achieving Bingo:
    1.  Fire `canvas-confetti` explosion.
    2.  Open a **"Momentum Modal"**.
* **Modal Content:**
    * **Headline:** "BINGO! You've got momentum."
    * **Subtext:** "Don't let it fade. Track your daily progress with the pro tool."
    * **Primary Action:** Button labeled "Keep it going with Compounded" (Link to external waitlist/site).
    * **Secondary Action:** "Close & Share My Card".


### D. Share / Export
* **Goal:** Let users export a shareable image of their current card state.
* **Implementation:** Use `html2canvas` to export the card to a PNG.
* **Export Contents (Acceptance Criteria):**
    * Includes the full 5x5 grid (with inked/marked state visible).
    * Includes the app title "ResoBingo 2026" at the top.
    * Includes the date generated (e.g., "Generated Jan 5, 2026") at the bottom.
    * If the user has achieved Bingo, include a small "BINGO ✅" badge on the export.
    * Optional (recommended for funnel): include a subtle footer watermark: "Try Compounded →" (non-intrusive).
* **Output:** After export, show the image preview and provide a one-tap "Save Image" / "Share" flow as supported by the browser.

### E. Persistence
* The app must save the current board configuration (assigned resolutions) and the completion status of each square to `localStorage`.
* On refresh/re-open, the user's specific bingo card and progress must be restored.

### F. Controls (New Card / Reset)
* **New Card:** Generates a brand-new randomized board (24 Standard + 1 Boss). This action must also reset all marked states.
* **Reset Progress:** Keeps the current board text but clears all marked/unmarked states.
* **Persistence Behavior:**
    * `New Card` overwrites the saved board + marks in `localStorage`.
    * `Reset Progress` overwrites only the saved marks in `localStorage`.


## 4. Asset Data (Sample)
* **Standard Resolutions:** [ "Call Mom weekly", "No takeout for a month", "Walk 10k steps", "Digital Detox weekend", "Learn to cook 5 meals" ]
* **Boss/Hard Mode Resolutions:** [ "Run a Marathon", "Quit Caffeine", "Save $10,000", "Learn a new language", "Code a SaaS App" ]

## 5. Mobile Optimization
* The UI must be designed touch-first (min target size 44px).
* Disable browser zooming on double-tap to ensure it feels like a native app.
## 6. PWA Technical Requirements (Crucial)
The app must be installable on iOS and Android. The agent must generate:
* **manifest.json:** Must include:
    * `"display": "standalone"` (Removes browser URL bar).
    * `"background_color": "#ffffff"`.
    * `"theme_color"` matching the brand.
    * Standard icon set (192x192, 512x512).
* **Service Worker:** A basic offline-capable service worker so the app loads instantly on repeat visits.
* **iOS Meta Tags:** In `index.html`, include:
    * `<meta name="apple-mobile-web-app-capable" content="yes">`
    * `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
    * `<link rel="apple-touch-icon" ... >`