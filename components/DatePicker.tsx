
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, ChevronDown } from 'lucide-react';
import { Language } from '../translations';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  onClose: () => void;
  lang: Language;
  minDate?: string;
}

type ViewMode = 'day' | 'month' | 'year';

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, onClose, lang, minDate }) => {
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  });
  
  const [mode, setMode] = useState<ViewMode>('day');
  const [isClosing, setIsClosing] = useState(false);
  const yearsListRef = useRef<HTMLDivElement>(null);

  // Localization Data
  const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MONTHS_ZH = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const WEEKDAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const WEEKDAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'];

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  
  // Helpers
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300); // Wait for animation
  };

  const isDateDisabled = (year: number, month: number, day: number) => {
    if (!minDate) return false;
    const compareDate = new Date(year, month, day);
    const [minY, minM, minD] = minDate.split('-').map(Number);
    const min = new Date(minY, minM - 1, minD);
    compareDate.setHours(0,0,0,0);
    min.setHours(0,0,0,0);
    return compareDate < min;
  };

  const handleDaySelect = (day: number) => {
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    onChange(dateStr);
    handleClose();
  };

  // Scroll to selected year when opening year view
  useEffect(() => {
    if (mode === 'year' && yearsListRef.current) {
        const selectedEl = yearsListRef.current.querySelector('[data-selected="true"]');
        if (selectedEl) {
            selectedEl.scrollIntoView({ block: 'center', behavior: 'auto' });
        }
    }
  }, [mode]);

  // RENDERERS
  
  const renderHeader = () => {
    const displayMonth = lang === 'zh' ? MONTHS_ZH[currentMonth] : MONTHS_EN[currentMonth];
    
    return (
      <div className="flex justify-between items-center mb-6">
        {mode === 'day' && (
            <button onClick={() => setViewDate(new Date(currentYear, currentMonth - 1, 1))} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                <ChevronLeft size={24} />
            </button>
        )}
        
        <div className="flex-1 flex justify-center space-x-2">
            <button 
                onClick={() => setMode('month')}
                className={`text-xl font-bold px-3 py-1 rounded-lg transition-colors flex items-center ${mode === 'month' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600' : 'text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
            >
                {displayMonth}
                {mode === 'day' && <ChevronDown size={16} className="ml-1 opacity-50" />}
            </button>
            <button 
                onClick={() => setMode('year')}
                className={`text-xl font-bold px-3 py-1 rounded-lg transition-colors flex items-center ${mode === 'year' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600' : 'text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
            >
                {currentYear}
                {mode === 'day' && <ChevronDown size={16} className="ml-1 opacity-50" />}
            </button>
        </div>

        {mode === 'day' ? (
            <button onClick={() => setViewDate(new Date(currentYear, currentMonth + 1, 1))} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                <ChevronRight size={24} />
            </button>
        ) : (
            <div className="w-10"></div> // Placeholder for balance
        )}
      </div>
    );
  };

  const renderDayView = () => {
    const daysCount = daysInMonth(currentYear, currentMonth);
    const startDay = firstDayOfMonth(currentYear, currentMonth);
    const weekDays = lang === 'zh' ? WEEKDAYS_ZH : WEEKDAYS_EN;
    
    const [vY, vM, vD] = value ? value.split('-').map(Number) : [0,0,0];

    return (
      <div className="animate-fade-in">
        <div className="grid grid-cols-7 mb-4">
            {weekDays.map(d => (
            <div key={d} className="text-center text-xs font-bold text-slate-400 uppercase">
                {d}
            </div>
            ))}
        </div>
        <div className="grid grid-cols-7 gap-y-4 gap-x-1">
            {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysCount }).map((_, i) => {
                const day = i + 1;
                const disabled = isDateDisabled(currentYear, currentMonth, day);
                const isSelected = value && vY === currentYear && (vM - 1) === currentMonth && vD === day;
                const isToday = new Date().toDateString() === new Date(currentYear, currentMonth, day).toDateString();

                return (
                    <button
                        key={day}
                        onClick={() => !disabled && handleDaySelect(day)}
                        disabled={disabled}
                        className={`
                            h-12 w-12 mx-auto rounded-full flex items-center justify-center text-lg font-medium transition-all
                            ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 scale-105' : ''}
                            ${!isSelected && !disabled ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800' : ''}
                            ${disabled ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : ''}
                            ${!isSelected && isToday ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20' : ''}
                        `}
                    >
                        {day}
                    </button>
                );
            })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
      const months = lang === 'zh' ? MONTHS_ZH : MONTHS_EN;
      return (
          <div className="grid grid-cols-3 gap-4 animate-fade-in">
              {months.map((m, idx) => {
                  const isSelected = idx === currentMonth;
                  return (
                      <button
                        key={m}
                        onClick={() => {
                            setViewDate(new Date(currentYear, idx, 1));
                            setMode('day');
                        }}
                        className={`
                            p-4 rounded-2xl text-sm font-bold transition-all
                            ${isSelected 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }
                        `}
                      >
                          {m}
                      </button>
                  );
              })}
          </div>
      );
  };

  const renderYearView = () => {
      const startYear = 1990;
      const endYear = 2030;
      const years = Array.from({length: endYear - startYear + 1}, (_, i) => startYear + i);

      return (
          <div ref={yearsListRef} className="h-[300px] overflow-y-auto grid grid-cols-4 gap-4 animate-fade-in pr-2">
              {years.map(year => {
                  const isSelected = year === currentYear;
                  return (
                      <button
                        key={year}
                        data-selected={isSelected}
                        onClick={() => {
                            setViewDate(new Date(year, currentMonth, 1));
                            setMode('month');
                        }}
                        className={`
                            py-3 rounded-xl text-sm font-bold transition-all
                            ${isSelected 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }
                        `}
                      >
                          {year}
                      </button>
                  );
              })}
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
        {/* Backdrop */}
        <div 
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
            onClick={handleClose}
        ></div>
        
        {/* Bottom Sheet */}
        <div 
            className={`
                relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2rem] p-6 shadow-2xl 
                transform transition-transform duration-300 ease-out
                ${isClosing ? 'translate-y-full' : 'translate-y-0'}
            `}
        >
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
            
            {renderHeader()}
            
            <div className="min-h-[320px]">
                {mode === 'day' && renderDayView()}
                {mode === 'month' && renderMonthView()}
                {mode === 'year' && renderYearView()}
            </div>

            <button 
                onClick={handleClose}
                className="w-full mt-6 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold py-4 rounded-2xl active:scale-[0.98] transition-transform"
            >
                {lang === 'zh' ? '取消' : 'Cancel'}
            </button>
        </div>
    </div>
  );
};

export default DatePicker;