// VR Concierge Search Types

export interface Location {
  country: string;
  region: string;
  city: string;
  neighbourhood: string | null;
  street: string;
  zip: string;
  lat: number;
  lng: number;
}

export interface Contact {
  phone: string;
  email: string;
  website: string;
  facebook: string | null;
  reservation_url: string | null;
}

export interface VectorizeDocument {
  id: string;
  org_key: string;
  post_type: 'restaurant' | 'place' | 'winery' | 'hotels' | 'entertainment';
  title: string;
  excerpt: string;
  content_html: string;
  url: string;
  featured_image: string;
  location: Location;
  sort_rating: number;
  sort_expense: number;
  sort_title: string;
  sort_date: string;
  cuisine: string[];
  meals_served: string[];
  features: string[];
  payment_methods: string[];
  dress_code: string[];
  alcohol_policy: string[];
  parking: string[];
  awards: string[];
  is_featured: boolean;
  is_active: boolean;
  expense_level: string;
  contact: Contact;
  categories: number[];
  category_names: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface SearchFilters {
  country?: string;
  region?: string;
  city?: string;
  neighbourhood?: string;
  cuisine?: string[];
  expense_level?: string[];
  meals_served?: string[];
  features?: string[];
  is_featured?: boolean;
}

export interface SearchSort {
  field: string;
  order: 'asc' | 'desc';
}

export interface SearchPagination {
  page: number;
  per_page: number;
}

export interface SearchRequest {
  org_key: string;
  post_type?: string;
  query?: string;
  filters?: SearchFilters;
  sort?: SearchSort;
  pagination?: SearchPagination;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface FacetItem {
  value: string;
  count: number;
}

export interface SearchFacets {
  cuisine: FacetItem[];
  expense_level: FacetItem[];
  meals_served: FacetItem[];
  features: FacetItem[];
}

export interface SearchResponse {
  results: VectorizeDocument[];
  total: number;
  page: number;
  per_page: number;
  facets: SearchFacets;
}

export interface LocationParams {
  org_key: string;
  country?: string;
  region?: string;
  city?: string;
}

export interface LocationOption {
  value: string;
  count: number;
}

export interface LocationResponse {
  level: 'country' | 'region' | 'city' | 'neighbourhood';
  parent?: string;
  options: LocationOption[];
}

export interface SortOption {
  field: string;
  label: string;
  order: 'asc' | 'desc';
  default?: boolean;
  requires_location?: boolean;
}

export interface FilterOption {
  field: string;
  label: string;
  type: 'multiselect' | 'toggle';
}

export interface SearchConfigResponse {
  post_type: string;
  sort_options: SortOption[];
  filter_options: FilterOption[];
  location_levels: string[];
}
