import { isValidEmail, isValidPhoneNumber, isValidPassword } from './validation';

describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
        expect(isValidEmail('user@mansil.com')).toBe(true);
        expect(isValidEmail('agent.name@company.co.kr')).toBe(true);
        expect(isValidEmail('user123@domain.org')).toBe(true);
    });

    it('should return false for invalid emails', () => {
        expect(isValidEmail('')).toBe(false);
        expect(isValidEmail('notanemail')).toBe(false);
        expect(isValidEmail('@domain.com')).toBe(false);
        expect(isValidEmail('user@')).toBe(false);
        expect(isValidEmail('user@.com')).toBe(false);
        expect(isValidEmail('user name@domain.com')).toBe(false);
    });

    it('should return false for emails with spaces', () => {
        expect(isValidEmail('user @domain.com')).toBe(false);
        expect(isValidEmail('user@ domain.com')).toBe(false);
    });
});

describe('isValidPhoneNumber', () => {
    it('should return true for valid Korean phone numbers', () => {
        expect(isValidPhoneNumber('010-1234-5678')).toBe(true);
        expect(isValidPhoneNumber('01012345678')).toBe(true);
        expect(isValidPhoneNumber('011-123-4567')).toBe(true);
        expect(isValidPhoneNumber('016-1234-5678')).toBe(true);
        expect(isValidPhoneNumber('017-1234-5678')).toBe(true);
        expect(isValidPhoneNumber('018-1234-5678')).toBe(true);
        expect(isValidPhoneNumber('019-1234-5678')).toBe(true);
    });

    it('should return false for invalid phone numbers', () => {
        expect(isValidPhoneNumber('')).toBe(false);
        expect(isValidPhoneNumber('123-456-7890')).toBe(false);
        expect(isValidPhoneNumber('02-1234-5678')).toBe(false);
        expect(isValidPhoneNumber('010-12-5678')).toBe(false);
    });

    it('should accept numbers without dashes', () => {
        expect(isValidPhoneNumber('01012345678')).toBe(true);
    });

    it('should return true for 3-digit middle section', () => {
        expect(isValidPhoneNumber('010-123-4567')).toBe(true);
    });
});

describe('isValidPassword', () => {
    it('should return true for valid passwords', () => {
        expect(isValidPassword('password1')).toBe(true);
        expect(isValidPassword('myP@ssw0rd')).toBe(true);
        expect(isValidPassword('abcdefg1')).toBe(true);
        expect(isValidPassword('12345678a')).toBe(true);
    });

    it('should return false for passwords shorter than 8 characters', () => {
        expect(isValidPassword('pass1')).toBe(false);
        expect(isValidPassword('abc1')).toBe(false);
        expect(isValidPassword('ab1')).toBe(false);
    });

    it('should return false for passwords without letters', () => {
        expect(isValidPassword('12345678')).toBe(false);
        expect(isValidPassword('123456789')).toBe(false);
    });

    it('should return false for passwords without numbers', () => {
        expect(isValidPassword('abcdefgh')).toBe(false);
        expect(isValidPassword('Password!')).toBe(false);
    });

    it('should return false for empty string', () => {
        expect(isValidPassword('')).toBe(false);
    });

    it('should accept both uppercase and lowercase letters', () => {
        expect(isValidPassword('ABCDEFG1')).toBe(true);
        expect(isValidPassword('Abcdefg1')).toBe(true);
    });
});
