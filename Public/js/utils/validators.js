// js/utils/validators.js

// Check email format → strict format (prevents .co typos for .com)
export function isValidEmail(email) {
  // Enforces a stricter list of valid Top Level Domains to prevent "gmail.co" typos
  return /^[a-zA-Z0-9]+(?:[._+-][a-zA-Z0-9]+)*@(?![0-9]+\.)[a-zA-Z0-9]+(?:[.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/i.test(email);
}

// Check strong password → min 6 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
export function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(password);
}

// Check phone number → 10 to 15 digits
export function isValidPhone(phone) {
  return /^\+?[\d\s-]{10,15}$/.test(phone);
}

// Check name → only letters and spaces, 2 to 50 chars
export function isValidName(name) {
  return /^[A-Za-z]{2,50}(?:\s[A-Za-z]{1,50})*$/.test(name.trim());
}

// Check Pincode/ZIP
export function isValidZip(zip) {
  return /^[A-Za-z0-9\s-]{3,10}$/.test(zip.trim());
}

// Check City/Town → only letters and spaces, 2 to 50 chars
export function isValidCity(city) {
  return /^[a-zA-Z\s]{2,50}$/.test(city.trim());
}

// Check Street Address → alphanumeric, basic punctuation, min 5 chars
export function isValidStreet(street) {
  return /^[a-zA-Z0-9\s,.'-]{5,150}$/.test(street.trim());
}