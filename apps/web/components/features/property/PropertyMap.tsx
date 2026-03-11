'use client';

import dynamic from 'next/dynamic';
import type { MapListing } from './LeafletMap';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                <span className="text-xs text-gray-400">지도 로딩 중...</span>
            </div>
        </div>
    ),
});

export function PropertyMap({ listings, typeFilter }: { listings: MapListing[]; typeFilter: string }) {
    return (
        <div className="w-full h-full relative z-0">
            <LeafletMap listings={listings} typeFilter={typeFilter} />
        </div>
    );
}
