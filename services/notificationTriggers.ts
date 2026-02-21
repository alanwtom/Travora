/**
 * Notification Triggers
 *
 * Business logic functions to trigger specific notifications
 * throughout the application. These functions handle the creation
 * of notifications based on user actions and events.
 */

import { CreateNotificationParams } from '@/types/notifications';
import { createNotification } from './notifications';

/**
 * ============================================
// TRIP UPDATES
 * ============================================
 */

/**
 * Trigger when a booking is confirmed
 */
export async function triggerBookingConfirmed(
  userId: string,
  data: { destination: string; bookingId: string }
): Promise<string | null> {
  return createNotification({
    userId,
    triggerEvent: 'booking_confirmed',
    titleData: { destination: data.destination },
    customData: { bookingId: data.bookingId, destination: data.destination },
  });
}

/**
 * Trigger when a booking is cancelled
 */
export async function triggerBookingCancelled(
  userId: string,
  data: { bookingId: string }
): Promise<string | null> {
  return createNotification({
    userId,
    triggerEvent: 'booking_cancelled',
    customData: { bookingId: data.bookingId },
  });
}

/**
 * Trigger when a flight is delayed
 */
export async function triggerFlightDelayed(
  userId: string,
  data: { destination: string; newTime: string; flightId: string }
): Promise<string | null> {
  return createNotification({
    userId,
    triggerEvent: 'flight_delayed',
    titleData: { destination: data.destination, new_time: data.newTime },
    customData: { flightId: data.flightId, destination: data.destination },
  });
}

/**
 * Trigger when itinerary is changed
 */
export async function triggerItineraryChanged(
  userId: string,
  data: { destination: string; bookingId: string }
): Promise<string | null> {
  return createNotification({
    userId,
    triggerEvent: 'itinerary_changed',
    titleData: { destination: data.destination },
    customData: { bookingId: data.bookingId },
  });
}

/**
 * Trigger when trip is starting soon
 */
export async function triggerTripStartingSoon(
  userId: string,
  data: { destination: string; days: number }
): Promise<string | null> {
  return createNotification({
    userId,
    triggerEvent: 'trip_starting_soon',
    titleData: { destination: data.destination, days: data.days.toString() },
    customData: { destination: data.destination },
  });
}

/**
 * ============================================
// PRICE ALERTS
 * ============================================
 */

/**
 * Trigger when price drops
 */
export async function triggerPriceDrop(
  userId: string,
  data: { destination: string; price: string; url?: string }
): Promise<string | null> {
  return createNotification({
    userId,
    triggerEvent: 'price_drop',
    titleData: { destination: data.destination, price: data.price },
    customData: { destination: data.destination, price: data.price, url: data.url },
  });
}

/**
 * Trigger when deal is expiring soon
 */
export async function triggerDealExpiringSoon(
  userId: string,
  data: { destination: string; hours: number }
): Promise<string | null> {
  return createNotification({
    userId,
    triggerEvent: 'deal_expiring_soon',
    titleData: { destination: data.destination, hours: data.hours.toString() },
    customData: { destination: data.destination },
  });
}

/**
 * ============================================
// PROMOTIONS (Marketing - checks opt-in)
 * ============================================
 */

/**
 * Trigger special offer (marketing)
 */
export async function triggerSpecialOffer(
  userId: string,
  data: { offerDescription: string; offerId?: string }
): Promise<string | null> {
  return createNotification({
    userId,
    triggerEvent: 'special_offer',
    titleData: { offer_description: data.offerDescription },
    customData: { offerId: data.offerId },
  });
}

/**
 * Trigger seasonal sale (marketing)
 */
export async function triggerSeasonalSale(
  userId: string,
  data: { discount: number; destination: string }
): Promise<string | null> {
  return createNotification({
    userId,
    triggerEvent: 'seasonal_sale',
    titleData: { discount: data.discount.toString(), destination: data.destination },
    customData: { discount: data.discount, destination: data.destination },
  });
}

/**
 * ============================================
// SOCIAL
 * ============================================
 */

/**
 * Trigger when a user gets a new follower
 */
export async function triggerNewFollower(
  userId: string,
  data: { username: string; followerId: string }
): Promise<string | null> {
  return createNotification({
    userId,
    triggerEvent: 'new_follower',
    titleData: { username: data.username },
    bodyData: { username: data.username },
    customData: { followerId: data.followerId, username: data.username },
  });
}

/**
 * Trigger when a user gets a new like on their video
 */
export async function triggerVideoLiked(
  userId: string,
  data: { username: string; videoTitle?: string; videoId: string; likerId: string }
): Promise<string | null> {
  return createNotification({
    userId,
    triggerEvent: 'video_liked',
    titleData: { username: data.username, video_title: data.videoTitle ?? 'your video' },
    bodyData: { username: data.username, video_title: data.videoTitle ?? 'your video' },
    customData: {
      likerId: data.likerId,
      videoId: data.videoId,
      username: data.username,
      videoTitle: data.videoTitle ?? null,
    },
  });
}

/**
 * Trigger when a user receives a comment on their video
 */
export async function triggerCommentReceived(
  userId: string,
  data: {
    username: string;
    commentContent: string;
    videoId: string;
    commentId: string;
    commenterId: string;
  }
): Promise<string | null> {
  return createNotification({
    userId,
    triggerEvent: 'comment_received',
    titleData: { username: data.username },
    bodyData: { username: data.username, comment_content: data.commentContent },
    customData: {
      commenterId: data.commenterId,
      commentId: data.commentId,
      videoId: data.videoId,
      commentContent: data.commentContent,
      username: data.username,
    },
  });
}

/**
 * Trigger when a user is mentioned in a comment
 */
export async function triggerMentionReceived(
  userId: string,
  data: {
    username: string;
    commentContent: string;
    videoId: string;
    commentId: string;
    mentionerId: string;
  }
): Promise<string | null> {
  return createNotification({
    userId,
    triggerEvent: 'mention_received',
    titleData: { username: data.username },
    bodyData: { username: data.username, comment_content: data.commentContent },
    customData: {
      mentionerId: data.mentionerId,
      commentId: data.commentId,
      videoId: data.videoId,
      commentContent: data.commentContent,
      username: data.username,
    },
  });
}

/**
 * ============================================
// SYSTEM
 * ============================================
 */

/**
 * Trigger security alert
 */
export async function triggerSecurityAlert(userId: string): Promise<string | null> {
  return createNotification({
    userId,
    triggerEvent: 'security_alert',
    customData: {},
  });
}

/**
 * Trigger account verified
 */
export async function triggerAccountVerified(userId: string): Promise<string | null> {
  return createNotification({
    userId,
    triggerEvent: 'account_verified',
    customData: {},
  });
}

/**
 * Trigger password changed
 */
export async function triggerPasswordChanged(userId: string): Promise<string | null> {
  return createNotification({
    userId,
    triggerEvent: 'password_changed',
    customData: {},
  });
}

/**
 * ============================================
// BOOKING
 * ============================================
 */

/**
 * Trigger payment received
 */
export async function triggerPaymentReceived(
  userId: string,
  data: { amount: string; destination: string; bookingId: string }
): Promise<string | null> {
  return createNotification({
    userId,
    triggerEvent: 'payment_received',
    titleData: { amount: data.amount, destination: data.destination },
    customData: { bookingId: data.bookingId, amount: data.amount },
  });
}

/**
 * Trigger booking reminder
 */
export async function triggerBookingReminder(
  userId: string,
  data: { destination: string; date: string; bookingId: string }
): Promise<string | null> {
  return createNotification({
    userId,
    triggerEvent: 'booking_reminder',
    titleData: { destination: data.destination, date: data.date },
    customData: { bookingId: data.bookingId },
  });
}

/**
 * Trigger check-in open
 */
export async function triggerCheckInOpen(
  userId: string,
  data: { destination: string; flightId: string }
): Promise<string | null> {
  return createNotification({
    userId,
    triggerEvent: 'check_in_open',
    titleData: { destination: data.destination },
    customData: { flightId: data.flightId },
  });
}

/**
 * ============================================
// REMINDER
 * ============================================
 */

/**
 * Trigger 24 hour flight reminder
 */
export async function trigger24HourFlight(
  userId: string,
  data: { destination: string; flightId: string }
): Promise<string | null> {
  return createNotification({
    userId,
    triggerEvent: '24_hour_flight',
    titleData: { destination: data.destination },
    customData: { flightId: data.flightId },
  });
}

/**
 * Trigger trip end reminder
 */
export async function triggerTripEndReminder(
  userId: string,
  data: { destination: string; bookingId: string }
): Promise<string | null> {
  return createNotification({
    userId,
    triggerEvent: 'trip_end_reminder',
    titleData: { destination: data.destination },
    customData: { bookingId: data.bookingId },
  });
}

/**
 * Trigger review request
 */
export async function triggerReviewRequest(
  userId: string,
  data: { destination: string; bookingId: string }
): Promise<string | null> {
  return createNotification({
    userId,
    triggerEvent: 'review_request',
    titleData: { destination: data.destination },
    customData: { bookingId: data.bookingId },
  });
}

/**
 * ============================================
// HELPER FUNCTIONS
 * ============================================
 */

/**
 * Send notification to multiple users
 * Useful for things like system announcements
 */
export async function triggerBulkNotification(
  userIds: string[],
  params: Omit<CreateNotificationParams, 'userId'>
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();

  await Promise.all(
    userIds.map(async (userId) => {
      const result = await createNotification({
        ...params,
        userId,
      });
      results.set(userId, result);
    })
  );

  return results;
}
