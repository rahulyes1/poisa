"use client";

import { PostgrestError } from "@supabase/supabase-js";
import { FinanceSnapshotRow } from "./types";
import {
  FinanceDataSnapshot,
  applyFinanceSnapshot,
  getBaseStoreSnapshot,
  getFinanceDataSnapshot,
  useFinanceStore,
} from "./store";
import { supabase } from "@/lib/supabase";

const SNAPSHOT_TABLE = "user_finance_snapshots";
const SYNC_DEBOUNCE_MS = 1500;
const RETRY_DELAY_MS = 5000;

type UpsertResult = {
  row: FinanceSnapshotRow | null;
  conflict: boolean;
  error: PostgrestError | Error | null;
};

let activeUserId: string | null = null;
let latestRemoteVersion: number | null = null;
let latestSerializedSnapshot = "";
let latestQueuedSnapshot = "";
let isApplyingRemote = false;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribeStore: (() => void) | null = null;
let detachOnlineListener: (() => void) | null = null;
let snapshotTableMissing = false;
let syncInFlight = false;
let flushRequestedWhileInFlight = false;

const isConnectivityError = (error: unknown) => {
  const text = error instanceof Error ? error.message : String(error ?? "");
  return text.toLowerCase().includes("fetch") || text.toLowerCase().includes("network");
};

const isSnapshotTableMissingError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const postgrestCode =
    "code" in (error as { code?: unknown }) ? (error as { code?: unknown }).code : undefined;
  if (postgrestCode === "PGRST205") {
    return true;
  }

  const text = error instanceof Error ? error.message : String(error ?? "");
  const normalized = text.toLowerCase();
  return normalized.includes("user_finance_snapshots") && normalized.includes("could not find");
};

const serializeState = (state: FinanceDataSnapshot) => JSON.stringify(state);

const hasMeaningfulLocalData = (state: FinanceDataSnapshot) => {
  const base = getBaseStoreSnapshot();
  const baseline: FinanceDataSnapshot = {
    currency: base.currency,
    hasSelectedCurrency: base.hasSelectedCurrency,
    hasSeenFeaturePoster: base.hasSeenFeaturePoster,
    selectedMonth: base.selectedMonth,
    monthMode: base.monthMode,
    dashboardWindow: base.dashboardWindow,
    spendingCarryForwardEnabled: base.spendingCarryForwardEnabled,
    savingsCarryForwardEnabled: base.savingsCarryForwardEnabled,
    spendingBudget: base.spendingBudget,
    monthlyBudgets: base.monthlyBudgets,
    savingsBudget: base.savingsBudget,
    categoryLimits: base.categoryLimits,
    adjustments: base.adjustments,
    expenses: base.expenses,
    investments: base.investments,
    savingGoals: base.savingGoals,
    loans: base.loans,
    personalLoans: base.personalLoans,
    moneyTookEntries: base.moneyTookEntries,
    lifeInsurances: base.lifeInsurances,
    recurringTemplates: base.recurringTemplates,
    spendingTodos: base.spendingTodos,
    spendingTodoDoneMonths: base.spendingTodoDoneMonths,
  };

  return serializeState(state) !== serializeState(baseline);
};

const setSyncStatus = (status: "idle" | "syncing" | "error" | "offline") => {
  useFinanceStore.getState().setSyncStatus(status);
};

const clearTimers = () => {
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
};

const applyRemoteSnapshot = (row: FinanceSnapshotRow) => {
  const remoteState = row.state as FinanceDataSnapshot;
  const serialized = serializeState(remoteState);
  latestSerializedSnapshot = serialized;
  latestQueuedSnapshot = serialized;
  isApplyingRemote = true;
  applyFinanceSnapshot(remoteState);
  isApplyingRemote = false;
  latestRemoteVersion = Number(row.version ?? 0);
  useFinanceStore.getState().setLastSyncedAt(row.updated_at);
  useFinanceStore.getState().setLastSyncedVersion(latestRemoteVersion ?? undefined);
  useFinanceStore.getState().clearDirty();
};

export const loadRemoteSnapshot = async (userId: string) => {
  if (!supabase) {
    return { row: null, error: new Error("Supabase client is not configured.") };
  }

  const { data, error } = await supabase
    .from(SNAPSHOT_TABLE)
    .select("user_id,state,version,updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { row: null, error };
  }

  return { row: (data as FinanceSnapshotRow | null) ?? null, error: null };
};

export const upsertRemoteSnapshot = async (
  userId: string,
  state: FinanceDataSnapshot,
  expectedVersion?: number | null,
): Promise<UpsertResult> => {
  if (!supabase) {
    return { row: null, conflict: false, error: new Error("Supabase client is not configured.") };
  }

  const nextVersion = typeof expectedVersion === "number" ? expectedVersion + 1 : 1;

  if (typeof expectedVersion !== "number") {
    const { data, error } = await supabase
      .from(SNAPSHOT_TABLE)
      .insert({
        user_id: userId,
        state,
        version: nextVersion,
      })
      .select("user_id,state,version,updated_at")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") {
        return { row: null, conflict: true, error: null };
      }
      return { row: null, conflict: false, error };
    }

    return { row: (data as FinanceSnapshotRow | null) ?? null, conflict: false, error: null };
  }

  const { data, error } = await supabase
    .from(SNAPSHOT_TABLE)
    .update({
      state,
      version: nextVersion,
    })
    .eq("user_id", userId)
    .eq("version", expectedVersion)
    .select("user_id,state,version,updated_at");

  if (error) {
    return { row: null, conflict: false, error };
  }

  if (!data || data.length === 0) {
    return { row: null, conflict: true, error: null };
  }

  return { row: data[0] as FinanceSnapshotRow, conflict: false, error: null };
};

const flushCloudSync = async () => {
  if (!activeUserId || !supabase || snapshotTableMissing) {
    return;
  }

  if (syncInFlight) {
    flushRequestedWhileInFlight = true;
    return;
  }

  const store = useFinanceStore.getState();
  if (!store.dirty) {
    return;
  }

  syncInFlight = true;
  try {
    const snapshot = getFinanceDataSnapshot();
    const serialized = serializeState(snapshot);

    setSyncStatus("syncing");
    const result = await upsertRemoteSnapshot(activeUserId, snapshot, latestRemoteVersion);

    if (result.row) {
      latestRemoteVersion = Number(result.row.version ?? 0);
      latestSerializedSnapshot = serialized;
      latestQueuedSnapshot = serialized;
      useFinanceStore.getState().setLastSyncedAt(result.row.updated_at);
      useFinanceStore.getState().setLastSyncedVersion(latestRemoteVersion ?? undefined);
      useFinanceStore.getState().clearDirty();
      setSyncStatus("idle");
      return;
    }

    if (result.conflict) {
      const latest = await loadRemoteSnapshot(activeUserId);
      if (latest.row) {
        applyRemoteSnapshot(latest.row);
        setSyncStatus("idle");
        return;
      }
      if (latest.error && isSnapshotTableMissingError(latest.error)) {
        snapshotTableMissing = true;
        setSyncStatus("error");
        clearTimers();
        return;
      }
    }

    if (result.error) {
      if (isSnapshotTableMissingError(result.error)) {
        snapshotTableMissing = true;
        setSyncStatus("error");
        clearTimers();
        return;
      }

      const offline = (typeof navigator !== "undefined" && !navigator.onLine) || isConnectivityError(result.error);
      setSyncStatus(offline ? "offline" : "error");
      retryTimer = setTimeout(() => {
        void flushCloudSync();
      }, RETRY_DELAY_MS);
    }
  } finally {
    syncInFlight = false;
    if (flushRequestedWhileInFlight) {
      flushRequestedWhileInFlight = false;
      void flushCloudSync();
    }
  }
};

const scheduleCloudSync = () => {
  if (snapshotTableMissing) {
    return;
  }

  if (syncTimer) {
    clearTimeout(syncTimer);
  }

  syncTimer = setTimeout(() => {
    void flushCloudSync();
  }, SYNC_DEBOUNCE_MS);
};

export const stopCloudSync = () => {
  activeUserId = null;
  clearTimers();
  latestRemoteVersion = null;
  latestSerializedSnapshot = "";
  latestQueuedSnapshot = "";
  isApplyingRemote = false;
  snapshotTableMissing = false;
  syncInFlight = false;
  flushRequestedWhileInFlight = false;
  if (unsubscribeStore) {
    unsubscribeStore();
    unsubscribeStore = null;
  }
  if (detachOnlineListener) {
    detachOnlineListener();
    detachOnlineListener = null;
  }
};

export const startCloudSync = async (userId: string) => {
  stopCloudSync();
  activeUserId = userId;
  snapshotTableMissing = false;

  const currentSnapshot = getFinanceDataSnapshot();
  latestSerializedSnapshot = serializeState(currentSnapshot);
  latestQueuedSnapshot = latestSerializedSnapshot;
  setSyncStatus("syncing");

  const remote = await loadRemoteSnapshot(userId);

  if (remote.error) {
    if (isSnapshotTableMissingError(remote.error)) {
      snapshotTableMissing = true;
      setSyncStatus("error");
      return;
    }
    const offline = (typeof navigator !== "undefined" && !navigator.onLine) || isConnectivityError(remote.error);
    setSyncStatus(offline ? "offline" : "error");
  } else if (remote.row) {
    applyRemoteSnapshot(remote.row);
    setSyncStatus("idle");
  } else {
    latestRemoteVersion = null;
    if (hasMeaningfulLocalData(currentSnapshot)) {
      useFinanceStore.getState().markDirty();
      await flushCloudSync();
      if (snapshotTableMissing) {
        return;
      }
    } else {
      useFinanceStore.getState().clearDirty();
      setSyncStatus("idle");
    }
  }

  unsubscribeStore = useFinanceStore.subscribe((state) => {
    const snapshot = getFinanceDataSnapshot(state);
    const serialized = serializeState(snapshot);
    if (serialized === latestSerializedSnapshot) {
      latestQueuedSnapshot = serialized;
      return;
    }

    if (isApplyingRemote) {
      latestSerializedSnapshot = serialized;
      latestQueuedSnapshot = serialized;
      return;
    }

    if (state.dirty && serialized === latestQueuedSnapshot) {
      return;
    }

    latestQueuedSnapshot = serialized;
    if (!state.dirty) {
      useFinanceStore.getState().markDirty();
    }
    scheduleCloudSync();
  });

  if (typeof window !== "undefined") {
    const onOnline = () => {
      if (useFinanceStore.getState().dirty) {
        void flushCloudSync();
      }
    };
    window.addEventListener("online", onOnline);
    detachOnlineListener = () => {
      window.removeEventListener("online", onOnline);
    };
  }
};
