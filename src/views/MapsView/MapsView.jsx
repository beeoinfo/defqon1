import { useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  CircleNotchIcon,
  CrosshairIcon,
  MinusIcon,
  NavigationArrowIcon,
  PlusIcon,
  TrashIcon,
  WarningIcon,
} from '@phosphor-icons/react';
import FilterBar from '@/components/FilterBar';
import Box from '@/components/layout/Box';
import Drawer from '@/components/layout/Drawer';
import PeopleCard from '@/components/PeopleCard';
import Button from '@/components/primitives/Button';
import {
  buildMapCalibrationTransform,
  getGpsDistanceMeters,
  projectGpsToMap,
  projectMapToGps,
} from '@/lib/mapCalibration';
import './MapsView.css';

const ENV_MAPBOX_ACCESS_TOKEN = String(import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? '').trim();
const MAPBOX_GL_JS_URL = 'https://api.mapbox.com/mapbox-gl-js/v3.12.0/mapbox-gl.js';
const MAPBOX_GL_CSS_URL = 'https://api.mapbox.com/mapbox-gl-js/v3.12.0/mapbox-gl.css';
const MAPBOX_DEFAULT_CENTER = [5.752004901493724, 52.436729962158665];
const MAPBOX_DEFAULT_ZOOM = 16;
const MAPBOX_DEFAULT_BEARING = -36;
const IMAGE_MAP_DEFAULT_ZOOM = 15;
const IMAGE_MAP_MAX_COORDINATE_SPAN = 0.02;
const FEATURE_POPOVER_TIMEOUT_MS = 3000;
const LONG_PRESS_DELAY_MS = 700;
const LONG_PRESS_MOVE_TOLERANCE_PX = 2;
const TRIBE_LOCATION_CLUSTER_DISTANCE_PX = 46;
const TRIBE_LOCATION_DROP_OFFSET_Y = 15;
const TRIBE_LOCATION_FOCUS_ZOOM_OFFSET = 2.5;
const DIRECTION_GPS_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 5000,
};

let mapboxGlLoaderPromise = null;
const styleDefinitionCache = new Map();
const imageDimensionsCache = new Map();

const decodeBase64Url = (value) => {
  if (!value) {
    return '';
  }

  const normalizedValue = String(value).replaceAll('-', '+').replaceAll('_', '/');
  const paddedValue = normalizedValue.padEnd(Math.ceil(normalizedValue.length / 4) * 4, '=');

  try {
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      return window.atob(paddedValue);
    }
  } catch {
    return '';
  }

  return '';
};

const getMapboxTokenOwner = (token) => {
  const payload = String(token ?? '').split('.')[1] ?? '';
  const decodedPayload = decodeBase64Url(payload);

  if (!decodedPayload) {
    return '';
  }

  try {
    const parsedPayload = JSON.parse(decodedPayload);
    return String(parsedPayload.u ?? '').trim();
  } catch {
    return '';
  }
};

const getMapboxAccessTokenForOwner = (styleOwner) => {
  if (!ENV_MAPBOX_ACCESS_TOKEN) {
    return '';
  }

  const normalizedStyleOwner = String(styleOwner ?? '').trim();
  const envTokenOwner = getMapboxTokenOwner(ENV_MAPBOX_ACCESS_TOKEN);

  if (!normalizedStyleOwner || !envTokenOwner || envTokenOwner === normalizedStyleOwner) {
    return ENV_MAPBOX_ACCESS_TOKEN;
  }

  return '';
};

const parseMapboxStyleUrl = (styleUrl) => {
  const match = String(styleUrl ?? '').match(/^mapbox:\/\/styles\/([^/]+)\/([^/?#]+)$/);

  if (!match) {
    return { owner: '', styleId: '' };
  }

  return { owner: match[1], styleId: match[2] };
};

const isImageMapLayer = (layer) => layer?.type === 'image' && Boolean(layer?.imageUrl);

const normalizeMapLayerDay = (value) => (
  String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
);

const getDefaultMapLayerId = (mapLayers, selectedDay) => {
  const normalizedSelectedDay = normalizeMapLayerDay(selectedDay);

  if (!normalizedSelectedDay) {
    return mapLayers[0]?.id ?? '';
  }

  return mapLayers.find((layer) => {
    const candidates = [
      layer.id,
      layer.day,
      layer.daySlug,
      layer.label,
      layer.name,
    ];

    return candidates.some((candidate) => (
      normalizeMapLayerDay(candidate) === normalizedSelectedDay
    ));
  })?.id ?? mapLayers[0]?.id ?? '';
};

const ensureMapboxCss = () => {
  if (typeof document === 'undefined') {
    return;
  }

  const existingLink = document.querySelector('link[data-mapbox-gl-css="true"]');

  if (existingLink) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = MAPBOX_GL_CSS_URL;
  link.dataset.mapboxGlCss = 'true';
  document.head.appendChild(link);
};

const loadMapboxGl = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Mapbox GL JS can only run in a browser.'));
  }

  if (window.mapboxgl) {
    ensureMapboxCss();
    return Promise.resolve(window.mapboxgl);
  }

  ensureMapboxCss();

  if (mapboxGlLoaderPromise) {
    return mapboxGlLoaderPromise;
  }

  mapboxGlLoaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-mapbox-gl-js="true"]');

    const handleLoad = () => {
      if (window.mapboxgl) {
        resolve(window.mapboxgl);
        return;
      }

      mapboxGlLoaderPromise = null;
      reject(new Error('Mapbox GL JS loaded but the global object is missing.'));
    };

    const handleError = () => {
      mapboxGlLoaderPromise = null;
      reject(new Error('Unable to load Mapbox GL JS.'));
    };

    if (existingScript) {
      existingScript.addEventListener('load', handleLoad, { once: true });
      existingScript.addEventListener('error', handleError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = MAPBOX_GL_JS_URL;
    script.async = true;
    script.dataset.mapboxGlJs = 'true';
    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    document.head.appendChild(script);
  });

  return mapboxGlLoaderPromise;
};

const cloneStyleDefinition = (styleDefinition) => JSON.parse(JSON.stringify(styleDefinition));

const loadImageDimensions = (imageUrl) => {
  if (imageDimensionsCache.has(imageUrl)) {
    return imageDimensionsCache.get(imageUrl);
  }

  const promise = new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth || 1,
        height: image.naturalHeight || 1,
      });
    };
    image.onerror = () => {
      resolve({ width: 1, height: 1 });
    };
    image.src = imageUrl;
  });

  imageDimensionsCache.set(imageUrl, promise);
  return promise;
};

const getImageMapCoordinates = ({ width, height }) => {
  const aspectRatio = width / Math.max(height, 1);
  const halfMaxSpan = IMAGE_MAP_MAX_COORDINATE_SPAN / 2;
  const halfWidth = aspectRatio >= 1 ? halfMaxSpan : halfMaxSpan * aspectRatio;
  const halfHeight = aspectRatio >= 1 ? halfMaxSpan / aspectRatio : halfMaxSpan;

  return [
    [-halfWidth, halfHeight],
    [halfWidth, halfHeight],
    [halfWidth, -halfHeight],
    [-halfWidth, -halfHeight],
  ];
};

const FEATURE_TITLE_KEYS = ['name', 'title', 'label', 'ref'];
const FEATURE_DETAIL_KEYS = [
  'description',
  'type',
  'class',
  'amenity',
  'stage',
  'area',
  'building',
];
const LOW_VALUE_PROPERTY_KEYS = new Set([
  'category',
  'color',
  'colour',
  'fid',
  'fill',
  'fill_color',
  'id',
  'icon',
  'objectid',
  'stage id',
  'stage_id',
  'stage-id',
  'stageid',
  'stroke',
  'stroke_color',
  'layer',
  'source',
  'source_layer',
  'tilequery',
]);
const LOW_VALUE_PROPERTY_VALUES = new Set([
  'default',
  'undefined',
  'null',
  'true',
  'false',
]);

const formatFeatureValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (typeof value === 'object') {
    return '';
  }

  return String(value).trim();
};

const isUsefulFeatureValue = (value) => {
  const formattedValue = formatFeatureValue(value);

  if (!formattedValue || LOW_VALUE_PROPERTY_VALUES.has(formattedValue.toLowerCase())) {
    return false;
  }

  return /[a-zA-Z]/.test(formattedValue);
};

const formatFeatureLabel = (key) => (
  String(key ?? '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
);

const getFeatureInfo = (feature) => {
  const properties = feature?.properties ?? {};
  const titleKey = FEATURE_TITLE_KEYS.find((key) => isUsefulFeatureValue(properties[key]));
  const title = titleKey ? formatFeatureValue(properties[titleKey]) : '';
  const usedKeys = new Set(FEATURE_TITLE_KEYS);
  const details = FEATURE_DETAIL_KEYS
    .map((key) => ({
      key,
      label: formatFeatureLabel(key),
      value: formatFeatureValue(properties[key]),
    }))
    .filter((item) => isUsefulFeatureValue(item.value));

  Object.entries(properties).forEach(([key, value]) => {
    const normalizedKey = String(key ?? '').trim().toLowerCase();

    if (
      details.length >= 5 ||
      usedKeys.has(key) ||
      FEATURE_DETAIL_KEYS.includes(key) ||
      LOW_VALUE_PROPERTY_KEYS.has(normalizedKey)
    ) {
      return;
    }

    const formattedValue = formatFeatureValue(value);

    if (!isUsefulFeatureValue(formattedValue)) {
      return;
    }

    details.push({
      key,
      label: formatFeatureLabel(key),
      value: formattedValue,
    });
  });

  return {
    title,
    details,
  };
};

const getInteractiveFeatureAtPoint = (map, point) => {
  if (!map || !point || !map.isStyleLoaded?.()) {
    return null;
  }

  const hitbox = [
    [point.x - 12, point.y - 12],
    [point.x + 12, point.y + 12],
  ];
  let features = [];

  try {
    features = map.queryRenderedFeatures(hitbox) ?? [];
  } catch {
    return null;
  }

  const candidates = features
    .map((feature) => ({
      feature,
      info: getFeatureInfo(feature),
    }))
    .filter(({ info }) => info.title || info.details.length > 0)
    .sort((left, right) => {
      const leftScore = (left.info.title ? 10 : 0) + left.info.details.length;
      const rightScore = (right.info.title ? 10 : 0) + right.info.details.length;

      return rightScore - leftScore;
    });

  return candidates[0]?.feature ?? null;
};

const getFeatureCardPosition = (map, point, cardSize = {}) => {
  const container = map.getContainer();
  const margin = 12;
  const cardWidth = cardSize.width ?? 0;
  const cardHeight = cardSize.height ?? 104;
  const reservedTop = 84;
  const reservedBottom = 92;
  const maxX = Math.max(container.clientWidth - cardWidth - margin, margin);
  const maxY = Math.max(container.clientHeight - cardHeight - reservedBottom, reservedTop);
  const preferredX = point.x - cardWidth / 2;
  const preferredY = point.y - cardHeight - 8;
  const fallbackY = point.y + 8;
  const x = Math.min(Math.max(preferredX, margin), maxX);
  const y = preferredY < reservedTop
    ? Math.min(Math.max(fallbackY, reservedTop), maxY)
    : Math.min(Math.max(preferredY, reservedTop), maxY);

  return { x, y };
};

const normalizeDegrees = (value) => ((Number(value) % 360) + 360) % 360;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const toDegrees = (radians) => (radians * 180) / Math.PI;

const getGpsBearingDegrees = (origin, target) => {
  const originLatitude = toRadians(origin.latitude);
  const targetLatitude = toRadians(target.latitude);
  const deltaLongitude = toRadians(target.longitude - origin.longitude);
  const y = Math.sin(deltaLongitude) * Math.cos(targetLatitude);
  const x =
    Math.cos(originLatitude) * Math.sin(targetLatitude) -
    Math.sin(originLatitude) * Math.cos(targetLatitude) * Math.cos(deltaLongitude);

  return normalizeDegrees(toDegrees(Math.atan2(y, x)));
};

const getDeviceHeadingDegrees = (event) => {
  if (Number.isFinite(event.webkitCompassHeading)) {
    return normalizeDegrees(event.webkitCompassHeading);
  }

  if (Number.isFinite(event.alpha)) {
    return normalizeDegrees(360 - event.alpha);
  }

  return null;
};

const getTargetGpsPoint = (location, activeCalibrationTransform = null) => {
  if (Number.isFinite(location?.gpsLongitude) && Number.isFinite(location?.gpsLatitude)) {
    return {
      longitude: location.gpsLongitude,
      latitude: location.gpsLatitude,
    };
  }

  if (activeCalibrationTransform) {
    const mapLongitude = Number(location?.mapLongitude ?? location?.longitude);
    const mapLatitude = Number(location?.mapLatitude ?? location?.latitude);

    return projectMapToGps({
      longitude: mapLongitude,
      latitude: mapLatitude,
    }, activeCalibrationTransform);
  }

  return null;
};

const hasGpsLocation = (location) => (
  Number.isFinite(location?.gpsLongitude) &&
  Number.isFinite(location?.gpsLatitude)
);

const getProjectedTribeLocation = (location, activeCalibrationTransform, activeLayerId) => {
  const hasGpsPosition =
    Number.isFinite(location.gpsLongitude) &&
    Number.isFinite(location.gpsLatitude);

  if (hasGpsPosition && activeCalibrationTransform) {
    const mapPoint = projectGpsToMap({
      longitude: location.gpsLongitude,
      latitude: location.gpsLatitude,
    }, activeCalibrationTransform);

    if (mapPoint) {
      return {
        ...location,
        mapLongitude: mapPoint.longitude,
        mapLatitude: mapPoint.latitude,
      };
    }
  }

  if (location.mapLayerId && location.mapLayerId !== activeLayerId) {
    return null;
  }

  if (!location.mapLayerId && hasGpsPosition) {
    return null;
  }

  return {
    ...location,
    mapLongitude: location.longitude,
    mapLatitude: location.latitude,
  };
};

const getProjectedLocationPriority = (location, activeLayerId) => {
  if (!location) {
    return -1;
  }

  if (location.locationKind === 'live' && hasGpsLocation(location)) {
    return 3;
  }

  if (location.mapLayerId === activeLayerId) {
    return 2;
  }

  if (hasGpsLocation(location)) {
    return 1;
  }

  return 0;
};

const getTribeLocationGroups = (map, tribeLocations, activeCalibrationTransform = null, activeLayerId = null) => {
  if (!map || !Array.isArray(tribeLocations) || tribeLocations.length === 0) {
    return [];
  }

  const groups = [];
  const projectedLocationsByUserId = new Map();

  tribeLocations.forEach((location) => {
    const projectedLocation = getProjectedTribeLocation(location, activeCalibrationTransform, activeLayerId);

    if (!projectedLocation) {
      return;
    }

    const currentLocation = projectedLocationsByUserId.get(projectedLocation.userId);
    const currentPriority = getProjectedLocationPriority(currentLocation, activeLayerId);
    const nextPriority = getProjectedLocationPriority(projectedLocation, activeLayerId);

    if (
      currentLocation &&
      (
        currentPriority > nextPriority ||
        (
          currentPriority === nextPriority &&
          new Date(currentLocation.updatedAt ?? 0).getTime() >= new Date(projectedLocation.updatedAt ?? 0).getTime()
        )
      )
    ) {
      return;
    }

    projectedLocationsByUserId.set(projectedLocation.userId, projectedLocation);
  });

  projectedLocationsByUserId.forEach((projectedLocation) => {
    const point = map.project([projectedLocation.mapLongitude, projectedLocation.mapLatitude]);
    const existingGroup = groups.find((group) => {
      const distance = Math.hypot(group.x - point.x, group.y - point.y);
      return distance <= TRIBE_LOCATION_CLUSTER_DISTANCE_PX;
    });

    if (existingGroup) {
      existingGroup.locations.push(projectedLocation);
      existingGroup.x = (existingGroup.x + point.x) / 2;
      existingGroup.y = (existingGroup.y + point.y) / 2;
      return;
    }

    groups.push({
      id: projectedLocation.userId,
      x: point.x,
      y: point.y,
      locations: [projectedLocation],
    });
  });

  return groups.map((group) => ({
    ...group,
    id: group.locations
      .map((location) => `${location.userId}:${location.mapLayerId ?? 'default'}:${location.locationKind}`)
      .sort()
      .join(':'),
  }));
};

const formatLocationUpdatedAt = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
};

const isPrimaryMouseLongPressEvent = (event) => {
  const originalEvent = event?.originalEvent;

  if (!originalEvent || originalEvent.type !== 'mousedown') {
    return false;
  }

  return originalEvent.button === 0 && (originalEvent.buttons === undefined || originalEvent.buttons === 1);
};

const isSingleTouchLongPressEvent = (event) => {
  const originalEvent = event?.originalEvent;

  if (!originalEvent || originalEvent.type !== 'touchstart') {
    return false;
  }

  return originalEvent.touches?.length === 1;
};

const isLongPressStartEventAllowed = (event) => (
  isPrimaryMouseLongPressEvent(event) || isSingleTouchLongPressEvent(event)
);

const hasInvalidLongPressMoveEvent = (event, start) => {
  const originalEvent = event?.originalEvent;

  if (!originalEvent) {
    return true;
  }

  if (start.kind === 'touch') {
    return originalEvent.type !== 'touchmove' || originalEvent.touches?.length !== 1;
  }

  return originalEvent.type !== 'mousemove' || originalEvent.buttons !== 1;
};

const normalizeStyleDefinition = (styleDefinition, owner, styleId, layer) => {
  const nextStyleDefinition = cloneStyleDefinition(styleDefinition);
  const spriteValue = String(nextStyleDefinition.sprite ?? '').trim();

  if (spriteValue && (/\/v4\//i.test(spriteValue) || /\.cmap/i.test(spriteValue))) {
    nextStyleDefinition.sprite = `mapbox://sprites/${owner}/${styleId}`;
  }

  nextStyleDefinition.projection = { name: 'mercator' };
  delete nextStyleDefinition.fog;

  if (Array.isArray(nextStyleDefinition.layers)) {
    nextStyleDefinition.layers = nextStyleDefinition.layers.map((styleLayer) => {
      const nextStyleLayer = { ...styleLayer };
      delete nextStyleLayer.scope;
      return nextStyleLayer;
    });
  }

  const sourceBounds = layer?.bounds;

  if (sourceBounds && nextStyleDefinition.sources?.composite) {
    nextStyleDefinition.sources.composite = {
      ...nextStyleDefinition.sources.composite,
      bounds: [
        Number(sourceBounds.southWest?.longitude),
        Number(sourceBounds.southWest?.latitude),
        Number(sourceBounds.northEast?.longitude),
        Number(sourceBounds.northEast?.latitude),
      ],
    };
  }

  return nextStyleDefinition;
};

const getStyleDefinition = async (layer) => {
  if (isImageMapLayer(layer)) {
    const imageDimensions = await loadImageDimensions(layer.imageUrl);

    return {
      version: 8,
      sources: {
        'map-image': {
          type: 'image',
          url: layer.imageUrl,
          coordinates: getImageMapCoordinates(imageDimensions),
        },
      },
      layers: [
        {
          id: 'map-image',
          type: 'raster',
          source: 'map-image',
          paint: {
            'raster-fade-duration': 0,
          },
        },
      ],
    };
  }

  const { owner, styleId } = parseMapboxStyleUrl(layer?.styleUrl);
  const accessToken = getMapboxAccessTokenForOwner(owner);

  if (!owner || !styleId || !accessToken) {
    throw new Error('No accessible Mapbox token was found for this style.');
  }

  const cacheKey = `${owner}/${styleId}:${accessToken}`;
  const cachedStyleDefinition = styleDefinitionCache.get(cacheKey);

  if (cachedStyleDefinition) {
    return cloneStyleDefinition(cachedStyleDefinition);
  }

  const response = await fetch(
    `https://api.mapbox.com/styles/v1/${owner}/${styleId}?access_token=${encodeURIComponent(accessToken)}`
  );

  if (!response.ok) {
    throw new Error(`Mapbox style request failed (${response.status}).`);
  }

  const styleDefinition = normalizeStyleDefinition(await response.json(), owner, styleId, layer);
  styleDefinitionCache.set(cacheKey, styleDefinition);
  return cloneStyleDefinition(styleDefinition);
};

const focusMapOnLayer = (map, layer, animate = true) => {
  if (isImageMapLayer(layer)) {
    const camera = {
      center: [0, 0],
      zoom: Number(layer?.view?.zoom ?? IMAGE_MAP_DEFAULT_ZOOM),
      bearing: 0,
      pitch: 0,
      essential: true,
    };

    if (!animate) {
      map.jumpTo(camera);
      return;
    }

    map.easeTo({
      ...camera,
      duration: 850,
    });
    return;
  }

  const camera = {
    center: [
      Number(layer?.center?.longitude ?? MAPBOX_DEFAULT_CENTER[0]),
      Number(layer?.center?.latitude ?? MAPBOX_DEFAULT_CENTER[1]),
    ],
    zoom: Number(layer?.view?.zoom ?? MAPBOX_DEFAULT_ZOOM),
    bearing: Number(layer?.view?.bearing ?? MAPBOX_DEFAULT_BEARING),
    essential: true,
  };

  if (!animate) {
    map.jumpTo(camera);
    return;
  }

  map.easeTo({
    ...camera,
    duration: 850,
  });
};

const MapsView = ({
  mapLayers = [],
  selectedDay = '',
  tribeLocations = [],
  currentUserId = null,
  focusTribeLocationUserId = null,
  focusTribeLocationMapLayerId = null,
  calibrationPoints = [],
  isCalibrationMode = false,
  calibrationMessage = '',
  isLiveLocationSharing = false,
  liveLocationRemainingMinutes = null,
  onFocusTribeLocationHandled,
  onAddCalibrationPoint,
  onRemoveCalibrationPoint,
  onCancelCalibration,
  onStartLiveLocationSharing,
  onStopLiveLocationSharing,
  onSetTribeLocation,
  onRemoveTribeLocation,
}) => {
  const [selectedLayerId, setSelectedLayerId] = useState(
    () => getDefaultMapLayerId(mapLayers, selectedDay)
  );
  const [viewerState, setViewerState] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [tribeLocationGroups, setTribeLocationGroups] = useState([]);
  const [selectedTribeLocationGroup, setSelectedTribeLocationGroup] = useState(null);
  const [locationErrorMessage, setLocationErrorMessage] = useState('');
  const [calibrationErrorMessage, setCalibrationErrorMessage] = useState('');
  const [isSavingCalibrationPoint, setIsSavingCalibrationPoint] = useState(false);
  const [isRemovingCalibrationPoint, setIsRemovingCalibrationPoint] = useState(false);
  const [pendingCalibrationPoint, setPendingCalibrationPoint] = useState(null);
  const [calibrationMarkers, setCalibrationMarkers] = useState([]);
  const [directionPosition, setDirectionPosition] = useState(null);
  const [directionHeading, setDirectionHeading] = useState(null);
  const [directionErrorMessage, setDirectionErrorMessage] = useState('');
  const [isDirectionTracking, setIsDirectionTracking] = useState(false);
  const [doesDirectionNeedPermission, setDoesDirectionNeedPermission] = useState(false);
  const [activeDirectionTargetUserId, setActiveDirectionTargetUserId] = useState(null);
  const featurePopoverTimeoutRef = useRef(0);
  const longPressTimeoutRef = useRef(0);
  const longPressStartRef = useRef(null);
  const shouldIgnoreNextMapClickRef = useRef(false);
  const tribeLocationGroupsSignatureRef = useRef('');
  const calibrationMarkersSignatureRef = useRef('');
  const directionGeolocationWatchIdRef = useRef(null);
  const directionOrientationHandlerRef = useRef(null);
  const featureCardRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const isCalibrationModeRef = useRef(isCalibrationMode);
  const currentStyleUrlRef = useRef('');
  const isMapReadyRef = useRef(false);
  const pendingStyleRequestIdRef = useRef(0);

  const resolvedSelectedLayerId = mapLayers.some((layer) => layer.id === selectedLayerId)
    ? selectedLayerId
    : getDefaultMapLayerId(mapLayers, selectedDay);
  const activeLayer = mapLayers.find((layer) => layer.id === resolvedSelectedLayerId) ?? mapLayers[0] ?? null;
  const { owner: activeOwner } = parseMapboxStyleUrl(activeLayer?.styleUrl);
  const isActiveImageLayer = isImageMapLayer(activeLayer);
  const activeCalibrationPoints = useMemo(
    () => calibrationPoints
      .filter((point) => point.mapLayerId === activeLayer?.id)
      .sort((leftPoint, rightPoint) => (
        new Date(leftPoint.createdAt ?? leftPoint.updatedAt ?? 0).getTime() -
        new Date(rightPoint.createdAt ?? rightPoint.updatedAt ?? 0).getTime()
      )),
    [activeLayer?.id, calibrationPoints]
  );
  const activeCalibrationTransform = useMemo(
    () => buildMapCalibrationTransform(activeCalibrationPoints),
    [activeCalibrationPoints]
  );
  const mapLayerChoices = useMemo(
    () => mapLayers.map((layer) => ({
      id: layer.id,
      name: 'mapLayer',
      type: 'radio',
      value: layer.id,
      label: layer.label,
    })),
    [mapLayers]
  );

  useEffect(() => {
    isCalibrationModeRef.current = isCalibrationMode;
  }, [isCalibrationMode]);

  const clearFeaturePopover = () => {
    window.clearTimeout(featurePopoverTimeoutRef.current);
    setSelectedFeature(null);
  };

  const stopDirectionTracking = () => {
    if (directionGeolocationWatchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(directionGeolocationWatchIdRef.current);
    }

    if (directionOrientationHandlerRef.current) {
      window.removeEventListener('deviceorientationabsolute', directionOrientationHandlerRef.current);
      window.removeEventListener('deviceorientation', directionOrientationHandlerRef.current);
    }

    directionGeolocationWatchIdRef.current = null;
    directionOrientationHandlerRef.current = null;
    setIsDirectionTracking(false);
    setDoesDirectionNeedPermission(false);
    setActiveDirectionTargetUserId(null);
  };

  const handleStartDirectionTracking = async (targetUserId) => {
    setDirectionErrorMessage('');
    setActiveDirectionTargetUserId(targetUserId);

    if (!navigator.geolocation) {
      setDirectionErrorMessage('GPS is not available on this device.');
      return;
    }

    if (directionGeolocationWatchIdRef.current === null) {
      const handlePosition = (position) => {
        setDirectionPosition({
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
          accuracy: position.coords.accuracy,
        });
        setIsDirectionTracking(true);
      };

      navigator.geolocation.getCurrentPosition(handlePosition, (error) => {
        setDirectionErrorMessage(error.message || 'Could not access your current position.');
      }, DIRECTION_GPS_OPTIONS);

      directionGeolocationWatchIdRef.current = navigator.geolocation.watchPosition(handlePosition, (error) => {
        setDirectionErrorMessage(error.message || 'Could not update your current position.');
      }, DIRECTION_GPS_OPTIONS);
    }

    if (!('DeviceOrientationEvent' in window)) {
      setDirectionErrorMessage('Compass is not available here. Distance and bearing still work with GPS.');
      return;
    }

    const DeviceOrientation = window.DeviceOrientationEvent;

    if (typeof DeviceOrientation.requestPermission === 'function') {
      const permission = await DeviceOrientation.requestPermission();

      if (permission !== 'granted') {
        setDirectionErrorMessage('Compass permission was not granted. Distance and bearing still work with GPS.');
        setDoesDirectionNeedPermission(true);
        return;
      }
    }

    if (!directionOrientationHandlerRef.current) {
      const handleOrientation = (event) => {
        const heading = getDeviceHeadingDegrees(event);

        if (heading !== null) {
          setDirectionHeading(heading);
          setDoesDirectionNeedPermission(false);
        }
      };

      directionOrientationHandlerRef.current = handleOrientation;
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
      setIsDirectionTracking(true);
    }
  };

  const showFeaturePopover = (feature, point) => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    window.clearTimeout(featurePopoverTimeoutRef.current);
    setSelectedFeature({
      ...getFeatureInfo(feature),
      anchorPoint: { x: point.x, y: point.y },
      position: getFeatureCardPosition(map, point),
    });
    featurePopoverTimeoutRef.current = window.setTimeout(() => {
      setSelectedFeature(null);
    }, FEATURE_POPOVER_TIMEOUT_MS);
  };

  const updateTribeLocationGroups = useEffectEvent(() => {
    const map = mapRef.current;
    const nextGroups = getTribeLocationGroups(map, tribeLocations, activeCalibrationTransform, activeLayer?.id);
    const nextSignature = nextGroups
      .map((group) => `${group.id}:${Math.round(group.x)}:${Math.round(group.y)}`)
      .join('|');

    if (nextSignature === tribeLocationGroupsSignatureRef.current) {
      return;
    }

    tribeLocationGroupsSignatureRef.current = nextSignature;
    setTribeLocationGroups(nextGroups);
  });

  const updateCalibrationMarkers = useEffectEvent(() => {
    const map = mapRef.current;

    if (!map || !isCalibrationModeRef.current) {
      if (calibrationMarkersSignatureRef.current === '') {
        return;
      }

      calibrationMarkersSignatureRef.current = '';
      setCalibrationMarkers([]);
      return;
    }

    const savedMarkers = activeCalibrationPoints.map((point, index) => {
      const projectedPoint = map.project([point.mapLongitude, point.mapLatitude]);

      return {
        id: point.id,
        pointId: point.id,
        kind: 'saved',
        label: index + 1,
        x: projectedPoint.x,
        y: projectedPoint.y,
      };
    });

    const nextMarkers = [...savedMarkers];

    if (pendingCalibrationPoint) {
      const projectedPendingPoint = map.project([
        pendingCalibrationPoint.longitude,
        pendingCalibrationPoint.latitude,
      ]);

      nextMarkers.push({
        id: 'pending',
        kind: 'pending',
        label: '+',
        x: projectedPendingPoint.x,
        y: projectedPendingPoint.y,
      });
    }

    const nextSignature = nextMarkers
      .map((marker) => `${marker.id}:${Math.round(marker.x)}:${Math.round(marker.y)}`)
      .join('|');

    if (nextSignature === calibrationMarkersSignatureRef.current) {
      return;
    }

    calibrationMarkersSignatureRef.current = nextSignature;
    setCalibrationMarkers(nextMarkers);
  });

  const clearLongPress = () => {
    window.clearTimeout(longPressTimeoutRef.current);
    longPressTimeoutRef.current = 0;
    longPressStartRef.current = null;
  };

  const handleLongPressStart = useEffectEvent((event) => {
    if (isCalibrationModeRef.current) {
      clearLongPress();
      return;
    }

    if (!isLongPressStartEventAllowed(event)) {
      clearLongPress();
      return;
    }

    if (!event?.lngLat || !event?.point) {
      return;
    }

    clearLongPress();
    longPressStartRef.current = {
      point: event.point,
      lngLat: event.lngLat,
      kind: event.originalEvent.type === 'touchstart' ? 'touch' : 'mouse',
    };
    longPressTimeoutRef.current = window.setTimeout(() => {
      const start = longPressStartRef.current;

      if (!start) {
        return;
      }

      clearFeaturePopover();
      setLocationErrorMessage('');
      shouldIgnoreNextMapClickRef.current = true;
      const map = mapRef.current;
      const droppedLngLat = map?.unproject
        ? map.unproject({
            x: start.point.x,
            y: start.point.y + TRIBE_LOCATION_DROP_OFFSET_Y,
          })
        : start.lngLat;

      Promise.resolve(onSetTribeLocation?.({
        longitude: droppedLngLat.lng,
        latitude: droppedLngLat.lat,
        mapLayerId: activeLayer?.id,
      })).catch((error) => {
        setLocationErrorMessage(
          error instanceof Error ? error.message : 'Could not share this map position.'
        );
      });
      clearLongPress();
    }, LONG_PRESS_DELAY_MS);
  });

  const handleLongPressMove = useEffectEvent((event) => {
    const start = longPressStartRef.current;

    if (!start || !event?.point) {
      return;
    }

    if (hasInvalidLongPressMoveEvent(event, start)) {
      clearLongPress();
      return;
    }

    const distance = Math.hypot(event.point.x - start.point.x, event.point.y - start.point.y);

    if (distance > LONG_PRESS_MOVE_TOLERANCE_PX) {
      clearLongPress();
    }
  });

  useLayoutEffect(() => {
    const map = mapRef.current;
    const featureCard = featureCardRef.current;

    if (!map || !featureCard || !selectedFeature?.anchorPoint) {
      return;
    }

    const nextPosition = getFeatureCardPosition(map, selectedFeature.anchorPoint, {
      width: featureCard.offsetWidth,
      height: featureCard.offsetHeight,
    });

    if (
      nextPosition.x !== selectedFeature.position.x
      || nextPosition.y !== selectedFeature.position.y
    ) {
      setSelectedFeature((currentFeature) => (
        currentFeature
          ? { ...currentFeature, position: nextPosition }
          : currentFeature
      ));
    }
  }, [selectedFeature]);

  const syncActiveLayer = useEffectEvent((animate = true) => {
    const map = mapRef.current;

    if (!map || !activeLayer) {
      return;
    }

    const { owner } = parseMapboxStyleUrl(activeLayer.styleUrl);
    const accessToken = getMapboxAccessTokenForOwner(owner);
    const mapboxgl = window.mapboxgl;

    if (!isImageMapLayer(activeLayer) && (!accessToken || !mapboxgl)) {
      setErrorMessage('No accessible Mapbox token was found for this style.');
      setViewerState('error');
      return;
    }

    if (accessToken) {
      mapboxgl.accessToken = accessToken;
    }
    setErrorMessage('');

    const activeStyleKey = activeLayer.styleUrl ?? activeLayer.imageUrl;

    if (currentStyleUrlRef.current === activeStyleKey) {
      focusMapOnLayer(map, activeLayer, animate);
      setViewerState('ready');
      return;
    }

    setViewerState('loading');
    setErrorMessage('');
    clearFeaturePopover();

    const nextRequestId = pendingStyleRequestIdRef.current + 1;
    pendingStyleRequestIdRef.current = nextRequestId;

    getStyleDefinition(activeLayer)
      .then((styleDefinition) => {
        if (pendingStyleRequestIdRef.current !== nextRequestId || map !== mapRef.current) {
          return;
        }

        map.once('style.load', () => {
          if (pendingStyleRequestIdRef.current !== nextRequestId || map !== mapRef.current) {
            return;
          }

          currentStyleUrlRef.current = activeStyleKey;
          focusMapOnLayer(map, activeLayer, animate);
          clearFeaturePopover();
          updateTribeLocationGroups();
          setViewerState('ready');
        });

        map.setStyle(styleDefinition);
      })
      .catch((error) => {
        if (pendingStyleRequestIdRef.current !== nextRequestId || map !== mapRef.current) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load the selected Mapbox style.'
        );
        setViewerState('error');
      });
  });

  useEffect(() => {
    if (!activeLayer || !mapContainerRef.current || mapRef.current) {
      return undefined;
    }

    let isCancelled = false;
    let resizeHandler = null;

    loadMapboxGl()
      .then((mapboxgl) => {
        if (isCancelled || !mapContainerRef.current) {
          return;
        }

        if (!mapboxgl.supported()) {
          setViewerState('unsupported');
          setErrorMessage('This browser does not support Mapbox GL JS.');
          return;
        }

        const accessToken = getMapboxAccessTokenForOwner(activeOwner);

        if (!isActiveImageLayer && !accessToken) {
          setViewerState('error');
          setErrorMessage('No accessible Mapbox token was found for this style.');
          return;
        }

        if (accessToken) {
          mapboxgl.accessToken = accessToken;
        }
        const nextRequestId = pendingStyleRequestIdRef.current + 1;
        pendingStyleRequestIdRef.current = nextRequestId;

        getStyleDefinition(activeLayer)
          .then((styleDefinition) => {
            if (isCancelled || !mapContainerRef.current || pendingStyleRequestIdRef.current !== nextRequestId) {
              return;
            }

            const map = new mapboxgl.Map({
              container: mapContainerRef.current,
              style: styleDefinition,
              center: [
                Number(activeLayer?.center?.longitude ?? (isActiveImageLayer ? 0 : MAPBOX_DEFAULT_CENTER[0])),
                Number(activeLayer?.center?.latitude ?? (isActiveImageLayer ? 0 : MAPBOX_DEFAULT_CENTER[1])),
              ],
              zoom: Number(activeLayer?.view?.zoom ?? (isActiveImageLayer ? IMAGE_MAP_DEFAULT_ZOOM : MAPBOX_DEFAULT_ZOOM)),
              bearing: Number(activeLayer?.view?.bearing ?? (isActiveImageLayer ? 0 : MAPBOX_DEFAULT_BEARING)),
              pitch: 0,
              projection: 'mercator',
              renderWorldCopies: false,
              attributionControl: true,
            });

            mapRef.current = map;
            currentStyleUrlRef.current = activeLayer.styleUrl ?? activeLayer.imageUrl;

            map.on('load', () => {
              if (isCancelled) {
                return;
              }

              isMapReadyRef.current = true;
              focusMapOnLayer(map, activeLayer, false);
              updateTribeLocationGroups();
              updateCalibrationMarkers();
              setViewerState('ready');
            });

            map.on('click', (event) => {
              if (shouldIgnoreNextMapClickRef.current) {
                shouldIgnoreNextMapClickRef.current = false;
                return;
              }

              if (isCalibrationModeRef.current) {
                clearFeaturePopover();
                setCalibrationErrorMessage('');
                const droppedLngLat = map.unproject({
                  x: event.point.x,
                  y: event.point.y + TRIBE_LOCATION_DROP_OFFSET_Y,
                });

                setPendingCalibrationPoint({
                  longitude: droppedLngLat.lng,
                  latitude: droppedLngLat.lat,
                });
                return;
              }

              const feature = getInteractiveFeatureAtPoint(map, event.point);

              if (feature) {
                showFeaturePopover(feature, event.point);
              }
            });

            map.on('mousedown', handleLongPressStart);
            map.on('touchstart', handleLongPressStart);
            map.on('mousemove', handleLongPressMove);
            map.on('touchmove', handleLongPressMove);
            map.on('mouseup', clearLongPress);
            map.on('touchend', clearLongPress);
            map.on('touchcancel', clearLongPress);
            map.on('dragstart', clearLongPress);
            map.on('move', updateTribeLocationGroups);
            map.on('zoom', updateTribeLocationGroups);
            map.on('move', updateCalibrationMarkers);
            map.on('zoom', updateCalibrationMarkers);

            map.on('mousemove', (event) => {
              const feature = getInteractiveFeatureAtPoint(map, event.point);
              map.getCanvas().style.cursor = feature ? 'pointer' : '';
            });

            map.on('mouseleave', () => {
              map.getCanvas().style.cursor = '';
            });

            map.on('error', (event) => {
              if (isCancelled) {
                return;
              }

              const nextErrorMessage = String(event?.error?.message ?? '').trim();

              if (!nextErrorMessage) {
                return;
              }

              if (
                isMapReadyRef.current &&
                !/access token|style|stylesheet|401|403|404|failed to load/i.test(nextErrorMessage)
              ) {
                return;
              }

              setErrorMessage(nextErrorMessage);
              setViewerState('error');
            });

            resizeHandler = () => {
              if (!mapRef.current) {
                return;
              }

              mapRef.current.resize();
              updateTribeLocationGroups();
              updateCalibrationMarkers();
            };

            window.addEventListener('resize', resizeHandler);
          })
          .catch((error) => {
            if (isCancelled || pendingStyleRequestIdRef.current !== nextRequestId) {
              return;
            }

            setErrorMessage(
              error instanceof Error ? error.message : 'Unable to load the selected Mapbox style.'
            );
            setViewerState('error');
          });
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : 'Unable to load Mapbox GL JS.');
        setViewerState('error');
      });

    return () => {
      isCancelled = true;
      isMapReadyRef.current = false;
      pendingStyleRequestIdRef.current += 1;

      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
      }

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      window.clearTimeout(featurePopoverTimeoutRef.current);
      if (directionGeolocationWatchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(directionGeolocationWatchIdRef.current);
      }

      if (directionOrientationHandlerRef.current) {
        window.removeEventListener('deviceorientationabsolute', directionOrientationHandlerRef.current);
        window.removeEventListener('deviceorientation', directionOrientationHandlerRef.current);
      }

      clearLongPress();
      currentStyleUrlRef.current = '';
    };
  }, [activeLayer, activeOwner, isActiveImageLayer]);

  useEffect(() => {
    if (!isMapReadyRef.current || !activeLayer) {
      return;
    }

    syncActiveLayer(true);
  }, [activeLayer]);

  useEffect(() => {
    if (
      !focusTribeLocationMapLayerId ||
      focusTribeLocationMapLayerId === activeLayer?.id ||
      !mapLayers.some((layer) => layer.id === focusTribeLocationMapLayerId)
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSelectedLayerId(focusTribeLocationMapLayerId);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [activeLayer?.id, focusTribeLocationMapLayerId, mapLayers]);

  useEffect(() => {
    updateTribeLocationGroups();
  }, [activeCalibrationTransform, tribeLocations]);

  useEffect(() => {
    updateCalibrationMarkers();
  }, [activeCalibrationPoints, isCalibrationMode, pendingCalibrationPoint]);

  useEffect(() => {
    if (!isCalibrationMode) {
      const timeout = window.setTimeout(() => {
        setPendingCalibrationPoint(null);
        setCalibrationErrorMessage('');
        setIsSavingCalibrationPoint(false);
        setIsRemovingCalibrationPoint(false);
        calibrationMarkersSignatureRef.current = '';
      }, 0);

      return () => window.clearTimeout(timeout);
    }

    return undefined;
  }, [isCalibrationMode]);

  useEffect(() => {
    if (!focusTribeLocationUserId || !isMapReadyRef.current || tribeLocationGroups.length === 0) {
      return;
    }

    const targetGroup = tribeLocationGroups.find((group) =>
      group.locations.some((location) => location.userId === focusTribeLocationUserId)
    );
    const targetLocation = targetGroup?.locations.find(
      (location) => location.userId === focusTribeLocationUserId
    );

    if (!targetGroup || !targetLocation || !mapRef.current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const baseZoom = Number(activeLayer?.view?.zoom ?? (isActiveImageLayer ? IMAGE_MAP_DEFAULT_ZOOM : MAPBOX_DEFAULT_ZOOM));
      const targetZoom = Math.max(mapRef.current?.getZoom() ?? baseZoom, baseZoom + TRIBE_LOCATION_FOCUS_ZOOM_OFFSET);

      clearFeaturePopover();
      setSelectedTribeLocationGroup(targetGroup);
      mapRef.current?.easeTo({
        center: [targetLocation.mapLongitude, targetLocation.mapLatitude],
        zoom: targetZoom,
        duration: 650,
        essential: true,
      });
      onFocusTribeLocationHandled?.();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [activeLayer, focusTribeLocationUserId, isActiveImageLayer, onFocusTribeLocationHandled, tribeLocationGroups]);

  if (!mapLayers.length) {
    return null;
  }

  const handleZoomIn = (event) => {
    mapRef.current?.zoomIn();
    event.currentTarget.blur();
  };

  const handleZoomOut = (event) => {
    mapRef.current?.zoomOut();
    event.currentTarget.blur();
  };

  const handleResetMap = (event) => {
    if (mapRef.current && activeLayer) {
      focusMapOnLayer(mapRef.current, activeLayer, true);
      clearFeaturePopover();
    }

    event.currentTarget.blur();
  };

  const handleSaveCalibrationPoint = (scope) => {
    if (!pendingCalibrationPoint || !activeLayer?.id || isSavingCalibrationPoint || isRemovingCalibrationPoint) {
      return;
    }

    const mapLayerIds = scope === 'site'
      ? mapLayers.map((layer) => layer.id).filter(Boolean)
      : [activeLayer.id];

    setIsSavingCalibrationPoint(true);
    setCalibrationErrorMessage('');
    Promise.resolve(onAddCalibrationPoint?.({
      mapLayerIds,
      mapLongitude: pendingCalibrationPoint.longitude,
      mapLatitude: pendingCalibrationPoint.latitude,
    }))
      .then(() => setPendingCalibrationPoint(null))
      .catch((error) => {
        setCalibrationErrorMessage(error instanceof Error ? error.message : 'Could not save calibration point.');
      })
      .finally(() => {
        setIsSavingCalibrationPoint(false);
      });
  };

  const handleRemoveCalibrationPoint = (pointId) => {
    if (isSavingCalibrationPoint || isRemovingCalibrationPoint) {
      return;
    }

    setIsRemovingCalibrationPoint(true);
    setCalibrationErrorMessage('');
    setPendingCalibrationPoint(null);
    calibrationMarkersSignatureRef.current = '';
    setCalibrationMarkers((currentMarkers) => (
      currentMarkers.filter((marker) => marker.pointId !== pointId)
    ));
    Promise.resolve(onRemoveCalibrationPoint?.(pointId))
      .catch((error) => {
        setCalibrationErrorMessage(error instanceof Error ? error.message : 'Could not remove calibration point.');
      })
      .finally(() => {
        calibrationMarkersSignatureRef.current = '';
        setIsRemovingCalibrationPoint(false);
      });
  };

  const handleCloseTribeLocationDrawer = () => {
    stopDirectionTracking();
    setDirectionErrorMessage('');
    setDirectionPosition(null);
    setDirectionHeading(null);
    setSelectedTribeLocationGroup(null);
  };

  const handleOpenTribeLocationGroup = (group) => {
    const hasActiveTargetInGroup = group.locations.some((location) => (
      location.userId === activeDirectionTargetUserId
    ));

    if (!hasActiveTargetInGroup) {
      stopDirectionTracking();
      setDirectionErrorMessage('');
      setDirectionPosition(null);
      setDirectionHeading(null);
    }

    clearFeaturePopover();
    setSelectedTribeLocationGroup(group);
  };

  const selectedDrawerLocations = selectedTribeLocationGroup?.locations ?? [];
  const directionTargetLocations = selectedDrawerLocations.filter((location) => (
    location.userId !== currentUserId && getTargetGpsPoint(location, activeCalibrationTransform)
  ));
  const selectedDirectionLocation =
    directionTargetLocations.find((location) => location.userId === activeDirectionTargetUserId) ??
    directionTargetLocations[0] ??
    null;
  const selectedDirectionTargetGpsPoint = selectedDirectionLocation
    ? getTargetGpsPoint(selectedDirectionLocation, activeCalibrationTransform)
    : null;
  const canShowDirection = Boolean(selectedDirectionTargetGpsPoint && directionPosition);
  const directionTargetBearing = canShowDirection
    ? getGpsBearingDegrees(directionPosition, selectedDirectionTargetGpsPoint)
    : null;
  const directionRelativeBearing = directionTargetBearing !== null && directionHeading !== null
    ? normalizeDegrees(directionTargetBearing - directionHeading)
    : directionTargetBearing;
  const directionDistanceMeters = canShowDirection
    ? getGpsDistanceMeters(directionPosition, selectedDirectionTargetGpsPoint)
    : null;

  return (
    <Box component="section" className="dq-maps-view" gap="0">
      <Box
        ref={mapContainerRef}
        className="dq-maps-view__canvas"
        role="application"
        aria-label={`Interactive festival map for ${activeLayer?.label ?? 'Defqon.1'}`}
      />

      <Box className="dq-maps-view__shade" aria-hidden="true" />

      <Box className="dq-maps-view__tribe-layer" aria-label="Tribe map positions">
        {tribeLocationGroups.map((group) => {
          const primaryLocation = group.locations.find((location) => location.isCurrentUser) ?? group.locations[0];
          const groupLabel = group.locations.length === 1
            ? `${primaryLocation.displayName} position`
            : `${group.locations.length} tribe members nearby`;

          return (
            <button
              key={group.id}
              type="button"
              className={[
                'dq-maps-view__tribe-marker',
                primaryLocation.isCurrentUser ? 'dq-maps-view__tribe-marker--self' : '',
                group.locations.length > 1 ? 'dq-maps-view__tribe-marker--group' : '',
              ].filter(Boolean).join(' ')}
              style={{
                '--dq-maps-marker-x': `${group.x}px`,
                '--dq-maps-marker-y': `${group.y}px`,
              }}
              aria-label={groupLabel}
              title={groupLabel}
              onClick={() => handleOpenTribeLocationGroup(group)}
            >
              <img
                src={primaryLocation.avatarUrl}
                alt=""
                className="dq-maps-view__tribe-marker-avatar"
              />
              {group.locations.length > 1 ? (
                <span className="dq-maps-view__tribe-marker-count">
                  {group.locations.length}
                </span>
              ) : null}
            </button>
          );
        })}
      </Box>

      {isCalibrationMode ? (
        <Box className="dq-maps-view__calibration-layer" aria-label="Map calibration points">
          {calibrationMarkers.map((marker) => (
            <button
              key={marker.id}
              type="button"
              className={[
                'dq-maps-view__calibration-point',
                marker.kind === 'pending' ? 'dq-maps-view__calibration-point--pending' : '',
              ].filter(Boolean).join(' ')}
              style={{
                '--dq-maps-calibration-x': `${marker.x}px`,
                '--dq-maps-calibration-y': `${marker.y}px`,
              }}
              aria-label={marker.kind === 'pending' ? 'Pending calibration point' : 'Remove calibration point'}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
                if (marker.kind === 'saved') {
                  handleRemoveCalibrationPoint(marker.pointId);
                }
              }}
            >
              {marker.label}
            </button>
          ))}
        </Box>
      ) : null}

      <Box className="dq-maps-view__controls" gap="var(--dq-ui-space-xs)">
        <Button
          className="dq-maps-view__zoom-button"
          icon={PlusIcon}
          size="sm"
          radius="rounded"
          ariaLabel="Zoom in"
          title="Zoom in"
          onClick={handleZoomIn}
        />
        <Button
          className="dq-maps-view__zoom-button"
          icon={MinusIcon}
          size="sm"
          radius="rounded"
          ariaLabel="Zoom out"
          title="Zoom out"
          onClick={handleZoomOut}
        />
        <Button
          className="dq-maps-view__zoom-button"
          icon={CrosshairIcon}
          size="sm"
          radius="rounded"
          ariaLabel="Reset map view"
          title="Reset map view"
          onClick={handleResetMap}
        />
      </Box>

      {isCalibrationMode ? (
        <Box className="dq-maps-view__calibration-panel" gap="var(--dq-ui-space-sm)">
          <strong>Map calibration</strong>
          <p>
            Tap your exact position on the map, then save it with your current GPS location.
          </p>
          {calibrationMessage ? <p>{calibrationMessage}</p> : null}
          {calibrationErrorMessage ? (
            <p className="dq-maps-view__calibration-error">{calibrationErrorMessage}</p>
          ) : null}
          <p>{activeCalibrationPoints.length} / 3 active points on this map</p>
          <Box direction="row" wrap="wrap" gap="var(--dq-ui-space-sm)">
            <Button
              size="sm"
              variant="ghost"
              icon={isSavingCalibrationPoint ? CircleNotchIcon : null}
              className={isSavingCalibrationPoint ? 'dq-maps-view__calibration-save--loading' : ''}
              disabled={!pendingCalibrationPoint || isSavingCalibrationPoint || isRemovingCalibrationPoint}
              onClick={() => handleSaveCalibrationPoint('current')}
            >
              {isSavingCalibrationPoint ? 'Mapping loc...' : 'Save point'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={!pendingCalibrationPoint || isSavingCalibrationPoint || isRemovingCalibrationPoint || mapLayers.length < 2}
              onClick={() => handleSaveCalibrationPoint('site')}
            >
              Save on all maps
            </Button>
            <Button size="sm" variant="danger" onClick={onCancelCalibration}>
              Done
            </Button>
          </Box>
        </Box>
      ) : activeCalibrationPoints.length >= 3 ? (
        <Button
          className={[
            'dq-maps-view__live-button',
            isLiveLocationSharing ? 'dq-maps-view__live-button--sharing' : '',
          ].filter(Boolean).join(' ')}
          size="sm"
          variant="ghost"
          onClick={() => (
            isLiveLocationSharing
              ? onStopLiveLocationSharing?.()
              : onStartLiveLocationSharing?.({ mapLayerId: activeLayer?.id })
          )}
        >
          {isLiveLocationSharing && Number.isFinite(liveLocationRemainingMinutes)
            ? `Stop live position (${liveLocationRemainingMinutes}min left)`
            : isLiveLocationSharing ? 'Stop live position' : 'Share live position'}
        </Button>
      ) : null}

      {selectedFeature ? (
        <Box
          ref={featureCardRef}
          className="dq-maps-view__feature-card"
          gap="var(--dq-ui-space-sm)"
          style={{
            '--dq-maps-feature-card-x': `${selectedFeature.position.x}px`,
            '--dq-maps-feature-card-y': `${selectedFeature.position.y}px`,
          }}
        >
          <Box direction="row" align="center" justify="space-between" gap="var(--dq-ui-space-md)">
            <strong>{selectedFeature.title || 'Map item'}</strong>
          </Box>

          {selectedFeature.details.length > 0 ? (
            <Box component="dl" className="dq-maps-view__feature-list" gap="var(--dq-ui-space-xs)">
              {selectedFeature.details.map((item) => (
                <Box
                  key={item.key}
                  component="div"
                  className="dq-maps-view__feature-row"
                  direction="row"
                  gap="var(--dq-ui-space-sm)"
                >
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </Box>
              ))}
            </Box>
          ) : null}
        </Box>
      ) : null}

      {mapLayers.length > 1 ? (
        <FilterBar
          className="dq-maps-view__filter-bar"
          placement="bottom"
          hideOnScroll={false}
          width="content"
          resetButton={false}
          ariaLabel="Select festival day"
          value={{ mapLayer: activeLayer?.id ?? '' }}
          onChange={(nextValue) => {
            if (nextValue.mapLayer && nextValue.mapLayer !== activeLayer?.id) {
              setSelectedLayerId(nextValue.mapLayer);
            }
          }}
          choices={mapLayerChoices}
        />
      ) : null}

      {viewerState === 'error' || viewerState === 'unsupported' ? (
        <Box
          className="dq-maps-view__status dq-maps-view__status--error"
          direction="row"
          align="center"
          role="status"
          aria-live="polite"
        >
          <WarningIcon size={18} />
          <Box gap="0">
            <strong>Map unavailable</strong>
            <p>{errorMessage || 'The selected Mapbox style could not be loaded.'}</p>
          </Box>
        </Box>
      ) : null}

      {locationErrorMessage ? (
        <Box
          className="dq-maps-view__status dq-maps-view__status--error"
          direction="row"
          align="center"
          role="status"
          aria-live="polite"
        >
          <WarningIcon size={18} />
          <Box gap="0">
            <strong>Position not shared</strong>
            <p>{locationErrorMessage}</p>
          </Box>
        </Box>
      ) : null}

      <Drawer
        open={Boolean(selectedTribeLocationGroup)}
        onClose={handleCloseTribeLocationDrawer}
        title="Shared map position"
        subtitle={
          selectedTribeLocationGroup?.locations.length > 1
            ? `${selectedTribeLocationGroup.locations.length} positions in this area`
            : ''
        }
        ariaLabel="Tribe map position details"
        maxWidth="520px"
        headerAddon={selectedDirectionLocation ? (
          <Box className="dq-maps-view__direction-header" align="center" gap="var(--dq-ui-space-xs)">
            {isDirectionTracking ? (
              <>
                <span
                  className={[
                    'dq-maps-view__direction-arrow',
                    'dq-maps-view__direction-arrow--hero',
                    directionHeading === null ? 'dq-maps-view__direction-arrow--absolute' : '',
                  ].filter(Boolean).join(' ')}
                  style={{
                    '--dq-maps-direction-angle': `${directionRelativeBearing ?? 0}deg`,
                  }}
                  aria-hidden="true"
                >
                  <NavigationArrowIcon size={32} weight="fill" />
                </span>
                <span className="dq-maps-view__direction-copy dq-maps-view__direction-copy--hero">
                  {canShowDirection ? (
                    <>
                      {Math.round(directionDistanceMeters)}m to {selectedDirectionLocation.displayName}
                      {directionHeading === null && directionTargetBearing !== null
                        ? ` · ${Math.round(directionTargetBearing)}° bearing`
                        : ''}
                    </>
                  ) : (
                    `Locating ${selectedDirectionLocation.displayName}...`
                  )}
                </span>
              </>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                icon={NavigationArrowIcon}
                onClick={() => handleStartDirectionTracking(selectedDirectionLocation.userId)}
              >
                Enable direction to {selectedDirectionLocation.displayName}
              </Button>
            )}
            {directionErrorMessage ? (
              <p className="dq-maps-view__direction-message">{directionErrorMessage}</p>
            ) : null}
            {doesDirectionNeedPermission ? (
              <p className="dq-maps-view__direction-message">Enable motion/orientation permission in your browser if prompted.</p>
            ) : null}
          </Box>
        ) : null}
      >
        <Box gap="var(--dq-ui-space-md)">
          {selectedDrawerLocations.map((location) => {
            return (
              <Box key={location.userId} className="dq-maps-view__tribe-person-direction-card">
                <PeopleCard
                  className="dq-maps-view__tribe-person-card"
                  avatarSrc={location.avatarUrl}
                  avatarAlt={location.displayName}
                  name={location.displayName}
                  handle={location.username ? `@${location.username}` : 'Profile unavailable'}
                  meta={location.updatedAt ? `Updated ${formatLocationUpdatedAt(location.updatedAt)}` : null}
                  endSlot={
                    location.userId === currentUserId ? (
                      <Button
                        size="sm"
                        variant="danger"
                        icon={TrashIcon}
                        ariaLabel="Remove my shared position"
                        onClick={() => {
                          Promise.resolve(onRemoveTribeLocation?.({
                            mapLayerId: location.mapLayerId ?? activeLayer?.id ?? null,
                            locationKind: location.locationKind,
                            hasGpsPosition: hasGpsLocation(location),
                          }))
                            .then(handleCloseTribeLocationDrawer)
                            .catch((error) => {
                              setLocationErrorMessage(
                                error instanceof Error ? error.message : 'Could not remove your map position.'
                              );
                          });
                        }}
                      />
                    ) : null
                  }
                />
              </Box>
            );
          })}
        </Box>
      </Drawer>
    </Box>
  );
};

export default MapsView;
