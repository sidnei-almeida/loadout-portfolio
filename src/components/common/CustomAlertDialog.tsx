import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { colors, spacing, typography } from '@theme';
import { AlertCircleIcon, CheckCircleIcon, XCircleIcon, InfoIcon } from './Icons';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertDialogProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  buttons?: AlertButton[];
  onDismiss?: () => void;
}

// Helper para garantir valores seguros
const safeTypography = typography || {
  fonts: { secondary: 'Rajdhani', primary: 'Rajdhani' },
  weights: { medium: '500', bold: '700', semiBold: '600' },
  sizes: { md: 15, sm: 13, xs: 11 },
};
const safeColors = colors || { text: '#FFFFFF', error: '#EF4444', success: '#10B981' };
const safeSpacing = spacing || { md: 16, sm: 8, xs: 4 };

export const CustomAlertDialog: React.FC<CustomAlertDialogProps> = ({
  visible,
  title,
  message,
  type = 'info',
  buttons = [{ text: 'OK' }],
  onDismiss,
}) => {
  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  const getIcon = () => {
    const iconSize = 32;
    const iconColor = 
      type === 'error' ? '#EF4444' :
      type === 'success' ? '#10B981' :
      type === 'warning' ? '#F59E0B' :
      '#d4c291'; // Tactical Gold para info

    switch (type) {
      case 'error':
        return <XCircleIcon size={iconSize} color={iconColor} strokeWidth={2.5} />;
      case 'success':
        return <CheckCircleIcon size={iconSize} color={iconColor} strokeWidth={2.5} />;
      case 'warning':
        return <AlertCircleIcon size={iconSize} color={iconColor} strokeWidth={2.5} />;
      default:
        return <InfoIcon size={iconSize} color={iconColor} strokeWidth={2.5} />;
    }
  };

  const getButtonStyle = (buttonStyle?: string) => {
    if (buttonStyle === 'destructive') {
      return styles.destructiveButton;
    }
    if (buttonStyle === 'cancel') {
      return styles.cancelButton;
    }
    return styles.defaultButton;
  };

  const getButtonTextStyle = (buttonStyle?: string) => {
    if (buttonStyle === 'destructive') {
      return styles.destructiveButtonText;
    }
    if (buttonStyle === 'cancel') {
      return styles.cancelButtonText;
    }
    return styles.defaultButtonText;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                {getIcon()}
              </View>

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message */}
              <Text style={styles.message}>{message}</Text>

              {/* Buttons */}
              <View style={styles.buttonsContainer}>
                {buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      getButtonStyle(button.style),
                      buttons.length === 1 && styles.singleButton,
                      buttons.length > 1 && styles.multipleButton,
                    ]}
                    onPress={() => handleButtonPress(button)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.buttonText,
                      getButtonTextStyle(button.style),
                    ]}>
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: safeSpacing.lg || 24,
  },
  container: {
    backgroundColor: '#1c1b19', // Tactical dark background
    borderRadius: 16,
    padding: safeSpacing.lg || 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.3)', // Tactical Gold border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: safeSpacing.md,
  },
  title: {
    fontSize: safeTypography.sizes.md + 4 || 19,
    fontWeight: safeTypography.weights.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: safeSpacing.sm,
    fontFamily: safeTypography.fonts.primary,
  },
  message: {
    fontSize: safeTypography.sizes.sm || 13,
    color: '#9CA3AF', // Gray-400
    textAlign: 'center',
    marginBottom: safeSpacing.lg,
    lineHeight: 20,
    fontFamily: safeTypography.fonts.secondary,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: safeSpacing.sm,
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: safeSpacing.sm + 2,
    paddingHorizontal: safeSpacing.lg,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  singleButton: {
    flex: 1,
    width: '100%',
  },
  multipleButton: {
    flex: 1,
  },
  defaultButton: {
    backgroundColor: '#d4c291', // Tactical Gold
    borderWidth: 1,
    borderColor: '#d4c291',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(212, 194, 145, 0.3)',
  },
  destructiveButton: {
    backgroundColor: '#EF4444', // Red-500
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  buttonText: {
    fontSize: safeTypography.sizes.sm || 13,
    fontWeight: safeTypography.weights.semiBold,
    fontFamily: safeTypography.fonts.secondaryBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  defaultButtonText: {
    color: '#000000', // Black text on gold
  },
  cancelButtonText: {
    color: '#d4c291', // Tactical Gold
  },
  destructiveButtonText: {
    color: '#FFFFFF',
  },
});

/**
 * Hook para usar CustomAlertDialog de forma simples
 */
export const useCustomAlert = () => {
  const [alertState, setAlertState] = React.useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    buttons?: AlertButton[];
    onDismiss?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [{ text: 'OK' }],
  });

  const showAlert = React.useCallback((
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    buttons?: AlertButton[]
  ) => {
    setAlertState({
      visible: true,
      title,
      message,
      type,
      buttons: buttons || [{ text: 'OK' }],
      onDismiss: () => setAlertState(prev => ({ ...prev, visible: false })),
    });
  }, []);

  const hideAlert = React.useCallback(() => {
    setAlertState(prev => ({ ...prev, visible: false }));
  }, []);

  const AlertDialog = React.useCallback(() => (
    <CustomAlertDialog
      visible={alertState.visible}
      title={alertState.title}
      message={alertState.message}
      type={alertState.type}
      buttons={alertState.buttons}
      onDismiss={alertState.onDismiss}
    />
  ), [alertState]);

  return {
    showAlert,
    hideAlert,
    AlertDialog,
  };
};

