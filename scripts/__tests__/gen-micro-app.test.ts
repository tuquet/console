import { execSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('gen-micro-app CLI Scaffolder', () => {
  const root = process.cwd();
  const testAppName = 'unit-test-sample';
  const testAppDir = join(root, 'apps', testAppName);
  const shellPkgPath = join(root, 'apps', 'shell', 'package.json');
  const manifestJsonPath = join(
    root,
    'apps',
    'shell',
    'public',
    'apps.manifest.json',
  );
  const shellRoutePath = join(
    root,
    'apps',
    'shell',
    'src',
    'router',
    'routes',
    'modules',
    `${testAppName}.ts`,
  );
  const appsRegistryPath = join(
    root,
    'apps',
    'shell',
    'src',
    'registry',
    'apps.ts',
  );
  const rootPkgPath = join(root, 'package.json');
  const i18nEnPath = join(
    root,
    'apps',
    'shell',
    'src',
    'locales',
    'langs',
    'en-US',
    'page.json',
  );
  const i18nViPath = join(
    root,
    'apps',
    'shell',
    'src',
    'locales',
    'langs',
    'vi-VN',
    'page.json',
  );

  let origShellPkg = '';
  let origManifestJson = '';
  let origAppsRegistry = '';
  let origRootPkg = '';
  let origI18nEn = '';
  let origI18nVi = '';

  beforeEach(() => {
    origShellPkg = readFileSync(shellPkgPath, 'utf8');
    origManifestJson = readFileSync(manifestJsonPath, 'utf8');
    origAppsRegistry = readFileSync(appsRegistryPath, 'utf8');
    origRootPkg = readFileSync(rootPkgPath, 'utf8');
    origI18nEn = readFileSync(i18nEnPath, 'utf8');
    origI18nVi = readFileSync(i18nViPath, 'utf8');
  });

  afterEach(() => {
    // Clean up created files
    if (existsSync(testAppDir)) {
      rmSync(testAppDir, { recursive: true, force: true });
    }
    if (existsSync(shellRoutePath)) {
      rmSync(shellRoutePath, { force: true });
    }
    // Restore modified files
    writeFileSync(shellPkgPath, origShellPkg, 'utf8');
    writeFileSync(manifestJsonPath, origManifestJson, 'utf8');
    writeFileSync(appsRegistryPath, origAppsRegistry, 'utf8');
    writeFileSync(rootPkgPath, origRootPkg, 'utf8');
    writeFileSync(i18nEnPath, origI18nEn, 'utf8');
    writeFileSync(i18nViPath, origI18nVi, 'utf8');
  });

  it('scaffolds a complete valid micro-app and registers in shell', () => {
    execSync(`node scripts/gen-micro-app.mjs ${testAppName}`, {
      cwd: root,
      stdio: 'pipe',
    });

    expect(existsSync(join(testAppDir, 'package.json'))).toBe(true);
    expect(existsSync(join(testAppDir, 'vite.config.ts'))).toBe(true);
    expect(existsSync(join(testAppDir, 'src', 'main.ts'))).toBe(true);
    expect(existsSync(join(testAppDir, 'src', 'bootstrap.ts'))).toBe(true);
    expect(existsSync(join(testAppDir, 'src', 'manifest.ts'))).toBe(true);
    expect(existsSync(join(testAppDir, 'src', 'remote-entry.ts'))).toBe(true);
    expect(existsSync(join(testAppDir, 'src', 'views', 'index.vue'))).toBe(
      true,
    );

    const pkg = JSON.parse(
      readFileSync(join(testAppDir, 'package.json'), 'utf8'),
    );
    expect(pkg.name).toBe(`@operon/${testAppName}`);
    expect(pkg.dependencies['@operon/kernel']).toBe('workspace:*');

    // Check shell route was created
    expect(existsSync(shellRoutePath)).toBe(true);
  });
});
