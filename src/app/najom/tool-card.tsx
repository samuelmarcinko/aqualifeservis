import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { htmlToText } from "@/lib/text";

export interface ToolCardData {
  slug: string;
  name: string;
  model: string | null;
  description: string | null;
  imageUrl: string | null;
  dailyPriceExVat: string;
}

export function ToolCard({ tool }: { tool: ToolCardData }) {
  const excerpt = htmlToText(tool.description);
  return (
    <Link
      href={`/naradie/${tool.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-cardhover"
    >
      <div className="product-frame relative aspect-square p-5">
        {tool.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tool.imageUrl}
            alt={tool.name}
            className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="text-5xl opacity-40">🧰</span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-brand-dark shadow-sm backdrop-blur">
          {formatCurrency(tool.dailyPriceExVat)} / deň
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold leading-snug text-brand-navy transition group-hover:text-brand-dark">
          {tool.name}
        </h3>
        {tool.model && <p className="mt-0.5 text-xs font-medium text-brand">{tool.model}</p>}
        {excerpt && <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{excerpt}</p>}
        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <span className="text-lg font-bold text-brand-dark">{formatCurrency(tool.dailyPriceExVat)}</span>
            <span className="block text-[11px] text-slate-400">za deň bez DPH</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-lg bg-brand/10 px-3 py-1.5 text-sm font-semibold text-brand-dark transition group-hover:bg-brand group-hover:text-white">
            Rezervovať
            <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
