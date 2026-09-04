import { ArrowUpRight, Command, Menu, Moon, Sun, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useEffect, useState, type ReactNode } from 'react';

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
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
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
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      window.localStorage.setItem('azurox-theme', dark ? 'dark' : 'light');
    } catch {
      // Theme persistence is optional when storage is unavailable.
    }
  }, [dark]);
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
          <Link href="/admin" className="rounded-full border border-border px-4 py-2 text-[12px] font-bold text-muted-foreground transition-all hover:border-primary/45 hover:text-primary" data-testid="link-admin">Studio access</Link>
        </nav>
        <div className="flex items-center gap-3 md:hidden">
          {themeToggle}
          <Link href="/admin" className="rounded-full border border-border px-3 py-2 text-[11px] font-bold text-muted-foreground" data-testid="link-mobile-admin">Studio</Link>
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