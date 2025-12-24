import type {
  SearchRequest,
  SearchResponse,
  LocationParams,
  LocationResponse,
  SearchConfigResponse,
  VectorizeDocument,
  FacetItem,
} from '../types';

import restaurantsData from '../mocks/restaurants.json';
import locationsData from '../mocks/locations.json';
import searchConfigData from '../mocks/search-config.json';
import facetsData from '../mocks/facets.json';

const restaurants = restaurantsData as VectorizeDocument[];

// Helper to calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper to check if text matches query (simple search)
function matchesQuery(doc: VectorizeDocument, query: string): boolean {
  const searchText = query.toLowerCase();
  const searchableContent = [
    doc.title,
    doc.excerpt,
    ...doc.cuisine,
    ...doc.features,
    doc.location.city,
    doc.location.region,
    doc.location.neighbourhood || '',
  ]
    .join(' ')
    .toLowerCase();

  return searchableContent.includes(searchText);
}

// Generate facets from filtered results
function generateFacets(results: VectorizeDocument[]): {
  cuisine: FacetItem[];
  expense_level: FacetItem[];
  meals_served: FacetItem[];
  features: FacetItem[];
} {
  const cuisineCounts: Record<string, number> = {};
  const expenseCounts: Record<string, number> = {};
  const mealsCounts: Record<string, number> = {};
  const featuresCounts: Record<string, number> = {};

  results.forEach((doc) => {
    doc.cuisine.forEach((c) => {
      cuisineCounts[c] = (cuisineCounts[c] || 0) + 1;
    });
    expenseCounts[doc.expense_level] = (expenseCounts[doc.expense_level] || 0) + 1;
    doc.meals_served.forEach((m) => {
      mealsCounts[m] = (mealsCounts[m] || 0) + 1;
    });
    doc.features.forEach((f) => {
      featuresCounts[f] = (featuresCounts[f] || 0) + 1;
    });
  });

  const toFacetArray = (counts: Record<string, number>): FacetItem[] =>
    Object.entries(counts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);

  return {
    cuisine: toFacetArray(cuisineCounts),
    expense_level: toFacetArray(expenseCounts),
    meals_served: toFacetArray(mealsCounts),
    features: toFacetArray(featuresCounts),
  };
}

export async function mockSearch(params: SearchRequest): Promise<SearchResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  let results = [...restaurants];

  // Filter by active status
  results = results.filter((r) => r.is_active);

  // Apply text search
  if (params.query) {
    results = results.filter((r) => matchesQuery(r, params.query!));
  }

  // Apply location filters
  if (params.filters?.country) {
    results = results.filter((r) => r.location.country === params.filters!.country);
  }
  if (params.filters?.region) {
    results = results.filter((r) => r.location.region === params.filters!.region);
  }
  if (params.filters?.city) {
    results = results.filter((r) => r.location.city === params.filters!.city);
  }
  if (params.filters?.neighbourhood) {
    results = results.filter((r) => r.location.neighbourhood === params.filters!.neighbourhood);
  }

  // Apply cuisine filter
  if (params.filters?.cuisine && params.filters.cuisine.length > 0) {
    results = results.filter((r) =>
      params.filters!.cuisine!.some((c) => r.cuisine.includes(c))
    );
  }

  // Apply expense filter
  if (params.filters?.expense_level && params.filters.expense_level.length > 0) {
    results = results.filter((r) =>
      params.filters!.expense_level!.includes(r.expense_level)
    );
  }

  // Apply meals filter
  if (params.filters?.meals_served && params.filters.meals_served.length > 0) {
    results = results.filter((r) =>
      params.filters!.meals_served!.some((m) => r.meals_served.includes(m))
    );
  }

  // Apply features filter
  if (params.filters?.features && params.filters.features.length > 0) {
    results = results.filter((r) =>
      params.filters!.features!.some((f) => r.features.includes(f))
    );
  }

  // Apply featured filter
  if (params.filters?.is_featured) {
    results = results.filter((r) => r.is_featured);
  }

  // Calculate facets before sorting/pagination
  const facets = generateFacets(results);

  // Sort results
  const sortField = params.sort?.field || 'sort_rating';
  const sortOrder = params.sort?.order || 'desc';

  if (sortField === 'distance' && params.location) {
    results = results.map((r) => ({
      ...r,
      _distance: calculateDistance(
        params.location!.lat,
        params.location!.lng,
        r.location.lat,
        r.location.lng
      ),
    }));
    results.sort((a, b) => {
      const distA = (a as VectorizeDocument & { _distance: number })._distance;
      const distB = (b as VectorizeDocument & { _distance: number })._distance;
      return sortOrder === 'asc' ? distA - distB : distB - distA;
    });
  } else {
    results.sort((a, b) => {
      const aVal = a[sortField as keyof VectorizeDocument];
      const bVal = b[sortField as keyof VectorizeDocument];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return 0;
    });
  }

  // Pagination
  const page = params.pagination?.page || 1;
  const perPage = Math.min(params.pagination?.per_page || 20, 100);
  const total = results.length;
  const startIndex = (page - 1) * perPage;
  const paginatedResults = results.slice(startIndex, startIndex + perPage);

  return {
    results: paginatedResults,
    total,
    page,
    per_page: perPage,
    facets,
  };
}

export async function mockLocations(params: LocationParams): Promise<LocationResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 50));

  const data = locationsData as Record<string, {
    count: number;
    regions: Record<string, {
      count: number;
      cities: Record<string, {
        count: number;
        neighbourhoods: string[];
      }>;
    }>;
  }>;

  // Country level
  if (!params.country) {
    return {
      level: 'country',
      options: Object.entries(data).map(([value, info]) => ({
        value,
        count: info.count,
      })),
    };
  }

  const countryData = data[params.country];
  if (!countryData) {
    return { level: 'region', parent: params.country, options: [] };
  }

  // Region level
  if (!params.region) {
    return {
      level: 'region',
      parent: params.country,
      options: Object.entries(countryData.regions).map(([value, info]) => ({
        value,
        count: info.count,
      })),
    };
  }

  const regionData = countryData.regions[params.region];
  if (!regionData) {
    return { level: 'city', parent: params.region, options: [] };
  }

  // City level
  if (!params.city) {
    return {
      level: 'city',
      parent: params.region,
      options: Object.entries(regionData.cities).map(([value, info]) => ({
        value,
        count: info.count,
      })),
    };
  }

  const cityData = regionData.cities[params.city];
  if (!cityData) {
    return { level: 'neighbourhood', parent: params.city, options: [] };
  }

  // Neighbourhood level
  return {
    level: 'neighbourhood',
    parent: params.city,
    options: cityData.neighbourhoods.map((value) => ({
      value,
      count: Math.floor(Math.random() * 10) + 1, // Mock counts
    })),
  };
}

export async function mockSearchConfig(): Promise<SearchConfigResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 50));

  const config = searchConfigData as Record<string, SearchConfigResponse>;
  return config['restaurant'];
}

export async function mockFacets(): Promise<{
  cuisine: FacetItem[];
  expense_level: FacetItem[];
  meals_served: FacetItem[];
  features: FacetItem[];
}> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 50));

  return facetsData as {
    cuisine: FacetItem[];
    expense_level: FacetItem[];
    meals_served: FacetItem[];
    features: FacetItem[];
  };
}
