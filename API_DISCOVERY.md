## Selected API
- Endpoint: https://api.apify.com/v2/store
- Method: GET
- Auth: None required for public store listings
- Pagination: offset + limit query parameters
- Filters: username, search, category
- Fields available: title, name, username, stats, description, categories, pictureUrl, notice, bookmarkCount, actorReviewRating, actorReviewCount, badge, isWhiteListedForAgenticPayments, userPictureUrl, userFullName, currentPricingInfo, id, url
- Fields currently missing in previous actor: stats block, pricing block, bookmark/review metrics, user-level metadata, notices, badges
- Field count: 18+ top-level fields (vs previous actor output of 8 fields)

## Candidate Ranking
- Candidate A: https://api.apify.com/v2/store
  - Returns JSON directly: +30
  - More than 15 unique fields: +25
  - No auth required: +20
  - Pagination support: +15
  - Matches and extends previous output: +10
  - Total: 100

- Candidate B: https://api.apify.com/v2/acts
  - Returns JSON directly: +30
  - More than 15 unique fields: +25
  - No auth required: +0 (requires auth)
  - Pagination support: +15
  - Matches and extends previous output: +10
  - Total: 80 but rejected due to 401 in unauthenticated runtime

- Candidate C: HTML profile parsing from https://apify.com/shahidirfan
  - Returns JSON directly: +0
  - More than 15 unique fields: +0
  - No auth required: +20
  - Pagination support: +0
  - Matches and extends previous output: +5
  - Total: 25

## Rejected Candidates and Reasons
- /v2/acts endpoints rejected: return 401 without token and cannot be production-safe for public users.
- HTML parsing approach rejected: less stable and provides fewer consistent fields than store JSON.
- URLScan workflow could not submit new scans from this environment due to API key requirement; fallback discovery was completed with direct endpoint probing and response validation.

## Runtime Notes
- Works with direct got-scraping HTTP requests.
- Required headers: Accept: application/json, User-Agent, Accept-Language.
- Cookies/tokens are not required for selected endpoint.
- Actor remains fully HTTP based; Playwright fallback is not required for this target.
