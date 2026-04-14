import React, { useState, useEffect } from 'react';
import { Search, Star, MapPin, Phone, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/context/AppContext';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const CATEGORIES = [
  'Estate Planning Attorney',
  'Financial Advisor / Wealth Manager',
  'CPA / Tax Professional',
  'Insurance Agent',
  'Funeral Home / Pre-Planner',
];

// Map display categories to edge function categories
const CATEGORY_MAP: Record<string, string> = {
  'Estate Planning Attorney': 'Estate Attorney',
  'Financial Advisor / Wealth Manager': 'Financial Advisor',
  'CPA / Tax Professional': 'CPA/Tax Professional',
  'Insurance Agent': 'Insurance Agent',
  'Funeral Home / Pre-Planner': 'Funeral Home',
};

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

export const ProfessionalFinder = () => {
  const { currentPacket, activeScope } = useAppContext();
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [geoLoading, setGeoLoading] = useState(true);
  const [results, setResults] = useState<ProfessionalResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  // Get browser geolocation on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${pos.coords.latitude},${pos.coords.longitude}&result_type=postal_code&key=AIzaSyPlaceholder`
            );
            // Fallback: just use coordinates as location text
            setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
          } catch {
            // silent
          } finally {
            setGeoLoading(false);
          }
        },
        () => setGeoLoading(false),
        { timeout: 5000 }
      );
    } else {
      setGeoLoading(false);
    }
  }, []);

  const handleSearch = async () => {
    if (!category) {
      toast.error('Please select a profession type');
      return;
    }
    if (!location.trim()) {
      toast.error('Please enter a location (ZIP code or city)');
      return;
    }

    setLoading(true);
    setSearched(true);
    setError('');
    setResults([]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('find-professionals', {
        body: { zip: location.trim(), category: CATEGORY_MAP[category] || category },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setResults(data?.results || []);
    } catch (err: any) {
      setError(err.message || 'Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (result: ProfessionalResult) => {
    if (!currentPacket) {
      toast.error('No packet found');
      return;
    }
    setSavingId(result.place_id);
    try {
      const { error } = await supabase.from('advisor_records').insert({
        packet_id: currentPacket.id,
        advisor_type: category,
        name: result.name,
        firm: result.name,
        address: result.address,
        phone: null,
        scope: activeScope === 'personB' ? 'personB' : 'personA',
        status: 'active',
      });
      if (error) throw error;
      setSavedIds(prev => new Set(prev).add(result.place_id));
      toast.success('Saved to your Advisors', { duration: 3000, position: 'bottom-center' });
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.message || 'Failed to save advisor', { duration: 5000, position: 'bottom-center' });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3 shadow-sm">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Profession Type</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full p-3 bg-white rounded-xl border border-stone-200 focus:border-stone-400 outline-none text-sm text-stone-800"
          >
            <option value="">Select a profession...</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Location (ZIP or City)</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder={geoLoading ? 'Detecting location...' : 'e.g. 90210 or Chicago, IL'}
            className="w-full p-3 bg-white rounded-xl border border-stone-200 focus:border-stone-400 outline-none text-sm"
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>
          ) : (
            <><Search className="w-4 h-4" /> Find Professionals</>
          )}
        </button>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-9 w-32" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && searched && !error && results.length === 0 && (
        <div className="text-center py-12 px-4">
          <Search className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className="text-sm text-stone-500 font-medium">No results found</p>
          <p className="text-xs text-stone-400 mt-1">Try a different location or profession type</p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{results.length} Results</p>
          {results.map(result => {
            const isSaved = savedIds.has(result.place_id);
            const isSaving = savingId === result.place_id;
            return (
              <div key={result.place_id} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                <div className="space-y-2">
                  <h3 className="font-bold text-stone-900 text-sm">{result.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-stone-500">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="line-clamp-1">{result.address}</span>
                  </div>
                  {result.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-medium text-stone-700">{result.rating}</span>
                      <span className="text-xs text-stone-400">({result.total_ratings})</span>
                    </div>
                  )}
                  <div className="pt-1">
                    <button
                      onClick={() => handleSave(result)}
                      disabled={isSaved || isSaving}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                        isSaved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                          : 'bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50'
                      }`}
                    >
                      {isSaving ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
                      ) : isSaved ? (
                        <><CheckCircle className="w-3 h-3" /> Saved to Advisors</>
                      ) : (
                        'Save to My Advisors'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
