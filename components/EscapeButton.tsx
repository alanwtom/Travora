import { COLORS } from '@/lib/constants';
import { X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface EscapeButtonProps {
  onPress?: () => void;
}

export function EscapeButton({ onPress }: EscapeButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) onPress();
    else router.back();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel="Close"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <X size={22} color={COLORS.primary} strokeWidth={3} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 10,
  },
});
