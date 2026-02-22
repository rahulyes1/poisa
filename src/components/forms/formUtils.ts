export const today = () => new Date().toISOString().slice(0, 10);

export const toNumber = (value: string) => {
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned) return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatInr = (value: number) => {
  if (!Number.isFinite(value)) return "₹0";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
};

export const addDays = (dateString: string, days: number) => {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export const monthDiff = (fromDate: string, toDate: string) => {
  const from = new Date(`${fromDate}T00:00:00`);
  const to = new Date(`${toDate}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) {
    return 0;
  }
  const years = to.getFullYear() - from.getFullYear();
  const months = to.getMonth() - from.getMonth();
  const days = to.getDate() - from.getDate();
  const total = years * 12 + months + (days > 0 ? 1 : 0);
  return Math.max(total, 0);
};

export const initialsFromName = (name: string) => {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) return "?";
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
};
