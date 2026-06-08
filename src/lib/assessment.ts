import type {
  Assessment,
  AssessmentAnswer,
  AssessmentAttempt,
  AssessmentQuestion,
  AssessmentSectionId,
  Course,
  DiagnosticReport,
  PassRequirements,
  QuestionResult,
  WeaknessType,
} from '../types';
import { levelNodes } from './levels';
import type { AppState } from '../types';

// Assessment grading + diagnostic engine (Parts 4, 5, 6).
//
// Genuine difficulty: only fully-correct answers earn full credit. "Guessed"
// earns light credit but is recorded as weak. "Unknown" / "skipped" earn none
// and generate repair work.

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:_"'()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'at', 'is', 'it', 'for',
  'el', 'la', 'los', 'las', 'un', 'una', 'de', 'y', 'o', 'que', 'en', 'es',
]);

function significantTokens(s: string): string[] {
  return normalize(s)
    .split(' ')
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

/** Tolerant free-text match: exact normalized, accepted variant, or token overlap. */
export function answerMatches(q: AssessmentQuestion, userAnswer: string): boolean {
  const ua = normalize(userAnswer);
  if (!ua) return false;
  const targets = [q.expectedAnswer ?? '', ...(q.acceptedAnswers ?? [])]
    .map(normalize)
    .filter(Boolean);
  if (targets.some((t) => t === ua)) return true;
  // Short canonical answers must match closely.
  for (const t of targets) {
    if (!t) continue;
    if (ua.includes(t) || t.includes(ua)) {
      // Avoid trivially-short containment passing (e.g. one shared word).
      if (Math.min(t.length, ua.length) >= 4) return true;
    }
  }
  // Phrase answers (reading/listening): require strong token overlap.
  const expTokens = significantTokens(q.expectedAnswer ?? '');
  if (expTokens.length >= 3) {
    const uaTokens = new Set(significantTokens(userAnswer));
    const hit = expTokens.filter((t) => uaTokens.has(t)).length;
    if (hit / expTokens.length >= 0.6) return true;
    // Also accept overlap against any accepted variant.
    for (const variant of q.acceptedAnswers ?? []) {
      const vTokens = significantTokens(variant);
      if (vTokens.length >= 2) {
        const vh = vTokens.filter((t) => uaTokens.has(t)).length;
        if (vh / vTokens.length >= 0.6) return true;
      }
    }
  }
  return false;
}

/** Rule-based score (0-100) for a writing answer. */
export function scoreWriting(q: AssessmentQuestion, raw: string): number {
  const text = raw.trim();
  const words = text ? text.split(/\s+/) : [];
  const min = q.minWords ?? 25;
  const lengthRatio = Math.min(1, words.length / min);
  const lengthScore = lengthRatio * 45;

  const norm = ` ${normalize(text)} `;
  const kws = q.requiredKeywords ?? [];
  const kwHit = kws.filter((k) => norm.includes(` ${normalize(k)} `) || norm.includes(normalize(k)));
  const kwScore = kws.length ? (kwHit.length / kws.length) * 40 : 40;

  let form = 0;
  if (/^[¿¡]?[A-ZÁÉÍÓÚÑ]/.test(text)) form += 7;
  if (/[.!?]$/.test(text)) form += 8;

  return Math.max(0, Math.min(100, Math.round(lengthScore + kwScore + form)));
}

const WRITING_PASS = 70;

function questionCredit(q: AssessmentQuestion, ans: AssessmentAnswer, result: QuestionResult): number {
  if (q.type === 'writing_response') {
    const s = scoreWriting(q, ans.userAnswer);
    if (ans.markedUnknown || !ans.userAnswer.trim()) return 0;
    return s;
  }
  if (q.type === 'speaking_prompt') {
    return result === 'correct' ? 100 : 0;
  }
  if (result === 'correct') return 100;
  if (result === 'guessed') return 40; // light credit, still flagged weak
  return 0;
}

const SECTION_LABEL: Record<AssessmentSectionId, string> = {
  vocabulary: 'vocabulary',
  grammar: 'grammar control',
  reading: 'reading detail',
  listening: 'listening detail',
  writing: 'writing',
  speaking: 'speaking',
};

const WEAKNESS_LABEL: Record<WeaknessType, string> = {
  vocabulary: 'vocabulary recall',
  grammar: 'grammar control',
  listening: 'listening detail',
  reading: 'reading detail',
  writing: 'writing accuracy',
  production: 'speaking / production',
  recall_speed: 'recall speed',
};

export interface GradeOptions {
  startedAt: string;
  completedAt?: string;
  id: string;
}

export function gradeAttempt(
  course: Course,
  state: AppState,
  assessment: Assessment,
  rawAnswers: AssessmentAnswer[],
  opts: GradeOptions,
): AssessmentAttempt {
  const byId = new Map(assessment.questions.map((q) => [q.id, q]));
  const answerById = new Map(rawAnswers.map((a) => [a.questionId, a]));

  // Ensure every question has an answer (unanswered → skipped).
  const answers: AssessmentAnswer[] = assessment.questions.map((q) => {
    const a = answerById.get(q.id) ?? {
      questionId: q.id,
      userAnswer: '',
      result: 'skipped' as QuestionResult,
      markedUnknown: false,
      markedGuessed: false,
      flagged: false,
      timeSpentSeconds: 0,
    };
    return { ...a, result: gradeResult(q, a) };
  });

  // Section scores.
  const sectionScores: Record<string, number> = {};
  for (const section of assessment.sections) {
    const qs = section.questionIds.map((id) => byId.get(id)!).filter(Boolean);
    const credits = qs.map((q) => {
      const a = answers.find((x) => x.questionId === q.id)!;
      return questionCredit(q, a, a.result);
    });
    sectionScores[section.id] = credits.length
      ? Math.round(credits.reduce((s, c) => s + c, 0) / credits.length)
      : 0;
  }

  const sectionIds = assessment.sections.map((s) => s.id);
  const total = Math.round(
    sectionIds.reduce((s, id) => s + (sectionScores[id] ?? 0), 0) / Math.max(1, sectionIds.length),
  );

  // ---- Pass gates (Part 4) ----
  const pr: PassRequirements = assessment.passThresholds;
  const nodes = levelNodes(course, assessment.levelId);
  const masteries = nodes.map((n) => state.nodes[n.id]?.mastery ?? 0);
  const skillAvg = masteries.length
    ? Math.round(masteries.reduce((s, m) => s + m, 0) / masteries.length)
    : 0;
  const criticalNodes = nodes.filter((n) => n.critical);
  const criticalMin = criticalNodes.length
    ? Math.min(...criticalNodes.map((n) => state.nodes[n.id]?.mastery ?? 0))
    : 100;

  const grammarVocab = Math.round(
    ((sectionScores.vocabulary ?? 0) + (sectionScores.grammar ?? 0)) /
      ((sectionScores.vocabulary !== undefined ? 1 : 0) +
        (sectionScores.grammar !== undefined ? 1 : 0) || 1),
  );

  const has = (id: AssessmentSectionId) => sectionIds.includes(id);
  const sectionScore = (id: AssessmentSectionId) => sectionScores[id] ?? 0;

  // Weak areas: any examined section under its hard threshold + weakness types.
  const weakAreas = new Set<string>();
  const blockingAreas: string[] = [];

  function check(ok: boolean, label: string) {
    if (!ok) blockingAreas.push(label);
    return ok;
  }

  const gateSkill = check(skillAvg >= pr.skillAverageMastery, 'skill mastery');
  const gateCritical = check(criticalMin >= pr.criticalSkillMin, 'critical skills');
  const gateAssessment = check(total >= pr.assessmentMin, 'overall test score');
  const gateListening = !has('listening') || check(sectionScore('listening') >= pr.listeningMin, 'listening detail');
  const gateReading = !has('reading') || check(sectionScore('reading') >= pr.readingMin, 'reading detail');
  const gateWriting = !has('writing') || check(sectionScore('writing') >= pr.writingMin, 'writing');
  const gateGrammarVocab = check(grammarVocab >= pr.grammarVocabMin, 'grammar / vocabulary');
  const gateSpeaking = !pr.speakingRequired || !has('speaking') || check(sectionScore('speaking') >= 100, 'speaking task');

  // Build weakness set from answers + low sections.
  for (const a of answers) {
    const q = byId.get(a.questionId)!;
    if (a.result === 'incorrect' || a.result === 'guessed' || a.result === 'unknown' || a.result === 'skipped') {
      weakAreas.add(WEAKNESS_LABEL[q.weaknessType]);
    }
  }
  for (const id of sectionIds) {
    const threshold =
      id === 'listening' ? pr.listeningMin
      : id === 'reading' ? pr.readingMin
      : id === 'writing' ? pr.writingMin
      : id === 'vocabulary' || id === 'grammar' ? pr.grammarVocabMin
      : id === 'speaking' ? 100
      : 70;
    if (sectionScore(id) < threshold) weakAreas.add(SECTION_LABEL[id]);
  }

  const weakAreaList = [...weakAreas];
  const gateWeakCount = check(
    weakAreaList.length <= pr.maxUnresolvedWeakAreas,
    `too many weak areas (${weakAreaList.length})`,
  );

  const passed =
    gateSkill &&
    gateCritical &&
    gateAssessment &&
    gateListening &&
    gateReading &&
    gateWriting &&
    gateGrammarVocab &&
    gateSpeaking &&
    gateWeakCount;

  // ---- Diagnostic recommendations (Part 6) ----
  const recNodes = new Set<string>();
  const unknownConcepts: string[] = [];
  for (const a of answers) {
    const q = byId.get(a.questionId)!;
    if (a.result === 'correct') continue;
    for (const nid of q.skillNodeIds) recNodes.add(nid);
    if (a.result === 'unknown' || a.result === 'skipped') {
      const concept = shortConcept(q);
      if (concept) unknownConcepts.push(concept);
    }
  }
  // Flagged questions also go to the review queue.
  for (const a of answers) {
    if (a.flagged) {
      const q = byId.get(a.questionId)!;
      for (const nid of q.skillNodeIds) recNodes.add(nid);
    }
  }

  const recNodeIds = [...recNodes];
  const recommendedCardIds: string[] = [];
  const recommendedInputTaskIds: string[] = [];
  const recommendedOutputTaskIds: string[] = [];
  for (const nid of recNodeIds) {
    const node = course.nodes.find((n) => n.id === nid);
    if (!node) continue;
    recommendedCardIds.push(...node.flashcardIds.slice(0, 4));
    recommendedInputTaskIds.push(...node.inputTaskIds.slice(0, 1));
    recommendedOutputTaskIds.push(...node.outputTaskIds.slice(0, 1));
  }

  const passedAreas = sectionIds
    .filter((id) => {
      const threshold =
        id === 'listening' ? pr.listeningMin
        : id === 'reading' ? pr.readingMin
        : id === 'writing' ? pr.writingMin
        : id === 'vocabulary' || id === 'grammar' ? pr.grammarVocabMin
        : id === 'speaking' ? 100
        : 70;
      return sectionScore(id) >= threshold;
    })
    .map((id) => SECTION_LABEL[id]);

  const summary = buildSummary(assessment.levelId, passed, blockingAreas, answers, byId);

  const report: DiagnosticReport = {
    passedAreas,
    weakAreas: weakAreaList,
    blockingAreas,
    recommendedSkillNodeIds: recNodeIds,
    recommendedCardIds,
    recommendedInputTaskIds,
    recommendedOutputTaskIds,
    retestEligible: passed,
    summary,
    unknownConcepts,
  };

  return {
    id: opts.id,
    assessmentId: assessment.id,
    levelId: assessment.levelId,
    startedAt: opts.startedAt,
    completedAt: opts.completedAt ?? new Date().toISOString(),
    score: total,
    sectionScores,
    answers,
    passed,
    diagnosticReport: report,
  };
}

function gradeResult(q: AssessmentQuestion, ans: AssessmentAnswer): QuestionResult {
  if (ans.markedUnknown) return 'unknown';
  const hasText = ans.userAnswer.trim().length > 0;
  if (q.type === 'speaking_prompt') {
    return hasText || ans.userAnswer === 'complete' ? 'correct' : 'skipped';
  }
  if (!hasText) return ans.flagged ? 'flagged' : 'skipped';
  let correct: boolean;
  if (q.type === 'writing_response') {
    correct = scoreWriting(q, ans.userAnswer) >= WRITING_PASS;
  } else {
    correct = answerMatches(q, ans.userAnswer);
  }
  if (ans.markedGuessed) return 'guessed';
  return correct ? 'correct' : 'incorrect';
}

function shortConcept(q: AssessmentQuestion): string {
  const p = q.prompt.replace(/\s+/g, ' ').trim();
  return p.length > 64 ? p.slice(0, 61) + '…' : p;
}

function buildSummary(
  level: string,
  passed: boolean,
  blocking: string[],
  answers: AssessmentAnswer[],
  byId: Map<string, AssessmentQuestion>,
): string[] {
  const lines: string[] = [];
  if (passed) {
    lines.push(`You passed ${level}. The next CEFR stage is now open.`);
    return lines;
  }
  const reasons = blocking.filter((b) => b !== 'critical skills' && b !== 'skill mastery');
  const top = reasons.slice(0, 3).join(' and ');
  lines.push(`You did not pass ${level}${top ? ` because of ${top}` : ''}.`);
  lines.push('Revise these before retesting.');

  const guessedGrammar = answers.filter(
    (a) => a.result === 'guessed' && byId.get(a.questionId)?.section === 'grammar',
  ).length;
  if (guessedGrammar >= 2) {
    lines.push('You guessed too many grammar items. They count as weak.');
  }
  const skillBlocked = blocking.includes('skill mastery') || blocking.includes('critical skills');
  if (skillBlocked) {
    lines.push('Your skill mastery is not high enough yet. Do the repair work first.');
  }
  return lines;
}
