import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/providers/AuthProvider';
import { uploadVideo, uploadThumbnail } from '@/services/storage';
import { createVideo } from '@/services/videos';
import { COLORS } from '@/lib/constants';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function UploadScreen() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

      // Upload video file
      const videoUrl = await uploadVideo(user.id, videoUri, videoFileName);

      // Upload thumbnail if provided
      let thumbnailUrl: string | undefined;
      if (thumbnailUri) {
        thumbnailUrl = await uploadThumbnail(user.id, thumbnailUri, videoFileName);
      }

      // Create video record in database
      await createVideo({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        caption: caption.trim() || null,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl ?? null,
        location: location.trim() || null,
      });

      Alert.alert('Success', 'Your video has been uploaded!');

      // Reset form
      setTitle('');
      setDescription('');
      setCaption('');
      setLocation('');
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
            <FontAwesome name="check-circle" size={32} color={COLORS.success} />
            <Text style={styles.selectedText}>Video selected</Text>
          </View>
        ) : (
          <View style={styles.placeholderMedia}>
            <FontAwesome name="video-camera" size={32} color={COLORS.textMuted} />
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
            <FontAwesome name="image" size={20} color={COLORS.textMuted} />
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
        <View style={styles.locationInput}>
          <FontAwesome name="map-marker" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.locationTextInput}
            placeholder="Location (e.g. Bali, Indonesia)"
            placeholderTextColor={COLORS.textMuted}
            value={location}
            onChangeText={setLocation}
          />
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
            <FontAwesome name="cloud-upload" size={18} color="#FFFFFF" />
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
