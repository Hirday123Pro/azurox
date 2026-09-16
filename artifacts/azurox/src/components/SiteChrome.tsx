import { ArrowUpRight, Command, LoaderCircle, Menu, Moon, Pencil, ShieldCheck, Sun, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useEffect, useState, type ReactNode } from 'react';
import { getGetAdminStatusQueryKey, getGetPublicSettingsQueryKey, useGetAdminStatus, useGetPublicSettings, useLoginAdmin, useSetupAdmin } from '@workspace/api-client-react';
import { loadLocalSettings } from '@/lib/localCatalog';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" data-testid="brand-azurox">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <span className="absolute h-4 w-4 rotate-45 rounded-[4px] border-[2px] border-current" />
        <span className="absolute h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      {!compact && <span className="font-display text-[21px] font-bold tracking-[-0.06em]">azurox<span className="text-primary">.</span></span>}
    </div>
  );
}

export function SiteHeader() {
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [unlockMessage, setUnlockMessage] = useState('');
  const [localSettings, setLocalSettings] = useState(() => loadLocalSettings());
  const [dark, setDark] = useState(() => {
    try {
      return window.localStorage.getItem('azurox-theme') === 'dark';
    } catch {
      return false;
    }
  });
  const nav = [
    { label: 'Marketplace', href: '/' },
    { label: 'Discord', href: 'https://discord.gg/azurox', external: true },
  ];
  const statusQuery = useGetAdminStatus({ query: { queryKey: getGetAdminStatusQueryKey(), enabled: unlockOpen, retry: false } });
  const settingsQuery = useGetPublicSettings({ query: { queryKey: getGetPublicSettingsQueryKey(), staleTime: 30_000, retry: false } });
  const login = useLoginAdmin();
  const setup = useSetupAdmin();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      window.localStorage.setItem('azurox-theme', dark ? 'dark' : 'light');
    } catch {
      // Theme persistence is optional when storage is unavailable.
    }
  }, [dark]);
  useEffect(() => {
    const refreshSettings = () => setLocalSettings(loadLocalSettings());
    window.addEventListener('azurox-catalog-changed', refreshSettings);
    return () => window.removeEventListener('azurox-catalog-changed', refreshSettings);
  }, []);
  const settings = settingsQuery.data ?? localSettings;
  const banners = settings.banners.filter((banner) => banner.enabled && banner.text.trim()).slice(0, 4);
  const themeToggle = (
    <button
      type="button"
      onClick={() => setDark((value) => !value)}
      className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:border-primary/45 hover:text-primary"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      data-testid="button-toggle-theme"
    >
      {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </button>
  );
  const submitUnlock = (event: React.FormEvent) => {
    event.preventDefault();
    setUnlockMessage('');
    const options = {
      onSuccess: () => {
        setPassword('');
        setUnlockOpen(false);
        setLocation('/admin');
      },
      onError: (error: unknown) => setUnlockMessage(error instanceof Error ? error.message : 'That password did not unlock the studio.'),
    };
    if (statusQuery.data?.configured) login.mutate({ data: { password } }, options);
    else setup.mutate({ data: { password } }, options);
  };
  const unlockPending = login.isPending || setup.isPending;

  return (
    <header className="relative z-30 border-b border-border/70 bg-background/88 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-[1380px] items-center justify-between px-5 lg:px-10">
        <Link href="/" className="shrink-0" data-testid="link-brand-home"><BrandMark /></Link>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {nav.map((item) => item.external ? (
            <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[13px] font-bold text-muted-foreground transition-colors hover:text-foreground" data-testid={`link-nav-${item.label.toLowerCase()}`}>
              {item.label}<ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ) : (
            <Link key={item.label} href={item.href} className={`text-[13px] font-bold transition-colors hover:text-foreground ${location === item.href ? 'text-foreground' : 'text-muted-foreground'}`} data-testid={`link-nav-${item.label.toLowerCase()}`}>{item.label}</Link>
          ))}
          {themeToggle}
        </nav>
        <div className="flex items-center gap-3 md:hidden">
          {themeToggle}
          <button type="button" className="rounded-lg p-2 text-foreground hover:bg-secondary" onClick={() => setOpen(!open)} aria-label="Toggle menu" data-testid="button-toggle-menu">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </div>
      {open && <div className="border-t border-border bg-background px-5 py-4 md:hidden">
        {nav.map((item) => item.external ? (
          <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className="flex items-center justify-between border-b border-border py-3 text-sm font-bold" data-testid={`link-mobile-${item.label.toLowerCase()}`}>{item.label}<ArrowUpRight className="h-4 w-4" /></a>
        ) : (
          <Link key={item.label} href={item.href} className="block border-b border-border py-3 text-sm font-bold" onClick={() => setOpen(false)} data-testid={`link-mobile-${item.label.toLowerCase()}`}>{item.label}</Link>
        ))}
      </div>}
      {banners.length > 0 && <div className="border-t border-border/70 bg-secondary/40 px-5 py-2.5"><div className="mx-auto flex max-w-[1380px] gap-2 overflow-x-auto lg:px-5">{banners.map((banner) => banner.href ? <a key={banner.id} href={banner.href} target="_blank" rel="noreferrer" className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-[11px] font-bold text-foreground transition-colors hover:border-primary hover:text-primary">{banner.text}<ArrowUpRight className="ml-1 inline-block h-3 w-3" /></a> : <span key={banner.id} className="shrink-0 rounded-full border border-border bg-card px-3.5 py-1.5 text-[11px] font-bold text-muted-foreground">{banner.text}</span>)}</div></div>}
      <button
        type="button"
        onClick={() => { setUnlockMessage(''); setUnlockOpen(true); }}
        className="fixed right-4 top-4 z-50 flex h-8 w-8 items-center justify-center rounded-full border border-border/80 bg-background/90 text-muted-foreground shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-md"
        aria-label="Open admin unlock"
        title="Admin unlock"
        data-testid="button-open-admin-unlock"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      {unlockOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-[#07182b]/45 px-5 pt-24 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="admin-unlock-title">
          <form onSubmit={submitUnlock} className="w-full max-w-sm animate-dialog rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.18em] text-primary"><ShieldCheck className="h-3.5 w-3.5" />private archive</div>
                <h2 id="admin-unlock-title" className="mt-2 font-display text-2xl font-extrabold tracking-[-.05em]">Unlock admin</h2>
              </div>
              <button type="button" onClick={() => setUnlockOpen(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Close admin unlock"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{statusQuery.data?.configured ? 'Enter your admin password to open the dashboard.' : 'Create a private admin password to finish the first-time setup.'}</p>
            <input
              autoFocus
              required
              minLength={8}
              type="password"
              autoComplete={statusQuery.data?.configured ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="admin-input mt-5"
              placeholder="Enter password"
              aria-label="Admin password"
              data-testid="input-quick-admin-password"
            />
            {unlockMessage && <div className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs leading-5 text-destructive" data-testid="status-quick-admin">{unlockMessage}</div>}
            <button disabled={unlockPending} type="submit" className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-extrabold text-primary-foreground disabled:opacity-60" data-testid="button-quick-admin-submit">
              {unlockPending ? <><LoaderCircle className="h-4 w-4 animate-spin" />Unlocking…</> : 'Unlock dashboard'}
            </button>
          </form>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/35">
      <div className="mx-auto flex max-w-[1380px] flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <div className="flex items-center gap-3"><BrandMark compact /><span className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">curated assets for Roblox creators</span></div>
        <div className="flex items-center gap-5 text-[11px] font-bold text-muted-foreground"><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-soft" />manual fulfillment via Discord</span><Command className="h-4 w-4" /></div>
      </div>
    </footer>
  );
}

export function PageShell({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  return <div className="azurox-noise min-h-[100dvh] bg-background text-foreground">{children}{footer && <Footer />}</div>;
}