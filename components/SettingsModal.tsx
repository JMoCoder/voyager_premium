
import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { getSettings, saveSettings, exportToCSV, importFromCSV, saveTrips } from '../services/storageService';
import { translations, Language } from '../translations';
import { Download, Upload, Cloud, AlertCircle, CheckCircle, Globe, Moon, Sun, Laptop, User } from 'lucide-react';

interface SettingsModalProps {
  // onClose is unused in UI now, but kept for prop compatibility if needed, or we can ignore it
  onClose?: () => void;
  onDataChange: () => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  onUsernameChange: (name: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onDataChange, lang, onLanguageChange, onThemeChange, onUsernameChange }) => {
  const t = translations[lang];
  const [settings, setSettings] = useState<AppSettings>({});
  const [activeTab, setActiveTab] = useState<'general' | 'csv' | 'webdav'>('general');
  const [importText, setImportText] = useState('');
  const [statusMsg, setStatusMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const handleSaveSettings = () => {
    saveSettings(settings);
    if (settings.language && settings.language !== lang) {
      onLanguageChange(settings.language);
    }
    if (settings.username) {
        onUsernameChange(settings.username);
    }
    setStatusMsg({ type: 'success', text: t.settingsSaved });
  };

  const handleLanguageSelect = (selectedLang: Language) => {
    const newSettings = { ...settings, language: selectedLang };
    setSettings(newSettings);
    saveSettings(newSettings);
    onLanguageChange(selectedLang);
  };

  const handleThemeSelect = (selectedTheme: 'light' | 'dark' | 'system') => {
    const newSettings = { ...settings, theme: selectedTheme };
    setSettings(newSettings);
    saveSettings(newSettings);
    onThemeChange(selectedTheme);
  };
  
  const handleUsernameBlur = () => {
      saveSettings(settings);
      if (settings.username) onUsernameChange(settings.username);
  };

  const handleExportCSV = () => {
    const csv = exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voyager_backup_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    setStatusMsg({ type: 'success', text: t.csvExported });
  };

  const handleImportCSV = () => {
    try {
      if (!importText) throw new Error(t.errorPaste);
      const trips = importFromCSV(importText);
      if (trips.length === 0) throw new Error(t.errorNoData);
      
      if (confirm(t.overwriteConfirm.replace('{count}', trips.length.toString()))) {
        saveTrips(trips);
        onDataChange();
        setStatusMsg({ type: 'success', text: t.dataImported });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message });
    }
  };

  const handleWebDavSync = async () => {
    if (!settings.webdavUrl || !settings.webdavUser) {
        setStatusMsg({ type: 'error', text: t.errorCreds });
        return;
    }
    setStatusMsg({ type: 'success', text: t.syncSimulated });
  };

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-slate-900">
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
               <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.settingsTitle}</h2>
               {/* Close button removed to avoid duplication with header toggle */}
            </div>

            <div className="flex border-b border-slate-100 dark:border-slate-800 px-6">
            <button 
                onClick={() => setActiveTab('general')}
                className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'general' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                {t.tabGeneral}
            </button>
            <button 
                onClick={() => setActiveTab('csv')}
                className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'csv' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                {t.tabData}
            </button>
            <button 
                onClick={() => setActiveTab('webdav')}
                className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'webdav' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                {t.tabWebDav}
            </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
            {statusMsg && (
                <div className={`mb-4 p-4 rounded-xl flex items-center ${statusMsg.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'}`}>
                {statusMsg.type === 'success' ? <CheckCircle size={18} className="mr-2"/> : <AlertCircle size={18} className="mr-2"/>}
                {statusMsg.text}
                </div>
            )}

            {activeTab === 'general' && (
                <div className="space-y-6">
                
                {/* Username Input */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h3 className="text-slate-900 dark:text-white font-semibold mb-4 flex items-center">
                        <User size={18} className="mr-2" /> Username
                    </h3>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={settings.username || ''}
                            onChange={(e) => setSettings({...settings, username: e.target.value})}
                            onBlur={handleUsernameBlur}
                            placeholder="Momo"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <p className="text-xs text-slate-400 mt-2">Display name for your passport card.</p>
                    </div>
                </div>

                {/* Theme Selection */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h3 className="text-slate-900 dark:text-white font-semibold mb-4 flex items-center"><Sun size={18} className="mr-2" /> {t.theme}</h3>
                    <div className="grid grid-cols-3 gap-3">
                    {[
                        { val: 'light', label: t.themeLight, icon: Sun },
                        { val: 'dark', label: t.themeDark, icon: Moon },
                        { val: 'system', label: t.themeSystem, icon: Laptop }
                    ].map((item) => {
                        const isSelected = (settings.theme || 'system') === item.val;
                        const Icon = item.icon;
                        return (
                            <button 
                            key={item.val}
                            onClick={() => handleThemeSelect(item.val as any)}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                                isSelected 
                                ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-600/20 dark:border-blue-500 dark:text-white' 
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'
                            }`}
                            >
                            <Icon size={20} className="mb-2" />
                            <span className="text-xs font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                    </div>
                </div>

                {/* Language Selection */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h3 className="text-slate-900 dark:text-white font-semibold mb-4 flex items-center"><Globe size={18} className="mr-2" /> {t.language}</h3>
                    <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => handleLanguageSelect('en')}
                        className={`p-4 rounded-xl border text-center transition-all ${lang === 'en' ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-600/20 dark:border-blue-500 dark:text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                    >
                        English
                    </button>
                    <button 
                        onClick={() => handleLanguageSelect('zh')}
                        className={`p-4 rounded-xl border text-center transition-all ${lang === 'zh' ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-600/20 dark:border-blue-500 dark:text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                    >
                        中文
                    </button>
                    </div>
                </div>
                </div>
            )}

            {activeTab === 'csv' && (
                <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h3 className="text-slate-900 dark:text-white font-semibold mb-2 flex items-center"><Download size={18} className="mr-2" /> {t.exportTitle}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{t.exportDesc}</p>
                    <button onClick={handleExportCSV} className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-4 py-2 rounded-lg text-sm transition-colors">{t.downloadCsv}</button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h3 className="text-slate-900 dark:text-white font-semibold mb-2 flex items-center"><Upload size={18} className="mr-2" /> {t.importTitle}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{t.importDesc}</p>
                    <textarea 
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-900 dark:text-slate-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        rows={5}
                        placeholder="id,mode,origin_name..."
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                    />
                    <button onClick={handleImportCSV} className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm transition-colors">{t.importBtn}</button>
                </div>
                </div>
            )}

            {activeTab === 'webdav' && (
                <div className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">{t.webDavDesc}</p>
                
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.serverUrl}</label>
                    <input 
                    type="text" 
                    value={settings.webdavUrl || ''} 
                    onChange={(e) => setSettings({...settings, webdavUrl: e.target.value})}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                    placeholder="https://cloud.example.com/remote.php/dav/files/user/"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.username}</label>
                        <input 
                        type="text" 
                        value={settings.webdavUser || ''} 
                        onChange={(e) => setSettings({...settings, webdavUser: e.target.value})}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.password}</label>
                        <input 
                        type="password" 
                        value={settings.webdavPassword || ''} 
                        onChange={(e) => setSettings({...settings, webdavPassword: e.target.value})}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white"
                        />
                    </div>
                </div>
                <div className="flex space-x-3 mt-4">
                    <button onClick={handleSaveSettings} className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-4 py-2 rounded-lg text-sm">{t.saveCreds}</button>
                    <button onClick={handleWebDavSync} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm flex items-center"><Cloud size={16} className="mr-2" /> {t.syncNow}</button>
                </div>
                </div>
            )}
            </div>
        </div>
    </div>
  );
};

export default SettingsModal;