import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SITE_REGISTRY } from '../../sites/siteRegistry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_SLUG = 'insane';
const EVENT_EDITION_NAME = 'Insane Festival';
const DEFAULT_SOURCE1_URL = 'https://insanefestival.com/line-up/';
const DEFAULT_SOURCE2_URL = 'https://insanefestival.chapi.to/api/versionData/43/9/2025?lang=fr';
const SOURCE1_NAME = 'site';
const SOURCE2_NAME = 'chapi';
const LINEUP_FILE_SUFFIX = `_${SITE_SLUG}_lineup.json`;
const SILVER = '#c0c0c0';
const PASTEL_BLUE = '#93c5fd';
const FESTIVAL_DAY_START_HOUR = 6;

const DAY_DEFINITIONS = [
  {
    daySlug: 'thursday',
    dayOrder: 1,
    dayName: 'Jeu 14 mai (ferie)',
    dayStartDate: '2026-05-14',
  },
  {
    daySlug: 'friday',
    dayOrder: 2,
    dayName: 'Ven 15 mai',
    dayStartDate: '2026-05-15',
  },
  {
    daySlug: 'saturday',
    dayOrder: 3,
    dayName: 'Sam 16 mai',
    dayStartDate: '2026-05-16',
  },
];

const STAGE_ORDER = ['STAGE MIRAGE', 'STAGE ALT F4', 'TECHNOBUS', 'STAGE CLOUD'];
const CHAPI_STAGE_ORDER = ['Stage Mirage', 'Stage ALT F4', 'Technobus', 'Stage Cloud'];

const siteTheme = SITE_REGISTRY[SITE_SLUG]?.theme ?? {};

const STAGE_COLORS = {
  'STAGE MIRAGE': siteTheme.primary ?? null,
  'STAGE ALT F4': siteTheme.secondary ?? null,
  TECHNOBUS: SILVER,
  'STAGE CLOUD': PASTEL_BLUE,
};

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg.startsWith('--')) {
      continue;
    }

    const key = arg.slice(2);
    const nextValue = argv[index + 1];

    if (!nextValue || nextValue.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = nextValue;
    index += 1;
  }

  return args;
}

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

function normalizeArtistToken(input) {
  return slugify(input).replace(/-+/g, '-');
}

function normalizeArtistName(input) {
  return String(input ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘]/g, "'")
    .replace(/[øØ]/g, 'o')
    .replace(/[æÆ]/g, 'ae')
    .replace(/\*+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function decodeHtmlEntities(value) {
  const namedEntities = {
    amp: '&',
    apos: "'",
    eacute: 'é',
    egrave: 'è',
    ecirc: 'ê',
    agrave: 'à',
    ccedil: 'ç',
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
      .map((part) => part.replace(/\*+/g, '').trim())
  );
}

function getArtistIdentityTokens(artistName) {
  return getArtistTags(artistName)
    .map((tag) => normalizeArtistToken(tag))
    .filter((token) => token.length > 1);
}

function getArtistIdentityKeys(artistName) {
  const fullNameKey = normalizeArtistName(artistName);
  const artistTokens = getArtistIdentityTokens(artistName);
  const tokenKey = artistTokens
    .sort()
    .join('|');

  return uniqueValues([fullNameKey, tokenKey, ...artistTokens]).filter(Boolean);
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

function createStage(stageName, stageOrder, stageId = null) {
  return {
    stageId,
    stageName,
    stageSlug: slugify(stageName),
    stageCanonical: stageName,
    stageOrder: Number.isFinite(stageOrder) ? stageOrder : null,
    stageColor: STAGE_COLORS[stageName] ?? null,
    artists: [],
  };
}

function createArtist({
  artistName,
  daySlug,
  stageSlug,
  artistOrder,
  artistId = null,
  startAt = null,
  endAt = null,
  source,
  genres = [],
  image = null,
}) {
  const artistSlug = slugify(artistName);
  const artistTags = getArtistTags(artistName);
  const artistTokens = uniqueValues(artistTags.map((artistTag) => slugify(artistTag)));

  return {
    id: `${daySlug}_${stageSlug}_${artistSlug}`,
    artistName,
    artistSlug,
    artistId,
    artistOrder,
    startAt,
    endAt,
    host: false,
    live: false,
    featured: false,
    artistTags,
    artistTokens,
    genres,
    image,
    source,
  };
}

function parseSiteLineupHtml(html) {
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
    currentStage.artists.push(
      createArtist({
        artistName,
        daySlug: currentDay.daySlug,
        stageSlug: currentStage.stageSlug,
        artistOrder: currentStage.artists.length + 1,
        source: SOURCE1_NAME,
      })
    );
  });

  return days.filter((day) => day.stages.length > 0);
}

function getHarEntries(har) {
  return har?.log?.entries ?? [];
}

function getResponseTextFromHar(har, matcher) {
  const entry = getHarEntries(har).find((item) => matcher(item.request.url, item));
  return entry?.response?.content?.text ?? null;
}

async function readJsonFile(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function readSiteHtml({ source1Har, source1Url }) {
  if (source1Har) {
    const har = await readJsonFile(source1Har);
    const html = getResponseTextFromHar(
      har,
      (url, entry) =>
        entry.response.status === 200 &&
        /text\/html/i.test(entry.response.content?.mimeType ?? '') &&
        (/\/line-?up\/?$/i.test(new URL(url).pathname) || url === source1Url)
    );

    if (!html) {
      throw new Error(`No lineup HTML response found in ${source1Har}.`);
    }

    return { html, url: source1Har };
  }

  const response = await fetch(source1Url, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'Mozilla/5.0 lineup-reconciler',
    },
  });

  if (!response.ok) {
    throw new Error(`Site lineup request failed (${response.status}).`);
  }

  return { html: await response.text(), url: source1Url };
}

async function readChapiPayload({ source2Har, source2Url }) {
  if (!source2Har) {
    const response = await fetch(source2Url, {
      headers: {
        accept: 'application/json',
        'user-agent': 'okhttp/4.10.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Chapi versionData request failed (${response.status}).`);
    }

    return {
      payload: await response.json(),
      url: source2Url,
    };
  }

  const har = await readJsonFile(source2Har);
  const entry = getHarEntries(har).find(
    (item) =>
      item.response.status === 200 &&
      item.request.url.includes('/api/versionData/') &&
      /application\/json/i.test(item.response.content?.mimeType ?? '')
  );

  if (!entry?.response?.content?.text) {
    throw new Error(`No successful Chapi versionData response found in ${source2Har}.`);
  }

  return {
    payload: JSON.parse(entry.response.content.text),
    url: entry.request.url,
  };
}

function getDayDefinitionFromTimestamp(timestamp) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const festivalDayTimestamp = timestamp - FESTIVAL_DAY_START_HOUR * 60 * 60 * 1000;
  const localDate = formatter.format(new Date(festivalDayTimestamp));

  return DAY_DEFINITIONS.find((day) => day.dayStartDate === localDate) ?? DAY_DEFINITIONS.at(-1);
}

function getIsoDate(timestamp) {
  return new Date(timestamp).toISOString();
}

function compareStages(leftStage, rightStage) {
  if (leftStage.stageOrder !== null || rightStage.stageOrder !== null) {
    return (leftStage.stageOrder ?? 999) - (rightStage.stageOrder ?? 999);
  }

  return String(leftStage.stageName ?? '').localeCompare(String(rightStage.stageName ?? ''));
}

function normalizeChapiStageName(stageName) {
  return String(stageName ?? '').trim().toUpperCase();
}

function buildChapiLineup(payload) {
  const data = payload.data ?? {};
  const scenesById = new Map((data.scenes ?? []).map((scene) => [scene._id, scene]));
  const genresById = new Map((data.genres ?? []).map((genre) => [genre._id, genre]));
  const daysBySlug = new Map(
    DAY_DEFINITIONS.map((day) => [
      day.daySlug,
      {
        ...day,
        stages: [],
      },
    ])
  );

  const sortedEvents = [...(data.events ?? [])].sort(
    (left, right) =>
      left.showStartDate - right.showStartDate ||
      (scenesById.get(left.sceneId)?.weight ?? 0) - (scenesById.get(right.sceneId)?.weight ?? 0) ||
      left.title.localeCompare(right.title)
  );

  sortedEvents.forEach((event) => {
    const dayDefinition = getDayDefinitionFromTimestamp(event.showStartDate);
    const day = daysBySlug.get(dayDefinition.daySlug);
    const scene = scenesById.get(event.sceneId);
    const stageCanonical = normalizeChapiStageName(scene?.name ?? 'Unknown stage');
    const stageOrderIndex = CHAPI_STAGE_ORDER.findIndex(
      (stageName) => stageName.toUpperCase() === stageCanonical
    );
    const stageName = STAGE_ORDER.find((candidate) => candidate === stageCanonical) ?? stageCanonical;
    const stageSlug = slugify(stageName);
    let stage = day.stages.find((item) => item.stageSlug === stageSlug);

    if (!stage) {
      stage = createStage(
        stageName,
        stageOrderIndex >= 0 ? stageOrderIndex + 1 : null,
        event.sceneId ?? null
      );
      day.stages.push(stage);
    }

    stage.artists.push(
      createArtist({
        artistName: event.title,
        daySlug: day.daySlug,
        stageSlug,
        artistOrder: stage.artists.length + 1,
        artistId: event.id ?? null,
        startAt: getIsoDate(event.showStartDate),
        endAt: getIsoDate(event.showEndDate),
        source: SOURCE2_NAME,
        genres: uniqueValues((event.genres ?? []).map((genreId) => genresById.get(genreId)?.name)),
        image: event.image ? `https://static.insanefestival.chapi.to/images/${event.image}` : null,
      })
    );
  });

  return [...daysBySlug.values()]
    .map((day) => ({
      ...day,
      stages: day.stages
        .sort(compareStages)
        .map((stage) => ({
          ...stage,
          artists: stage.artists.sort((left, right) => {
            if (left.startAt && right.startAt) {
              return left.startAt.localeCompare(right.startAt);
            }

            return left.artistOrder - right.artistOrder;
          }),
        })),
    }))
    .filter((day) => day.stages.length > 0);
}

function flattenLineup(lineup) {
  const rows = [];

  lineup.forEach((day) => {
    day.stages.forEach((stage) => {
      stage.artists.forEach((artist) => {
        rows.push({ day, stage, artist });
      });
    });
  });

  return rows;
}

function scheduleValuesMatch(leftValue, rightValue) {
  if (!leftValue || !rightValue) {
    return true;
  }

  return new Date(leftValue).getTime() === new Date(rightValue).getTime();
}

function canSource2ArtistReplaceSource1(source1Row, source2Row) {
  if (source1Row.day.daySlug !== source2Row.day.daySlug) {
    return false;
  }

  if (source1Row.stage.stageSlug !== source2Row.stage.stageSlug) {
    return false;
  }

  return (
    scheduleValuesMatch(source1Row.artist.startAt, source2Row.artist.startAt) &&
    scheduleValuesMatch(source1Row.artist.endAt, source2Row.artist.endAt)
  );
}

function hasSource2ArtistMatch(source1Row, source2Rows) {
  const artistKeys = getArtistIdentityKeys(source1Row.artist.artistName);

  return source2Rows.some((source2Row) => {
    const source2Keys = getArtistIdentityKeys(source2Row.artist.artistName);
    const hasArtistMatch = artistKeys.some((artistKey) => source2Keys.includes(artistKey));

    return hasArtistMatch && canSource2ArtistReplaceSource1(source1Row, source2Row);
  });
}

function mergeLineups({ source1Lineup, source2Lineup }) {
  const mergedLineup = structuredClone(source2Lineup);
  const source2Rows = flattenLineup(source2Lineup);

  flattenLineup(source1Lineup).forEach(({ day, stage, artist }) => {
    if (hasSource2ArtistMatch({ day, stage, artist }, source2Rows)) {
      return;
    }

    let mergedDay = mergedLineup.find((item) => item.daySlug === day.daySlug);

    if (!mergedDay) {
      mergedDay = {
        daySlug: day.daySlug,
        dayOrder: day.dayOrder,
        dayName: day.dayName,
        dayStartDate: day.dayStartDate,
        stages: [],
      };
      mergedLineup.push(mergedDay);
    }

    let mergedStage = mergedDay.stages.find((item) => item.stageSlug === stage.stageSlug);

    if (!mergedStage) {
      mergedStage = {
        ...stage,
        artists: [],
      };
      mergedDay.stages.push(mergedStage);
    }

    mergedStage.artists.push({
      ...artist,
      id: `${artist.id}_source1_only`,
      source: SOURCE1_NAME,
      artistOrder: mergedStage.artists.length + 1,
    });
  });

  return mergedLineup
    .sort((left, right) => left.dayOrder - right.dayOrder)
    .map((day) => ({
      ...day,
      stages: day.stages
        .sort(compareStages)
        .map((stage) => ({
          ...stage,
          artists: stage.artists.map((artist, index) => ({
            ...artist,
            artistOrder: index + 1,
          })),
        })),
    }));
}

function normalizeLineupForOutput(lineup) {
  return lineup.map((day) => {
    const stages = day.stages.map((stage) => ({
      stageId: stage.stageId ?? null,
      stageName: stage.stageName,
      stageSlug: stage.stageSlug,
      stageCanonical: stage.stageCanonical,
      stageOrder: stage.stageOrder ?? null,
      stageColor: stage.stageColor ?? null,
      artists: stage.artists.map((artist) => ({
        id: artist.id,
        artistName: artist.artistName,
        artistSlug: artist.artistSlug,
        artistId: artist.artistId ?? null,
        startAt: artist.startAt ?? null,
        endAt: artist.endAt ?? null,
        host: Boolean(artist.host),
        live: Boolean(artist.live),
        featured: Boolean(artist.featured),
        artistTags: artist.artistTags,
        artistTokens: artist.artistTokens,
      })),
    }));
    return {
      daySlug: day.daySlug,
      dayOrder: day.dayOrder,
      dayName: day.dayName,
      dayStartDate: day.dayStartDate ?? null,
      stages,
    };
  });
}

function getLineupStats(lineup) {
  const rows = flattenLineup(lineup);
  const sourceCounts = rows.reduce((counts, { artist }) => {
    counts[artist.source] = (counts[artist.source] ?? 0) + 1;
    return counts;
  }, {});

  return {
    dayCount: lineup.length,
    stageCount: new Set(rows.map(({ stage }) => stage.stageSlug)).size,
    artistCount: rows.length,
    sourceCounts,
  };
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

  return `${normalizedDate}${LINEUP_FILE_SUFFIX}`;
}

async function findLatestLineupFile() {
  const filenames = await readdir(__dirname);
  const lineupFilenames = filenames
    .filter((filename) => filename.endsWith(LINEUP_FILE_SUFFIX))
    .sort((left, right) => right.localeCompare(left));

  return lineupFilenames[0] ? path.join(__dirname, lineupFilenames[0]) : null;
}

function getComparableLineupData(data) {
  return {
    eventEditionName: data.eventEditionName ?? null,
    mapboxLayers: data.mapboxLayers ?? [],
    lineup: data.lineup ?? [],
  };
}

async function hasLineupChanged(outObj) {
  const latestLineupFile = await findLatestLineupFile();

  if (!latestLineupFile) {
    return true;
  }

  const latestLineup = await readJsonFile(latestLineupFile);
  return (
    JSON.stringify(getComparableLineupData(latestLineup)) !==
    JSON.stringify(getComparableLineupData(outObj))
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const source1Url = args['source1-url'] ?? DEFAULT_SOURCE1_URL;
  const source1Har = args['source1-har'] ?? null;
  const source2Url = args['source2-url'] ?? DEFAULT_SOURCE2_URL;
  const source2Har = args['source2-har'] ?? null;
  const updatedAt = new Date();

  const [source1, source2] = await Promise.all([
    readSiteHtml({ source1Har, source1Url }),
    readChapiPayload({ source2Har, source2Url }),
  ]);

  const source1Lineup = parseSiteLineupHtml(source1.html);
  const source2Lineup = buildChapiLineup(source2.payload);
  const lineup = mergeLineups({ source1Lineup, source2Lineup });
  const stats = getLineupStats(lineup);

  if (stats.artistCount === 0) {
    throw new Error('No Insane lineup artists were found after reconciliation.');
  }

  if (args['dry-run']) {
    console.log('Dry run completed.');
    console.log('Merged stats:', JSON.stringify(stats));
    console.log('Source 1 stats:', JSON.stringify(getLineupStats(source1Lineup)));
    console.log('Source 2 stats:', JSON.stringify(getLineupStats(source2Lineup)));
    return;
  }

  const outObj = {
    eventEditionName: EVENT_EDITION_NAME,
    updatedAt: updatedAt.toISOString(),
    mapboxLayers: [],
    lineup: normalizeLineupForOutput(lineup),
  };
  const shouldWrite = args.force || (await hasLineupChanged(outObj));

  if (!shouldWrite) {
    console.log('No lineup changes found. Skipped write.');
    console.log('Merged stats:', JSON.stringify(stats));
    return;
  }

  const out = path.resolve(args.out ?? path.join(__dirname, formatLineupFilename(updatedAt)));

  await writeFile(out, JSON.stringify(outObj, null, 2), 'utf8');

  console.log('Wrote', out);
  console.log('Merged stats:', JSON.stringify(stats));
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('generate_insane_lineup.mjs')) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
