/**
 * Centralised rate-limit management for Steam API operations.
 *
 * Each operation has its own cooldown window stored in MMKV via
 * `storage.setCooldown` / `storage.isOnCooldown`.
 */

import { storage } from '../storage';

// ---------------------------------------------------------------------------
// Cooldown windows (milliseconds)
// ---------------------------------------------------------------------------

export const INVENTORY_COOLDOWN = 3 * 60 * 1000;   // 3 minutes
export const PRICE_COOLDOWN     = 15 * 60 * 1000;  // 15 minutes
export const PROFILE_COOLDOWN   = 10 * 60 * 1000;  // 10 minutes

// ---------------------------------------------------------------------------
// Operation keys (match the MMKV key suffix)
// ---------------------------------------------------------------------------

const OP = {
  INVENTORY: 'inventory_sync',
  PRICES: 'price_refresh',
  PROFILE: 'profile_sync',
} as const;

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export function isInventoryOnCooldown(): boolean {
  return storage.isOnCooldown(OP.INVENTORY, INVENTORY_COOLDOWN);
}

export function getInventoryCooldownRemaining(): number {
  return storage.getCooldownRemaining(OP.INVENTORY, INVENTORY_COOLDOWN);
}

export function registerInventorySync(): void {
  storage.setCooldown(OP.INVENTORY);
}

// ---------------------------------------------------------------------------
// Prices
// ---------------------------------------------------------------------------

export function isPriceOnCooldown(): boolean {
  return storage.isOnCooldown(OP.PRICES, PRICE_COOLDOWN);
}

export function getPriceCooldownRemaining(): number {
  return storage.getCooldownRemaining(OP.PRICES, PRICE_COOLDOWN);
}

export function registerPriceSync(): void {
  storage.setCooldown(OP.PRICES);
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export function isProfileOnCooldown(): boolean {
  return storage.isOnCooldown(OP.PROFILE, PROFILE_COOLDOWN);
}

export function registerProfileSync(): void {
  storage.setCooldown(OP.PROFILE);
}

// ---------------------------------------------------------------------------
// Helper — human-readable cooldown string
// ---------------------------------------------------------------------------

export function formatCooldown(remainingMs: number): string {
  const seconds = Math.ceil(remainingMs / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `${minutes}min`;
}
