
// Removes Tashkeel (Diacritics) from Arabic text
export const removeTashkeel = (text: string): string => {
  // Extended range for Quranic marks (Tashkeel, Honorifics, Small High letters, etc)
  return text.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, "");
};

// Normalizes Arabic text for search (unifies Alefs, removes Tashkeel, etc.)
export const normalizeArabic = (text: string): string => {
  let normalized = text;
  
  // Remove Tashkeel
  normalized = removeTashkeel(normalized);
  
  // Normalize Alefs (Madda, Hamza above/below, Wasla) -> Bare Alef
  normalized = normalized.replace(/[أإآٱ]/g, "ا");
  
  // Normalize Taa Marbuta to Haa
  normalized = normalized.replace(/ة/g, "ه");
  
  // Normalize Yaa / Alif Maqsura to Yeh (Dotless or Dotted unified)
  // This helps match 'علي' and 'على' easily
  normalized = normalized.replace(/[ىي]/g, "ي");

  // Normalize Waw with Hamza to Waw (optional, but helpful for some spellings)
  // normalized = normalized.replace(/ؤ/g, "و"); 

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
  const diacriticsPattern = "[\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06DC\\u06DF-\\u06E8\\u06EA-\\u06ED]*";
  
  const pattern = escapedQuery
    .split('')
    .map(char => {
      // If char is Alef, allow matching any form of Alef (including Wasla)
      if (char === 'ا') return "[اأإآٱ]" + diacriticsPattern;
      // If char is Yeh, allow Alif Maqsura or Yeh
      if (char === 'ي') return "[يى]" + diacriticsPattern;
      // If char is Haa/Taa Marbuta
      if (char === 'ه') return "[هة]" + diacriticsPattern;
      
      return char + diacriticsPattern;
    })
    .join('');

  return new RegExp(`(${pattern})`, 'gi');
};

// Converts English digits to Arabic-Indic digits (123 -> ١٢٣)
export const toArabicNumerals = (n: number): string => {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
};

// --- Tajweed Logic ---
// Simulates Tajweed rules by wrapping characters in spans with classes
// Note: This is a simplified client-side heuristic. Authentic Tajweed requires deep linguistic parsing.
export const applyTajweed = (text: string): string => {
  let output = text;

  // 1. Ghunnah (Noon/Mim Mushaddadah) - Orange
  // Matches Shadda followed by any short vowel on Noon or Mim
  output = output.replace(/([نم])([\u0651])([\u064B-\u0650]?)/g, '<span class="tajweed-ghunnah">$1$2$3</span>');

  // 2. Qalqalah (Qaf, Taa, Baa, Jeem, Dal) when Sakin - Blue
  // Matches (q,t,b,j,d) followed by Sukun
  output = output.replace(/([قطبجد])([\u0652])/g, '<span class="tajweed-qalqalah">$1$2</span>');

  // 3. Madd (Long vowels) - Purple
  // Matches Tilde mark (Maddah) usually on Alef
  output = output.replace(/([\u0653])/g, '<span class="tajweed-madd">$1</span>');

  // 4. Allah Name Thickness (simplified)
  output = output.replace(/(ٱللَّهِ|ٱللَّهُ|ٱللَّهَ)/g, '<span class="font-bold">$1</span>');

  return output;
};
