/**
 * Seed Script: Create Mock Videos for Development Testing
 * 
 * This script creates mock video records in Supabase for the currently logged-in user.
 * Use this to test video feed, likes, comments, and save functionality without needing
 * to manually upload videos.
 * 
 * Usage:
 *   npx ts-node scripts/seed-mock-videos.ts
 */

import { supabase } from '../lib/supabase';
import { createVideo } from '../services/videos';

const MOCK_VIDEOS = [
  {
    title: 'Sunrise at Mount Bali',
    description: 'Watched the sun rise over Mount Batur at 5 AM. An unforgettable experience!',
    caption: 'Golden hour at 4000m elevation ✨',
    location: 'Mount Batur, Bali, Indonesia',
    latitude: -8.2483,
    longitude: 115.3794,
    video_url: 'https://media.giphy.com/media/5eLDrEyWrO0MU/giphy.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=225&fit=crop',
  },
  {
    title: 'Street Food Adventure in Bangkok',
    description: 'Exploring the night markets and trying authentic Thai street food. The pad thai here is incredible!',
    caption: 'Best meal under $5 🍜',
    location: 'Chatuchak Weekend Market, Bangkok, Thailand',
    latitude: 13.8016,
    longitude: 100.5515,
    video_url: 'https://media.giphy.com/media/3o7bugPbMaGRVJ2i7m/giphy.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b3f4?w=400&h=225&fit=crop',
  },
  {
    title: 'Hiking through Amazon Rainforest',
    description: 'A guided tour through the Amazon with wildlife spotting. Saw macaws, pink river dolphins, and so much more!',
    caption: 'Mother nature at her finest 🦜',
    location: 'Amazon Rainforest, Peru',
    latitude: -9.1900,
    longitude: -75.0152,
    video_url: 'https://media.giphy.com/media/8F6MS0oJElow0/giphy.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=400&h=225&fit=crop',
  },
  {
    title: 'Snorkeling in the Great Barrier Reef',
    description: 'Crystal clear waters and vibrant coral. Spotted sea turtles and hundreds of colorful fish!',
    caption: 'Underwater paradise 🐠🪸',
    location: 'Great Barrier Reef, Australia',
    latitude: -18.2871,
    longitude: 147.6992,
    video_url: 'https://media.giphy.com/media/lv5l6s5ZJfKAM/giphy.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&h=225&fit=crop',
  },
  {
    title: 'Wine Tasting in Tuscany',
    description: 'A day spent touring vineyards and sampling world-class wines in the Italian countryside.',
    caption: 'Chianti dreams 🍷',
    location: 'Chianti, Tuscany, Italy',
    latitude: 43.2728,
    longitude: 11.6725,
    video_url: 'https://media.giphy.com/media/l0HlWy9x8FZo0XO1i/giphy.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1510812431401-41d2dba3ddef?w=400&h=225&fit=crop',
  },
  {
    title: 'Northern Lights over Iceland',
    description: 'Chase the aurora borealis in Iceland. Captured this magical moment on a freezing night!',
    caption: 'Nature\'s light show 🌌',
    location: 'Jökulsárlón Glacier Lagoon, Iceland',
    latitude: 64.0382,
    longitude: -16.2044,
    video_url: 'https://media.giphy.com/media/26uf0EKjv7dFQsxAA/giphy.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1504214752519-5f3338ca6d6d?w=400&h=225&fit=crop',
  },
  {
    title: 'Safari in the Serengeti',
    description: 'Witnessing the great migration and spotting the "Big Five" in Tanzania.',
    caption: 'Circle of life 🦁',
    location: 'Serengeti National Park, Tanzania',
    latitude: -2.3333,
    longitude: 34.8333,
    video_url: 'https://media.giphy.com/media/xTiTnG6wRZFxxzb0Va/giphy.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1516426122078-bf23f992ab25?w=400&h=225&fit=crop',
  },
  {
    title: 'Floating Markets of Vietnam',
    description: 'Early morning boat ride through the floating markets of the Mekong Delta. So colorful and vibrant!',
    caption: 'Trading post life 🚤',
    location: 'Mekong Delta, Vietnam',
    latitude: 9.2768,
    longitude: 106.6361,
    video_url: 'https://media.giphy.com/media/3o7bugS7ubX0dshYGc/giphy.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1535529387789-4c1017266635?w=400&h=225&fit=crop',
  },
];

async function seedMockVideos() {
  try {
    console.log('🌱 Starting mock videos seed...\n');

    // Get current authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Error: Not authenticated. Please sign in first.');
      process.exit(1);
    }

    console.log(`✅ Authenticated as: ${user.email}\n`);

    // Create mock videos
    let successCount = 0;
    let errorCount = 0;

    for (const mockVideo of MOCK_VIDEOS) {
      try {
        const videoData = {
          user_id: user.id,
          ...mockVideo,
        };

        const createdVideo = await createVideo(videoData);
        console.log(`✅ Created: "${createdVideo.title}"`);
        successCount++;
      } catch (error: any) {
        console.error(`❌ Failed to create video:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successfully created: ${successCount} videos`);
    console.log(`   ❌ Failed: ${errorCount} videos`);
    console.log(`\n✨ Mock videos seeding complete!`);
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

seedMockVideos();
