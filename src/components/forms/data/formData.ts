export const EXPENSE_QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000];

export const EXPENSE_CATEGORIES = [
  { emoji: "🍔", label: "Food", icon: "restaurant" },
  { emoji: "⛽", label: "Fuel", icon: "local_gas_station" },
  { emoji: "🛒", label: "Groceries", icon: "local_grocery_store" },
  { emoji: "💊", label: "Health", icon: "medical_services" },
  { emoji: "🏠", label: "Bills", icon: "receipt_long" },
  { emoji: "✈️", label: "Travel", icon: "flight" },
  { emoji: "🎬", label: "Fun", icon: "movie" },
  { emoji: "🚕", label: "Transport", icon: "directions_car" },
  { emoji: "☕", label: "Cafe", icon: "coffee" },
  { emoji: "🍰", label: "Snacks", icon: "bakery_dining" },
  { emoji: "🏪", label: "Daily Needs", icon: "storefront" },
  { emoji: "🧾", label: "Utilities", icon: "bolt" },
  { emoji: "📱", label: "Recharge", icon: "smartphone" },
  { emoji: "🎓", label: "Education", icon: "school" },
  { emoji: "🛍️", label: "Shopping", icon: "shopping_bag" },
  { emoji: "🏋️", label: "Fitness", icon: "fitness_center" },
  { emoji: "👨‍👩‍👧", label: "Family", icon: "family_restroom" },
  { emoji: "🐶", label: "Pets", icon: "pets" },
  { emoji: "💼", label: "Work", icon: "work" },
  { emoji: "💅", label: "Personal Care", icon: "spa" },
  { emoji: "🎁", label: "Gifts", icon: "redeem" },
  { emoji: "🧘", label: "Wellness", icon: "self_improvement" },
];

export const CATEGORY_EMOJIS = [
  "🍔",
  "☕",
  "🥗",
  "🍕",
  "🚕",
  "🚌",
  "⛽",
  "🛒",
  "🧺",
  "💊",
  "🏠",
  "💡",
  "📶",
  "🎬",
  "🎮",
  "✈️",
  "🏖️",
  "🎓",
  "👕",
  "💻",
];

export const CONTACT_CHIP_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1"];

export const INSURANCE_TYPES = [
  { emoji: "🏥", label: "Health" },
  { emoji: "🚗", label: "Vehicle" },
  { emoji: "💼", label: "Life" },
  { emoji: "🏠", label: "Home" },
  { emoji: "✈️", label: "Travel" },
  { emoji: "📱", label: "Device" },
  { emoji: "➕", label: "Other" },
] as const;

export type InsuranceTypeLabel = (typeof INSURANCE_TYPES)[number]["label"];

export const INSURANCE_PROVIDERS: Record<InsuranceTypeLabel, string[]> = {
  Health: [
    "HDFC ERGO",
    "Star Health",
    "Niva Bupa",
    "Care Health",
    "Aditya Birla Health",
    "ICICI Lombard",
    "Bajaj Allianz",
    "ManipalCigna",
    "New India",
    "United India",
    "Other",
  ],
  Vehicle: [
    "HDFC ERGO",
    "Bajaj Allianz",
    "ICICI Lombard",
    "New India",
    "Tata AIG",
    "Reliance General",
    "Royal Sundaram",
    "Digit Insurance",
    "Other",
  ],
  Life: [
    "LIC",
    "HDFC Life",
    "ICICI Prudential",
    "SBI Life",
    "Max Life",
    "Bajaj Allianz Life",
    "Tata AIA",
    "Kotak Life",
    "Aditya Birla Sun Life",
    "Other",
  ],
  Home: ["HDFC ERGO", "Bajaj Allianz", "ICICI Lombard", "New India", "Tata AIG", "Other"],
  Travel: ["HDFC ERGO", "Bajaj Allianz", "ICICI Lombard", "Tata AIG", "Care Health", "Reliance General", "Other"],
  Device: ["Bajaj Allianz", "Digit Insurance", "Syska", "OneAssist", "Other"],
  Other: ["Other"],
};

export const INSURANCE_PRODUCTS: Record<string, string[]> = {
  "HDFC ERGO|Health": ["Optima Secure", "Optima Restore", "My:health Suraksha", "My:health Women Suraksha"],
  "Star Health|Health": ["Comprehensive", "Family Health Optima", "Senior Citizens Red Carpet", "Assure"],
  "Niva Bupa|Health": ["ReAssure 2.0", "Health Premia", "GoActive", "MoneyBack"],
  "LIC|Life": ["Jeevan Anand", "Jeevan Umang", "Tech Term", "New Jeevan Amar"],
  "HDFC Life|Life": ["Click 2 Protect", "Sanchay Plus", "Sampoorn Nivesh"],
  "ICICI Prudential|Life": ["iProtect Smart", "Signature", "Guaranteed Income"],
};

export const GOAL_TYPES = [
  { emoji: "🛡️", label: "Emergency Fund", icon: "shield" },
  { emoji: "🏖️", label: "Vacation", icon: "beach_access" },
  { emoji: "🏠", label: "Home", icon: "home" },
  { emoji: "🚗", label: "Vehicle", icon: "directions_car" },
  { emoji: "📱", label: "Gadget", icon: "smartphone" },
  { emoji: "🎓", label: "Education", icon: "school" },
  { emoji: "💍", label: "Wedding", icon: "diamond" },
  { emoji: "👶", label: "Child", icon: "child_friendly" },
  { emoji: "📈", label: "Wealth", icon: "trending_up" },
  { emoji: "➕", label: "Custom", icon: "flag" },
] as const;

export type GoalTypeLabel = (typeof GOAL_TYPES)[number]["label"];

export const GOAL_SUGGESTIONS: Record<GoalTypeLabel, string[]> = {
  "Emergency Fund": ["Emergency Fund", "3 Month Buffer", "6 Month Safety Net", "Medical Emergency Fund"],
  Vacation: ["Goa Trip", "Europe Trip", "Family Vacation", "Honeymoon Fund", "Hill Station Trip", "International Holiday"],
  Home: ["Home Down Payment", "Home Renovation", "New Flat Fund", "Interior Budget"],
  Vehicle: ["Buy a Bike", "Buy a Car", "Two Wheeler Fund", "Car Down Payment"],
  Gadget: ["New iPhone", "MacBook Fund", "New Laptop", "Home Theatre Setup"],
  Education: ["MBA Fund", "Kids School Fees", "Online Course Budget", "UPSC Preparation"],
  Wedding: ["Wedding Fund", "Reception Budget", "Jewellery Fund", "Wedding Venue"],
  Child: ["Child Education Fund", "Child Future Fund", "Kids Activity Fund"],
  Wealth: ["Long Term Wealth", "Stock Market Fund", "Mutual Fund Goal", "FD Target"],
  Custom: [],
};

export const GOAL_QUICK_AMOUNTS = [10000, 25000, 50000, 100000, 500000];

export const INVESTMENT_TYPES = [
  { emoji: "📊", label: "Mutual Fund" },
  { emoji: "📈", label: "Stocks" },
  { emoji: "🏦", label: "FD" },
  { emoji: "🔁", label: "RD" },
  { emoji: "🥇", label: "Gold" },
  { emoji: "🛡️", label: "PPF/EPF" },
  { emoji: "👴", label: "NPS" },
  { emoji: "₿", label: "Crypto" },
  { emoji: "🏠", label: "Real Estate" },
  { emoji: "📜", label: "Bonds" },
] as const;

export type InvestmentTypeLabel = (typeof INVESTMENT_TYPES)[number]["label"];

export const INVESTMENT_PROVIDERS: Record<InvestmentTypeLabel, string[]> = {
  "Mutual Fund": ["Zerodha Coin", "Groww", "Paytm Money", "ET Money", "MFCentral", "HDFC MF", "SBI MF", "ICICI Pru MF", "Axis MF", "Mirae Asset", "Other"],
  Stocks: ["Zerodha", "Groww", "Upstox", "Angel One", "ICICI Direct", "HDFC Securities", "Motilal Oswal", "5Paisa", "Other"],
  FD: ["SBI", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Bank", "PNB", "Bank of Baroda", "Bajaj Finance FD", "Shriram Finance", "Other"],
  RD: ["SBI", "HDFC Bank", "ICICI Bank", "Post Office", "Axis Bank", "Kotak Bank", "Other"],
  Gold: ["Zerodha Gold", "Groww Gold", "PhonePe Gold", "Google Pay Gold", "Paytm Gold", "Sovereign Gold Bond", "Physical Gold", "Other"],
  "PPF/EPF": ["SBI PPF", "Post Office PPF", "HDFC PPF", "ICICI PPF", "EPFO", "Other"],
  NPS: ["SBI Pension", "LIC Pension", "HDFC Pension", "ICICI Pru Pension", "Kotak Pension", "UTI Retirement", "Other"],
  Crypto: ["CoinDCX", "WazirX", "Mudrex", "CoinSwitch", "Binance", "Other"],
  "Real Estate": ["Own Property", "REITs", "Fractional Ownership", "Other"],
  Bonds: ["RBI Bonds", "Zerodha Bonds", "Wint Wealth", "GoldenPi", "IndiaBonds", "Other"],
};

export const INVESTMENT_PRODUCTS: Record<string, string[]> = {
  "Mutual Fund|Zerodha Coin": ["Nifty 50 Index Fund", "Nifty Next 50", "ELSS Tax Saver", "Liquid Fund"],
  "Mutual Fund|Groww": ["Nifty 50 Index", "S&P 500 FoF", "Flexi Cap Fund", "ELSS Fund"],
  "Mutual Fund|HDFC MF": ["HDFC Top 100", "HDFC Mid-Cap", "HDFC ELSS", "HDFC Liquid"],
  "Mutual Fund|SBI MF": ["SBI Bluechip", "SBI Small Cap", "SBI ELSS", "SBI Liquid"],
  "Mutual Fund|ICICI Pru MF": ["ICICI Pru Bluechip", "ICICI Pru Value Discovery", "ICICI Pru ELSS"],
  "Mutual Fund|Axis MF": ["Axis Bluechip", "Axis Small Cap", "Axis ELSS", "Axis Liquid"],
  "Mutual Fund|Mirae Asset": ["Mirae Large Cap", "Mirae Emerging Bluechip", "Mirae ELSS"],
};

export const FD_PRODUCTS = ["Regular FD", "Tax Saver FD (5yr)", "Senior Citizen FD", "Corporate FD", "Flexi FD"];
export const RD_PRODUCTS = ["Regular RD", "Post Office RD", "Bank RD"];

export const LENDING_QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];
export const RETURN_WINDOW_OPTIONS = ["1 week", "1 month", "3 months", "No rush"] as const;

export const LOAN_CATEGORIES = [
  { emoji: "🏦", label: "Bank" },
  { emoji: "📱", label: "App Loan" },
  { emoji: "💳", label: "Credit Card" },
  { emoji: "🏢", label: "NBFC" },
  { emoji: "🥇", label: "Gold Loan" },
  { emoji: "➕", label: "Other" },
] as const;

export type LoanCategoryLabel = (typeof LOAN_CATEGORIES)[number]["label"];

export const LOAN_TYPE_BY_CATEGORY: Record<LoanCategoryLabel, string[]> = {
  Bank: ["Home Loan", "Car Loan", "Personal Loan", "Education Loan", "Business Loan", "Two Wheeler Loan", "Consumer Durable Loan"],
  "App Loan": ["Personal Loan", "Buy Now Pay Later", "Salary Advance", "Short Term Loan"],
  "Credit Card": ["Credit Card EMI", "Card Outstanding"],
  NBFC: ["Home Loan", "Car Loan", "Personal Loan", "Education Loan", "Business Loan"],
  "Gold Loan": ["Gold Loan"],
  Other: ["Personal Loan", "Other"],
};

export const LOAN_LENDER_PLACEHOLDERS: Record<LoanCategoryLabel, string> = {
  Bank: "e.g. HDFC Bank, SBI, ICICI",
  "App Loan": "e.g. Slice, KreditBee, MoneyTap",
  "Credit Card": "e.g. HDFC Credit Card, Axis Flipkart",
  NBFC: "e.g. Bajaj Finance, Tata Capital",
  "Gold Loan": "e.g. Muthoot Finance, Manappuram",
  Other: "Lender name",
};
