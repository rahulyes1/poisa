"use client";

const iconOptions = [
  "restaurant",
  "directions_car",
  "local_grocery_store",
  "flight",
  "medical_services",
  "home",
  "sports_esports",
  "school",
  "shopping_bag",
  "coffee",
  "fitness_center",
  "movie",
  "music_note",
  "pets",
  "phone_android",
  "wifi",
  "electric_bolt",
  "construction",
  "celebration",
  "spa",
  "card_giftcard",
  "work",
  "savings",
  "receipt_long",
];

interface CategoryIconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export default function CategoryIconPicker({ value, onChange }: CategoryIconPickerProps) {
  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] p-2 max-h-40 overflow-y-auto">
      <div className="grid grid-cols-6 gap-2">
        {iconOptions.map((icon) => {
          const selected = value === icon;
          return (
            <button
              key={icon}
              type="button"
              onClick={() => onChange(icon)}
              className={`h-10 rounded-lg border transition-colors flex items-center justify-center ${
                selected
                  ? "border-[rgba(0,201,167,0.8)] bg-[rgba(0,201,167,0.2)] text-[#f0f0ff]"
                  : "border-[rgba(255,255,255,0.08)] bg-[#111118] text-[#6b7280]"
              }`}
              title={icon}
            >
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

