import { Search, SlidersHorizontal, ArrowDownUp, ChevronDown, Sparkles, Layers3, RefreshCw, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useListAssets, useListCategories, useGetMarketplaceSummary, getListAssetsQueryKey, getListCategoriesQueryKey, getGetMarketplaceSummaryQueryKey } from '@workspace/api-client-react';
import type { Asset, ListAssetsSort } from '@workspace/api-client-react';
import { AssetVisual } from '@/components/AssetVisual';
import { PageShell, SiteHeader } from '@/components/SiteChrome';
import { SEED_ASSETS, categoryMeta } from '@/lib/seed';
import { formatRobux, formatUsd, getAssetPrices } from '@/lib/pricing';
import { loadLocalAssets, loadLocalCategories } from '@/lib/localCatalog';

function AssetCard({ asset, index }: { asset: Asset; index: number }) {
  const prices = getAssetPrices(asset);
  return (
    <Link href={`/assets/${asset.id}`} className="group animate-rise block overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg" style={{ animationDelay: `${Math.min(index * 70, 400)}ms` }} data-testid={`card-asset-${asset.id}`}>
      <AssetVisual asset={asset} />
      <div className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[.17em] text-primary">{asset.category === '3D Models' ? '3D models' : asset.category}</span>
          <span className="rounded-full bg-secondary px-2.5 py-1 font-mono text-[10px] font-medium text-muted-foreground">{asset.currency === 'USD' ? 'USD' : 'ROBUX'}</span>
        </div>
        <h3 className="font-display text-[18px] font-semibold leading-[1.12] tracking-[-.035em] transition-colors group-hover:text-primary">{asset.title}</h3>
        <p className="mt-2 line-clamp-2 text-[12px] leading-[1.55] text-muted-foreground">{asset.description}</p>
        <div className="mt-5 flex items-center justify-between border-t border-border/80 pt-4">
           <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[14px] font-bold text-foreground">
             {(prices.display === 'Robux' || prices.display === 'Both') && prices.robux !== null && <span>{formatRobux(prices.robux)}</span>}
             {(prices.display === 'Both') && prices.robux !== null && prices.usd !== null && <span className="text-muted-foreground">·</span>}
             {(prices.display === 'USD' || prices.display === 'Both') && prices.usd !== null && <span>{formatUsd(prices.usd)}</span>}
           </span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground transition-colors group-hover:text-primary">inspect <span className="text-primary">↗</span></span>
        </div>
      </div>
    </Link>
  );
}

function AssetSkeleton() {
  return <div className="overflow-hidden rounded-2xl border border-border bg-card"><div className="aspect-[1.22] animate-pulse bg-secondary" /><div className="space-y-3 p-5"><div className="h-2.5 w-20 animate-pulse rounded bg-secondary" /><div className="h-5 w-4/5 animate-pulse rounded bg-secondary" /><div className="h-3 w-full animate-pulse rounded bg-secondary" /><div className="h-3 w-2/3 animate-pulse rounded bg-secondary" /></div></div>;
}

export default function Marketplace() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [creator, setCreator] = useState('All');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState<ListAssetsSort>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [localAssets, setLocalAssets] = useState<Asset[] | null>(() => loadLocalAssets());
  const [localCategories, setLocalCategories] = useState<string[]>(() => loadLocalCategories());
  useEffect(() => {
    const refreshLocalCatalog = () => {
      setLocalAssets(loadLocalAssets());
      setLocalCategories(loadLocalCategories());
    };
    window.addEventListener('azurox-catalog-changed', refreshLocalCatalog);
    return () => window.removeEventListener('azurox-catalog-changed', refreshLocalCatalog);
  }, []);
  const categoriesQuery = useListCategories({ query: { queryKey: getListCategoriesQueryKey(), staleTime: 30_000 } });
  const params = useMemo(() => ({ search: query || undefined, category: activeCategory === 'All' ? undefined : activeCategory, creator: creator === 'All' ? undefined : creator, tags: selectedTags.length ? selectedTags.join(',') : undefined, min_price: minPrice || undefined, max_price: maxPrice || undefined, sort }), [query, activeCategory, creator, selectedTags, minPrice, maxPrice, sort]);
  const assetsQuery = useListAssets(params, { query: { queryKey: getListAssetsQueryKey(params), staleTime: 30_000 } });
  const allAssetsQuery = useListAssets({ sort: 'newest' }, { query: { queryKey: getListAssetsQueryKey({ sort: 'newest' }), staleTime: 30_000 } });
  const summaryQuery = useGetMarketplaceSummary({ query: { queryKey: getGetMarketplaceSummaryQueryKey(), staleTime: 30_000 } });
  const apiAssets = assetsQuery.data;
  const seeded = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    let result = SEED_ASSETS.filter((asset) => activeCategory === 'All' || asset.category === activeCategory)
      .filter((asset) => creator === 'All' || asset.creator === creator)
      .filter((asset) => selectedTags.every((tag) => asset.tags.includes(tag)))
      .filter((asset) => !minPrice || asset.price >= Number(minPrice))
      .filter((asset) => !maxPrice || asset.price <= Number(maxPrice));
    if (normalized) result = result.filter((asset) => `${asset.title} ${asset.description} ${asset.category} ${asset.creator} ${asset.tags.join(' ')}`.toLowerCase().includes(normalized));
    return [...result].sort((a, b) => sort === 'a_z' ? a.title.localeCompare(b.title) : sort === 'z_a' ? b.title.localeCompare(a.title) : sort === 'oldest' ? a.created_at.localeCompare(b.created_at) : sort === 'price_low' ? a.price - b.price : sort === 'price_high' ? b.price - a.price : b.created_at.localeCompare(a.created_at));
  }, [activeCategory, creator, maxPrice, minPrice, query, selectedTags, sort]);
  const assets = apiAssets && apiAssets.length > 0 ? apiAssets : seeded;
  const summary = summaryQuery.data;
  const count = summary?.asset_count ?? 24;
  const newest = summary?.newest_asset ? new Date(summary.newest_asset) : new Date(SEED_ASSETS[0].created_at);
  const availableAssets = allAssetsQuery.data?.length ? allAssetsQuery.data : localAssets?.length ? localAssets : SEED_ASSETS;
  const categories = ['All', ...new Set([...localCategories, ...(categoriesQuery.data ?? []).map((item) => item.name)])];
  const creators = ['All', ...new Set(availableAssets.map((asset) => asset.creator))];
  const tags = [...new Set(availableAssets.flatMap((asset) => asset.tags))].sort();
  const sortLabels: Record<ListAssetsSort, string> = { a_z: 'A–Z', z_a: 'Z–A', newest: 'Latest first', oldest: 'Oldest first', price_low: 'Price: low to high', price_high: 'Price: high to low' };
  const categoryLabel = (category: string) => categoryMeta[category as keyof typeof categoryMeta]?.label ?? category;

  return (
    <PageShell>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-border bg-[#10253d] text-[#e9fbff]">
          <div className="absolute inset-0 opacity-25 azurox-grid" />
           <div className="absolute -right-24 -top-36 h-[520px] w-[520px] animate-pulse-soft rounded-full bg-[#18d5e4]/15 blur-3xl" />
          <div className="relative mx-auto grid max-w-[1380px] gap-12 px-5 pb-16 pt-14 md:grid-cols-[1.1fr_.9fr] md:items-end md:pb-20 md:pt-20 lg:px-10">
            <div className="animate-rise">
              <div className="mb-7 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[.24em] text-[#84eaf2]"><span className="h-px w-8 bg-[#84eaf2]" />the rare drop archive</div>
              <h1 className="max-w-[760px] font-display text-[clamp(3.4rem,7.5vw,7.5rem)] font-extrabold leading-[.87] tracking-[-.075em]">Make your<br /><span className="text-[#54deec]">next world</span> felt.</h1>
              <p className="mt-8 max-w-[520px] text-[15px] leading-[1.7] text-[#b5d5dc]">High-signal scripts, interfaces, models, and maps for creators who care about the last ten percent. Browse the archive. Find the piece that changes the whole build.</p>
            </div>
            <div className="relative hidden min-h-[240px] md:block">
               <div className="absolute right-[5%] top-0 h-48 w-48 animate-drift rounded-[32px] border border-[#81f7ff]/30 bg-[#21bfd0]/15 shadow-2xl backdrop-blur-sm" />
               <div className="absolute right-[18%] top-12 h-48 w-48 animate-drift rounded-[32px] border border-[#e9d889]/25 bg-[#e9d889]/10 shadow-2xl backdrop-blur-sm" style={{ animationDelay: '1.2s' }} />
               <div className="absolute bottom-1 right-[36%] h-24 w-24 animate-pulse-soft rotate-45 rounded-[20px] border border-[#ffae98]/40 bg-[#e78373]/20" />
              <div className="absolute bottom-3 right-0 font-mono text-[10px] uppercase tracking-[.2em] text-[#7397a9]">AZ / 026 — OPEN LIBRARY</div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1380px] px-5 pt-8 lg:px-10">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
            <div className="bg-card px-5 py-5 sm:px-6"><div className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">archive volume</div><div className="mt-2 font-display text-3xl font-semibold tracking-[-.05em]">{count}<span className="ml-1 text-primary">+</span></div></div>
            <div className="bg-card px-5 py-5 sm:px-6"><div className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">collections</div><div className="mt-2 font-display text-3xl font-semibold tracking-[-.05em]">{summary?.category_count ?? 4}</div></div>
            <div className="bg-card px-5 py-5 sm:px-6"><div className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">newest drop</div><div className="mt-2 font-mono text-sm font-medium">{newest.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}</div></div>
            <div className="bg-card px-5 py-5 sm:px-6"><div className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">handoff</div><div className="mt-2 flex items-center gap-2 font-mono text-sm font-medium"><span className="h-2 w-2 rounded-full bg-primary" />Discord</div></div>
          </div>
        </section>

        <section className="mx-auto max-w-[1380px] px-5 pb-20 pt-16 lg:px-10">
          <div className="mb-8 flex flex-col gap-5 border-b border-border pb-7 lg:flex-row lg:items-end lg:justify-between">
             <div><div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-primary"><Sparkles className="h-3.5 w-3.5 animate-spin-slow" />curated, not crowded</div><h2 className="font-display text-4xl font-extrabold tracking-[-.06em]">Browse the archive</h2></div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <label className="relative block min-w-0 flex-1 sm:min-w-[260px]"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search the archive" className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary" data-testid="input-search-assets" />{query && <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" data-testid="button-clear-search"><X className="h-4 w-4" /></button>}</label>
              <div className="relative">
                <button type="button" onClick={() => setSortOpen(!sortOpen)} className="flex h-11 w-full items-center justify-between gap-6 rounded-xl border border-input bg-card px-3.5 text-[12px] font-bold sm:w-[180px]" data-testid="button-sort-assets"><span className="flex items-center gap-2"><ArrowDownUp className="h-3.5 w-3.5 text-primary" />{sortLabels[sort]}</span><ChevronDown className={`h-3.5 w-3.5 transition-transform ${sortOpen ? 'rotate-180' : ''}`} /></button>
                {sortOpen && <div className="absolute right-0 z-20 mt-2 w-full min-w-[190px] overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg">{(Object.keys(sortLabels) as Array<typeof sort>).map((key) => <button type="button" key={key} onClick={() => { setSort(key); setSortOpen(false); }} className={`block w-full rounded-lg px-3 py-2 text-left text-[11px] font-bold hover:bg-secondary ${sort === key ? 'text-primary' : 'text-muted-foreground'}`} data-testid={`button-sort-${key}`}>{sortLabels[key]}</button>)}</div>}
              </div>
            </div>
          </div>
          <div className="mb-9 flex items-center gap-2 overflow-x-auto pb-1" data-testid="category-filters">
            <SlidersHorizontal className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            {categories.map((category) => <button type="button" key={category} onClick={() => setActiveCategory(category)} className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-bold transition-all ${activeCategory === category ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-card text-muted-foreground hover:border-primary/45 hover:text-foreground'}`} data-testid={`button-category-${category.toLowerCase().replaceAll(' ', '-')}`}>{categoryLabel(category)}</button>)}
            <span className="ml-auto hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground sm:flex"><Layers3 className="h-3.5 w-3.5" />{assets.length} showing</span>
          </div>
          <div className="mb-8 grid gap-3 rounded-2xl border border-border bg-secondary/30 p-4 md:grid-cols-4" data-testid="asset-filter-panel">
            <label className="block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">Creator</span><select value={creator} onChange={(event) => setCreator(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-card px-3 text-xs font-semibold"><option>All</option>{creators.filter((item) => item !== 'All').map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">Category</span><select value={activeCategory} onChange={(event) => setActiveCategory(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-card px-3 text-xs font-semibold">{categories.map((item) => <option key={item} value={item}>{categoryLabel(item)}</option>)}</select></label>
            <label className="block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">Minimum price</span><input value={minPrice} onChange={(event) => setMinPrice(event.target.value)} type="number" min="0" placeholder="No minimum" className="h-10 w-full rounded-lg border border-input bg-card px-3 text-xs font-semibold" /></label>
            <label className="block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">Maximum price</span><input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} type="number" min="0" placeholder="No maximum" className="h-10 w-full rounded-lg border border-input bg-card px-3 text-xs font-semibold" /></label>
            <div className="md:col-span-4"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[.14em] text-muted-foreground">Tags · choose any combination</span><div className="flex flex-wrap gap-2">{tags.map((tag) => <button type="button" key={tag} onClick={() => setSelectedTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])} className={`rounded-full border px-3 py-1.5 text-[10px] font-bold transition-colors ${selectedTags.includes(tag) ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:border-primary/45 hover:text-foreground'}`}>{tag}</button>)}</div></div>
          </div>
          {assetsQuery.isError && <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#e8c989] bg-[#fff7dc] px-4 py-3 text-xs text-[#80632a]" data-testid="status-api-fallback"><RefreshCw className="h-4 w-4" />Archive preview is active while the live library reconnects.</div>}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
           {assetsQuery.isLoading && !apiAssets ? [1, 2, 3].map((item) => <AssetSkeleton key={item} />) : assets.length ? assets.map((asset, index) => <AssetCard key={asset.id} asset={asset} index={index} />) : <div className="col-span-full rounded-2xl border border-dashed border-border bg-card px-8 py-16 text-center" data-testid="empty-assets"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary"><Search className="h-5 w-5 text-muted-foreground" /></div><h3 className="font-display text-xl font-semibold">Nothing in this pocket of the archive</h3><p className="mt-2 text-sm text-muted-foreground">Try a wider search or another collection.</p><button type="button" onClick={() => { setQuery(''); setActiveCategory('All'); setCreator('All'); setSelectedTags([]); setMinPrice(''); setMaxPrice(''); }} className="mt-5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground" data-testid="button-reset-filters">Reset filters</button></div>}
          </div>
        </section>
      </main>
    </PageShell>
  );
}