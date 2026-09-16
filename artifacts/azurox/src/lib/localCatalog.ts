import type { Asset, SiteSettings } from '@workspace/api-client-react';

const ASSETS_KEY = 'azurox-local-assets';
const CATEGORIES_KEY = 'azurox-local-categories';
const SETTINGS_KEY = 'azurox-local-settings';

export const DEFAULT_LOCAL_SETTINGS: SiteSettings = {
  order_discord_link: '',
  banners: [],
};

function read<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : null;
  } catch {
    return null;
  }
}

export function loadLocalAssets() {
  return read<Asset[]>(ASSETS_KEY);
}

export function saveLocalAssets(assets: Asset[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
  window.dispatchEvent(new CustomEvent('azurox-catalog-changed'));
}

export function loadLocalCategories() {
  return read<string[]>(CATEGORIES_KEY) ?? [];
}

export function saveLocalCategories(categories: string[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CATEGORIES_KEY, JSON.stringify([...new Set(categories)].sort()));
  window.dispatchEvent(new CustomEvent('azurox-catalog-changed'));
}

export function loadLocalSettings() {
  return read<SiteSettings>(SETTINGS_KEY) ?? DEFAULT_LOCAL_SETTINGS;
}

export function saveLocalSettings(settings: SiteSettings) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent('azurox-catalog-changed'));
}