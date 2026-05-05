import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

let loaded = false;

export function loadLocalSettings() {
  if (loaded) return;
  loaded = true;

  const settingsPath = path.resolve(process.cwd(), 'local.settings.json');
  if (!existsSync(settingsPath)) return;

  const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
  const values = settings.Values ?? {};

  Object.entries(values).forEach(([key, value]) => {
    if (process.env[key] === undefined && value !== undefined && value !== null) {
      process.env[key] = String(value);
    }
  });
}
