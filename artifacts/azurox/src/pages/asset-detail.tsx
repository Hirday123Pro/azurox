import { ArrowLeft, ArrowUpRight, Check, ChevronLeft, ChevronRight, Copy, Disc3, ExternalLink, ShieldCheck, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'wouter';
import { useGetAsset, getGetAssetQueryKey, useListAssets, getListAssetsQueryKey } from '@workspace/api-client-react';
import type { Asset } from '@workspace/api-client-react';
import { AssetVisual } from '@/components/AssetVisual';
import { PageShell, SiteHeader } from '@/components/SiteChrome';
import { findSeedAsset, SEED_ASSETS } from '@/lib/seed';
import { formatRobux, formatUsd, getAssetPrices } from '@/lib/pricing';

function DetailFallback({ id }: { id: number }) {
  return <div className="mx-auto max-w-3xl px-5 py-28 text-center"><div className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">drop not found</div><h1 className="mt-4 font-display text-4xl font-semibold tracking-[-.06em]">That drop moved on.</h1><p className="mt-3 text-sm text-muted-foreground">The asset with archive code {id} is not available in this collection.</p><Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-bold text-primary-foreground" data-testid="link-back-archive"><ArrowLeft className="h-4 w-4" />Back to archive</Link></div>;
}

export default function AssetDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const query = useGetAsset(id, { query: { queryKey: getGetAssetQueryKey(id), staleTime: 30_000 } });
  const relatedQuery = useListAssets({}, { query: { queryKey: getListAssetsQueryKey({}), staleTime: 30_000 } });
  const asset = query.data ?? findSeedAsset(id);
  const [selected, setSelected] = useState(0);
  const [copied, setCopied] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const related = useMemo(() => (relatedQuery.data ?? SEED_ASSETS).filter((item) => item.id !== id).slice(0, 3), [relatedQuery.data, id]);

  if (query.isLoading && !asset) {
    return <PageShell><SiteHeader /><main className="mx-auto max-w-[1380px] px-5 py-12 lg:px-10"><div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr]"><div className="min-h-[430px] animate-pulse rounded-3xl bg-secondary" /><div className="space-y-4 pt-5"><div className="h-3 w-20 animate-pulse rounded bg-secondary" /><div className="h-12 w-4/5 animate-pulse rounded bg-secondary" /><div className="h-4 w-full animate-pulse rounded bg-secondary" /></div></div></main></PageShell>;
  }
  if (!asset) return <PageShell><SiteHeader /><DetailFallback id={id} /></PageShell>;

  const images = asset.image_urls?.length ? asset.image_urls : [null];
  const activeImage = images[selected] ?? images[0];
  const prices = getAssetPrices(asset);
  const copyLink = () => {
    void navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <PageShell>
      <SiteHeader />
      <main className="mx-auto max-w-[1380px] px-5 pb-24 pt-8 lg:px-10">
        <div className="mb-9 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-[12px] font-bold text-muted-foreground transition-colors hover:text-foreground" data-testid="link-detail-back"><ArrowLeft className="h-4 w-4" />Back to archive</Link>
          <button type="button" onClick={copyLink} className="inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-2 text-[11px] font-bold text-muted-foreground transition-colors hover:border-primary/45 hover:text-primary" data-testid="button-copy-asset-link">{copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}{copied ? 'Copied' : 'Copy drop link'}</button>
        </div>
        <div className="grid gap-10 lg:grid-cols-[1.12fr_.88fr] lg:gap-16">
          <div className="animate-rise">
            <div className="relative overflow-hidden rounded-[28px] border border-border bg-card shadow-md">
              {activeImage ? <img src={activeImage} alt={asset.title} className="aspect-[1.3] h-full w-full object-cover" /> : <AssetVisual asset={asset} large />}
              <div className="absolute left-5 top-5 rounded-full border border-white/20 bg-slate-950/35 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.16em] text-white backdrop-blur-md">AZ / {String(asset.id).padStart(3, '0')}</div>
              {images.length > 1 && <div className="absolute bottom-5 right-5 flex gap-2"><button type="button" onClick={() => setSelected((selected - 1 + images.length) % images.length)} className="rounded-full border border-white/25 bg-slate-950/40 p-2 text-white backdrop-blur-md hover:bg-slate-950/65" aria-label="Previous image" data-testid="button-gallery-previous"><ChevronLeft className="h-4 w-4" /></button><button type="button" onClick={() => setSelected((selected + 1) % images.length)} className="rounded-full border border-white/25 bg-slate-950/40 p-2 text-white backdrop-blur-md hover:bg-slate-950/65" aria-label="Next image" data-testid="button-gallery-next"><ChevronRight className="h-4 w-4" /></button></div>}
            </div>
            {images.length > 1 && <div className="mt-3 flex gap-3">{images.map((image, index) => <button type="button" key={image ?? index} onClick={() => setSelected(index)} className={`h-16 w-20 overflow-hidden rounded-xl border-2 transition-colors ${selected === index ? 'border-primary' : 'border-border'}`} data-testid={`button-gallery-thumb-${index}`}>{image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <AssetVisual asset={asset} />}</button>)}</div>}
          </div>
          <div className="flex flex-col justify-center py-3">
            <div className="mb-5 flex items-center gap-3"><span className="rounded-full bg-primary/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.16em] text-primary">{asset.category}</span><span className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">drop {new Date(asset.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
            <h1 className="max-w-[680px] font-display text-[clamp(2.8rem,5vw,5.5rem)] font-semibold leading-[.9] tracking-[-.075em]">{asset.title}</h1>
            <p className="mt-7 max-w-[580px] text-[15px] leading-[1.75] text-muted-foreground">{asset.description}</p>
             <div className="mt-9 border-y border-border py-5"><div className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">archive price</div><div className="mt-2 flex flex-wrap items-end gap-x-5 gap-y-2">{(prices.display === 'Robux' || prices.display === 'Both') && prices.robux !== null && <div><span className="block font-display text-4xl font-extrabold tracking-[-.06em]">{formatRobux(prices.robux)}</span><span className="mt-1 block text-xs text-muted-foreground">one-time transfer</span></div>}{(prices.display === 'USD' || prices.display === 'Both') && prices.usd !== null && <div><span className="block font-display text-4xl font-extrabold tracking-[-.06em]">{formatUsd(prices.usd)}</span><span className="mt-1 block text-xs text-muted-foreground">one-time license</span></div>}</div></div>
             <button type="button" onClick={() => setClaimOpen(true)} className="mt-7 flex w-full items-center justify-between rounded-2xl bg-primary px-5 py-4 text-primary-foreground shadow-sm transition-all hover:-translate-y-1 hover:shadow-md" data-testid="button-claim-discord"><span className="flex items-center gap-3"><Disc3 className="h-5 w-5" /><span><span className="block text-sm font-extrabold">Claim this drop on Discord</span><span className="mt-0.5 block text-[11px] font-medium opacity-75">Manual handoff, creator to creator</span></span></span><ArrowUpRight className="h-5 w-5" /></button>
            <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-border bg-card p-4"><ShieldCheck className="h-4 w-4 text-primary" /><div className="mt-3 text-xs font-bold">Curated files</div><div className="mt-1 text-[11px] leading-5 text-muted-foreground">Every drop is reviewed before it enters the archive.</div></div><div className="rounded-xl border border-border bg-card p-4"><ExternalLink className="h-4 w-4 text-primary" /><div className="mt-3 text-xs font-bold">Clear handoff</div><div className="mt-1 text-[11px] leading-5 text-muted-foreground">Questions, payment, and delivery happen in Discord.</div></div></div>
          </div>
        </div>
        <section className="mt-24 border-t border-border pt-9"><div className="mb-6 flex items-end justify-between"><div><div className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">keep exploring</div><h2 className="mt-2 font-display text-3xl font-semibold tracking-[-.06em]">From the same signal</h2></div><Link href="/" className="hidden items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary sm:flex" data-testid="link-more-archive">View archive <ArrowUpRight className="h-4 w-4" /></Link></div><div className="grid gap-5 md:grid-cols-3">{related.map((item, index) => <Link href={`/assets/${item.id}`} key={item.id} className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/35 hover:shadow-md" data-testid={`card-related-${item.id}`}><AssetVisual asset={item} /><div className="flex items-center justify-between p-4"><span className="font-display text-base font-semibold tracking-[-.03em] group-hover:text-primary">{item.title}</span><ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" /></div></Link>)}</div></section>
       </main>
       {claimOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07182b]/55 px-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="claim-dialog-title"><div className="w-full max-w-md animate-dialog rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><div className="font-mono text-[10px] uppercase tracking-[.18em] text-primary">discord handoff</div><h2 id="claim-dialog-title" className="mt-2 font-display text-2xl font-extrabold tracking-[-.05em]">Ready to claim?</h2></div><button type="button" onClick={() => setClaimOpen(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Close claim instructions"><X className="h-4 w-4" /></button></div><p className="mt-3 text-sm leading-6 text-muted-foreground">This marketplace uses manual fulfillment so you can ask questions before anything changes hands.</p><ol className="mt-6 space-y-3 text-sm"><li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] font-bold text-primary">01</span><span>Open the Azurox Discord server from the button below.</span></li><li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] font-bold text-primary">02</span><span>Send the drop name: <strong>{asset.title}</strong>.</span></li><li className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] font-bold text-primary">03</span><span>Confirm the price, payment, and delivery details with the Azurox team.</span></li></ol><a href={asset.discord_link} target="_blank" rel="noreferrer" onClick={() => setClaimOpen(false)} className="mt-7 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-extrabold text-primary-foreground" data-testid="link-confirm-discord">Continue to Discord <ArrowUpRight className="h-4 w-4" /></a></div></div>}
    </PageShell>
  );
}