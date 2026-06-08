# Field Spanish (LinguaMap)

A local-first, mastery-based language learning web app. It is built around a full
**CEFR fluency path from A1 to C2**, an adaptive skill map, hard level gates with
difficult assessments, a diagnostic revision engine, spaced-retrieval flashcards,
comprehensible input, and output tasks with rule-based feedback. It is not a
streak/XP game.

The app never asks "what lesson do you want?" — it tells the learner *what to do
today, why, and what is blocking the next level*.

The interface uses a plain "field notebook + route map" style: paper background,
dark ink text, simple borders, mono labels, and a route-map roadmap rather than a
game board.

### The CEFR path (A1 → A2 → B1 → B2 → C1 → C2)

Each level has a title, practical description, can-do goals, units, skill nodes, a
final assessment and hard pass requirements. Levels are locked until the previous
one is passed. C2 is the long-term target; the next CEFR stage is the immediate one.

Content lives per level in `src/data/spanish/` (`a1`…`c2`) and is assembled into a
single course by `buildCourse.ts`:

- **A1** — 8 units, 40 skill nodes, 330 vocab, ~950 flashcards, 42 input / 40 output, final assessment
- **A2** — 12 skill nodes, 84 vocab, 12 input / 12 output, final assessment
- **B1** — 10 skill nodes, 60 vocab, 10 input / 10 output, final assessment
- **B2** — 8 skill nodes, 51 vocab, 8 input / 8 output, final assessment (built for B2 starters)
- **C1** — 6 skill nodes + a full-structure final assessment
- **C2** — roadmap skeleton + a full-structure final assessment

Flashcards and most tasks are generated deterministically from the authored
vocabulary and grammar, so content scales without thousands of hand-written
records. Card ids are stable, so review progress survives reloads.

### Placement and progression

Onboarding places the learner: lower levels become **assumed** (not studied unless a
diagnostic finds weakness), the chosen level becomes **current**, and higher levels
stay **locked**. A B2 starter goes straight into B2 work, not beginner content.

Level statuses: `locked` · `assumed` · `current` · `repair` · `test_ready` · `passed`.

### Hard level gates

A level passes only when **all** hold: skill-node average mastery ≥ 90%, no critical
skill below 80%, final assessment ≥ 85%, listening/reading/writing ≥ 75%,
grammar+vocabulary ≥ 80%, the speaking task is complete, and no more than 2
unresolved weak areas. No fake passes.

### Difficult assessments + diagnostics

Each level test has six sections — vocabulary (production), grammar
(cloze/correction/transformation/error-spotting), reading, listening (audio
placeholder), writing (rule-scored) and speaking (placeholder). Learners can mark
**I don't know**, **I guessed**, and **flag for review**; every question maps to skill
nodes, vocabulary, grammar, a CEFR level and a weakness type. After grading, a
diagnostic report lists passed / weak / blocking areas, recommended revision, and
the requirements to retest. Retesting is blocked until repair work and study
sessions are done.

### Adaptive daily plans

The Today page builds a plan for the chosen budget (**15 / 30 / 60 / 120 minutes**)
showing the main target, what is blocking the next level, each task's reason, its
estimated minutes, and what it unlocks.

### Skill states

`locked` · `ready` · `learning` · `usable` · `passed`, plus overlay flags `due`,
`weak`, `assumed` and `repair`.

## Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Zustand (state)
- React Router
- `localStorage` for persistence (no backend yet)

All progress is stored locally in the browser. There is no account and no server.

## Getting started

```bash
npm install
npm run dev      # start dev server (http://localhost:5173)
npm run build    # type-check + production build to /dist
npm run preview  # preview the production build
```

## Pages

1. **Onboarding** — language, goal, starting level (complete beginner → C2 maintenance),
   daily time (15/30/60/120), with a live placement preview.
2. **Today** — the adaptive daily plan for the chosen time, with main target, blockers,
   and ordered tasks (reviews, lessons, repair, input, output, diagnostic, level test).
3. **Roadmap** — the A1 → C2 route map; each level card shows status, mastery, failed
   areas, weak-skill count, test availability and estimated workload.
4. **Level detail** — units, skill nodes, the level test, the repair queue and the live
   pass criteria for one CEFR level.
5. **Lesson** — grammar patterns, examples, vocabulary, and a start-review button.
6. **Review** — flashcards with `Again / Hard / Good / Easy` grading that drives the SRS.
7. **Input task** — reading/listening with live known-word coverage and comprehension.
8. **Output task** — short writing prompt with rule-based feedback and a production score.
9. **Assessment** — the six-section level test with I-don't-know / I-guessed / flag controls.
10. **Diagnostic** — the post-test report: section scores, weak/blocking areas, recommended
    revision and retest requirements.

## Architecture

Content and progress are deliberately separated so a backend can be added later
without touching the learning logic.

```
src/
  types/          Domain types (content, progress, levels, assessments, study plan)
  data/
    spanish/      Per-level content bundles (a1…c2) + helpers + level index
    units.ts      A1 units + node seeds
    vocab.ts      A1 vocabulary
    grammar.ts    A1 grammar
    buildCourse.ts  Assembles all levels into one Course + level defs + assessments
  lib/
    storage.ts    Persistence boundary (localStorage today, swappable for IndexedDB)
    srs.ts        Spaced-retrieval scheduler (SM-2 inspired)
    adaptive.ts   Node mastery + unlock rules + level gating overlay
    levels.ts     Level placement, progression, retest gating
    assessment.ts Assessment grading + diagnostic engine
    today.ts      Adaptive daily-plan builder + due-card selection
    feedback.ts   Rule-based output grader
    date.ts       Date helpers
  store/          Zustand store (onboarding, reviews, assessments, dev tools)
  components/     Reusable UI (Layout, ProgressBar, StatusBadge, PageHeader, DebugPanel)
  pages/          Routed pages (Today, Roadmap, LevelDetail, Lesson, Review, Input,
                  Output, Assessment, Diagnostic, Settings, Onboarding)
```

### Adding a level or language

Each CEFR level is a self-contained `LevelBundle` (`src/data/spanish/<level>.ts`)
exporting units, node seeds, vocabulary, grammar and a final assessment. Register it
in `src/data/spanish/index.ts`; `buildCourse.ts` does the rest. The dev panel (in
dev builds) can place a test user at any level, force-pass / force-fail a level,
open the latest diagnostic, and preview the 15/30/60/120-minute plans.

### Adaptive rules (`lib/adaptive.ts`)

- Review accuracy **< 70%** → node stays in **review**.
- Review accuracy **≥ 85%** **and** the node's input/output tasks passed → mastery may rise.
- Mastery **≥ 90%** → node is **mastered**.
- A locked node unlocks once **every prerequisite reaches ≥ 80% mastery**.
- Node mastery blends card-level memory strength (SRS interval + recent accuracy) with
  task completion; the "mastered" line is gated behind the accuracy + tasks bar above.

### Spaced retrieval (`lib/srs.ts`)

Each answer updates an interval, ease factor and due date. `Again` reschedules within the
session; `Hard/Good/Easy` extend the interval. A small rolling window of recent ratings
feeds the per-node review-accuracy calculation.

### Daily planning (`lib/today.ts`)

`buildStudyPlan(course, state, minutes)` returns a `StudyPlan` shaped to the chosen
budget. Overdue reviews always come first; then the composition changes per tier
(15/30/60/120) per the spec — short sessions clear reviews plus one weak skill, while
long sessions add two learning blocks, input/output, a diagnostic block and the level
test when eligible. Each task carries an estimate, a reason and what it unlocks.

## Extending the app

- **More courses/languages**: add a `Course` object in `src/data/` and register it in the
  `courses` map. The UI and logic are course-agnostic.
- **IndexedDB / backend**: implement the same `loadState` / `saveState` surface in
  `lib/storage.ts` (or add an async repository) — the store is the only caller.
- **Smarter output grading**: replace `lib/feedback.ts` with a model-based grader; it
  returns an `OutputFeedback` the UI already renders.

## Deploying to Netlify

This is a static SPA. `netlify.toml` and `public/_redirects` are included so client-side
routes resolve on refresh.

- Build command: `npm run build`
- Publish directory: `dist`

Either connect the repo in Netlify or drag-and-drop the `dist/` folder.
