import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import * as Icons from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

// Create an animated wrapper view
const AnimatedView = Animated.View;

export type AnimationType = 'pop' | 'bounce' | 'spin' | 'shake' | 'pulse' | 'none';

// Get all icon names from lucide-react-native
export type IconName = keyof typeof Icons;

export interface AnimatedIconProps {
  name: IconName;
  size?: number;
  color?: string;
  animation?: AnimationType;
  triggerAnimation?: boolean;
  style?: ViewStyle;
  strokeWidth?: number;
  fill?: boolean | string | number;
}

const AnimatedLucideIcon: React.FC<AnimatedIconProps> = ({
  name,
  size = 24,
  color = '#000',
  animation = 'none',
  triggerAnimation = false,
  style,
  strokeWidth = 2,
  fill = false,
}) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Get the Lucide icon component
  const IconComponent = Icons[name];

  if (!IconComponent) {
    console.warn(`AnimatedIcon: Icon "${name}" not found in lucide-react-native`);
    return null;
  }

  useEffect(() => {
    if (animation === 'none') return;

    const runAnimation = () => {
      switch (animation) {
        case 'pop':
          // Quick scale up then back
          scale.value = withSequence(
            withTiming(1.3, { duration: 100, easing: Easing.out(Easing.back(1.5)) }),
            withTiming(1, { duration: 200, easing: Easing.inOut(Easing.ease) })
          );
          break;

        case 'bounce':
          // Gentle bounce
          scale.value = withSequence(
            withTiming(1.15, { duration: 200, easing: Easing.bezier(0.34, 1.56, 0.64, 1) }),
            withTiming(1, { duration: 200, easing: Easing.inOut(Easing.ease) })
          );
          break;

        case 'spin':
          // Continuous rotation
          rotation.value = withRepeat(
            withTiming(360, { duration: 1000, easing: Easing.linear }),
            -1,
            false
          );
          break;

        case 'shake':
          // Horizontal shake
          translateX.value = withSequence(
            withTiming(-10, { duration: 50 }),
            withTiming(10, { duration: 50 }),
            withTiming(-10, { duration: 50 }),
            withTiming(10, { duration: 50 }),
            withTiming(0, { duration: 50 })
          );
          break;

        case 'pulse':
          // Gentle pulse
          scale.value = withRepeat(
            withSequence(
              withTiming(1.1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
              withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            false
          );
          break;
      }
    };

    runAnimation();

    return () => {
      cancelAnimation(scale);
      cancelAnimation(rotation);
      cancelAnimation(translateX);
      cancelAnimation(opacity);
    };
  }, [animation]);

  // Handle trigger animation (one-time animation on state change)
  useEffect(() => {
    if (triggerAnimation) {
      scale.value = withSequence(
        withTiming(1.2, { duration: 100, easing: Easing.out(Easing.back(1.5)) }),
        withTiming(1, { duration: 200, easing: Easing.inOut(Easing.ease) })
      );
    }
  }, [triggerAnimation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
      { translateX: translateX.value },
    ],
    opacity: opacity.value,
  }));

  // Type cast for icon component
  const LucideIcon = IconComponent as React.FC<{
    size?: number;
    color?: string;
    strokeWidth?: number;
    fill?: string | number | boolean;
    absoluteStrokeWidth?: boolean;
  }>;

  return (
    <AnimatedView style={animatedStyle}>
      <LucideIcon
        size={size}
        color={color}
        strokeWidth={strokeWidth}
        fill={fill ? 'currentColor' : 'none'}
        absoluteStrokeWidth
      />
    </AnimatedView>
  );
};

export default AnimatedLucideIcon;

// Re-export all Lucide icons for convenience
export * from 'lucide-react-native';
