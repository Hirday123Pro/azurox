import { ArrowLeft, ArrowUpRight, Check, ChevronDown, KeyRound, LogOut, Pencil, Plus, Save, Shield, Trash2, X } from 'lucide-react';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetAdminStatusQueryKey,
  getGetAssetQueryKey,
  getGetMarketplaceSummaryQueryKey,
  getListCategoriesQueryKey,
  getListAssetsQueryKey,
  useChangeAdminPassword,
  useCreateAsset,
  useCreateCategory,
  useDeleteCategory,
  useDeleteAsset,
  useGetAdminStatus,
  useListAssets,
  useListCategories,
  useLoginAdmin,
  useLogoutAdmin,
  useSetupAdmin,
  useUpdateAsset,
} from '@workspace/api-client-react';
import type { Asset, AssetInput, Category } from '@workspace/api-client-react';
import { AssetVisual } from '@/components/AssetVisual';
import { BrandMark, PageShell } from '@/components/SiteChrome';
import { SEED_ASSETS } from '@/lib/seed';
import { formatRobux, formatUsd, getAssetPrices } from '@/lib/pricing';
import { loadLocalAssets, loadLocalCategories, saveLocalAssets, saveLocalCategories } from '@/lib/localCatalog';

type EditorValues = {
  title: string;
  description: string;
  pricing_mode: 'Robux' | 'USD' | 'Both';
  robux_price: string;
  dollar_price: string;
  category: string;
  creator: string;
  tags: string;
  image_urls: string[];
  discord_link: string;
};

const emptyEditor: EditorValues = {
  title: '',
  description: '',
  pricing_mode: 'USD',
  robux_price: '',
  dollar_price: '0',
  category: 'UI',
  creator: 'Azurox Studio',
  tags: '',
  image_urls: [''],
  discord_link: 'https://discord.gg/azurox',
};

function errorText(error: unknown) {
  return error && typeof error === 'object' && 'message' in error
    ? String((error as { message: string }).message)
    : 'Something went wrong. Try again.';
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Editor({ asset, categories, onClose, onSave, pending }: { asset?: Asset; categories: string[]; onClose: () => void; onSave: (values: EditorValues) => void; pending: boolean }) {
  const [values, setValues] = useState<EditorValues>(() => {
    if (!asset) return emptyEditor;
    const mode = asset.price_display ?? asset.currency;
    return {
      title: asset.title,
      description: asset.description,
      pricing_mode: mode === 'Both' ? 'Both' : mode === 'Robux' ? 'Robux' : 'USD',
      robux_price: asset.robux_price === null || asset.robux_price === undefined ? (asset.currency === 'Robux' ? String(asset.price) : '') : String(asset.robux_price),
      dollar_price: asset.dollar_price === null || asset.dollar_price === undefined ? (asset.currency === 'USD' ? String(asset.price) : '') : String(asset.dollar_price),
      category: asset.category,
      creator: asset.creator,
      tags: asset.tags.join(', '),
      image_urls: asset.image_urls.length ? asset.image_urls : [''],
      discord_link: asset.discord_link,
    };
  });
  const set = (key: keyof EditorValues, value: string) => setValues((current) => ({ ...current, [key]: value }));

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#07182b]/65 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true">
      <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-border bg-background shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-5 sm:px-7">
          <div><div className="font-mono text-[10px] uppercase tracking-[.18em] text-primary">{asset ? 'edit drop' : 'new drop'}</div><h2 className="mt-1 font-display text-2xl font-semibold tracking-[-.05em]">{asset ? 'Refine an archive entry' : 'Add to the archive'}</h2></div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Close editor" data-testid="button-close-editor"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); onSave(values); }} className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
          <div className="sm:col-span-2"><Field label="Title"><input required value={values.title} onChange={(event) => set('title', event.target.value)} className="admin-input" placeholder="Aether HUD / Neon Status Kit" data-testid="input-asset-title" /></Field></div>
          <div className="sm:col-span-2"><Field label="Description"><textarea required value={values.description} onChange={(event) => set('description', event.target.value)} className="admin-input min-h-[110px] resize-y" placeholder="What makes this drop worth opening?" data-testid="input-asset-description" /></Field></div>
          <div className="sm:col-span-2"><Field label="Price display"><select value={values.pricing_mode} onChange={(event) => set('pricing_mode', event.target.value as EditorValues['pricing_mode'])} className="admin-input" data-testid="select-asset-pricing-mode"><option value="USD">USD only</option><option value="Robux">Robux only</option><option value="Both">Show both</option></select></Field></div>
          {(values.pricing_mode === 'Robux' || values.pricing_mode === 'Both') && <Field label="Robux price"><input required min={0} type="number" step="1" value={values.robux_price} onChange={(event) => set('robux_price', event.target.value)} className="admin-input" placeholder="2200" data-testid="input-asset-robux-price" /></Field>}
          {(values.pricing_mode === 'USD' || values.pricing_mode === 'Both') && <Field label="Dollar price"><input required min={0} type="number" step="0.01" value={values.dollar_price} onChange={(event) => set('dollar_price', event.target.value)} className="admin-input" placeholder="18.00" data-testid="input-asset-dollar-price" /></Field>}
          <Field label="Creator name"><input required value={values.creator} onChange={(event) => set('creator', event.target.value)} className="admin-input" placeholder="Studio or creator name" data-testid="input-asset-creator" /></Field>
          <Field label="Collection"><select value={values.category} onChange={(event) => set('category', event.target.value)} className="admin-input" data-testid="select-asset-category">{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></Field>
          <div className="sm:col-span-2"><Field label="Tags"><input value={values.tags} onChange={(event) => set('tags', event.target.value)} className="admin-input" placeholder="combat, modular, sci-fi" data-testid="input-asset-tags" /><span className="mt-2 block text-[11px] text-muted-foreground">Separate tags with commas. Visitors can combine multiple tags in the archive filters.</span></Field></div>
          <Field label="Discord link"><input required value={values.discord_link} onChange={(event) => set('discord_link', event.target.value)} className="admin-input" placeholder="https://discord.gg/..." data-testid="input-asset-discord" /></Field>
          <div className="sm:col-span-2">
            <Field label={`Preview images · ${values.image_urls.length} slot${values.image_urls.length === 1 ? '' : 's'}`}>
              <div className="space-y-2">
                {values.image_urls.map((url, index) => <div key={index} className="flex items-center gap-2"><input value={url} onChange={(event) => setValues((current) => ({ ...current, image_urls: current.image_urls.map((item, itemIndex) => itemIndex === index ? event.target.value : item) }))} className="admin-input" placeholder={`Preview image ${index + 1} URL`} data-testid={`input-asset-image-${index}`} />{values.image_urls.length > 1 && <button type="button" onClick={() => setValues((current) => ({ ...current, image_urls: current.image_urls.filter((_, itemIndex) => itemIndex !== index) }))} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Remove preview image ${index + 1}`}><X className="h-4 w-4" /></button>}</div>)}
                <button type="button" onClick={() => setValues((current) => ({ ...current, image_urls: [...current.image_urls, ''] }))} className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-[11px] font-bold text-muted-foreground hover:border-primary/50 hover:text-primary" data-testid="button-add-preview-image"><Plus className="h-3.5 w-3.5" />Add another preview</button>
              </div>
            </Field>
          </div>
          <div className="flex justify-end gap-3 border-t border-border pt-5 sm:col-span-2">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-secondary" data-testid="button-cancel-editor">Cancel</button>
            <button disabled={pending} type="submit" className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-60" data-testid="button-save-asset">{pending ? 'Saving…' : <><Save className="h-4 w-4" />Save drop</>}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AuthCard({ configured, onPreview }: { configured: boolean; onPreview: () => void }) {
  const setup = useSetupAdmin();
  const login = useLoginAdmin();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [mode, setMode] = useState<'login' | 'setup'>(configured ? 'login' : 'setup');
  const [message, setMessage] = useState('');
  const pending = setup.isPending || login.isPending;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (mode === 'setup' && password !== confirm) { setMessage('Passwords do not match.'); return; }
    const options = { onSuccess: () => { setMessage('Access granted.'); window.setTimeout(onPreview, 250); }, onError: (error: unknown) => setMessage(`${errorText(error)} Preview mode is available below.`) };
    if (mode === 'setup') setup.mutate({ data: { password } }, options);
    else login.mutate({ data: { password } }, options);
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex items-center gap-3"><BrandMark /><span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[.15em] text-primary">private studio</span></div>
      <div className="rounded-3xl border border-border bg-card p-6 shadow-lg sm:p-8">
        <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Shield className="h-5 w-5" /></div>
        <div className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">{mode === 'setup' ? 'first run' : 'welcome back'}</div>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-.06em]">{mode === 'setup' ? 'Set the studio key.' : 'Enter the studio.'}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{mode === 'setup' ? 'Create the private password used to manage your archive.' : 'The archive is public. The tools behind it are not.'}</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <Field label={mode === 'setup' ? 'New password' : 'Password'}><input required minLength={8} type="password" autoComplete={mode === 'setup' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="admin-input" placeholder="8+ characters" data-testid="input-admin-password" /></Field>
          {mode === 'setup' && <Field label="Confirm password"><input required minLength={8} type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="admin-input" placeholder="Repeat password" data-testid="input-admin-confirm-password" /></Field>}
          {message && <div className="rounded-xl bg-secondary px-3 py-2 text-xs leading-5 text-muted-foreground" data-testid="status-admin-auth">{message}</div>}
          <button disabled={pending} type="submit" className="w-full rounded-xl bg-primary px-4 py-3 text-xs font-extrabold text-primary-foreground disabled:opacity-60" data-testid="button-admin-submit">{pending ? 'Checking key…' : mode === 'setup' ? 'Create studio access' : 'Unlock studio'}</button>
        </form>
        <button type="button" onClick={() => setMode(mode === 'setup' ? 'login' : 'setup')} className="mt-5 w-full text-center text-xs font-bold text-muted-foreground hover:text-primary" data-testid="button-toggle-auth-mode">{mode === 'setup' ? 'Already configured? Sign in' : 'Need initial setup?'}</button>
      </div>
      <button type="button" onClick={onPreview} className="mt-5 flex w-full items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground" data-testid="button-preview-mode">Continue with local preview <ArrowUpRight className="h-3.5 w-3.5" /></button>
    </div>
  );
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const statusQuery = useGetAdminStatus({ query: { queryKey: getGetAdminStatusQueryKey(), retry: false } });
  const assetsQuery = useListAssets({}, { query: { queryKey: getListAssetsQueryKey({}), retry: false } });
  const categoriesQuery = useListCategories({ query: { queryKey: getListCategoriesQueryKey(), retry: false } });
  const logout = useLogoutAdmin();
  const changePassword = useChangeAdminPassword();
  const create = useCreateAsset();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const update = useUpdateAsset();
  const remove = useDeleteAsset();
  const [previewAuth, setPreviewAuth] = useState(false);
  const [previewAssets, setPreviewAssets] = useState<Asset[]>(() => loadLocalAssets() ?? SEED_ASSETS);
  const [localCategories, setLocalCategories] = useState<string[]>(() => loadLocalCategories());
  const [editor, setEditor] = useState<{ asset?: Asset } | null>(null);
  const [notice, setNotice] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValues, setPasswordValues] = useState({ current_password: '', new_password: '' });
  const [newCategory, setNewCategory] = useState('');
  const status = statusQuery.data;
  const authenticated = previewAuth || Boolean(status?.authenticated);
  const configured = status?.configured ?? false;
  const assets = useMemo(() => previewAuth ? previewAssets : assetsQuery.isError || assetsQuery.data === undefined ? previewAssets : assetsQuery.data, [assetsQuery.data, assetsQuery.isError, previewAssets, previewAuth]);
  const categories = useMemo(() => [...new Set([...localCategories, ...(categoriesQuery.data ?? []).map((category) => category.name), ...assets.map((asset) => asset.category)])].sort((a, b) => a.localeCompare(b)), [assets, categoriesQuery.data, localCategories]);
  const categoryPills = useMemo<Category[]>(() => {
    const byName = new Map<string, Category>();
    (categoriesQuery.data ?? []).forEach((category) => byName.set(category.name, category));
    localCategories.forEach((name, index) => {
      if (!byName.has(name)) byName.set(name, { id: -(index + 1), name, created_at: '' });
    });
    return [...byName.values()];
  }, [categoriesQuery.data, localCategories]);

  const invalidate = () => {
    void client.invalidateQueries({ queryKey: getListAssetsQueryKey({}) });
    void client.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
    void client.invalidateQueries({ queryKey: getGetMarketplaceSummaryQueryKey() });
  };
  const payloadFor = (values: EditorValues): AssetInput => ({
    title: values.title.trim(),
    description: values.description.trim(),
     price: values.pricing_mode === 'Robux' ? Number(values.robux_price) : Number(values.dollar_price),
     currency: values.pricing_mode === 'Robux' ? 'Robux' : 'USD',
     robux_price: values.pricing_mode === 'USD' ? null : Number(values.robux_price),
     dollar_price: values.pricing_mode === 'Robux' ? null : Number(values.dollar_price),
     price_display: values.pricing_mode,
     creator: values.creator.trim(),
     tags: values.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    category: values.category,
     image_urls: values.image_urls.map((url) => url.trim()).filter(Boolean),
    discord_link: values.discord_link.trim(),
  });
  const save = (values: EditorValues) => {
    const payload = payloadFor(values);
    if (editor?.asset) {
      update.mutate({ id: editor.asset.id, data: payload }, {
         onSuccess: (result) => { setPreviewAssets((list) => { const next = list.map((item) => item.id === result.id ? result : item); saveLocalAssets(next); return next; }); setEditor(null); setNotice('Drop updated.'); invalidate(); void client.invalidateQueries({ queryKey: getGetAssetQueryKey(result.id) }); },
         onError: (error) => { setPreviewAssets((list) => { const next = list.map((item) => item.id === editor.asset?.id ? { ...item, ...payload, updated_at: new Date().toISOString() } : item); saveLocalAssets(next); return next; }); setEditor(null); setNotice(`Preview update saved locally. ${errorText(error)}`); },
      });
    } else {
      create.mutate({ data: payload }, {
         onSuccess: (result) => { setPreviewAssets((list) => { const next = [result, ...list]; saveLocalAssets(next); return next; }); setEditor(null); setNotice('New drop published.'); invalidate(); },
         onError: (error) => { const local: Asset = { ...payload, robux_price: payload.robux_price ?? null, dollar_price: payload.dollar_price ?? null, id: Math.max(...previewAssets.map((item) => item.id), 100) + 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; setPreviewAssets((list) => { const next = [local, ...list]; saveLocalAssets(next); return next; }); setEditor(null); setNotice(`Preview drop saved locally. ${errorText(error)}`); },
      });
    }
  };
  const deleteOne = (asset: Asset) => {
    if (!window.confirm(`Remove “${asset.title}” from the archive?`)) return;
    remove.mutate({ id: asset.id }, {
       onSuccess: () => { setPreviewAssets((list) => { const next = list.filter((item) => item.id !== asset.id); saveLocalAssets(next); return next; }); setNotice('Drop removed.'); invalidate(); },
       onError: (error) => { setPreviewAssets((list) => { const next = list.filter((item) => item.id !== asset.id); saveLocalAssets(next); return next; }); setNotice(`Preview drop removed locally. ${errorText(error)}`); },
    });
  };
  const addCategory = (event: FormEvent) => {
    event.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    createCategory.mutate({ data: { name } }, {
      onSuccess: () => { setLocalCategories((current) => { const next = [...new Set([...current, name])]; saveLocalCategories(next); return next; }); setNewCategory(''); setNotice(`Category “${name}” added.`); void client.invalidateQueries({ queryKey: getListCategoriesQueryKey() }); },
      onError: (error) => { setLocalCategories((current) => { const next = [...new Set([...current, name])]; saveLocalCategories(next); return next; }); setNewCategory(''); setNotice(`Category “${name}” saved locally. ${errorText(error)}`); },
    });
  };
  const removeCategory = (category: Category) => {
    if (!window.confirm(`Remove the unused category “${category.name}”?`)) return;
    deleteCategory.mutate({ id: category.id }, {
      onSuccess: () => { setLocalCategories((current) => current.filter((name) => name !== category.name)); saveLocalCategories(localCategories.filter((name) => name !== category.name)); setNotice(`Category “${category.name}” removed.`); void client.invalidateQueries({ queryKey: getListCategoriesQueryKey() }); },
      onError: (error) => { setLocalCategories((current) => current.filter((name) => name !== category.name)); saveLocalCategories(localCategories.filter((name) => name !== category.name)); setNotice(`Category “${category.name}” removed locally. ${errorText(error)}`); },
    });
  };
  const submitPassword = (event: FormEvent) => {
    event.preventDefault();
    changePassword.mutate({ data: passwordValues }, {
      onSuccess: () => { setPasswordValues({ current_password: '', new_password: '' }); setNotice('Studio key changed.'); },
      onError: (error) => setNotice(errorText(error)),
    });
  };

  if (!authenticated) {
    return <PageShell footer={false}><div className="flex min-h-[100dvh] items-center justify-center bg-[#10253d] px-5"><div className="absolute inset-0 opacity-20 azurox-grid" /><div className="relative"><AuthCard configured={configured} onPreview={() => setPreviewAuth(true)} /><Link href="/" className="mx-auto mt-8 flex w-fit items-center gap-2 text-xs font-bold text-[#aecbd1] hover:text-white" data-testid="link-admin-back"><ArrowLeft className="h-3.5 w-3.5" />Return to public archive</Link></div></div></PageShell>;
  }

  return (
    <PageShell footer={false}>
      <div className="min-h-[100dvh] bg-background">
        <header className="border-b border-border bg-card"><div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 lg:px-10"><Link href="/" data-testid="link-admin-brand"><BrandMark /></Link><div className="flex items-center gap-3"><span className="hidden rounded-full bg-primary/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.12em] text-primary sm:block">studio mode</span><button type="button" onClick={() => { logout.mutate(undefined, { onSuccess: () => { setPreviewAuth(false); void client.invalidateQueries({ queryKey: getGetAdminStatusQueryKey() }); setLocation('/'); }, onError: () => { setPreviewAuth(false); setLocation('/'); } }); }} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:border-primary/40 hover:text-foreground" data-testid="button-admin-logout"><LogOut className="h-3.5 w-3.5" />Log out</button></div></div></header>
         <main className="mx-auto max-w-[1440px] px-5 py-9 lg:px-10">
           <div className="mb-9 flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-primary"><span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-soft" />control room</div><h1 className="font-display text-4xl font-extrabold tracking-[-.07em] sm:text-5xl">Archive management</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Keep the signal high. Publish a drop, tune an existing entry, or remove what no longer earns its place.</p></div><button type="button" onClick={() => setEditor({})} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-extrabold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md" data-testid="button-new-asset"><Plus className="h-4 w-4" />New drop</button></div>
          {notice && <div className="mb-6 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-foreground" data-testid="status-admin-notice"><span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss notice" data-testid="button-dismiss-notice"><X className="h-4 w-4 text-muted-foreground" /></button></div>}
          <section className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-border bg-card p-5"><div className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">active drops</div><div className="mt-2 font-display text-3xl font-semibold tracking-[-.05em]">{assets.length}</div></div><div className="rounded-2xl border border-border bg-card p-5"><div className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">collections</div><div className="mt-2 font-display text-3xl font-semibold tracking-[-.05em]">{new Set(assets.map((item) => item.category)).size}</div></div><div className="rounded-2xl border border-border bg-card p-5"><div className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">session</div><div className="mt-2 flex items-center gap-2 font-mono text-sm font-medium"><span className="h-2 w-2 rounded-full bg-primary animate-pulse-soft" />secured</div></div></section>
            <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="font-mono text-[10px] uppercase tracking-[.16em] text-primary">taxonomy</div><h2 className="mt-1 font-display text-xl font-semibold tracking-[-.04em]">Collections</h2><p className="mt-1 text-xs text-muted-foreground">Add categories for future drops. Categories assigned to a drop cannot be removed until unused.</p></div><form onSubmit={addCategory} className="flex w-full gap-2 sm:max-w-sm"><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} className="admin-input" placeholder="New category name" data-testid="input-new-category" /><button disabled={createCategory.isPending} type="submit" className="shrink-0 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground disabled:opacity-60" data-testid="button-add-category">{createCategory.isPending ? 'Adding…' : 'Add'}</button></form></div><div className="mt-5 flex flex-wrap gap-2">{categoryPills.map((category) => <span key={category.id} className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-[10px] font-bold">{category.name}{category.id > 0 && <button type="button" onClick={() => removeCategory(category)} className="rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Remove ${category.name}`}><X className="h-3 w-3" /></button>}</span>)}</div></section>
            <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-display text-xl font-semibold tracking-[-.04em]">All drops</h2><p className="mt-1 text-xs text-muted-foreground">Changes publish to the public archive.</p></div><span className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">{assets.length} entries</span></div><div className="divide-y divide-border">{assetsQuery.isLoading && !assetsQuery.data ? [1, 2, 3].map((item) => <div key={item} className="flex items-center gap-4 p-5"><div className="h-12 w-16 animate-pulse rounded-lg bg-secondary" /><div className="h-4 w-48 animate-pulse rounded bg-secondary" /></div>) : assets.length ? assets.map((asset) => { const prices = getAssetPrices(asset); return <div key={asset.id} className="group flex flex-col gap-4 p-4 transition-colors hover:bg-secondary/35 sm:flex-row sm:items-center sm:p-5" data-testid={`row-admin-asset-${asset.id}`}><div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl"><AssetVisual asset={asset} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-display text-base font-semibold tracking-[-.03em]">{asset.title}</span><span className="rounded-full bg-primary/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[.12em] text-primary">{asset.category}</span><span className="font-mono text-[10px] text-muted-foreground">by {asset.creator}</span></div><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{asset.description}</p><div className="mt-2 flex flex-wrap gap-1">{asset.tags.map((tag) => <span key={tag} className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[9px] text-muted-foreground">#{tag}</span>)}</div></div><div className="flex items-center justify-between gap-5 sm:justify-end"><span className="font-mono text-xs font-bold">{(prices.display === 'Robux' || prices.display === 'Both') && prices.robux !== null && <span>{formatRobux(prices.robux)}</span>}{prices.display === 'Both' && prices.robux !== null && prices.usd !== null && <span className="mx-1 text-muted-foreground">·</span>}{(prices.display === 'USD' || prices.display === 'Both') && prices.usd !== null && <span>{formatUsd(prices.usd)}</span>}</span><div className="flex gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"><button type="button" onClick={() => setEditor({ asset })} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary" aria-label={`Edit ${asset.title}`} data-testid={`button-edit-asset-${asset.id}`}><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => deleteOne(asset)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${asset.title}`} data-testid={`button-delete-asset-${asset.id}`}><Trash2 className="h-4 w-4" /></button></div></div></div>; }) : <div className="px-6 py-14 text-center" data-testid="empty-admin-assets"><div className="font-mono text-[10px] uppercase tracking-[.18em] text-primary">quiet archive</div><p className="mt-3 font-display text-xl font-semibold">No drops are published yet.</p><p className="mt-2 text-sm text-muted-foreground">Start the collection with a considered first entry.</p><button type="button" onClick={() => setEditor({})} className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground" data-testid="button-empty-new-asset">Add first drop</button></div>}</div></section>
         <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-7"><button type="button" onClick={() => setShowPassword(!showPassword)} className="flex w-full items-center justify-between text-left" data-testid="button-toggle-password-panel"><span className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary"><KeyRound className="h-4 w-4 text-primary" /></span><span><span className="block font-display text-lg font-semibold tracking-[-.03em]">Studio key</span><span className="mt-1 block text-xs text-muted-foreground">Change the password used for private access.</span></span></span><ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showPassword ? 'rotate-180' : ''}`} /></button>{showPassword && <form onSubmit={submitPassword} className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-3"><Field label="Current password"><input required type="password" autoComplete="current-password" value={passwordValues.current_password} onChange={(event) => setPasswordValues({ ...passwordValues, current_password: event.target.value })} className="admin-input" data-testid="input-current-password" /></Field><Field label="New password"><input required minLength={8} type="password" autoComplete="new-password" value={passwordValues.new_password} onChange={(event) => setPasswordValues({ ...passwordValues, new_password: event.target.value })} className="admin-input" data-testid="input-new-password" /></Field><div className="flex items-end"><button disabled={changePassword.isPending} type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-xs font-bold hover:bg-primary/10 hover:text-primary disabled:opacity-60" data-testid="button-change-password">{changePassword.isPending ? 'Updating…' : <><KeyRound className="h-4 w-4" />Update key</>}</button></div></form>}</section>
        </main>
         {editor && <Editor asset={editor.asset} categories={categories} onClose={() => setEditor(null)} onSave={save} pending={create.isPending || update.isPending} />}
      </div>
    </PageShell>
  );
}