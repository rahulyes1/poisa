"use client";

import { useState } from "react";
import ExportButton from "../ExportButton";
import AddRecurringTemplateModal from "../spending/AddRecurringTemplateModal";
import { CurrencyCode, DashboardWindow } from "../shared/types";
import { useFinanceStore } from "../shared/store";
import { useCurrency } from "../shared/useCurrency";

const currencyOptions: CurrencyCode[] = ["USD", "INR", "EUR", "GBP", "JPY", "AED"];
const windowOptions: Array<{ label: string; value: DashboardWindow }> = [
  { label: "This Month", value: 1 },
  { label: "3M", value: 3 },
  { label: "6M", value: 6 },
  { label: "12M", value: 12 },
];

export default function SettingsPanel() {
  const { formatCurrency } = useCurrency();
  const [isAddRecurringOpen, setIsAddRecurringOpen] = useState(false);
  const [editingRecurringId, setEditingRecurringId] = useState<string | null>(null);

  const currency = useFinanceStore((state) => state.currency);
  const dashboardWindow = useFinanceStore((state) => state.dashboardWindow);
  const spendingCarryForwardEnabled = useFinanceStore((state) => state.spendingCarryForwardEnabled);
  const savingsCarryForwardEnabled = useFinanceStore((state) => state.savingsCarryForwardEnabled);
  const recurringTemplates = useFinanceStore((state) => state.recurringTemplates);
  const setCurrency = useFinanceStore((state) => state.setCurrency);
  const setDashboardWindow = useFinanceStore((state) => state.setDashboardWindow);
  const setSpendingCarryForwardEnabled = useFinanceStore((state) => state.setSpendingCarryForwardEnabled);
  const setSavingsCarryForwardEnabled = useFinanceStore((state) => state.setSavingsCarryForwardEnabled);
  const updateRecurringTemplate = useFinanceStore((state) => state.updateRecurringTemplate);
  const deleteRecurringTemplate = useFinanceStore((state) => state.deleteRecurringTemplate);

  const editingTemplate = recurringTemplates.find((template) => template.id === editingRecurringId) ?? null;

  return (
    <section className="px-5 pt-5 pb-4 space-y-4">
      <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] p-4">
        <h3 className="text-sm font-bold text-[#f0f0ff] mb-3">Settings</h3>

        <p className="text-xs font-semibold uppercase tracking-wide text-[#4a4a6a] mb-2">Currency</p>
        <div className="grid grid-cols-3 gap-2">
          {currencyOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCurrency(option)}
              className={`h-10 rounded-xl text-xs font-semibold border transition-colors ${
                currency === option
                  ? "border-[rgba(0,201,167,0.7)] bg-[#00C9A7] text-white shadow-[0_0_14px_rgba(0,201,167,0.25)]"
                  : "border-[rgba(255,255,255,0.06)] bg-[#1a1a26] text-[#6b7280] hover:border-[rgba(0,201,167,0.5)]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] p-4 space-y-3">
        <h4 className="text-sm font-bold text-[#f0f0ff]">Budget & Dashboard</h4>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#4a4a6a] mb-2">Dashboard Window</p>
          <div className="grid grid-cols-4 gap-2">
            {windowOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDashboardWindow(option.value)}
                className={`h-9 rounded-lg text-[11px] font-semibold border transition-colors ${
                  dashboardWindow === option.value
                    ? "border-[rgba(0,201,167,0.65)] bg-[rgba(0,201,167,0.2)] text-[#cffff1]"
                    : "border-[rgba(255,255,255,0.08)] bg-[#1a1a26] text-[#6b7280]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between gap-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] px-3 py-2">
          <span className="text-sm text-[#f0f0ff]">Spending carry forward</span>
          <input
            type="checkbox"
            checked={spendingCarryForwardEnabled}
            onChange={(event) => setSpendingCarryForwardEnabled(event.target.checked)}
            className="size-4 border border-white/20 bg-transparent"
          />
        </label>

        <label className="flex items-center justify-between gap-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] px-3 py-2">
          <span className="text-sm text-[#f0f0ff]">Savings carry forward</span>
          <input
            type="checkbox"
            checked={savingsCarryForwardEnabled}
            onChange={(event) => setSavingsCarryForwardEnabled(event.target.checked)}
            className="size-4 border border-white/20 bg-transparent"
          />
        </label>

        <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] px-3 py-2 text-sm text-[#6b7280]">
          <p className="flex items-center justify-between">
            <span>Lending carry forward</span>
            <span className="text-[#00C9A7] font-semibold">Always On</span>
          </p>
          <p className="flex items-center justify-between mt-1">
            <span>EMI reminders</span>
            <span className="text-[#f0f0ff]">3 days before due</span>
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-[#f0f0ff]">Recurring Cards</h4>
          <button
            type="button"
            onClick={() => setIsAddRecurringOpen(true)}
            className="h-7 px-2.5 rounded-lg border border-white/20 bg-white/[0.08] text-[11px] font-semibold text-[#d0efe9]"
          >
            Add Card
          </button>
        </div>

        <div className="space-y-2">
          {recurringTemplates.length === 0 ? (
            <p className="text-xs text-[#6b7280]">No recurring cards yet.</p>
          ) : (
            recurringTemplates.map((template) => (
              <div key={template.id} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#f0f0ff] truncate">{template.title}</p>
                    <p className="text-[11px] text-[#6b7280]">{template.category}</p>
                    <p className="text-[11px] text-[#9fded2] mt-0.5">{formatCurrency(template.amount)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateRecurringTemplate({
                          ...template,
                          active: !template.active,
                        })
                      }
                      className={`h-7 px-2 rounded-lg text-[10px] font-semibold ${
                        template.active
                          ? "bg-[rgba(0,201,167,0.18)] text-[#c8fff5]"
                          : "bg-white/10 text-white/65"
                      }`}
                    >
                      {template.active ? "Active" : "Inactive"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingRecurringId(template.id)}
                      className="size-7 rounded-lg border border-white/20 bg-white/[0.08] text-[#cde3df] inline-flex items-center justify-center"
                      title="Edit recurring card"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRecurringTemplate(template.id)}
                      className="size-7 rounded-lg border border-[rgba(255,140,66,0.35)] bg-[rgba(255,140,66,0.12)] text-[#FF8C42] inline-flex items-center justify-center"
                      title="Delete recurring card"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] p-4">
        <h4 className="text-sm font-bold text-[#f0f0ff] mb-3">Data</h4>
        <ExportButton />
      </div>

      <AddRecurringTemplateModal
        key={`settings-add-recurring-${isAddRecurringOpen ? "open" : "closed"}`}
        isOpen={isAddRecurringOpen}
        onClose={() => setIsAddRecurringOpen(false)}
      />
      <AddRecurringTemplateModal
        key={`settings-edit-recurring-${editingTemplate?.id ?? "none"}-${editingTemplate ? "open" : "closed"}`}
        isOpen={Boolean(editingTemplate)}
        initialTemplate={editingTemplate}
        onClose={() => setEditingRecurringId(null)}
      />
    </section>
  );
}
