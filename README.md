# VR Concierge Search SPA

React + TypeScript + Vite search widget for VR Concierge, powered by Bebond API.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (uses mock data by default)
npm run dev
```

The app runs at `http://localhost:5173` with mock data - no backend required.

## Environment Configuration

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

### API Modes

| Mode | Description | API Base |
|------|-------------|----------|
| `mock` | Uses local JSON mock data (default) | N/A |
| `local` | Uses local wrangler dev server | `http://localhost:8787` |
| `staging` | Uses staging API | `https://api-staging.bebond.net` |
| `production` | Uses production API | `https://api.bebond.net` |

### Environment Variables

```bash
VITE_API_MODE=mock          # mock | local | staging | production
VITE_API_BASE=https://api.bebond.net
VITE_API_KEY=               # Optional API key
VITE_ORG_KEY=BB_vrconcierge # Organization key
```

## Project Structure

```
vr-search-spa/
├── src/
│   ├── mocks/              # Mock data for local development
│   │   ├── restaurants.json    # 50 sample restaurants
│   │   ├── locations.json      # Location hierarchy
│   │   ├── search-config.json  # Sort/filter options
│   │   └── facets.json         # Filter counts
│   ├── services/
│   │   ├── api.ts          # API client with environment switching
│   │   └── mock-api.ts     # Local mock implementation
│   └── types/
│       └── index.ts        # TypeScript interfaces
├── .env.example            # Environment template
└── .env.local              # Local environment (gitignored)
```

## Mock Data

The mock environment includes:

- **50 restaurants** across PA, NJ, and NY
- **Location hierarchy**: Country → Region → City → Neighbourhood
- **Cuisines**: Italian, American, French, Japanese, and 20+ more
- **Price levels**: $, $$, $$$, $$$$
- **Features**: BYOB, Michelin Star, Outdoor Seating, etc.

## API Services

### searchListings(params)

Search with filters, sorting, and pagination.

```typescript
import { searchListings } from './services/api';

const results = await searchListings({
  query: 'italian',
  filters: {
    city: 'Philadelphia',
    expense_level: ['$$', '$$$'],
    cuisine: ['Italian'],
  },
  sort: { field: 'sort_rating', order: 'desc' },
  pagination: { page: 1, per_page: 20 },
});
```

### getLocations(params)

Get location options for dependent dropdowns.

```typescript
import { getLocations } from './services/api';

// Get countries
const countries = await getLocations({});

// Get regions in a country
const regions = await getLocations({ country: 'United States' });

// Get cities in a region
const cities = await getLocations({
  country: 'United States',
  region: 'Pennsylvania'
});
```

### getSearchConfig()

Get sort options, filter options, and location levels.

```typescript
import { getSearchConfig } from './services/api';

const config = await getSearchConfig('restaurant');
// {
//   sort_options: [...],
//   filter_options: [...],
//   location_levels: ['country', 'region', 'city', 'neighbourhood']
// }
```

### URL Helpers

```typescript
import { buildSearchUrl, parseSearchUrl } from './services/api';

// Build URL for redirect mode
const url = buildSearchUrl('/search', {
  query: 'italian',
  city: 'Philadelphia',
  cuisine: ['Italian'],
});

// Parse URL for deep linking
const params = parseSearchUrl(new URL(window.location.href));
```

## Development Modes

### Mock Mode (Default)

```bash
# .env.local
VITE_API_MODE=mock
```

Frontend works independently with local JSON data.

### Local Backend Mode

```bash
# Terminal 1: Start bebond-api
cd ../bebond-api && wrangler dev

# Terminal 2: Start SPA
# .env.local
VITE_API_MODE=local
VITE_API_BASE=http://localhost:8787
```

### Production Mode

```bash
# .env.local
VITE_API_MODE=production
VITE_API_BASE=https://api.bebond.net
VITE_API_KEY=your_api_key
```

## Build

```bash
npm run build    # Build for production
npm run preview  # Preview production build
```

## Related

- [BEB-102](https://linear.app/bebond/issue/BEB-102) - Linear ticket for this work
- [vr-concierge-analysis.md](../vr-concierge-analysis.md) - Full schema analysis
