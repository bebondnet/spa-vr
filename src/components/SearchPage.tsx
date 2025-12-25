import { useState, useEffect, useCallback } from 'react';
import { SearchResults } from './SearchResults';
import { searchListings, getLocations } from '../services/api';
import type { VectorizeDocument, FacetItem, LocationResponse } from '../types';

type SortOption = 'sort_rating' | 'sort_title' | 'sort_expense';

export function SearchPage() {
  const [results, setResults] = useState<VectorizeDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [facets, setFacets] = useState<{
    cuisine: FacetItem[];
    expense_level: FacetItem[];
    meals_served: FacetItem[];
  }>({
    cuisine: [],
    expense_level: [],
    meals_served: [],
  });

  // Location state
  const [, setCountries] = useState<LocationResponse | null>(null);
  const [regions, setRegions] = useState<LocationResponse | null>(null);
  const [cities, setCities] = useState<LocationResponse | null>(null);

  // Filter state
  const [country, setCountry] = useState('United States');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [query, setQuery] = useState('');
  const [sortField, setSortField] = useState<SortOption>('sort_rating');
  const [showFilters, setShowFilters] = useState(false);

  // Advanced filters
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<string[]>([]);

  const perPage = 20;

  // Load locations
  useEffect(() => {
    getLocations({}).then(setCountries);
  }, []);

  useEffect(() => {
    if (country) {
      getLocations({ country }).then(setRegions);
      setRegion('');
      setCity('');
    } else {
      setRegions(null);
    }
  }, [country]);

  useEffect(() => {
    if (country && region) {
      getLocations({ country, region }).then(setCities);
      setCity('');
    } else {
      setCities(null);
    }
  }, [country, region]);

  // Perform search
  useEffect(() => {
    const doSearch = async () => {
      setLoading(true);
      try {
        const response = await searchListings({
          query: query || undefined,
          filters: {
            country: country || undefined,
            region: region || undefined,
            city: city || undefined,
            cuisine: selectedCuisines.length > 0 ? selectedCuisines : undefined,
            expense_level: selectedExpense.length > 0 ? selectedExpense : undefined,
          },
          sort: {
            field: sortField,
            order: sortField === 'sort_title' ? 'asc' : 'desc',
          },
          pagination: {
            page,
            per_page: perPage,
          },
        });

        setResults(response.results);
        setTotal(response.total);
        setFacets({
          cuisine: response.facets.cuisine,
          expense_level: response.facets.expense_level,
          meals_served: response.facets.meals_served,
        });
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    doSearch();
  }, [country, region, city, query, sortField, selectedCuisines, selectedExpense, page]);

  const clearFilters = useCallback(() => {
    setCountry('United States');
    setRegion('');
    setCity('');
    setQuery('');
    setSelectedCuisines([]);
    setSelectedExpense([]);
    setSortField('sort_rating');
    setPage(1);
  }, []);

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines(prev =>
      prev.includes(cuisine) ? prev.filter(c => c !== cuisine) : [...prev, cuisine]
    );
    setPage(1);
  };

  const toggleExpense = (expense: string) => {
    setSelectedExpense(prev =>
      prev.includes(expense) ? prev.filter(e => e !== expense) : [...prev, expense]
    );
    setPage(1);
  };

  // Build applied filters list
  const appliedFilters: string[] = [];
  if (region) appliedFilters.push(`In ${region}`);
  if (city) appliedFilters.push(city);
  selectedCuisines.forEach(c => appliedFilters.push(c));
  selectedExpense.forEach(e => appliedFilters.push(e));

  return (
    <div className="vrc-search-page" data-testid="search-page">
      {/* Header */}
      <header className="vrc-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-text">VRC</span>
            <span className="logo-subtitle">Virtual Restaurant Concierge</span>
            <span className="logo-version" data-testid="version">v1.1.0-BEB105</span>
          </div>
          <nav className="header-nav">
            <a href="/">Home</a>
          </nav>
        </div>
      </header>

      {/* Location Dropdowns */}
      <div className="location-bar">
        <div className="location-dropdowns">
          <select
            value={region}
            onChange={(e) => { setRegion(e.target.value); setPage(1); }}
            data-testid="region-select"
          >
            <option value="">Select State</option>
            {regions?.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.value}</option>
            ))}
          </select>
          <select
            value={city}
            onChange={(e) => { setCity(e.target.value); setPage(1); }}
            data-testid="city-select"
            disabled={!region}
          >
            <option value="">Select City</option>
            {cities?.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.value}</option>
            ))}
          </select>
          <select
            value=""
            data-testid="area-select"
            disabled
          >
            <option value="">Select Area</option>
          </select>
        </div>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <div className="action-buttons">
          <button className="action-btn" onClick={() => window.history.back()}>Go Back</button>
          <button
            className={`action-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            data-testid="all-filters-btn"
          >
            All Filters
          </button>
          <button className="action-btn" onClick={clearFilters} data-testid="clear-filters">Clear Filters</button>
        </div>
        <div className="sort-buttons">
          <span className="sort-label">Sort Results By:</span>
          <button
            className={`sort-btn ${sortField === 'sort_rating' ? 'active' : ''}`}
            onClick={() => { setSortField('sort_rating'); setPage(1); }}
            data-testid="sort-rating"
          >
            VRC Rating
          </button>
          <button
            className={`sort-btn ${sortField === 'sort_title' ? 'active' : ''}`}
            onClick={() => { setSortField('sort_title'); setPage(1); }}
            data-testid="sort-name"
          >
            Name A-Z
          </button>
          <button className="sort-btn" disabled>Map View</button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel" data-testid="filters-panel">
          <div className="filter-group">
            <h4>Cuisine</h4>
            <div className="filter-options">
              {facets.cuisine.slice(0, 15).map((item) => (
                <label key={item.value} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedCuisines.includes(item.value)}
                    onChange={() => toggleCuisine(item.value)}
                    data-testid={`cuisine-${item.value.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                  {item.value} ({item.count})
                </label>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <h4>Price</h4>
            <div className="filter-options">
              {facets.expense_level.map((item) => (
                <label key={item.value} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedExpense.includes(item.value)}
                    onChange={() => toggleExpense(item.value)}
                    data-testid={`price-${item.value}`}
                  />
                  {item.value} ({item.count})
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="FIND: Restaurant Name (enter in quotes for exact match)"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            data-testid="search-input"
          />
        </div>
      </div>

      {/* Results */}
      <main className="search-main">
        <SearchResults
          results={results}
          total={total}
          page={page}
          perPage={perPage}
          loading={loading}
          onPageChange={setPage}
          appliedFilters={appliedFilters}
        />
      </main>
    </div>
  );
}
