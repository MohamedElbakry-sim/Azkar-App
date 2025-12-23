import React, { useState, useEffect, useMemo } from 'react';
import { 
    Coins, Info, Trash2, Wallet, 
    Gem, BarChart3, Heart, ChevronLeft, ChevronRight, 
    CheckCircle2, AlertCircle, Banknote, ReceiptText,
    BookOpen, Scale, Clock, ShieldCheck, HelpCircle
} from 'lucide-react';

interface ZakatState {
    cash: string;
    gold: string;
    investments: string;
    debts: string;
    sadaqah: string;
    goldPrice: string;
}

const ZakatCalculator: React.FC = () => {
    const [step, setStep] = useState(1);
    const [activeInfoTab, setActiveInfoTab] = useState<'rules' | 'assets' | 'hawl'>('rules');
    const [values, setValues] = useState<ZakatState>(() => {
        const saved = localStorage.getItem('nour_zakat_data_v4');
        return saved ? JSON.parse(saved) : {
            cash: '', gold: '', investments: '', debts: '', sadaqah: '', goldPrice: '3500' 
        };
    });

    useEffect(() => {
        localStorage.setItem('nour_zakat_data_v4', JSON.stringify(values));
    }, [values]);

    const handleInputChange = (field: keyof ZakatState, value: string) => {
        if (/^\d*\.?\d*$/.test(value) || value === '') {
            setValues(prev => ({ ...prev, [field]: value }));
        }
    };

    const calculations = useMemo(() => {
        const n = (val: string) => parseFloat(val) || 0;
        const totalAssets = n(values.cash) + n(values.gold) + n(values.investments);
        const netWealth = Math.max(0, totalAssets - n(values.debts));
        const nisabThreshold = n(values.goldPrice) * 85;
        const reachedNisab = netWealth >= nisabThreshold;
        const zakatDue = reachedNisab ? (netWealth * 0.025) : 0;
        const totalPayable = zakatDue + n(values.sadaqah);
        const nisabProgress = Math.min((netWealth / (nisabThreshold || 1)) * 100, 100);

        return { totalAssets, netWealth, nisabThreshold, reachedNisab, zakatDue, totalPayable, nisabProgress };
    }, [values]);

    const reset = () => {
        if(confirm('هل تريد تصفير جميع الأرقام؟')) {
            setValues({ cash: '', gold: '', investments: '', debts: '', sadaqah: '', goldPrice: '3500' });
            setStep(1);
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-24 animate-fadeIn px-4">
            {/* Header */}
            <div className="text-center mb-10">
                <div className="inline-flex p-4 bg-primary-50 dark:bg-primary-900/20 rounded-3xl text-primary-600 mb-4 shadow-sm">
                    <Coins size={32} />
                </div>
                <h1 className="text-3xl font-bold font-arabicHead text-gray-800 dark:text-white mb-2">حاسبة الزكاة الشرعية</h1>
                <p className="text-gray-500 dark:text-gray-400 font-arabic">أداة يسيرة لحساب فريضة الزكاة بناءً على الضوابط الفقهية</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* --- Left: Calculator Wizard --- */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white dark:bg-dark-surface rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-black/5 border border-gray-100 dark:border-dark-border relative overflow-hidden">
                        
                        {/* Step Indicator */}
                        <div className="flex items-center justify-center gap-2 mb-10">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${step >= i ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'bg-gray-100 dark:bg-dark-bg text-gray-400'}`}>
                                        {step > i ? <CheckCircle2 size={20} /> : i}
                                    </div>
                                    {i < 3 && <div className={`w-12 h-0.5 mx-1 transition-all duration-500 ${step > i ? 'bg-primary-600' : 'bg-gray-100 dark:bg-dark-bg'}`} />}
                                </div>
                            ))}
                        </div>

                        {/* Step 1: Assets */}
                        {step === 1 && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="border-b border-gray-50 dark:border-dark-border pb-4">
                                    <h3 className="text-xl font-bold font-arabicHead text-gray-800 dark:text-white">الخطوة الأولى: إجمالي الأموال</h3>
                                    <p className="text-sm text-gray-500 mt-1">أدخل قيمة الأصول التي تملكها حالياً</p>
                                </div>
                                
                                <div className="space-y-5">
                                    <div className="group">
                                        <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block mb-2 mr-1">السيولة النقدية</label>
                                        <div className="relative">
                                            <input 
                                                type="text" inputMode="decimal" value={values.cash} onChange={(e) => handleInputChange('cash', e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-dark-bg border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl p-4 pl-12 font-mono text-lg outline-none transition-all dark:text-white" placeholder="0.00"
                                            />
                                            <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={24} />
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1.5 mr-1">تشمل الأموال في المنزل، الحسابات البنكية، والديون المرجو سدادها لك.</p>
                                    </div>

                                    <div className="group">
                                        <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block mb-2 mr-1">الذهب والفضة (للادخار)</label>
                                        <div className="relative">
                                            <input 
                                                type="text" inputMode="decimal" value={values.gold} onChange={(e) => handleInputChange('gold', e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-dark-bg border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl p-4 pl-12 font-mono text-lg outline-none transition-all dark:text-white" placeholder="0.00"
                                            />
                                            <Gem className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={24} />
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1.5 mr-1">ادخل القيمة السوقية الحالية للذهب والفضة المقتنى لغرض الادخار.</p>
                                    </div>

                                    <div className="group">
                                        <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block mb-2 mr-1">الاستثمارات وعروض التجارة</label>
                                        <div className="relative">
                                            <input 
                                                type="text" inputMode="decimal" value={values.investments} onChange={(e) => handleInputChange('investments', e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-dark-bg border-2 border-transparent focus:border-primary-500 focus:bg-white rounded-2xl p-4 pl-12 font-mono text-lg outline-none transition-all dark:text-white" placeholder="0.00"
                                            />
                                            <BarChart3 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={24} />
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1.5 mr-1">تشمل الأسهم، الصناديق الاستثمارية، وقيمة البضائع المعدة للبيع.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Debts */}
                        {step === 2 && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="border-b border-gray-50 dark:border-dark-border pb-4">
                                    <h3 className="text-xl font-bold font-arabicHead text-red-500">الخطوة الثانية: الخصوم والديون</h3>
                                    <p className="text-sm text-gray-500 mt-1">المبالغ التي تخصم من وعاء الزكاة</p>
                                </div>
                                
                                <div className="space-y-5">
                                    <div className="group">
                                        <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block mb-2 mr-1">ديون مستحقة للغير (حالية)</label>
                                        <div className="relative">
                                            <input 
                                                type="text" inputMode="decimal" value={values.debts} onChange={(e) => handleInputChange('debts', e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-dark-bg border-2 border-transparent focus:border-red-500 focus:bg-white rounded-2xl p-4 pl-12 font-mono text-lg outline-none transition-all dark:text-white" placeholder="0.00"
                                            />
                                            <Trash2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-red-500 transition-colors" size={24} />
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1.5 mr-1">تخصم فقط الديون التي حل موعد سدادها أو الأقساط المستحقة خلال السنة الحالية.</p>
                                    </div>
                                </div>

                                <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-3xl flex gap-4 border border-amber-100 dark:border-amber-900/30">
                                    <Info className="text-amber-500 shrink-0" size={24} />
                                    <p className="text-xs text-amber-800 dark:text-amber-200 leading-loose font-bold">
                                        تنبيه فقهي: الديون طويلة الأجل (كالقروض السكنية) لا تُخصم بكامل قيمتها من وعاء الزكاة، بل يُخصم منها فقط القسط السنوي المستحق حالاً.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Result */}
                        {step === 3 && (
                            <div className="space-y-8 animate-fadeIn">
                                <div className="bg-gray-50 dark:bg-dark-panel rounded-[2.5rem] p-8 border-2 border-dashed border-gray-200 dark:border-dark-border relative overflow-hidden text-center">
                                    <div className="absolute top-0 right-0 p-6 opacity-5 text-gray-900 dark:text-white">
                                        <ReceiptText size={160} />
                                    </div>
                                    
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">إجمالي الزكاة المستحقة</span>
                                    
                                    <div className="flex flex-wrap items-baseline justify-center gap-2 px-2">
                                        <span className="text-4xl sm:text-5xl md:text-6xl font-bold font-mono text-primary-600 break-all leading-none">
                                            {calculations.zakatDue.toLocaleString()}
                                        </span>
                                        <span className="text-xl font-bold text-primary-500">ج.م</span>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-gray-200 dark:border-dark-border grid grid-cols-2 gap-4">
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold text-gray-400 block mb-1">صافي الثروة:</span>
                                            <span className="text-lg font-bold font-mono dark:text-white">{calculations.netWealth.toLocaleString()}</span>
                                        </div>
                                        <div className="text-left">
                                            <span className="text-[10px] font-bold text-gray-400 block mb-1">حد النصاب:</span>
                                            <span className="text-lg font-bold font-mono dark:text-white">{calculations.nisabThreshold.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={`p-5 rounded-2xl text-center border-2 flex items-center justify-center gap-3 ${calculations.reachedNisab ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/10 dark:border-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-900/10 dark:border-amber-800'}`}>
                                    {calculations.reachedNisab ? <ShieldCheck size={24} /> : <AlertCircle size={24} />}
                                    <p className="text-sm font-bold font-arabic leading-relaxed">
                                        {calculations.reachedNisab 
                                            ? 'أموالك بلغت النصاب الشرعي، تجب عليها الزكاة (بشرط مرور سنة قمرية).' 
                                            : 'أموالك لم تبلغ النصاب بعد (قيمة 85 جرام ذهب)، لا تجب الزكاة حالياً.'}
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <label className="text-sm font-bold text-rose-500 block mb-3 mr-1 flex items-center gap-2">
                                        <Heart size={18} fill="currentColor" />
                                        إضافة صدقة تطوعية (اختياري)
                                    </label>
                                    <input 
                                        type="text" inputMode="decimal" value={values.sadaqah} onChange={(e) => handleInputChange('sadaqah', e.target.value)}
                                        className="w-full bg-rose-50/30 dark:bg-rose-900/5 border-2 border-rose-100 dark:border-rose-900/20 focus:border-rose-400 rounded-2xl p-4 font-mono text-lg outline-none transition-all dark:text-white" placeholder="0.00"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex gap-4 mt-10">
                            {step > 1 && (
                                <button 
                                    onClick={() => setStep(s => s - 1)}
                                    className="px-6 py-4 rounded-2xl bg-gray-100 dark:bg-dark-panel text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                >
                                    <ChevronRight size={20} />
                                    <span>السابق</span>
                                </button>
                            )}
                            
                            {step < 3 ? (
                                <button 
                                    onClick={() => setStep(s => s + 1)}
                                    className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <span>المتابعة</span>
                                    <ChevronLeft size={20} />
                                </button>
                            ) : (
                                <button 
                                    onClick={reset}
                                    className="flex-1 py-4 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={18} />
                                    <span>تصفير البيانات</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Gold Price Card */}
                    <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 border border-gray-100 dark:border-dark-border shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl">
                                    <Banknote size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400">سعر جرام الذهب (عيار 24)</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input 
                                            type="text" value={values.goldPrice} onChange={(e) => handleInputChange('goldPrice', e.target.value)}
                                            className="w-24 bg-gray-50 dark:bg-dark-bg border-none rounded-lg focus:ring-2 focus:ring-amber-500 font-mono font-bold text-gray-800 dark:text-white p-2"
                                        />
                                        <span className="text-sm text-gray-400 font-bold">ج.م</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">النصاب الحالي</p>
                                <p className="text-xl font-mono font-bold text-emerald-600">{calculations.nisabThreshold.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Right: Educational Context --- */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white dark:bg-dark-surface rounded-[2.5rem] p-6 md:p-8 shadow-lg border border-gray-100 dark:border-dark-border overflow-hidden">
                        <h3 className="text-xl font-bold font-arabicHead mb-6 flex items-center gap-3 text-gray-800 dark:text-white">
                            <BookOpen className="text-primary-500" />
                            دليل الزكاة الشرعي
                        </h3>

                        {/* Tabs */}
                        <div className="flex bg-gray-100 dark:bg-dark-bg p-1 rounded-2xl mb-8">
                            {[
                                { id: 'rules', label: 'الشروط', icon: Scale },
                                { id: 'assets', label: 'الأموال', icon: Wallet },
                                { id: 'hawl', label: 'الحول', icon: Clock },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveInfoTab(tab.id as any)}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${activeInfoTab === tab.id ? 'bg-white dark:bg-dark-surface text-primary-600 shadow-sm scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <tab.icon size={14} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-6 animate-fadeIn min-h-[300px]">
                            {activeInfoTab === 'rules' && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-primary-50/50 dark:bg-primary-900/5 rounded-2xl border border-primary-100/50 dark:border-primary-900/20">
                                        <h4 className="font-bold text-primary-700 dark:text-primary-400 text-sm mb-2 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-primary-500" />
                                            ما هي الزكاة؟
                                        </h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-arabic">
                                            الزكاة هي الركن الثالث من أركان الإسلام، وهي قدر معلوم من المال أوجبه الله تعالى في أموال المسلمين بشروط معينة، تُصرف لفئات محددة (المصارف الثمانية).
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-dark-bg rounded-2xl border border-gray-100 dark:border-dark-border">
                                        <h4 className="font-bold text-gray-700 dark:text-gray-300 text-sm mb-2 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            شرط النصاب
                                        </h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-arabic">
                                            هو الحد الأدنى للمال الذي تجب فيه الزكاة. ويُقدر شرعاً بقيمة **85 جراماً من الذهب الصافي (عيار 24)**. إذا كان مالك أقل من هذا الحد فلا تجب عليك الزكاة.
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-dark-bg rounded-2xl border border-gray-100 dark:border-dark-border">
                                        <h4 className="font-bold text-gray-700 dark:text-gray-300 text-sm mb-2 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                                            المقدار الواجب
                                        </h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-arabic">
                                            المقدار الواجب إخراجه في زكاة النقدين (المال والذهب والفضة) هو **2.5% (أو ربع العشر)** من إجمالي المال الفائض بعد خصم الديون.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeInfoTab === 'assets' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                                            <h5 className="font-bold text-emerald-700 dark:text-emerald-400 text-[10px] uppercase mb-2">تجب فيها الزكاة</h5>
                                            <ul className="text-[10px] text-gray-600 dark:text-gray-400 space-y-1.5 font-bold">
                                                <li>• النقود (كاش/بنك)</li>
                                                <li>• الذهب والفضة للادخار</li>
                                                <li>• الأسهم بنية التجارة</li>
                                                <li>• السلع المعدة للبيع</li>
                                            </ul>
                                        </div>
                                        <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20">
                                            <h5 className="font-bold text-rose-700 dark:text-rose-400 text-[10px] uppercase mb-2">لا زكاة فيها</h5>
                                            <ul className="text-[10px] text-gray-600 dark:text-gray-400 space-y-1.5 font-bold">
                                                <li>• المنزل الشخصي</li>
                                                <li>• السيارة الشخصية</li>
                                                <li>• الأثاث والمتاع</li>
                                                <li>• حلي النساء للاستعمال</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-dark-bg rounded-2xl border border-gray-100 dark:border-dark-border">
                                        <h4 className="font-bold text-gray-700 dark:text-gray-300 text-sm mb-2">زكاة الحلي والمجوهرات</h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-arabic">
                                            ذهب جمهور العلماء إلى أن الحلي الذي تتخذه المرأة للزينة المباحة لا زكاة فيه، أما إذا كان للادخار أو الاستثمار فتجب فيه الزكاة إذا بلغ النصاب.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeInfoTab === 'hawl' && (
                                <div className="space-y-4">
                                    <div className="flex flex-col items-center py-6">
                                        <Clock size={48} className="text-primary-500 mb-4 opacity-20" />
                                        <h4 className="font-bold text-lg text-gray-800 dark:text-white mb-2 font-arabicHead">شرط مرور الحول</h4>
                                        <p className="text-center text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-arabic px-4">
                                            لا تجب الزكاة في المال بمجرد بلوغه النصاب، بل يجب أن يمضي عليه **عام هجري كامل (354 يوماً)** وهو في ملكيتك وتحت يدك.
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="flex gap-3 items-start p-3 bg-gray-50 dark:bg-dark-bg rounded-xl border border-gray-100 dark:border-dark-border">
                                            <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0 text-[10px] font-bold">1</div>
                                            <p className="text-[10px] text-gray-600 dark:text-gray-400 font-bold">ابدأ بحساب "يوم النصاب" وهو اليوم الذي ملكت فيه مبلغاً يساوي 85 جرام ذهب.</p>
                                        </div>
                                        <div className="flex gap-3 items-start p-3 bg-gray-50 dark:bg-dark-bg rounded-xl border border-gray-100 dark:border-dark-border">
                                            <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0 text-[10px] font-bold">2</div>
                                            <p className="text-[10px] text-gray-600 dark:text-gray-400 font-bold">انتظر مرور سنة هجرية كاملة. إذا ظل رصيدك فوق النصاب طوال السنة، تجب الزكاة.</p>
                                        </div>
                                        <div className="flex gap-3 items-start p-3 bg-gray-50 dark:bg-dark-bg rounded-xl border border-gray-100 dark:border-dark-border">
                                            <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0 text-[10px] font-bold">3</div>
                                            <p className="text-[10px] text-gray-600 dark:text-gray-400 font-bold">يتم إخراج الزكاة على الرصيد الموجود في نهاية السنة الهجرية.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-50 dark:border-dark-border flex items-center gap-3">
                            <HelpCircle className="text-gray-300" size={20} />
                            <p className="text-[10px] text-gray-400 leading-relaxed font-arabic">
                                هل لديك حالة خاصة؟ (زكاة زروع، عروض تجارة معقدة، أموال في عقارات) يُنصح باستشارة دار الإفتاء أو عالم شرعي موثوق.
                            </p>
                        </div>
                    </div>
                    
                    {/* Visual Progress/Status */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-500/20">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="font-bold flex items-center gap-2">
                                <Banknote size={20} />
                                مؤشر النصاب
                            </h4>
                            <span className="text-[10px] font-bold opacity-60 font-mono">{Math.round(calculations.nisabProgress)}%</span>
                        </div>
                        
                        <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-6">
                            <div 
                                className="h-full bg-white transition-all duration-1000 ease-out"
                                style={{ width: `${calculations.nisabProgress}%` }}
                            />
                        </div>
                        
                        <p className="text-xs leading-relaxed opacity-90 font-arabic">
                            {calculations.reachedNisab 
                                ? 'لقد تجاوزت ثروتك حد النصاب الشرعي بمقدار ' + (calculations.netWealth - calculations.nisabThreshold).toLocaleString() + ' ج.م.'
                                : 'متبقي لك ' + (calculations.nisabThreshold - calculations.netWealth).toLocaleString() + ' ج.م لتصل إلى حد النصاب.'
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ZakatCalculator;