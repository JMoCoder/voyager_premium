
import React, { useEffect, useState, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { Trip } from '../types';
import * as d3 from 'd3-geo';
import * as topojson from 'topojson-client';
import { Plus, Minus, RefreshCw } from 'lucide-react';

export interface WorldMapHandle {
  resetView: () => void;
}

interface WorldMapProps {
  trips: Trip[];
  highlightTrip?: Trip;
  className?: string;
  viewMode?: 'routes' | 'visited';
  interactionEnabled?: boolean;
  onZoomChange?: (isZoomed: boolean) => void;
  enableWordCloud?: boolean;
  hideBackground?: boolean;
}

const WORLD_ATLAS_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Global Cache for Map Data to prevent re-fetching/re-parsing on every card render
let cachedWorldData: any = null;
let dataFetchPromise: Promise<any> | null = null;

const WorldMap = forwardRef<WorldMapHandle, WorldMapProps>(({ 
    trips, 
    highlightTrip, 
    className, 
    viewMode = 'routes', 
    interactionEnabled = true, 
    onZoomChange, 
    enableWordCloud = false,
    hideBackground = false
}, ref) => {
  const [worldData, setWorldData] = useState<any>(cachedWorldData);
  
  // View State
  const [rotation, setRotation] = useState<[number, number]>([0, 0]);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  
  // Track default state to detect "Zoomed" status
  const defaultState = useRef<{zoom: number, rotation: [number, number]} | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  
  // Interaction Refs
  const lastPos = useRef<{x: number, y: number} | null>(null);
  const evCache = useRef<React.PointerEvent[]>([]);
  const prevDiff = useRef<number>(-1);

  // Expose Reset Method
  useImperativeHandle(ref, () => ({
    resetView: () => {
      autoCenter();
    }
  }));

  // Load Map Data (Cached)
  useEffect(() => {
    if (cachedWorldData) {
        setWorldData(cachedWorldData);
        return;
    }

    if (!dataFetchPromise) {
        dataFetchPromise = fetch(WORLD_ATLAS_URL)
            .then(response => response.json())
            .then(topology => {
                const land = topojson.feature(topology, topology.objects.countries);
                cachedWorldData = land;
                return land;
            })
            .catch(err => {
                console.error("Failed to load map data", err);
                dataFetchPromise = null; // Reset on fail
            });
    }

    dataFetchPromise.then(data => {
        if(data) setWorldData(data);
    });
  }, []);

  // Responsive Dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
         setDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height
         });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Auto-Center Logic (Initial or Reset)
  const autoCenter = () => {
    let targetRotation: [number, number] = [0, 0];
    let targetZoom = 1;

    if (highlightTrip) {
      const { origin, destination } = highlightTrip;
      
      const p1 = [origin.coords.lng, origin.coords.lat];
      const p2 = [destination.coords.lng, destination.coords.lat];
      const interpolate = d3.geoInterpolate(p1 as [number, number], p2 as [number, number]);
      const center = interpolate(0.5);
      
      const distanceRad = d3.geoDistance(p1 as [number, number], p2 as [number, number]);
      const minSpanRad = 0.001; 
      // Zoom out slightly more for the card background feel
      const paddingFactor = interactionEnabled ? 1.5 : 1.8; 
      
      const targetSpan = Math.max(distanceRad * paddingFactor, minSpanRad);
      let autoZoom = Math.PI / targetSpan;
      autoZoom = Math.min(Math.max(autoZoom, 1), 4000); 

      targetRotation = [-center[0], -center[1]];
      targetZoom = autoZoom;

    } else if (trips.length > 0) {
      // Find most frequent City (Origin + Destination) to center on
      const locCounts: Record<string, { count: number, coords: [number, number] }> = {};
      
      trips.forEach(t => {
          // Origin
          const oname = t.origin.name;
          if (!locCounts[oname]) locCounts[oname] = { count: 0, coords: [t.origin.coords.lng, t.origin.coords.lat] };
          locCounts[oname].count++;

          // Destination
          const dname = t.destination.name;
          if (!locCounts[dname]) locCounts[dname] = { count: 0, coords: [t.destination.coords.lng, t.destination.coords.lat] };
          locCounts[dname].count++;
      });

      let topLoc = { count: -1, coords: [0,0] as [number, number] };
      Object.values(locCounts).forEach(lc => {
          if (lc.count > topLoc.count) topLoc = lc;
      });

      if (topLoc.count > 0) {
          targetRotation = [-topLoc.coords[0], -topLoc.coords[1]];
          // Default global zoom to 1
          targetZoom = 1; 
      } else {
          // Fallback
          targetRotation = [-105, -35]; 
          targetZoom = 1;
      }
    } else {
      // Default to China/Asia view but zoom 1
      targetRotation = [-105, -35];
      targetZoom = 1;
    }

    setRotation(targetRotation);
    setZoom(targetZoom);
    
    defaultState.current = { zoom: targetZoom, rotation: targetRotation };
    if (onZoomChange) onZoomChange(false);
  };

  // Detect Zoom Changes
  useEffect(() => {
      if (!defaultState.current || !onZoomChange) return;
      const zDiff = Math.abs(zoom - defaultState.current.zoom);
      const isZoomed = zDiff > 0.1; 
      onZoomChange(isZoomed);
  }, [zoom, rotation, onZoomChange]);

  const tripsRef = useRef<string>('');
  useEffect(() => {
      const currentTripsId = trips.map(t => t.id).join(',');
      const highlightId = highlightTrip ? highlightTrip.id : 'none';
      const key = `${currentTripsId}-${highlightId}-${viewMode}`;
      if (tripsRef.current !== key) {
          autoCenter();
          tripsRef.current = key;
      }
  }, [trips, highlightTrip, viewMode]);


  // --------------------------------------------------------
  // CRITICAL FIX: Touch Event Gatekeeper
  // This explicitly handles Touch Events to prevent them bubbling to App.tsx
  // pointer events (handled below) are not enough to stop touch bubbling in all browsers/React versions
  // --------------------------------------------------------
  const handleTouchGatekeeper = (e: React.TouchEvent) => {
    if (!interactionEnabled) return;

    const isZoomedIn = zoom > 1.1; 
    const touchY = e.touches[0].clientY;
    const { innerHeight } = window;
    
    // Zoning Logic: 
    // Top 25% = Navigation (Pass through)
    // Bottom 25% = Navigation (Pass through)
    // Middle 50% = Earth Control (Stop propagation)
    const isTopZone = touchY < innerHeight * 0.25;
    const isBottomZone = touchY > innerHeight * 0.75;
    const isNavZone = isTopZone || isBottomZone;

    // IF we are Zoomed IN -> ALWAYS Capture (Stop propagation)
    // IF we are Reset (Zoom=1) AND in Middle Zone -> Capture (Stop propagation)
    if (isZoomedIn || !isNavZone) {
        e.stopPropagation();
    }
    // Else: We are Reset AND in Top/Bottom zone -> Allow bubble (App.tsx handles swipe)
  };

  // --------------------------------------------------------
  // Pointer Events (Mouse/Touch Logic for Map Manipulation)
  // --------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!interactionEnabled) return;
    
    const isZoomedIn = zoom > 1.1; 
    const { clientY } = e;
    const { innerHeight } = window;
    
    const isNavZone = clientY < innerHeight * 0.25 || clientY > innerHeight * 0.75;

    // Same logic as Touch Gatekeeper, but for Pointer capture
    if (!isZoomedIn && isNavZone && !highlightTrip) {
        return; // Don't capture pointer, let it bubble (might trigger click etc)
    }

    e.stopPropagation(); 
    evCache.current.push(e);
    
    if (evCache.current.length === 1) {
        setIsDragging(true);
        lastPos.current = { x: e.clientX, y: e.clientY };
    }

    try {
        (e.target as Element).setPointerCapture(e.pointerId);
    } catch (e) {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!interactionEnabled) return;
    if (evCache.current.find(ev => ev.pointerId === e.pointerId)) {
       e.stopPropagation();
    }
    const index = evCache.current.findIndex(cachedEv => cachedEv.pointerId === e.pointerId);
    if (index !== -1) {
        evCache.current[index] = e;
    }

    // Pinch Zoom
    if (evCache.current.length === 2) {
        const curDiff = Math.hypot(
            evCache.current[0].clientX - evCache.current[1].clientX,
            evCache.current[0].clientY - evCache.current[1].clientY
        );

        if (prevDiff.current > 0) {
            if (curDiff > prevDiff.current) {
                setZoom(z => Math.min(z * 1.05, 4000));
            } else if (curDiff < prevDiff.current) {
                setZoom(z => Math.max(z * 0.95, 1));
            }
        }
        prevDiff.current = curDiff;
        return; 
    }

    // Drag Rotate
    if (isDragging && lastPos.current && evCache.current.length === 1) {
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        const sensitivity = 0.25 / Math.sqrt(zoom); 
        
        setRotation(r => [r[0] + dx * sensitivity, r[1] - dy * sensitivity]);
        lastPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!interactionEnabled) return;
    const index = evCache.current.findIndex(cachedEv => cachedEv.pointerId === e.pointerId);
    if (index !== -1) evCache.current.splice(index, 1);
    if (evCache.current.length < 2) prevDiff.current = -1;
    if (evCache.current.length === 0) {
        setIsDragging(false);
        lastPos.current = null;
    }
    const target = e.target as Element;
    if (target.hasPointerCapture(e.pointerId)) {
        try { target.releasePointerCapture(e.pointerId); } catch (err) {}
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
      if (!interactionEnabled) return;
      e.stopPropagation(); 
      const scaleFactor = 1.1;
      if (e.deltaY < 0) {
          setZoom(z => Math.min(z * scaleFactor, 4000));
      } else {
          setZoom(z => Math.max(z / scaleFactor, 1));
      }
  };
  
  const handleDoubleClick = (e: React.MouseEvent) => {
     if (!interactionEnabled) return;
     e.stopPropagation(); 
     zoomIn();
  };

  const zoomIn = () => setZoom(z => Math.min(z * 1.5, 4000));

  const { pathGenerator, projection, graticule } = useMemo(() => {
    const baseScale = Math.min(dimensions.width, dimensions.height) / 2.2;
    const proj = d3.geoOrthographic()
      .fitSize([dimensions.width, dimensions.height], { type: "Sphere" } as any)
      .rotate([rotation[0], rotation[1], 0])
      .scale(baseScale * zoom)
      .precision(0.1);

    const path = d3.geoPath().projection(proj);
    const grat = d3.geoGraticule10();
    return { pathGenerator: path, projection: proj, graticule: grat };
  }, [dimensions, rotation, zoom]);

  const renderRoutes = useMemo(() => {
    const targetTrips = highlightTrip ? [highlightTrip] : trips;
    return targetTrips.map(trip => {
       const route = {
         type: "LineString",
         coordinates: [
           [trip.origin.coords.lng, trip.origin.coords.lat],
           [trip.destination.coords.lng, trip.destination.coords.lat]
         ]
       };
       return {
         id: trip.id,
         d: pathGenerator(route as any),
         isHighlight: !!highlightTrip
       };
    });
  }, [trips, highlightTrip, pathGenerator]);

  const renderPoints = useMemo(() => {
    const points: Array<{cx: number, cy: number, r: number, fill: string, key: string}> = [];
    const dotSize = (3.5 + Math.log(zoom) * 0.6) * (highlightTrip && !interactionEnabled ? 1.5 : 1); 

    if (highlightTrip) {
        const o = projection([highlightTrip.origin.coords.lng, highlightTrip.origin.coords.lat]);
        const d = projection([highlightTrip.destination.coords.lng, highlightTrip.destination.coords.lat]);
        if (o) points.push({ cx: o[0], cy: o[1], r: dotSize, fill: '#38bdf8', key: 'origin' });
        if (d) points.push({ cx: d[0], cy: d[1], r: dotSize, fill: '#818cf8', key: 'dest' });
    } else if (viewMode === 'routes' || viewMode === 'visited') {
       trips.forEach((t, i) => {
          const center = projection.invert!([dimensions.width/2, dimensions.height/2]);
          const dCoords = [t.destination.coords.lng, t.destination.coords.lat];
          const d = projection(dCoords as [number, number]);
          if (center && d) {
             const distance = d3.geoDistance(dCoords as [number, number], center);
             if (distance < Math.PI / 2) {
                 points.push({ cx: d[0], cy: d[1], r: 3, fill: '#60a5fa', key: `dest-${i}` });
             }
          }
       });
    }
    return points;
  }, [trips, highlightTrip, viewMode, projection, dimensions, zoom, interactionEnabled]);

  // Generate Word Cloud Background
  const wordCloudElements = useMemo(() => {
    if (!enableWordCloud && !interactionEnabled) return [];
    if (highlightTrip) return [];

    const counts: Record<string, { type: 'country'|'province'|'city', count: number, text: string }> = {};

    trips.forEach(t => {
      const c = t.destination.country || t.origin.country;
      if (c) {
         const key = `c-${c}`;
         if (!counts[key]) counts[key] = { type: 'country', count: 0, text: c };
         counts[key].count++;
      }
      const p = t.destination.state || t.origin.state;
      if (p) {
         const key = `p-${p}`;
         if (!counts[key]) counts[key] = { type: 'province', count: 0, text: p };
         counts[key].count++;
      }
      const city = t.destination.city || t.destination.name;
      if (city) {
         const key = `ct-${city}`;
         if (!counts[key]) counts[key] = { type: 'city', count: 0, text: city };
         counts[key].count++;
      }
    });

    let items = Object.values(counts);
    items.sort((a, b) => b.count - a.count);
    if (items.length > 50) items = items.slice(0, 50);

    const minCount = items[items.length - 1]?.count || 1;
    const range = (items[0]?.count || 1) - minCount || 1;

    const seededRandom = (seed: number) => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };

    return items.map((item, i) => {
       const weight = (item.count - minCount) / range;
       const fontSize = 0.8 + (weight * 3); 
       const left = 15 + seededRandom(i * 123) * 70;
       const top = 20 + seededRandom(i * 789) * 60;
       let colorClass = '';
       if (item.type === 'country') colorClass = 'text-sky-900/20 dark:text-sky-100/10'; 
       if (item.type === 'province') colorClass = 'text-violet-900/20 dark:text-violet-100/10';
       if (item.type === 'city') colorClass = 'text-teal-900/20 dark:text-teal-100/10';

       return {
         key: `wc-${item.type}-${item.text}`,
         text: item.text,
         style: { left: `${left}%`, top: `${top}%`, fontSize: `${fontSize}rem` },
         colorClass
       };
    });
  }, [trips, enableWordCloud, interactionEnabled, highlightTrip]);

  if (!worldData) {
    return (
        <div ref={containerRef} className={`relative overflow-hidden rounded-xl bg-slate-100 dark:bg-[#0B1121] ${className} flex items-center justify-center`}>
            {/* Show nothing or minimal loader when inside a card to avoid flickering */}
            {interactionEnabled && <div className="animate-pulse w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-800"></div>}
        </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`relative overflow-hidden rounded-xl ${!hideBackground ? 'bg-slate-100 dark:bg-[#0B1121]' : 'bg-transparent'} ${className} ${interactionEnabled && isDragging ? 'cursor-grabbing' : interactionEnabled ? 'cursor-grab' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      // Explicitly attach Touch Listener to stop propagation to App.tsx
      onTouchStart={handleTouchGatekeeper}
      onTouchMove={handleTouchGatekeeper} 
    >
      {/* Background Word Cloud */}
      {wordCloudElements.length > 0 && (
         <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
             {wordCloudElements.map(el => (
                 <div 
                    key={el.key}
                    className={`absolute font-black leading-none whitespace-nowrap blur-[1px] ${el.colorClass}`}
                    style={{ ...el.style, transform: 'translate(-50%, -50%)' }}
                 >
                    {el.text}
                 </div>
             ))}
         </div>
      )}

      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className={`block w-full h-full touch-none relative z-10 ${!interactionEnabled ? 'pointer-events-none' : ''}`}>
        <defs>
          <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="80%" stopColor="#3b82f6" stopOpacity="0" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.3" />
          </radialGradient>
          <linearGradient id="landGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#cbd5e1" className="dark:stop-color-slate-700" />
            <stop offset="100%" stopColor="#94a3b8" className="dark:stop-color-slate-800" />
          </linearGradient>
           <linearGradient id="flightGradient" gradientUnits="userSpaceOnUse">
             <stop offset="0%" stopColor="#38bdf8" />
             <stop offset="100%" stopColor="#818cf8" />
           </linearGradient>
        </defs>

        <path d={pathGenerator({ type: "Sphere" } as any) || ''} className={!hideBackground ? "fill-white dark:fill-slate-900" : "fill-transparent"} />
        <path d={pathGenerator(graticule) || ''} className="fill-none stroke-slate-200/50 dark:stroke-slate-700/30 stroke-[0.5]" />
        <path d={pathGenerator(worldData) || ''} fill={!hideBackground ? "url(#landGradient)" : "currentColor"} className={`${!hideBackground ? "stroke-white dark:stroke-slate-900" : "text-slate-300 dark:text-slate-600"} stroke-[0.5]`} />
        {!hideBackground && <path d={pathGenerator({ type: "Sphere" } as any) || ''} fill="url(#globeGlow)" className="pointer-events-none" />}

        {renderRoutes.map((route, i) => (
           <g key={route.id + i}>
              {route.d && (
                <path 
                    d={route.d}
                    fill="none"
                    stroke={route.isHighlight ? '#38bdf8' : 'currentColor'}
                    strokeWidth={route.isHighlight ? (interactionEnabled ? 3.5 : 4) : 1} 
                    strokeLinecap="round"
                    className={route.isHighlight ? "opacity-30 blur-sm" : "text-slate-300 dark:text-slate-700"}
                />
              )}
              {route.d && (
                <path 
                    d={route.d}
                    fill="none"
                    stroke={route.isHighlight ? (interactionEnabled ? 'url(#flightGradient)' : 'currentColor') : 'currentColor'}
                    strokeWidth={route.isHighlight ? (interactionEnabled ? 2.5 : 3) : 0.5}
                    strokeLinecap="round"
                    className={route.isHighlight ? (interactionEnabled ? "animate-draw" : "text-blue-500 dark:text-blue-400") : "text-slate-400/50 dark:text-slate-600"}
                />
              )}
           </g>
        ))}

        {renderPoints.map((p) => (
            <circle 
                key={p.key} cx={p.cx} cy={p.cy} r={p.r} fill={p.fill} stroke="white" strokeWidth={1.5}
                className="dark:stroke-slate-900 drop-shadow-md"
            />
        ))}
      </svg>
      
      {!hideBackground && <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/5 via-transparent to-transparent dark:from-[#0B1121]/80 z-20"></div>}
    </div>
  );
});

export default WorldMap;
