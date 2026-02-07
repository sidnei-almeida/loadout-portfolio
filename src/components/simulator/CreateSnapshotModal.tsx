import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography } from '@theme';
import { useCustomAlert } from '@components/common/CustomAlertDialog';

// Helper para garantir valores seguros
const safeTypography = typography || {
  fonts: { secondary: 'Rajdhani' },
  weights: { medium: '500' },
  sizes: { sm: 13, md: 15 },
};
const safeColors = colors || { text: '#FFFFFF' };
const safeSpacing = spacing || { xs: 4 };

interface CreateSnapshotModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (description: string, icon?: string) => Promise<void>;
}

export const CreateSnapshotModal: React.FC<CreateSnapshotModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showAlert, AlertDialog } = useCustomAlert();

  const handleSubmit = async () => {
    if (!description.trim()) {
      showAlert('Error', 'Please enter a title for the snapshot.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(description.trim(), 'target');
      setDescription('');
      onClose();
    } catch (error) {
      showAlert(
        'Error',
        error instanceof Error ? error.message : 'Could not create snapshot. Please try again.',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setDescription('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>New Snapshot</Text>
            <TouchableOpacity 
              onPress={handleClose} 
              disabled={isSubmitting} 
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>CLOSE</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Snapshot title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Before AWP trade"
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                maxLength={100}
                editable={!isSubmitting}
              />
              <Text style={styles.hint}>
                Choose a title to identify this snapshot
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleClose}
                disabled={isSubmitting}
              >
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, isSubmitting && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Text style={styles.buttonPrimaryText}>Create Snapshot</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      <AlertDialog />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)', // Overlay mais escuro para elegância
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: '#1a1a1a', // Fundo cinza escuro premium
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.4)', // Borda dourada elegante e fina
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 194, 145, 0.15)', // Borda dourada sutil
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semiBold,
    color: '#d4c291', // Dourado para título premium
    fontFamily: typography.fonts.primaryBold,
    letterSpacing: 0.5,
  },
  closeButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  closeButtonText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.secondarySemiBold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  body: {
    padding: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semiBold,
    color: '#d4c291', // Dourado para label premium
    marginBottom: spacing.sm,
    fontFamily: typography.fonts.secondarySemiBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#1f1f1f', // Fundo mais escuro para input
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.3)', // Borda dourada elegante e fina
    fontFamily: typography.fonts.secondary,
    minHeight: 48,
  },
  hint: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontFamily: typography.fonts.secondary,
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonPrimary: {
    backgroundColor: 'transparent', // Fundo transparente elegante
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.5)', // Borda dourada elegante e fina
  },
  buttonSecondary: {
    backgroundColor: 'transparent', // Fundo transparente
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)', // Borda cinza sutil e fina
  },
  buttonDisabled: {
    opacity: 0.5,
    borderColor: 'rgba(212, 194, 145, 0.2)',
  },
  buttonPrimaryText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semiBold,
    color: '#d4c291', // Texto dourado
    fontFamily: typography.fonts.secondarySemiBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  buttonSecondaryText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    fontFamily: typography.fonts.secondarySemiBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

