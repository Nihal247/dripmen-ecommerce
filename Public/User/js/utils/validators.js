// js/utils/validators.js

// Check email format → "test@gmail.com" ✅  "testgmail" ❌
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Check strong password → min 6 chars, 1 uppercase, 1 lowercase, 1 number
export function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/.test(password);
}

// Check Indian phone number → starts with 6-9, exactly 10 digits
export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

// Check name is not empty or too short
export function isValidName(name) {
  return name && name.trim().length >= 2;
}