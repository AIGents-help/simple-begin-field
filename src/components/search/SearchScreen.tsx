import React, { useState, useEffect } from 'react';
import { Search, Loader2, ArrowRight } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { sectionService } from '../../services/sectionService';
import { RecordCard } from '../sections/SectionScreenTemplate';

export const SearchScreen = () => {
  const { currentPacket, setView, setTab } = useAppContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async () => {
    if (!currentPacket) return;
    setLoading(true);
    try {
      const { data } = await sectionService.searchRecords(currentPacket.id, query);
      setResults(data || []);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 pb-32">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-navy-muted">Search Packet</h1>
      </div>
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents, accounts, family..."
          className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-stone-200 focus:border-navy-muted outline-none shadow-sm"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="animate-spin text-stone-400" size={18} />
          </div>
        )}
      </div>

      <div className="space-y-4">
        {results.length > 0 ? (
          results.map((record) => (
            <div key={record.id} className="relative">
              <RecordCard
                title={record.title}
                description={record.description}
                data={record.data}
              />
              <button 
                onClick={() => { setView('sections'); setTab(record.section_key); }}
                className="absolute top-4 right-4 p-2 bg-stone-50 rounded-lg text-navy-muted hover:bg-stone-100 transition-colors"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          ))
        ) : query.trim().length >= 2 && !loading ? (
          <div className="text-center py-20 text-stone-400">
            <p className="text-sm">No results found for "{query}"</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-stone-300">
            <Search size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">Start typing to search your packet</p>
          </div>
        )}
      </div>
    </div>
  );
};
