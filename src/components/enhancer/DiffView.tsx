"use client";


interface Props {
  original: string;
  enhanced: string;
}

export function DiffView({ original, enhanced }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="surface-mist rounded-card p-4">
        <p className="text-13 text-slate mb-2 font-medium">الأصلي</p>
        <p className="text-15 text-graphite leading-relaxed whitespace-pre-wrap">{original}</p>
      </div>
      <div className="card p-4 border-charcoal/20">
        <p className="text-13 text-slate mb-2 font-medium flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-ember" />
          المحسّن
        </p>
        <p className="text-15 text-ink leading-relaxed whitespace-pre-wrap">{enhanced}</p>
      </div>
    </div>
  );
}
