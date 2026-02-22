# POISA Master Implementation Checklist (UI + UX + Client Logic)

Use this as the execution checklist for all requested updates. Keep existing core behavior intact.

## 0) Global Non-Negotiables (Apply to Every Task)

- [x] Do not change bottom navigation behavior.
- [x] Do not change header structure (logo/date/settings/profile) unless explicitly requested in that task.
- [x] Do not break existing tab navigation or tab behavior.
- [x] Do not change number formatting, existing data sources, or existing calculation logic unless explicitly requested.
- [x] Do not add backend/API calls for these features unless explicitly requested; keep logic client-side.
- [x] Do not modify screens outside the target scope of each task.
- [x] Keep existing Poisa dark theme language:
  - [x] Background `#0D1117`
  - [x] Card `#161B22`
  - [x] Borders `#2A3345`
  - [x] Teal accent `#00C896`
  - [x] Orange `#F5A623`
  - [x] Red `#FF6B6B`

---

## 1) Analytics: Tax Calculator (New Feature)

### 1.1 Placement and Navigation

- [x] Add Tax Calculator as a new tab/card inside Analytics screen.
- [x] Add trigger on Analytics overview: `Tax Calculator` button/card.
- [x] Open as full scrollable screen (not modal).
- [x] Do not alter existing Analytics layout beyond adding this module.

### 1.2 Visual Design Matching

- [x] Use exact Poisa theme colors and card/input/CTA styles.
- [x] Match same pill toggle style used by Overview/Spending/Investing tabs.
- [x] Use same input field style as `Add Expense` modal.
- [x] Use same full-width teal CTA style.

### 1.3 Screen Layout (Top to Bottom)

- [x] Regime toggle with 3 buttons:
  - [x] `New Regime`
  - [x] `Old Regime`
  - [x] `Compare`
- [x] Income Details card:
  - [x] Annual Gross Salary (INR)
  - [x] Other Income (INR)
- [x] Deductions card (visible only in Old/Compare, hidden for New):
  - [x] 80C (cap 150000)
  - [x] 80D Health Insurance (cap 75000)
  - [x] HRA
  - [x] 80CCD(1B) NPS (cap 50000)
  - [x] Home Loan Interest Sec 24 (cap 200000)
  - [x] Other Deductions
- [x] Info pill always visible:
  - [x] New regime text: Standard deduction 75000 auto-applied; zero tax if income <= 1200000 (Rebate 87A)
  - [x] Old regime text: Standard deduction 50000 auto-applied
- [x] Full-width teal CTA: `Calculate Tax ->`
- [x] Results section appears after first calculate:
  - [x] Main Result card
  - [x] Breakdown card
  - [x] Slab Breakup card
  - [x] Comparison card (Compare mode only)

### 1.4 Results Cards Requirements

- [x] Main Result card:
  - [x] Total Tax Payable (large teal)
  - [x] Effective Tax Rate with progress bar
- [x] Breakdown rows:
  - [x] Gross Income
  - [x] Total Deductions
  - [x] Taxable Income
  - [x] Income Tax
  - [x] Rebate 87A
  - [x] Cess 4%
  - [x] Net Tax Payable
  - [x] Monthly TDS
  - [x] Estimated Monthly In-Hand
- [x] Slab Breakup card:
  - [x] Show each slab and corresponding tax amount
- [x] Comparison card (Compare mode only):
  - [x] New vs Old side by side
  - [x] Winner badge
  - [x] Savings amount

### 1.5 Tax Logic (Implement Exactly)

- [x] New Regime FY 2025-26 slabs:
  - [x] 0-400000: 0%
  - [x] 400001-800000: 5%
  - [x] 800001-1200000: 10%
  - [x] 1200001-1600000: 15%
  - [x] 1600001-2000000: 20%
  - [x] 2000001-2400000: 25%
  - [x] Above 2400000: 30%
- [x] New regime standard deduction: 75000
- [x] New regime rebate 87A: full rebate (zero tax) if taxable income <= 1200000

- [x] Old regime slabs:
  - [x] 0-250000: 0%
  - [x] 250001-500000: 5%
  - [x] 500001-1000000: 20%
  - [x] Above 1000000: 30%
- [x] Old regime standard deduction: 50000
- [x] Old regime rebate 87A: up to 12500 if taxable income <= 500000

- [x] Surcharge:
  - [x] Taxable income > 5000000 and <= 10000000: 10% of tax
  - [x] Taxable income > 10000000: 15% of tax
- [x] Cess:
  - [x] 4% on (Tax + Surcharge - Rebate)

- [x] Formula implementation:
  - [x] Taxable Income = Gross + Other Income - Total Deductions
  - [x] Income Tax = slab tax on Taxable Income
  - [x] Tax after Surcharge = Income Tax + Surcharge
  - [x] Tax after Rebate = Tax after Surcharge - Rebate (min 0)
  - [x] Cess = Tax after Rebate * 0.04
  - [x] Total Tax = Tax after Rebate + Cess
  - [x] Effective Rate = Total Tax / Gross Income * 100
  - [x] Monthly TDS = Total Tax / 12
  - [x] Monthly In-Hand = (Gross Income / 12) - Monthly TDS

### 1.6 Edge Cases

- [x] Disable calculate when all fields are empty/zero.
- [x] Auto-cap deduction inputs silently at statutory limits (no error message).
- [x] Divide-by-zero outputs show `--`.
- [x] After first calculate, results auto-update on `onChange`.
- [x] If rebate makes tax zero, show: `Zero Tax - 87A Rebate Applied` in slab section.

### 1.7 Do Not

- [x] Do not change existing Analytics layout outside this addition.
- [x] Do not add backend calls.
- [x] Do not break existing navigation or tabs.

---

## 2) Analytics Visual Improvements (Overview/Spending/Investing Tabs)

### 2.1 Overview Tab

- [x] Merge Invested/EMI/Spent into one unified card.
  - [x] Remove separate stat box borders.
  - [x] Add subtle dividers between stats.
- [x] Make Net Position value much more prominent.
  - [x] Larger font
  - [x] Full-width highlight row with teal glow style
- [x] Replace Net Worth Over Time broken empty state icon.
  - [x] Add clean illustrated empty state
  - [x] Add subtle dashed border

### 2.2 Spending Tab

- [x] Monthly Spending Trend line improvements:
  - [x] Thicker line
  - [x] Larger dots
  - [x] Gradient area fill below line
- [x] Donut chart improvements:
  - [x] Add legend list below donut
  - [x] Include color dots + amounts
  - [x] Sort categories highest to lowest

### 2.3 Investing Tab

- [x] Keep 2x2 stats, but:
  - [x] Make boxes taller
  - [x] Add breathing room/padding
- [x] Tooltip should not block bars:
  - [x] Move tooltip to top/sticky header area above chart
- [x] Goal Progress empty state:
  - [x] Replace broken state with clean empty design

### 2.4 Global Analytics Tab Fixes

- [x] Standardize Overview/Spending/Investing toggle active style:
  - [x] Active = solid teal fill
  - [x] Inactive = muted transparent style
- [x] Add subtle horizontal scroll indicator if tabs overflow.
- [x] Add more top padding for section titles inside cards.

---

## 3) Analytics Screen UI Improvement (8 Independent Fixes)

### Global

- [x] Add `padding-top: 18px` inside every section card title area.
- [x] Standardize analytics tab toggle styles across all tabs:
  - [x] Active background `#00C896`
  - [x] Active text `#0D1117`
  - [x] Inactive background transparent
  - [x] Inactive text `#7A8599`

### Fix 1: Overview Stat Boxes

- [x] Remove 3 separate bordered boxes.
- [x] Use one unified background `#161B22`.
- [x] Add vertical dividers `#2A3345`.
- [x] Each stat: muted small-caps label + bold value.

### Fix 2: Net Position Row

- [x] Make Net Position a dedicated sub-card.
- [x] Background `rgba(0,200,150,0.08)`.
- [x] Border `rgba(0,200,150,0.2)`.
- [x] Value typography: 24px, weight 800, color `#00C896`.
- [x] Label `Net Position` in white.

### Fix 3: Net Worth Over Time Empty State

- [x] Remove broken/plain image icon.
- [x] Add simple upward trend SVG icon in `#2A3345`.
- [x] Center text: `Start adding financial data to track your net worth over time` at 13px muted.
- [x] Dashed border `1px dashed #2A3345`.

### Fix 4: Monthly Spending Trend Chart

- [x] Line stroke width = 3px.
- [x] Point size = 8px with 2px white border.
- [x] Area fill gradient from `rgba(99,102,241,0.3)` to transparent.
- [x] Min container height = 220px.

### Fix 5: Spending by Category Donut

- [x] Keep donut unchanged.
- [x] Add vertical legend list below donut.
- [x] Per row: color dot + category + right-aligned amount.
- [x] Sort by amount descending.
- [x] Style matches existing spending rows.
- [x] Add subtle divider between rows.

### Fix 6: Investing 4 Stat Boxes

- [x] Keep 2x2 grid.
- [x] Increase per-card padding to 18px.
- [x] Increase row gap to 10px.

### Fix 7: Bar Chart Tooltip

- [x] Move tooltip above chart as sticky info bar.
- [x] Do not float over bars.
- [x] Style tooltip card `#1C2230`.
- [x] Goals value teal, investments value purple.
- [x] Show on hover/tap only (not always visible).

### Fix 8: Goal Progress Empty State

- [x] Same empty-state treatment as Fix 3.
- [x] Use target/bullseye SVG in muted color.
- [x] Center text: `Add goals to view progress distribution`.
- [x] `padding: 24px`.
- [x] Muted text `#7A8599`.
- [x] Dashed border like Fix 3.

### Do Not

- [x] No number/data logic changes.
- [x] No bottom nav changes.
- [x] No header changes.
- [x] No non-Analytics screen changes.
- [x] No chart data source/calculation changes.

---

## 4) Spending Declutter + Calculator Hub

### Part 1: Spending Screen Declutter

#### Fix 1: Total Spent Hero Card

- [x] Keep large spent amount and red over-budget text.
- [x] Reduce card padding.
- [x] `TOTAL SPENT` label:
  - [x] font-size 11px
  - [x] letter-spacing 1.2px
- [x] Over-budget line:
  - [x] font-size 13px
  - [x] prepend warning icon

#### Fix 2: Last 3 Months Budget Card

- [x] Split crowded single row into two rows:
  - [x] Row 1: label left, `Set Budget` right
  - [x] Row 2: spent vs budget muted small text
- [x] Keep progress bar as-is.
- [x] Reduce carry-forward pill size:
  - [x] smaller padding
  - [x] font-size 11px

#### Fix 3: Spending by Category Rows

- [x] Increase row spacing (`padding: 12px 0`).
- [x] Increase progress bar height to 4px.
- [x] Track color `#2A3345`.
- [x] Keep fill colors by category.
- [x] Amount style: right-aligned, weight 600, `#E8EDF5`.
- [x] Category style: `#7A8599`, 13px.

### Part 2: Calculator Hub (Scrollable Selector)

#### Placement

- [x] Add `Calculators` card below Spending-by-Category section.
- [x] Also make calculator hub accessible from Analytics screen.
- [x] Use horizontal card selector (not dropdown, not modal list).

#### Design

- [x] Header label: `CALCULATORS` muted uppercase style.
- [x] Horizontal scroll row of cards.
- [x] Card size: 140x100.
- [x] Card style:
  - [x] background `#1C2230`
  - [x] border radius 14px
  - [x] border `1px solid #2A3345`
- [x] Card content:
  - [x] icon top (24px)
  - [x] name 12px semibold white
  - [x] one-line description 10px muted gray
- [x] Active card style:
  - [x] border `1px solid #00C896`
  - [x] icon area background `rgba(0,200,150,0.1)`
- [x] Add right edge fade hint for horizontal scroll.

#### Cards (Exact Order)

- [x] 1. Burn Rate (icon: fire) - Days till budget runs out
- [x] 2. EMI (icon: bar chart) - Monthly loan payment
- [x] 3. SIP (icon: chart up) - Mutual fund returns
- [x] 4. Goal (icon: target) - Monthly savings needed
- [x] 5. Affordability (icon: house) - Max loan you can take
- [x] 6. Tax (icon: money bag) - FY 2025-26 tax estimate
- [x] 7. Freedom (icon: dove) - Financial freedom number

#### Interaction

- [x] Tap card opens calculator in bottom sheet modal.
- [x] Bottom sheet style same as Add Expense modal.
- [x] Include handle bar, close X, title, inputs, result.
- [x] Height 85% viewport; internal content scrollable.

#### Scroll Behavior

- [x] Horizontal scroll with hidden scrollbar.
- [x] Snap to card behavior.
- [x] Show 3.5 cards visible so half card peeks at right.

#### Do Not

- [x] No header/date pill/nav changes.
- [x] No Add Expense button/modal changes.
- [x] No Spending-by-Category data/logic changes.
- [x] Do not add calculator hub to Investing or Lending.

---

## 5) Spending To-Do Screen Redesign

### 5.1 Clean Up Existing Issues

- [x] Simplify right-side actions (currently too many controls).
- [x] Ensure every item shows amount (no incomplete-looking rows).
- [x] Remove top horizontal pill tags that duplicate list.
- [x] Restyle completion summary (`6/6 done in YYYY-MM`) better.
- [x] Add clearer visual distinction done vs pending.
- [x] Add priority/due date treatment for monthly to-dos.

### 5.2 Redesigned To-Do Card

#### Header and Progress

- [x] Header:
  - [x] Left: `SPENDING TO-DO` + month subtitle (e.g., February 2026)
  - [x] Right: keep Add button
- [x] Add full-width teal progress bar below header.
- [x] Show completion text below bar in muted small style.
- [x] Remove horizontal pill tags entirely.

#### To-Do Row Behavior

- [x] Remove separate `Active` badge.
- [x] Remove standalone right-side check button.
- [x] Entire row tappable for complete/incomplete toggle.
- [x] Left checkbox circle states:
  - [x] pending: gray border
  - [x] done: filled teal
- [x] Row content:
  - [x] Title bold white 15px
  - [x] Category muted gray 12px
  - [x] Amount:
    - [x] pending: teal
    - [x] done: muted + strikethrough
  - [x] Due-date pill:
    - [x] orange if unpaid
    - [x] teal if paid
- [x] Right side icons:
  - [x] only edit + delete
  - [x] 20px muted
  - [x] visible on long-press or swipe
- [x] Completed rows:
  - [x] opacity 0.6
  - [x] title strikethrough
  - [x] checkbox teal filled

#### Status Grouping

- [x] Pending rows at top.
- [x] Completed rows at bottom behind collapsible separator:
  - [x] `Completed (N)` toggle expand/collapse

#### Monthly Reset Banner

- [x] Bottom info row:
  - [x] icon + text `Resets on <next month 1st>` in muted 12px
  - [x] right action `Reset Now` in teal

### 5.3 Add To-Do Modal

- [x] Keep modal style same as Add Expense.
- [x] Fields:
  - [x] Name
  - [x] Category (dropdown)
  - [x] Amount (optional)
  - [x] Due day picker (1-31)
  - [x] Recurring toggle

### 5.4 Bonus: Monthly Summary Pill

- [x] Add row above list:
  - [x] Total Committed amount
  - [x] Paid amount
  - [x] Pending amount
  - [x] teal/orange status dots

### 5.5 Do Not

- [x] Do not change Transactions tab.
- [x] Do not change Recurring tab.
- [x] Do not change bottom nav.
- [x] Do not alter existing data/reset logic (except adding reset banner UI).

---

## 6) Investing Screen Declutter

### Fix 1: Investing Tab Row

- [x] Make `Overview / Insurance / Goals / Investments` horizontally scrollable.
- [x] Show 3 full + half of 4th tab as affordance.
- [x] Active tab style = solid teal, dark text.
- [x] Remove text clipping/overflow.

### Fix 2: Investing Snapshot Redesign (High Priority)

- [x] Replace current crowded layout with:
  - [x] Top row: `INVESTING SNAPSHOT` label left, `Budget` button right (small outline)
  - [x] Big primary amount (bold)
  - [x] Muted line: `Savings Budget: X · Y remaining`
- [x] Remove carry-forward line from this card.
- [x] Remove redundant `Total Managed` text.
- [x] Keep 2 sub-boxes (Goal Savings/Investments), restyled:
  - [x] no dark inner fill
  - [x] subtle border `#2A3345`
  - [x] label 10px uppercase muted
  - [x] value 18px bold white
  - [x] thin teal left border accent

### Fix 3: Emergency Fund Tracker

- [x] Redesign as compact status card:
  - [x] left: shield icon + title + subtitle (`Target: 6 months`)
  - [x] right: circular progress ring (0% muted initially, teal when funded)
  - [x] below muted text `Link a goal to start tracking` at 12px
  - [x] bottom-right `Set Up ->` teal action
- [x] Reduce wasted vertical space.

### Fix 4: Insurance Preview

- [x] Replace meaningless subtitles (`Click`, `Click to protect`) with useful text:
  - [x] policy type / coverage type if available
  - [x] else fallback `Premium · Monthly/Annual`
- [x] Date formatting:
  - [x] show like `Due Feb 22`
  - [x] orange if due soon
  - [x] teal if paid
- [x] Amount right-aligned teal.
- [x] Add left border accent per item:
  - [x] orange due soon
  - [x] teal active/paid
- [x] Keep `View All`.

### Fix 5: Goals Preview

- [x] Match row style with Insurance Preview consistency.
- [x] Each row:
  - [x] goal name left
  - [x] target amount right
  - [x] mini progress bar below row
- [x] Progress bar style:
  - [x] height 3px
  - [x] teal fill
  - [x] track `#2A3345`

### Fix 6: Overall Spacing

- [x] `margin-bottom: 14px` between cards.
- [x] `padding: 18px` inside cards.
- [x] Section labels:
  - [x] 11px
  - [x] letter-spacing 1.2px
  - [x] color `#7A8599`

### Do Not

- [x] Do not change bottom nav/header/FAB position.
- [x] Do not touch Spending, Lending, Analytics screens.
- [x] Do not alter data logic/calculations.

---

## 7) Lending Screen Declutter

### Fix 1: Lending Tab Row

- [x] Make tab row horizontally scrollable (`Overview / Money Lent / Money I Took / My Loans`).
- [x] Show 3.5 tabs visible.
- [x] Active tab teal fill + dark text.
- [x] Inactive tabs transparent + muted text.

### Fix 2: Lending Snapshot Redesign

- [x] Replace stacked 3 inner boxes with compact structure:
  - [x] Header label + large amount below
  - [x] Pending badge rule:
    - [x] if pending > 0: orange badge
    - [x] else show nothing or muted `All clear` in teal 12px
  - [x] One 3-column row with vertical dividers:
    - [x] MONEY LENT (teal value)
    - [x] MONEY I TOOK (white value)
    - [x] LIABILITIES (orange value)
  - [x] Each column has label/value/subtext styles per spec

### Fix 3: Money Lent Preview Card

- [x] Compact row format:
  - [x] Name left bold
  - [x] Amount + Status right aligned
- [x] Status pills:
  - [x] Repaid teal
  - [x] Pending orange
  - [x] Partial yellow
- [x] Remove generic subtitle `Loan` unless meaningful.
- [x] Add left accent border:
  - [x] teal repaid
  - [x] orange pending
- [x] Fully repaid rows:
  - [x] opacity 0.6
  - [x] sorted below active/pending rows

### Fix 4: Money I Took Preview Card

- [x] Match same row style as Money Lent.
- [x] Move `View All` to card header top-right (not bottom).
- [x] Ensure FAB no longer overlays card content.

### Fix 5: FAB Position

- [x] Keep existing FAB color.
- [x] Ensure non-overlapping position:
  - [x] `bottom: 90px`
  - [x] `right: 16px`

### Fix 6: Overall Spacing

- [x] `margin-bottom: 14px` between cards.
- [x] `padding: 18px` inside cards.
- [x] Remove double-padding zones.

### Do Not

- [x] No bottom nav/header/date pill changes.
- [x] No data/calculation logic changes.
- [x] No changes in Spending/Investing/Analytics screens.
- [x] Do not change tab tap behavior.

---

## 8) Three Independent Prompts (Build Order Required)

### Build Order

- [x] Prompt 1 first (Salary Input + Income Tracker).
- [x] Prompt 2 second (Health Score depends on income data).
- [x] Prompt 3 third (Net Worth auto-snapshot; can be standalone but keep after Prompt 1 as requested).

### Prompt 1: Salary Input + Income Tracker

#### Placement

- [x] Add `My Income` card at top of Spending screen (above Total Spent).
- [x] Also allow access from Settings.

#### First-Visit Empty State

- [x] Prompt card text: `Add your monthly salary to unlock full budgeting`.
- [x] Teal CTA: `Add Income ->`.
- [x] Tap opens bottom sheet modal.

#### Income Modal Fields

- [x] Monthly Salary (primary)
- [x] Other Monthly Income (optional)
- [x] Save button full-width teal

#### Post-Save Income Summary Card

- [x] Header row: `FEBRUARY INCOME` label + edit icon.
- [x] Large total monthly income.
- [x] Four rows with amount + percentage + colored bar:
  - [x] Spent (red/orange)
  - [x] Invested (teal)
  - [x] EMI (orange)
  - [x] Remaining (purple)
- [x] Each row structure:
  - [x] label left
  - [x] amount center
  - [x] percentage right
  - [x] thin full-width colored bar below
- [x] Remaining formula:
  - [x] Income - Spent - Invested - EMI
- [x] If Remaining negative:
  - [x] show in red
  - [x] show `Over Income` warning

#### Do Not

- [x] Do not change existing cards below.
- [x] Income must remain optional.
- [x] Persist in same local storage/database used by app state.

### Prompt 2: Monthly Financial Health Score

#### Placement

- [x] Add as first card in Analytics Overview tab (above existing stat boxes).

#### Logic (Client-side)

- [x] Score out of 100, monthly.
- [x] Factor 1: Savings Rate (25)
  - [x] Invested/Income >=20% => 25
  - [x] 10-20% => 15
  - [x] 5-10% => 8
  - [x] <5% => 0
- [x] Factor 2: Budget Control (25)
  - [x] Under budget => 25
  - [x] 0-10% over => 15
  - [x] 10-25% over => 8
  - [x] >25% over => 0
- [x] Factor 3: EMI-to-Income Ratio (25)
  - [x] <20% => 25
  - [x] 20-30% => 15
  - [x] 30-40% => 8
  - [x] >40% => 0
- [x] Factor 4: Emergency Fund (25)
  - [x] >=6 months => 25
  - [x] 3-6 months => 15
  - [x] 1-3 months => 8
  - [x] <1 month => 0
  - [x] no emergency fund => 0
- [x] If income missing:
  - [x] compute with factors 1 and 2 only (out of 50)
  - [x] scale to 100

#### Card Design

- [x] Title label: `FINANCIAL HEALTH` muted uppercase.
- [x] Large score center: 48px, weight 800.
- [x] Score color buckets:
  - [x] 80-100 teal `Excellent`
  - [x] 60-79 purple `Good`
  - [x] 40-59 orange `Fair`
  - [x] 0-39 red `Needs Attention`
- [x] Circular ring progress indicator.
- [x] Four component rows with mini bars and per-factor points.
- [x] One-line insight text in muted gray.

#### Do Not

- [x] If <1 month data, do not show score.
- [x] Show empty state: `Add more data to generate your score`.
- [x] Do not change other Analytics cards.
- [x] Auto-recompute when related data changes.

### Prompt 3: Net Worth History Auto-Snapshot

#### Placement

- [x] Power existing `Net Worth Over Time` chart in Analytics Overview.

#### Snapshot Logic

- [x] On 1st of every month (or first app open after 1st), auto-save snapshot.
- [x] Formula:
  - [x] Investing Assets + Money Lent - Loan Liabilities + Manual Adjustments
- [x] Save shape:
  - [x] `{ month: "YYYY-MM", netWorth: value }`
- [x] Also save current month running value for latest point.
- [x] No user input required.
- [x] Persist in existing storage/database layer.

#### Chart Design

- [x] Match Monthly Spending Trend style:
  - [x] Line 3px, teal
  - [x] Area gradient teal -> transparent
  - [x] Points 8px with white border
- [x] X-axis months (Dec, Jan, Feb...)
- [x] Y-axis net worth INR
- [x] Negative handling:
  - [x] line turns red below zero
  - [x] dashed zero baseline
- [x] Point interaction:
  - [x] tap point shows tooltip month + exact value
- [x] If only one data point:
  - [x] show single dot + `Come back next month to see your trend`

#### Empty State (<2 months)

- [x] Replace broken icon with clean upward trend SVG in `#2A3345`.
- [x] Primary text: `Your net worth history will appear here automatically`.
- [x] Subtext: `First snapshot saves on the 1st of next month`.
- [x] Dashed border around empty state area.

#### Do Not

- [x] Do not request manual history entry.
- [x] Do not change Net Worth Snapshot card above chart.
- [x] Do not alter Spending/Investing chart modules.

---

## Final QA Sign-Off Checklist

- [x] All tasks completed without changing unrelated screen behavior.
- [x] All tab rows and card spacing changes verified on small and large screens.
- [x] Empty states no longer show broken image icons.
- [x] All new UI follows Poisa color/type/spacing system.
- [x] Calculator interactions and bottom sheets do not block core navigation.
- [x] No runtime errors; existing flows remain intact.
- [x] Prompt 1, Prompt 2, Prompt 3 delivered independently as requested.


