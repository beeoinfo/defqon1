import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { CircleNotchIcon, WarningIcon } from '@phosphor-icons/react';
import EmptyState from '../components/EmptyState';

const ENV_MAPBOX_ACCESS_TOKEN = String(import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? '').trim();
const MAPBOX_GL_JS_URL = 'https://api.mapbox.com/mapbox-gl-js/v3.12.0/mapbox-gl.js';
const MAPBOX_GL_CSS_URL = 'https://api.mapbox.com/mapbox-gl-js/v3.12.0/mapbox-gl.css';
const MAPBOX_DEFAULT_CENTER = [5.752004901493724, 52.436729962158665];
const MAPBOX_DEFAULT_ZOOM = 16;
const MAPBOX_DEFAULT_BEARING = -36;

let mapboxGlLoaderPromise = null;
const styleDefinitionCache = new Map();

function decodeBase64Url(value) {
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
}

function getMapboxTokenOwner(token) {
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
}

function getMapboxAccessTokenForOwner(styleOwner) {
  if (!ENV_MAPBOX_ACCESS_TOKEN) {
    return '';
  }

  const normalizedStyleOwner = String(styleOwner ?? '').trim();
  const envTokenOwner = getMapboxTokenOwner(ENV_MAPBOX_ACCESS_TOKEN);

  if (!normalizedStyleOwner || !envTokenOwner || envTokenOwner === normalizedStyleOwner) {
    return ENV_MAPBOX_ACCESS_TOKEN;
  }

  return '';
}

function parseMapboxStyleUrl(styleUrl) {
  const match = String(styleUrl ?? '').match(/^mapbox:\/\/styles\/([^/]+)\/([^/?#]+)$/);
  if (!match) {
    return { owner: '', styleId: '' };
  }

  return { owner: match[1], styleId: match[2] };
}

function ensureMapboxCss() {
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
}

function loadMapboxGl() {
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
}

function cloneStyleDefinition(styleDefinition) {
  return JSON.parse(JSON.stringify(styleDefinition));
}

function normalizeStyleDefinition(styleDefinition, owner, styleId, layer) {
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
}

async function getStyleDefinition(layer) {
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
}

function focusMapOnLayer(map, layer, animate = true) {
  const horizontalOffset =
    typeof window === 'undefined' ? 0 : Math.round(window.innerWidth * -0.14);
  const camera = {
    center: [
      Number(layer?.view?.center?.longitude ?? MAPBOX_DEFAULT_CENTER[0]),
      Number(layer?.view?.center?.latitude ?? MAPBOX_DEFAULT_CENTER[1]),
    ],
    zoom: Number(layer?.view?.zoom ?? MAPBOX_DEFAULT_ZOOM),
    bearing: Number(layer?.view?.bearing ?? MAPBOX_DEFAULT_BEARING),
    offset: [horizontalOffset, 0],
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
}

export default function MapsView({ mapLayers = [] }) {
  const [selectedLayerId, setSelectedLayerId] = useState(() => mapLayers[0]?.id ?? '');
  const [viewerState, setViewerState] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const dayButtonRefs = useRef(new Map());
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
              center: MAPBOX_DEFAULT_CENTER,
              zoom: MAPBOX_DEFAULT_ZOOM,
              bearing: MAPBOX_DEFAULT_BEARING,
              pitch: 0,
              projection: 'mercator',
              renderWorldCopies: false,
              attributionControl: true,
            });

            mapRef.current = map;
            currentStyleUrlRef.current = activeLayer.styleUrl;

            map.addControl(
              new mapboxgl.NavigationControl({
                showCompass: false,
                showZoom: true,
                visualizePitch: false,
              }),
              'top-right'
            );

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
  }, [activeLayer]);

  useEffect(() => {
    if (!activeLayer || typeof window === 'undefined') {
      return;
    }

    const activeDayButton = dayButtonRefs.current.get(activeLayer.id);
    if (!activeDayButton) {
      return;
    }

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    activeDayButton.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, [activeLayer]);

  if (!mapLayers.length) {
    return <EmptyState text="No map layers detected" />;
  }

  return (
    <section className="maps-view">
      <div
        ref={mapContainerRef}
        className="maps-view__canvas"
        role="application"
        aria-label={`Interactive festival map for ${activeLayer?.label ?? 'Defqon.1'}`}
      />

      <div className="maps-view__shade" aria-hidden="true" />

      <div className="maps-view__overlay">
        <div className="maps-view__day-scroll-shell">
          <div className="maps-view__day-switcher" role="tablist" aria-label="Select festival day">
            {mapLayers.map((layer) => (
              <button
                key={layer.id}
                ref={(node) => {
                  if (node) {
                    dayButtonRefs.current.set(layer.id, node);
                    return;
                  }
                  dayButtonRefs.current.delete(layer.id);
                }}
                type="button"
                role="tab"
                aria-selected={layer.id === activeLayer?.id}
                className={
                  layer.id === activeLayer?.id
                    ? 'maps-view__day filter-badge filter-chip filter-chip--light filter-badge--active'
                    : 'maps-view__day filter-badge filter-chip'
                }
                onClick={() => {
                  if (layer.id !== activeLayer?.id) {
                    setSelectedLayerId(layer.id);
                  }
                }}
              >
                <span>{layer.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {viewerState === 'loading' && (
        <div className="maps-view__status" role="status" aria-live="polite">
          <CircleNotchIcon size={18} className="maps-view__spinner" />
          <span>Loading {activeLayer?.label} map...</span>
        </div>
      )}

      {(viewerState === 'error' || viewerState === 'unsupported') && (
        <div className="maps-view__status maps-view__status--error" role="status" aria-live="polite">
          <WarningIcon size={18} />
          <div>
            <strong>Map unavailable</strong>
            <p>{errorMessage || 'The selected Mapbox style could not be loaded.'}</p>
          </div>
        </div>
      )}
    </section>
  );
}
