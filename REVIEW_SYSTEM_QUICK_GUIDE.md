# Review System - Quick Reference Guide

## 🎯 User Experience Flow

### For Rating & Writing Reviews:
```
1. User taps ⭐ (Rate button on video)
   ↓
2. Ratings Modal Opens
   - Shows average rating
   - Shows total ratings
   ├─ User rates video (1-5 stars)
   ├─ User can tap "Write a Review"
   └─ User can tap "View Reviews"
   ↓
3a. If "Write a Review":
    → Review Submit Modal Opens
    - Enter star rating (required)
    - Enter title (optional)
    - Enter review (10-500 chars, required)
    - Attach photos (optional, max 3)
    → Submit or Update Review
    ↓
3b. If "View Reviews":
    → Reviews Modal Opens
    - See all reviews sorted by Recent/Highest/Helpful
    - Vote if reviews helpful/unhelpful
    - Paginated list (10 per page)
    - Delete own reviews
    - Tap reviewer name → Go to profile
```

## 📋 Review Features Checklist

✅ **Rating Input**
- Users rate 1-5 stars
- Star picker with hover effects
- Change rating anytime
- Remove rating option (0 = no review)

✅ **Review Text**
- 10-500 character requirement
- Character counter
- Optional title (up to 100 chars)
- Real-time validation
- Rich text support ready

✅ **Photo Attachments**
- Upload up to 3 photos
- Photos display in grid
- Delete individual photos
- Full photo URLs stored in Supabase

✅ **Review Display**
- Average rating with star visualization
- Total review count
- Sort by: Recent, Highest, Helpful
- User avatar & profile link
- Relative timestamps (2h ago, etc.)
- Review title & content
- Photo gallery

✅ **Helpfulness Voting**
- Thumbs up/down buttons
- Vote count display
- Toggle votes on/off
- One vote per user per review
- Counts update automatically

✅ **User Management**
- Edit own reviews
- Delete own reviews
- User identification (name, avatar, date)
- Clickable profile links

## 🗄️ Database Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `reviews` | Store reviews | user_id, video_id, rating, content, title, helpful_count |
| `review_photos` | Attach images | review_id, photo_url, display_order |
| `review_helpfulness` | Voting | user_id, review_id, is_helpful |

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Users can only modify their own reviews
- Public read access for all reviews
- Photo deletion tied to review ownership
- Helpfulness votes tied to user identity

## 💻 API Services

All in `services/reviews.ts`:

```typescript
// Create/Update
submitReview(userId, videoId, rating, content, title?)
updateReview(reviewId, userId, rating, content, title?)
deleteReview(reviewId, userId)

// Read
getVideoReviews(videoId, sortBy, page, pageSize, userId?)
getUserReviewForVideo(userId, videoId)
getReviewStats(videoId)

// Photos
addReviewPhoto(reviewId, photoUrl, displayOrder?)
deleteReviewPhoto(photoId)

// Helpfulness
voteReviewHelpfulness(userId, reviewId, isHelpful)
removeReviewHelpfulnessVote(userId, reviewId)
```

## 🎨 UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `RatingsModal` | Rate video & access reviews | components/RatingsModal.tsx |
| `ReviewsModal` | View/sort reviews, vote | components/ReviewsModal.tsx |
| `ReviewSubmitModal` | Write/edit reviews | components/ReviewSubmitModal.tsx |
| `VerticalVideoCard` | Shows rate button | components/VerticalVideoCard.tsx |

## 🚀 Getting Started

1. ✅ Database migration applied (`005_review_system.sql`)
2. ✅ Service functions ready (`services/reviews.ts`)
3. ✅ UI components implemented
4. ✅ Integrated with VerticalVideoCard
5. Ready to use!

## 📊 Validation Rules

| Field | Min | Max | Required |
|-------|-----|-----|----------|
| Rating | 1 | 5 | Yes |
| Review Content | 10 | 500 | Yes |
| Review Title | 0 | 100 | No |
| Photos per Review | 0 | 3 | No |

## 🎯 Next Phase Features (Optional)

- [ ] Photo upload from gallery
- [ ] Camera photo capture
- [ ] Rich text formatting
- [ ] Review filtering by rating
- [ ] Verified visitor badge
- [ ] Review search
- [ ] Moderation system
- [ ] Review pinning by creator
