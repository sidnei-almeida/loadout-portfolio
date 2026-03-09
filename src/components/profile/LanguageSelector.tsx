import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useLanguage } from '@contexts/LanguageContext';
import { ArrowDownIcon, CheckIcon } from '@components/common/Icons';
import { spacing, typography } from '@theme';
import type { Locale } from '@/i18n/translations';

/** Labels fixos por idioma - nunca traduzir */
const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
];

const getLabelForLocale = (locale: Locale) =>
  LOCALE_OPTIONS.find((o) => o.value === locale)?.label ?? locale;

export const LanguageSelector: React.FC = () => {
  const { locale, setLocale, t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);

  const currentLabel = getLabelForLocale(locale);
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;

  const handleSelect = (value: Locale) => {
    setLocale(value);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          <View style={styles.textColumn}>
            <Text style={styles.label}>{t('language')}</Text>
            <Text style={styles.value}>{currentLabel}</Text>
          </View>
          <ArrowDownIcon
            size={18}
            color="rgba(212, 194, 145, 0.6)"
            strokeWidth={2}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent
      >
        <Pressable
          style={[styles.overlay, { paddingTop: statusBarHeight }]}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{t('language')}</Text>

            <ScrollView
              style={styles.scrollList}
              contentContainerStyle={styles.scrollListContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
              scrollEnabled={true}
            >
              {LOCALE_OPTIONS.map(({ value, label }) => {
                const isSelected = locale === value;
                return (
                  <TouchableOpacity
                    key={value}
                    style={styles.listItem}
                    onPress={() => handleSelect(value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.listItemText,
                        isSelected && styles.listItemTextSelected,
                      ]}
                    >
                      {label}
                    </Text>
                    {isSelected && (
                      <CheckIcon
                        size={20}
                        color="rgba(212, 194, 145, 0.9)"
                        strokeWidth={2.5}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.25)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: typography.sizes.xs,
    color: '#6B7280',
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  value: {
    fontSize: typography.sizes.md,
    color: '#d4c291',
    fontFamily: typography.fonts.primarySemiBold,
    fontWeight: typography.weights.semiBold,
    letterSpacing: 0.3,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1c1b19',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl + 24,
    maxHeight: Dimensions.get('window').height * 0.65,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(212, 194, 145, 0.35)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: typography.sizes.xs,
    color: '#6B7280',
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  scrollList: {
    height: 160,
  },
  scrollListContent: {
    paddingBottom: spacing.lg,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    marginBottom: 2,
  },
  listItemText: {
    fontSize: typography.sizes.md,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: typography.fonts.secondary,
    fontWeight: typography.weights.medium,
  },
  listItemTextSelected: {
    color: '#d4c291',
    fontFamily: typography.fonts.secondaryBold,
    fontWeight: typography.weights.semiBold,
  },
});
