import type { VectorizeDocument } from '../types';

interface SearchResultsProps {
  results: VectorizeDocument[];
  total: number;
  page: number;
  perPage: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  appliedFilters: string[];
}

export function SearchResults({
  results,
  total,
  page,
  perPage,
  loading,
  onPageChange,
  appliedFilters,
}: SearchResultsProps) {
  const totalPages = Math.ceil(total / perPage);
  const startNum = (page - 1) * perPage + 1;
  const endNum = Math.min(page * perPage, total);

  if (loading) {
    return (
      <div className="search-results loading" data-testid="results-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="search-results" data-testid="search-results">
      {/* Applied Filters & Count */}
      <div className="results-info">
        <div className="applied-filters">
          <strong>Applied Filters:</strong>
          {appliedFilters.length > 0 && (
            <span className="filter-tags">
              {appliedFilters.map((f, i) => (
                <span key={i} className="filter-tag">{f}</span>
              ))}
            </span>
          )}
        </div>
        <div className="results-count" data-testid="results-count">
          Showing Restaurants {startNum}-{endNum} of {total}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="no-results" data-testid="results-empty">
          <p>No restaurants found matching your criteria.</p>
        </div>
      ) : (
        <div className="results-list" data-testid="results-grid">
          {results.map((restaurant) => (
            <div key={restaurant.id} className="restaurant-card" data-testid="restaurant-card">
              {/* Image */}
              <div className="card-image">
                <img
                  src={restaurant.featured_image || 'https://via.placeholder.com/200x150?text=No+Image'}
                  alt={restaurant.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x150?text=No+Image';
                  }}
                />
              </div>

              {/* Main Info */}
              <div className="card-info">
                <h3 className="card-title" data-testid="card-title">{restaurant.title}</h3>
                <div className="card-cuisine" data-testid="card-cuisine">
                  {restaurant.cuisine.slice(0, 3).join(', ')}
                </div>
                <div className="card-address">
                  <div>{restaurant.location.street}</div>
                  <div>{restaurant.location.city}, {restaurant.location.region} {restaurant.location.zip}</div>
                  {restaurant.contact.phone && <div>{restaurant.contact.phone}</div>}
                  {restaurant.location.neighbourhood && (
                    <div className="card-neighborhood">
                      <strong>Neighborhood:</strong>
                      <span className="neighborhood-link">{restaurant.location.neighbourhood}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rating & Price */}
              <div className="card-rating-section">
                <div className="card-expense" data-testid="card-expense">{restaurant.expense_level}</div>
                <div className="card-rating" data-testid="card-rating">
                  <span className="rating-value">{restaurant.sort_rating.toFixed(2)}</span>
                  <span className="rating-max">/ 10 Rating</span>
                </div>
                <button className="compare-btn">Compare</button>
              </div>

              {/* Description */}
              <div className="card-description">
                <p data-testid="card-excerpt">{restaurant.excerpt}</p>
                <a href={restaurant.url} className="read-more">Read More</a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination" data-testid="pagination">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            data-testid="prev-page"
          >
            « Previous
          </button>
          <span className="page-info" data-testid="page-info">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            data-testid="next-page"
          >
            Next »
          </button>
        </div>
      )}
    </div>
  );
}
