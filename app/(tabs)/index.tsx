import { SwipeDiscoverContent } from "@/components/SwipeDiscoverContent";
import { VerticalVideoFeed } from "@/components/VerticalVideoFeed";
import { usePersonalizedFeed } from "@/hooks/usePersonalizedFeed";
import { COLORS } from "@/lib/constants";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MODE_BAR_HEIGHT = 48;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"feed" | "swipe">("feed");
  const [mediaType, setMediaType] = useState<"video" | "image" | "both">(
    "both",
  );
  const feed = usePersonalizedFeed(mediaType);

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

      {/* Feed / Swipe content */}
      {mode === "feed" ? (
        <VerticalVideoFeed
          videos={feed.videos}
          isLoading={feed.isLoading}
          isRefreshing={feed.isRefreshing}
          onLoadMore={feed.loadMore}
          onRefresh={feed.refresh}
          hasMore={feed.hasMore}
        />
      ) : (
        <SwipeDiscoverContent
          videos={feed.videos}
          isLoading={feed.isLoading}
          isRefreshing={feed.isRefreshing}
          error={feed.error}
          loadMore={feed.loadMore}
          refresh={feed.refresh}
          hasMore={feed.hasMore}
          topInsetExtra={MODE_BAR_HEIGHT}
          compactHeader
        />
      )}

      {/* Mode switcher (Feed / Swipe) */}
      <View pointerEvents="box-none" style={styles.modeBarWrap}>
        <View style={[styles.modeBarRow, { paddingTop: insets.top + 6 }]}>
          <View style={styles.segment}>
            <Pressable
              onPress={() => setMode("feed")}
              style={[
                styles.segmentBtn,
                mode === "feed" && styles.segmentBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  mode === "feed" && styles.segmentLabelActive,
                ]}
              >
                Feed
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode("swipe")}
              style={[
                styles.segmentBtn,
                mode === "swipe" && styles.segmentBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  mode === "swipe" && styles.segmentLabelActive,
                ]}
              >
                Swipe
              </Text>
            </Pressable>
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
});
