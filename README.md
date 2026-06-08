# Field Spanish (LinguaMap)

A local-first, mastery-based language learning web app. It is built around CEFR
can-do goals, an adaptive skill map, spaced-retrieval flashcards, comprehensible
input, and output tasks with rule-based feedback. It is not a streak/XP game.

The interface uses a plain "field notebook + route map" style: paper background,
dark ink text, simple borders, mono labels (ready / weak / due / blocked), and a
route-map roadmap rather than a game board.

Seed course: **Spanish A1 foundation** (travel and daily life), with:

- 8 units, 40 skill nodes
- 330 vocabulary items
- 36 grammar / pattern entries
- ~950 flashcards (generated from vocab + grammar; over half sentence-based)
- 42 input tasks, 40 output tasks

Flashcards and most tasks are generated deterministically from the authored
vocabulary and grammar in `src/data/`, so content scales without thousands of
hand-written records. Card ids are stable, so review progress survives reloads.

### Skill states

`locked` (blocked by prerequisites) · `ready` (unlocked, not started) ·
`learning` (started, under 70%) · `usable` (70-89%) · `passed` (90%+), plus
overlay flags `due` (overdue cards) and `weak` (recent accuracy under 70%).

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

1. **Onboarding** — target language, native language, goal, current level, daily time.
2. **Today** — the prioritized plan: overdue reviews → weak skills → new material.
3. **Roadmap** — visual skill map with `locked` / `learning` / `review` / `mastered`
   nodes, each showing a mastery %. Locked nodes connect with dashed edges.
4. **Lesson** — short grammar explanation, example sentences, key vocabulary, and a
   start-review button (plus links to the node's input/output tasks).
5. **Review** — flashcards with four card types (vocab recognition, production, cloze,
   sentence translation) and `Again / Hard / Good / Easy` grading that drives the SRS.
6. **Input task** — reading passage, live known-word coverage (tap unknown words),
   glossary, and multiple-choice comprehension questions.
7. **Output task** — short writing prompt with deterministic, rule-based feedback and a
   production score.

## Architecture

Content and progress are deliberately separated so a backend can be added later
without touching the learning logic.

```
src/
  types/          Domain types (content model + progress model)
  data/           Seed course content (Spanish A1 Travel)
  lib/
    storage.ts    Persistence boundary (localStorage today, swappable for IndexedDB)
    srs.ts        Spaced-retrieval scheduler (SM-2 inspired)
    adaptive.ts   Mastery + unlock rules
    today.ts      Today-plan builder + due-card selection
    feedback.ts   Rule-based output grader
    date.ts       Date helpers
  store/          Zustand store (actions + persistence)
  components/     Reusable UI (Layout, ProgressBar, StatusBadge, PageHeader)
  pages/          The 7 routed pages
```

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

### Today prioritization (`lib/today.ts`)

`buildToday()` returns an ordered list: overdue reviews first (weighted by days overdue),
then weak skills flagged for review, then new lessons, then input, then output tasks.

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
