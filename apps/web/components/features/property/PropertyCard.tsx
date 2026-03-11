'use client';

import { Card, Badge } from '@mansil/ui';
import { Heart } from 'lucide-react';
import { Property } from '@mansil/types';
import { formatPrice, formatArea } from '@/lib/formatters';

interface PropertyCardProps {
    property: Property;
    variant?: 'list' | 'grid';
    className?: string;
}

export function PropertyCard({ property, variant = 'list', className = '' }: PropertyCardProps) {
    const priceString = `보 ${formatPrice(property.deposit || 0)} / ${property.monthlyRent ? formatPrice(property.monthlyRent) : '0'}`;

    return (
        <Card className={`overflow-hidden group cursor-pointer hover:shadow-md transition-all ${className} ${variant === 'list' ? 'flex gap-4' : ''}`}>
            {/* Image Section */}
            <div className={`relative bg-gray-200 ${variant === 'list' ? 'w-40 h-40 shrink-0' : 'aspect-[4/3] w-full'}`}>
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <span className="text-xs">이미지 없음</span>
                </div>

                <div className="absolute top-2 left-2 flex gap-1">
                    {property.isVerified && <Badge variant="verified">검증</Badge>}
                    <Badge variant="available">공실</Badge>
                </div>
                <button className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full text-gray-400 hover:text-red-500 transition-colors">
                    <Heart className="w-4 h-4" />
                </button>
            </div>

            {/* Content Section */}
            <div className={`space-y-2 flex-1 ${variant === 'list' ? 'py-1' : 'p-3'}`}>
                <div className="space-y-1">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-gray-900">{priceString}</h3>
                    </div>

                    <p className="text-sm font-medium text-gray-700">{property.title}</p>

                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span>{property.address}</span>
                        <span className="text-gray-300">|</span>
                        <span>{property.type}</span>
                        <span className="text-gray-300">|</span>
                        <span>{formatArea(property.areaPyeong)}</span>
                        <span className="text-gray-300">|</span>
                        <span>{property.floor}층</span>
                    </div>
                </div>

                <div className="flex gap-1 flex-wrap">
                    {property.options?.map((opt) => (
                        <span key={opt} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded">
                            {opt}
                        </span>
                    ))}
                </div>
            </div>
        </Card>
    );
}
