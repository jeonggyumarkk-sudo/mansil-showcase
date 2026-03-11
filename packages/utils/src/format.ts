export const formatCurrency = (amount: number): string => {
    if (amount >= 100000000) {
        const uk = Math.floor(amount / 100000000);
        const remainder = amount % 100000000;
        if (remainder === 0) return `${uk}억`;
        return `${uk}억 ${formatCurrency(remainder)}`;
    }
    if (amount >= 10000) {
        const man = Math.floor(amount / 10000);
        return `${man}만`; // Simplified for now, can be more detailed
    }
    return new Intl.NumberFormat('ko-KR').format(amount);
};

export const formatArea = (pyeong: number): string => {
    const m2 = pyeong * 3.30578;
    return `${m2.toFixed(1)}㎡ (${pyeong}평)`;
};

export const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
};
