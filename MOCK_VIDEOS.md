# Mock Videos for Development Testing

This guide explains how to create mock videos in your Travora app for testing the save, like, comment, and feed functionality during development.

## Overview

Since your app is in development and has no real users, I've created three ways to seed mock video data:

1. **Development Screen** (Easiest) - Use a UI button in the app
2. **Utility Function** - Call from anywhere in your code
3. **Command-line Script** - Run from terminal with Node.js

## Option 1: Development Screen (Recommended)

The easiest way to create mock videos is through the built-in development screen.

### Access the Development Screen

Add the dev route to your app navigation, then navigate to it:

```typescript
// In your navigation setup, you can access:
navigation.navigate('dev');
```

Or navigate directly to: `yourapp://dev`

### Using the Development Screen

1. Open the **Development Tools** screen
2. Verify you're logged in (shows current user email)
3. Use the **±** buttons to select how many mock videos to create (1-8)
4. Tap **Create Mock Videos**
5. Confirm the action
6. Videos will be created under your account
7. Navigate to the **Feed** tab to see your new videos

### What Gets Created

- 8 high-quality travel video entries with realistic data:
  - **Titles & Descriptions** - Engaging travel content
  - **Captions** - Travel-themed hashtags and emojis
  - **Locations** - Real destinations with coordinates (latitude/longitude)
  - **Thumbnail URLs** - Beautiful images from Unsplash
  - **Video URLs** - Placeholder video from Giphy

## Option 2: Utility Function

You can call the seed function directly from anywhere in your code:

```typescript
import { seedMockVideos } from '@/utils/mockVideos';
import { useAuth } from '@/providers/AuthProvider';

export function MyScreen() {
  const { user } = useAuth();

  const handleCreateVideos = async () => {
    if (!user) return;
    
    // Create all 8 mock videos
    const videos = await seedMockVideos(user.id);
    console.log(`Created ${videos.length} videos`);
    
    // Or create just 3 videos
    const threeVideos = await seedMockVideos(user.id, 3);
  };

  return (
    <TouchableOpacity onPress={handleCreateVideos}>
      <Text>Create Mock Videos</Text>
    </TouchableOpacity>
  );
}
```

## Option 3: Command-line Script

If you prefer to seed videos from the terminal:

```bash
npx ts-node scripts/seed-mock-videos.ts
```

**Requirements:**
- Must be authenticated in your Supabase session
- TypeScript and ts-node installed
- Valid Supabase credentials in `.env`

**Output:**
```
🌱 Starting mock videos seed...

✅ Authenticated as: your@email.com

✅ Created: "Sunrise at Mount Bali"
✅ Created: "Street Food Adventure in Bangkok"
✅ Created: "Hiking through Amazon Rainforest"
...

📊 Summary:
   ✅ Successfully created: 8 videos
   ❌ Failed: 0 videos

✨ Mock videos seeding complete!
```

## Available Mock Videos

The following 8 travel videos are available:

| # | Title | Location | Theme |
|---|-------|----------|-------|
| 1 | Sunrise at Mount Bali | Mount Batur, Bali, Indonesia | Mountain hiking |
| 2 | Street Food Adventure in Bangkok | Chatuchak Weekend Market, Thailand | Food & culture |
| 3 | Hiking through Amazon Rainforest | Amazon Rainforest, Peru | Wildlife & nature |
| 4 | Snorkeling in the Great Barrier Reef | Great Barrier Reef, Australia | Water activities |
| 5 | Wine Tasting in Tuscany | Chianti, Tuscany, Italy | Wine & countryside |
| 6 | Northern Lights over Iceland | Jökulsárlón Glacier Lagoon, Iceland | Nature spectacle |
| 7 | Safari in the Serengeti | Serengeti National Park, Tanzania | Wildlife |
| 8 | Floating Markets of Vietnam | Mekong Delta, Vietnam | Water markets |

## Testing Functionality

Once you've seeded videos, you can test:

✅ **Feed** - Pagination, loading states, video display
✅ **Likes** - Like/unlike functionality and like counts
✅ **Saves** - Save/unsave videos (main use case)
✅ **Comments** - Add, view, and manage comments
✅ **Profile** - View user stats and video collection
✅ **Video Details** - Full video information display
✅ **Explore** - Browse and discover videos

## Cleaning Up

To remove test videos, you have a few options:

### Option 1: Delete from Supabase Dashboard
1. Go to your Supabase project
2. Open the `videos` table
3. Filter by your user ID
4. Select and delete the mock videos

### Option 2: Delete from Your App
You can add a delete function to `services/videos.ts`:

```typescript
export async function deleteVideo(videoId: string): Promise<void> {
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', videoId);

  if (error) throw error;
}
```

Then call it from the development screen or profile screen.

## Troubleshooting

### "Not authenticated" error
- Make sure you're logged in before creating videos
- Check that your session is valid

### Videos not appearing in feed
- Wait a few seconds for the feed to refresh
- Try scrolling down and pulling to refresh
- Check that you're viewing the correct profile

### Mock videos have broken thumbnails
- The placeholder images from Unsplash are real URLs
- If they don't load, your device may not have internet connectivity
- You can replace them with different image URLs

### Need more/fewer videos?
- The utility creates up to 8 mock videos by default
- You can modify `MOCK_VIDEOS_DATA` in `utils/mockVideos.ts` to add more
- Or use the counter in the Development Screen to control the count

## Files Created

- `/scripts/seed-mock-videos.ts` - Command-line script for seeding
- `/utils/mockVideos.ts` - Reusable utility functions and data
- `/app/dev.tsx` - Development tools screen UI

## Next Steps

1. Navigate to the dev screen and create 3-5 mock videos
2. Visit the Feed tab to see them appear
3. Test liking, commenting, and saving functionality
4. Check your Profile to see all your videos
5. Explore the Explore tab to browse content

Happy testing! 🚀
