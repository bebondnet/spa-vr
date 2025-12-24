import type {
  SearchRequest,
  SearchResponse,
  LocationParams,
  LocationResponse,
  SearchConfigResponse,
  FacetItem,
} from '../types';

// Environment configuration
const API_MODE = import.meta.env.VITE_API_MODE || 'mock';
const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.bebond.net';
const API_KEY = import.meta.env.VITE_API_KEY || '';
const ORG_KEY = import.meta.env.VITE_ORG_KEY || 'BB_vrconcierge';

/**
 * Search for listings with filters, sorting, and pagination
 */
export async function searchListings(params: Omit<SearchRequest, 'org_key'>): Promise<SearchResponse> {
  if (API_MODE === 'mock') {
    const { mockSearch } = await import('./mock-api');
    return mockSearch({ ...params, org_key: ORG_KEY });
  }

  const response = await fetch(`${API_BASE}/api/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY && { 'X-API-Key': API_KEY }),
    },
    body: JSON.stringify({ ...params, org_key: ORG_KEY }),
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get location options for dependent dropdowns
 */
export async function getLocations(params: Omit<LocationParams, 'org_key'>): Promise<LocationResponse> {
  if (API_MODE === 'mock') {
    const { mockLocations } = await import('./mock-api');
    return mockLocations({ ...params, org_key: ORG_KEY });
  }

  const searchParams = new URLSearchParams({ org_key: ORG_KEY });
  if (params.country) searchParams.set('country', params.country);
  if (params.region) searchParams.set('region', params.region);
  if (params.city) searchParams.set('city', params.city);

  const response = await fetch(`${API_BASE}/api/locations?${searchParams}`, {
    headers: {
      ...(API_KEY && { 'X-API-Key': API_KEY }),
    },
  });

  if (!response.ok) {
    throw new Error(`Locations failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get search configuration (sort options, filter options, location levels)
 */
export async function getSearchConfig(postType: string = 'restaurant'): Promise<SearchConfigResponse> {
  if (API_MODE === 'mock') {
    const { mockSearchConfig } = await import('./mock-api');
    return mockSearchConfig();
  }

  const searchParams = new URLSearchParams({
    org_key: ORG_KEY,
    post_type: postType,
  });

  const response = await fetch(`${API_BASE}/api/search-config?${searchParams}`, {
    headers: {
      ...(API_KEY && { 'X-API-Key': API_KEY }),
    },
  });

  if (!response.ok) {
    throw new Error(`Config failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all available facets with counts
 */
export async function getFacets(): Promise<{
  cuisine: FacetItem[];
  expense_level: FacetItem[];
  meals_served: FacetItem[];
  features: FacetItem[];
}> {
  if (API_MODE === 'mock') {
    const { mockFacets } = await import('./mock-api');
    return mockFacets();
  }

  const searchParams = new URLSearchParams({ org_key: ORG_KEY });

  const response = await fetch(`${API_BASE}/api/facets?${searchParams}`, {
    headers: {
      ...(API_KEY && { 'X-API-Key': API_KEY }),
    },
  });

  if (!response.ok) {
    throw new Error(`Facets failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Build a search URL from current state (for redirect mode)
 */
export function buildSearchUrl(
  baseUrl: string,
  params: {
    query?: string;
    country?: string;
    region?: string;
    city?: string;
    neighbourhood?: string;
    cuisine?: string[];
    expense_level?: string[];
    meals_served?: string[];
    features?: string[];
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
  }
): string {
  const url = new URL(baseUrl, window.location.origin);

  if (params.query) url.searchParams.set('q', params.query);
  if (params.country) url.searchParams.set('country', params.country);
  if (params.region) url.searchParams.set('region', params.region);
  if (params.city) url.searchParams.set('city', params.city);
  if (params.neighbourhood) url.searchParams.set('neighbourhood', params.neighbourhood);

  params.cuisine?.forEach((c) => url.searchParams.append('cuisine[]', c));
  params.expense_level?.forEach((e) => url.searchParams.append('expense[]', e));
  params.meals_served?.forEach((m) => url.searchParams.append('meals[]', m));
  params.features?.forEach((f) => url.searchParams.append('features[]', f));

  if (params.sort) url.searchParams.set('sort', params.sort);
  if (params.order) url.searchParams.set('order', params.order);
  if (params.page && params.page > 1) url.searchParams.set('page', String(params.page));

  return url.toString();
}

/**
 * Parse search params from URL (for deep linking)
 */
export function parseSearchUrl(url: URL): {
  query?: string;
  country?: string;
  region?: string;
  city?: string;
  neighbourhood?: string;
  cuisine?: string[];
  expense_level?: string[];
  meals_served?: string[];
  features?: string[];
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
} {
  return {
    query: url.searchParams.get('q') || undefined,
    country: url.searchParams.get('country') || undefined,
    region: url.searchParams.get('region') || undefined,
    city: url.searchParams.get('city') || undefined,
    neighbourhood: url.searchParams.get('neighbourhood') || undefined,
    cuisine: url.searchParams.getAll('cuisine[]'),
    expense_level: url.searchParams.getAll('expense[]'),
    meals_served: url.searchParams.getAll('meals[]'),
    features: url.searchParams.getAll('features[]'),
    sort: url.searchParams.get('sort') || undefined,
    order: (url.searchParams.get('order') as 'asc' | 'desc') || undefined,
    page: url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : undefined,
  };
}

// Export API mode for debugging
export const apiMode = API_MODE;
export const apiBase = API_BASE;
