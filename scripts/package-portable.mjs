#!/usr/bin/env node

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const targetDir = path.resolve(rootDir, 'apps/workstation/src-tauri/target');

// Auto-detect release directory across default and target-triple outputs (e.g. x86_64-pc-windows-gnu or x86_64-pc-windows-msvc)
const candidateDirs = [
  path.resolve(targetDir, 'release'),
  ...(fs.existsSync(targetDir)
    ? fs
        .readdirSync(targetDir, { withFileTypes: true })
        .filter(
          (d) => d.isDirectory() && d.name !== 'release' && d.name !== 'debug',
        )
        .map((d) => path.resolve(targetDir, d.name, 'release'))
    : []),
];

const releaseDir =
  candidateDirs.find((d) => fs.existsSync(path.join(d, 'bundle/nsis'))) ||
  candidateDirs.find((d) => fs.existsSync(d)) ||
  path.resolve(targetDir, 'release');

const nsisDir = path.resolve(releaseDir, 'bundle/nsis');
const msiDir = path.resolve(releaseDir, 'bundle/msi');
const distDir = path.resolve(rootDir, 'dist-release');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

console.log('--- Packaging Release Artifacts for Distribution ---');

// 1. Locate and standardize NSIS installer
if (fs.existsSync(nsisDir)) {
  const nsisFiles = fs
    .readdirSync(nsisDir)
    .filter((file) => file.endsWith('.exe'));
  if (nsisFiles.length > 0 && nsisFiles[0]) {
    const rawNsis = path.join(nsisDir, nsisFiles[0]);
    const targetSetup = path.join(distDir, 'Operon-Workstation-Setup.exe');
    fs.copyFileSync(rawNsis, targetSetup);
    const sizeMb = (fs.statSync(targetSetup).size / 1024 / 1024).toFixed(2);
    console.log(`✓ Copied NSIS Setup: ${targetSetup} (${sizeMb} MB)`);
  }
}

// 2. Locate and standardize MSI installer if available
if (fs.existsSync(msiDir)) {
  const msiFiles = fs
    .readdirSync(msiDir)
    .filter((file) => file.endsWith('.msi'));
  if (msiFiles.length > 0 && msiFiles[0]) {
    const rawMsi = path.join(msiDir, msiFiles[0]);
    const targetMsi = path.join(distDir, 'Operon-Workstation.msi');
    fs.copyFileSync(rawMsi, targetMsi);
    console.log(`✓ Copied MSI Installer: ${targetMsi}`);
  }
}

// 3. Locate standalone binary and create Portable Zip
const rawExeName = ['Operon.exe', 'workstation.exe'].find((name) =>
  fs.existsSync(path.join(releaseDir, name)),
);
if (rawExeName) {
  const rawExe = path.join(releaseDir, rawExeName);
  const portableZip = path.join(distDir, 'Operon-Workstation-Portable.zip');
  console.log(`Creating portable archive from ${rawExe}...`);
  try {
    execSync(
      `tar -a -c -f "${portableZip}" -C "${releaseDir}" "${rawExeName}"`,
      {
        stdio: 'inherit',
      },
    );
    const sizeMb = (fs.statSync(portableZip).size / 1024 / 1024).toFixed(2);
    console.log(`✓ Created Portable Zip: ${portableZip} (${sizeMb} MB)`);
  } catch {
    try {
      execSync(
        `powershell -Command "Compress-Archive -Path '${rawExe}' -DestinationPath '${portableZip}' -Force"`,
        {
          stdio: 'inherit',
        },
      );
      console.log(`✓ Created Portable Zip via PowerShell: ${portableZip}`);
    } catch (zipError) {
      console.error('Failed to create portable zip:', zipError);
    }
  }
}

// 4. Locate latest.json (Tauri updater metadata) and signature files
const updaterJson = path.join(releaseDir, 'latest.json');
if (fs.existsSync(updaterJson)) {
  const targetJson = path.join(distDir, 'latest.json');
  fs.copyFileSync(updaterJson, targetJson);
  console.log(`✓ Copied updater metadata: ${targetJson}`);
}

// Also copy any .sig files in nsis or msi bundle directories
if (fs.existsSync(nsisDir)) {
  for (const sigFile of fs
    .readdirSync(nsisDir)
    .filter((file) => file.endsWith('.sig'))) {
    fs.copyFileSync(path.join(nsisDir, sigFile), path.join(distDir, sigFile));
    console.log(`✓ Copied signature file: ${sigFile}`);
  }
}

console.log('--- Distribution Artifacts Ready in:', distDir);
