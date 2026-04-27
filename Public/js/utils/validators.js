// js/utils/validators.js

// Check email format → strict format (prevents .co typos for .com)
export function isValidEmail(email) {
  // Enforces a stricter list of valid Top Level Domains to prevent "gmail.co" typos
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in|org|net|edu|gov|co\.in)$/i.test(email);
}

// Check strong password → min 6 chars, 1 uppercase, 1 lowercase, 1 number
export function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/.test(password);
}

// Check Indian phone number → starts with 6-9, exactly 10 digits
export function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

// Check name → only letters and spaces, 2 to 50 chars
export function isValidName(name) {
  return /^[a-zA-Z\s]{2,50}$/.test(name.trim());
}

// Check Indian Pincode/ZIP → exactly 6 digits
export function isValidZip(zip) {
  return /^\d{6}$/.test(zip);
}

// Check City/Town → only letters and spaces, 2 to 50 chars
export function isValidCity(city) {
  return /^[a-zA-Z\s]{2,50}$/.test(city.trim());
}

// Check Street Address → alphanumeric, basic punctuation, min 5 chars
export function isValidStreet(street) {
  return /^[a-zA-Z0-9\s,.'-]{5,150}$/.test(street.trim());
}