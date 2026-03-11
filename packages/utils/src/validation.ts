export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isValidPhoneNumber = (phone: string): boolean => {
    // Korean phone number format basic check (010-1234-5678)
    const phoneRegex = /^01[016789]-?([0-9]{3,4})-?([0-9]{4})$/;
    return phoneRegex.test(phone);
};

export const isValidPassword = (password: string): boolean => {
    // Min 8 chars, at least one letter and one number
    return password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
};
