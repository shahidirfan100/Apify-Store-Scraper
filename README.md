# Apify Store Scraper

Extract rich actor listings from Apify Store with flexible filtering by URL, keyword, and category. Collect structured metadata for market research, competitor tracking, and portfolio monitoring. This actor is designed for fast, reliable collection at scale.

---

## Features

- **URL-based collection** — Start from profile URLs or store endpoint URLs.
- **Keyword filtering** — Find actor listings that match your search intent.
- **Category filtering** — Narrow results to store categories such as `JOBS` or `AUTOMATION`.
- **Pagination support** — Collect across multiple pages with safe limits.
- **Clean dataset output** — Records are stored without empty or always-null values.

---

## Use Cases

### Portfolio Monitoring
Track listing changes and performance signals for a specific creator profile over time.

### Market Intelligence
Analyze how actors are positioned across categories, descriptions, and ratings.

### Competitive Analysis
Compare multiple actors by engagement indicators such as bookmarks and reviews.

### Content Research
Build datasets of listing descriptions and metadata for downstream analysis workflows.

---

## Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | String | No | `"https://apify.com/shahidirfan"` | Profile URL or store URL used as a starting context. |
| `keyword` | String | No | `""` | Search term applied to actor listings. |
| `category` | String | No | `"All categories"` | Category dropdown including Social media, AI, Agents, Jobs, MCP servers, and more. |
| `sort` | String | No | `"Most Relevant"` | Sort dropdown: Most Relevant, Newest, Pouplar, Recently updated. |
| `pricingModel` | String | No | `"All pricing models"` | Pricing dropdown: Pay per event, Pay per Usage, Rental. |
| `developers` | String | No | `"All developers"` | Developers dropdown: Maintained by Apify or Maintained by Community. |
| `results_wanted` | Integer | No | `20` | Maximum number of dataset items to collect. |
| `max_pages` | Integer | No | `10` | Maximum number of pages to request. |
| `proxyConfiguration` | Object | No | Apify Proxy enabled | Proxy settings for reliable collection. |

---

## Output Data

Each item in the dataset may contain:

| Field | Type | Description |
|-------|------|-------------|
| `actorFullName` | String | Combined actor identifier in `username/name` format. |
| `title` | String | Actor listing title. |
| `name` | String | Actor slug name. |
| `username` | String | Owner username. |
| `url` | String | Listing URL. |
| `description` | String | Listing description text. |
| `categories` | Array | Category list attached to the actor. |
| `bookmarkCount` | Number | Bookmark count from listing metadata. |
| `actorReviewRating` | Number | Average review rating rounded to 2 decimals (example: `4.72`). |
| `actorReviewCount` | Number | Number of reviews. |
| `stats` | Object | Listing statistics block when available. |
| `currentPricingInfo` | Object | Pricing-related metadata when available. |
| `query` | Object | Effective filters used for the run. |
| `fetchedAt` | String | ISO timestamp when item was collected. |

---

## Usage Examples

### Profile URL Run

```json
{
	"url": "https://apify.com/shahidirfan",
	"category": "All categories",
	"sort": "Most Relevant",
	"results_wanted": 20,
	"max_pages": 5
}
```

### Keyword Search Run

```json
{
	"keyword": "linkedin",
	"pricingModel": "Pay per event",
	"developers": "Maintained by Community",
	"results_wanted": 30,
	"max_pages": 10
}
```

### Category + Keyword Run

```json
{
	"keyword": "job",
	"category": "Jobs",
	"sort": "Recently updated",
	"results_wanted": 50,
	"max_pages": 20
}
```

---

## Sample Output

```json
{
	"actorFullName": "shahidirfan/Xing-Jobs-Scraper",
	"title": "Xing Jobs Scraper",
	"name": "Xing-Jobs-Scraper",
	"username": "shahidirfan",
	"url": "https://apify.com/shahidirfan/xing-jobs-scraper",
	"categories": [
		"JOBS",
		"DEVELOPER_TOOLS",
		"AUTOMATION"
	],
	"bookmarkCount": 6,
	"actorReviewRating": 4.72,
	"actorReviewCount": 7,
	"query": {
		"username": "shahidirfan",
		"keyword": "",
		"category": "Jobs"
	},
	"fetchedAt": "2026-04-18T10:00:00.000Z"
}
```

---

## Tips for Best Results

### Choose Clear Filters
Use either a profile URL, a focused keyword, or both to reduce noisy results.

### Keep Early Runs Small
Start with `results_wanted: 20` to validate output shape quickly, then scale up.

### Use Category Dropdowns
Use the built-in category dropdown values such as Jobs, AI, Social media, and MCP servers for tighter targeting.
If you want all actors from a profile (for example all 301 actors), choose `All categories`.

### Use Sort and Developer Filters
Pick Most Relevant, Newest, Pouplar, or Recently updated, then apply developer maintenance filters to focus results.

### Use Proxy for Reliability
Enable proxy configuration for consistent collection across repeated runs.

---

## Integrations

Connect extracted data to:

- **Google Sheets** — Share listing data with non-technical teams.
- **Airtable** — Build searchable actor catalogs.
- **Make** — Automate alerts and workflows.
- **Zapier** — Trigger downstream actions from fresh datasets.
- **Webhooks** — Send results to custom services.

Export formats include **JSON**, **CSV**, **Excel**, and **XML**.

---

## Frequently Asked Questions

### Can I run with only a URL?
Yes. A profile URL is enough to collect matching listings.

### Can I run with only a keyword?
Yes. The actor can search store listings by keyword without URL input.

### What happens if a field is missing?
Empty fields are removed from dataset items to keep outputs clean.

### How do I get more results?
Increase `results_wanted` and `max_pages` while keeping practical limits.

### Can I filter by category only?
Yes. Provide a category and optionally combine it with a keyword.

---

## Support

For issues or feature requests, open a discussion in your Apify actor page support section.

Useful resources:

- [Apify Documentation](https://docs.apify.com/)
- [Apify API Reference](https://docs.apify.com/api/v2)
- [Apify Schedules](https://docs.apify.com/platform/schedules)

---

## Legal Notice

This actor is intended for legitimate data collection use cases. Users are responsible for complying with website terms and applicable laws in their jurisdiction.