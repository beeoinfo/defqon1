import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { MinusIcon, PlusIcon, WarningIcon } from '@phosphor-icons/react';
import EmptyState from '@/components/EmptyState';
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

let mapboxGlLoaderPromise = null;
const styleDefinitionCache = new Map();

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

const normalizeStyleDefinition = (styleDefinition, owner, styleId, layer) => {
  const nextStyleDefinition = cloneStyleDefinition(styleDefinition);
  const spriteValue = String(nextStyleDefinition.sprite ?? '').trim();

  if (spriteValue && (/\/v4\//i.test(spriteValue) || /\.cmap/i.test(spriteValue))) {
    nextStyleDefinition.sprite = `mapbox://sprites/${owner}/${styleId}`;
  }

  nextStyleDefinition.projection = { name: 'mercator' };
  delete nextStyleDefinition.fog;

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

const MapsView = ({ mapLayers = [] }) => {
  const [selectedLayerId, setSelectedLayerId] = useState(() => mapLayers[0]?.id ?? '');
  const [viewerState, setViewerState] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const currentStyleUrlRef = useRef('');
  const isMapReadyRef = useRef(false);
  const pendingStyleRequestIdRef = useRef(0);

  const activeLayer = mapLayers.find((layer) => layer.id === selectedLayerId) ?? mapLayers[0] ?? null;
  const { owner: activeOwner } = parseMapboxStyleUrl(activeLayer?.styleUrl);

  const syncActiveLayer = useEffectEvent((animate = true) => {
    const map = mapRef.current;

    if (!map || !activeLayer) {
      return;
    }

    const { owner } = parseMapboxStyleUrl(activeLayer.styleUrl);
    const accessToken = getMapboxAccessTokenForOwner(owner);
    const mapboxgl = window.mapboxgl;

    if (!accessToken || !mapboxgl) {
      setErrorMessage('No accessible Mapbox token was found for this style.');
      setViewerState('error');
      return;
    }

    mapboxgl.accessToken = accessToken;
    setErrorMessage('');

    if (currentStyleUrlRef.current === activeLayer.styleUrl) {
      focusMapOnLayer(map, activeLayer, animate);
      setViewerState('ready');
      return;
    }

    setViewerState('loading');
    setErrorMessage('');

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

          currentStyleUrlRef.current = activeLayer.styleUrl;
          focusMapOnLayer(map, activeLayer, animate);
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

        if (!accessToken) {
          setViewerState('error');
          setErrorMessage('No accessible Mapbox token was found for this style.');
          return;
        }

        mapboxgl.accessToken = accessToken;
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
                Number(activeLayer?.center?.longitude ?? MAPBOX_DEFAULT_CENTER[0]),
                Number(activeLayer?.center?.latitude ?? MAPBOX_DEFAULT_CENTER[1]),
              ],
              zoom: Number(activeLayer?.view?.zoom ?? MAPBOX_DEFAULT_ZOOM),
              bearing: Number(activeLayer?.view?.bearing ?? MAPBOX_DEFAULT_BEARING),
              pitch: 0,
              projection: 'mercator',
              renderWorldCopies: false,
              attributionControl: true,
            });

            mapRef.current = map;
            currentStyleUrlRef.current = activeLayer.styleUrl;

            map.on('load', () => {
              if (isCancelled) {
                return;
              }

              isMapReadyRef.current = true;
              focusMapOnLayer(map, activeLayer, false);
              setViewerState('ready');
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

      currentStyleUrlRef.current = '';
    };
  }, [activeLayer, activeOwner]);

  useEffect(() => {
    if (!isMapReadyRef.current || !activeLayer) {
      return;
    }

    syncActiveLayer(true);
  }, [activeLayer, syncActiveLayer]);

  if (!mapLayers.length) {
    return <EmptyState text="No map layers detected." />;
  }

  const handleZoomIn = (event) => {
    mapRef.current?.zoomIn();
    event.currentTarget.blur();
  };

  const handleZoomOut = (event) => {
    mapRef.current?.zoomOut();
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
      </Box>

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
