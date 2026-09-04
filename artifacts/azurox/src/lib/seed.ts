import type { Asset } from '@workspace/api-client-react';

export const SEED_ASSETS: Asset[] = [
  {
    id: 101,
    title: 'Aether HUD / Neon Status Kit',
    description: 'A complete status and inventory interface with sharp hierarchy, responsive layouts, and 24 ready-to-wire components for competitive Roblox worlds.',
    price: 18,
    currency: 'USD',
    category: 'UI',
    image_urls: [],
    discord_link: 'https://discord.gg/azurox',
    created_at: '2025-02-14T10:30:00.000Z',
    updated_at: '2025-02-14T10:30:00.000Z',
  },
  {
    id: 102,
    title: 'Cinderfall Combat Scripts',
    description: 'Server-safe combat foundations for hit confirms, knockback, cooldowns, and clean client feedback. Built to be understood, not just dropped in.',
    price: 2200,
    currency: 'Robux',
    category: 'Scripts',
    image_urls: [],
    discord_link: 'https://discord.gg/azurox',
    created_at: '2025-02-11T08:00:00.000Z',
    updated_at: '2025-02-11T08:00:00.000Z',
  },
  {
    id: 103,
    title: 'Driftline Skyport',
    description: 'A modular floating trade hub with landing pads, service corridors, and a moody sunset lighting pass. An atmospheric first scene for your next project.',
    price: 32,
    currency: 'USD',
    category: 'Maps',
    image_urls: [],
    discord_link: 'https://discord.gg/azurox',
    created_at: '2025-02-07T13:20:00.000Z',
    updated_at: '2025-02-07T13:20:00.000Z',
  },
  {
    id: 104,
    title: 'Morrowvale Modular Ruins',
    description: 'Weathered arches, broken streets, and modular stone kits for building a world with history. Includes trim sheets and 40 snap-ready pieces.',
    price: 1450,
    currency: 'Robux',
    category: '3D Models',
    image_urls: [],
    discord_link: 'https://discord.gg/azurox',
    created_at: '2025-01-29T09:10:00.000Z',
    updated_at: '2025-01-29T09:10:00.000Z',
  },
  {
    id: 105,
    title: 'Signal Lost: Mission UI',
    description: 'An editorial mission flow with objective cards, signal noise, map pins, and a satisfying completed-state system for narrative experiences.',
    price: 12,
    currency: 'USD',
    category: 'UI',
    image_urls: [],
    discord_link: 'https://discord.gg/azurox',
    created_at: '2025-01-22T16:45:00.000Z',
    updated_at: '2025-01-22T16:45:00.000Z',
  },
  {
    id: 106,
    title: 'Tidebreaker Water Shaders',
    description: 'Stylized water, foam edges, and underwater color grading tuned for Roblox performance. A small system with a big atmosphere payoff.',
    price: 900,
    currency: 'Robux',
    category: 'Scripts',
    image_urls: [],
    discord_link: 'https://discord.gg/azurox',
    created_at: '2025-01-17T11:00:00.000Z',
    updated_at: '2025-01-17T11:00:00.000Z',
  },
];

export const categoryMeta = {
  All: { label: 'All drops', tint: 'cyan' },
  UI: { label: 'Interface', tint: 'gold' },
  Scripts: { label: 'Systems', tint: 'lime' },
  '3D Models': { label: 'Objects', tint: 'violet' },
  Maps: { label: 'Worlds', tint: 'coral' },
} as const;

export function findSeedAsset(id: number) {
  return SEED_ASSETS.find((asset) => asset.id === id);
}