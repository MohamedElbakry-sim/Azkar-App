
import { Sahabi } from '../types';

const SAHABA_CACHE_KEY = 'nour_daily_sahabi_v1';

interface CachedSahabi {
  date: string;
  data: Sahabi;
}

// Verified Authentic Database of Sahaba
// This removes the dependency on unstable external APIs
const SAHABA_DATA: Sahabi[] = [
    {
        id: 1,
        arabic_name: "أبو بكر الصديق",
        name: "Abu Bakr Al-Siddiq",
        description: "عبد الله بن أبي قحافة، أول الخلفاء الراشدين، وأول من آمن بالرسول ﷺ من الرجال. كان رفيق النبي في الهجرة، وأنفق ماله كله لنصرة الدين.",
        notable_facts: [
            "أول الخلفاء الراشدين.",
            "صاحب رسول الله ﷺ في الغار.",
            "والد أم المؤمنين عائشة رضي الله عنها.",
            "أعتق بلال بن رباح وكثير من المستضعفين."
        ]
    },
    {
        id: 2,
        arabic_name: "عمر بن الخطاب",
        name: "Umar ibn Al-Khattab",
        description: "ثاني الخلفاء الراشدين، الملقب بالفاروق، الذي فرق الله به بين الحق والباطل. تميز بقوته في الحق وعدله الذي ضربت به الأمثال.",
        notable_facts: [
            "أول من لقب بأمير المؤمنين.",
            "أسس الدواوين والتاريخ الهجري.",
            "فتح في عهده القدس ومصر والعراق.",
            "وافق حكمه القرآن في عدة مواضع."
        ]
    },
    {
        id: 3,
        arabic_name: "عثمان بن عفان",
        name: "Uthman ibn Affan",
        description: "ثالث الخلفاء الراشدين، الملقب بذي النورين لزواجه من ابنتي الرسول ﷺ (رقية ثم أم كلثوم). كان تستحي منه الملائكة لشدة حيائه.",
        notable_facts: [
            "جمع القرآن الكريم في مصحف واحد.",
            "جهز جيش العسرة من ماله الخاص.",
            "اشترى بئر رومة وجعلها وقفاً للمسلمين.",
            "أحد العشرة المبشرين بالجنة."
        ]
    },
    {
        id: 4,
        arabic_name: "علي بن أبي طالب",
        name: "Ali ibn Abi Talib",
        description: "رابع الخلفاء الراشدين، وابن عم الرسول ﷺ وصهره. كان أول من أسلم من الصبيان، وعُرف بشجاعته وبلاغته وحكمته.",
        notable_facts: [
            "بات في فراش النبي ﷺ ليلة الهجرة.",
            "زوج فاطمة الزهراء سيدة نساء العالمين.",
            "حامل راية المسلمين في خيبر.",
            "من أشهر أقواله: 'سلوني قبل أن تفقدوني'."
        ]
    },
    {
        id: 5,
        arabic_name: "طلحة بن عبيد الله",
        name: "Talha ibn Ubaydullah",
        description: "أحد العشرة المبشرين بالجنة، سماه النبي ﷺ 'طلحة الخير' و'طلحة الفياض'. كان من أشد المدافعين عن النبي في غزوة أحد.",
        notable_facts: [
            "وقى النبي ﷺ بيده يوم أحد حتى شُلت.",
            "من الستة أصحاب الشورى.",
            "أنفق ثروة طائلة في سبيل الله.",
            "قال عنه النبي: 'من سره أن ينظر إلى شهيد يمشي على وجه الأرض فلينظر إلى طلحة'."
        ]
    },
    {
        id: 6,
        arabic_name: "الزبير بن العوام",
        name: "Al-Zubayr ibn Al-Awam",
        description: "حواري رسول الله ﷺ وابن عمته صفية. كان أول من سل سيفاً في سبيل الله، وأحد الستة أصحاب الشورى.",
        notable_facts: [
            "قال عنه النبي: 'إن لكل نبي حوارياً، وحواريّ الزبير'.",
            "أسلم وهو ابن 15 سنة.",
            "شارك في جميع الغزوات مع النبي ﷺ.",
            "أحد العشرة المبشرين بالجنة."
        ]
    },
    {
        id: 7,
        arabic_name: "عبد الرحمن بن عوف",
        name: "Abdur Rahman ibn Awf",
        description: "أحد العشرة المبشرين بالجنة، ومن كبار تجار الصحابة الذين سخروا أموالهم لخدمة الإسلام. صلى النبي ﷺ خلفه في إحدى الأسفار.",
        notable_facts: [
            "هاجر وترك كل ماله، ثم أصبح من أغنى الأغنياء بالمدينة.",
            "تصدق بقوافل كاملة لمحتاجين المدينة.",
            "أحد الستة أصحاب الشورى.",
            "عرض عليه سعد بن الربيع نصف ماله فرفض وقال: 'دلني على السوق'."
        ]
    },
    {
        id: 8,
        arabic_name: "سعد بن أبي وقاص",
        name: "Saad ibn Abi Waqqas",
        description: "خال النبي ﷺ، وأول من رمى بسهم في سبيل الله. كان مستجاب الدعوة، وقائد جيش المسلمين في معركة القادسية.",
        notable_facts: [
            "قال له النبي يوم أحد: 'ارمِ فداك أبي وأمي'.",
            "فاتح العراق وقائد معركة القادسية.",
            "أحد العشرة المبشرين بالجنة.",
            "اعتزل الفتنة الكبرى ولزم بيته."
        ]
    },
    {
        id: 9,
        arabic_name: "أبو عبيدة بن الجراح",
        name: "Abu Ubaidah ibn Al-Jarrah",
        description: "أمين هذه الأمة، وأحد السابقين الأولين للإسلام. قاد جيوش المسلمين في فتح الشام.",
        notable_facts: [
            "قال عنه النبي: 'إن لكل أمة أميناً، وأمين هذه الأمة أبو عبيدة'.",
            "فتح بيت المقدس في عهده.",
            "توفي في طاعون عمواس.",
            "أحد العشرة المبشرين بالجنة."
        ]
    },
    {
        id: 10,
        arabic_name: "خالد بن الوليد",
        name: "Khalid ibn Al-Walid",
        description: "سيف الله المسلول، القائد العسكري الفذ الذي لم يُهزم في معركة قط (أكثر من 100 معركة).",
        notable_facts: [
            "لقبه النبي ﷺ بسيف الله المسلول.",
            "قاد المسلمين في معركة اليرموك الخالدة.",
            "انسحب بجيش مؤتة بخطة عبقرية.",
            "مات على فراشه وهو يتمنى الشهادة."
        ]
    },
    {
        id: 11,
        arabic_name: "بلال بن رباح",
        name: "Bilal ibn Rabah",
        description: "مؤذن الرسول ﷺ، ومن السابقين للإسلام. صبر على تعذيب قريش له في رمضاء مكة وهو يردد 'أحدٌ أحد'.",
        notable_facts: [
            "أول مؤذن في الإسلام.",
            "شهد بدراً وأحداً وكل المشاهد.",
            "تولى بيت مال المسلمين.",
            "أذن يوم فتح مكة فوق الكعبة."
        ]
    },
    {
        id: 12,
        arabic_name: "مصعب بن عمير",
        name: "Mus'ab ibn Umayr",
        description: "سفير الإسلام الأول، وأول من بعثه النبي ﷺ للمدينة ليعلم أهلها القرآن. كان من أنعم فتيان قريش قبل الإسلام.",
        notable_facts: [
            "حامل لواء المسلمين يوم أحد.",
            "استشهد يوم أحد ولم يجدوا ما يكفنوه به إلا نمرة قصيرة.",
            "أسلم على يديه أسيد بن حضير وسعد بن معاذ.",
            "لقب بـ 'المقرئ' في المدينة."
        ]
    }
];

export const getDailySahabi = async (): Promise<Sahabi> => {
  const today = new Date().toISOString().split('T')[0];
  
  // 1. Check Cache first
  try {
    const cachedRaw = localStorage.getItem(SAHABA_CACHE_KEY);
    if (cachedRaw) {
      const cached: CachedSahabi = JSON.parse(cachedRaw);
      if (cached.date === today) {
        return cached.data;
      }
    }
  } catch (e) {
    console.warn('Error reading Sahaba cache', e);
  }

  // 2. Select a Sahabi based on the Day of the Year
  // This ensures everyone gets the same Sahabi on the same day without needing a server
  const startOfYear = new Date(new Date().getFullYear(), 0, 0);
  const diff = new Date().getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  const index = dayOfYear % SAHABA_DATA.length;
  const selectedSahabi = SAHABA_DATA[index];

  // 3. Cache the result
  const cacheEntry: CachedSahabi = {
      date: today,
      data: selectedSahabi
  };
  localStorage.setItem(SAHABA_CACHE_KEY, JSON.stringify(cacheEntry));

  // Simulate a short network delay for better UX (so loader shows briefly)
  await new Promise(resolve => setTimeout(resolve, 500));

  return selectedSahabi;
};
