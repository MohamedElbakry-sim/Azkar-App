
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
  normalized = normalized.replace(/ؤ/g, "و"); 

  return normalized;
};

// Creates a Regex that matches the query sequence even if there are diacritics in between letters
export const getHighlightRegex = (query: string): RegExp | null => {
  if (!query) return null;

  const normalizedQuery = normalizeArabic(query);
  
  // Diacritics pattern to allow between letters (Tashkeel, Stop marks, etc.)
  const diacriticsPattern = "[\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06DC\\u06DF-\\u06E8\\u06EA-\\u06ED]*";
  
  // Escape special regex characters in the query, but handle spaces specially
  const pattern = normalizedQuery
    .split('')
    .map(char => {
      // If char is space, allow one or more whitespace characters
      if (/\s/.test(char)) return "\\s+";
      
      const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // If char is Alef, allow matching any form of Alef (including Wasla)
      if (escaped === 'ا') return "[اأإآٱ]" + diacriticsPattern;
      // If char is Yeh, allow Alif Maqsura or Yeh
      if (escaped === 'ي') return "[يى]" + diacriticsPattern;
      // If char is Haa/Taa Marbuta
      if (escaped === 'ه') return "[هة]" + diacriticsPattern;
      // If char is Waw
      if (escaped === 'و') return "[وؤ]" + diacriticsPattern;
      
      return escaped + diacriticsPattern;
    })
    .join('');

  // Use word boundaries or ensure it matches within text content
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

// Juz Start Page Mapping (Standard Madani 604 pages)
// Maps Juz Index (1-30) to { Starting Page Number, Surah ID usually present/starting there }
export const getJuzInfo = (juz: number): { page: number; surah: number } => {
  // 1-based index mapping for Juz 1..30
  const mapping = [
    { page: 1, surah: 1 },   // Juz 1
    { page: 22, surah: 2 },  // Juz 2
    { page: 42, surah: 2 },  // Juz 3
    { page: 62, surah: 3 },  // Juz 4
    { page: 82, surah: 4 },  // Juz 5
    { page: 102, surah: 4 }, // Juz 6
    { page: 122, surah: 5 }, // Juz 7
    { page: 142, surah: 6 }, // Juz 8
    { page: 162, surah: 7 }, // Juz 9
    { page: 182, surah: 8 }, // Juz 10
    { page: 202, surah: 9 }, // Juz 11
    { page: 222, surah: 11 },// Juz 12
    { page: 242, surah: 12 },// Juz 13
    { page: 262, surah: 15 },// Juz 14
    { page: 282, surah: 18 },// Juz 15
    { page: 302, surah: 18 },// Juz 16
    { page: 322, surah: 21 },// Juz 17
    { page: 342, surah: 22 },// Juz 18
    { page: 362, surah: 25 },// Juz 19
    { page: 382, surah: 27 },// Juz 20
    { page: 402, surah: 29 },// Juz 21
    { page: 422, surah: 33 },// Juz 22
    { page: 442, surah: 36 },// Juz 23
    { page: 462, surah: 39 },// Juz 24
    { page: 482, surah: 41 },// Juz 25
    { page: 502, surah: 46 },// Juz 26
    { page: 522, surah: 51 },// Juz 27
    { page: 542, surah: 58 },// Juz 28
    { page: 562, surah: 67 },// Juz 29
    { page: 582, surah: 78 },// Juz 30
  ];
  
  if (juz < 1 || juz > 30) return mapping[0];
  return mapping[juz - 1];
};
