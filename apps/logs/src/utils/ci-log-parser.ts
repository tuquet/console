import type {
  CiCacheEntry,
  CiLogFileEntry,
  CiLogsApiResponse,
} from '../api/ci-logs';

export type CiLineSeverity = 'error' | 'info' | 'pass' | 'warn';
export type CiRunStatus = 'empty' | 'fail' | 'pass' | 'running';
export type CiSeverityFilter = 'all' | 'error' | 'summary' | 'warn';

export interface CiLogLine {
  lineNo: number;
  noise: boolean;
  packageTag: null | string;
  severity: CiLineSeverity;
  text: string;
}

export interface CiStepBlock {
  command: string;
  errorCount: number;
  exitCode: null | number;
  lines: CiLogLine[];
  name: string;
  seconds: null | number;
  startLine: number;
  status: 'fail' | 'pass' | 'running';
  warnCount: number;
}

export interface CiLogRun {
  cacheAt: null | string;
  cacheHash: null | string;
  errorCount: number;
  filename: string;
  gitRef: string;
  lineCount: number;
  sizeBytes: number;
  status: CiRunStatus;
  steps: CiStepBlock[];
  suite: string;
  summaryLines: string[];
  timestamp: string;
  totalSeconds: null | number;
  updatedAt: string;
  warnCount: number;
}

export interface HighlightSegment {
  match: boolean;
  text: string;
}

const SUITE_ORDER = ['glossary', 'core', 'console', 'docker'];
const HEADER_RE = /^=== local-ci: (\S+) \(([^,]+), ([^)]+)\) ===$/;
const STEP_RE = /^> \[([^\]]+)\] (.+)$/;
const SUMMARY_RE = /^--- Summary: (\S+) \(([\d.]+)s\) ---$/;
const STEP_RESULT_RE = /^\[(PASS|FAIL (\d+))\] (.+?) \(([\d.]+)s\)$/;

const ERROR_PATTERNS = [
  /\[FAIL \d+\]/,
  /^error(?:\[[^\]]+\])?:/i,
  /^\s*error\s+/i,
  /^Caused by:/,
  /Access is denied/i,
  /ELIFECYCLE/,
  /^\[FATAL\]/,
  /^\s*[✗×]\s/,
  /Test Files\s+\d+\s+failed/i,
];

const WARN_PATTERNS = [
  /^warning:/i,
  /\bWARN\b/,
  /ExperimentalWarning/,
  /DeprecationWarning/,
];

const PASS_PATTERNS = [
  /^\[PASS\]/,
  /^\s*[✓✅]\s/,
  /Test Files\s+\d+\s+passed/i,
  /\d+ passed \(/,
];

const NOISE_PATTERNS = [
  /cache hit, replaying logs/,
  /LF will be replaced by CRLF the next time Git touches it/,
];

export function classifyLineSeverity(text: string): CiLineSeverity {
  if (ERROR_PATTERNS.some((re) => re.test(text))) return 'error';
  if (WARN_PATTERNS.some((re) => re.test(text))) return 'warn';
  if (PASS_PATTERNS.some((re) => re.test(text))) return 'pass';
  return 'info';
}

export function isNoiseLine(text: string): boolean {
  return NOISE_PATTERNS.some((re) => re.test(text));
}

export function extractPackageTag(text: string): null | string {
  const pkgMatch = text.match(/@operon(?:-core)?\/[a-z0-9-]+/);
  if (pkgMatch) return pkgMatch[0];
  const crateMatch = text.match(/\bcrates\/[a-z0-9_-]+/);
  if (crateMatch) return crateMatch[0];
  const appMatch = text.match(/\b(?:apps|packages)\/[a-z0-9@._/-]+/);
  return appMatch ? appMatch[0].split('/').slice(0, 2).join('/') : null;
}

function finalizeRunStatus(
  steps: CiStepBlock[],
  inSummary: boolean,
  hasTimestamp: boolean,
): CiRunStatus {
  if (steps.some((step) => step.status === 'fail')) return 'fail';
  if (inSummary && steps.length > 0) return 'pass';
  if (steps.length === 0 && !inSummary && !hasTimestamp) return 'empty';
  return inSummary ? 'pass' : 'running';
}

// A step closed by the next step starting has no summary line yet; its errors decide the verdict.
function closeStep(step: CiStepBlock) {
  if (step.status !== 'running') return;
  step.status = step.errorCount > 0 ? 'fail' : 'pass';
}

export function parseCiLogFile(
  file: CiLogFileEntry,
  cacheEntry: CiCacheEntry | null = null,
): CiLogRun {
  const rawLines = file.content.split(/\r?\n/);
  const run: CiLogRun = {
    suite: file.suite,
    filename: file.name,
    timestamp: '',
    gitRef: '',
    status: 'empty',
    totalSeconds: null,
    cacheAt: cacheEntry?.at ?? null,
    cacheHash: cacheEntry?.hash ?? null,
    errorCount: 0,
    warnCount: 0,
    lineCount: rawLines.length,
    sizeBytes: file.sizeBytes,
    updatedAt: file.updatedAt,
    steps: [],
    summaryLines: [],
  };

  let currentStep: CiStepBlock | null = null;
  let inSummary = false;

  for (const [idx, text] of rawLines.entries()) {
    const lineNo = idx + 1;
    const headerMatch = text.match(HEADER_RE);
    if (headerMatch) {
      run.suite = headerMatch[1] || run.suite;
      run.timestamp = headerMatch[2] || '';
      run.gitRef = headerMatch[3] || '';
      continue;
    }

    const summaryMatch = text.match(SUMMARY_RE);
    if (summaryMatch?.[2]) {
      inSummary = true;
      run.totalSeconds = Number.parseFloat(summaryMatch[2]);
      run.summaryLines.push(text);
      continue;
    }

    if (inSummary) {
      const resultMatch = text.match(STEP_RESULT_RE);
      if (resultMatch?.[1] && resultMatch[3] && resultMatch[4]) {
        run.summaryLines.push(text);
        const passed = resultMatch[1] === 'PASS';
        const exitCode = passed
          ? 0
          : Number.parseInt(resultMatch[2] ?? '1', 10);
        const stepName = resultMatch[3];
        const seconds = Number.parseFloat(resultMatch[4]);
        const target = run.steps.find((s) => s.name === stepName);
        if (target) {
          target.status = passed ? 'pass' : 'fail';
          target.exitCode = exitCode;
          target.seconds = seconds;
        }
      }
      continue;
    }

    const stepMatch = text.match(STEP_RE);
    if (stepMatch?.[1] && stepMatch[2]) {
      if (currentStep) closeStep(currentStep);
      currentStep = {
        name: stepMatch[1],
        command: stepMatch[2],
        status: 'running',
        exitCode: null,
        seconds: null,
        startLine: lineNo,
        errorCount: 0,
        warnCount: 0,
        lines: [],
      };
      run.steps.push(currentStep);
      continue;
    }

    if (!currentStep) continue;

    const severity = classifyLineSeverity(text);
    if (severity === 'error') {
      run.errorCount += 1;
      currentStep.errorCount += 1;
    } else if (severity === 'warn') {
      run.warnCount += 1;
      currentStep.warnCount += 1;
    }

    currentStep.lines.push({
      lineNo,
      severity,
      noise: isNoiseLine(text),
      packageTag: extractPackageTag(text),
      text,
    });
  }

  run.status = finalizeRunStatus(run.steps, inSummary, Boolean(run.timestamp));
  return run;
}

export function parseCiLogsResponse(payload: CiLogsApiResponse): CiLogRun[] {
  const runs = payload.files.map((file) =>
    parseCiLogFile(file, payload.cache[file.suite] ?? null),
  );

  return runs.toSorted((a, b) => {
    const ia = SUITE_ORDER.indexOf(a.suite);
    const ib = SUITE_ORDER.indexOf(b.suite);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.suite.localeCompare(b.suite);
  });
}

export function buildSearchMatcher(
  query: string,
  regex: boolean,
): { error: null | string; matcher: null | RegExp } {
  const trimmed = query.trim();
  if (!trimmed) return { error: null, matcher: null };
  if (regex) {
    try {
      return { error: null, matcher: new RegExp(trimmed, 'gi') };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Invalid regex',
        matcher: null,
      };
    }
  }
  const escaped = trimmed.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  return { error: null, matcher: new RegExp(escaped, 'gi') };
}

export function lineMatchesFilter(
  line: CiLogLine,
  opts: {
    hideNoise: boolean;
    matcher: null | RegExp;
    scope: string;
    severity: CiSeverityFilter;
  },
): boolean {
  if (opts.hideNoise && line.noise) return false;
  if (opts.severity === 'error' && line.severity !== 'error') return false;
  if (
    opts.severity === 'warn' &&
    line.severity !== 'warn' &&
    line.severity !== 'error'
  ) {
    return false;
  }
  if (opts.scope && line.packageTag !== opts.scope) return false;
  if (opts.matcher) {
    opts.matcher.lastIndex = 0;
    return opts.matcher.test(line.text);
  }
  return true;
}

export function splitHighlightSegments(
  text: string,
  matcher: null | RegExp,
): HighlightSegment[] {
  if (!matcher) return [{ match: false, text }];
  matcher.lastIndex = 0;
  const segments: HighlightSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(matcher)) {
    const idx = m.index ?? 0;
    const token = m[0];
    if (!token) break;
    if (idx > last) {
      segments.push({ match: false, text: text.slice(last, idx) });
    }
    segments.push({ match: true, text: token });
    last = idx + token.length;
  }
  if (last < text.length) {
    segments.push({ match: false, text: text.slice(last) });
  }
  return segments.length > 0 ? segments : [{ match: false, text }];
}
