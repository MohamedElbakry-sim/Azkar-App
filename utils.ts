
// Removes Tashkeel (Diacritics) from Arabic text
export const removeTashkeel = (text: string): string => {
  return text.replace(/[\u064B-\u065F\u0670]/g, "");
};

// Normalizes Arabic text for search (unifies Alefs, removes Tashkeel, etc.)
export const normalizeArabic = (text: string): string => {
  let normalized = text;
  
  // Remove Tashkeel
  normalized = removeTashkeel(normalized);
  
  // Normalize Alefs
  normalized = normalized.replace(/[أإآ]/g, "ا");
  
  // Normalize Taa Marbuta to Haa (optional, usually helps in loose search)
  // normalized = normalized.replace(/ة/g, "ه");
  
  // Normalize Yaa to Alif Maqsura (or vice versa depending on preference, usually normalizing both to dotless is standard)
  normalized = normalized.replace(/ى/g, "ي");

  return normalized;
};

// Creates a Regex that matches the query sequence even if there are diacritics in between letters
export const getHighlightRegex = (query: string): RegExp | null => {
  if (!query) return null;

  const normalizedQuery = normalizeArabic(query);
  
  // Escape special regex characters in the query
  const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Create a pattern where after every letter, we allow for any number of diacritics
  // logic: split by char, join with "any diacritic regex"
  const diacriticsPattern = "[\\u064B-\\u065F\\u0670]*";
  
  const pattern = escapedQuery
    .split('')
    .map(char => {
      // If char is Alef, allow matching any form of Alef
      if (char === 'ا') return "[اأإآ]" + diacriticsPattern;
      // If char is Yaa, allow Alif Maqsura
      if (char === 'ي') return "[يى]" + diacriticsPattern;
      // If char is Haa/Taa Marbuta
      if (char === 'ه') return "[هة]" + diacriticsPattern;
      
      return char + diacriticsPattern;
    })
    .join('');

  return new RegExp(`(${pattern})`, 'gi');
};
