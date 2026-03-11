import { describe, it, expect } from 'vitest';
import { formatPrice, formatArea, formatTransactionType, formatPropertyType, formatCurrency, formatDate } from './formatters';

describe('formatters', () => {
    describe('formatPrice', () => {
        it('should format 0 correctly', () => {
            expect(formatPrice(0)).toBe('0');
        });

        it('should format null/undefined as 0', () => {
            expect(formatPrice(null)).toBe('0');
            expect(formatPrice(undefined)).toBe('0');
        });

        it('should format millions (man-won)', () => {
            expect(formatPrice(50000000)).toBe('5,000만');
        });

        it('should format billions (eok-won)', () => {
            expect(formatPrice(100000000)).toBe('1억');
        });

        it('should format eok with remainder', () => {
            expect(formatPrice(150000000)).toBe('1억 5,000만');
        });

        it('should format small amounts', () => {
            expect(formatPrice(5000)).toBe('5,000');
        });

        it('should handle string input', () => {
            expect(formatPrice('50000000')).toBe('5,000만');
        });
    });

    describe('formatArea', () => {
        it('should format area with pyeong to m²', () => {
            // formatArea takes pyeong, converts to m²
            expect(formatArea(33)).toBe('109.1㎡ (33.0평)');
        });

        it('should format larger areas', () => {
            expect(formatArea(84)).toBe('277.7㎡ (84.0평)');
        });

        it('should handle zero', () => {
            expect(formatArea(0)).toBe('0.0㎡ (0.0평)');
        });
    });

    describe('formatTransactionType', () => {
        it('should format transaction types', () => {
            expect(formatTransactionType('MONTHLY')).toBe('월세');
            expect(formatTransactionType('JEONSE')).toBe('전세');
            expect(formatTransactionType('SALE')).toBe('매매');
        });

        it('should return unknown type as-is', () => {
            expect(formatTransactionType('UNKNOWN')).toBe('UNKNOWN');
        });
    });

    describe('formatPropertyType', () => {
        it('should format property types', () => {
            expect(formatPropertyType('ONE_ROOM')).toBe('원룸');
            expect(formatPropertyType('TWO_ROOM')).toBe('투룸');
            expect(formatPropertyType('OFFICETEL')).toBe('오피스텔');
            expect(formatPropertyType('APARTMENT')).toBe('아파트');
            expect(formatPropertyType('VILLA')).toBe('빌라');
        });

        it('should return unknown type as-is', () => {
            expect(formatPropertyType('UNKNOWN')).toBe('UNKNOWN');
        });
    });

    describe('formatCurrency', () => {
        it('should format with Korean locale and won suffix', () => {
            expect(formatCurrency(1000)).toBe('1,000원');
            expect(formatCurrency(0)).toBe('0원');
        });
    });

    describe('formatDate', () => {
        it('should format dates', () => {
            const result = formatDate('2025-01-15');
            expect(result).toContain('2025');
        });

        it('should handle Date objects', () => {
            const result = formatDate(new Date('2025-06-20'));
            expect(result).toContain('2025');
        });
    });
});
