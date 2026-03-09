"use client";

import { FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Expense, RecurringTemplate, SpendingTodo } from "../shared/types";
import { useFinanceStore } from "../shared/store";
import { useCurrency } from "../shared/useCurrency";
import AddRecurringTemplateModal from "./AddRecurringTemplateModal";
import BottomSheet from "../forms/BottomSheet";

const toDisplayDate = (date: string) => {
  const current = new Date();
  const value = new Date(`${date}T00:00:00`);
  const today = new Date(current.getFullYear(), current.getMonth(), current.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const target = new Date(value.getFullYear(), value.getMonth(), value.getDate());

  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === yesterday.getTime()) return "Yesterday";
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const toMonthTitle = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

const toOrdinal = (value: number) => {
  const v = Math.abs(Math.round(value));
  const mod100 = v % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${v}th`;
  const mod10 = v % 10;
  if (mod10 === 1) return `${v}st`;
  if (mod10 === 2) return `${v}nd`;
  if (mod10 === 3) return `${v}rd`;
  return `${v}th`;
};

function getCategoryAccentColor(category: string): string {
  const key = category.toLowerCase().trim();
  if (key.includes("fuel") || key.includes("petrol") || key.includes("diesel")) return "#ff5b5b";
  if (key.includes("alcohol") || key.includes("liquor") || key.includes("bar")) return "#ff5b5b";
  if (
    key.includes("bill") ||
    key.includes("rent") ||
    key.includes("electric") ||
    key.includes("utilit") ||
    key.includes("recharge") ||
    key.includes("lpg") ||
    key.includes("gas") ||
    key.includes("water") ||
    key.includes("society") ||
    key.includes("maintenance") ||
    key.includes("broadband") ||
    key.includes("wifi") ||
    key.includes("dth") ||
    key.includes("ott")
  ) {
    return "#ffb347";
  }
  if (
    key.includes("food") ||
    key.includes("eat") ||
    key.includes("dining") ||
    key.includes("restaurant") ||
    key.includes("grocer") ||
    key.includes("kirana") ||
    key.includes("street food") ||
    key.includes("dhaba") ||
    key.includes("tapri") ||
    key.includes("chai") ||
    key.includes("coffee") ||
    key.includes("snack")
  ) {
    return "#00e5a0";
  }
  if (
    key.includes("pooja") ||
    key.includes("temple") ||
    key.includes("mandir") ||
    key.includes("house help") ||
    key.includes("maid") ||
    key.includes("laundry") ||
    key.includes("dhobi") ||
    key.includes("function") ||
    key.includes("event") ||
    key.includes("wedding") ||
    key.includes("parlour") ||
    key.includes("salon")
  ) {
    return "#8B5CF6";
  }
  return "#38BDF8";
}

function getCategoryEmoji(category: string): string {
  const key = category.toLowerCase().trim();
  if (key.includes("fuel") || key.includes("petrol") || key.includes("diesel")) return "⛽";
  if (key.includes("alcohol") || key.includes("liquor") || key.includes("bar")) return "🍺";
  if (key.includes("bill") || key.includes("rent")) return "🧾";
  if (key.includes("electric")) return "🔌";
  if (key.includes("lpg") || key.includes("gas cylinder")) return "🛢️";
  if (key.includes("water bill") || key.includes("water")) return "💧";
  if (key.includes("society") || key.includes("maintenance")) return "🏢";
  if (key.includes("broadband") || key.includes("wifi")) return "📡";
  if (key.includes("dth") || key.includes("ott")) return "📺";
  if (key.includes("utilit") || key.includes("recharge")) return "📱";
  if (key.includes("grocer")) return "🛒";
  if (key.includes("kirana")) return "🏪";
  if (key.includes("street food") || key.includes("dhaba") || key.includes("tapri")) return "🥙";
  if (key.includes("chai") || key.includes("coffee") || key.includes("cafe")) return "🍵";
  if (key.includes("snack")) return "🍰";
  if (key.includes("food") || key.includes("eat") || key.includes("dining") || key.includes("restaurant")) return "🍛";
  if (key.includes("auto") || key.includes("rickshaw") || key.includes("cab")) return "🛺";
  if (key.includes("bus") || key.includes("train") || key.includes("metro")) return "🚌";
  if (key.includes("transport")) return "🚕";
  if (key.includes("pooja") || key.includes("temple") || key.includes("mandir")) return "🪔";
  if (key.includes("house help") || key.includes("maid") || key.includes("cook")) return "👩‍🍳";
  if (key.includes("laundry") || key.includes("dhobi")) return "🧺";
  if (key.includes("function") || key.includes("event") || key.includes("wedding")) return "🎊";
  if (key.includes("parlour") || key.includes("salon")) return "💅";
  if (key.includes("health") || key.includes("medicine") || key.includes("doctor")) return "💊";
  if (key.includes("travel") || key.includes("flight")) return "✈️";
  if (key.includes("shop") || key.includes("shopping")) return "🛍️";
  if (key.includes("education") || key.includes("school") || key.includes("college")) return "🎓";
  if (key.includes("fitness") || key.includes("gym")) return "🏋️";
  if (key.includes("gift")) return "🎁";
  if (key.includes("wellness") || key.includes("yoga")) return "🧘";
  if (key.includes("pet")) return "🐶";
  if (key.includes("family")) return "👨‍👩‍👧";
  if (key.includes("fun") || key.includes("movie") || key.includes("entertainment")) return "🎬";
  return "🧩";
}

type TransactionFilter = "All" | "Bills" | "Eating out" | "Fuel" | "Groceries" | "Other";

const transactionFilters: TransactionFilter[] = ["All", "Bills", "Eating out", "Fuel", "Groceries", "Other"];

const matchesTransactionFilter = (expense: Expense, filter: TransactionFilter) => {
  if (filter === "All") return true;
  const key = expense.category.toLowerCase();

  const isBills =
    key.includes("bill") ||
    key.includes("rent") ||
    key.includes("electric") ||
    key.includes("utilit") ||
    key.includes("recharge") ||
    key.includes("lpg") ||
    key.includes("gas") ||
    key.includes("water") ||
    key.includes("society") ||
    key.includes("maintenance") ||
    key.includes("broadband") ||
    key.includes("wifi") ||
    key.includes("dth") ||
    key.includes("ott");
  const isFood =
    key.includes("food") ||
    key.includes("eat") ||
    key.includes("dining") ||
    key.includes("restaurant") ||
    key.includes("street food") ||
    key.includes("dhaba") ||
    key.includes("chai") ||
    key.includes("coffee") ||
    key.includes("cafe") ||
    key.includes("snack");
  const isFuel = key.includes("fuel") || key.includes("petrol") || key.includes("diesel");
  const isGroceries = key.includes("grocer") || key.includes("kirana");

  if (filter === "Bills") return isBills;
  if (filter === "Eating out") return isFood;
  if (filter === "Fuel") return isFuel;
  if (filter === "Groceries") return isGroceries;
  return !(isBills || isFood || isFuel || isGroceries);
};

interface SwipeExpenseRowProps {
  expense: Expense;
  delayMs: number;
  onDelete: (id: string) => void;
  formatCurrency: (amount: number) => string;
}

function SwipeExpenseRow({ expense, delayMs, onDelete, formatCurrency }: SwipeExpenseRowProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const dragMeta = useRef({ startX: 0, startY: 0, baseX: 0, lock: false, horizontal: false });
  const offsetRef = useRef(0);

  useEffect(() => {
    offsetRef.current = offsetX;
  }, [offsetX]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    setPressed(true);
    dragMeta.current = {
      startX: event.clientX,
      startY: event.clientY,
      baseX: offsetRef.current,
      lock: false,
      horizontal: false,
    };
    setDragging(true);

    const onMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - dragMeta.current.startX;
      const deltaY = moveEvent.clientY - dragMeta.current.startY;

      if (!dragMeta.current.lock && (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6)) {
        dragMeta.current.lock = true;
        dragMeta.current.horizontal = Math.abs(deltaX) > Math.abs(deltaY);
      }

      if (!dragMeta.current.horizontal) return;
      const next = Math.min(0, Math.max(-92, dragMeta.current.baseX + deltaX));
      setOffsetX(next);
    };

    const onUp = () => {
      setPressed(false);
      setDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      setOffsetX((current) => (current <= -60 ? -92 : 0));
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  const onConfirmDelete = () => {
    setIsRemoving(true);
    window.setTimeout(() => onDelete(expense.id), 300);
  };

  const accent = getCategoryAccentColor(expense.category);
  const emoji = getCategoryEmoji(expense.category);
  const reveal = Math.min(Math.max(-offsetX / 92, 0), 1);

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-[#2b2f46] bg-[#161826] poisa-fade-up"
      style={{
        animationDelay: `${delayMs}ms`,
        maxHeight: isRemoving ? 0 : 112,
        opacity: isRemoving ? 0 : 1,
        transition: "max-height 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-[#ff5b5b]"
        style={{ width: `${Math.max(-offsetX, 0)}px`, opacity: reveal, transition: dragging ? "none" : "opacity 180ms cubic-bezier(0.4, 0, 0.2, 1)" }}
      >
        <button type="button" onClick={onConfirmDelete} className="poisa-pressable px-3 text-[11px] font-semibold text-white">
          Delete
        </button>
      </div>

      <div
        onPointerDown={onPointerDown}
        className={`relative cursor-pointer ${pressed ? "bg-white/[0.03]" : ""}`}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: dragging ? "none" : "transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 180ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="absolute left-0 top-0 h-full w-[3px]" style={{ backgroundColor: accent }} />
        <div className="flex items-center gap-3 px-3 py-3">
          <div className="inline-flex size-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${accent}22`, color: accent }}>
            <span className="text-base leading-none">{emoji}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-[#f3f5ff]">{expense.name}</p>
            <p className="truncate text-[11px] text-[#8b90aa]">{expense.category}</p>
          </div>
          <p className="shrink-0 text-[14px] font-bold text-[#ff5b5b]">-{formatCurrency(expense.amount)}</p>
        </div>
      </div>
    </div>
  );
}

const todoCategoryOptions = [
  "Rent",
  "Utilities",
  "Subscription",
  "Bills & Recharge",
  "EMI Expenses",
  "Life Insurance",
  "SIP",
  "Parents Insurance",
  "Recurring Expenses",
  "Other",
];

interface GroupedExpenses {
  date: string;
  label: string;
  total: number;
  items: Expense[];
}

interface TransactionListProps {
  query: string;
}

type SpendingPanel = "transactions" | "recurring" | "todo";

export default function TransactionList({ query }: TransactionListProps) {
  const { formatCurrency } = useCurrency();
  const [activePanel, setActivePanel] = useState<SpendingPanel>("transactions");
  const [activeCategory, setActiveCategory] = useState<TransactionFilter>("All");
  const [isAddRecurringOpen, setIsAddRecurringOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null);

  const [isTodoFormOpen, setIsTodoFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<SpendingTodo | null>(null);
  const [todoTitle, setTodoTitle] = useState("");
  const [todoCategorySelection, setTodoCategorySelection] = useState(todoCategoryOptions[0]);
  const [todoCustomCategory, setTodoCustomCategory] = useState("");
  const [todoAmount, setTodoAmount] = useState("0");
  const [todoNote, setTodoNote] = useState("");
  const [todoDueDay, setTodoDueDay] = useState("1");
  const [todoRecurring, setTodoRecurring] = useState(true);
  const [showCompletedTodos, setShowCompletedTodos] = useState(false);
  const [activeTodoActionId, setActiveTodoActionId] = useState<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterTrackRef = useRef<HTMLDivElement | null>(null);
  const filterRefs = useRef<Record<TransactionFilter, HTMLButtonElement | null>>({
    All: null,
    Bills: null,
    "Eating out": null,
    Fuel: null,
    Groceries: null,
    Other: null,
  });
  const [filterIndicator, setFilterIndicator] = useState({ left: 0, width: 0 });

  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const expenses = useFinanceStore((state) => state.expenses);
  const getRecurringExpenses = useFinanceStore((state) => state.recurringExpenses);
  const recurringTemplates = useFinanceStore((state) => state.recurringTemplates);
  const toggleRecurringTemplatePaid = useFinanceStore((state) => state.toggleRecurringTemplatePaid);
  const deleteRecurringTemplate = useFinanceStore((state) => state.deleteRecurringTemplate);
  const deleteExpense = useFinanceStore((state) => state.deleteExpense);

  const spendingTodos = useFinanceStore((state) => state.spendingTodos);
  const spendingTodoDoneMonths = useFinanceStore((state) => state.spendingTodoDoneMonths);
  const addSpendingTodo = useFinanceStore((state) => state.addSpendingTodo);
  const updateSpendingTodo = useFinanceStore((state) => state.updateSpendingTodo);
  const deleteSpendingTodo = useFinanceStore((state) => state.deleteSpendingTodo);
  const toggleSpendingTodoDone = useFinanceStore((state) => state.toggleSpendingTodoDone);
  const resetSpendingTodoForMonth = useFinanceStore((state) => state.resetSpendingTodoForMonth);

  const recurring = getRecurringExpenses();
  const recurringMonthlyTotal = recurring.reduce((sum, item) => sum + item.amount, 0);
  const tileMonthlyTotal = recurringTemplates.reduce((sum, template) => {
    if (!template.active || !template.paidMonths.includes(selectedMonth)) return sum;
    return sum + template.amount;
  }, 0);
  const recurringTotal = recurringMonthlyTotal + tileMonthlyTotal;

  const monthlyExpenses = useMemo(
    () => expenses.filter((expense) => expense.date.slice(0, 7) === selectedMonth),
    [expenses, selectedMonth],
  );

  const filteredMonthlyExpenses = useMemo(() => {
    const q = query.trim().toLowerCase();
    return monthlyExpenses.filter((expense) => {
      const categoryMatch = matchesTransactionFilter(expense, activeCategory);
      if (!categoryMatch) return false;
      if (!q) return true;
      return expense.name.toLowerCase().includes(q) || expense.category.toLowerCase().includes(q);
    });
  }, [activeCategory, monthlyExpenses, query]);

  useLayoutEffect(() => {
    const track = filterTrackRef.current;
    const activeChip = filterRefs.current[activeCategory];
    if (!track || !activeChip) return;

    const trackRect = track.getBoundingClientRect();
    const chipRect = activeChip.getBoundingClientRect();
    setFilterIndicator({
      left: chipRect.left - trackRect.left,
      width: chipRect.width,
    });
  }, [activeCategory, activePanel]);

  const groups = useMemo(() => {
    const sorted = [...filteredMonthlyExpenses].sort((a, b) => b.date.localeCompare(a.date));
    const grouped = sorted.reduce<Record<string, GroupedExpenses>>((acc, expense) => {
      if (!acc[expense.date]) {
        acc[expense.date] = { date: expense.date, label: toDisplayDate(expense.date), total: 0, items: [] };
      }
      acc[expense.date].items.push(expense);
      acc[expense.date].total += expense.amount;
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredMonthlyExpenses]);

  const activeTodos = useMemo(
    () => spendingTodos.filter((todo) => todo.active).sort((a, b) => a.title.localeCompare(b.title)),
    [spendingTodos],
  );

  const todoRows = useMemo(
    () =>
      activeTodos.map((todo) => {
        const doneMonths = spendingTodoDoneMonths[todo.id] ?? [];
        return {
          ...todo,
          isDone: doneMonths.includes(selectedMonth),
          dueDay: Math.max(1, Math.min(todo.dueDay ?? 1, 31)),
        };
      }),
    [activeTodos, selectedMonth, spendingTodoDoneMonths],
  );

  const pendingTodos = useMemo(
    () =>
      todoRows
        .filter((todo) => !todo.isDone)
        .sort((a, b) => (a.dueDay ?? 1) - (b.dueDay ?? 1) || a.title.localeCompare(b.title)),
    [todoRows],
  );

  const completedTodos = useMemo(
    () =>
      todoRows
        .filter((todo) => todo.isDone)
        .sort((a, b) => (a.dueDay ?? 1) - (b.dueDay ?? 1) || a.title.localeCompare(b.title)),
    [todoRows],
  );

  const completedTodoCount = completedTodos.length;
  const totalTodoCount = todoRows.length;

  const todoCommittedTotal = useMemo(
    () => todoRows.reduce((sum, todo) => sum + Math.max(todo.defaultAmount, 0), 0),
    [todoRows],
  );
  const todoPaidTotal = useMemo(
    () => completedTodos.reduce((sum, todo) => sum + Math.max(todo.defaultAmount, 0), 0),
    [completedTodos],
  );
  const todoPendingTotal = Math.max(todoCommittedTotal - todoPaidTotal, 0);
  const todoProgressPct = totalTodoCount > 0 ? (completedTodoCount / totalTodoCount) * 100 : 0;

  const applyTodoFormValues = (values: {
    title: string;
    category: string;
    defaultAmount: number;
    note?: string;
    dueDay?: number;
    recurring?: boolean;
  }) => {
    setTodoTitle(values.title);
    if (todoCategoryOptions.includes(values.category)) {
      setTodoCategorySelection(values.category);
      setTodoCustomCategory("");
    } else {
      setTodoCategorySelection("__custom__");
      setTodoCustomCategory(values.category);
    }
    setTodoAmount(String(values.defaultAmount));
    setTodoNote(values.note ?? "");
    setTodoDueDay(String(Math.max(1, Math.min(values.dueDay ?? 1, 31))));
    setTodoRecurring(values.recurring ?? true);
  };

  const startTodoCreate = () => {
    setEditingTodo(null);
    applyTodoFormValues({
      title: "",
      category: todoCategoryOptions[0],
      defaultAmount: 0,
      note: "",
      dueDay: 1,
      recurring: true,
    });
    setIsTodoFormOpen(true);
  };

  const startTodoEdit = (todo: SpendingTodo) => {
    setEditingTodo(todo);
    applyTodoFormValues({
      title: todo.title,
      category: todo.category,
      defaultAmount: todo.defaultAmount,
      note: todo.note,
      dueDay: todo.dueDay,
      recurring: todo.recurring,
    });
    setIsTodoFormOpen(true);
  };

  const onSubmitTodo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(todoAmount);
    const parsedDueDay = Number(todoDueDay);
    const resolvedCategory = (todoCategorySelection === "__custom__" ? todoCustomCategory : todoCategorySelection).trim();

    if (
      !todoTitle.trim() ||
      !resolvedCategory ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount < 0 ||
      !Number.isFinite(parsedDueDay) ||
      parsedDueDay < 1 ||
      parsedDueDay > 31
    ) {
      return;
    }

    if (editingTodo) {
      updateSpendingTodo({
        ...editingTodo,
        title: todoTitle.trim(),
        category: resolvedCategory,
        defaultAmount: Number(parsedAmount.toFixed(2)),
        note: todoNote.trim(),
        dueDay: Math.round(parsedDueDay),
        recurring: todoRecurring,
      });
    } else {
      addSpendingTodo({
        title: todoTitle.trim(),
        category: resolvedCategory,
        defaultAmount: Number(parsedAmount.toFixed(2)),
        note: todoNote.trim(),
        active: true,
        dueDay: Math.round(parsedDueDay),
        recurring: todoRecurring,
      });
    }

    setIsTodoFormOpen(false);
    setEditingTodo(null);
  };

  const handleTodoLongPressStart = (todoId: string) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      setActiveTodoActionId(todoId);
    }, 380);
  };

  const handleTodoLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const nextResetDateLabel = useMemo(() => {
    const [year, monthNumber] = selectedMonth.split("-").map(Number);
    const nextMonth = new Date(year, monthNumber, 1);
    return `${nextMonth.toLocaleDateString("en-US", { month: "long" })} ${toOrdinal(nextMonth.getDate())}`;
  }, [selectedMonth]);

  return (
    <section className="pt-2 pb-3 space-y-3">
      <div className="poisa-fade-up px-4" style={{ animationDelay: "260ms" }}>
        <div className="relative rounded-2xl border border-[#2b2f46] bg-[#161826] p-1">
          <div
            className="absolute inset-y-1 left-1 rounded-xl bg-[#00C896]"
            style={{
              width: "calc((100% - 8px) / 3)",
              transform: `translateX(${(["transactions", "recurring", "todo"] as SpendingPanel[]).indexOf(activePanel) * 100}%)`,
              transition: "transform 220ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
          <div className="relative grid grid-cols-3">
            {([
              { key: "transactions", label: "Transactions" },
              { key: "recurring", label: "Recurring" },
              { key: "todo", label: "To-Do" },
            ] as Array<{ key: SpendingPanel; label: string }>).map((panel) => (
              <button
                key={panel.key}
                type="button"
                onClick={() => setActivePanel(panel.key)}
                className="poisa-pressable h-8 rounded-xl text-[11px] font-semibold uppercase tracking-wide"
                style={{
                  color: activePanel === panel.key ? "#06221a" : "#8c92ab",
                  transition: "color 180ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {panel.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activePanel === "transactions" && (
        <>
          <div className="poisa-fade-up px-4" style={{ animationDelay: "300ms" }}>
            <div className="overflow-x-auto no-scrollbar">
              <div ref={filterTrackRef} className="relative inline-flex items-center gap-1 rounded-full border border-[#2b2f46] bg-[#161826] p-1">
                <span
                  className="absolute inset-y-1 rounded-full bg-[#00e5a0]"
                  style={{
                    left: filterIndicator.left,
                    width: filterIndicator.width,
                    transition: "left 250ms cubic-bezier(0.4, 0, 0.2, 1), width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
                {transactionFilters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    ref={(node) => {
                      filterRefs.current[filter] = node;
                    }}
                    onClick={() => setActiveCategory(filter)}
                    className="poisa-pressable relative z-10 h-7 whitespace-nowrap rounded-full px-3 text-[11px] font-semibold"
                    style={{
                      color: activeCategory === filter ? "#062218" : "#8e93ad",
                      transition: "color 180ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {groups.length === 0 ? (
            <section className="px-4 py-1">
              <div className="rounded-2xl border border-[#2b2f46] bg-[#161826] p-8 text-center">
                <p className="font-poisa-heading text-sm font-bold text-[#f1f5f9]">{query ? "No results found" : "No expenses yet"}</p>
                <p className="mt-1 text-xs text-[#6b7280]">
                  {query ? "Try a different search term or category" : "Tap + to add your first expense this month"}
                </p>
              </div>
            </section>
          ) : (
            groups.map((group, groupIndex) => (
              <div key={group.date}>
                <div
                  className={`px-4 py-2 z-10 flex justify-between items-center ${
                    groupIndex > 0 ? "mt-1" : ""
                  }`}
                >
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#7d859d]">{group.label}</h3>
                  <span className="text-[12px] font-semibold text-[#ff5b5b]">-{formatCurrency(group.total)}</span>
                </div>

                <div className="px-4 py-1 space-y-2">
                  {group.items.map((item, itemIndex) => (
                    <SwipeExpenseRow
                      key={item.id}
                      expense={item}
                      delayMs={300 + itemIndex * 40}
                      onDelete={deleteExpense}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {activePanel === "recurring" && (
        <div className="px-4">
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-[11px] font-bold text-[#F1F5F9]">Recurring</h3>
              <span className="text-[10px] font-semibold text-[#94A3B8]">{formatCurrency(recurringTotal)} / month</span>
            </div>

            <div className="flex items-stretch gap-2 mb-2 overflow-x-auto no-scrollbar pb-0.5">
              {recurringTemplates
                .filter((template) => template.active)
                .map((template) => {
                  const isDone = template.paidMonths.includes(selectedMonth);
                  const isPreset = template.id.startsWith("template-");
                  const categoryColor = getCategoryAccentColor(template.category);

                  return (
                    <div key={template.id} className="shrink-0 w-[112px]">
                      <div
                        className={`min-h-[76px] rounded-xl border p-2 text-left transition-colors ${
                          isDone ? "border-[#00C9A7]/55 bg-[#00C9A7]/14" : "border-[rgba(255,255,255,0.08)] bg-[#111118]"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px] text-white/75">{template.icon || "receipt_long"}</span>
                        <p className="text-[10px] font-semibold text-[#F1F5F9] mt-1 whitespace-normal break-words leading-tight">{template.title}</p>
                        <p className="text-[10px] text-[#94A3B8] mt-0.5">{formatCurrency(template.amount)}</p>
                      </div>

                      <div className="mt-1.5 grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => toggleRecurringTemplatePaid(template.id, selectedMonth)}
                          className="h-6 rounded-full text-[9px] font-bold active:scale-95 transition-transform"
                          style={{
                            backgroundColor: `${categoryColor}22`,
                            color: categoryColor,
                            border: `1px solid ${categoryColor}66`,
                          }}
                        >
                          {isDone ? "Undo" : "Done"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTemplate(template)}
                          className="h-6 rounded-full border border-[#00C896]/40 bg-[#00C896]/10 text-[9px] font-bold text-[#73EFD9] active:scale-95 transition-transform"
                        >
                          Edit
                        </button>
                      </div>
                      {!isPreset && (
                        <button
                          type="button"
                          onClick={() => deleteRecurringTemplate(template.id)}
                          className="mt-1 h-5 w-full rounded-full border border-[#F43F5E]/30 bg-[#F43F5E]/10 text-[8px] font-semibold uppercase tracking-wide text-[#F43F5E] active:scale-95 transition-transform"
                          title="Delete recurring tile"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })}

              <button
                type="button"
                onClick={() => setIsAddRecurringOpen(true)}
                className="shrink-0 w-[96px] min-h-[76px] rounded-xl border border-dashed border-[rgba(255,255,255,0.08)] bg-[#111118] p-2 inline-flex flex-col items-center justify-center text-center active:scale-95 transition-transform hover:border-[#00C896]/70"
              >
                <span className="material-symbols-outlined text-[16px] text-[#00C896]">add</span>
                <span className="text-[10px] font-semibold text-[#00C896] mt-1">Custom</span>
              </button>
            </div>

            {recurring.length === 0 ? (
              <p className="text-[10px] text-[#64748B]">No manual recurring entries yet.</p>
            ) : (
              <div className="space-y-1">
                {recurring.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between">
                    <p className="text-[10px] text-[#64748B] inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[11px]">autorenew</span>
                      {expense.name}
                    </p>
                    <p className="text-[10px] font-semibold text-[#F1F5F9]">{formatCurrency(expense.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activePanel === "todo" && (
        <div className="px-4">
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[11px] font-bold text-[#F1F5F9] uppercase tracking-wide">Spending To-Do</h3>
                <p className="text-[12px] text-[#94A3B8] mt-0.5">{toMonthTitle(selectedMonth)}</p>
              </div>
              <button
                type="button"
                onClick={startTodoCreate}
                className="h-7 px-2.5 rounded-lg border border-[#00C896]/45 bg-[#00C896]/12 text-[11px] font-semibold text-[#83F3DF]"
              >
                Add
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="h-2 rounded-full bg-[#2A3345] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#00C896]"
                  style={{ width: `${Math.min(todoProgressPct, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-[#7A8599]">
                {completedTodoCount}/{totalTodoCount} done in {selectedMonth}
              </p>
            </div>

            <div className="rounded-xl border border-[#2A3345] bg-[#111118] p-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#94A3B8]">Total Committed: <span className="text-[#F1F5F9] font-semibold">{formatCurrency(todoCommittedTotal)}</span></span>
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[#94A3B8]"><span className="size-1.5 rounded-full bg-[#00C896]" />Paid: {formatCurrency(todoPaidTotal)}</span>
                  <span className="inline-flex items-center gap-1 text-[#94A3B8]"><span className="size-1.5 rounded-full bg-[#F5A623]" />Pending: {formatCurrency(todoPendingTotal)}</span>
                </span>
              </div>
            </div>

            {todoRows.length === 0 ? (
              <p className="text-[11px] text-[#94A3B8]">No to-do items yet.</p>
            ) : (
              <div className="space-y-2">
                {pendingTodos.map((todo) => (
                  <button
                    key={todo.id}
                    type="button"
                    onContextMenu={(event) => {
                      event.preventDefault();
                      setActiveTodoActionId(todo.id);
                    }}
                    onTouchStart={() => handleTodoLongPressStart(todo.id)}
                    onTouchEnd={handleTodoLongPressEnd}
                    onTouchCancel={handleTodoLongPressEnd}
                    onClick={() => toggleSpendingTodoDone(todo.id, selectedMonth)}
                    className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111118] p-3 text-left"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 size-5 rounded-full border border-[#64748B] inline-flex items-center justify-center" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-[#F1F5F9] truncate">{todo.title}</p>
                        <p className="text-[12px] text-[#94A3B8]">{todo.category}</p>
                        <p className="text-[12px] text-[#00C896] font-semibold">{formatCurrency(todo.defaultAmount)}</p>
                        {todo.note && <p className="text-[11px] text-[#64748B] mt-0.5">{todo.note}</p>}
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center rounded-full border border-[#F5A623]/45 bg-[#F5A623]/12 px-2 py-0.5 text-[10px] text-[#F5A623]">
                          Due: {toOrdinal(todo.dueDay ?? 1)}
                        </span>
                        {activeTodoActionId === todo.id && (
                          <div className="mt-1 flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                startTodoEdit(todo);
                              }}
                              className="size-5 rounded-full text-[#94A3B8] inline-flex items-center justify-center"
                              title="Edit to-do"
                            >
                              <span className="material-symbols-outlined text-[14px]">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteSpendingTodo(todo.id);
                              }}
                              className="size-5 rounded-full text-[#94A3B8] inline-flex items-center justify-center"
                              title="Delete to-do"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}

                {completedTodos.length > 0 && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCompletedTodos((value) => !value)}
                      className="w-full rounded-lg border border-[#2A3345] bg-[#0F172A] px-3 py-1.5 text-left text-[11px] text-[#94A3B8]"
                    >
                      Completed ({completedTodos.length}) {showCompletedTodos ? "Hide" : "Show"}
                    </button>

                    {showCompletedTodos && (
                      <div className="mt-2 space-y-2">
                        {completedTodos.map((todo) => (
                          <button
                            key={todo.id}
                            type="button"
                            onClick={() => toggleSpendingTodoDone(todo.id, selectedMonth)}
                            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111118] p-3 text-left opacity-60"
                          >
                            <div className="flex items-start gap-2.5">
                              <span className="mt-0.5 size-5 rounded-full border border-[#00C9A7] bg-[#00C9A7]/20 text-[#00C9A7] inline-flex items-center justify-center">
                                <span className="material-symbols-outlined text-[12px]">check</span>
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[15px] font-semibold text-[#F1F5F9] line-through truncate">{todo.title}</p>
                                <p className="text-[12px] text-[#94A3B8]">{todo.category}</p>
                                <p className="text-[12px] text-[#94A3B8] line-through">{formatCurrency(todo.defaultAmount)}</p>
                              </div>
                              <span className="inline-flex items-center rounded-full border border-[#00C896]/45 bg-[#00C896]/12 px-2 py-0.5 text-[10px] text-[#00C896]">
                                Due: {toOrdinal(todo.dueDay ?? 1)}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between rounded-xl border border-[#2A3345] bg-[#111118] px-3 py-2 text-[12px]">
              <p className="text-[#7A8599] inline-flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">autorenew</span>Resets on {nextResetDateLabel}</p>
              <button
                type="button"
                onClick={() => resetSpendingTodoForMonth(selectedMonth)}
                className="text-[#00C896] font-semibold"
              >
                Reset Now
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomSheet isOpen={isTodoFormOpen} title={editingTodo ? "Edit To-Do" : "Add To-Do"} onClose={() => {
        setIsTodoFormOpen(false);
        setEditingTodo(null);
      }}>
        <form onSubmit={onSubmitTodo} className="space-y-2.5">
          <input
            type="text"
            value={todoTitle}
            onChange={(event) => setTodoTitle(event.target.value)}
            placeholder="Name"
            className="glass-input w-full h-10 px-2.5 text-xs text-[#f0f0ff]"
            required
          />
          <select
            value={todoCategorySelection}
            onChange={(event) => setTodoCategorySelection(event.target.value)}
            className="glass-input w-full h-10 px-2.5 text-xs text-[#f0f0ff] bg-transparent"
          >
            {todoCategoryOptions.map((option) => (
              <option key={option} value={option} className="bg-[#111118] text-[#f0f0ff]">
                {option}
              </option>
            ))}
            <option value="__custom__" className="bg-[#111118] text-[#f0f0ff]">
              Custom Category
            </option>
          </select>
          {todoCategorySelection === "__custom__" && (
            <input
              type="text"
              value={todoCustomCategory}
              onChange={(event) => setTodoCustomCategory(event.target.value)}
              placeholder="Custom category"
              className="glass-input w-full h-10 px-2.5 text-xs text-[#f0f0ff]"
              required
            />
          )}
          <input
            type="number"
            min="0"
            step="0.01"
            value={todoAmount}
            onChange={(event) => setTodoAmount(event.target.value)}
            placeholder="Amount (optional)"
            className="glass-input w-full h-10 px-2.5 text-xs text-[#f0f0ff]"
          />
          <input
            type="number"
            min="1"
            max="31"
            step="1"
            value={todoDueDay}
            onChange={(event) => setTodoDueDay(event.target.value)}
            placeholder="Due day (1-31)"
            className="glass-input w-full h-10 px-2.5 text-xs text-[#f0f0ff]"
            required
          />
          <input
            type="text"
            value={todoNote}
            onChange={(event) => setTodoNote(event.target.value)}
            placeholder="Note (optional)"
            className="glass-input w-full h-10 px-2.5 text-xs text-[#f0f0ff]"
          />
          <label className="flex items-center justify-between rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111118] px-3 py-2">
            <span className="text-xs text-[#94A3B8]">Recurring</span>
            <input
              type="checkbox"
              checked={todoRecurring}
              onChange={(event) => setTodoRecurring(event.target.checked)}
              className="size-4 border border-white/20 bg-transparent"
            />
          </label>
          <button
            type="submit"
            className="h-10 w-full rounded-xl bg-[#00C9A7] text-[#07241f] text-xs font-semibold"
          >
            {editingTodo ? "Save" : "Add"}
          </button>
        </form>
      </BottomSheet>

      <AddRecurringTemplateModal
        key={`add-recurring-${isAddRecurringOpen ? "open" : "closed"}`}
        isOpen={isAddRecurringOpen}
        onClose={() => setIsAddRecurringOpen(false)}
      />
      <AddRecurringTemplateModal
        key={`edit-recurring-${editingTemplate?.id ?? "none"}-${editingTemplate ? "open" : "closed"}`}
        isOpen={Boolean(editingTemplate)}
        initialTemplate={editingTemplate}
        onClose={() => setEditingTemplate(null)}
      />
    </section>
  );
}



