import { useMemo } from 'react';
import { useLanguage } from '@contexts/LanguageContext';
import { CATEGORY_OPTIONS, RARITY_OPTIONS, SORT_OPTIONS } from '@utils/filters';
import type { SortValue } from '@utils/filters';

const SORT_KEY_MAP: Record<string, string> = {
  price_desc: 'priceHighToLow',
  price_asc: 'priceLowToHigh',
  name_asc: 'nameAtoZ',
  name_desc: 'nameZtoA',
  float_asc: 'floatLowToHigh',
  float_desc: 'floatHighToLow',
};

const CATEGORY_KEY_MAP: Record<string, string> = {
  Knife: 'knives',
  Gloves: 'gloves',
  Rifle: 'rifles',
  Pistol: 'pistols',
  Container: 'containers',
  Sticker: 'stickers',
  Other: 'other',
};

const RARITY_KEY_MAP: Record<string, string> = {
  consumer_grade: 'consumer',
  industrial_grade: 'industrial',
  mil_spec: 'milSpec',
  restricted: 'restricted',
  classified: 'classified',
  covert: 'covert',
  contraband: 'contraband',
};

export function useTranslatedFilters() {
  const { t } = useLanguage();

  const sortOptions = useMemo(
    () =>
      SORT_OPTIONS.map((opt) => ({
        value: opt.value,
        label: t(SORT_KEY_MAP[opt.value] as any) || opt.label,
      })),
    [t],
  );

  const categoryOptions = useMemo(
    () =>
      CATEGORY_OPTIONS.map((opt) => ({
        value: opt.value,
        label: t(CATEGORY_KEY_MAP[opt.value] as any) || opt.label,
      })),
    [t],
  );

  const rarityOptions = useMemo(
    () =>
      RARITY_OPTIONS.map((opt) => ({
        value: opt.value,
        label: t(RARITY_KEY_MAP[opt.value] as any) || opt.label,
      })),
    [t],
  );

  return { sortOptions, categoryOptions, rarityOptions };
}
