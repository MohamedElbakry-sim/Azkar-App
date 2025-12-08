
import { DailyContent, QuranVerse, Hadith } from '../types';

const DAILY_CONTENT_KEY = 'nour_daily_content_v1';

// --- Verified Authentic Verses ---
const FALLBACK_VERSES: QuranVerse[] = [
  {
    text: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا * إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    surah: "الشرح",
    ayahNumber: 5,
    tafsir: "بشارة عظيمة بأن مع كل ضيق وشدة فرجاً ومخرجاً، وتكرارها للتأكيد."
  },
  {
    text: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ",
    surah: "البقرة",
    ayahNumber: 186,
    tafsir: "الله قريب من عباده بعلمه ورحمته، لا يحتاج لوساطة في الدعاء."
  },
  {
    text: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ",
    surah: "البقرة",
    ayahNumber: 286,
    tafsir: "رحمة الله بعباده أنه لا يحملهم من التكاليف ما لا يطيقون."
  },
  {
    text: "الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    surah: "الرعد",
    ayahNumber: 28,
    tafsir: "بذكر الله وتسبيحه وتلاوة كتابه تسكن القلوب وتزول وحشتها."
  },
  {
    text: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا",
    surah: "الزمر",
    ayahNumber: 53,
    tafsir: "دعوة للأمل والتوبة مهما كثرت الذنوب، فباب رحمة الله واسع."
  },
  {
    text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا * وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ",
    surah: "الطلاق",
    ayahNumber: 2,
    tafsir: "تقوى الله مفتاح لكل خير، وسبب لتفريج الكرب وتيسير الرزق."
  },
  {
    text: "وَقَالَ رَبُّكُمُ ادْعُونِي أَسْتَجِبْ لَكُمْ",
    surah: "غافر",
    ayahNumber: 60,
    tafsir: "أمر من الله لعباده بدعائه، ووعد صادق منه بالإجابة."
  },
  {
    text: "إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا",
    surah: "الأحزاب",
    ayahNumber: 56,
    tafsir: "تشريف للنبي صلى الله عليه وسلم، وأمر للمؤمنين بالصلاة عليه لنيل الأجر."
  },
  {
    text: "وَعِبَادُ الرَّحْمَٰنِ الَّذِينَ يَمْشُونَ عَلَى الْأَرْضِ هَوْنًا وَإِذَا خَاطَبَهُمُ الْجَاهِلُونَ قَالُوا سَلَامًا",
    surah: "الفرقان",
    ayahNumber: 63,
    tafsir: "صفات عباد الرحمن: التواضع في مشيتهم، والحلم عند التعامل مع الجاهلين."
  },
  {
    text: "يَا أَيُّهَا النَّاسُ إِنَّا خَلَقْنَاكُم مِّن ذَكَرٍ وَأُنثَىٰ وَجَعَلْنَاكُمْ شُعُوبًا وَقَبَائِلَ لِتَعَارَفُوا ۚ إِنَّ أَكْرَمَكُمْ عِندَ اللَّهِ أَتْقَاكُمْ",
    surah: "الحجرات",
    ayahNumber: 13,
    tafsir: "ميزان التفاضل عند الله هو التقوى والعمل الصالح، لا النسب ولا الشكل."
  }
];

// --- Verified Authentic Hadiths ---
const FALLBACK_HADITHS: Hadith[] = [
  {
    text: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
    source: "صحيح البخاري - 1",
    grade: "صحيح",
    explanation: "أساس قبول الأعمال عند الله هو النية الخالصة."
  },
  {
    text: "الْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ",
    source: "صحيح البخاري - 2989",
    grade: "صحيح",
    explanation: "جبر الخواطر والقول الحسن للناس له أجر الصدقة."
  },
  {
    text: "لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
    source: "صحيح البخاري - 13",
    grade: "صحيح",
    explanation: "علامة كمال الإيمان أن تتمنى الخير لغيرك كما تتمناه لنفسك."
  },
  {
    text: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ",
    source: "سنن الترمذي",
    grade: "صحيح",
    explanation: "البشاشة في وجوه الناس عمل صالح تؤجر عليه."
  },
  {
    text: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
    source: "صحيح البخاري - 5027",
    grade: "صحيح",
    explanation: "أفضل المسلمين من اشتغل بالقرآن تلاوةً وفهماً وتعليماً."
  },
  {
    text: "الطُّهُورُ شَطْرُ الإِيمَانِ",
    source: "صحيح مسلم - 223",
    grade: "صحيح",
    explanation: "النظافة والتطهر من الذنوب والنجاسات نصف الإيمان."
  },
  {
    text: "مَنْ لَا يَشْكُرِ النَّاسَ لَا يَشْكُرِ اللَّهَ",
    source: "سنن أبي داود - 4811",
    grade: "صحيح",
    explanation: "شكر من أحسن إليك من الخلق دليل على شكرك للخالق."
  },
  {
    text: "اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ، وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا، وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ",
    source: "سنن الترمذي - 1987",
    grade: "حسن",
    explanation: "وصية جامعة بتقوى الله في السر والعلن، ومعاملة الناس بالأخلاق الحسنة."
  },
  {
    text: "الْمُؤْمِنُ الْقَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ مِنَ الْمُؤْمِنِ الضَّعِيفِ، وَفِي كُلٍّ خَيْرٌ",
    source: "صحيح مسلم - 2664",
    grade: "صحيح",
    explanation: "القوة هنا تشمل قوة الإيمان والعزيمة والجسد والعلم."
  },
  {
    text: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
    source: "صحيح البخاري - 6018",
    grade: "صحيح",
    explanation: "ضبط اللسان وعفة القول من علامات الإيمان."
  }
];

// --- Helpers ---

// Generate a deterministic index for the day to rotate fallback content if API fails
const getDailyIndex = (length: number) => {
  const now = new Date();
  // Day of year calculation
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  return day % length;
};

// Generate a random ID between 1 and 6236 seeded by the date string for Quran API
const getDailyAyahId = (): number => {
    const todayStr = new Date().toISOString().split('T')[0];
    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) {
        hash = ((hash << 5) - hash) + todayStr.charCodeAt(i);
        hash |= 0;
    }
    return (Math.abs(hash) % 6236) + 1;
};

// --- Fetch Functions ---

const fetchDailyVerse = async (): Promise<QuranVerse> => {
  try {
    // Attempt API first, but fallback quickly if slow or error
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

    const ayahId = getDailyAyahId();
    // Fetch Arabic (Uthmani) and Tafsir (Muyassar)
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${ayahId}/editions/quran-uthmani,ar.muyassar`, {
        signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error("Quran API failed");
    
    const data = await response.json();
    const uthmani = data.data[0];
    const tafsir = data.data[1];

    return {
      text: uthmani.text,
      surah: uthmani.surah.name,
      ayahNumber: uthmani.numberInSurah,
      tafsir: tafsir.text
    };
  } catch (error) {
    // console.warn("Quran API failed, using fallback", error);
    const index = getDailyIndex(FALLBACK_VERSES.length);
    return FALLBACK_VERSES[index];
  }
};

const fetchDailyHadith = async (): Promise<Hadith> => {
    // To ensure 100% authenticity and reliability as requested, 
    // we will strictly use our curated list of verified Sahih Hadiths 
    // instead of relying on external APIs that might return unverified content.
    const index = getDailyIndex(FALLBACK_HADITHS.length);
    return Promise.resolve(FALLBACK_HADITHS[index]);
};

// --- Main Service ---

export const getDailyContent = async (): Promise<DailyContent> => {
  const todayKey = new Date().toISOString().split('T')[0];
  
  // 1. Check Local Cache
  try {
    const cached = localStorage.getItem(DAILY_CONTENT_KEY);
    if (cached) {
      const parsed: DailyContent = JSON.parse(cached);
      if (parsed.date === todayKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Cache read error", e);
  }

  // 2. Fetch New Content
  const [verse, hadith] = await Promise.all([
    fetchDailyVerse(),
    fetchDailyHadith()
  ]);

  const newContent: DailyContent = {
    date: todayKey,
    verse,
    hadith
  };

  // 3. Save to Cache
  try {
    localStorage.setItem(DAILY_CONTENT_KEY, JSON.stringify(newContent));
  } catch (e) {
    console.error("Cache save error", e);
  }

  return newContent;
};
