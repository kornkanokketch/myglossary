/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Globe, 
  StickyNote, 
  Download, 
  X, 
  Languages, 
  BookOpen, 
  ChevronRight,
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { interpretTerm, quickTranslate } from './services/geminiService';

// --- Types ---

interface Translations {
  th: string;
  ja: string;
  de: string;
}

interface GlossaryEntry {
  id: string;
  term: string;
  category: string;
  definition: string;
  notes: string;
  translations: Translations;
  createdAt: number;
}

const CATEGORIES = ["General", "Technical", "Medical", "Business", "Legal", "Other"];
const LANGUAGES = [
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
];

export default function App() {
  // --- State ---
  const [entries, setEntries] = useState<GlossaryEntry[]>(() => {
    const saved = localStorage.getItem('myglossary_entries');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTranslatorOpen, setIsTranslatorOpen] = useState(false);
  const [isInterpreting, setIsInterpreting] = useState<string | null>(null);
  const [interpretation, setInterpretation] = useState<{id: string, text: string} | null>(null);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('myglossary_entries', JSON.stringify(entries));
  }, [entries]);

  // --- Handlers ---
  const addEntry = (entry: Omit<GlossaryEntry, 'id' | 'createdAt'>) => {
    const newEntry: GlossaryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setEntries([newEntry, ...entries]);
    setIsModalOpen(false);
  };

  const deleteEntry = (id: string) => {
    if (confirm('Are you sure you want to delete this term?')) {
      setEntries(entries.filter(e => e.id !== id));
      if (interpretation?.id === id) setInterpretation(null);
    }
  };

  const exportCSV = () => {
    const csvData = entries.map(({ term, category, definition, notes, translations }) => ({
      Term: term,
      Category: category,
      Definition: definition,
      Notes: notes,
      Thai: translations.th,
      Japanese: translations.ja,
      German: translations.de,
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `glossary_export_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInterpret = async (entry: GlossaryEntry) => {
    setIsInterpreting(entry.id);
    const result = await interpretTerm(entry.term, entry.definition);
    setInterpretation({ id: entry.id, text: result });
    setIsInterpreting(null);
  };

  // --- Filtered Data ---
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = entry.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.definition.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || entry.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [entries, searchQuery, selectedCategory]);

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden">
      {/* Sidebar (Left) */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col p-6 shrink-0 z-50">
        <div className="flex items-center gap-3 mb-10 text-indigo-600">
          <BookOpen className="w-6 h-6 stroke-[2.5]" />
          <span className="font-bold text-xl tracking-tight text-slate-900">Myglossary</span>
        </div>

        <div className="space-y-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Categories</h3>
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`w-full text-left px-3 py-2 text-sm font-medium transition-all rounded-lg ${
                  selectedCategory === 'All' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                All Terms
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2 text-sm font-medium transition-all rounded-lg ${
                    selectedCategory === cat ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </nav>
          </section>

          <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Management</h3>
            <nav className="flex flex-col gap-1">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full text-left px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-lg transition-all"
              >
                + Add New Term
              </button>
              <button 
                onClick={exportCSV}
                className="w-full text-left px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-lg transition-all"
              >
                Export CSV
              </button>
              <button 
                onClick={() => setIsTranslatorOpen(!isTranslatorOpen)}
                className="w-full text-left px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-lg transition-all"
              >
                Quick Translator
              </button>
            </nav>
          </section>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 p-2 bg-indigo-50 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">MG</div>
            <div>
              <p className="text-xs font-semibold text-slate-900">Glossary User</p>
              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-tight">Active Session</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center px-8 gap-6 shrink-0">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-[18px] h-[18px]" />
            <input
              type="text"
              placeholder="Search across all translations..."
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={exportCSV}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 transition-all"
            >
              Export
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Term
            </button>
          </div>
        </header>

        {/* Dynamic Content Grid */}
        <div className="flex-1 p-8 flex gap-8 overflow-hidden">
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex justify-between items-end mb-2 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">Glossary Terms</h2>
              <span className="text-xs text-slate-400 font-medium tracking-tight">
                Showing {filteredEntries.length} results
              </span>
            </div>

            {filteredEntries.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center flex flex-col items-center shadow-sm">
                <Search className="w-10 h-10 text-slate-200 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">No terms found</h3>
                <p className="text-sm text-slate-500">Try adjusting your filters or search query.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                <AnimatePresence mode="popLayout">
                  {filteredEntries.map((entry) => (
                    <motion.div
                      layout
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="p-5 bg-white border border-slate-200 rounded-2xl flex items-start shadow-sm group hover:border-indigo-200 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
                            {entry.category}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900">{entry.term}</h4>
                        <p className="text-sm text-slate-500 mt-1 max-w-3xl">{entry.definition}</p>
                        
                        <div className="flex flex-wrap gap-2 mt-4">
                          {LANGUAGES.filter(l => l.code !== 'en').map(lang => (
                            <span key={lang.code} className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[11px] font-mono text-slate-600 flex items-center gap-1.5">
                              <span className="font-bold opacity-30">{lang.code.toUpperCase()}:</span>
                              {entry.translations[lang.code as keyof Translations] || '—'}
                            </span>
                          ))}
                        </div>

                        {entry.notes && (
                          <div className="mt-3 flex items-start gap-2 text-slate-400">
                            <StickyNote className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <p className="text-[11px] italic tracking-tight">{entry.notes}</p>
                          </div>
                        )}

                        <AnimatePresence>
                          {interpretation?.id === entry.id && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 pt-4 border-t border-slate-100"
                            >
                              <div className="flex items-center gap-2 mb-2 text-indigo-600">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">AI Interpretation</span>
                              </div>
                              <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                {interpretation.text}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="flex flex-col items-end gap-3 ml-4">
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleInterpret(entry)}
                            disabled={isInterpreting === entry.id}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-30"
                            title="AI Interpret"
                          >
                            {isInterpreting === entry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => deleteEntry(entry.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-300 font-medium">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          <aside className="w-80 flex flex-col gap-6 shrink-0 overflow-hidden">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col overflow-hidden">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-slate-900 uppercase tracking-widest">
                <Languages className="w-4 h-4 text-indigo-600" />
                Quick Lookout
              </h3>
              
              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 custom-scrollbar">
                <TranslatorContent />
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-indigo-400 mb-3">AI Insights</h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed italic">
                   "Use the interpret feature to visualize how terms are perceived across different cultural boundaries."
                </p>
                <div className="h-px bg-slate-800 w-full mb-4" />
                <button className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2 group-hover:text-indigo-300 transition-colors">
                  Learn more about AI context 
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
            </div>
          </aside>
        </div>
      </main>

      {/* Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
            >
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                addEntry({
                  term: formData.get('term') as string,
                  category: formData.get('category') as string,
                  definition: formData.get('definition') as string,
                  notes: formData.get('notes') as string,
                  translations: {
                    th: formData.get('th') as string,
                    ja: formData.get('ja') as string,
                    de: formData.get('de') as string,
                  }
                });
              }}>
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h2 className="text-lg font-bold text-slate-900 uppercase tracking-widest">New Glossary Entry</h2>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Term</label>
                      <input name="term" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm" placeholder="Ex: Ikigai" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Category</label>
                      <select name="category" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm appearance-none cursor-pointer">
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Definition</label>
                    <textarea name="definition" required rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm resize-none" placeholder="Explain the meaning..." />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Translations</label>
                    <div className="space-y-2">
                       <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300">TH</span>
                        <input name="th" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm" placeholder="Thai translation" />
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300">JP</span>
                        <input name="ja" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm" placeholder="Japanese translation" />
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300">DE</span>
                        <input name="de" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm" placeholder="German translation" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Personal Notes</label>
                    <input name="notes" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm" placeholder="Internal reminders..." />
                  </div>
                </div>

                <div className="p-8 bg-slate-50/50 flex gap-3 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 hover:text-slate-800 transition-all uppercase tracking-widest text-[11px]">
                    Discard
                  </button>
                  <button type="submit" className="flex-[2] bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 uppercase tracking-widest text-[11px]">
                    Create Term
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}


// --- Sub-components ---

function TranslatorContent() {
  const [text, setText] = useState('');
  const [targetLang, setTargetLang] = useState('th');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const langName = LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;
    const translated = await quickTranslate(text, langName);
    setResult(translated);
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Input Text (English)</label>
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none min-h-[120px]"
            placeholder="Type anything to translate..."
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Target Language</label>
            <div className="flex gap-2">
              {LANGUAGES.filter(l => l.code !== 'en').map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setTargetLang(lang.code)}
                  className={`flex-1 py-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                    targetLang === lang.code 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' 
                      : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="text-[10px] font-bold uppercase">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={handleTranslate}
          disabled={loading || !text.trim()}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Translate Now</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 relative group"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{LANGUAGES.find(l => l.code === targetLang)?.flag}</span>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Translation Result</span>
            </div>
            <p className="text-lg font-bold text-indigo-900 leading-relaxed">{result}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-8">
        <p className="text-xs text-gray-400 text-center italic">
          AI translations are near-instant and support technical jargon.
        </p>
      </div>
    </div>
  );
}

