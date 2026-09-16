import { Box, Code2, LayoutTemplate, MapPinned } from 'lucide-react';
import type { Asset } from '@workspace/api-client-react';

const visualMap = {
  UI: { icon: LayoutTemplate, colors: ['#103d55', '#18bfd1', '#b9f6ff'], label: 'UI / SYSTEMS' },
  Scripts: { icon: Code2, colors: ['#142d45', '#526eff', '#c3e6ff'], label: 'SCRIPT / LOGIC' },
  '3D Models': { icon: Box, colors: ['#2a2346', '#ad73f2', '#f0c9ff'], label: 'MODEL / KIT' },
  Maps: { icon: MapPinned, colors: ['#3c2943', '#ef8e76', '#ffe0a0'], label: 'MAP / WORLD' },
} as const;

export function AssetVisual({ asset, large = false }: { asset: Asset; large?: boolean }) {
  const visual = visualMap[asset.category as keyof typeof visualMap] ?? visualMap.UI;
  const Icon = visual.icon;
  const image = asset.image_urls?.[0];

  if (image) {
    return (
      <div className={`relative overflow-hidden bg-slate-900 ${large ? 'h-full min-h-[360px]' : 'aspect-[1.22]'}`}>
        <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-white/10" />
      </div>
    );
  }

  return (
    <div
      className={`asset-visual relative overflow-hidden ${large ? 'h-full min-h-[360px]' : 'aspect-[1.22]'}`}
      style={{ background: `linear-gradient(135deg, ${visual.colors[0]} 0%, ${visual.colors[1]} 55%, ${visual.colors[2]} 100%)` }}
    >
      <div className="absolute -right-14 -top-16 h-48 w-48 rounded-full border border-white/20" />
      <div className="absolute -bottom-24 -left-12 h-64 w-64 rounded-full border-[18px] border-white/10" />
      <div className="absolute left-[12%] top-[22%] h-24 w-24 rotate-12 rounded-[28px] border border-white/30 bg-white/10 backdrop-blur-sm" />
      <div className="absolute bottom-[22%] right-[15%] h-16 w-16 -rotate-12 rounded-full bg-white/15 blur-[1px]" />
      <div className="absolute inset-x-5 bottom-5 flex items-end justify-between text-white">
        <div>
          <div className="font-mono text-[10px] tracking-[0.22em] text-white/65">{visual.label}</div>
          <div className="mt-2 h-px w-20 bg-white/60" />
        </div>
        <Icon className="h-10 w-10 stroke-[1.25] text-white/80" aria-hidden="true" />
      </div>
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(120deg, transparent 25%, rgba(255,255,255,.5) 25.5%, transparent 26%, transparent 58%, rgba(255,255,255,.25) 58.5%, transparent 59%)' }} />
    </div>
  );
}