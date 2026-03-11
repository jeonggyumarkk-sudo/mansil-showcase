'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { PropertyMap } from '@/components/features/property/PropertyMap';
import { Button, Input } from '@mansil/ui';
import { List, Map as MapIcon, Search, Building2, MapPin, Calendar, Camera, Image } from 'lucide-react';
import type { MapListing } from './LeafletMap';

const TYPE_COLORS: Record<string, string> = {
    '원룸': 'bg-blue-500',
    '1.5룸': 'bg-indigo-500',
    '투룸': 'bg-emerald-500',
    '쓰리룸': 'bg-amber-500',
    '쓰리룸+': 'bg-red-500',
    '아파트': 'bg-violet-500',
    '오피스텔': 'bg-pink-500',
    '빌라': 'bg-teal-500',
    '고시원': 'bg-gray-500',
};

const TYPE_OPTIONS = [
    { value: '', label: '전체' },
    { value: '원룸', label: '원룸' },
    { value: '1.5룸', label: '1.5룸' },
    { value: '투룸', label: '투룸' },
    { value: '쓰리룸', label: '쓰리룸' },
    { value: '아파트', label: '아파트' },
    { value: '오피스텔', label: '오피스텔' },
    { value: '빌라', label: '빌라' },
];

function formatPrice(l: MapListing): string {
    const parts: string[] = [];
    if (l.jun > 0) {
        const j = l.jun >= 10000 ? `${(l.jun / 10000).toFixed(1)}억` : `${l.jun.toLocaleString()}만`;
        parts.push(`전세 ${j}`);
    }
    if (l.bo > 0 && l.mm > 0) {
        const d = l.bo >= 10000 ? `${(l.bo / 10000).toFixed(1)}억` : `${l.bo.toLocaleString()}만`;
        parts.push(`${d}/${l.mm}만`);
    } else if (l.bo > 0) {
        parts.push(`보증금 ${l.bo.toLocaleString()}만`);
    }
    return parts.join(' · ') || '가격 문의';
}

export function PropertySearch() {
    const [view, setView] = useState<'both' | 'map' | 'list'>('both');
    const [allListings, setAllListings] = useState<MapListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [mapPercent, setMapPercent] = useState(35);
    const containerRef = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);

    const onDividerMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        dragging.current = true;
        const onMove = (ev: MouseEvent) => {
            if (!dragging.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const pct = ((ev.clientX - rect.left) / rect.width) * 100;
            setMapPercent(Math.min(75, Math.max(15, pct)));
        };
        const onUp = () => {
            dragging.current = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, []);

    // Load all data once
    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const res = await fetch('/api/listings');
                const data: MapListing[] = await res.json();
                setAllListings(data);
            } catch (e) {
                console.error('Failed to load listings:', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // Client-side filtering for list
    const filteredList = useMemo(() => {
        let result = allListings;

        if (typeFilter) {
            result = result.filter(l => l.type === typeFilter);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.trim();
            result = result.filter(l =>
                (l.addr || '').includes(q) ||
                (l.dong || '').includes(q) ||
                (l.bldg || '').includes(q) ||
                (l.si || '').includes(q) ||
                l.type.includes(q) ||
                (l.broker || '').includes(q)
            );
        }

        return result;
    }, [allListings, typeFilter, searchQuery]);

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col -mb-8 lg:-mb-8">
            {/* Top bar */}
            <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3 z-10">
                {/* Logo */}
                <span className="text-lg font-extrabold text-indigo-600 flex-shrink-0 tracking-tight">만실</span>

                {/* Center: search + filters */}
                <div className="flex-1 flex items-center justify-center gap-2">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="지역, 건물명, 동 검색"
                            className="w-full pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Type filter chips — desktop */}
                    <div className="hidden lg:flex items-center gap-1">
                        {TYPE_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setTypeFilter(typeFilter === opt.value ? '' : opt.value)}
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                                    typeFilter === opt.value
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Type filter — mobile */}
                    <div className="lg:hidden flex-shrink-0">
                        <select
                            className="text-sm border border-gray-300 rounded-lg px-2 py-1.5"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            {TYPE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* View toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1 flex-shrink-0">
                    {[
                        { key: 'map' as const, icon: <MapIcon className="w-4 h-4" />, label: '지도' },
                        { key: 'both' as const, icon: <span className="text-xs font-bold">둘다</span>, label: '둘다' },
                        { key: 'list' as const, icon: <List className="w-4 h-4" />, label: '목록' },
                    ].map(v => (
                        <button
                            key={v.key}
                            onClick={() => setView(v.key)}
                            className={`p-2 rounded-md transition-colors ${view === v.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                            aria-label={`${v.label} 보기`}
                        >
                            {v.icon}
                        </button>
                    ))}
                </div>
            </div>

            <div ref={containerRef} className="flex-1 flex overflow-hidden">
                {/* Map */}
                <div
                    className="relative"
                    style={{
                        width: view === 'list' ? '0%' : view === 'map' ? '100%' : `${mapPercent}%`,
                        transition: view === 'both' ? 'none' : 'width 300ms',
                    }}
                >
                    {!loading && <PropertyMap listings={allListings} typeFilter={typeFilter} />}
                    {loading && (
                        <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-[3px] border-gray-200 border-t-gray-600 rounded-full animate-spin" />
                                <span className="text-sm text-gray-500">매물 데이터 로딩 중...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Draggable divider */}
                {view === 'both' && (
                    <div
                        onMouseDown={onDividerMouseDown}
                        className="w-1.5 bg-gray-200 hover:bg-blue-400 cursor-col-resize flex-shrink-0 transition-colors relative group z-10"
                    >
                        <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-gray-400 group-hover:bg-blue-500 transition-colors" />
                    </div>
                )}

                {/* List */}
                <div
                    className="bg-white flex flex-col"
                    style={{
                        width: view === 'map' ? '0%' : view === 'list' ? '100%' : `${100 - mapPercent}%`,
                        overflow: view === 'map' ? 'hidden' : undefined,
                        transition: view === 'both' ? 'none' : 'width 300ms',
                    }}
                >
                    <div className="p-3 border-b border-gray-100 flex justify-between items-center">
                        <span className="font-bold text-sm">
                            {loading ? '로딩 중...' : `${filteredList.length.toLocaleString()}건`}
                        </span>
                        <span className="text-xs text-gray-400">
                            총 {allListings.length.toLocaleString()}건
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                            </div>
                        ) : filteredList.length === 0 ? (
                            <div className="text-center py-16 text-gray-400">
                                <MapPin className="w-10 h-10 mx-auto mb-3 opacity-50" />
                                <p className="font-medium">매물이 없습니다</p>
                                <p className="text-sm mt-1">검색 조건을 변경해보세요</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredList.slice(0, 200).map((listing, i) => (
                                    <ListingCard key={`${listing.lat}-${listing.lng}-${i}`} listing={listing} />
                                ))}
                                {filteredList.length > 200 && (
                                    <div className="p-4 text-center text-sm text-gray-400">
                                        {filteredList.length.toLocaleString()}건 중 200건 표시
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ListingCard({ listing }: { listing: MapListing }) {
    const colorClass = TYPE_COLORS[listing.type] || 'bg-gray-500';
    const [imgError, setImgError] = useState(false);

    return (
        <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex gap-4">
                {/* Thumbnail — larger */}
                {listing.img && !imgError ? (
                    <div className="w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                        <img
                            src={listing.img}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={() => setImgError(true)}
                        />
                    </div>
                ) : (
                    <div className="w-28 h-28 rounded-xl flex-shrink-0 bg-gray-100 flex items-center justify-center">
                        <Image className="w-8 h-8 text-gray-300" />
                    </div>
                )}

                <div className="flex-1 min-w-0 py-0.5">
                    {/* Type + tx badge */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <span className={`${colorClass} text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full`}>
                            {listing.type}
                        </span>
                        {listing.txType && listing.txType !== '월세' && (
                            <span className="bg-gray-200 text-gray-600 text-[11px] font-semibold px-2 py-0.5 rounded">
                                {listing.txType}
                            </span>
                        )}
                    </div>

                    {/* Price — bigger */}
                    <p className="text-base font-extrabold text-gray-900">
                        {formatPrice(listing)}
                    </p>

                    {/* Building + address */}
                    <p className="text-sm text-gray-700 mt-0.5 truncate">
                        {listing.bldg || listing.dong}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                        {listing.addr}
                    </p>

                    {/* Details row */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        {listing.floor && listing.floor > 0 && (
                            <span className="flex items-center gap-0.5">
                                <Building2 className="w-3.5 h-3.5" />{listing.floor}층
                            </span>
                        )}
                        {listing.year && (
                            <span>{listing.year}년</span>
                        )}
                        {listing.move && (
                            <span className="flex items-center gap-0.5">
                                <Calendar className="w-3.5 h-3.5" />{listing.move}
                            </span>
                        )}
                        {listing.photos && listing.photos > 0 && (
                            <span className="flex items-center gap-0.5">
                                <Camera className="w-3.5 h-3.5" />{listing.photos}장
                            </span>
                        )}
                    </div>

                    {/* Options */}
                    {listing.opts && listing.opts.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {listing.opts.slice(0, 6).map(opt => (
                                <span key={opt} className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded">
                                    {opt}
                                </span>
                            ))}
                            {listing.opts.length > 6 && (
                                <span className="text-gray-300 text-[10px] py-0.5">+{listing.opts.length - 6}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
