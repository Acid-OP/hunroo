// Validation utility functions

export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email.trim()) {
    return { valid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  
  if (email.length > 255) {
    return { valid: false, error: 'Email is too long' };
  }
  
  return { valid: true };
};

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long' };
  }
  
  if (password.length > 100) {
    return { valid: false, error: 'Password is too long (max 100 characters)' };
  }
  
  return { valid: true };
};

export const validatePhone = (phone: string): { valid: boolean; error?: string } => {
  if (!phone) {
    return { valid: true }; // Optional field
  }
  
  if (!/^\+?[\d\s\-()]+$/.test(phone)) {
    return { valid: false, error: 'Please enter a valid phone number' };
  }
  
  if (phone.length > 20) {
    return { valid: false, error: 'Phone number is too long' };
  }
  
  return { valid: true };
};

export const validateUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url) {
    return { valid: true }; // Optional field
  }
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return { valid: false, error: 'URL must start with http:// or https://' };
  }
  
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Please enter a valid URL' };
  }
};

export const validateRequired = (value: string, fieldName: string): { valid: boolean; error?: string } => {
  if (!value?.trim()) {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true };
};

export const validateMaxLength = (value: string, maxLength: number, fieldName: string): { valid: boolean; error?: string } => {
  if (value && value.length > maxLength) {
    return { valid: false, error: `${fieldName} is too long (max ${maxLength} characters)` };
  }
  return { valid: true };
};

export const validateNumber = (value: any, fieldName: string): { valid: boolean; error?: string } => {
  const num = parseFloat(value);
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }
  return { valid: true };
};

export const validatePositiveNumber = (value: any, fieldName: string): { valid: boolean; error?: string } => {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) {
    return { valid: false, error: `${fieldName} must be a positive number` };
  }
  return { valid: true };
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ');
};

export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

