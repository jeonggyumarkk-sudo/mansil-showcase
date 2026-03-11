import { formatCurrency, formatArea, formatDate } from './format';

describe('formatCurrency', () => {
    it('should format amounts under 10,000 with Korean locale', () => {
        expect(formatCurrency(5000)).toBe('5,000');
    });

    it('should format amounts in man-won (만)', () => {
        expect(formatCurrency(10000)).toBe('1만');
        expect(formatCurrency(50000)).toBe('5만');
        expect(formatCurrency(500000)).toBe('50만');
        expect(formatCurrency(99990000)).toBe('9999만');
    });

    it('should format amounts in eok-won (억)', () => {
        expect(formatCurrency(100000000)).toBe('1억');
        expect(formatCurrency(300000000)).toBe('3억');
    });

    it('should format eok with remainder', () => {
        expect(formatCurrency(150000000)).toBe('1억 5000만');
        expect(formatCurrency(250000000)).toBe('2억 5000만');
    });

    it('should format zero', () => {
        expect(formatCurrency(0)).toBe('0');
    });

    it('should handle small amounts', () => {
        expect(formatCurrency(100)).toBe('100');
        expect(formatCurrency(1)).toBe('1');
    });
});

describe('formatArea', () => {
    it('should convert pyeong to m²', () => {
        const result = formatArea(10);
        expect(result).toBe('33.1㎡ (10평)');
    });

    it('should handle fractional pyeong', () => {
        const result = formatArea(8.5);
        expect(result).toBe('28.1㎡ (8.5평)');
    });

    it('should handle zero', () => {
        const result = formatArea(0);
        expect(result).toBe('0.0㎡ (0평)');
    });

    it('should handle large areas', () => {
        const result = formatArea(100);
        expect(result).toBe('330.6㎡ (100평)');
    });
});

describe('formatDate', () => {
    it('should format date in Korean locale', () => {
        const date = new Date('2025-01-15');
        const result = formatDate(date);
        expect(result).toContain('2025');
        expect(result).toContain('1');
        expect(result).toContain('15');
    });

    it('should handle different dates', () => {
        const date = new Date('2024-12-25');
        const result = formatDate(date);
        expect(result).toContain('2024');
        expect(result).toContain('12');
        expect(result).toContain('25');
    });
});
