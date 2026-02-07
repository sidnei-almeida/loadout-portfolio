/**
 * Utilitários para filtros e ordenação de itens
 */

import type { Item } from '@types/item';
import { getRarityFromName } from './rarity';

/**
 * Categorias de itens CS2
 */
export function getItemCategory(marketHashName: string): string {
  const name = marketHashName.toLowerCase();
  
  if (name.includes('knife') || name.includes('karambit') || name.includes('butterfly') || 
      name.includes('bayonet') || name.includes('m9') || name.includes('huntsman') ||
      name.includes('flip') || name.includes('gut') || name.includes('falchion') ||
      name.includes('shadow') || name.includes('bowie') || name.includes('daggers') ||
      name.includes('talon') || name.includes('ursus') || name.includes('navaja') ||
      name.includes('stiletto') || name.includes('skeleton') || name.includes('survival') ||
      name.includes('paracord') || name.includes('nomad') || name.includes('driver')) {
    return 'Knife';
  }
  
  if (name.includes('gloves') || name.includes('hand')) {
    return 'Gloves';
  }
  
  if (name.includes('ak-47') || name.includes('m4a4') || name.includes('m4a1') ||
      name.includes('awp') || name.includes('galil') || name.includes('famas') ||
      name.includes('aug') || name.includes('sg') || name.includes('scar') ||
      name.includes('g3sg1') || name.includes('ssg') || name.includes('g3sg1')) {
    return 'Rifle';
  }
  
  if (name.includes('pistol') || name.includes('glock') || name.includes('usp') ||
      name.includes('p250') || name.includes('tec-9') || name.includes('five-seven') ||
      name.includes('cz75') || name.includes('deagle') || name.includes('r8') ||
      name.includes('p2000') || name.includes('dual')) {
    return 'Pistol';
  }
  
  if (name.includes('container') || name.includes('case') || name.includes('key')) {
    return 'Container';
  }
  
  if (name.includes('sticker') || name.includes('patch')) {
    return 'Sticker';
  }
  
  return 'Other';
}

/**
 * Opções de ordenação
 */
export const SORT_OPTIONS = [
  { value: 'price_desc', label: 'Price (high to low)' },
  { value: 'price_asc', label: 'Price (low to high)' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
  { value: 'float_asc', label: 'Float (low to high)' },
  { value: 'float_desc', label: 'Float (high to low)' },
] as const;

export type SortValue = typeof SORT_OPTIONS[number]['value'];

/**
 * Ordena itens baseado no critério selecionado
 */
export function sortItems(items: Item[], sortValue: SortValue): Item[] {
  const sorted = [...items];
  
  switch (sortValue) {
    case 'price_desc':
      return sorted.sort((a, b) => {
        const valueA = (a.price || a.current_price || 0) * (a.quantity || 1);
        const valueB = (b.price || b.current_price || 0) * (b.quantity || 1);
        return valueB - valueA;
      });
    
    case 'price_asc':
      return sorted.sort((a, b) => {
        const valueA = (a.price || a.current_price || 0) * (a.quantity || 1);
        const valueB = (b.price || b.current_price || 0) * (b.quantity || 1);
        return valueA - valueB;
      });
    
    case 'name_asc':
      return sorted.sort((a, b) => 
        a.market_hash_name.localeCompare(b.market_hash_name)
      );
    
    case 'name_desc':
      return sorted.sort((a, b) => 
        b.market_hash_name.localeCompare(a.market_hash_name)
      );
    
    case 'float_asc':
      return sorted.sort((a, b) => {
        const floatA = a.float_value ?? 1;
        const floatB = b.float_value ?? 1;
        return floatA - floatB;
      });
    
    case 'float_desc':
      return sorted.sort((a, b) => {
        const floatA = a.float_value ?? 1;
        const floatB = b.float_value ?? 1;
        return floatB - floatA;
      });
    
    default:
      return sorted;
  }
}

/**
 * Filtra itens baseado nos critérios
 */
export function filterItems(
  items: Item[],
  searchQuery: string,
  categories: string[],
  rarities: string[]
): Item[] {
  return items.filter((item) => {
    // Busca por nome
    if (searchQuery) {
      const name = item.market_hash_name.toLowerCase();
      if (!name.includes(searchQuery.toLowerCase())) {
        return false;
      }
    }
    
    // Filtro de categoria
    if (categories.length > 0) {
      const category = getItemCategory(item.market_hash_name);
      if (!categories.includes(category)) {
        return false;
      }
    }
    
    // Filtro de raridade
    if (rarities.length > 0) {
      const rarity = getRarityFromName(item.market_hash_name) || 
                     getRarityFromName(item.rarity_tag || '') ||
                     'consumer_grade';
      if (!rarities.includes(rarity)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Opções de categoria para filtros
 */
export const CATEGORY_OPTIONS = [
  { value: 'Knife', label: 'Knives' },
  { value: 'Gloves', label: 'Gloves' },
  { value: 'Rifle', label: 'Rifles' },
  { value: 'Pistol', label: 'Pistols' },
  { value: 'Container', label: 'Containers' },
  { value: 'Sticker', label: 'Stickers' },
  { value: 'Other', label: 'Other' },
] as const;

/**
 * Opções de raridade para filtros
 */
export const RARITY_OPTIONS = [
  { value: 'consumer_grade', label: 'Consumer' },
  { value: 'industrial_grade', label: 'Industrial' },
  { value: 'mil_spec', label: 'Mil-Spec' },
  { value: 'restricted', label: 'Restricted' },
  { value: 'classified', label: 'Classified' },
  { value: 'covert', label: 'Covert' },
  { value: 'contraband', label: 'Contraband' },
] as const;

