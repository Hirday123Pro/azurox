import type { Asset } from '@workspace/api-client-react';

export type PriceDisplay = 'Robux' | 'USD' | 'Both';

export function getPriceDisplay(asset: Asset): PriceDisplay {
  if (asset.price_display === 'Both' || asset.price_display === 'Robux' || asset.price_display === 'USD') {
    return asset.price_display;
  }
  return asset.currency;
}

export function getAssetPrices(asset: Asset) {
  return {
    robux: asset.robux_price ?? (asset.currency === 'Robux' ? asset.price : null),
    usd: asset.dollar_price ?? (asset.currency === 'USD' ? asset.price : null),
    display: getPriceDisplay(asset),
  };
}

export function formatRobux(value: number) {
  return `${value.toLocaleString()} R$`;
}

export function formatUsd(value: number) {
  return `$${value.toFixed(2)}`;
}