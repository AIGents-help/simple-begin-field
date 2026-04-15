const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CATEGORY_QUERIES: Record<string, string> = {
  'Estate Attorney': 'estate planning attorney',
  'Financial Advisor': 'financial advisor',
  'CPA/Tax Professional': 'CPA tax professional',
  'Insurance Agent': 'insurance agent',
  'Real Estate Agent': 'real estate agent',
  'Notary Public': 'notary public',
  'Funeral Home': 'funeral home',
  'Elder Care Attorney': 'elder care attorney',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { zip, category } = await req.json();

    if (!zip || !category) {
      return new Response(JSON.stringify({ error: 'zip and category are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Google Places API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const searchQuery = CATEGORY_QUERIES[category] || category;

    // Step 1: Geocode the ZIP code
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(zip + ', USA')}&key=${apiKey}`;
    console.log('Geocoding URL:', geocodeUrl.replace(apiKey, 'REDACTED'));
    const geoRes = await fetch(geocodeUrl);
    const geoData = await geoRes.json();
    console.log('Geocode status:', geoData.status, 'results count:', geoData.results?.length, 'error:', geoData.error_message);

    if (geoData.status !== 'OK' || !geoData.results?.length) {
      return new Response(JSON.stringify({ 
        error: `Could not find location for that ZIP code (status: ${geoData.status}, msg: ${geoData.error_message || 'none'})`, 
        results: [] 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { lat, lng } = geoData.results[0].geometry.location;
    console.log('Geocoded to:', lat, lng);

    // Step 2: Text Search for professionals nearby
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&location=${lat},${lng}&radius=40000&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    const results = (searchData.results || []).slice(0, 15).map((place: any) => ({
      place_id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating || null,
      total_ratings: place.user_ratings_total || 0,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
      open_now: place.opening_hours?.open_now ?? null,
      types: place.types || [],
    }));

    return new Response(JSON.stringify({ results, center: { lat, lng } }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});