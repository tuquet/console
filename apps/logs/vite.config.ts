import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

import { Buffer } from 'node:buffer';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

import { defineConfig } from '@operon/vite-config';

const ALLOWED_SUITES = new Set([
  'all',
  'console',
  'core',
  'docker',
  'glossary',
]);
const CI_LOG_PATTERN = /^ci-([a-z0-9-]+)\.log$/;

function resolveCiLogsDir() {
  const ssotDir =
    process.env.DATA_DIR?.trim() || path.join(os.homedir(), '.operon');
  return path.join(ssotDir, 'logs', 'ci');
}

function readCiLogsPayload(activeSuite: null | string) {
  const logsDir = resolveCiLogsDir();
  if (!fs.existsSync(logsDir) || !fs.statSync(logsDir).isDirectory()) {
    return {
      cache: {},
      files: [],
      logsDir,
      runnerAvailable: true,
      runningSuites: activeSuite ? [activeSuite] : [],
    };
  }

  let cache: Record<string, unknown> = {};
  const cachePath = path.join(logsDir, '.ci-cache.json');
  if (fs.existsSync(cachePath)) {
    try {
      cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    } catch {
      cache = {};
    }
  }

  const files = fs
    .readdirSync(logsDir, { withFileTypes: true })
    .flatMap((entry) => {
      if (!entry.isFile()) return [];
      const match = CI_LOG_PATTERN.exec(entry.name);
      if (!match) return [];
      const filePath = path.join(logsDir, entry.name);
      const stat = fs.statSync(filePath);
      return [
        {
          content: fs.readFileSync(filePath, 'utf8'),
          name: entry.name,
          sizeBytes: stat.size,
          suite: match[1] ?? '',
          updatedAt: stat.mtime.toISOString(),
        },
      ];
    })
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return {
    cache,
    files,
    logsDir,
    runnerAvailable: true,
    runningSuites: activeSuite ? [activeSuite] : [],
  };
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8').trim();
        resolve(raw ? (JSON.parse(raw) as Record<string, unknown>) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function createStandaloneCiPlugin(): Plugin {
  const repoRoot = path.resolve(import.meta.dirname, '..', '..', '..');
  const scriptPath = path.join(repoRoot, 'scripts', 'local-ci.mjs');
  let activeSuite: null | string = null;

  return {
    name: 'operon-standalone-ci-runner',
    configureServer(server) {
      server.middlewares.use('/__local-ci/logs', (req, res, next) => {
        if (req.method !== 'GET') return next();
        sendJson(res, 200, readCiLogsPayload(activeSuite));
      });

      server.middlewares.use('/__local-ci/run', (req, res, next) => {
        if (req.method !== 'POST') return next();
        if (activeSuite) {
          sendJson(res, 409, {
            activeSuite,
            error: `CI suite "${activeSuite}" is already running`,
          });
          return;
        }
        void readJsonBody(req)
          .then((body) => {
            const suite =
              typeof body.suite === 'string' ? body.suite.trim() : 'all';
            if (!ALLOWED_SUITES.has(suite)) {
              sendJson(res, 400, { error: `Unsupported CI suite: ${suite}` });
              return;
            }
            if (!fs.existsSync(scriptPath)) {
              sendJson(res, 404, { error: 'scripts/local-ci.mjs not found' });
              return;
            }

            activeSuite = suite;
            const child = spawn(
              process.execPath,
              [scriptPath, suite, '--no-cache'],
              {
                cwd: repoRoot,
                stdio: 'ignore',
                windowsHide: true,
              },
            );
            const clearActive = () => {
              if (activeSuite === suite) activeSuite = null;
            };
            child.on('error', clearActive);
            child.on('exit', clearActive);
            sendJson(res, 202, { started: true, suite });
          })
          .catch(next);
      });
    },
  };
}

export default defineConfig(async () => {
  return {
    application: {
      html: true,
      pwa: false,
    },
    vite: {
      plugins: [createStandaloneCiPlugin()],
      server: {
        cors: true,
        host: true,
        port: 5325,
      },
    },
  };
});
