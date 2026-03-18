/**
 * Collaborators Service
 *
 * Business logic for managing itinerary collaborators.
 * Handles invitations, role management, and permission checks.
 */

import { supabase } from '@/lib/supabase';
import {
  Itinerary,
  ItineraryCollaboratorWithProfile,
  ItineraryInsert,
  Profile,
} from '@/types/database';
import { searchProfiles } from './profiles';
import { triggerItineraryInvite } from './notificationTriggers';

/**
 * Invite a user to collaborate on an itinerary
 * @param itineraryId - The itinerary to share
 * @param username - Username of the user to invite
 * @param role - 'editor' or 'viewer'
 * @param inviterUsername - Username of the person sending the invite
 * @returns The created collaborator record
 */
export async function inviteCollaborator(
  itineraryId: string,
  username: string,
  role: 'editor' | 'viewer',
  inviterUsername?: string
): Promise<ItineraryCollaboratorWithProfile> {
  // Look up user by username
  const profiles = await searchProfiles(username);
  const targetUser = profiles.find((p) => p.username === username);

  if (!targetUser) {
    throw new Error('User not found');
  }

  // Check if user is already a collaborator
  const { data: existing } = await supabase
    .from('itinerary_collaborators')
    .select('*')
    .eq('itinerary_id', itineraryId)
    .eq('user_id', targetUser.id)
    .maybeSingle();

  if (existing) {
    throw new Error('User already has access to this itinerary');
  }

  // Get itinerary details for notification
  const { data: itinerary } = await supabase
    .from('itineraries')
    .select('title')
    .eq('id', itineraryId)
    .single();

  // Create collaboration record
  const { data, error } = await supabase
    .from('itinerary_collaborators')
    .insert({
      itinerary_id: itineraryId,
      user_id: targetUser.id,
      role,
    })
    .select(`
      *,
      profiles!itinerary_collaborators_user_id_fkey(*)
    `)
    .single();

  if (error) throw error;

  // Send notification (non-blocking)
  if (itinerary) {
    try {
      await triggerItineraryInvite(targetUser.id, {
        inviter: inviterUsername || 'Someone',
        itineraryTitle: itinerary.title,
        itineraryId,
        role,
      });
    } catch (notifyError) {
      console.warn('Failed to create invite notification:', notifyError);
    }
  }

  return data as ItineraryCollaboratorWithProfile;
}

/**
 * Get all collaborators for an itinerary
 * @param itineraryId - The itinerary ID
 * @returns Array of collaborators with profile data
 */
export async function getCollaborators(
  itineraryId: string
): Promise<ItineraryCollaboratorWithProfile[]> {
  const { data, error } = await supabase
    .from('itinerary_collaborators')
    .select(`
      *,
      profiles!itinerary_collaborators_user_id_fkey(*)
    `)
    .eq('itinerary_id', itineraryId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as ItineraryCollaboratorWithProfile[];
}

/**
 * Remove a collaborator from an itinerary
 * @param itineraryId - The itinerary ID
 * @param userId - The user ID to remove
 */
export async function removeCollaborator(
  itineraryId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('itinerary_collaborators')
    .delete()
    .eq('itinerary_id', itineraryId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Leave a shared itinerary (user voluntarily leaves)
 * @param itineraryId - The itinerary ID
 * @param userId - The user ID leaving
 */
export async function leaveItinerary(
  itineraryId: string,
  userId: string
): Promise<void> {
  // First verify the user is not the owner
  const { data: itinerary } = await supabase
    .from('itineraries')
    .select('user_id')
    .eq('id', itineraryId)
    .single();

  if (!itinerary) {
    throw new Error('Itinerary not found');
  }

  if (itinerary.user_id === userId) {
    throw new Error('Owners cannot leave their own itinerary. Delete it or transfer ownership instead.');
  }

  // Remove the collaboration record
  const { error } = await supabase
    .from('itinerary_collaborators')
    .delete()
    .eq('itinerary_id', itineraryId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Update a collaborator's role
 * @param itineraryId - The itinerary ID
 * @param userId - The user ID to update
 * @param role - New role ('editor' or 'viewer')
 */
export async function updateCollaboratorRole(
  itineraryId: string,
  userId: string,
  role: 'editor' | 'viewer'
): Promise<void> {
  const { error } = await supabase
    .from('itinerary_collaborators')
    .update({ role })
    .eq('itinerary_id', itineraryId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Get all itineraries shared with the user
 * @param userId - The user ID
 * @returns Array of shared itineraries with collaborator info
 */
export async function getSharedItineraries(
  userId: string
): Promise<Array<Itinerary & { collaborator_role: 'editor' | 'viewer' }>> {
  const { data, error } = await supabase
    .from('itinerary_collaborators')
    .select(`
      role,
      itineraries!inner(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (
    data?.map((item: any) => ({
      ...item.itineraries,
      collaborator_role: item.role,
    })) || []
  );
}

/**
 * Check if a user can edit an itinerary
 * @param itineraryId - The itinerary ID
 * @param userId - The user ID to check
 * @returns true if user is owner or editor, false otherwise
 */
export async function canEditItinerary(
  itineraryId: string,
  userId: string
): Promise<boolean> {
  // First check if user is the owner
  const { data: itinerary } = await supabase
    .from('itineraries')
    .select('user_id')
    .eq('id', itineraryId)
    .maybeSingle();

  if (itinerary && itinerary.user_id === userId) {
    return true;
  }

  // Then check if user is an editor collaborator
  const { data: collaborator } = await supabase
    .from('itinerary_collaborators')
    .select('role')
    .eq('itinerary_id', itineraryId)
    .eq('user_id', userId)
    .maybeSingle();

  return collaborator?.role === 'editor';
}

/**
 * Get the current user's role for an itinerary
 * @param itineraryId - The itinerary ID
 * @param userId - The user ID
 * @returns 'owner', 'editor', 'viewer', or null if no access
 */
export async function getUserRoleForItinerary(
  itineraryId: string,
  userId: string
): Promise<'owner' | 'editor' | 'viewer' | null> {
  // First check if user is the owner
  const { data: itinerary } = await supabase
    .from('itineraries')
    .select('user_id')
    .eq('id', itineraryId)
    .maybeSingle();

  if (itinerary && itinerary.user_id === userId) {
    return 'owner';
  }

  // Then check if user is a collaborator
  const { data: collaborator } = await supabase
    .from('itinerary_collaborators')
    .select('role')
    .eq('itinerary_id', itineraryId)
    .eq('user_id', userId)
    .maybeSingle();

  return (collaborator?.role as 'editor' | 'viewer') || null;
}

/**
 * Search for users to invite as collaborators
 * Excludes users who are already collaborators on the itinerary
 * @param query - Search query (username or display name)
 * @param itineraryId - The itinerary ID
 * @returns Array of profile results
 */
export async function searchUsersToInvite(
  query: string,
  itineraryId: string
): Promise<Profile[]> {
  // First get existing collaborator IDs to exclude
  const { data: existingCollaborators } = await supabase
    .from('itinerary_collaborators')
    .select('user_id')
    .eq('itinerary_id', itineraryId);

  // Also get the owner ID
  const { data: itinerary } = await supabase
    .from('itineraries')
    .select('user_id')
    .eq('id', itineraryId)
    .single();

  const excludeIds = new Set([
    ...(existingCollaborators?.map((c: any) => c.user_id) || []),
    itinerary?.user_id,
  ].filter(Boolean));

  // Search for users
  const allProfiles = await searchProfiles(query);

  // Filter out already invited users and the owner
  return allProfiles.filter((p) => !excludeIds.has(p.id));
}

/**
 * Decline an itinerary invitation
 * Removes the collaborator record that was created when invited
 * @param itineraryId - The itinerary ID
 * @param userId - The user ID declining the invitation
 */
export async function declineItineraryInvitation(
  itineraryId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('itinerary_collaborators')
    .delete()
    .eq('itinerary_id', itineraryId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Accept an itinerary invitation
 * Since collaborator record is created on invite, this is a no-op
 * but can be used for analytics or to mark notification as read
 * @param itineraryId - The itinerary ID
 * @param userId - The user ID accepting the invitation
 */
export async function acceptItineraryInvitation(
  itineraryId: string,
  userId: string
): Promise<{ success: boolean; role?: 'editor' | 'viewer' }> {
  // Verify the user has access
  const { data: collaborator } = await supabase
    .from('itinerary_collaborators')
    .select('role')
    .eq('itinerary_id', itineraryId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!collaborator) {
    throw new Error('Invitation not found or already declined');
  }

  return { success: true, role: collaborator.role as 'editor' | 'viewer' };
}
