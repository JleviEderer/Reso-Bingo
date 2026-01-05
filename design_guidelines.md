# ResoBingo 2026 Design Guidelines

## Design Approach

**Reference-Based Approach**: Drawing inspiration from successful mobile game UIs (Wordle, Duolingo) and social sharing apps (Instagram, BeReal) that balance playfulness with clarity. The aesthetic should feel **tactile, immediate, and shareable** – like a physical bingo card brought to digital life.

**Core Principle**: Digital minimalism meets analog warmth. Clean interface that gets out of the way of the core interaction (tapping squares), with personality emerging through the "digital ink" effect and celebratory moments.

---

## Typography

**Font Stack**: 
- Primary: Inter or system-ui (clean, highly legible on mobile)
- Accent: DM Sans or Poppins for headings (slightly rounded, friendly)

**Hierarchy**:
- App Title: text-2xl font-bold tracking-tight
- Resolution Text (Grid): text-sm font-medium leading-tight (crucial: must remain readable under ink overlay)
- Boss Square Text: text-sm font-bold
- Modal Headlines: text-3xl font-bold
- Modal Body: text-base font-normal
- Buttons: text-sm font-semibold uppercase tracking-wide
- Metadata (dates, badges): text-xs font-medium

---

## Layout System

**Spacing Primitives**: Tailwind units of **2, 4, 8, 16** (p-2, m-4, gap-8, py-16)

**Mobile-First Grid (Primary Screen)**:
- Safe area padding: px-4 py-6
- App header: mb-8
- Bingo grid container: aspect-square max-w-md mx-auto (forces square ratio)
- Grid gaps: gap-2 (tight, like physical bingo card)
- Controls/actions: mt-8 space-y-4

**Touch Targets**: Minimum 44x44px (each grid square should be ~60-70px on standard mobile)

---

## Component Library

### A. Bingo Grid
**Structure**: 
- Container: `grid grid-cols-5 gap-2 aspect-square`
- Individual squares: `relative aspect-square rounded-lg overflow-hidden`
- Boss square (center): Additional `ring-4 ring-offset-2` treatment for emphasis

**Square Composition**:
- Background layer (base card)
- Text layer: `absolute inset-0 flex items-center justify-center p-2 text-center`
- Ink overlay layer: `absolute inset-0 pointer-events-none` (contains the circular stamp)

**Digital Ink Effect**:
- Shape: Circular overlay using `rounded-full` at 85-90% of square size
- Position: Centered with flex/grid centering
- Blend mode: `mix-blend-mode-multiply` on the ink circle
- Animation: `animate-bounce` (single bounce) or custom scale-in spring animation on mark
- Must maintain text legibility – semi-transparent circle, not solid fill

### B. Header Section
- App title centered with subtle icon/emoji (🎯 or similar)
- Tagline underneath: "Your 2026 Resolution Tracker"
- Total: h-24 with items-center justify-center

### C. Action Controls
**Layout**: Fixed horizontal row with gap-2
- "New Card" button (secondary style)
- "Reset Progress" button (ghost/outline style)
- Both equal width on mobile, stack on very small screens

**Button Specs**:
- Height: h-12
- Padding: px-6
- Border radius: rounded-full (pill shape for friendly feel)
- Typography: As specified above

### D. Win State Modal
**Structure**:
- Full-screen overlay with backdrop blur
- Modal card: max-w-sm mx-4 rounded-2xl
- Padding: p-8
- Confetti layer renders behind modal

**Content Stack** (top to bottom):
- Celebration icon/emoji: text-6xl mb-4
- Headline: mb-2
- Subtext: mb-8
- Primary CTA button: w-full h-14 mb-3
- Secondary action link: text-center

### E. Share/Export Preview
**Export Canvas Composition**:
- White background with padding equivalent to p-8
- App title at top
- Grid (with current ink states visible)
- Date stamp at bottom: text-xs
- If bingo achieved: small badge in top-right
- Subtle watermark footer (non-intrusive)

---

## Animations

**Use Sparingly**:
- Ink stamp: 200ms scale transform (0.8 → 1.0) with ease-out
- Win confetti: Canvas-confetti library defaults
- Modal entrance: 300ms fade + slide-up
- Grid generation: Optional subtle stagger on new card (50ms per square)

**Avoid**: Continuous animations, parallax, hover effects (touch interface)

---

## Mobile-Specific Details

- Disable text selection on grid squares: `select-none`
- Prevent double-tap zoom: Add viewport meta tag
- Active state feedback: Brief scale-down (95%) on tap for all buttons
- Grid must occupy 70-80% of viewport height to avoid scrolling
- Bottom nav/controls always visible (no hidden drawer)

---

## Accessibility

- Each square includes `role="button"` and `aria-pressed` state
- Boss square includes `aria-label` indicating difficulty level
- Modal implements proper focus trap
- Sufficient contrast for text over ink overlay (test at 50% opacity minimum)

---

## Images

**Not Applicable**: This is a utility app with no hero section. The bingo grid IS the hero. All visual interest comes from typography, the grid layout, and the digital ink interaction effect.