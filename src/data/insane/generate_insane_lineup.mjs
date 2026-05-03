import crypto from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SITE_REGISTRY } from '../../sites/siteRegistry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_URL = 'https://insanefestival.com/line-up/';
const SITE_SLUG = 'insane';
const EVENT_EDITION_NAME = 'Insane Festival';
const SILVER = '#c0c0c0';
const PASTEL_BLUE = '#93c5fd';

const DAY_DEFINITIONS = [
  {
    daySlug: 'thursday',
    dayOrder: 1,
    dayName: 'Jeu 14 mai (ferie)',
  },
  {
    daySlug: 'friday',
    dayOrder: 2,
    dayName: 'Ven 15 mai',
  },
  {
    daySlug: 'saturday',
    dayOrder: 3,
    dayName: 'Sam 16 mai',
  },
];

const STAGE_ORDER = ['STAGE MIRAGE', 'STAGE ALT F4', 'TECHNOBUS', 'STAGE CLOUD'];

const siteTheme = SITE_REGISTRY[SITE_SLUG]?.theme ?? {};

const STAGE_COLORS = {
  'STAGE MIRAGE': siteTheme.primary ?? null,
  'STAGE ALT F4': siteTheme.secondary ?? null,
  TECHNOBUS: SILVER,
  'STAGE CLOUD': PASTEL_BLUE,
};

function slugify(input) {
  return String(input ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function decodeHtmlEntities(value) {
  const namedEntities = {
    amp: '&',
    apos: "'",
    hellip: '...',
    nbsp: ' ',
    quot: '"',
  };

  return String(value ?? '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (_, name) => namedEntities[name.toLowerCase()] ?? `&${name};`);
}

function stripHtml(value) {
  return decodeHtmlEntities(
    String(value ?? '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueValues(values) {
  const seen = new Set();
  const unique = [];

  values.forEach((value) => {
    const normalizedValue = String(value ?? '').trim().replace(/\s+/g, ' ');
    const key = normalizedValue.toLowerCase();

    if (!normalizedValue || seen.has(key)) {
      return;
    }

    seen.add(key);
    unique.push(normalizedValue);
  });

  return unique;
}

function getArtistTags(artistName) {
  return uniqueValues(
    String(artistName ?? '')
      .split(/\s+(?:b2b|f2f|pres\.?)\s+/gi)
      .map((part) => part.trim())
  );
}

function getLineupHeadings(html) {
  const headingPattern = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  const headings = [];
  let match = headingPattern.exec(html);

  while (match) {
    const level = Number(match[1]);
    const text = stripHtml(match[2]);

    if (text) {
      headings.push({ level, text });
    }

    match = headingPattern.exec(html);
  }

  const lineupIndex = headings.findIndex((heading) => heading.text.toUpperCase() === 'LINE UP');

  return lineupIndex >= 0 ? headings.slice(lineupIndex + 1) : headings;
}

function getStageName(value) {
  const normalizedValue = String(value ?? '').trim().toUpperCase();
  return STAGE_ORDER.find((stageName) => normalizedValue === stageName) ?? null;
}

function getPerformanceHash({ daySlug, stageSlug, artistSlug }) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify([daySlug, stageSlug, artistSlug]))
    .digest('hex');
}

function buildArtist({ artistName, daySlug, stageSlug, artistOrder }) {
  const artistSlug = slugify(artistName);
  const artistTags = getArtistTags(artistName);
  const artistTokens = uniqueValues(artistTags.map((artistTag) => slugify(artistTag)));

  return {
    id: `${daySlug}_${stageSlug}_${artistSlug}`,
    artistName,
    artistSlug,
    artistId: `${stageSlug}_${artistSlug}`,
    artistOrder,
    startAt: null,
    endAt: null,
    host: false,
    live: false,
    featured: false,
    artistTags,
    artistTokens,
    hash: getPerformanceHash({ daySlug, stageSlug, artistSlug }),
  };
}

function createStage(stageName, stageOrder) {
  return {
    stageName,
    stageSlug: slugify(stageName),
    stageCanonical: stageName,
    stageOrder,
    stageColor: STAGE_COLORS[stageName] ?? null,
    artists: [],
  };
}

function parseLineup(html) {
  const headings = getLineupHeadings(html);
  const days = DAY_DEFINITIONS.map((day) => ({
    ...day,
    stages: [],
  }));
  let currentDayIndex = -1;
  let currentStage = null;

  headings.forEach((heading) => {
    const stageName = heading.level === 2 ? getStageName(heading.text) : null;

    if (stageName) {
      const stageOrderIndex = STAGE_ORDER.indexOf(stageName);

      if (stageOrderIndex === 0) {
        currentDayIndex += 1;
      }

      const currentDay = days[currentDayIndex];

      if (!currentDay) {
        currentStage = null;
        return;
      }

      currentStage = createStage(stageName, stageOrderIndex + 1);
      currentDay.stages.push(currentStage);
      return;
    }

    if (!currentStage || heading.level !== 6) {
      return;
    }

    const artistName = heading.text;

    if (!artistName || /^\*+$/.test(artistName)) {
      return;
    }

    const currentDay = days[currentDayIndex];
    const artist = buildArtist({
      artistName,
      daySlug: currentDay.daySlug,
      stageSlug: currentStage.stageSlug,
      artistOrder: currentStage.artists.length + 1,
    });

    currentStage.artists.push(artist);
  });

  return days.filter((day) => day.stages.length > 0);
}

function formatLineupFilename(date) {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const normalizedDate = formatter.format(date).replace(' ', '_').replace(/[-:]/g, '_');

  return `${normalizedDate}_${SITE_SLUG}_lineup.json`;
}

async function fetchLineupHtml() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'Mozilla/5.0 lineup-generator',
    },
  });

  if (!response.ok) {
    throw new Error(`Insane lineup request failed (${response.status}).`);
  }

  return response.text();
}

async function main() {
  const updatedAt = new Date();
  const html = await fetchLineupHtml();
  const lineup = parseLineup(html);
  const out = path.join(__dirname, formatLineupFilename(updatedAt));
  const artistCount = lineup.reduce(
    (total, day) => total + day.stages.reduce((stageTotal, stage) => stageTotal + stage.artists.length, 0),
    0
  );

  if (lineup.length === 0 || artistCount === 0) {
    throw new Error('No Insane lineup artists were found.');
  }

  await writeFile(
    out,
    JSON.stringify({
      eventEditionName: EVENT_EDITION_NAME,
      sourceUrl: SOURCE_URL,
      updatedAt: updatedAt.toISOString(),
      mapboxLayers: [],
      lineup,
    }, null, 2),
    'utf8'
  );

  console.log('Wrote', out, 'with', lineup.length, 'days and', artistCount, 'artists');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('generate_insane_lineup.mjs')) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
