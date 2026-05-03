import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import path from 'node:path';

import { fetchQdanceDefqonLineup } from './qdance_defqon_lineup_fetch.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DAY_ORDER_BY_SLUG = {
  thursday: 1,
  friday: 2,
  saturday: 3,
  sunday: 4,
};

const STAGE_PRIORITY = ['RED', 'BLUE', 'BLACK', 'U.V.', 'GREEN', 'YELLOW'];
const STAGE_PRIORITY_INDEX = new Map(STAGE_PRIORITY.map((stageName, index) => [stageName, index]));

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9\-\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function cleanLatLon(point) {
  if (!point) return null;
  return {
    latitude: point.latitude,
    longitude: point.longitude,
  };
}

function colorToCss(color) {
  if (!color) return null;
  const { red, green, blue, alpha } = color;
  const r = Math.round(red ?? 0);
  const g = Math.round(green ?? 0);
  const b = Math.round(blue ?? 0);
  const a = typeof alpha === 'number' ? +alpha : 1;
  if (a >= 1) {
    return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function uniqueValues(values) {
  const seen = new Set();
  const unique = [];

  values.forEach((value) => {
    const normalizedValue = String(value || '').trim().replace(/\s+/g, ' ');
    const key = normalizedValue.toLowerCase();
    if (!normalizedValue || seen.has(key)) return;

    seen.add(key);
    unique.push(normalizedValue);
  });

  return unique;
}

function getActNameParts(actName) {
  return String(actName || '')
    .split(/\s+&\s+/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function getPerformanceArtistTags(perf) {
  const acts = Array.isArray(perf.acts) ? perf.acts : [];
  const actNames = acts.flatMap((act) => getActNameParts(act?.name || act?.artistName));

  return uniqueValues(actNames.length > 0 ? actNames : getActNameParts(perf.name || 'Unknown'));
}

function getStageCanonical(stageName, stageNames) {
  if (String(stageName || '').trim().toLowerCase() === 'the closing ceremony') {
    return 'Red';
  }

  const normalizedStageName = String(stageName || '').trim().toLowerCase();
  const canonicalMatch = stageNames
    .filter((candidate) => {
      const normalizedCandidate = candidate.toLowerCase();
      return (
        normalizedCandidate !== normalizedStageName &&
        normalizedStageName.startsWith(`${normalizedCandidate} `)
      );
    })
    .sort((a, b) => b.length - a.length)[0];

  return canonicalMatch || stageName;
}

function getStageSortName(stage) {
  return String(stage.stageCanonical || stage.stageName || '').trim().toUpperCase();
}

function compareStages(leftStage, rightStage) {
  const leftSortName = getStageSortName(leftStage);
  const rightSortName = getStageSortName(rightStage);
  const leftPriority = STAGE_PRIORITY_INDEX.get(leftSortName);
  const rightPriority = STAGE_PRIORITY_INDEX.get(rightSortName);

  if (leftPriority !== undefined || rightPriority !== undefined) {
    return (leftPriority ?? 999) - (rightPriority ?? 999);
  }

  return String(leftStage.stageName || '').localeCompare(String(rightStage.stageName || ''));
}

function getPerformanceHash({ daySlug, stageSlug, artistSlug, startAt, endAt }) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify([daySlug, stageSlug, artistSlug, startAt, endAt]))
    .digest('hex');
}

function collectUpdatedDates(value, dates = []) {
  if (!value || typeof value !== 'object') return dates;

  Object.entries(value).forEach(([key, entryValue]) => {
    if (['_updatedAt', 'updatedAt', '_updatedDate', 'updatedDate'].includes(key)) {
      const date = new Date(entryValue);
      if (!Number.isNaN(date.getTime())) {
        dates.push(date);
      }
    }

    if (entryValue && typeof entryValue === 'object') {
      collectUpdatedDates(entryValue, dates);
    }
  });

  return dates;
}

function getLatestUpdatedDate(data) {
  const dates = collectUpdatedDates(data);
  if (dates.length === 0) {
    throw new Error('No updated date found in Q-dance source data.');
  }

  return dates.sort((a, b) => b.getTime() - a.getTime())[0];
}

function formatLineupFilename(date) {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const normalizedDate = formatter.format(date).replace(' ', '_').replace(/[-:]/g, '_');

  return `${normalizedDate}_defqon_lineup.json`;
}

function getDaySortValue(day) {
  const dateValue = day.date || day.startTime || null;
  const dateTimestamp = dateValue ? new Date(dateValue).getTime() : Number.NaN;

  if (!Number.isNaN(dateTimestamp)) {
    return dateTimestamp;
  }

  return DAY_ORDER_BY_SLUG[slugify(day.name)] ?? 999;
}

function getOrderedDays(days) {
  return [...days].sort((leftDay, rightDay) => getDaySortValue(leftDay) - getDaySortValue(rightDay));
}

async function main() {
  const { data } = await fetchQdanceDefqonLineup();
  const out = path.join(__dirname, '..', 'data', formatLineupFilename(getLatestUpdatedDate(data)));

  const app = data?.data?.appConfig;
  if (!app) throw new Error('appConfig not found in JSON');

  const edition = app.eventEdition || {};
  const days = getOrderedDays(edition._allReferencingEventEditionDays || []);
  const stageNames = uniqueValues(
    days.flatMap((day) =>
      (day._allReferencingEventEditionStageDays || []).map((stageDay) => {
        const stage = stageDay.stage || {};
        return stage.name || stage.cmsName || 'UNKNOWN';
      })
    )
  );

  const daysOut = [];

  days.forEach((day, dayIndex) => {
    const daySlug = slugify(day.name || day.date || `day-${dayIndex}`);
    const dayOrder = dayIndex + 1;
    const dayName = day.name || null;

    const stageDays = day._allReferencingEventEditionStageDays || [];
    const stageMap = new Map();

    stageDays.forEach((stageDay) => {
      const stage = stageDay.stage || {};
      const sourceStageName = stage.name || stage.cmsName || 'UNKNOWN';
      const stageName = sourceStageName;
      const stageSlug = slugify(stageName);
      const stageCanonical = getStageCanonical(sourceStageName, stageNames);
      const stageId = stage.id || null;
      const stageColor = colorToCss(stage.stageColor);

      if (!stageMap.has(stageSlug)) {
        stageMap.set(stageSlug, {
          stageId,
          stageName,
          stageSlug,
          stageCanonical,
          stageColor,
          artists: [],
        });
      }

      const stageObj = stageMap.get(stageSlug);

      const performances = stageDay.performances || [];
      performances.forEach((perf, perfIndex) => {
        const artistName = perf.name || 'Unknown';
        const artistSlug = slugify(artistName);
        const artistId = perf.id || `${daySlug}_${stageSlug}_${perfIndex}`;
        const startAt = perf.startTime || null;
        const endAt = perf.endTime || null;
        const host = !!perf.host;
        const live = !!perf.live;
        const artistTags = getPerformanceArtistTags(perf);
        const artistTokens = uniqueValues(artistTags.map((artistTag) => slugify(artistTag)));

        stageObj.artists.push({
          id: `${daySlug}_${stageSlug}_${artistSlug}`,
          artistName,
          artistSlug,
          artistId,
          startAt,
          endAt,
          host,
          live,
          featured: !!perf.featured,
          artistTags,
          artistTokens,
          hash: getPerformanceHash({ daySlug, stageSlug, artistSlug, startAt, endAt }),
        });
      });
    });

    daysOut.push({
      daySlug,
      dayOrder,
      dayName,
      stages: Array.from(stageMap.values()).sort(compareStages),
    });
  });

  const mapboxLayers = (app.appMapboxLayers || []).map((layer) => ({
    id: layer.id,
    key: layer.key,
    label: layer.label,
    styleUrl: layer.url,
    updatedAt: layer._updatedAt || null,
    center: cleanLatLon(layer.appMapboxCenter),
    bounds: {
      northEast: cleanLatLon(layer.appMapboxNortheasternCorner),
      southWest: cleanLatLon(layer.appMapboxSouthwesternCorner),
    },
  }));

  const outObj = {
    eventEditionName: edition.name || null,
    updatedAt: app._updatedAt || null,
    mapboxLayers,
    lineup: daysOut,
  };

  await writeFile(out, JSON.stringify(outObj, null, 2), 'utf8');
  const artistCount = daysOut.reduce((s, d) => s + d.stages.reduce((ss, st) => ss + (st.artists?.length || 0), 0), 0);
  console.log('Wrote', out, 'with', daysOut.length, 'days and', artistCount, 'artists');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('generate_defqon_lineup.mjs')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
