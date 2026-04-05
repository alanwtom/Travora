import { BackHandler } from 'react-native';
import { useEffect } from 'react';

/**
 * Hook to handle Android hardware back button for modals.
 * Prevents the back button from exiting the app when a modal is visible,
 * and calls onClose instead.
 */
export function useModalBackHandler(visible: boolean, onClose: () => void) {
  useEffect(() => {
    if (!visible) return;

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onClose();
        return true; // Prevent default back navigation
      }
    );

    return () => subscription.remove();
  }, [visible, onClose]);
}
