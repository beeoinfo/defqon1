import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LINEUP_FILE_SUFFIX = '_defqon_lineup.json';

const requestBody = {
  operationName: 'AppConfig',
  variables: {},
  query: "query AppConfig($slug: String = \"defqon1\" , $w: FloatType = \"500\" , $h: FloatType = null ) { appConfig(filter: { appSlug: { eq: $slug }  } , orderBy: _createdAt_DESC) { __typename ...AppConfigFragment } }  fragment ImageFileFragment on FileField { __typename id height mimeType url(imgixParams: { crop: [faces,focalpoint] fit: crop h: $h w: $w q: 100 dpr: 2 } ) width }  fragment ColorFragment on ColorField { __typename alpha red green blue }  fragment StageCompactFragment on EventEditionStageRecord { __typename _modelApiKey id name image { __typename ...ImageFileFragment } position stageColor { __typename ...ColorFragment } titleColor { __typename ...ColorFragment } }  fragment ActCompactFragment on ActRecord { __typename _modelApiKey id name heroAsset { __typename ...ImageFileFragment } }  fragment PerformanceFragment on PerformanceBlockRecord { __typename _modelApiKey id name image { __typename ...ImageFileFragment } startTime endTime host live featured acts { __typename ...ActCompactFragment } }  fragment StageDayCompactFragment on EventEditionStageDayRecord { __typename _modelApiKey id cmsName stage { __typename ...StageCompactFragment } performances { __typename ...PerformanceFragment } }  fragment DayFullFragment on EventEditionDayRecord { __typename _modelApiKey id name date startTime endTime _allReferencingEventEditionStageDays(orderBy: _status_ASC) { __typename ...StageDayCompactFragment } }  fragment EventEditionFragment on EventEditionRecord { __typename _modelApiKey id name slug artwork { __typename ...ImageFileFragment } location kind _allReferencingEventEditionDays { __typename ...DayFullFragment } }  fragment AppCurrencyFragment on AppCurrencyRecord { __typename id isoCode }  fragment LatLonFragment on LatLonField { __typename latitude longitude }  fragment AppMapboxLayerFragment on AppMapboxLayerRecord { __typename _modelApiKey _updatedAt id key label url appMapboxNortheasternCorner { __typename ...LatLonFragment } appMapboxSouthwesternCorner { __typename ...LatLonFragment } appMapboxCenter { __typename ...LatLonFragment } }  fragment AppConfigFragment on AppConfigRecord { __typename _modelApiKey _updatedAt id appSlug appTicketStatus appMembershipEventId appExperiencesVisibleTo appTicketsaleReleaseDate appTravelsaleReleaseDate appMembersaleReleaseDate ticketUrl waitlistUrl resaleShopUrl appTimezone appBaseLocale enabledOptions appEvent { __typename id } eventEdition { __typename ...EventEditionFragment } appHomePage { __typename id } appCurrency { __typename ...AppCurrencyFragment } privacyPolicyPage { __typename ... on AppOnlyPageRecord { id } ... on PageRecord { id } } appMapboxLayers { __typename ...AppMapboxLayerFragment } }",
  extensions: {
    clientLibrary: {
      name: 'apollo-kotlin',
      version: '4.4.2',
    },
  },
};

async function fetchQdanceDefqonLineup() {
  const response = await fetch('https://www.q-dance.com/graphql/', {
    method: 'POST',
    headers: {
      accept: 'multipart/mixed;deferSpec=20220824, application/graphql-response+json, application/json',
      'x-environment': 'dq26-prod',
      'x-apollo-expire-timeout': '2000',
      'content-type': 'application/json',
      'user-agent': 'okhttp/5.3.2',
    },
    body: JSON.stringify(requestBody),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Q-dance GraphQL request failed: ${response.status} ${response.statusText}\n${text}`);
  }

  return {
    data: JSON.parse(text),
    raw: text,
  };
}

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
  if (leftStage.stageOrder !== null || rightStage.stageOrder !== null) {
    return (leftStage.stageOrder ?? 999) - (rightStage.stageOrder ?? 999);
  }

  const leftSortName = getStageSortName(leftStage);
  const rightSortName = getStageSortName(rightStage);
  const leftPriority = STAGE_PRIORITY_INDEX.get(leftSortName);
  const rightPriority = STAGE_PRIORITY_INDEX.get(rightSortName);

  if (leftPriority !== undefined || rightPriority !== undefined) {
    return (leftPriority ?? 999) - (rightPriority ?? 999);
  }

  return String(leftStage.stageName || '').localeCompare(String(rightStage.stageName || ''));
}

function getStageOrder(stage) {
  const order = Number(stage.position);
  return Number.isFinite(order) ? order : null;
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

  return `${normalizedDate}${LINEUP_FILE_SUFFIX}`;
}

async function readJsonFile(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
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
  const out = path.join(__dirname, formatLineupFilename(getLatestUpdatedDate(data)));

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
      const stageOrder = getStageOrder(stage);
      const stageColor = colorToCss(stage.stageColor);

      if (!stageMap.has(stageSlug)) {
        stageMap.set(stageSlug, {
          stageId,
          stageName,
          stageSlug,
          stageCanonical,
          stageOrder,
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
        });
      });
    });

    const stages = Array.from(stageMap.values()).sort(compareStages);
    const dayDate = day.date ? new Date(day.date) : null;

    daysOut.push({
      daySlug,
      dayOrder,
      dayName,
      dayStartDate: dayDate && !Number.isNaN(dayDate.getTime())
        ? dayDate.toISOString().slice(0, 10)
        : null,
      stages,
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

  const artistCount = daysOut.reduce((s, d) => s + d.stages.reduce((ss, st) => ss + (st.artists?.length || 0), 0), 0);

  if (!(await hasLineupChanged(outObj))) {
    console.log('No lineup changes found. Skipped write.');
    console.log('Current stats:', JSON.stringify({ dayCount: daysOut.length, artistCount }));
    return;
  }

  await writeFile(out, JSON.stringify(outObj, null, 2), 'utf8');
  console.log('Wrote', out, 'with', daysOut.length, 'days and', artistCount, 'artists');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('generate_defqon1_lineup.mjs')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
