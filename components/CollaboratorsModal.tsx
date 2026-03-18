/**
 * CollaboratorsModal Component
 *
 * Modal for managing itinerary collaborators.
 * Allows searching and inviting users, managing roles, and leaving shared itineraries.
 */

import { COLORS } from '@/lib/constants';
import {
  inviteCollaborator,
  removeCollaborator,
  leaveItinerary,
  updateCollaboratorRole,
  searchUsersToInvite,
  getCollaborators,
} from '@/services/collaborators';
import { ItineraryCollaboratorWithProfile, Profile } from '@/types/database';
import * as Icons from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Role = 'editor' | 'viewer';

type Props = {
  visible: boolean;
  itineraryId: string;
  itineraryTitle: string;
  isOwner: boolean;
  currentUserId?: string;
  onClose: () => void;
  onCollaboratorsChange?: () => void;
};

export function CollaboratorsModal({
  visible,
  itineraryId,
  itineraryTitle,
  isOwner,
  currentUserId,
  onClose,
  onCollaboratorsChange,
}: Props) {
  const [collaborators, setCollaborators] = useState<ItineraryCollaboratorWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>('editor');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCollaborators();
    }
  }, [visible]);

  useEffect(() => {
    const searchTimer = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(searchTimer);
  }, [searchQuery]);

  const loadCollaborators = async () => {
    try {
      setIsLoading(true);
      const collabs = await getCollaborators(itineraryId);
      setCollaborators(collabs);
    } catch (error) {
      console.error('Failed to load collaborators:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    try {
      setIsSearching(true);
      const results = await searchUsersToInvite(query, itineraryId);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvite = async (profile: Profile) => {
    if (!currentUserId) return;

    try {
      setIsInviting(true);
      await inviteCollaborator(
        itineraryId,
        profile.username || '',
        selectedRole,
        currentUserId
      );
      setSearchQuery('');
      setSearchResults([]);
      loadCollaborators();
      onCollaboratorsChange?.();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to invite user');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveCollaborator = async (collab: ItineraryCollaboratorWithProfile) => {
    Alert.alert(
      'Remove Collaborator',
      `Remove ${collab.profiles?.display_name || collab.profiles?.username || 'this user'} from this itinerary?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeCollaborator(itineraryId, collab.user_id);
              loadCollaborators();
              onCollaboratorsChange?.();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove collaborator');
            }
          },
        },
      ]
    );
  };

  const handleRoleChange = async (collab: ItineraryCollaboratorWithProfile, newRole: Role) => {
    try {
      await updateCollaboratorRole(itineraryId, collab.user_id, newRole);
      loadCollaborators();
      onCollaboratorsChange?.();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update role');
    }
  };

  const handleLeaveItinerary = () => {
    Alert.alert(
      'Leave Itinerary',
      'Are you sure you want to leave this itinerary? You will lose access to it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!currentUserId) return;
              await leaveItinerary(itineraryId, currentUserId);
              onClose();
              onCollaboratorsChange?.();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to leave itinerary');
            }
          },
        },
      ]
    );
  };

  const renderCollaborator = ({ item }: { item: ItineraryCollaboratorWithProfile }) => (
    <View style={styles.collaboratorItem}>
      <Image
        source={{ uri: item.profiles?.avatar_url || '' }}
        style={styles.avatar}
      />
      <View style={styles.collaboratorInfo}>
        <Text style={styles.username}>
          {item.profiles?.display_name || item.profiles?.username || 'Unknown'}
        </Text>
        <View style={[styles.roleBadge, styles[item.role]]}>
          <Text style={styles.roleText}>
            {item.role === 'editor' ? 'Editor' : 'Viewer'}
          </Text>
        </View>
      </View>
      {isOwner && (
        <View style={styles.collaboratorActions}>
          {item.role === 'editor' ? (
            <TouchableOpacity
              style={styles.roleButton}
              onPress={() => handleRoleChange(item, 'viewer')}
            >
              <Icons.Eye size={16} color={COLORS.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.roleButton}
              onPress={() => handleRoleChange(item, 'editor')}
            >
              <Icons.Edit3 size={16} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveCollaborator(item)}
          >
            <Icons.X size={16} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderSearchResult = ({ item }: { item: Profile }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleInvite(item)}
      disabled={isInviting}
    >
      <Image
        source={{ uri: item.avatar_url || '' }}
        style={styles.avatar}
      />
      <View style={styles.searchResultInfo}>
        <Text style={styles.username}>
          {item.display_name || item.username || 'Unknown'}
        </Text>
        <Text style={styles.handle}>@{item.username || 'user'}</Text>
      </View>
      <View style={styles.roleSelector}>
        <Text style={styles.roleSelectorText}>
          {selectedRole === 'editor' ? 'Editor' : 'Viewer'}
        </Text>
        <Icons.ChevronDown size={16} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Collaborators</Text>
            <TouchableOpacity onPress={onClose}>
              <Icons.X size={24} color="#000" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Itinerary Title */}
          <View style={styles.itineraryInfo}>
            <Text style={styles.itineraryTitle} numberOfLines={1}>
              {itineraryTitle}
            </Text>
            <Text style={styles.collaboratorCount}>
              {collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Invite Section - Owner Only */}
          {isOwner && (
            <View style={styles.inviteSection}>
              <Text style={styles.sectionTitle}>Invite People</Text>

              {/* Role Selector */}
              <View style={styles.roleToggleContainer}>
                <TouchableOpacity
                  style={[styles.roleToggle, selectedRole === 'editor' && styles.roleToggleActive]}
                  onPress={() => setSelectedRole('editor')}
                >
                  <Icons.Edit3 size={16} color={selectedRole === 'editor' ? '#fff' : COLORS.primary} />
                  <Text style={[styles.roleToggleText, selectedRole === 'editor' && styles.roleToggleTextActive]}>
                    Editor
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleToggle, selectedRole === 'viewer' && styles.roleToggleActive]}
                  onPress={() => setSelectedRole('viewer')}
                >
                  <Icons.Eye size={16} color={selectedRole === 'viewer' ? '#fff' : COLORS.primary} />
                  <Text style={[styles.roleToggleText, selectedRole === 'viewer' && styles.roleToggleTextActive]}>
                    Viewer
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Search Input */}
              <View style={styles.searchContainer}>
                <Icons.Search size={18} color="#999" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by username..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {isSearching && <ActivityIndicator size="small" color={COLORS.primary} />}
              </View>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                  <FlatList
                    data={searchResults}
                    renderItem={renderSearchResult}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    ListHeaderComponent={
                      <View style={styles.searchResultsHeader}>
                        <Text style={styles.searchResultsTitle}>Suggested Users</Text>
                      </View>
                    }
                  />
                </View>
              )}
            </View>
          )}

          {/* Collaborators List */}
          <View style={styles.collaboratorsSection}>
            <Text style={styles.sectionTitle}>
              {isOwner ? 'Collaborators' : 'You are a'}
              {!isOwner && collaborators.find(c => c.user_id === currentUserId) && (
                <Text style={styles.roleTextInline}>
                  {' '}{collaborators.find(c => c.user_id === currentUserId)?.role === 'editor' ? 'Editor' : 'Viewer'}
                </Text>
              )}
            </Text>

            {isLoading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : collaborators.length === 0 ? (
              <View style={styles.centerContent}>
                <Icons.Users size={48} color="#ccc" />
                <Text style={styles.emptyText}>No collaborators yet</Text>
                {isOwner && (
                  <Text style={styles.emptySubtext}>Invite people to collaborate on this itinerary</Text>
                )}
              </View>
            ) : (
              <FlatList
                data={collaborators}
                renderItem={renderCollaborator}
                keyExtractor={(item) => item.id}
                style={styles.collaboratorsList}
              />
            )}
          </View>

          {/* Leave Itinerary Button - Collaborators Only */}
          {!isOwner && currentUserId && (
            <TouchableOpacity
              style={styles.leaveButton}
              onPress={handleLeaveItinerary}
            >
              <Text style={styles.leaveButtonText}>Leave Itinerary</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  itineraryInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
  },
  itineraryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  collaboratorCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  inviteSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  roleToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 12,
    padding: 4,
  },
  roleToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  roleToggleActive: {
    backgroundColor: COLORS.primary,
  },
  roleToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  roleToggleTextActive: {
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  searchResults: {
    marginTop: 12,
    maxHeight: 200,
  },
  searchResultsHeader: {
    marginBottom: 8,
  },
  searchResultsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  collaboratorsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flex: 1,
  },
  collaboratorsList: {
    flex: 1,
  },
  centerContent: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
  collaboratorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
  },
  collaboratorInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  handle: {
    fontSize: 13,
    color: '#999',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  editor: {
    backgroundColor: '#E3F2FD',
  },
  viewer: {
    backgroundColor: '#F5F5F5',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  roleTextInline: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  collaboratorActions: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
  },
  roleSelectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  leaveButton: {
    marginHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FEE',
    borderRadius: 12,
    alignItems: 'center',
  },
  leaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
});
