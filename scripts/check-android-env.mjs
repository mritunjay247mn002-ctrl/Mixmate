#!/usr/bin/env node
/**
 * Run before `npx expo run:android` or `npm run android:assemble-release`.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { platform, homedir } from 'node:os';

const errors = [];
const hints = [];

const localAppData = process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local');
const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
const sdkDefault = join(localAppData, 'Android', 'Sdk');
const studioJbr = join(programFiles, 'Android', 'Android Studio', 'jbr');
const studioJbrAlt = join(programFilesX86, 'Android', 'Android Studio', 'jbr');

function ok(msg) {
  console.log(msg);
}

function fail(msg) {
  errors.push(msg);
  console.error(`MISSING: ${msg}`);
}

console.log('MixMate Android environment check\n');

const sdk =
  [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT, sdkDefault].find(
    (p) => p && existsSync(p)
  ) || null;

if (!sdk) {
  fail(`Android SDK not found. Install Android Studio or set ANDROID_HOME. Expected e.g. ${sdkDefault}`);
  hints.push(`setx ANDROID_HOME "${sdkDefault}"`);
} else {
  ok(`Android SDK: ${sdk}`);
  if (process.env.ANDROID_HOME !== sdk && process.env.ANDROID_SDK_ROOT !== sdk) {
    hints.push(`Tip: set ANDROID_HOME to that path (currently not set to it).`);
  }
  const adb = join(sdk, 'platform-tools', platform() === 'win32' ? 'adb.exe' : 'adb');
  if (!existsSync(adb)) {
    fail(`adb missing at ${adb} — install "Android SDK Platform-Tools" in Android Studio SDK Manager`);
  } else {
    ok(`adb: ${adb}`);
  }
}

const javaHome =
  [process.env.JAVA_HOME, studioJbr, studioJbrAlt].find((p) => p && existsSync(p)) || null;
if (!javaHome) {
  fail('JAVA_HOME not set and JDK not found under Android Studio paths. Install JDK 17+ or set JAVA_HOME.');
  hints.push(`setx JAVA_HOME "${studioJbr}"`);
} else {
  ok(`Java: ${javaHome}`);
  if (!process.env.JAVA_HOME) {
    hints.push(`Tip: set JAVA_HOME="${javaHome}" for Gradle/Expo CLI.`);
  }
}

if (hints.length) {
  console.log('\nHints:');
  hints.forEach((h) => console.log(`  ${h}`));
}

if (errors.length) {
  console.error('\nFix the items above, open a NEW terminal, then run: npx expo run:android\n');
  process.exit(1);
}

console.log('\nOK — local Android build/run should find SDK and Java.\n');
process.exit(0);
