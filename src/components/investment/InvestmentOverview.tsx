"use client";

import { useFinanceStore } from "../shared/store";
import { useCurrency } from "../shared/useCurrency";

export default function InvestmentOverview() {
  const { formatCurrency } = useCurrency();
  const investments = useFinanceStore((state) => state.investments);

  const totalInvested = investments.reduce((sum, item) => sum + item.amount, 0);

  return (
    <section className="px-5 pt-4 pb-4 space-y-4">
      <div className="glass-card p-4">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Total Investment</p>
            <p className="text-xl font-bold text-white">{formatCurrency(totalInvested)}</p>
          </div>
          <p className="text-sm font-medium text-cyan-200">{investments.length} entries</p>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-cyan-300/80 rounded-full" style={{ width: `${Math.min(investments.length * 12, 100)}%` }} />
        </div>
      </div>

      {investments.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-sm text-white/80">No investments yet.</p>
          <p className="text-xs text-white/60 mt-1">Tap Add Investment to create your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {investments.map((item) => (
            <article key={item.id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="text-xs text-white/70">{item.category}</p>
                  <p className="text-xs text-white/60 mt-1">{item.date}</p>
                </div>
                <p className="text-sm font-bold text-white">{formatCurrency(item.amount)}</p>
              </div>
              {item.note && <p className="text-xs text-white/70 mt-2">{item.note}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
