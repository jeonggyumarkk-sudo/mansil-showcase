'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface MapListing {
    lat: number;
    lng: number;
    type: string;
    txType?: string;
    bo: number;
    mm: number;
    jun: number;
    addr?: string;
    dong?: string;
    si?: string;
    bldg?: string;
    floor?: number;
    year?: string;
    bath?: number;
    ev?: boolean;
    move?: string;
    opts?: string[];
    bopts?: string[];
    photos?: number;
    img?: string;
    broker?: string;
    date?: string;
}

const TYPE_COLORS: Record<string, { bg: string; border: string }> = {
    '원룸': { bg: '#3B82F6', border: '#2563EB' },
    '1.5룸': { bg: '#6366F1', border: '#4F46E5' },
    '투룸': { bg: '#10B981', border: '#059669' },
    '쓰리룸': { bg: '#F59E0B', border: '#D97706' },
    '쓰리룸+': { bg: '#EF4444', border: '#DC2626' },
    '아파트': { bg: '#8B5CF6', border: '#7C3AED' },
    '오피스텔': { bg: '#EC4899', border: '#DB2777' },
    '빌라': { bg: '#14B8A6', border: '#0D9488' },
    '고시원': { bg: '#6B7280', border: '#4B5563' },
};
const DEFAULT_COLOR = { bg: '#6B7280', border: '#4B5563' };

function formatPriceShort(l: MapListing): string {
    if (l.txType === '전세') {
        return l.jun >= 10000 ? `${(l.jun / 10000).toFixed(l.jun % 10000 === 0 ? 0 : 1)}억` : `${l.jun}`;
    }
    if (l.bo > 0 && l.mm > 0) {
        const dep = l.bo >= 10000 ? `${(l.bo / 10000).toFixed(0)}억` : `${l.bo}`;
        return `${dep}/${l.mm}`;
    }
    if (l.bo > 0) return `${l.bo}`;
    return '문의';
}

function formatPriceFull(l: MapListing): string {
    const parts: string[] = [];
    if (l.jun > 0) {
        const j = l.jun >= 10000 ? `${(l.jun / 10000).toFixed(1)}억` : `${l.jun.toLocaleString()}만`;
        parts.push(`전세 ${j}원`);
    }
    if (l.bo > 0) {
        const d = l.bo >= 10000 ? `${(l.bo / 10000).toFixed(1)}억` : `${l.bo.toLocaleString()}만`;
        parts.push(`보증금 ${d}원`);
    }
    if (l.mm > 0) parts.push(`월세 ${l.mm.toLocaleString()}만원`);
    return parts.join(' / ') || '가격 문의';
}

function escape(s: string | number | undefined | null): string {
    if (s == null) return '';
    const div = document.createElement('span');
    div.textContent = String(s);
    return div.innerHTML;
}

function createPriceBubble(listing: MapListing): L.DivIcon {
    const c = TYPE_COLORS[listing.type] || DEFAULT_COLOR;
    const price = formatPriceShort(listing);
    const txLabel = listing.txType === '전세' ? '전' : '';

    return new L.DivIcon({
        html: `<div style="
            background:${c.bg};color:#fff;border:2px solid ${c.border};
            border-radius:8px;padding:2px 7px;font-size:11px;font-weight:700;
            font-family:Pretendard,sans-serif;white-space:nowrap;
            box-shadow:0 2px 8px rgba(0,0,0,0.25);cursor:pointer;line-height:1.4;
            display:inline-flex;align-items:center;gap:3px;
        ">${txLabel ? `<span style="font-size:9px;opacity:0.8;background:rgba(255,255,255,0.2);padding:0 3px;border-radius:3px">${txLabel}</span>` : ''}${price}</div>`,
        className: 'price-icon',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
    });
}

function createDotMarker(listing: MapListing): L.DivIcon {
    const c = TYPE_COLORS[listing.type] || DEFAULT_COLOR;
    return new L.DivIcon({
        html: `<div style="
            width:18px;height:18px;background:${c.bg};
            border:2.5px solid #fff;border-radius:50%;
            box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;
        "></div>`,
        className: 'dot-icon',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
    });
}

function createClusterIcon(count: number, types: Record<string, number>): L.DivIcon {
    const dominant = Object.entries(types).sort((a, b) => b[1] - a[1])[0];
    const c = TYPE_COLORS[dominant?.[0] || ''] || DEFAULT_COLOR;
    const size = count > 100 ? 50 : count > 30 ? 42 : 34;

    return new L.DivIcon({
        html: `<div style="
            width:${size}px;height:${size}px;background:${c.bg};
            border:3px solid #fff;border-radius:50%;display:flex;
            align-items:center;justify-content:center;color:#fff;
            font-weight:800;font-size:${count > 100 ? 14 : 12}px;
            font-family:Pretendard,sans-serif;
            box-shadow:0 3px 12px rgba(0,0,0,0.3);cursor:pointer;
        ">${count}</div>`,
        className: 'cluster-icon',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
}

function createPopup(l: MapListing): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = 'font-family:Pretendard,sans-serif;';
    const c = TYPE_COLORS[l.type] || DEFAULT_COLOR;

    const optTags = (l.opts || []).slice(0, 8).map(o =>
        `<span style="display:inline-block;background:#F3F4F6;color:#374151;padding:2px 8px;border-radius:100px;font-size:11px;margin:2px">${escape(o)}</span>`
    ).join('');

    const imgHtml = l.img
        ? `<div style="width:100%;height:180px;background:#F3F4F6;overflow:hidden">
            <img src="${escape(l.img)}" alt="" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.style.display='none'" />
           </div>`
        : '';

    const txBadge = l.txType
        ? `<span style="font-size:10px;background:rgba(255,255,255,0.25);padding:1px 6px;border-radius:4px;margin-left:4px">${escape(l.txType)}</span>`
        : '';

    el.innerHTML = `
        ${imgHtml}
        <div style="background:${c.bg};color:#fff;padding:12px 16px">
            <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-weight:800;font-size:14px">${escape(l.type)}${txBadge}</span>
                <span style="font-size:11px;opacity:0.85">${escape(l.dong)}</span>
            </div>
            <div style="font-size:17px;font-weight:800;margin-top:4px">${escape(formatPriceFull(l))}</div>
        </div>
        <div style="padding:12px 16px">
            <div style="font-size:13px;color:#111;font-weight:600;margin-bottom:2px">${escape(l.bldg || l.addr)}</div>
            ${l.bldg ? `<div style="font-size:12px;color:#6B7280;margin-bottom:8px">${escape(l.addr)}</div>` : '<div style="margin-bottom:8px"></div>'}
            <div style="display:flex;flex-wrap:wrap;gap:10px;font-size:12px;color:#6B7280;margin-bottom:8px;border-top:1px solid #F3F4F6;padding-top:8px">
                ${l.floor ? `<span>🏢 ${escape(l.floor)}층</span>` : ''}
                ${l.year ? `<span>🔨 ${escape(l.year)}년</span>` : ''}
                ${l.move ? `<span>📅 ${escape(l.move)}</span>` : ''}
                ${l.photos ? `<span>📷 ${escape(l.photos)}장</span>` : ''}
                ${l.ev ? '<span>🛗 EV</span>' : ''}
            </div>
            ${optTags ? `<div style="margin-bottom:8px">${optTags}</div>` : ''}
            ${l.broker ? `<div style="font-size:11px;color:#9CA3AF;border-top:1px solid #F3F4F6;padding-top:8px">🏠 ${escape(l.broker)}</div>` : ''}
        </div>`;
    return el;
}

type ClusterItem = MapListing | { isCluster: true; lat: number; lng: number; count: number; types: Record<string, number> };

function clusterListings(listings: MapListing[], zoom: number): ClusterItem[] {
    // At very high zoom, show all individual markers
    if (zoom >= 18) return listings;

    // More aggressive grid sizes to prevent overlap
    const gridSize = zoom >= 17 ? 0.0003
        : zoom >= 16 ? 0.0008
        : zoom >= 15 ? 0.002
        : zoom >= 14 ? 0.005
        : zoom >= 13 ? 0.01
        : zoom >= 12 ? 0.02
        : zoom >= 10 ? 0.06
        : 0.15;

    // At low-medium zoom, force cluster even with 2 items (min cluster threshold)
    const minClusterSize = zoom >= 17 ? 3 : zoom >= 15 ? 2 : 1;

    const grid: Record<string, { latSum: number; lngSum: number; items: MapListing[]; types: Record<string, number> }> = {};

    for (const l of listings) {
        const key = `${Math.round(l.lat / gridSize)}_${Math.round(l.lng / gridSize)}`;
        if (!grid[key]) grid[key] = { latSum: 0, lngSum: 0, items: [], types: {} };
        const g = grid[key];
        g.items.push(l);
        g.latSum += l.lat;
        g.lngSum += l.lng;
        g.types[l.type] = (g.types[l.type] || 0) + 1;
    }

    const result: ClusterItem[] = [];
    for (const cell of Object.values(grid)) {
        const n = cell.items.length;
        if (n === 1) {
            result.push(cell.items[0]);
        } else if (n <= minClusterSize) {
            // Show individual markers if below threshold
            result.push(...cell.items);
        } else {
            result.push({ isCluster: true, lat: cell.latSum / n, lng: cell.lngSum / n, count: n, types: cell.types });
        }
    }
    return result;
}

// Export listings for PropertySearch to use
export type { MapListing };

export default function LeafletMap({ listings, typeFilter }: { listings: MapListing[]; typeFilter: string }) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    const [visibleCount, setVisibleCount] = useState(0);

    const renderMarkers = useCallback((map: L.Map) => {
        if (!markersLayerRef.current) return;
        markersLayerRef.current.clearLayers();

        const bounds = map.getBounds();
        const zoom = map.getZoom();
        const n = bounds.getNorth(), s = bounds.getSouth();
        const e = bounds.getEast(), w = bounds.getWest();

        // Client-side bounds + type filtering
        const visible = listings.filter(l => {
            if (l.lat < s || l.lat > n || l.lng < w || l.lng > e) return false;
            if (typeFilter && l.type !== typeFilter) return false;
            return true;
        });

        setVisibleCount(visible.length);
        const clustered = clusterListings(visible, zoom);

        for (const item of clustered) {
            if ('isCluster' in item && item.isCluster) {
                const icon = createClusterIcon(item.count, item.types);
                const marker = L.marker([item.lat, item.lng], { icon });
                marker.on('click', () => map.setView([item.lat, item.lng], zoom + 2));

                const typeList = Object.entries(item.types)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([t, c]) => `<div style="display:flex;justify-content:space-between;gap:12px"><span>${t}</span><span style="font-weight:700">${c}건</span></div>`)
                    .join('');
                marker.bindPopup(
                    `<div style="font-family:Pretendard,sans-serif;padding:4px;min-width:120px">
                        <div style="font-weight:800;font-size:16px;margin-bottom:8px">${item.count}건</div>
                        <div style="font-size:12px;color:#6B7280">${typeList}</div>
                    </div>`,
                    { maxWidth: 200 }
                );
                markersLayerRef.current?.addLayer(marker);
            } else {
                const l = item as MapListing;
                // Use dot markers at medium zoom, price bubbles only at high zoom
                const icon = zoom >= 17 ? createPriceBubble(l) : createDotMarker(l);
                const marker = L.marker([l.lat, l.lng], { icon });
                marker.bindPopup(() => createPopup(l), { minWidth: 280, maxWidth: 380, className: 'listing-popup' });
                markersLayerRef.current?.addLayer(marker);
            }
        }
    }, [listings, typeFilter]);

    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        const map = L.map(mapRef.current, { zoomControl: false }).setView([36.35, 127.385], 13);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
            maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);
        mapInstance.current = map;
        markersLayerRef.current = L.layerGroup().addTo(map);

        let timer: ReturnType<typeof setTimeout> | null = null;
        map.on('moveend', () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => renderMarkers(map), 120);
        });

        renderMarkers(map);

        return () => {
            if (timer) clearTimeout(timer);
            map.remove();
            mapInstance.current = null;
            markersLayerRef.current = null;
        };
    }, [renderMarkers]);

    // Re-render when listings or filter change (without recreating map)
    useEffect(() => {
        if (mapInstance.current) renderMarkers(mapInstance.current);
    }, [listings, typeFilter, renderMarkers]);

    // Resize observer — invalidateSize when container resizes (e.g. view toggle)
    useEffect(() => {
        if (!mapRef.current) return;
        const observer = new ResizeObserver(() => {
            if (mapInstance.current) {
                mapInstance.current.invalidateSize();
            }
        });
        observer.observe(mapRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="relative w-full h-full">
            <style>{`
                .price-icon,.cluster-icon,.dot-icon { background:none!important;border:none!important; }
                .listing-popup .leaflet-popup-content-wrapper { padding:0;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.15);min-width:280px; }
                .listing-popup .leaflet-popup-content { margin:0;width:auto!important; }
                .listing-popup .leaflet-popup-tip { border-top-color:#fff; }
                .leaflet-popup-content img { display:block; }
            `}</style>
            <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

            {/* Listing count */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur rounded-lg shadow-lg px-3 py-2">
                <span className="text-xs font-medium text-gray-700">
                    현재 영역 {visibleCount.toLocaleString()}건
                </span>
            </div>

            {/* Legend */}
            <div className="absolute bottom-3 right-16 z-[1000] bg-white/95 backdrop-blur rounded-lg shadow-lg px-3 py-2">
                <div className="flex items-center gap-3 text-[10px] text-gray-500">
                    {Object.entries(TYPE_COLORS).slice(0, 6).map(([type, colors]) => (
                        <span key={type} className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: colors.bg }} />
                            {type}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
