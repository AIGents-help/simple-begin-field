import React, { useState, useEffect, useRef } from 'react';
import { Briefcase, Search, Star, MapPin, Phone, Loader2, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAppContext } from '@/context/AppContext';

const CATEGORIES = [
  'Estate Attorney',
  'Financial Advisor',
  'CPA/Tax Professional',
  'Insurance Agent',
  'Real Estate Agent',
  'Notary Public',
  'Funeral Home',
  'Elder Care Attorney',
];

interface ProfessionalResult {
  place_id: string;
  name: string;
  address: string;
  rating: number | null;
  total_ratings: number;
  lat: number;
  lng: number;
  open_now: boolean | null;
  types: string[];
}

export const FindProfessionalScreen = () => {
  const { directoryQuery, setDirectoryQuery } = useAppContext() as any;
  const [zip, setZip] = useState('');
  const [category, setCategory] = useState('');
  const [results, setResults] = useState<ProfessionalResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const autoSearchedRef = useRef(false);

  const runSearch = async (zipValue: string, categoryValue: string) => {
    if (!zipValue.trim() || !categoryValue) {
      toast.error('Please enter a ZIP code and select a category');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke('find-professionals', {
        body: { zip: zipValue.trim(), category: categoryValue },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResults(data?.results || []);
    } catch (err: any) {
      toast.error(err.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => runSearch(zip, category);

  // Consume one-shot directoryQuery from context. Auto-searches when a ZIP
  // is already entered; otherwise just pre-fills the category.
  useEffect(() => {
    if (!directoryQuery || autoSearchedRef.current) return;
    autoSearchedRef.current = true;
    setCategory(directoryQuery);
    setDirectoryQuery?.(null);
    if (zip.trim()) {
      void runSearch(zip, directoryQuery);
    } else {
      toast.info('Enter your ZIP code to find ' + directoryQuery + ' near you');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directoryQuery]);

  // Compose dropdown options: surface the supplied query if not in the
  // built-in CATEGORIES list so the select still shows the active term.
  const dropdownCategories = React.useMemo(() => {
    if (category && !CATEGORIES.includes(category)) {
      return [category, ...CATEGORIES];
    }
    return CATEGORIES;
  }, [category]);

  return (
    <div className="p-4 md:p-6 max-w-[800px] mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-stone-900 rounded-2xl flex items-center justify-center">
            <Briefcase size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-stone-900">Find a Professional</h1>
            <p className="text-xs text-stone-500">Search for estate planning professionals near you</p>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-stone-500">ZIP Code</label>
            <input
              type="text"
              value={zip}
              onChange={e => setZip(e.target.value)}
              placeholder="e.g. 90210"
              maxLength={10}
              className="w-full p-3 bg-white rounded-xl border border-stone-200 focus:border-stone-400 outline-none text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full p-3 bg-white rounded-xl border border-stone-200 focus:border-stone-400 outline-none text-sm"
            >
              <option value="">Select a category...</option>
              {dropdownCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors disabled:opacity-50"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</> : <><Search className="w-4 h-4" /> Search Professionals</>}
        </button>
      </div>

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-12 text-stone-400 text-sm">
          No professionals found for that search. Try a different ZIP code or category.
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-stone-400 font-medium uppercase tracking-widest">{results.length} Results</p>
          {results.map(result => (
            <div key={result.place_id} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <h3 className="font-bold text-stone-900 text-sm truncate">{result.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-stone-500">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{result.address}</span>
                  </div>
                  {result.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-medium text-stone-700">{result.rating}</span>
                      <span className="text-xs text-stone-400">({result.total_ratings} reviews)</span>
                    </div>
                  )}
                  {result.open_now !== null && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${result.open_now ? 'text-emerald-600' : 'text-stone-400'}`}>
                      {result.open_now ? 'Open Now' : 'Closed'}
                    </span>
                  )}
                </div>
                <a
                  href={`https://www.google.com/maps/place/?q=place_id:${result.place_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-medium text-stone-700 transition-colors flex-shrink-0"
                >
                  Details <ChevronRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Future badge callout */}
      <div className="bg-stone-50 rounded-2xl border border-stone-100 p-4 text-center space-y-1">
        <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Coming Soon</p>
        <p className="text-sm text-stone-600">Verified Professional badge for estate planning providers</p>
      </div>
    </div>
  );
};