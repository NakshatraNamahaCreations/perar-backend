// utils/parseJSONSafe.js
export default function parseJSONSafe(input) {
  if (!input) return null;
  if (typeof input !== "string") return input;
  try {
    return JSON.parse(input);
  } catch (err) {
    // if not JSON, return string (caller can decide)
    return input;
  }
}
