"use client";

import { FormEvent, useMemo, useState } from "react";
import ChipButton from "../forms/ChipButton";
import ChipScroller from "../forms/ChipScroller";
import ExpandableSection from "../forms/ExpandableSection";
import { INSURANCE_PRODUCTS, INSURANCE_PROVIDERS, INSURANCE_TYPES, InsuranceTypeLabel } from "../forms/data/formData";
import { formatInr, today, toNumber } from "../forms/formUtils";
import { useFinanceStore } from "../shared/store";

interface AddLifeInsuranceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getRenewalMeta = (renewalDate: string, monthlyAmount: number) => {
  if (!renewalDate) return "";
  const now = new Date();
  const renewal = new Date(`${renewalDate}T00:00:00`);
  if (Number.isNaN(renewal.getTime())) return "";
  const diffDays = Math.max(Math.ceil((renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)), 0);
  return `Renews in ${diffDays} days · ${formatInr(monthlyAmount)}/mo equivalent`;
};

export default function AddLifeInsuranceModal({ isOpen, onClose }: AddLifeInsuranceModalProps) {
  const addLifeInsurance = useFinanceStore((state) => state.addLifeInsurance);

  const [insuranceType, setInsuranceType] = useState<InsuranceTypeLabel>("Health");
  const [provider, setProvider] = useState("");
  const [customProvider, setCustomProvider] = useState("");
  const [product, setProduct] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [premiumAmount, setPremiumAmount] = useState("");
  const [premiumFrequency, setPremiumFrequency] = useState<"monthly" | "yearly">("yearly");
  const [renewalDate, setRenewalDate] = useState("");
  const [coverageAmount, setCoverageAmount] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [startDate, setStartDate] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const providers = INSURANCE_PROVIDERS[insuranceType];
  const productOptions = useMemo(() => {
    const key = `${provider}|${insuranceType}`;
    return INSURANCE_PRODUCTS[key] ?? [];
  }, [insuranceType, provider]);

  const premiumValue = toNumber(premiumAmount);
  const monthlyAmount =
    premiumFrequency === "yearly"
      ? Number((premiumValue / 12).toFixed(2))
      : premiumValue;

  const renewalMeta = getRenewalMeta(renewalDate, monthlyAmount);
  const showProductRow = provider && provider !== "Other" && productOptions.length > 0;

  const resetDependentSelections = (nextType?: InsuranceTypeLabel) => {
    setProvider("");
    setCustomProvider("");
    setProduct("");
    setSelectedProduct("");
    if (nextType) {
      setInsuranceType(nextType);
    }
  };

  if (!isOpen) return null;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const resolvedProvider = provider === "Other" ? customProvider.trim() : provider.trim();
    const resolvedPlan = (product.trim() || selectedProduct.trim() || `${insuranceType} Insurance`).trim();

    if (!resolvedProvider || !monthlyAmount || monthlyAmount <= 0) {
      return;
    }

    addLifeInsurance({
      providerName: resolvedProvider,
      planName: resolvedPlan,
      monthlyAmount,
      dueDate: renewalDate || today(),
      paid: false,
      note: "",
    });

    onClose();
  };

  return (
    <div className="poisa-form-overlay flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="poisa-form-panel w-full sm:max-w-[480px] h-[100dvh] sm:h-auto sm:max-h-[92dvh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-[#0d1117] border-b border-[#2d333b] px-4 py-3 flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-[#7d8590]">
            Cancel
          </button>
          <h2 className="text-base font-semibold text-[#e6edf3]">Add Insurance</h2>
          <span className="w-10" />
        </div>

        <form onSubmit={onSubmit} className="px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+20px)] space-y-4">
          <section className="space-y-2">
            <p className="text-xs uppercase tracking-wide poisa-muted">Insurance Type</p>
            <ChipScroller>
              {INSURANCE_TYPES.map((item) => (
                <ChipButton
                  key={item.label}
                  compact
                  accent="teal"
                  active={insuranceType === item.label}
                  onClick={() => resetDependentSelections(item.label)}
                >
                  {item.emoji} {item.label}
                </ChipButton>
              ))}
            </ChipScroller>
          </section>

          <section className="space-y-2">
            <p className="text-sm text-[#e6edf3]">Provider</p>
            <ChipScroller>
              {providers.map((item) => (
                <ChipButton
                  key={item}
                  compact
                  accent="teal"
                  active={provider === item}
                  onClick={() => {
                    setProvider(item);
                    setCustomProvider("");
                    setSelectedProduct("");
                    setProduct("");
                  }}
                >
                  {item}
                </ChipButton>
              ))}
            </ChipScroller>
            {provider === "Other" && (
              <input
                type="text"
                value={customProvider}
                onChange={(event) => setCustomProvider(event.target.value)}
                placeholder="Type provider name"
                className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161b22] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#00e5a0]"
              />
            )}
          </section>

          {(showProductRow || provider) && (
            <section className="space-y-2">
              <p className="text-sm text-[#e6edf3]">
                Product <span className="poisa-muted text-xs">(optional)</span>
              </p>
              {showProductRow && (
                <ChipScroller>
                  {productOptions.map((item) => (
                    <ChipButton
                      key={item}
                      compact
                      accent="teal"
                      active={selectedProduct === item}
                      onClick={() => {
                        setSelectedProduct(item);
                        setProduct(item);
                      }}
                    >
                      {item}
                    </ChipButton>
                  ))}
                </ChipScroller>
              )}
              <input
                type="text"
                value={product}
                onChange={(event) => {
                  setProduct(event.target.value);
                  if (selectedProduct && selectedProduct !== event.target.value) {
                    setSelectedProduct("");
                  }
                }}
                placeholder="Product name (optional)"
                className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161b22] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#00e5a0]"
              />
            </section>
          )}

          <section className="space-y-2">
            <p className="text-sm text-[#e6edf3]">Premium Amount (₹)</p>
            <input
              type="text"
              inputMode="decimal"
              value={premiumAmount}
              onChange={(event) => setPremiumAmount(event.target.value.replace(/[^\d.]/g, ""))}
              placeholder="e.g. 12,000"
              className="w-full h-12 rounded-xl border border-[#2d333b] bg-[#161b22] px-3 text-base text-[#e6edf3] outline-none focus:border-[#00e5a0]"
              required
            />
            <div className="flex items-center gap-2">
              <ChipButton
                compact
                accent="teal"
                active={premiumFrequency === "monthly"}
                onClick={() => setPremiumFrequency("monthly")}
              >
                Monthly
              </ChipButton>
              <ChipButton
                compact
                accent="teal"
                active={premiumFrequency === "yearly"}
                onClick={() => setPremiumFrequency("yearly")}
              >
                Yearly
              </ChipButton>
            </div>
          </section>

          <button
            type="button"
            onClick={() => setIsMoreOpen((prev) => !prev)}
            className="poisa-dashed-row w-full h-11 px-3 flex items-center justify-between text-sm"
          >
            <span className="text-[#c6d0dc]">{isMoreOpen ? "— Less details" : "＋ More details"}</span>
            <span className="material-symbols-outlined text-[#7d8590]">{isMoreOpen ? "expand_less" : "expand_more"}</span>
          </button>

          <ExpandableSection open={isMoreOpen}>
            <div className="poisa-card p-3 space-y-3">
              <label className="block space-y-1">
                <span className="text-xs poisa-muted">Renewal Date</span>
                <input
                  type="date"
                  value={renewalDate}
                  onChange={(event) => setRenewalDate(event.target.value)}
                  className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#00e5a0]"
                />
              </label>

              {renewalMeta && (
                <div className="rounded-xl border border-[rgba(0,229,160,0.35)] bg-[rgba(0,229,160,0.08)] px-3 py-2 text-xs text-[#86ffd6]">
                  {renewalMeta}
                </div>
              )}

              <label className="block space-y-1">
                <span className="text-xs poisa-muted">Coverage Amount (₹)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={coverageAmount}
                  onChange={(event) => setCoverageAmount(event.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="Sum insured"
                  className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#00e5a0]"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs poisa-muted">Policy Number</span>
                <input
                  type="text"
                  value={policyNumber}
                  onChange={(event) => setPolicyNumber(event.target.value)}
                  placeholder="Optional"
                  className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#00e5a0]"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs poisa-muted">Start Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#00e5a0]"
                />
              </label>

              <label className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[#e6edf3]">🔔 Renewal reminder</p>
                  <p className="text-xs poisa-muted">30 days before due date</p>
                </div>
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(event) => setReminderEnabled(event.target.checked)}
                  className="size-4 accent-[#00e5a0]"
                />
              </label>
            </div>
          </ExpandableSection>

          <button type="submit" className="w-full h-12 rounded-xl bg-[#00e5a0] text-[#062a1f] font-semibold">
            Save Insurance
          </button>
        </form>
      </div>
    </div>
  );
}
