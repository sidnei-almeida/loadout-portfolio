/**
 * Snapshot analytics — What-If ROI analysis and snapshot comparison.
 *
 * Ported from `analysis_service.py → calculate_what_if()` and
 * `compare_snapshots()`.  Operates entirely on local repos.
 */

import {
  getSnapshotDetails,
  getSnapshotItems,
  getSnapshots,
} from '../../database/repositories/snapshotRepo';
import { getInventory, getTotalValue } from '../../database/repositories/inventoryRepo';
import { getSkin } from '../../database/repositories/catalogRepo';
import type { SnapshotItemDetailRow, SnapshotRow } from '../../database/repositories/snapshotRepo';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WhatIfItemAnalysis {
  marketHashName: string;
  originalPrice: number;
  currentPrice: number;
  quantity: number;
  originalTotal: number;
  simulatedTotal: number;
  roiAbsolute: number;
  roiPercent: number;
  imageUrl: string;
}

export interface TopMover {
  name: string;
  changeAbsolute: number;
  changePercent: number;
}

export interface WhatIfResult {
  snapshotDate: string;
  /** Frozen value when the snapshot was created */
  originalValue: number;
  /** Current real inventory value (may differ in composition) */
  currentValue: number;
  /** What the snapshot *would* be worth today if items were kept */
  projectedValue: number;

  /** currentValue − originalValue */
  absoluteGain: number;
  /** % ROI  (current vs original) */
  roiPercent: number;

  simulatedVsOriginal: { absolute: number; percent: number };
  currentVsSimulated: { absolute: number; percent: number };

  topGainers: TopMover[];
  topLosers: TopMover[];
  itemCount: number;
  items: WhatIfItemAnalysis[];
}

export interface ComparisonItem {
  name: string;
  quantity: number;
  value: number;
  imageUrl: string;
}

export interface ChangedItem {
  name: string;
  oldQuantity: number;
  newQuantity: number;
  quantityChange: number;
  imageUrl: string;
}

export interface SnapshotComparison {
  older: { id: string; date: string; value: number; itemCount: number };
  newer: { id: string; date: string; value: number; itemCount: number };
  valueChange: number;
  valueChangePercent: number;
  itemCountChange: number;
  addedItems: ComparisonItem[];
  removedItems: ComparisonItem[];
  changedItems: ChangedItem[];
  summary: { added: number; removed: number; changed: number };
}

// ---------------------------------------------------------------------------
// What-If Analysis
// ---------------------------------------------------------------------------

/**
 * Compares a past snapshot against current catalog prices.
 *
 * Three key values:
 *  - **Original Value**: total_value recorded when the snapshot was saved.
 *  - **Current Value**:  actual current inventory value (composition may differ).
 *  - **Projected Value**: what the *snapshot's exact items* would be worth today
 *    (simulated — uses current_price × original quantity per item).
 *
 * Per-item ROI:
 *   roiAbsolute  = (currentPrice × qty) − (originalPrice × qty)
 *   roiPercent   = roiAbsolute / (originalPrice × qty) × 100
 *
 * Top Gainers / Losers are the 5 items with the highest / lowest absolute ROI.
 */
export function calculateWhatIf(snapshotId: string): WhatIfResult | null {
  const detail = getSnapshotDetails(snapshotId);
  if (!detail) {
    return null;
  }

  const { snapshot, items } = detail;

  if (items.length === 0) {
    return emptyWhatIf(snapshot);
  }

  const currentValue = getTotalValue();
  const originalValue = snapshot.total_value;

  let simulatedValue = 0;
  const analyses: WhatIfItemAnalysis[] = [];

  for (const item of items) {
    const origTotal = item.original_price * item.quantity;
    const simTotal = item.current_price * item.quantity;
    const roiAbs = simTotal - origTotal;
    const roiPct = origTotal > 0 ? (roiAbs / origTotal) * 100 : 0;

    simulatedValue += simTotal;

    analyses.push({
      marketHashName: item.market_hash_name,
      originalPrice: item.original_price,
      currentPrice: item.current_price,
      quantity: item.quantity,
      originalTotal: r(origTotal),
      simulatedTotal: r(simTotal),
      roiAbsolute: r(roiAbs),
      roiPercent: r(roiPct),
      imageUrl: item.image_url_hd || item.icon_url || '',
    });
  }

  // ------- Aggregate comparisons -------
  const simVsOrigAbs = simulatedValue - originalValue;
  const simVsOrigPct = originalValue > 0 ? (simVsOrigAbs / originalValue) * 100 : 0;

  const curVsOrigAbs = currentValue - originalValue;
  const curVsOrigPct = originalValue > 0 ? (curVsOrigAbs / originalValue) * 100 : 0;

  const curVsSimAbs = currentValue - simulatedValue;
  const curVsSimPct = simulatedValue > 0 ? (curVsSimAbs / simulatedValue) * 100 : 0;

  // ------- Top movers -------
  const sortedByRoi = [...analyses].sort((a, b) => b.roiAbsolute - a.roiAbsolute);

  const topGainers: TopMover[] = sortedByRoi
    .filter(i => i.roiAbsolute > 0)
    .slice(0, 5)
    .map(i => ({
      name: i.marketHashName,
      changeAbsolute: i.roiAbsolute,
      changePercent: i.roiPercent,
    }));

  const topLosers: TopMover[] = [...analyses]
    .sort((a, b) => a.roiAbsolute - b.roiAbsolute)
    .filter(i => i.roiAbsolute < 0)
    .slice(0, 5)
    .map(i => ({
      name: i.marketHashName,
      changeAbsolute: i.roiAbsolute,
      changePercent: i.roiPercent,
    }));

  return {
    snapshotDate: snapshot.snapshot_date,
    originalValue: r(originalValue),
    currentValue: r(currentValue),
    projectedValue: r(simulatedValue),
    absoluteGain: r(curVsOrigAbs),
    roiPercent: r(curVsOrigPct),
    simulatedVsOriginal: { absolute: r(simVsOrigAbs), percent: r(simVsOrigPct) },
    currentVsSimulated: { absolute: r(curVsSimAbs), percent: r(curVsSimPct) },
    topGainers,
    topLosers,
    itemCount: items.length,
    items: analyses,
  };
}

// ---------------------------------------------------------------------------
// Snapshot Comparison (diff between two dates)
// ---------------------------------------------------------------------------

/**
 * Produces a diff between two snapshots:
 *  - Items added (in newer, absent in older)
 *  - Items removed (in older, absent in newer)
 *  - Items with quantity changes
 *  - Overall value and item-count deltas
 *
 * Snapshots are auto-sorted by date (older first) regardless of parameter
 * order, mirroring the Python implementation.
 */
export function compareSnapshots(
  idA: string,
  idB: string,
): SnapshotComparison | null {
  const snapshots = getSnapshots();
  const snapA = snapshots.find(s => s.id === idA);
  const snapB = snapshots.find(s => s.id === idB);

  if (!snapA || !snapB) {
    return null;
  }

  // Determine older / newer
  const [older, newer] = snapA.snapshot_date <= snapB.snapshot_date
    ? [snapA, snapB]
    : [snapB, snapA];

  const olderItems = getSnapshotItems(older.id);
  const newerItems = getSnapshotItems(newer.id);

  const olderMap = new Map(olderItems.map(i => [i.market_hash_name, i]));
  const newerMap = new Map(newerItems.map(i => [i.market_hash_name, i]));

  const addedItems: ComparisonItem[] = [];
  const removedItems: ComparisonItem[] = [];
  const changedItems: ChangedItem[] = [];

  // Added (in newer only)
  for (const [name, item] of newerMap) {
    if (!olderMap.has(name)) {
      const cat = getSkin(name);
      addedItems.push({
        name,
        quantity: item.quantity,
        value: r(item.original_price * item.quantity),
        imageUrl: cat?.image_url_hd || cat?.icon_url || '',
      });
    }
  }

  // Removed (in older only)
  for (const [name, item] of olderMap) {
    if (!newerMap.has(name)) {
      const cat = getSkin(name);
      removedItems.push({
        name,
        quantity: item.quantity,
        value: r(item.original_price * item.quantity),
        imageUrl: cat?.image_url_hd || cat?.icon_url || '',
      });
    }
  }

  // Changed quantity
  for (const [name, newItem] of newerMap) {
    const oldItem = olderMap.get(name);
    if (oldItem && newItem.quantity !== oldItem.quantity) {
      const cat = getSkin(name);
      changedItems.push({
        name,
        oldQuantity: oldItem.quantity,
        newQuantity: newItem.quantity,
        quantityChange: newItem.quantity - oldItem.quantity,
        imageUrl: cat?.image_url_hd || cat?.icon_url || '',
      });
    }
  }

  const valueChange = newer.total_value - older.total_value;
  const valueChangePct = older.total_value > 0
    ? (valueChange / older.total_value) * 100
    : 0;

  return {
    older: {
      id: older.id,
      date: older.snapshot_date,
      value: older.total_value,
      itemCount: older.item_count,
    },
    newer: {
      id: newer.id,
      date: newer.snapshot_date,
      value: newer.total_value,
      itemCount: newer.item_count,
    },
    valueChange: r(valueChange),
    valueChangePercent: r(valueChangePct),
    itemCountChange: newer.item_count - older.item_count,
    addedItems: addedItems.slice(0, 10),
    removedItems: removedItems.slice(0, 10),
    changedItems: changedItems.slice(0, 10),
    summary: {
      added: addedItems.length,
      removed: removedItems.length,
      changed: changedItems.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function r(v: number): number {
  return Math.round(v * 100) / 100;
}

function emptyWhatIf(snapshot: SnapshotRow): WhatIfResult {
  return {
    snapshotDate: snapshot.snapshot_date,
    originalValue: snapshot.total_value,
    currentValue: 0,
    projectedValue: 0,
    absoluteGain: -snapshot.total_value,
    roiPercent: -100,
    simulatedVsOriginal: { absolute: -snapshot.total_value, percent: -100 },
    currentVsSimulated: { absolute: 0, percent: 0 },
    topGainers: [],
    topLosers: [],
    itemCount: 0,
    items: [],
  };
}
