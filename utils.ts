// Removes Tashkeel (Diacritics) from Arabic text
export const removeTashkeel = (text: string): string => {
  return text.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED]/g, "");
};

// Normalizes Arabic text for search
export const normalizeArabic = (text: string): string => {
  let normalized = text;
  normalized = removeTashkeel(normalized);
  normalized = normalized.replace(/[أإآٱ]/g, "ا");
  normalized = normalized.replace(/ة/g, "ه");
  normalized = normalized.replace(/[ىي]/g, "ي");
  normalized = normalized.replace(/ؤ/g, "و"); 
  return normalized;
};

// Creates a Regex that matches the query sequence even if there are diacritics
export const getHighlightRegex = (query: string): RegExp | null => {
  if (!query) return null;
  const normalizedQuery = normalizeArabic(query);
  const diacriticsPattern = "[\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06DC\\u06DF-\\u06E8\\u06EA-\\u06ED]*";
  
  const pattern = normalizedQuery
    .split('')
    .map(char => {
      if (/\s/.test(char)) return "\\s+";
      const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (escaped === 'ا') return "[اأإآٱ]" + diacriticsPattern;
      if (escaped === 'ي') return "[يى]" + diacriticsPattern;
      if (escaped === 'ه') return "[هة]" + diacriticsPattern;
      if (escaped === 'و') return "[وؤ]" + diacriticsPattern;
      return escaped + diacriticsPattern;
    })
    .join('');

  return new RegExp(`(${pattern})`, 'gi');
};

// Converts English digits to Arabic-Indic digits (123 -> ١٢٣)
export const toArabicNumerals = (n: number | undefined | null): string => {
  if (n === undefined || n === null) return '';
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
};

// Apply Tajweed rules styling using CSS classes defined in index.html
export const applyTajweed = (text: string): string => {
  let html = text;
  // Ghunnah (orange)
  html = html.replace(/([ن|م][ّ|ً|ٌ|ٍ])/g, '<span class="tajweed-ghunnah">$1</span>');
  // Qalqalah (blue)
  html = html.replace(/([ق|ط|ب|ج|د][ْ])/g, '<span class="tajweed-qalqalah">$1</span>');
  // Madd (purple)
  html = html.replace(/([ا|و|ي][ـٰ])/g, '<span class="tajweed-madd">$1</span>');
  return html;
};

// Standard mapping for Juz starting positions
export const getJuzInfo = (juzNumber: number): { surah: number, ayah: number } => {
  const juzStarts = [
    { surah: 1, ayah: 1 },    // 1
    { surah: 2, ayah: 142 },  // 2
    { surah: 2, ayah: 253 },  // 3
    { surah: 3, ayah: 93 },   // 4
    { surah: 4, ayah: 24 },   // 5
    { surah: 4, ayah: 148 },  // 6
    { surah: 5, ayah: 82 },   // 7
    { surah: 6, ayah: 111 },  // 8
    { surah: 7, ayah: 88 },   // 9
    { surah: 8, ayah: 41 },   // 10
    { surah: 9, ayah: 93 },   // 11
    { surah: 11, ayah: 6 },   // 12
    { surah: 12, ayah: 53 },  // 13
    { surah: 14, ayah: 1 },   // 14
    { surah: 17, ayah: 1 },   // 15
    { surah: 18, ayah: 75 },  // 16
    { surah: 21, ayah: 1 },   // 17
    { surah: 23, ayah: 1 },   // 18
    { surah: 25, ayah: 21 },  // 19
    { surah: 27, ayah: 56 },  // 20
    { surah: 29, ayah: 46 },  // 21
    { surah: 33, ayah: 31 },  // 22
    { surah: 36, ayah: 28 },  // 23
    { surah: 39, ayah: 32 },  // 24
    { surah: 41, ayah: 47 },  // 25
    { surah: 46, ayah: 1 },   // 26
    { surah: 51, ayah: 31 },  // 27
    { surah: 58, ayah: 1 },   // 28
    { surah: 67, ayah: 1 },   // 29
    { surah: 78, ayah: 1 },   // 30
  ];
  return juzStarts[juzNumber - 1];
};
