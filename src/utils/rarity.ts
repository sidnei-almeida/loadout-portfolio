/**
 * Rarity Colors - Cores Oficiais do CS2
 * Mapeamento exato das cores de raridade do Counter-Strike 2
 */

export const RARITY_COLORS = {
  consumer_grade: '#b0c3d9', // Cinza (Comum)
  industrial_grade: '#5e98d9', // Azul Claro (Incomum)
  mil_spec: '#4b69ff', // Azul Escuro (Raro)
  restricted: '#8847ff', // Roxo (Mítico)
  classified: '#d32ce6', // Rosa (Lendário)
  covert: '#eb4b4b', // Vermelho (Ancestral)
  contraband: '#e4ae39', // Dourado (Imortal/Howl)
  gold: '#e4ae39', // Dourado (Facas/Luvas)
  default: '#b0c3d9', // Fallback (Cinza)
} as const;

export type RarityKey = keyof typeof RARITY_COLORS;

/**
 * Mapeamento de tags da API Steam para raridades
 */
const RARITY_TAG_MAP: Record<string, RarityKey> = {
  // Consumer Grade (Comum)
  'rarity_common_weapon': 'consumer_grade',
  'rarity_common': 'consumer_grade',
  'consumer': 'consumer_grade',
  
  // Industrial Grade (Incomum)
  'rarity_uncommon_weapon': 'industrial_grade',
  'rarity_uncommon': 'industrial_grade',
  'industrial': 'industrial_grade',
  
  // Mil-Spec (Raro)
  'rarity_rare_weapon': 'mil_spec',
  'rarity_rare': 'mil_spec',
  'mil_spec': 'mil_spec',
  'milspec': 'mil_spec',
  
  // Restricted (Mítico)
  'rarity_mythical_weapon': 'restricted',
  'rarity_mythical': 'restricted',
  'restricted': 'restricted',
  
  // Classified (Lendário)
  'rarity_legendary_weapon': 'classified',
  'rarity_legendary': 'classified',
  'classified': 'classified',
  
  // Covert (Ancestral)
  'rarity_ancient_weapon': 'covert',
  'rarity_ancient': 'covert',
  'covert': 'covert',
  
  // Contraband/Gold (Imortal)
  'rarity_immortal_weapon': 'contraband',
  'rarity_immortal': 'contraband',
  'contraband': 'contraband',
  'gold': 'gold',
};

/**
 * Obtém a chave de raridade (para uso em data-rarity)
 */
export function getRarityKey(rarityTag: string | null | undefined): RarityKey {
  if (!rarityTag) {
    return 'default';
  }
  
  const normalizedTag = rarityTag.toLowerCase().replace(/\s+/g, '_');
  
  // Tenta encontrar no mapeamento direto
  if (RARITY_TAG_MAP[normalizedTag]) {
    return RARITY_TAG_MAP[normalizedTag];
  }
  
  // Busca parcial
  for (const [tag, rarityKey] of Object.entries(RARITY_TAG_MAP)) {
    if (normalizedTag.includes(tag) || tag.includes(normalizedTag)) {
      return rarityKey;
    }
  }
  
  // Fallback por palavras-chave
  if (normalizedTag.includes('ancient') || normalizedTag.includes('covert')) {
    return 'covert';
  }
  if (normalizedTag.includes('legendary') || normalizedTag.includes('classified')) {
    return 'classified';
  }
  if (normalizedTag.includes('mythical') || normalizedTag.includes('restricted')) {
    return 'restricted';
  }
  if (normalizedTag.includes('rare') || normalizedTag.includes('mil')) {
    return 'mil_spec';
  }
  if (normalizedTag.includes('uncommon') || normalizedTag.includes('industrial')) {
    return 'industrial_grade';
  }
  if (normalizedTag.includes('immortal') || normalizedTag.includes('contraband') || normalizedTag.includes('gold')) {
    return 'contraband';
  }
  
  return 'default';
}

/**
 * Obtém a cor hexadecimal da raridade baseada na tag da API ou nome do item
 */
export function getRarityColor(rarityTagOrName: string | null | undefined): string {
  if (!rarityTagOrName || typeof rarityTagOrName !== 'string') {
    return RARITY_COLORS.default;
  }
  
  // Primeiro tenta obter a chave de raridade usando getRarityKey (para tags)
  const rarityKey = getRarityKey(rarityTagOrName);
  if (rarityKey && rarityKey !== 'default' && RARITY_COLORS[rarityKey]) {
    return RARITY_COLORS[rarityKey];
  }
  
  // Se não encontrou pela tag, detecta diretamente pelo nome
  const normalized = rarityTagOrName.toLowerCase();
  
  // Ordem de prioridade (do mais raro para o menos raro)
  if (normalized.includes('contraband') || normalized.includes('howl') || normalized.includes('immortal') || normalized.includes('gold')) {
    return RARITY_COLORS.contraband;
  }
  if (normalized.includes('covert') || normalized.includes('ancient')) {
    return RARITY_COLORS.covert;
  }
  if (normalized.includes('classified') || normalized.includes('legendary')) {
    return RARITY_COLORS.classified;
  }
  if (normalized.includes('restricted') || normalized.includes('mythical')) {
    return RARITY_COLORS.restricted;
  }
  if (normalized.includes('mil') || normalized.includes('rare')) {
    return RARITY_COLORS.mil_spec;
  }
  if (normalized.includes('industrial') || normalized.includes('uncommon')) {
    return RARITY_COLORS.industrial_grade;
  }
  if (normalized.includes('consumer') || normalized.includes('common')) {
    return RARITY_COLORS.consumer_grade;
  }
  
  // Fallback seguro
  return RARITY_COLORS.default;
}

/**
 * Detecta raridade baseada no nome do item (fallback quando não há tag da API)
 */
export function getRarityFromName(marketHashName: string | null | undefined): RarityKey {
  if (!marketHashName || typeof marketHashName !== 'string') {
    return 'default';
  }
  
  const name = marketHashName.toLowerCase();
  
  // Ordem de prioridade (do mais raro para o menos raro)
  // Contraband/Gold (mais raro - facas e luvas especiais)
  if (
    name.includes('contraband') ||
    name.includes('howl') ||
    name.includes('★') ||
    (name.includes('knife') && (name.includes('karambit') || name.includes('butterfly') || name.includes('fade') || name.includes('doppler'))) ||
    (name.includes('gloves') && (name.includes('fade') || name.includes('crimson'))) ||
    name.includes('karambit') ||
    name.includes('butterfly') ||
    name.includes('m9 bayonet') ||
    name.includes('bayonet') ||
    name.includes('huntsman') ||
    name.includes('flip') ||
    name.includes('gut') ||
    name.includes('falchion') ||
    name.includes('shadow') ||
    name.includes('bowie') ||
    name.includes('daggers') ||
    name.includes('talon') ||
    name.includes('ursus') ||
    name.includes('navaja') ||
    name.includes('stiletto') ||
    name.includes('skeleton') ||
    name.includes('survival') ||
    name.includes('paracord') ||
    name.includes('nomad') ||
    name.includes('driver')
  ) {
    return 'contraband';
  }
  
  // Covert (vermelho - Ancestral)
  if (
    name.includes('covert') ||
    name.includes('ancient') ||
    name.includes('ak-47 | fire serpent') ||
    name.includes('awp | dragon lore') ||
    name.includes('m4a4 | howl')
  ) {
    return 'covert';
  }
  
  // Classified (rosa - Lendário)
  if (name.includes('classified') || name.includes('legendary')) {
    return 'classified';
  }
  
  // Restricted (roxo - Mítico)
  if (name.includes('restricted') || name.includes('mythical')) {
    return 'restricted';
  }
  
  // Mil-Spec (azul - Raro)
  if (name.includes('milspec') || name.includes('mil-spec') || name.includes('rare')) {
    return 'mil_spec';
  }
  
  // Industrial (azul claro - Incomum)
  if (name.includes('industrial') || name.includes('uncommon')) {
    return 'industrial_grade';
  }
  
  // Consumer (cinza - Comum)
  if (name.includes('consumer') || name.includes('common')) {
    return 'consumer_grade';
  }
  
  return 'default';
}

