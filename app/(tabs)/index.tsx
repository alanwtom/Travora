import { VerticalVideoFeed } from "@/components/VerticalVideoFeed";
import { usePersonalizedFeed } from "@/hooks/usePersonalizedFeed";
import { COLORS } from "@/lib/constants";
import { useAuth } from "@/providers/AuthProvider";
import { useSwipeItinerary } from "@/providers/SwipeItineraryProvider";
import { recordSwipe, saveDislikedVideo } from "@/services/swipes";
import { useRouter } from "expo-router";
import { BookmarkCheck } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { addToItinerary } = useSwipeItinerary();
  const [mediaType, setMediaType] = useState<"video" | "image" | "both">(
    "both",
  );
  const feed = usePersonalizedFeed(mediaType);

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
    },
    [addToItinerary, user?.id],
  );

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
        </View>
      </View>

      <VerticalVideoFeed
        videos={feed.videos}
        isLoading={feed.isLoading}
        isRefreshing={feed.isRefreshing}
        onLoadMore={feed.loadMore}
        onRefresh={feed.refresh}
        hasMore={feed.hasMore}
        onSwipeDecision={handleSwipeDecision}
      />

      <View pointerEvents="box-none" style={styles.modeBarWrap}>
        <View style={[styles.modeBarRow, { paddingTop: insets.top + 6 }]}>
          <View style={styles.segment}>
            <Text style={styles.segmentLabelActive}>Swipe in feed: right save, left pass</Text>
          </View>
          <Pressable style={styles.itineraryBtn} onPress={() => router.push("/(tabs)/discover-itinerary" as any)}>
            <BookmarkCheck size={16} color={COLORS.accent} />
            <Text style={styles.itineraryBtnText}>Itinerary</Text>
          </Pressable>
          <View style={styles.segmentDark}>
            <Text style={styles.segmentDarkText}>{mediaType === "video" ? "Videos" : mediaType === "image" ? "Images" : "All"}</Text>
          </View>
        </View>
      </View>
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
    padding: 3,
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
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMuted,
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
});
