# AlbFinder Design System

## 1. Brand direction

**Positioning:** premium B2B intelligence dashboard for UK company and director discovery.

**Design personality:**
- modern
- analytical
- premium
- calm
- high-trust
- dense but breathable

**Visual references:** Linear, Stripe Dashboard, Vercel, Attio, modern data tools.

**Core design principles:**
1. Hierarchy over decoration.
2. Density without clutter.
3. One accent, not many competing accents.
4. Flat, refined surfaces over heavy nested cards.
5. Consistent spacing and sizing everywhere.
6. Light and dark mode should feel equally designed.

---

## 2. Product UI goals

AlbFinder should feel like:
- a premium research platform
- fast to scan
- trustworthy with financial and entity data
- clear for high-volume workflows
- polished enough for paid B2B users

The interface should optimize for:
- quick scanning of lists
- confidence in scores
- obvious next actions
- reduced visual noise
- smooth switching between dashboard, table, and detail pages

---

## 3. Layout system

### App shell
- Top nav height: **64px**
- Desktop content max width: **1440px**
- Page horizontal padding: **24px**
- Large desktop padding: **32px**
- Section gap: **24px**
- Card gap: **16px**

### Grid
Use a **12-column grid**.

Recommended page patterns:

#### Dashboard page
- top stats: 4 equal cards
- search/filter row below
- table full-width below

#### Detail page
- top hero summary spans full width
- main content in **8 / 4 split**
  - left: core company/director info, financials, contacts
  - right: scores, actions, quick links, alerts
- lower sections full width when needed

### Density rules
- Never nest more than **2 surface levels**
- Avoid card-inside-card-inside-card
- Prefer spacing and typography before adding extra separators

---

## 4. Spacing system

Use an **8px base spacing scale**.

### Spacing tokens
- `space-1`: 4px
- `space-2`: 8px
- `space-3`: 12px
- `space-4`: 16px
- `space-5`: 20px
- `space-6`: 24px
- `space-8`: 32px
- `space-10`: 40px
- `space-12`: 48px

### Usage rules
- page section spacing: 24–32px
- card padding: 20–24px
- compact card padding: 16px
- grid gap: 16px
- row vertical padding: 12–14px
- chip horizontal padding: 10–12px
- form control height: 36–40px

### Rhythm rules
- use 24px between major sections
- use 16px between related blocks
- use 8px between label/value micro elements
- do not use arbitrary spacing values unless necessary

---

## 5. Border radius system

### Radius tokens
- `radius-xs`: 6px
- `radius-sm`: 8px
- `radius-md`: 10px
- `radius-lg`: 14px
- `radius-xl`: 16px
- `radius-pill`: 999px

### Recommended usage
- buttons / inputs / badges: 8px
- dropdowns / popovers: 12px
- cards: 14px
- modal/dialog: 16px
- pills/status chips: full pill

Rule: keep radius consistent across the product so it feels designed, not improvised.

---

## 6. Typography system

### Font family
Recommended priority:
1. **Inter**
2. **Geist**
3. system sans fallback

### Typography goals
- readable at high density
- clean and neutral
- strong title hierarchy
- muted but clear metadata

### Type scale

#### Display / page title
- `text-display-sm`: 24px / 32px / 700
- `text-display-md`: 28px / 36px / 700

#### Section titles
- `text-section`: 15px / 22px / 600

#### Body
- `text-body-sm`: 13px / 20px / 500
- `text-body`: 14px / 22px / 500
- `text-body-strong`: 14px / 22px / 600

#### Supporting text
- `text-meta`: 12px / 18px / 500
- `text-caption`: 11px / 16px / 500

#### Metric values
- `text-metric-sm`: 20px / 24px / 700
- `text-metric`: 28px / 32px / 700
- `text-metric-lg`: 32px / 36px / 700

### Typography rules
- avoid excessive all-caps
- use uppercase only for tiny labels or overlines
- use tabular numbers for metrics and tables
- labels should be muted, values should be clear
- avoid using more than 3 font sizes inside one card

---

## 7. Color system

Build with semantic design tokens, not hardcoded colors in components.

## 7A. Dark mode palette

### Neutrals
- `bg.canvas`: `#0B1020`
- `bg.subtle`: `#0F172A`
- `bg.surface`: `#111827`
- `bg.surface-2`: `#162033`
- `bg.elevated`: `#1A2540`

- `border.subtle`: `#23314D`
- `border.strong`: `#31415F`

- `text.primary`: `#F3F7FF`
- `text.secondary`: `#B6C2D9`
- `text.tertiary`: `#7F8CA6`
- `text.disabled`: `#5F6B82`

### Brand / accent
Use one cool premium accent.
- `accent.default`: `#7C8CFF`
- `accent.hover`: `#93A0FF`
- `accent.active`: `#6C7BEB`
- `accent.soft`: `rgba(124, 140, 255, 0.14)`
- `accent.soft-border`: `rgba(124, 140, 255, 0.28)`

### Semantic
#### Success
- `success.default`: `#3CCB7F`
- `success.soft`: `rgba(60, 203, 127, 0.14)`
- `success.border`: `rgba(60, 203, 127, 0.28)`

#### Warning
- `warning.default`: `#F2B94B`
- `warning.soft`: `rgba(242, 185, 75, 0.14)`
- `warning.border`: `rgba(242, 185, 75, 0.28)`

#### Danger
- `danger.default`: `#F26B5E`
- `danger.soft`: `rgba(242, 107, 94, 0.14)`
- `danger.border`: `rgba(242, 107, 94, 0.28)`

#### Info
- `info.default`: `#4DA3FF`
- `info.soft`: `rgba(77, 163, 255, 0.14)`
- `info.border`: `rgba(77, 163, 255, 0.28)`

## 7B. Light mode palette

### Neutrals
- `bg.canvas`: `#F5F7FB`
- `bg.subtle`: `#EEF2F8`
- `bg.surface`: `#FFFFFF`
- `bg.surface-2`: `#F8FAFC`
- `bg.elevated`: `#FFFFFF`

- `border.subtle`: `#E2E8F0`
- `border.strong`: `#CBD5E1`

- `text.primary`: `#0F172A`
- `text.secondary`: `#475569`
- `text.tertiary`: `#64748B`
- `text.disabled`: `#94A3B8`

### Brand / accent
- `accent.default`: `#5B6BFF`
- `accent.hover`: `#485AF5`
- `accent.active`: `#3F4FE0`
- `accent.soft`: `rgba(91, 107, 255, 0.10)`
- `accent.soft-border`: `rgba(91, 107, 255, 0.20)`

### Semantic
#### Success
- `success.default`: `#1FA463`
- `success.soft`: `rgba(31, 164, 99, 0.10)`
- `success.border`: `rgba(31, 164, 99, 0.20)`

#### Warning
- `warning.default`: `#C98A13`
- `warning.soft`: `rgba(201, 138, 19, 0.10)`
- `warning.border`: `rgba(201, 138, 19, 0.20)`

#### Danger
- `danger.default`: `#D94A3A`
- `danger.soft`: `rgba(217, 74, 58, 0.10)`
- `danger.border`: `rgba(217, 74, 58, 0.20)`

#### Info
- `info.default`: `#2563EB`
- `info.soft`: `rgba(37, 99, 235, 0.10)`
- `info.border`: `rgba(37, 99, 235, 0.20)`

### Color usage rules
- Do not use accent color for everything clickable.
- Use semantic colors only for meaning.
- Most UI should remain neutral.
- In dark mode, rely more on surface contrast than saturated fills.
- In light mode, use subtle borders and minimal shadows.

---

## 8. Elevation, borders, and shadows

### Border rules
Use borders as your primary separation mechanism.

- card border: `1px solid var(--border-subtle)`
- hover border: `1px solid var(--border-strong)`
- internal divider: only when necessary

### Shadows
Dark mode:
- very minimal shadow only on modals, dropdowns, and sticky bars

Light mode:
- subtle low-blur shadows allowed on elevated cards or floating panels

### Example shadow tokens
- `shadow-sm`: `0 1px 2px rgba(0,0,0,0.06)`
- `shadow-md`: `0 8px 24px rgba(15, 23, 42, 0.08)`
- `shadow-lg`: `0 16px 40px rgba(15, 23, 42, 0.12)`

Rule: cards should not look puffy.

---

## 9. Motion and interaction

### Motion principles
- subtle
- quick
- never decorative for its own sake
- should improve clarity

### Timing
- hover transitions: 120–160ms
- panel expand/collapse: 180–220ms
- page/state transitions: 180ms

### Interaction patterns
- hover: slight surface shift or border brighten
- active: tiny scale reduction or darker background
- focus: visible accent ring
- accordion: smooth reveal, not jumpy

### Focus style
- `outline: 2px solid accent`
- `outline-offset: 2px`
- must be visible in both themes

---

## 10. Component standards

## 10A. Buttons

### Sizes
- small: 32px height
- default: 36px height
- large: 40px height

### Variants
#### Primary
Use sparingly for the most important action only.
- accent background
- high-contrast text

#### Secondary
- surface background
- subtle border
- primary text

#### Ghost
- transparent background
- muted text
- hover surface

#### Destructive
- danger soft background
- danger text
- subtle danger border

### Rules
- do not place multiple primary buttons side-by-side
- icon-only buttons must match input/button heights
- all buttons should have same radius and vertical alignment

## 10B. Inputs and search

### Search bar
- height: 40px desktop
- left icon
- generous horizontal padding
- muted placeholder
- subtle border
- clear focus ring

### Filter controls
- primary filters visible inline
- advanced filters in popover or drawer
- keep filter pills compact and easy to clear

### Rules
- input controls should align visually with buttons
- avoid overly dark inner fields in dark mode

## 10C. Cards

### Card anatomy
- optional overline / title
- main content
- optional footer/actions
- consistent padding and spacing

### Card types
#### Metric card
- large number
- short label
- optional context line
- minimal chrome

#### Detail card
- grouped information
- clean spacing
- reduced dividers

#### Insight card
- score / status + short explanation
- optional CTA

### Rules
- no more than one visual emphasis pattern per card
- reduce nested mini-cards unless needed for metrics

## 10D. Badges and pills

### Badge types
- status
- score
- enriched/source
- warning

### Style
- pill radius
- 11–12px text
- medium weight
- soft background with semantic text

### Rules
- keep badges compact
- avoid random badge colors
- do not mix outlined and filled badges without a rule

## 10E. Tables

This is one of the most important AlbFinder surfaces.

### Table styling
- row height: 52px default
- compact version: 44px
- header height: 40–44px
- sticky header preferred
- optional sticky first column if needed

### Content hierarchy by column
1. Director / company identity
2. status / score
3. numeric signals
4. metadata
5. actions

### Visual rules
- numbers right-aligned
- use tabular numerals
- hover row background shift
- selected row state
- subtle row dividers only
- first columns should feel stronger than trailing metadata

### Action column
- use either explicit text actions or icons shown on hover
- avoid lonely tiny icons with unclear affordance

## 10F. Drawers / popovers / modals
- use elevated surface
- stronger shadow than cards
- 16px radius
- 20–24px padding
- clear close affordance
- preserve keyboard focus and escape support

---

## 11. Score system and data visualization

AlbFinder relies heavily on confidence, health, enrichment, and quality.
These must feel systematic.

### Score palette
- 80–100: success
- 60–79: yellow-green / warning leaning success
- 40–59: warning
- 20–39: orange-danger
- 0–19: danger

### Score display patterns
#### Compact pill
For lists and cards.
- score number
- semantic color
- optional label

#### Progress bar
For detail pages.
- muted track
- colored fill
- score at right

#### Subscore cards
For data quality breakdown.
- title
- score/value
- optional explanation

### Rules
- use one score mapping across the whole app
- do not use different colors for the same score bucket
- support color with labels, not color alone

---

## 12. Page-level patterns

## 12A. Dashboard / list page

### Structure
1. top toolbar / nav
2. stat cards row
3. search + quick filters row
4. table controls row
5. main results table
6. pagination / footer tools

### Recommendations
- make stats cards simpler and more premium
- search should be the dominant input on the page
- filters should not feel jammed into the search row
- table should own the page visually

## 12B. Detail page

### Hero summary block
This should be cleaner and more powerful than the current version.

Include:
- entity name
- company name
- status
- health score
- data quality score
- last updated
- primary actions

### Main sections
- Overview
- Financial snapshot
- Contact footprint
- Data quality
- Source links / registry links
- Related people / companies if available

### Recommendations
- convert dense field lists into 2-column or 3-column grids
- group metadata logically
- use accordions for low-priority sections
- promote contact/enrichment data because it is high-value

---

## 13. Content design rules

### Labels
- short and plain English
- avoid jargon where possible
- keep consistent naming across pages

### Values
- use formatting for readability
- dates should be consistent
- currency should always use same style
- missing data should use one standard pattern

### Missing data states
Use one approach consistently:
- em dash for empty numeric cells
- “No email found” / “No website found” for section-level absence
- muted text, not bright placeholder text

### Empty states
Should include:
- clear explanation
- optional next action
- no blame language

---

## 14. Light/dark mode implementation rules

### General
- both themes must share same spacing, typography, and component sizes
- only colors, shadows, and border contrast should change
- do not redesign layout between themes

### Dark mode
- use low-saturation surfaces
- avoid black-on-black flattening
- keep text contrast strong
- reserve bright colors for meaning only

### Light mode
- use soft gray canvas, not harsh pure white everywhere
- cards should be white or near-white
- borders should be visible but subtle
- allow slightly stronger shadows than dark mode

---

## 15. Accessibility standards

### Contrast
- all body text must meet readable contrast
- badges and pills must remain legible
- score bars must not rely only on color

### Keyboard
- all controls must be focusable
- table row actions must be keyboard-accessible
- menus and drawers must trap focus correctly when open

### Interaction
- hit area for icon buttons: minimum 32x32px
- avoid tiny action icons in dense tables without text or tooltip

### Motion
- respect reduced-motion preference

---

## 16. Tailwind token recommendation

Example approach:

### CSS custom properties
Define theme variables at root and `.dark`.

```css
:root {
  --bg-canvas: 245 247 251;
  --bg-surface: 255 255 255;
  --bg-surface-2: 248 250 252;
  --border-subtle: 226 232 240;
  --border-strong: 203 213 225;
  --text-primary: 15 23 42;
  --text-secondary: 71 85 105;
  --text-tertiary: 100 116 139;
  --accent: 91 107 255;
  --success: 31 164 99;
  --warning: 201 138 19;
  --danger: 217 74 58;
}

.dark {
  --bg-canvas: 11 16 32;
  --bg-surface: 17 24 39;
  --bg-surface-2: 22 32 51;
  --border-subtle: 35 49 77;
  --border-strong: 49 65 95;
  --text-primary: 243 247 255;
  --text-secondary: 182 194 217;
  --text-tertiary: 127 140 166;
  --accent: 124 140 255;
  --success: 60 203 127;
  --warning: 242 185 75;
  --danger: 242 107 94;
}
```

### Tailwind naming direction
Recommended semantic utility classes or component classes:
- `bg-canvas`
- `bg-surface`
- `bg-surface-2`
- `border-subtle`
- `border-strong`
- `text-primary`
- `text-secondary`
- `text-tertiary`
- `text-accent`
- `bg-accent-soft`
- `bg-success-soft`
- `bg-warning-soft`
- `bg-danger-soft`

---

## 17. AlbFinder-specific UI recommendations

### A. Simplify top stats cards
Current cards feel generic and too boxed.

Improve by:
- larger value
- quieter label
- less icon emphasis
- stronger spacing
- optional trend/context text

### B. Rework detail hero
Current top area is fragmented.

New hero should show:
- name + company
- status chip
- health score pill
- DQ score pill
- last updated
- primary actions

### C. Improve Contact Details section
This is valuable differentiator data.

Make it feel premium:
- display email/phone/website as clean chips
- show confidence elegantly
- group source links separately
- show verified/trading premise states as calm semantic badges

### D. Rework Data Quality card
Instead of a dense breakdown block:
- top line: score + summary sentence
- progress bar
- 2–4 mini score cards
- details in expandable section

### E. Reduce separators in company/director info
Replace long stacked line dividers with:
- grouped info clusters
- 2-column field grid
- better label/value contrast

---

## 18. Suggested component inventory to standardize first

1. app shell / header
2. page title block
3. metric card
4. section card
5. status badge
6. score pill
7. search input
8. filter pill
9. primary / secondary / ghost button
10. data table
11. empty state
12. score bar
13. detail field group
14. contact chip
15. accordion section

Once these are standardized, the whole app will feel far more cohesive.

---

## 19. Visual anti-patterns to avoid

Do not:
- use too many shades of blue-gray without purpose
- put every piece of content inside its own hard box
- use too many tiny icons
- rely on dividers for every row
- mix many border radii
- use multiple competing highlight colors
- cram filters and controls too tightly
- make important scores too visually similar to secondary metadata
- overuse uppercase labels

---

## 20. MVP redesign priority order

If redesigning in phases, do it in this order:

### Phase 1: tokens
- colors
- typography
- spacing
- radius
- shadows
- border styles

### Phase 2: shared components
- button
- input
- card
- badge
- table
- score displays

### Phase 3: page patterns
- dashboard/list page
- detail page hero
- detail section layout
- filter drawer

### Phase 4: polish
- hover states
- transitions
- empty states
- loading states
- mobile/responsive refinement

---

## 21. One-paragraph design brief

AlbFinder should feel like a premium intelligence platform: dark-first but clean, information-dense but breathable, and visually restrained rather than flashy. Use a refined neutral palette, one clear accent color, strong typography hierarchy, soft bordered surfaces, consistent spacing, and a systematic score language for health, risk, and data quality. The UI should make high-value data like contacts, financial signals, and confidence scores easy to scan while reducing clutter from over-boxing, excessive dividers, and inconsistent emphasis.
