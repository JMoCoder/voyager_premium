
import React, { useRef, useState, useMemo } from 'react';
import { Trip, LocationData, TransportMode } from '../types';
import { MODE_CONFIG } from '../constants';
import { translations, Language } from '../translations';
import * as htmlToImage from 'html-to-image';
import { Share2, Trash2, Pencil, MoreHorizontal, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import WorldMap from './WorldMap';
import { GoogleGenAI } from "@google/genai";

interface TripCardProps {
  trip: Trip;
  onDelete: (id: string) => void;
  onEdit: (trip: Trip) => void;
  onCardClick?: (trip: Trip) => void;
  onModeClick: (mode: TransportMode) => void;
  onUpdateTrip?: (trip: Trip) => void;
  lang: Language;
  className?: string;
  username?: string;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onDelete, onEdit, onCardClick, onModeClick, onUpdateTrip, lang, className, username = 'MOMO' }) => {
  const t = translations[lang];
  const cardRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const Config = MODE_CONFIG[trip.mode];
  const Icon = Config.icon;

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/-/g, '/');
  };

  const getLocDisplay = (location: LocationData) => {
    const nameEn = location.name;
    const nameZh = location.name_zh || nameEn;
    const code = location.code || nameEn.substring(0, 3).toUpperCase();
    return {
        code: code,
        name: lang === 'zh' ? nameZh : nameEn,
        city: location.city || location.name
    };
  };

  const origin = getLocDisplay(trip.origin);
  const dest = getLocDisplay(trip.destination);
  const startDate = formatDate(trip.startDate);
  
  const mrz = useMemo(() => {
    const cleanName = (username || 'TRAVELER').toUpperCase().replace(/[^A-Z]/g, 'X');
    const surname = cleanName.substring(0, 10).padEnd(10, '<');
    const given = 'VOYAGER'.padEnd(10, '<');
    const country = 'UTO'; 
    let modeChar = 'X';
    switch (trip.mode) {
        case TransportMode.PLANE: modeChar = 'P'; break;
        case TransportMode.TRAIN: modeChar = 'T'; break;
        case TransportMode.CAR: modeChar = 'C'; break;
        case TransportMode.BOAT: modeChar = 'S'; break; 
        case TransportMode.WALK: modeChar = 'W'; break;
        case TransportMode.CYCLE: modeChar = 'B'; break; 
    }
    const line1 = `P<${country}${surname}<<${given}<<<<<<<<<<<<`.substring(0, 44);
    const id = trip.id.replace(/-/g, '').substring(0, 9).toUpperCase();
    const originCode = origin.code.substring(0,3).padEnd(3,'<');
    const destCode = dest.code.substring(0,3).padEnd(3,'<');
    const line2 = `${id}<${originCode}800101M300101${destCode}<${modeChar}<<<<<<<<<<<<<<`.substring(0, 44);
    return { line1, line2 };
  }, [trip, username, origin.code, dest.code]);

  const generateAIImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGenerating || !onUpdateTrip) return;
    setIsGenerating(true);
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        alert(lang === 'zh' ? '请先配置 Gemini API Key 才能使用 AI 功能。' : 'Please configure Gemini API Key to use AI features.');
        setIsGenerating(false);
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `A highly aesthetic, minimalist, cinematic digital art illustration of ${dest.city}, focusing on its unique landmark or vibe, moody lighting, soft pastel colors, suitable for a premium travel application cover. No text.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64 = part.inlineData.data;
          const imageUrl = `data:image/png;base64,${base64}`;
          onUpdateTrip({ ...trip, aiImage: imageUrl });
          break;
        }
      }
    } catch (err) {
      console.error("AI Generation failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!cardRef.current) return;
    setShowMenu(false);
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, { pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `voyager-${trip.startDate}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export', err);
    }
  };

  return (
    <div className={`relative mb-6 select-none ${className}`}>
        <div 
            ref={cardRef}
            className="w-full bg-[#fdfbf7] dark:bg-[#1a1f2e] rounded-2xl shadow-2xl border border-slate-200/60 dark:border-white/5 overflow-hidden relative group transition-all duration-500 hover:-translate-y-1 active:scale-[0.98]"
            onClick={() => onCardClick ? onCardClick(trip) : onEdit(trip)}
        >
            {/* Background Image: AI or Map */}
            <div className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-700">
                {trip.aiImage ? (
                  <img src={trip.aiImage} alt="Travel Scenery" className="w-full h-full object-cover opacity-[0.15] dark:opacity-[0.25] mix-blend-multiply dark:mix-blend-overlay" />
                ) : (
                  <div className="w-full h-full opacity-[0.12] grayscale sepia-[0.3]">
                    <WorldMap trips={[trip]} highlightTrip={trip} viewMode="routes" interactionEnabled={false} hideBackground={true} className="w-full h-full" />
                  </div>
                )}
            </div>

            {/* Premium Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.08] pointer-events-none z-10" 
                 style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/natural-paper.png')` }}></div>
            
            {/* Top Branding Bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-dashed border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md relative z-20">
                 <div className="flex items-center space-x-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                     <span className="text-[9px] font-black tracking-[0.25em] text-slate-400 dark:text-slate-500 uppercase">Universal Travel Document</span>
                 </div>
                 
                 <div className="flex items-center space-x-3 relative">
                     <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{username}</span>
                     <div className="relative flex items-center gap-1">
                        <button 
                            onClick={generateAIImage}
                            disabled={isGenerating}
                            className="text-slate-300 hover:text-blue-500 dark:text-slate-600 dark:hover:text-blue-400 p-1 transition-all"
                        >
                            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                            className="text-slate-300 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-300 p-1"
                        >
                            <MoreHorizontal size={16} />
                        </button>
                        
                        {showMenu && (
                            <div className="absolute right-full top-0 mr-2 flex items-center bg-white dark:bg-slate-800 rounded-full shadow-2xl border border-slate-200 dark:border-slate-700 animate-slide-up h-8 px-1">
                                <button onClick={(e) => { e.stopPropagation(); onEdit(trip); setShowMenu(false); }} className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors">
                                    <Pencil size={12} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleExport(); }} className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors">
                                    <Share2 size={12} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onDelete(trip.id); setShowMenu(false); }} className="p-2 text-red-500 hover:text-red-600 transition-colors">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        )}
                     </div>
                 </div>
            </div>

            {/* Main Pass Data */}
            <div className="p-6 relative z-20">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex-1">
                        <div className="text-[8px] text-slate-400 font-black uppercase mb-1 tracking-[0.2em]">{t.origin}</div>
                        <div className="text-4xl font-black text-slate-800 dark:text-slate-50 tracking-tighter leading-none">{origin.code}</div>
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2 truncate max-w-[120px]">{origin.city}</div>
                    </div>

                    <div className="flex flex-col items-center justify-center px-4 opacity-40 group-hover:opacity-80 transition-opacity">
                         <Icon size={20} className="text-blue-500 mb-2" />
                         <div className="w-16 h-[1.5px] bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent relative">
                            <div className="absolute inset-0 bg-blue-500/50 animate-pulse"></div>
                         </div>
                         <div className="text-[8px] font-mono font-bold text-slate-400 mt-2">{trip.distanceKm}KM</div>
                    </div>

                    <div className="flex-1 text-right">
                        <div className="text-[8px] text-slate-400 font-black uppercase mb-1 tracking-[0.2em]">{t.dest}</div>
                        <div className="text-4xl font-black text-slate-800 dark:text-slate-50 tracking-tighter leading-none">{dest.code}</div>
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2 truncate max-w-[120px] ml-auto">{dest.city}</div>
                    </div>
                </div>

                <div className="flex items-end justify-between border-t border-slate-100 dark:border-white/5 pt-4">
                    <div className="flex space-x-8">
                        <div>
                            <div className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">{t.date}</div>
                            <div className="text-xs font-mono font-black text-slate-700 dark:text-slate-300">{startDate}</div>
                        </div>
                        <div>
                            <div className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">{t.transportMode}</div>
                             <div className={`text-xs font-black uppercase tracking-tight ${Config.color}`}>
                                {t[trip.mode]}
                             </div>
                        </div>
                    </div>

                    <div className="relative group/stamp">
                         <div className={`
                             border-2 border-dashed rounded-lg px-2 py-0.5 transform -rotate-6
                             ${trip.status === 'PLAN' ? 'border-amber-500/40 text-amber-600/60' : 'border-emerald-500/40 text-emerald-600/60'}
                         `}>
                            <span className="text-[10px] font-black tracking-widest uppercase">{trip.status || 'ARRIVED'}</span>
                         </div>
                    </div>
                </div>
            </div>

            {/* MRZ - Machine Readable Zone */}
            <div className="bg-[#f0f0f0]/50 dark:bg-black/30 px-6 py-4 border-t border-slate-200/50 dark:border-white/5 relative z-20">
                <div className="font-mono text-[9px] sm:text-[10px] leading-relaxed text-slate-400 dark:text-slate-600 tracking-[0.25em] break-all uppercase opacity-80">
                    {mrz.line1}<br/>
                    {mrz.line2}
                </div>
            </div>
        </div>
    </div>
  );
};

export default TripCard;
