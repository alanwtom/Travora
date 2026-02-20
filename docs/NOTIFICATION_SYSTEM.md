# Travora Notification System

A comprehensive, priority-based notification system for the Travora travel app with granular user controls, real-time updates, and multi-channel delivery.

## Features

### ✅ Implemented Features

1. **Toggle Functionality**
   - Independent toggle for "Push" and "Email" notifications per category
   - In-app notifications channel
   - Real-time database updates (< 500ms latency)
   - No save button required - instant feedback

2. **Master Switch**
   - "Mute All" functionality to pause all notifications
   - Temporary mute options: 1 hour, 8 hours, 24 hours, 7 days
   - Essential notifications can still be delivered during mute

3. **Real-time Updates**
   - Instant persistence to database on toggle change
   - Optimistic UI updates for immediate feedback
   - Automatic reversion on error

4. **Trigger Definitions**
   - 21 predefined notification templates
   - Clear trigger events for each notification type
   - Template-based system for consistency

5. **Priority Ranking**
   - High: Delivery < 1 minute (critical updates)
   - Medium: Delivery < 15 minutes (important updates)
   - Low: Delivery < 1 hour (non-urgent updates)
   - Priority-based queue management

6. **Opt-out Compliance**
   - Marketing notifications opt-in only (GDPR/CCPA compliant)
   - Pre-flight checks before sending non-essential notifications
   - User preference validation

## Database Schema

### Tables

1. **notification_preferences**
   - User's notification preferences per category
   - Channels: push, email, in_app
   - Auto-initialized on user signup

2. **notifications**
   - All sent/delivered notifications
   - Status tracking: pending → sent → delivered → read
   - Channel delivery tracking

3. **notification_templates**
   - Predefined notification templates
   - Category, priority, and default channels
   - Title and body templates with placeholders

4. **notification_delivery_history**
   - Delivery attempt tracking
   - Error logging
   - Retry count management

5. **profiles** (extended)
   - Master switch: notification_muted
   - Temporary mute: notification_mute_until
   - Channel masters: email_notifications_enabled, push_notifications_enabled
   - Marketing opt-in: marketing_notifications_enabled

### Database Functions

- `should_send_notification()` - Check if user should receive notification
- `create_notification()` - Create notification from template
- `mark_notification_read()` - Mark single notification as read
- `mark_all_notifications_read()` - Mark all user's notifications as read
- `initialize_notification_preferences()` - Set default preferences
- `get_unread_notification_count()` - Count unread notifications
- `get_notifications_by_category()` - Get notifications filtered by category
- `get_notification_preferences()` - Get preferences with defaults

## Notification Categories

| Category | Description | Essential | Default Channels |
|----------|-------------|-----------|------------------|
| Trip Updates | Booking confirmations, cancellations, delays, itinerary changes | ✅ | Push, Email, In-App |
| Price Alerts | Price drops, deals, expiring offers | ❌ | Push, Email, In-App |
| Promotions | Special offers, seasonal sales, referral bonuses | ❌ | Email, In-App |
| Social | New followers, likes, comments, mentions | ❌ | Push, In-App |
| System | Security alerts, account verification, password changes | ✅ | Push, Email, In-App |
| Booking | Payment confirmations, booking reminders, check-in | ✅ | Push, Email, In-App |
| Reminder | Flight reminders, trip end notifications, reviews | ❌ | Push, In-App |

## Notification Triggers

### Trip Updates
- `booking_confirmed` - When a trip booking is confirmed
- `booking_cancelled` - When a booking is cancelled
- `flight_delayed` - When a flight is delayed
- `itinerary_changed` - When itinerary is modified
- `trip_starting_soon` - X days before trip starts

### Price Alerts
- `price_drop` - When price drops for watched destination
- `deal_expiring_soon` - When a deal is about to expire

### Promotions (Marketing)
- `special_offer` - Targeted special offers
- `seasonal_sale` - Seasonal/holiday sales
- `referral_bonus` - Referral program bonuses

### Social
- `new_follower` - When someone follows the user
- `video_liked` - When someone likes user's video
- `comment_received` - When someone comments on user's video
- `mention_received` - When user is mentioned in a comment

### System
- `security_alert` - Unusual account activity
- `account_verified` - Account verification completed
- `password_changed` - Password was changed

### Booking
- `payment_received` - Payment confirmed
- `booking_reminder` - Upcoming booking reminder
- `check_in_open` - Online check-in available

### Reminder
- `24_hour_flight` - Flight departing in 24 hours
- `trip_end_reminder` - Trip ending tomorrow
- `review_request` - Request to review trip

## Usage

### Setting Up

1. Run the database migration:
```sql
-- Run in Supabase SQL Editor
-- File: supabase/migrations/002_notification_system.sql
```

2. Initialize notification delivery in your app root:
```typescript
import { initializeNotificationDelivery } from '@/services/notificationDelivery';

// In your app entry point
useEffect(() => {
  initializeNotificationDelivery();
}, []);
```

### Sending Notifications

```typescript
import {
  triggerBookingConfirmed,
  triggerNewFollower,
  triggerCommentReceived,
} from '@/services/notificationTriggers';

// Send booking confirmation
await triggerBookingConfirmed(userId, {
  destination: 'Paris, France',
  bookingId: 'BK12345'
});

// Send new follower notification
await triggerNewFollower(followedUserId, {
  username: 'john_doe',
  followerId: followerId
});

// Send comment notification
await triggerCommentReceived(videoOwnerId, {
  username: commenterUsername,
  commentContent: 'Great video!',
  videoId: videoId,
  commentId: newCommentId,
  commenterId: commenterId
});
```

### Using the Hook

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const {
    unreadCount,
    notifications,
    preferences,
    settings,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    muteAll,
    unmuteAll,
  } = useNotifications();

  return (
    <View>
      <Text>Unread: {unreadCount}</Text>
      {/* ... */}
    </View>
  );
}
```

### UI Components

```typescript
import { NotificationSettingsScreen } from '@/components/NotificationSettings';
import { NotificationList } from '@/components/NotificationList';

// Settings screen
<NotificationSettingsScreen userId={userId} />

// Notification list
<NotificationList
  userId={userId}
  unreadOnly={false}
  onNotificationPress={(notification) => {
    // Handle notification tap
  }}
/>
```

## Architecture

### Service Layer

- **services/notifications.ts** - Core notification CRUD operations
- **services/notificationDelivery.ts** - Priority-based delivery queue
- **services/notificationTriggers.ts** - Business logic trigger functions

### Components

- **components/NotificationSettings.tsx** - Settings UI with all controls
- **components/NotificationList.tsx** - List display with filters

### Hooks

- **hooks/useNotifications.ts** - React hook for notification state

### Types

- **types/notifications.ts** - TypeScript definitions

## Priority Delivery System

Notifications are queued and delivered based on priority:

- **High Priority** - Immediate delivery (< 1 second)
  - Booking confirmations
  - Flight delays
  - Security alerts
  - Payment confirmations

- **Medium Priority** - Standard delivery (< 15 seconds)
  - Price drops
  - New followers
  - Comments
  - Booking reminders

- **Low Priority** - Batched delivery (< 1 minute)
  - Video likes
  - Review requests
  - Promotional content

## Real-time Updates

The system uses Supabase real-time subscriptions:

1. **Notification Preferences** - Instant UI updates when settings change
2. **New Notifications** - Immediate delivery when created
3. **Status Updates** - Track delivery status in real-time

## Opt-in Compliance

Marketing notifications require explicit opt-in:

- Default: Promotions disabled
- User must enable "Marketing Notifications"
- Respects `marketing_notifications_enabled` flag
- Checked via `should_send_notification()` before sending

## Testing

Test the notification system:

```typescript
import { triggerBookingConfirmed } from '@/services/notificationTriggers';

// Test high priority notification
const notificationId = await triggerBookingConfirmed(userId, {
  destination: 'Tokyo, Japan',
  bookingId: 'TEST001'
});

// Test marketing notification (only if opted in)
const promoId = await triggerSpecialOffer(userId, {
  offerDescription: '50% off flights to Hawaii!'
});
```

## File Structure

```
supabase/migrations/
  002_notification_system.sql       # Database schema

services/
  notifications.ts                   # Core CRUD operations
  notificationDelivery.ts           # Priority-based delivery
  notificationTriggers.ts           # Business logic triggers

components/
  NotificationSettings.tsx          # Settings UI
  NotificationList.tsx              # List display

hooks/
  useNotifications.ts               # React hook

types/
  notifications.ts                  # Type definitions

app/
  (tabs)/notifications.tsx          # Notifications tab
  settings/notifications.tsx        # Settings screen
```

## Performance Considerations

- **Real-time Updates**: Optimistic UI updates with rollback on error
- **Database Indexes**: All foreign keys and frequently queried fields indexed
- **Delivery Queue**: Priority-based queue with exponential backoff
- **RLS Policies**: Row-level security for all notification tables
- **Batch Operations**: Support for bulk notifications

## Future Enhancements

- Notification grouping/snoozing
- Scheduled quiet hours
- Notification summary emails
- Rich push notifications with images
- Notification actions (quick reply, etc.)
- Analytics dashboard
