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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { BookmarkCheck } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SWIPE_TIP_DISMISSED_KEY = "travora:swipe_tip_dismissed";
const SWIPE_TIP_INTRO_VERSION_KEY = "travora:swipe_tip_intro_version";
const SWIPE_TIP_INTRO_VERSION = "2";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { addToItinerary, removeFromItineraryById } = useSwipeItinerary();
  const [mediaType, setMediaType] = useState<"video" | "image" | "both">(
    "both",
  );
  const [showSwipeTip, setShowSwipeTip] = useState(false);
  const [showIntroOverlay, setShowIntroOverlay] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [lastSwipeAction, setLastSwipeAction] = useState<{
    direction: "left" | "right";
    video: PersonalizedFeedVideo;
  } | null>(null);
  const snackbarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snackbarVisible = useSharedValue(0);
  const feed = usePersonalizedFeed(mediaType);

  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of feed.videos) {
      for (const t of v.tags ?? []) {
        const tag = t.trim();
        if (!tag) continue;
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [feed.videos]);

  const filteredVideos = useMemo(() => {
    if (!selectedTag) return feed.videos;
    return feed.videos.filter((v) => (v.tags ?? []).includes(selectedTag));
  }, [feed.videos, selectedTag]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [dismissed, introVersion] = await Promise.all([
          AsyncStorage.getItem(SWIPE_TIP_DISMISSED_KEY),
          AsyncStorage.getItem(SWIPE_TIP_INTRO_VERSION_KEY),
        ]);
        if (!mounted) return;
        if (dismissed === "true" && introVersion === SWIPE_TIP_INTRO_VERSION) {
          setShowSwipeTip(false);
          setShowIntroOverlay(false);
        } else {
          setShowIntroOverlay(true);
        }
      } catch {
        if (mounted) setShowIntroOverlay(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const dismissSwipeTip = useCallback(async () => {
    setShowSwipeTip(false);
    setShowIntroOverlay(false);
    try {
      await Promise.all([
        AsyncStorage.setItem(SWIPE_TIP_DISMISSED_KEY, "true"),
        AsyncStorage.setItem(SWIPE_TIP_INTRO_VERSION_KEY, SWIPE_TIP_INTRO_VERSION),
      ]);
    } catch {
      // non-blocking
    }
  }, []);

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
      {/* Media type filter bar */}
      <View pointerEvents="box-none" style={styles.filterWrap}>
        <View style={[styles.filterRow, { paddingTop: insets.top + 6 }]}>
          <View style={styles.filterSegment}>
            <Pressable
              onPress={() => setMediaType("video")}
              style={[
                styles.filterBtn,
                mediaType === "video" && styles.filterBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.filterLabel,
                  mediaType === "video" && styles.filterLabelActive,
                ]}
              >
                Videos
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMediaType("image")}
              style={[
                styles.filterBtn,
                mediaType === "image" && styles.filterBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.filterLabel,
                  mediaType === "image" && styles.filterLabelActive,
                ]}
              >
                Images
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMediaType("both")}
              style={[
                styles.filterBtn,
                mediaType === "both" && styles.filterBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.filterLabel,
                  mediaType === "both" && styles.filterLabelActive,
                ]}
              >
                All
              </Text>
            </Pressable>
          </View>
          {topTags.length > 0 ? (
            <View style={styles.tagFilterRow}>
              <Pressable
                onPress={() => setSelectedTag(null)}
                style={[
                  styles.tagFilterChip,
                  !selectedTag && styles.tagFilterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.tagFilterText,
                    !selectedTag && styles.tagFilterTextActive,
                  ]}
                >
                  All
                </Text>
              </Pressable>
              {topTags.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => setSelectedTag(tag)}
                  style={[
                    styles.tagFilterChip,
                    selectedTag === tag && styles.tagFilterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tagFilterText,
                      selectedTag === tag && styles.tagFilterTextActive,
                    ]}
                  >
                    #{tag}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <VerticalVideoFeed
        videos={filteredVideos}
        isLoading={feed.isLoading}
        isRefreshing={feed.isRefreshing}
        onLoadMore={feed.loadMore}
        onRefresh={feed.refresh}
        hasMore={feed.hasMore}
        onSwipeDecision={handleSwipeDecision}
      />

      <View pointerEvents="box-none" style={styles.modeBarWrap}>
        <View style={[styles.modeBarRow, { paddingTop: insets.top + 6 }]}>
          {showSwipeTip ? (
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>Swipe right to save, left to pass.</Text>
              <Pressable onPress={dismissSwipeTip} style={styles.tipCloseBtn}>
                <Text style={styles.tipCloseText}>Got it</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.segment} onPress={() => setShowSwipeTip(true)}>
              <Text style={styles.segmentLabel}>Swipe tips</Text>
            </Pressable>
          )}
          <Pressable style={styles.itineraryBtn} onPress={() => router.push("/(tabs)/discover-itinerary" as any)}>
            <BookmarkCheck size={16} color={COLORS.accent} />
            <Text style={styles.itineraryBtnText}>Itinerary</Text>
          </Pressable>
          <View style={styles.segmentDark}>
            <Text style={styles.segmentDarkText}>{mediaType === "video" ? "Videos" : mediaType === "image" ? "Images" : "All"}</Text>
          </View>
        </View>
      </View>

      {showIntroOverlay ? (
        <View style={styles.introOverlay}>
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>Welcome to Travora!</Text>
            <Text style={styles.introBody}>
              • Swipe up and down to scroll through videos.{"\n"}
              • Swipe right to save videos for itinerary generation.{"\n"}
              • Swipe left to pass.{"\n"}
              • Tap the itinerary button to view saved videos.{"\n\n"}
              Happy travels!!
            </Text>
            <Pressable onPress={dismissSwipeTip} style={styles.introCta}>
              <Text style={styles.introCtaText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

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
  modeBarWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  modeBarRow: {
    paddingHorizontal: 16,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  segmentBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.primary,
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
  },
  segmentLabelActive: {
    color: "#FFFFFF",
  },
  filterWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  filterRow: {
    paddingHorizontal: 16,
    width: "100%",
    alignItems: "center",
  },
  filterSegment: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 999,
    padding: 3,
    gap: 4,
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  filterLabelActive: {
    color: "#FFFFFF",
  },
  tagFilterRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  tagFilterChip: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  tagFilterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tagFilterText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "600",
  },
  tagFilterTextActive: {
    color: "#fff",
  },
  itineraryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  itineraryBtnText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "700",
  },
  segmentDark: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  segmentDarkText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  tipText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
  },
  tipCloseBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tipCloseText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  introOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.48)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 20,
  },
  introCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  introBody: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.text,
  },
  introCta: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  introCtaText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
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
