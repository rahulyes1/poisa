"use client";

import { FormEvent, useMemo, useState } from "react";
import AmountDisplayInput from "../forms/AmountDisplayInput";
import ChipButton from "../forms/ChipButton";
import ChipScroller from "../forms/ChipScroller";
import ExpandableSection from "../forms/ExpandableSection";
import {
  FD_PRODUCTS,
  INVESTMENT_PRODUCTS,
  INVESTMENT_PROVIDERS,
  INVESTMENT_TYPES,
  InvestmentTypeLabel,
  RD_PRODUCTS,
} from "../forms/data/formData";
import { formatInr, monthDiff, today, toNumber } from "../forms/formUtils";
import { useFinanceStore } from "../shared/store";

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type InvestmentMode = "sip" | "lumpsum";

const getAmountLabel = (type: InvestmentTypeLabel, mode: InvestmentMode) => {
  if (type === "Mutual Fund" && mode === "sip") return "SIP Amount (₹)";
  if ((type === "Mutual Fund" && mode === "lumpsum") || (type === "Stocks" && mode === "lumpsum") || (type === "Crypto" && mode === "lumpsum")) {
    return "Invested Amount (₹)";
  }
  if (type === "FD" || type === "Bonds" || type === "Real Estate") return "Deposit / Investment Amount (₹)";
  if (type === "RD") return "Monthly Amount (₹)";
  if (type === "PPF/EPF" || type === "NPS") return "Contribution Amount (₹)";
  return "Invested Amount (₹)";
};

const modeVisible = (type: InvestmentTypeLabel) => ["Mutual Fund", "Stocks", "Crypto"].includes(type);
const showRateTenureFields = (type: InvestmentTypeLabel) => ["FD", "RD", "Bonds", "PPF/EPF"].includes(type);
const showUnitsField = (type: InvestmentTypeLabel) => ["Stocks", "Gold", "Crypto"].includes(type);

const getUnitsLabel = (type: InvestmentTypeLabel) => {
  if (type === "Stocks") return "No. of Shares";
  if (type === "Gold") return "Quantity (grams)";
  return "Coins / Tokens";
};

const getTenureLabel = (type: InvestmentTypeLabel) => {
  if (type === "RD") return "Tenure (months)";
  if (type === "PPF/EPF") return "Years Left";
  return "Tenure";
};

export default function AddInvestmentModal({ isOpen, onClose }: AddInvestmentModalProps) {
  const addInvestment = useFinanceStore((state) => state.addInvestment);

  const [investmentType, setInvestmentType] = useState<InvestmentTypeLabel>("Mutual Fund");
  const [provider, setProvider] = useState("");
  const [customProvider, setCustomProvider] = useState("");
  const [productName, setProductName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [mode, setMode] = useState<InvestmentMode>("sip");
  const [amount, setAmount] = useState("");
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [unitsQuantity, setUnitsQuantity] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [tenureValue, setTenureValue] = useState("");
  const [tenureUnit, setTenureUnit] = useState<"months" | "years">("months");
  const [maturityDate, setMaturityDate] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [notes, setNotes] = useState("");

  const providers = INVESTMENT_PROVIDERS[investmentType];
  const amountValue = toNumber(amount);
  const providerValue = provider === "Other" ? customProvider.trim() : provider.trim();

  const productChips = useMemo(() => {
    if (investmentType === "Mutual Fund" && provider && provider !== "Other") {
      return INVESTMENT_PRODUCTS[`Mutual Fund|${provider}`] ?? [];
    }
    if (investmentType === "FD") {
      return FD_PRODUCTS;
    }
    if (investmentType === "RD") {
      return RD_PRODUCTS;
    }
    return [];
  }, [investmentType, provider]);

  const showChipRow = productChips.length > 0 && ((investmentType === "Mutual Fund" && provider && provider !== "Other") || investmentType === "FD" || investmentType === "RD");

  const amountLabel = getAmountLabel(investmentType, mode);
  const headerAddLabel = amountValue > 0 ? `Add ${formatInr(amountValue)}` : "Add";
  const submitLabel =
    amountValue > 0 && productName.trim()
      ? `Add ${formatInr(amountValue)} · ${productName.trim()}`
      : amountValue > 0
        ? `Add ${formatInr(amountValue)} Investment`
        : "Add Investment";

  const maturityValue = useMemo(() => {
    if (!showRateTenureFields(investmentType)) return 0;
    const principal = amountValue;
    const rate = toNumber(interestRate);
    if (principal <= 0 || rate <= 0 || !maturityDate) return 0;
    const n = monthDiff(today(), maturityDate);
    if (n <= 0) return 0;
    return principal * Math.pow(1 + rate / 1200, n);
  }, [amountValue, interestRate, investmentType, maturityDate]);

  if (!isOpen) return null;

  const resetTypeDependentFields = (nextType: InvestmentTypeLabel) => {
    setInvestmentType(nextType);
    setProvider("");
    setCustomProvider("");
    setProductName("");
    setSelectedProduct("");
    setMode(nextType === "Mutual Fund" ? "sip" : "lumpsum");
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = toNumber(amount);
    if (parsedAmount <= 0) {
      return;
    }

    addInvestment({
      title: productName.trim() || providerValue || investmentType,
      category: investmentType,
      amount: parsedAmount,
      date: startDate || today(),
      note: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="poisa-form-overlay flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="poisa-form-panel w-full sm:max-w-[500px] h-[100dvh] sm:h-auto sm:max-h-[92dvh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-[#0d1117] border-b border-[#2d333b] px-4 py-3 flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-[#7d8590]">
            Cancel
          </button>
          <h2 className="text-base font-semibold text-[#e6edf3]">Add Investment</h2>
          <button type="submit" form="add-investment-form" className="text-sm font-semibold text-[#4d9fff]">
            {headerAddLabel}
          </button>
        </div>

        <form id="add-investment-form" onSubmit={onSubmit} className="px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+20px)] space-y-4">
          <section className="space-y-2">
            <p className="text-xs uppercase tracking-wide poisa-muted">Investment Type</p>
            <ChipScroller>
              {INVESTMENT_TYPES.map((item) => (
                <ChipButton
                  key={item.label}
                  compact
                  accent="blue"
                  active={investmentType === item.label}
                  onClick={() => resetTypeDependentFields(item.label)}
                >
                  {item.emoji} {item.label}
                </ChipButton>
              ))}
            </ChipScroller>
          </section>

          <section className="space-y-2">
            <p className="text-sm text-[#e6edf3]">Platform / Provider</p>
            <ChipScroller>
              {providers.map((item) => (
                <ChipButton
                  key={item}
                  compact
                  accent="blue"
                  active={provider === item}
                  onClick={() => {
                    setProvider(item);
                    setCustomProvider("");
                    setProductName("");
                    setSelectedProduct("");
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
                placeholder="Type custom provider"
                className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#161b22] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#4d9fff]"
              />
            )}
          </section>

          <section className="space-y-2">
            <p className="text-sm text-[#e6edf3]">
              Product Name <span className="poisa-muted text-xs">(optional)</span>
            </p>
            {showChipRow && (
              <ChipScroller>
                {productChips.map((item) => (
                  <ChipButton
                    key={item}
                    compact
                    accent="blue"
                    active={selectedProduct === item}
                    onClick={() => {
                      setSelectedProduct(item);
                      setProductName(item);
                    }}
                  >
                    {item}
                  </ChipButton>
                ))}
              </ChipScroller>
            )}
            <input
              type="text"
              value={productName}
              onChange={(event) => {
                setProductName(event.target.value);
                if (selectedProduct && selectedProduct !== event.target.value) {
                  setSelectedProduct("");
                }
              }}
              placeholder="Type product name"
              className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#161b22] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#4d9fff]"
            />
          </section>

          {modeVisible(investmentType) && (
            <section className="space-y-2">
              <p className="text-sm text-[#e6edf3]">Investment Mode</p>
              <div className="grid grid-cols-2 gap-2">
                <ChipButton compact accent="blue" active={mode === "sip"} onClick={() => setMode("sip")}>
                  📅 SIP / Monthly
                </ChipButton>
                <ChipButton compact accent="blue" active={mode === "lumpsum"} onClick={() => setMode("lumpsum")}>
                  💰 Lumpsum
                </ChipButton>
              </div>
            </section>
          )}

          <section className="space-y-2">
            <p className="text-sm text-[#e6edf3]">{amountLabel}</p>
            <AmountDisplayInput
              accent="blue"
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0"
            />
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
                <span className="text-xs poisa-muted">Start Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#4d9fff]"
                />
              </label>

              {showUnitsField(investmentType) && (
                <label className="block space-y-1">
                  <span className="text-xs poisa-muted">{getUnitsLabel(investmentType)}</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={unitsQuantity}
                    onChange={(event) => setUnitsQuantity(event.target.value.replace(/[^\d.]/g, ""))}
                    className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#4d9fff]"
                  />
                </label>
              )}

              {showRateTenureFields(investmentType) && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block space-y-1">
                      <span className="text-xs poisa-muted">Interest Rate %</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={interestRate}
                        onChange={(event) => setInterestRate(event.target.value.replace(/[^\d.]/g, ""))}
                        className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#4d9fff]"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs poisa-muted">{getTenureLabel(investmentType)}</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={tenureValue}
                          onChange={(event) => setTenureValue(event.target.value.replace(/[^\d.]/g, ""))}
                          className="flex-1 h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#4d9fff]"
                        />
                        <ChipButton
                          compact
                          accent="blue"
                          active={tenureUnit === "months"}
                          onClick={() => setTenureUnit("months")}
                        >
                          Months
                        </ChipButton>
                        <ChipButton compact accent="blue" active={tenureUnit === "years"} onClick={() => setTenureUnit("years")}>
                          Years
                        </ChipButton>
                      </div>
                    </label>
                  </div>

                  <label className="block space-y-1">
                    <span className="text-xs poisa-muted">Maturity Date</span>
                    <input
                      type="date"
                      value={maturityDate}
                      onChange={(event) => setMaturityDate(event.target.value)}
                      className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#4d9fff]"
                    />
                  </label>
                </>
              )}

              {maturityValue > 0 && (
                <div className="rounded-xl border border-[rgba(77,159,255,0.4)] bg-[rgba(77,159,255,0.12)] px-3 py-2 text-xs text-[#9ec8ff]">
                  Estimated maturity value: {formatInr(maturityValue)}
                </div>
              )}

              <label className="block space-y-1">
                <span className="text-xs poisa-muted">Account / Folio Number</span>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(event) => setAccountNumber(event.target.value)}
                  className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#4d9fff]"
                />
              </label>

              <label className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[#e6edf3]">🔔 Investment reminder</p>
                  <p className="text-xs poisa-muted">Notify on SIP / due dates</p>
                </div>
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(event) => setReminderEnabled(event.target.checked)}
                  className="size-4 accent-[#4d9fff]"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs poisa-muted">Notes</span>
                <input
                  type="text"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#4d9fff]"
                />
              </label>
            </div>
          </ExpandableSection>

          <button type="submit" className="w-full h-12 rounded-xl bg-[#4d9fff] text-[#051a35] font-semibold">
            {submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
