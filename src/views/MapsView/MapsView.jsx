import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react';
import { CrosshairIcon, MinusIcon, PlusIcon, WarningIcon } from '@phosphor-icons/react';
import FilterBar from '@/components/FilterBar';
import Box from '@/components/layout/Box';
import Button from '@/components/primitives/Button';
import './MapsView.css';

const ENV_MAPBOX_ACCESS_TOKEN = String(import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? '').trim();
const MAPBOX_GL_JS_URL = 'https://api.mapbox.com/mapbox-gl-js/v3.12.0/mapbox-gl.js';
const MAPBOX_GL_CSS_URL = 'https://api.mapbox.com/mapbox-gl-js/v3.12.0/mapbox-gl.css';
const MAPBOX_DEFAULT_CENTER = [5.752004901493724, 52.436729962158665];
const MAPBOX_DEFAULT_ZOOM = 16;
const MAPBOX_DEFAULT_BEARING = -36;
const FEATURE_POPOVER_TIMEOUT_MS = 3000;

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
  const halfWidth = aspectRatio >= 1 ? 1 : aspectRatio;
  const halfHeight = aspectRatio >= 1 ? 1 / aspectRatio : 1;

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
  const hitbox = [
    [point.x - 12, point.y - 12],
    [point.x + 12, point.y + 12],
  ];
  const features = map.queryRenderedFeatures(hitbox) ?? [];
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
      const { scope, ...nextStyleLayer } = styleLayer;
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
      zoom: Number(layer?.view?.zoom ?? 8),
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

const MapsView = ({ mapLayers = [], selectedDay = '' }) => {
  const [selectedLayerId, setSelectedLayerId] = useState(
    () => getDefaultMapLayerId(mapLayers, selectedDay)
  );
  const [viewerState, setViewerState] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFeature, setSelectedFeature] = useState(null);
  const featurePopoverTimeoutRef = useRef(0);
  const featureCardRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const currentStyleUrlRef = useRef('');
  const isMapReadyRef = useRef(false);
  const pendingStyleRequestIdRef = useRef(0);

  const activeLayer = mapLayers.find((layer) => layer.id === selectedLayerId) ?? mapLayers[0] ?? null;
  const { owner: activeOwner } = parseMapboxStyleUrl(activeLayer?.styleUrl);
  const isActiveImageLayer = isImageMapLayer(activeLayer);

  const clearFeaturePopover = () => {
    window.clearTimeout(featurePopoverTimeoutRef.current);
    setSelectedFeature(null);
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
    if (!mapLayers.length) {
      setSelectedLayerId('');
      return;
    }

    if (!mapLayers.some((layer) => layer.id === selectedLayerId)) {
      setSelectedLayerId(getDefaultMapLayerId(mapLayers, selectedDay));
    }
  }, [mapLayers, selectedDay, selectedLayerId]);

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
              zoom: Number(activeLayer?.view?.zoom ?? (isActiveImageLayer ? 8 : MAPBOX_DEFAULT_ZOOM)),
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
              setViewerState('ready');
            });

            map.on('click', (event) => {
              const feature = getInteractiveFeatureAtPoint(map, event.point);

              if (feature) {
                showFeaturePopover(feature, event.point);
              }
            });

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
      currentStyleUrlRef.current = '';
    };
  }, [activeLayer, activeOwner, isActiveImageLayer]);

  useEffect(() => {
    if (!isMapReadyRef.current || !activeLayer) {
      return;
    }

    syncActiveLayer(true);
  }, [activeLayer]);

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

  return (
    <Box component="section" className="dq-maps-view" gap="0">
      <Box
        ref={mapContainerRef}
        className="dq-maps-view__canvas"
        role="application"
        aria-label={`Interactive festival map for ${activeLayer?.label ?? 'Defqon.1'}`}
      />

      <Box className="dq-maps-view__shade" aria-hidden="true" />

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
          choices={mapLayers.map((layer) => ({
            id: layer.id,
            name: 'mapLayer',
            type: 'radio',
            value: layer.id,
            label: layer.label,
          }))}
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
    </Box>
  );
};

export default MapsView;
