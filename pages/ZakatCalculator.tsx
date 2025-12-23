import React, { useState, useEffect, useMemo } from 'react';
import { 
    Coins, Info, Trash2, Wallet, 
    Gem, BarChart3, Heart, ChevronLeft, ChevronRight, 
    CheckCircle2, AlertCircle, Banknote, ReceiptText
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
    const [values, setValues] = useState<ZakatState>(() => {
        const saved = localStorage.getItem('nour_zakat_data_v3');
        return saved ? JSON.parse(saved) : {
            cash: '', gold: '', investments: '', debts: '', sadaqah: '', goldPrice: '3500' 
        };
    });

    useEffect(() => {
        localStorage.setItem('nour_zakat_data_v3', JSON.stringify(values));
    }, [values]);

    const handleInputChange = (field: keyof ZakatState, value: string) => {
        // Strict numeric validation to prevent cursor jumps
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
        const nisabProgress = Math.min((netWealth / nisabThreshold) * 100, 100);

        return { totalAssets, netWealth, nisabThreshold, reachedNisab, zakatDue, totalPayable, nisabProgress };
    }, [values]);

    const reset = () => {
        if(confirm('هل تريد تصفير جميع الأرقام؟')) {
            setValues({ cash: '', gold: '', investments: '', debts: '', sadaqah: '', goldPrice: '3500' });
            setStep(1);
        }
    };

    return (
        <div className="max-w-2xl mx-auto pb-24 animate-fadeIn">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex p-3 bg-primary-50 dark:bg-primary-900/20 rounded-2xl text-primary-600 mb-3">
                    <Coins size={28} />
                </div>
                <h1 className="text-2xl font-bold font-arabicHead text-gray-800 dark:text-white">حاسبة الزكاة</h1>
                
                {/* Simplified Steps */}
                <div className="flex items-center justify-center gap-2 mt-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= i ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-200 dark:bg-dark-surface text-gray-400'}`}>
                                {step > i ? <CheckCircle2 size={16} /> : i}
                            </div>
                            {i < 3 && <div className={`w-8 h-0.5 mx-1 ${step > i ? 'bg-primary-600' : 'bg-gray-200 dark:bg-dark-surface'}`} />}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-dark-surface rounded-[2rem] p-6 md:p-8 shadow-xl shadow-black/5 border border-gray-100 dark:border-dark-border">
                
                {/* Step 1: Assets */}
                {step === 1 && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="border-b border-gray-50 dark:border-dark-border pb-4 mb-2">
                            <h3 className="text-lg font-bold font-arabicHead text-gray-800 dark:text-white">ماذا تملك؟</h3>
                            <p className="text-xs text-gray-500 font-arabic">أدخل قيمة الأموال والذهب المدخرة</p>
                        </div>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-gray-400 block mb-2 mr-1">السيولة النقدية (كاش / بنك)</label>
                                <div className="relative">
                                    <input 
                                        type="text" inputMode="decimal" value={values.cash} onChange={(e) => handleInputChange('cash', e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-dark-bg border-2 border-transparent focus:border-primary-500 rounded-2xl p-4 pl-12 font-mono text-lg outline-none transition-all dark:text-white" placeholder="0.00"
                                    />
                                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 block mb-2 mr-1">قيمة الذهب والفضة للادخار</label>
                                <div className="relative">
                                    <input 
                                        type="text" inputMode="decimal" value={values.gold} onChange={(e) => handleInputChange('gold', e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-dark-bg border-2 border-transparent focus:border-primary-500 rounded-2xl p-4 pl-12 font-mono text-lg outline-none transition-all dark:text-white" placeholder="0.00"
                                    />
                                    <Gem className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 block mb-2 mr-1">الأسهم والاستثمارات</label>
                                <div className="relative">
                                    <input 
                                        type="text" inputMode="decimal" value={values.investments} onChange={(e) => handleInputChange('investments', e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-dark-bg border-2 border-transparent focus:border-primary-500 rounded-2xl p-4 pl-12 font-mono text-lg outline-none transition-all dark:text-white" placeholder="0.00"
                                    />
                                    <BarChart3 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Debts */}
                {step === 2 && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="border-b border-gray-50 dark:border-dark-border pb-4 mb-2">
                            <h3 className="text-lg font-bold font-arabicHead text-red-500">ماذا عليك؟</h3>
                            <p className="text-xs text-gray-500 font-arabic">الديون التي يجب سدادها حالاً</p>
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-400 block mb-2 mr-1">ديون مستحقة للغير</label>
                            <div className="relative">
                                <input 
                                    type="text" inputMode="decimal" value={values.debts} onChange={(e) => handleInputChange('debts', e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-dark-bg border-2 border-transparent focus:border-red-500 rounded-2xl p-4 pl-12 font-mono text-lg outline-none transition-all dark:text-white" placeholder="0.00"
                                />
                                <Trash2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl flex gap-3 border border-amber-100 dark:border-amber-900/30">
                            <Info className="text-amber-500 shrink-0" size={18} />
                            <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed font-bold">
                                نصيحة: اخصم فقط الديون التي ستسددها خلال هذا العام وليس كامل قيمة القروض طويلة الأمد.
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 3: Result */}
                {step === 3 && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="bg-gray-50 dark:bg-dark-panel rounded-3xl p-6 border-2 border-dashed border-gray-200 dark:border-dark-border relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 text-gray-900 dark:text-white">
                                <ReceiptText size={120} />
                            </div>
                            
                            <div className="text-center relative z-10">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">الزكاة المستحقة</span>
                                <div className="flex flex-wrap items-baseline justify-center gap-2 overflow-hidden px-2">
                                    <span className="text-3xl sm:text-4xl md:text-5xl font-bold font-mono text-primary-600 break-all leading-tight">
                                        {calculations.zakatDue.toLocaleString()}
                                    </span>
                                    <span className="text-lg font-bold text-primary-500">ج.م</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-border space-y-3">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-gray-400">صافي ثروتك:</span>
                                    <span className="dark:text-white font-mono">{calculations.netWealth.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-gray-400">حد النصاب:</span>
                                    <span className="dark:text-white font-mono">{calculations.nisabThreshold.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Status Message */}
                        <div className={`p-4 rounded-2xl text-center border ${calculations.reachedNisab ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300' : 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300'}`}>
                            <p className="text-sm font-bold font-arabic">
                                {calculations.reachedNisab ? 'أموالك بلغت النصاب الشرعي، تجب عليها الزكاة' : 'أموالك لم تبلغ النصاب بعد، لا تجب الزكاة شرعاً'}
                            </p>
                        </div>

                        {/* Sadaqah Field */}
                        <div className="pt-2">
                            <label className="text-xs font-bold text-rose-500 block mb-2 mr-1 flex items-center gap-1">
                                <Heart size={14} fill="currentColor" />
                                إضافة صدقة تطوعية
                            </label>
                            <input 
                                type="text" inputMode="decimal" value={values.sadaqah} onChange={(e) => handleInputChange('sadaqah', e.target.value)}
                                className="w-full bg-rose-50/30 dark:bg-rose-900/5 border-2 border-rose-100 dark:border-rose-900/20 focus:border-rose-400 rounded-2xl p-4 font-mono text-lg outline-none transition-all dark:text-white" placeholder="0.00"
                            />
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-3 mt-8">
                    {step > 1 && (
                        <button 
                            onClick={() => setStep(s => s - 1)}
                            className="p-4 rounded-2xl bg-gray-100 dark:bg-dark-panel text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 transition-all"
                        >
                            <ChevronRight size={24} />
                        </button>
                    )}
                    
                    {step < 3 ? (
                        <button 
                            onClick={() => setStep(s => s + 1)}
                            className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
                        >
                            <span>متابعة</span>
                            <ChevronLeft size={20} />
                        </button>
                    ) : (
                        <button 
                            onClick={reset}
                            className="flex-1 py-4 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                        >
                            <Trash2 size={18} />
                            <span>تصفير</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Footer Settings Card */}
            <div className="mt-6 bg-white dark:bg-dark-surface rounded-3xl p-6 border border-gray-100 dark:border-dark-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg">
                            <Banknote size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400">سعر جرام الذهب (24)</p>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="text" value={values.goldPrice} onChange={(e) => handleInputChange('goldPrice', e.target.value)}
                                    className="w-20 bg-transparent border-none focus:ring-0 font-mono font-bold text-gray-800 dark:text-white p-0"
                                />
                                <span className="text-xs text-gray-400 font-bold">ج.م</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">النصاب</p>
                        <p className="text-sm font-mono font-bold text-emerald-600">{calculations.nisabThreshold.toLocaleString()}</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 text-center px-4">
                <p className="text-xs text-gray-400 leading-relaxed font-arabic">
                    تنبيه: هذه الحاسبة هي أداة تقريبية للمساعدة. للحالات المعقدة (عقارات، زكاة زروع، عروض تجارة معقدة)، يُنصح باستشارة أهل العلم.
                </p>
            </div>
        </div>
    );
};

export default ZakatCalculator;