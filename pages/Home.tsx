
import React from 'react';
import DailyWisdom from '../components/DailyWisdom';
import RandomNameCard from '../components/RandomNameCard';
import DailySahabi from '../components/DailySahabi';
import SmartAzkarSuggestion from '../components/SmartAzkarSuggestion';
import AlKahfAlert from '../components/AlKahfAlert';

const Home: React.FC = () => {
  return (
    <div className="space-y-8 animate-fadeIn pb-8">
      <AlKahfAlert />
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end px-2 pt-2 gap-4">
        <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white font-arabicHead mb-2">
            السلام عليكم
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 font-arabic">
            طبت وطاب يومك بذكر الله
            </p>
        </div>
        
        {/* Date Badge */}
        <div className="bg-white dark:bg-[#1E1E1E] px-5 py-2.5 rounded-2xl border border-gray-100 dark:border-[#2A2A2A] shadow-sm text-sm font-bold text-gray-600 dark:text-gray-300 hidden md:block">
            {new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* Smart Suggestion */}
              <SmartAzkarSuggestion />

              {/* Daily Wisdom Section */}
              <div className="space-y-4">
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white px-2 font-arabicHead">قطوف اليوم</h3>
                 <DailyWisdom />
              </div>
          </div>

          {/* Side Column (1/3) - Desktop / Bottom - Mobile */}
          <div className="space-y-6">
              {/* Discovery Cards */}
              <div className="grid grid-cols-1 gap-6">
                 <RandomNameCard />
                 <DailySahabi />
              </div>
          </div>
      </div>
    </div>
  );
};

export default Home;
