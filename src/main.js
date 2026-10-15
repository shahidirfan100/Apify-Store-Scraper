import { Actor, log } from 'apify';
import { Dataset } from 'crawlee';
import { gotScraping } from 'got-scraping';

const STORE_API_URL = 'https://api.apify.com/v2/store';
const PAGE_SIZE = 50;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0';

const normalizeText = (value) => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
};

const normalizeInteger = (value, fallback, min, max) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    const int = Math.trunc(number);
    return Math.min(max, Math.max(min, int));
};

const normalizeCategory = (value) => {
    const text = normalizeText(value);
    if (!text) return undefined;
    const normalized = text
        .replace(/[^A-Za-z0-9\s_-]/g, '')
        .replace(/[\s-]+/g, '_')
        .toUpperCase();
    if (normalized === 'ALL' || normalized === 'ANY' || normalized === 'ALL_CATEGORIES') return undefined;
    return normalized;
};

const normalizePricingModel = (value) => {
    const text = normalizeText(value);
    if (!text) return 'ALL_PRICING_MODELS';
    const normalized = text.replace(/[\s-]+/g, '_').toUpperCase();
    if (normalized === 'ALL' || normalized === 'ANY' || normalized === 'ALL_PRICING_MODELS') return 'ALL_PRICING_MODELS';
    if (normalized === 'PAY_PER_EVENT') return 'PAY_PER_EVENT';
    if (normalized === 'PAY_PER_USAGE') return 'PAY_PER_USAGE';
    if (normalized === 'RENTAL') return 'RENTAL';
    return 'ALL_PRICING_MODELS';
};

const normalizeSort = (value) => {
    const text = normalizeText(value);
    if (!text) return 'MOST_RELEVANT';
    const normalized = text.replace(/[\s-]+/g, '_').toUpperCase();
    const valid = new Set(['MOST_RELEVANT', 'NEWEST', 'POPULAR', 'RECENTLY_UPDATED']);
    if (normalized === 'POUPLAR') return 'POPULAR';
    return valid.has(normalized) ? normalized : 'MOST_RELEVANT';
};

const normalizeDevelopers = (value) => {
    const text = normalizeText(value);
    if (!text) return 'ALL_DEVELOPERS';
    const normalized = text.replace(/[\s-]+/g, '_').toUpperCase();
    if (normalized === 'MAINTAINED_BY_APIFY') return 'MAINTAINED_BY_APIFY';
    if (normalized === 'MAINTAINED_BY_COMMUNITY') return 'MAINTAINED_BY_COMMUNITY';
    return 'ALL_DEVELOPERS';
};

const pruneEmpty = (value) => {
    if (Array.isArray(value)) {
        const cleaned = value
            .map(pruneEmpty)
            .filter((item) => item !== undefined);
        return cleaned.length ? cleaned : undefined;
    }

    if (value && typeof value === 'object') {
        const output = {};
        for (const [key, nestedValue] of Object.entries(value)) {
            const cleaned = pruneEmpty(nestedValue);
            if (cleaned !== undefined) output[key] = cleaned;
        }
        return Object.keys(output).length ? output : undefined;
    }

    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string' && value.trim() === '') return undefined;
    return value;
};

const parseFiltersFromUrl = (inputUrl) => {
    const out = {};
    const cleanedUrl = normalizeText(inputUrl);
    if (!cleanedUrl) return out;

    let urlObj;
    try {
        urlObj = new URL(cleanedUrl);
    } catch {
        return out;
    }

    if (urlObj.hostname === 'api.apify.com' && urlObj.pathname.startsWith('/v2/store')) {
        out.username = normalizeText(urlObj.searchParams.get('username'));
        out.keyword = normalizeText(urlObj.searchParams.get('search'));
        out.category = normalizeCategory(urlObj.searchParams.get('category'));
        out.pricingModel = normalizePricingModel(urlObj.searchParams.get('pricingModel'));
        out.sort = normalizeSort(urlObj.searchParams.get('sort'));
        return pruneEmpty(out) || {};
    }

    if (urlObj.hostname === 'apify.com') {
        const parts = urlObj.pathname.split('/').filter(Boolean);
        if (parts.length >= 1 && parts[0] !== 'store') out.username = normalizeText(parts[0]);
        if (parts.length >= 2 && parts[0] !== 'store') {
            out.keyword = normalizeText(parts[1]?.replace(/-/g, ' '));
        }

        const queryKeyword = normalizeText(urlObj.searchParams.get('search'));
        const queryCategory = normalizeCategory(urlObj.searchParams.get('category'));
        const queryPricingModel = normalizePricingModel(urlObj.searchParams.get('pricingModel'));
        const querySort = normalizeSort(urlObj.searchParams.get('sort'));
        if (queryKeyword) out.keyword = queryKeyword;
        if (queryCategory) out.category = queryCategory;
        if (queryPricingModel) out.pricingModel = queryPricingModel;
        if (querySort) out.sort = querySort;
    }

    return pruneEmpty(out) || {};
};

const buildStoreUrl = ({ username, keyword, category, pricingModel, offset, limit }) => {
    const url = new URL(STORE_API_URL);
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('limit', String(limit));
    if (username) url.searchParams.set('username', username);
    if (keyword) url.searchParams.set('search', keyword);
    if (category) url.searchParams.set('category', category);
    if (pricingModel === 'PAY_PER_EVENT') url.searchParams.set('pricingModel', 'PAY_PER_EVENT');
    return url.toString();
};

const applyPricingModelFilter = (items, pricingModel) => {
    if (!pricingModel || pricingModel === 'ALL_PRICING_MODELS') return items;
    return items.filter((item) => {
        const model = String(item?.currentPricingInfo?.pricingModel || '').toUpperCase();
        return model === pricingModel;
    });
};

const applyDeveloperFilter = (items, developers) => {
    if (!developers || developers === 'ALL_DEVELOPERS') return items;
    if (developers === 'MAINTAINED_BY_APIFY') {
        return items.filter((item) => String(item?.username || '').toLowerCase() === 'apify');
    }
    if (developers === 'MAINTAINED_BY_COMMUNITY') {
        return items.filter((item) => String(item?.username || '').toLowerCase() !== 'apify');
    }
    return items;
};

const toTimestamp = (value) => {
    if (!value) return 0;
    const time = Date.parse(String(value));
    return Number.isFinite(time) ? time : 0;
};

const toNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
};

const compareDesc = (a, b) => b - a;

const sortItems = (items, sort) => {
    if (sort === 'MOST_RELEVANT') return items;

    const sorted = [...items];
    sorted.sort((a, b) => {
        if (sort === 'NEWEST') {
            return compareDesc(
                toTimestamp(a?.currentPricingInfo?.createdAt) || toTimestamp(a?.currentPricingInfo?.startedAt) || toTimestamp(a?.stats?.lastRunStartedAt),
                toTimestamp(b?.currentPricingInfo?.createdAt) || toTimestamp(b?.currentPricingInfo?.startedAt) || toTimestamp(b?.stats?.lastRunStartedAt),
            );
        }

        if (sort === 'POPULAR') {
            return compareDesc(toNumber(a?.bookmarkCount), toNumber(b?.bookmarkCount));
        }

        if (sort === 'RECENTLY_UPDATED') {
            return compareDesc(
                toTimestamp(a?.stats?.lastRunStartedAt) || toTimestamp(a?.currentPricingInfo?.startedAt),
                toTimestamp(b?.stats?.lastRunStartedAt) || toTimestamp(b?.currentPricingInfo?.startedAt),
            );
        }

        return 0;
    });

    return sorted;
};

const roundRating = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return value;
    return Number(number.toFixed(2));
};

const mapStoreItem = (item, queryMeta) => {
    const normalizedItem = {
        ...item,
        actorReviewRating: roundRating(item?.actorReviewRating),
        stats: item?.stats
            ? {
                ...item.stats,
                actorReviewRating: roundRating(item?.stats?.actorReviewRating),
            }
            : item?.stats,
    };

    const mapped = {
        actorFullName: normalizedItem?.username && normalizedItem?.name ? `${normalizedItem.username}/${normalizedItem.name}` : undefined,
        fetchedAt: new Date().toISOString(),
        query: queryMeta,
        ...normalizedItem,
    };
    return pruneEmpty(mapped);
};

async function main() {
    const runtimeInput = (await Actor.getInput()) || {};
    const {
        url,
        keyword,
        category,
        sort,
        pricingModel,
        developers,
        results_wanted = 20,
        max_pages = 10,
    } = runtimeInput;

    const keywordSearch = normalizeText(keyword);
    const parsedFromUrl = keywordSearch ? {} : parseFiltersFromUrl(url);

    const effectiveDevelopers = normalizeDevelopers(developers);
    const effectiveSort = normalizeSort(sort) || parsedFromUrl.sort || 'MOST_RELEVANT';
    const effectivePricingModel = normalizePricingModel(pricingModel) || parsedFromUrl.pricingModel || 'ALL_PRICING_MODELS';

    const effectiveFilters = pruneEmpty({
        username: parsedFromUrl.username,
        keyword: keywordSearch || parsedFromUrl.keyword,
        category: normalizeCategory(category) || parsedFromUrl.category,
        pricingModel: effectivePricingModel === 'ALL_PRICING_MODELS' ? undefined : effectivePricingModel,
    }) || {};

    if (!effectiveFilters.username && !effectiveFilters.keyword && !effectiveFilters.category && !effectiveFilters.pricingModel && effectiveDevelopers === 'ALL_DEVELOPERS') {
        throw new Error('Please provide at least one filter: url, keyword, category, pricingModel, or developers.');
    }

    const wanted = normalizeInteger(results_wanted, 20, 1, 5000);
    const maxPages = normalizeInteger(max_pages, 10, 1, 1000);

    let offset = 0;
    let page = 1;
    let totalAvailable = Number.POSITIVE_INFINITY;
    const collected = [];
    const requiresFullScan = effectiveSort !== 'MOST_RELEVANT';
    let processedPages = 0;

    while (page <= maxPages && offset < totalAvailable) {
        const apiUrl = buildStoreUrl({
            ...effectiveFilters,
            offset,
            limit: PAGE_SIZE,
        });

        log.info(`Fetching page ${page}`, { apiUrl });

        let body;
        try {
            const response = await gotScraping.get(apiUrl, {
                headers: {
                    Accept: 'application/json',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'User-Agent': USER_AGENT,
                },
                timeout: {
                    request: 30000,
                },
            });
            body = response.body;
        } catch (error) {
            log.error(`Request failed on page ${page}`, { error: error.message });
            throw error;
        }

        let parsed;
        try {
            parsed = JSON.parse(body);
        } catch {
            log.error(`Invalid JSON response on page ${page}`);
            throw new Error(`Invalid JSON response on page ${page}`);
        }

        const items = Array.isArray(parsed?.data?.items) ? parsed.data.items : [];
        const reportedTotal = Number(parsed?.data?.total);
        if (Number.isFinite(reportedTotal) && reportedTotal >= 0) {
            totalAvailable = reportedTotal;
        }

        if (!items.length) {
            log.info('No more items available. Stopping.');
            break;
        }

        const mappedItems = items
            .map((item) => mapStoreItem(item, effectiveFilters))
            .filter(Boolean);

        const filteredByPricing = applyPricingModelFilter(mappedItems, effectivePricingModel);
        const filteredByDeveloper = applyDeveloperFilter(filteredByPricing, effectiveDevelopers);

        if (!mappedItems.length) {
            log.warning('Current page produced no valid records after cleaning.');
        }

        collected.push(...filteredByDeveloper);
        offset += items.length;
        processedPages += 1;

        log.info(`Collected ${filteredByDeveloper.length} items from current page`, {
            page,
            collected: collected.length,
            wanted,
            offset,
            totalAvailable,
        });

        if (items.length === 0) break;
        if (!requiresFullScan && collected.length >= wanted) break;
        page++;
    }

    const sorted = sortItems(collected, effectiveSort);
    const finalItems = sorted.slice(0, wanted);

    if (!finalItems.length) {
        log.warning('No matching records found for the selected filters.');
    } else {
        await Dataset.pushData(finalItems);
    }

    log.info('Run completed', {
        saved: finalItems.length,
        collected: collected.length,
        wanted,
        pagesProcessed: processedPages,
        sort: effectiveSort,
        pricingModel: effectivePricingModel || 'ANY',
        developers: effectiveDevelopers,
    });
}

await Actor.main(main);
