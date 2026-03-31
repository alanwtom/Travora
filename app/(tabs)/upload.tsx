import { COLORS } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import { uploadThumbnail, uploadVideo } from '@/services/storage';
import { createVideo } from '@/services/videos';
import { ensureTags, setVideoTags } from '@/services/mediaTags';
import * as ImagePicker from 'expo-image-picker';
import { CheckCircle, Image as LucideImage, MapPin, UploadCloud, Video } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
// GPS ADDITION: import our custom hook
import { useLocation } from '@/hooks/useLocation';

export default function UploadScreen() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // GPS ADDITION: useLocation hook
  const { coords, placeName, loading: locationLoading, error, fetchLocation } = useLocation();
  const isFetchingRef = useRef(false); // to know when we are waiting for GPS result

  // GPS ADDITION: effect to handle location result
  useEffect(() => {
    if (placeName && isFetchingRef.current) {
      setLocation(placeName);
      isFetchingRef.current = false;
    } else if (error && isFetchingRef.current) {
      Alert.alert('Location Error', error);
      isFetchingRef.current = false;
    }
  }, [placeName, error]);

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const pickThumbnail = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setThumbnailUri(result.assets[0].uri);
    }
  };

  // GPS ADDITION: handler for GPS button
  const handleUseLocation = async () => {
    isFetchingRef.current = true;
    await fetchLocation();
    // The useEffect will handle setting location or showing error
  };

  const handleUpload = async () => {
    if (!user) return;
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!videoUri) {
      Alert.alert('Error', 'Please select a video');
      return;
    }

    try {
      setIsUploading(true);
      const videoFileName = `video_${Date.now()}`;

      // Upload video and thumbnail in parallel
      const [videoUrl, thumbnailUrl] = await Promise.all([
        uploadVideo(user.id, videoUri, videoFileName),
        thumbnailUri
          ? uploadThumbnail(user.id, thumbnailUri, videoFileName)
          : Promise.resolve(undefined),
      ]);

      // 1) Create video record in database
      const video = await createVideo({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        caption: caption.trim() || null,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl ?? null,
        location: location.trim() || null,
      });

      // 2) Parse and attach tags (best-effort; don't fail whole upload)
      const tagNames = tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (video?.id && tagNames.length > 0) {
        try {
          const tags = await ensureTags(tagNames);
          const tagIds = tags.map((t) => t.id);
          await setVideoTags(video.id, tagIds);
        } catch (tagErr) {
          console.warn('Failed to save tags', tagErr);
        }
      }

      Alert.alert('Success', 'Your video has been uploaded!');

      // Reset form
      setTitle('');
      setDescription('');
      setCaption('');
      setLocation('');
      setTagsText('');
      setVideoUri(null);
      setThumbnailUri(null);
    } catch (error: any) {
      Alert.alert('Upload Error', error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Video Picker */}
      <TouchableOpacity style={styles.mediaPicker} onPress={pickVideo}>
        {videoUri ? (
          <View style={styles.selectedMedia}>
            <CheckCircle size={32} color={COLORS.success} strokeWidth={3} />
            <Text style={styles.selectedText}>Video selected</Text>
          </View>
        ) : (
          <View style={styles.placeholderMedia}>
            <Video size={32} color={COLORS.textMuted} strokeWidth={2} />
            <Text style={styles.placeholderText}>Tap to select a video</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Thumbnail Picker */}
      <TouchableOpacity style={styles.thumbnailPicker} onPress={pickThumbnail}>
        {thumbnailUri ? (
          <Image source={{ uri: thumbnailUri }} style={styles.thumbnailPreview} />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <LucideImage size={20} color={COLORS.textMuted} strokeWidth={2} />
            <Text style={styles.thumbnailPlaceholderText}>Add thumbnail</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Form */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Title *"
          placeholderTextColor={COLORS.textMuted}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description"
          placeholderTextColor={COLORS.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
        <TextInput
          style={styles.input}
          placeholder="Caption"
          placeholderTextColor={COLORS.textMuted}
          value={caption}
          onChangeText={setCaption}
        />
        <TextInput
          style={styles.input}
          placeholder="Tags (comma separated, e.g. beach, food, nightlife)"
          placeholderTextColor={COLORS.textMuted}
          value={tagsText}
          onChangeText={setTagsText}
        />
        {/* GPS ADDITION: modified location input with GPS button */}
        <View style={styles.locationInput}>
          <MapPin size={16} color={COLORS.textMuted} strokeWidth={2.5} />
          <TextInput
            style={styles.locationTextInput}
            placeholder="Location (e.g. Bali, Indonesia)"
            placeholderTextColor={COLORS.textMuted}
            value={location}
            onChangeText={setLocation}
          />
          <TouchableOpacity onPress={handleUseLocation} disabled={locationLoading}>
            {locationLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <MapPin size={16} color={COLORS.primary} strokeWidth={2.5} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Upload Button */}
      <TouchableOpacity
        style={[styles.uploadButton, isUploading && styles.buttonDisabled]}
        onPress={handleUpload}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <UploadCloud size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.uploadButtonText}>Upload Video</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  mediaPicker: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 16,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderMedia: {
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  selectedMedia: {
    alignItems: 'center',
    gap: 8,
  },
  selectedText: {
    fontSize: 16,
    color: COLORS.success,
    fontWeight: '500',
  },
  thumbnailPicker: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbnailPreview: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thumbnailPlaceholderText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  // GPS ADDITION: updated styles for location input (already compatible, no change needed)
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  locationTextInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});