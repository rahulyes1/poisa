export type TaxRegime = "new" | "old";

export interface TaxDeductionsInput {
  section80C: number;
  section80D: number;
  hra: number;
  section80CCD1B: number;
  homeLoanInterest24: number;
  otherDeductions: number;
}

export interface TaxInputs {
  annualGrossSalary: number;
  otherIncome: number;
  deductions: TaxDeductionsInput;
}

export interface SlabTaxBreakup {
  label: string;
  taxableAmount: number;
  rate: number;
  taxAmount: number;
}

export interface TaxComputationResult {
  regime: TaxRegime;
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  incomeTax: number;
  surcharge: number;
  rebate87A: number;
  cess: number;
  totalTax: number;
  effectiveRate: number | null;
  monthlyTds: number;
  monthlyInHand: number;
  slabBreakup: SlabTaxBreakup[];
  zeroTaxByRebate: boolean;
}

const clampNumber = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(value, 0);
};

const normalizeRupees = (value: number) => Number(clampNumber(value).toFixed(2));

const NEW_STANDARD_DEDUCTION = 75000;
const OLD_STANDARD_DEDUCTION = 50000;

const NEW_SLABS: Array<{ upperLimit: number; rate: number; label: string }> = [
  { upperLimit: 400000, rate: 0, label: "0 - 4,00,000" },
  { upperLimit: 800000, rate: 0.05, label: "4,00,001 - 8,00,000" },
  { upperLimit: 1200000, rate: 0.1, label: "8,00,001 - 12,00,000" },
  { upperLimit: 1600000, rate: 0.15, label: "12,00,001 - 16,00,000" },
  { upperLimit: 2000000, rate: 0.2, label: "16,00,001 - 20,00,000" },
  { upperLimit: 2400000, rate: 0.25, label: "20,00,001 - 24,00,000" },
  { upperLimit: Number.POSITIVE_INFINITY, rate: 0.3, label: "Above 24,00,000" },
];

const OLD_SLABS: Array<{ upperLimit: number; rate: number; label: string }> = [
  { upperLimit: 250000, rate: 0, label: "0 - 2,50,000" },
  { upperLimit: 500000, rate: 0.05, label: "2,50,001 - 5,00,000" },
  { upperLimit: 1000000, rate: 0.2, label: "5,00,001 - 10,00,000" },
  { upperLimit: Number.POSITIVE_INFINITY, rate: 0.3, label: "Above 10,00,000" },
];

const applySlabs = (
  taxableIncome: number,
  slabs: Array<{ upperLimit: number; rate: number; label: string }>,
) => {
  const normalizedIncome = clampNumber(taxableIncome);
  const breakup: SlabTaxBreakup[] = [];

  let previousLimit = 0;
  let incomeTax = 0;

  for (const slab of slabs) {
    if (normalizedIncome <= previousLimit) {
      breakup.push({
        label: slab.label,
        taxableAmount: 0,
        rate: slab.rate,
        taxAmount: 0,
      });
      previousLimit = slab.upperLimit;
      continue;
    }

    const slabUpper = slab.upperLimit;
    const amountInSlab = Math.max(Math.min(normalizedIncome, slabUpper) - previousLimit, 0);
    const slabTax = amountInSlab * slab.rate;
    breakup.push({
      label: slab.label,
      taxableAmount: normalizeRupees(amountInSlab),
      rate: slab.rate,
      taxAmount: normalizeRupees(slabTax),
    });
    incomeTax += slabTax;
    previousLimit = slabUpper;
  }

  return {
    incomeTax: normalizeRupees(incomeTax),
    breakup,
  };
};

const getSurcharge = (taxableIncome: number, incomeTax: number) => {
  if (taxableIncome > 10000000) {
    return normalizeRupees(incomeTax * 0.15);
  }
  if (taxableIncome > 5000000) {
    return normalizeRupees(incomeTax * 0.1);
  }
  return 0;
};

const normalizeDeductions = (input: TaxDeductionsInput): TaxDeductionsInput => ({
  section80C: Math.min(clampNumber(input.section80C), 150000),
  section80D: Math.min(clampNumber(input.section80D), 75000),
  hra: clampNumber(input.hra),
  section80CCD1B: Math.min(clampNumber(input.section80CCD1B), 50000),
  homeLoanInterest24: Math.min(clampNumber(input.homeLoanInterest24), 200000),
  otherDeductions: clampNumber(input.otherDeductions),
});

export const getCappedOldRegimeDeductions = (input: TaxDeductionsInput) => normalizeDeductions(input);

export const computeTaxForRegime = (
  rawInput: TaxInputs,
  regime: TaxRegime,
): TaxComputationResult => {
  const grossSalary = clampNumber(rawInput.annualGrossSalary);
  const otherIncome = clampNumber(rawInput.otherIncome);
  const grossIncome = normalizeRupees(grossSalary + otherIncome);

  const cappedOldDeductions = normalizeDeductions(rawInput.deductions);
  const regimeDeductions =
    regime === "new"
      ? NEW_STANDARD_DEDUCTION
      : OLD_STANDARD_DEDUCTION +
        cappedOldDeductions.section80C +
        cappedOldDeductions.section80D +
        cappedOldDeductions.hra +
        cappedOldDeductions.section80CCD1B +
        cappedOldDeductions.homeLoanInterest24 +
        cappedOldDeductions.otherDeductions;

  const totalDeductions = normalizeRupees(regimeDeductions);
  const taxableIncome = normalizeRupees(Math.max(grossIncome - totalDeductions, 0));

  const slabData = applySlabs(taxableIncome, regime === "new" ? NEW_SLABS : OLD_SLABS);
  const incomeTax = slabData.incomeTax;
  const surcharge = getSurcharge(taxableIncome, incomeTax);
  const taxAfterSurcharge = normalizeRupees(incomeTax + surcharge);

  let rebate87A = 0;
  if (regime === "new" && taxableIncome <= 1200000) {
    rebate87A = taxAfterSurcharge;
  }
  if (regime === "old" && taxableIncome <= 500000) {
    rebate87A = Math.min(taxAfterSurcharge, 12500);
  }
  rebate87A = normalizeRupees(rebate87A);

  const taxAfterRebate = normalizeRupees(Math.max(taxAfterSurcharge - rebate87A, 0));
  const cess = normalizeRupees(taxAfterRebate * 0.04);
  const totalTax = normalizeRupees(taxAfterRebate + cess);
  const monthlyTds = normalizeRupees(totalTax / 12);
  const monthlyInHand = normalizeRupees(grossIncome / 12 - monthlyTds);
  const effectiveRate = grossIncome > 0 ? Number(((totalTax / grossIncome) * 100).toFixed(2)) : null;

  return {
    regime,
    grossIncome,
    totalDeductions,
    taxableIncome,
    incomeTax,
    surcharge,
    rebate87A,
    cess,
    totalTax,
    effectiveRate,
    monthlyTds,
    monthlyInHand,
    slabBreakup: slabData.breakup,
    zeroTaxByRebate: totalTax <= 0 && rebate87A > 0,
  };
};

export const computeTaxComparison = (input: TaxInputs) => {
  const newRegime = computeTaxForRegime(input, "new");
  const oldRegime = computeTaxForRegime(input, "old");
  const winner = newRegime.totalTax <= oldRegime.totalTax ? "new" : "old";
  const savings = normalizeRupees(Math.abs(newRegime.totalTax - oldRegime.totalTax));

  return {
    newRegime,
    oldRegime,
    winner,
    savings,
  };
};
