import { COLORS } from '@/lib/constants';
import { PersonalizedFeedVideo } from '@/services/personalizedFeed';
import * as Icons from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SwipeDeckVideoCard } from './SwipeDeckVideoCard';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_OUT = SCREEN_W * 1.35;
const THRESHOLD = SCREEN_W * 0.22;
const MAX_ROTATE = 14;

type Props = {
  current: PersonalizedFeedVideo;
  next: PersonalizedFeedVideo | undefined;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
};

export function SwipeVideoDeck({ current, next, onSwipeLeft, onSwipeRight }: Props) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const fireLeft = useCallback(() => {
    onSwipeLeft();
  }, [onSwipeLeft]);

  const fireRight = useCallback(() => {
    onSwipeRight();
  }, [onSwipeRight]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-8, 8])
        .onUpdate((e) => {
          translateX.value = e.translationX;
          translateY.value = e.translationY * 0.08;
        })
        .onEnd((e) => {
          const vx = e.velocityX;
          const tx = translateX.value;
          const goRight = tx > THRESHOLD || vx > 800;
          const goLeft = tx < -THRESHOLD || vx < -800;

          if (goRight) {
            translateX.value = withTiming(
              SWIPE_OUT,
              { duration: 220 },
              (finished) => {
                if (finished) runOnJS(fireRight)();
              }
            );
          } else if (goLeft) {
            translateX.value = withTiming(
              -SWIPE_OUT,
              { duration: 220 },
              (finished) => {
                if (finished) runOnJS(fireLeft)();
              }
            );
          } else {
            translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
            translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
          }
        }),
    [fireLeft, fireRight, translateX, translateY]
  );

  const topCardStyle = useAnimatedStyle(() => {
    const rot = interpolate(
      translateX.value,
      [-SCREEN_W, 0, SCREEN_W],
      [-MAX_ROTATE, 0, MAX_ROTATE],
      'clamp'
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rot}deg` },
      ],
    };
  });

  const likeOverlayStyle = useAnimatedStyle(() => {
    const o = interpolate(translateX.value, [0, THRESHOLD], [0, 1], 'clamp');
    return { opacity: o };
  });

  const passOverlayStyle = useAnimatedStyle(() => {
    const o = interpolate(translateX.value, [-THRESHOLD, 0], [1, 0], 'clamp');
    return { opacity: o };
  });

  return (
    <View style={styles.stack}>
      {next ? (
        <View style={[styles.backCard, styles.cardAbsolute]}>
          <SwipeDeckVideoCard video={next} isActive={false} dimmed />
        </View>
      ) : (
        <View style={[styles.backCard, styles.cardAbsolute, styles.backPlaceholder]}>
          <Text style={styles.backPlaceholderText}>Loading more…</Text>
        </View>
      )}

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.frontCard, styles.cardAbsolute, topCardStyle]}>
          <SwipeDeckVideoCard video={current} isActive />
          <Animated.View
            pointerEvents="none"
            style={[styles.overlayBase, styles.likeOverlay, likeOverlayStyle]}
          >
            <Icons.Heart size={72} color={COLORS.success} fill={COLORS.success} strokeWidth={1.5} />
            <Text style={styles.overlayLabel}>SAVE</Text>
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[styles.overlayBase, styles.passOverlay, passOverlayStyle]}
          >
            <Icons.X size={72} color={COLORS.error} strokeWidth={3} />
            <Text style={[styles.overlayLabel, styles.passLabel]}>PASS</Text>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAbsolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backCard: {
    borderRadius: 16,
    overflow: 'hidden',
    transform: [{ scale: 0.96 }],
  },
  backPlaceholder: {
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  backPlaceholderText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  frontCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  overlayBase: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 4,
  },
  likeOverlay: {
    backgroundColor: 'rgba(106, 175, 114, 0.12)',
    borderColor: COLORS.success,
  },
  passOverlay: {
    backgroundColor: 'rgba(212, 100, 90, 0.12)',
    borderColor: COLORS.error,
  },
  overlayLabel: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.success,
    letterSpacing: 2,
  },
  passLabel: {
    color: COLORS.error,
  },
});
