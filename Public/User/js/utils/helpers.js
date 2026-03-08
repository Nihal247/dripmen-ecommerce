// js/utils/helpers.js

// Format date → shows "Nov 12, 2023" (matches your existing order dates)
export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

// Shorten long text → "Nike Black T-Shi..."
export function truncateText(text, maxLength = 50) {
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

// Debounce → prevents search from firing on every keypress
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
