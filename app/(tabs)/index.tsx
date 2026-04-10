import { VerticalVideoFeed } from "@/components/VerticalVideoFeed";
import { usePersonalizedFeed } from "@/hooks/usePersonalizedFeed";
import { COLORS } from "@/lib/constants";
import { useAuth } from "@/providers/AuthProvider";
import { useSwipeItinerary } from "@/providers/SwipeItineraryProvider";
import { PersonalizedFeedVideo } from "@/services/personalizedFeed";
import {
  recordSwipe,
  removeDislikedVideo,
  removeSwipe,
  saveDislikedVideo,
} from "@/services/swipes";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export default function HomeScreen() {
  const { user } = useAuth();
  const { addToItinerary, removeFromItineraryById } = useSwipeItinerary();
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [lastSwipeAction, setLastSwipeAction] = useState<{
    direction: "left" | "right";
    video: PersonalizedFeedVideo;
  } | null>(null);
  const snackbarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snackbarVisible = useSharedValue(0);
  const feed = usePersonalizedFeed("both");

  const handleSwipeDecision = useCallback(
    (direction: "left" | "right", video: any) => {
      if (direction === "right") {
        addToItinerary(video);
        if (user?.id) {
          recordSwipe(user.id, video.id, "like").catch(() => {});
        }
      } else {
        saveDislikedVideo(video.id).catch(() => {});
        if (user?.id) {
          recordSwipe(user.id, video.id, "dislike").catch(() => {});
        }
      }

      setLastSwipeAction({ direction, video });
      setSnackbarMessage(direction === "right" ? "Saved to itinerary" : "Passed");
      snackbarVisible.value = withTiming(1, { duration: 180 });
      if (snackbarTimerRef.current) {
        clearTimeout(snackbarTimerRef.current);
      }
      snackbarTimerRef.current = setTimeout(() => {
        snackbarVisible.value = withTiming(0, { duration: 180 });
        setSnackbarMessage(null);
        setLastSwipeAction(null);
      }, 3500);
    },
    [addToItinerary, user?.id],
  );

  useEffect(() => {
    return () => {
      if (snackbarTimerRef.current) {
        clearTimeout(snackbarTimerRef.current);
      }
    };
  }, []);

  const handleUndoSwipe = useCallback(async () => {
    const action = lastSwipeAction;
    if (!action) return;

    if (snackbarTimerRef.current) {
      clearTimeout(snackbarTimerRef.current);
    }
    snackbarVisible.value = withTiming(0, { duration: 180 });
    setSnackbarMessage(null);
    setLastSwipeAction(null);

    if (action.direction === "right") {
      removeFromItineraryById(action.video.id);
    } else {
      await removeDislikedVideo(action.video.id);
    }
    if (user?.id) {
      await removeSwipe(user.id, action.video.id);
    }
  }, [lastSwipeAction, removeFromItineraryById, user?.id]);

  const snackbarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: snackbarVisible.value,
    transform: [
      {
        translateY: (1 - snackbarVisible.value) * 16,
      },
    ],
  }));

  return (
    <View style={styles.container}>
      <VerticalVideoFeed
        videos={feed.videos}
        isLoading={feed.isLoading}
        isRefreshing={feed.isRefreshing}
        onLoadMore={feed.loadMore}
        onRefresh={feed.refresh}
        hasMore={feed.hasMore}
        onSwipeDecision={handleSwipeDecision}
      />

      {snackbarMessage ? (
        <View style={styles.snackbarWrap} pointerEvents="box-none">
          <Animated.View style={[styles.snackbar, snackbarAnimatedStyle]}>
            <Text style={styles.snackbarText}>{snackbarMessage}</Text>
            <Pressable onPress={handleUndoSwipe} style={styles.snackbarUndoBtn}>
              <Text style={styles.snackbarUndoText}>Undo</Text>
            </Pressable>
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  snackbarWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 20,
    alignItems: "center",
    zIndex: 30,
  },
  snackbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(15,23,42,0.96)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: "92%",
  },
  snackbarText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  snackbarUndoBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  snackbarUndoText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
