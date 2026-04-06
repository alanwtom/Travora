/**
 * ShareModal Component
 *
 * Modal for sharing content with other Travora users.
 */

import { useAuth } from '@/providers/AuthProvider';
import { Profile } from '@/types/database';
import {
  shareContent,
  searchUsersToShare,
  getShareSuggestions,
  ContentType,
} from '@/services/shares';
import { COLORS } from '@/lib/constants';
import { useModalBackHandler } from '@/hooks/useModalBackHandler';
import * as Icons from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';


import { SafeAreaView } from 'react-native-safe-area-context';


type Props = {
  visible: boolean;
  contentType: ContentType;
  contentId: string;
  contentTitle?: string;
  onClose: () => void;
  onShareComplete?: () => void;
};

export function ShareModal({
  visible,
  contentType,
  contentId,
  contentTitle,
  onClose,
  onShareComplete,
}: Props) {
  const { user } = useAuth();
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useModalBackHandler(visible, onClose);

  useEffect(() => {
    if (visible) {
      loadSuggestions();
    }
  }, [visible]);

  const loadSuggestions = useCallback(async () => {
    if (!user?.id) return;
    try {
      const results = await getShareSuggestions(user.id, contentType, contentId);
      setSuggestions(results);
    } catch {
      Alert.alert('Error', 'Could not load share suggestions. Please check your connection.');
    }
  }, [user?.id, contentType, contentId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = useCallback(async () => {
    if (!user?.id || !searchQuery.trim()) return;
    try {
      setIsSearching(true);
      const results = await searchUsersToShare(
        searchQuery,
        contentType,
        contentId,
        user.id,
      );
      setSearchResults(results);
    } catch {
      Alert.alert('Search Error', 'Failed to search users. Please try again later.');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, contentType, contentId, user?.id]);

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSend = async () => {
    if (!user?.id || selectedUsers.size === 0) return;
    try {
      setIsSending(true);
      await shareContent(
        user.id,
        Array.from(selectedUsers),
        contentType,
        contentId,
        message || undefined,
      );
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
        onShareComplete?.();
      }, 1200);
    } catch (e: any) {
      console.error('Share Error:', e);
      Alert.alert(
        'Send Error', 
        e?.message || (typeof e === 'object' ? JSON.stringify(e) : String(e)) || 'Failed to share content. Please try again.'
      );
    } finally {
      setIsSending(false);
    }
  };

  const displayUsers = searchQuery.trim().length > 0 ? searchResults : suggestions;
  const renderUser = ({ item }: { item: Profile }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => toggleUser(item.id)}
      activeOpacity={0.7}
    >
      {item.avatar_url ? (
        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Icons.User size={16} color={COLORS.textMuted} strokeWidth={2} />
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.displayName}>
          {item.display_name || 'Unknown'}
        </Text>
        <Text style={styles.username}>@{item.username || 'unknown'}</Text>
      </View>
      <View style={styles.checkbox}>
        {selectedUsers.has(item.id) ? (
          <Icons.Check size={20} color="#FFFFFF" strokeWidth={2.5} />
        ) : (
          <View style={styles.checkboxEmpty} />
        )}
      </View>
    </TouchableOpacity>
  );

  if (showSuccess) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
        statusBarTranslucent={true}
      >
        <View style={styles.overlay}>
          <View style={[styles.modal, { height: '55%', justifyContent: 'center' }]}>
            <View style={styles.successContainer}>
              <View style={styles.successCircle}>
                <Icons.Check size={48} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={styles.successText}>Sent!</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
        <SafeAreaView style={styles.modal} edges={['bottom']}>
          {/* Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Share</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icons.X size={24} color={COLORS.text} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Content Preview */}
          {contentTitle && (
            <View style={styles.contentPreview}>
              <Text style={styles.contentPreviewText} numberOfLines={1}>
                {contentTitle}
              </Text>
            </View>
          )}

          {/* Message Input */}
          <TextInput
            style={styles.messageInput}
            placeholder="Add a message..."
            placeholderTextColor={COLORS.textMuted}
            value={message}
            onChangeText={setMessage}
            maxLength={200}
          />

          {/* Search */}
          <View style={styles.searchContainer}>
            <Icons.Search size={18} color={COLORS.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by username or name..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* User List */}
          {(isSearching || (!displayUsers || displayUsers.length === 0)) ? (
            <View style={styles.emptyList}>
                {isSearching ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text style={styles.emptyText}>
                    {searchQuery.trim()
                      ? `No users found`
                      : 'No one to share with yet'}
                  </Text>
                )}
              </View>
            ) : (
              <FlatList
                data={displayUsers}
                keyExtractor={(item) => item.id}
                renderItem={renderUser}
                keyboardShouldPersistTaps={false}
                contentContainerStyle={styles.userListContent}
                style={styles.userListScroll}
              />
            )}

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={[
                styles.sendButton,
                (selectedUsers.size === 0 || isSending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={selectedUsers.size === 0 || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.sendButtonText}>
                  Send to {selectedUsers.size} {selectedUsers.size === 1 ? ' person' : ' people'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
    );
  }

 const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '55%',
    flexDirection: 'column',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    padding: 8,
  },
  contentPreview: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  contentPreviewText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  messageInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 8,
  },
  searchIcon: {
    // nothing
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 10,
  },
  userListScroll: {
    flex: 1,
  },
  userListContent: {
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  username: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sendButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
