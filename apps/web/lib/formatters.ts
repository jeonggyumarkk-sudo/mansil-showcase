export function formatPrice(amount?: number | string | null): string {
    if (!amount) return '0';
    const num = Number(amount);
    if (num >= 100000000) {
        const uk = Math.floor(num / 100000000);
        const remainder = Math.floor((num % 100000000) / 10000);
        return remainder > 0 ? `${uk}억 ${remainder.toLocaleString()}만` : `${uk}억`;
    } else if (num >= 10000) {
        return `${(num / 10000).toLocaleString()}만`;
    }
    return num.toLocaleString();
}

/** Takes area in pyeong, displays both m² and 평 */
export function formatArea(pyeong: number): string {
    const m2 = pyeong * 3.3058;
    return `${m2.toFixed(1)}㎡ (${pyeong.toFixed(1)}평)`;
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

export function formatTransactionType(type: string): string {
    const map: Record<string, string> = {
        'MONTHLY': '월세',
        'JEONSE': '전세',
        'SALE': '매매'
    };
    return map[type] || type;
}

export function formatPropertyType(type: string): string {
    const map: Record<string, string> = {
        'ONE_ROOM': '원룸',
        'TWO_ROOM': '투룸',
        'OFFICETEL': '오피스텔',
        'APARTMENT': '아파트',
        'VILLA': '빌라'
    };
    return map[type] || type;
}

export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('ko-KR');
}
