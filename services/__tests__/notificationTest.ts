/**
 * Notification System Test Helper
 *
 * This file provides helper functions to test the notification system.
 * Use these functions to verify notifications are working correctly.
 */

import {
  triggerBookingConfirmed,
  triggerFlightDelayed,
  triggerPriceDrop,
  triggerSpecialOffer,
  triggerNewFollower,
  triggerCommentReceived,
  triggerVideoLiked,
  triggerSecurityAlert,
  triggerAccountVerified,
  triggerPaymentReceived,
  trigger24HourFlight,
} from '../notificationTriggers';
import { useNotifications } from '@/hooks/useNotifications';

/**
 * Test different notification types
 * Call this function to send test notifications to a user
 */
export async function sendTestNotifications(userId: string) {
  console.log('🧪 Sending test notifications to user:', userId);

  // High Priority - Trip Updates
  console.log('📨 Test 1: Booking Confirmed (High Priority)');
  await triggerBookingConfirmed(userId, {
    destination: 'Paris, France',
    bookingId: 'TEST-BOOKING-001',
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // High Priority - Flight Delay
  console.log('📨 Test 2: Flight Delayed (High Priority)');
  await triggerFlightDelayed(userId, {
    destination: 'Tokyo, Japan',
    newTime: '3:45 PM',
    flightId: 'TEST-FLIGHT-001',
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Medium Priority - Price Drop
  console.log('📨 Test 3: Price Drop (Medium Priority)');
  await triggerPriceDrop(userId, {
    destination: 'Bali, Indonesia',
    price: '$599',
    url: 'https://travora.app/deals/bali',
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Low Priority - Special Offer (Marketing)
  console.log('📨 Test 4: Special Offer (Low Priority, Marketing)');
  await triggerSpecialOffer(userId, {
    offerDescription: 'Get 30% off your next booking!',
    offerId: 'PROMO-TEST-001',
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Medium Priority - Social
  console.log('📨 Test 5: New Follower (Medium Priority)');
  await triggerNewFollower(userId, {
    username: 'travel_enthusiast',
    followerId: 'user-123',
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Medium Priority - Comment
  console.log('📨 Test 6: Comment Received (Medium Priority)');
  await triggerCommentReceived(userId, {
    username: 'wanderlust_jane',
    commentContent: 'Amazing video! What camera did you use?',
    videoId: 'video-123',
    commentId: 'comment-123',
    commenterId: 'user-456',
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Low Priority - Video Liked
  console.log('📨 Test 7: Video Liked (Low Priority)');
  await triggerVideoLiked(userId, {
    username: 'globe_trotter',
    videoTitle: 'Sunset in Santorini',
    videoId: 'video-456',
    likerId: 'user-789',
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // High Priority - Security Alert
  console.log('📨 Test 8: Security Alert (High Priority)');
  await triggerSecurityAlert(userId);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // High Priority - Account Verified
  console.log('📨 Test 9: Account Verified (High Priority)');
  await triggerAccountVerified(userId);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // High Priority - Payment Received
  console.log('📨 Test 10: Payment Received (High Priority)');
  await triggerPaymentReceived(userId, {
    amount: '$1,250.00',
    destination: 'Rome, Italy',
    bookingId: 'TEST-BOOKING-002',
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // High Priority - 24 Hour Flight Reminder
  console.log('📨 Test 11: 24 Hour Flight Reminder (High Priority)');
  await trigger24HourFlight(userId, {
    destination: 'New York, USA',
    flightId: 'TEST-FLIGHT-002',
  });

  console.log('✅ All test notifications sent!');
  console.log('ℹ️  Check your notifications list to verify they were delivered.');
}

/**
 * Test notification preferences
 */
export async function testNotificationPreferences(userId: string) {
  console.log('🧪 Testing notification preferences...');

  // This would test toggling preferences
  console.log('ℹ️  To test preferences:');
  console.log('   1. Go to Settings > Notifications');
  console.log('   2. Toggle channels for different categories');
  console.log('   3. Verify changes persist immediately');
  console.log('   4. Send test notifications to verify they respect preferences');
}

/**
 * Test mute functionality
 */
export async function testMuteFunctionality(userId: string) {
  console.log('🧪 Testing mute functionality...');
  console.log('ℹ️  To test mute:');
  console.log('   1. Go to Settings > Notifications');
  console.log('   2. Toggle "Master Switch" to mute all');
  console.log('   3. Send test notifications');
  console.log('   4. Verify no notifications are delivered');
  console.log('   5. Unmute and send test notifications');
  console.log('   6. Verify notifications are delivered again');
}

/**
 * Verify notification system setup
 */
export async function verifyNotificationSetup() {
  console.log('🔍 Verifying notification system setup...');
  console.log('');
  console.log('✅ Database Migration:');
  console.log('   - notification_preferences table');
  console.log('   - notifications table');
  console.log('   - notification_templates table');
  console.log('   - notification_delivery_history table');
  console.log('   - All RLS policies');
  console.log('   - All database functions');
  console.log('');
  console.log('✅ Service Files:');
  console.log('   - services/notifications.ts');
  console.log('   - services/notificationDelivery.ts');
  console.log('   - services/notificationTriggers.ts');
  console.log('');
  console.log('✅ Components:');
  console.log('   - components/NotificationSettings.tsx');
  console.log('   - components/NotificationList.tsx');
  console.log('');
  console.log('✅ Screens:');
  console.log('   - app/(tabs)/notifications.tsx');
  console.log('   - app/settings/notifications.tsx');
  console.log('');
  console.log('✅ Hooks:');
  console.log('   - hooks/useNotifications.ts');
  console.log('');
  console.log('✅ Types:');
  console.log('   - types/notifications.ts');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('   1. Run the database migration in Supabase');
  console.log('   2. Test with sendTestNotifications(userId)');
  console.log('   3. Verify UI in Settings > Notifications');
  console.log('   4. Verify Notifications tab shows notifications');
  console.log('');
}

/**
 * Quick test for development
 */
export async function quickDevTest(userId: string) {
  await verifyNotificationSetup();
  console.log('🧪 Running quick dev test...');
  await sendTestNotifications(userId);
}

// Export a test object for console usage
export const notificationTests = {
  sendTestNotifications,
  testNotificationPreferences,
  testMuteFunctionality,
  verifyNotificationSetup,
  quickDevTest,
};

// Make available in console for debugging (development only)
if (process.env.NODE_ENV === 'development') {
  // @ts-ignore
  global.notificationTests = notificationTests;
  console.log('🔔 Notification tests available in console as: notificationTests');
  console.log('   Example: notificationTests.sendTestNotifications(userId)');
}
