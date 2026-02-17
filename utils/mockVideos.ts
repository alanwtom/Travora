/**
 * Mock Videos Utility for Development Testing
 * 
 * This utility provides a function to seed mock videos directly from your app
 * during development. Useful for testing the feed, likes, saves, and comments
 * functionality without needing real user-generated content.
 */

import { createVideo } from '@/services/videos';
import { Video } from '@/types/database';

export interface MockVideoData {
  title: string;
  description?: string | null;
  caption?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  video_url: string;
  thumbnail_url?: string | null;
}

export const MOCK_VIDEOS_DATA: MockVideoData[] = [
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
    latitude: -9.19,
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

/**
 * Creates mock videos for the provided user ID
 * @param userId - The user ID to create videos for
 * @param videoCount - Number of mock videos to create (default: all)
 * @returns Array of created videos or empty array if no videos were created
 */
export async function seedMockVideos(userId: string, videoCount?: number): Promise<Video[]> {
  const videosToCreate = videoCount
    ? MOCK_VIDEOS_DATA.slice(0, videoCount)
    : MOCK_VIDEOS_DATA;

  const createdVideos: Video[] = [];

  for (const mockVideo of videosToCreate) {
    try {
      const video = await createVideo({
        user_id: userId,
        title: mockVideo.title,
        description: mockVideo.description || null,
        caption: mockVideo.caption || null,
        location: mockVideo.location || null,
        latitude: mockVideo.latitude || null,
        longitude: mockVideo.longitude || null,
        video_url: mockVideo.video_url,
        thumbnail_url: mockVideo.thumbnail_url || null,
      });
      createdVideos.push(video);
    } catch (error) {
      console.error(`Error creating mock video "${mockVideo.title}":`, error);
    }
  }

  return createdVideos;
}

/**
 * Clears all videos created by a user (useful for cleaning up test data)
 * @param userId - The user ID whose videos should be deleted
 */
export async function clearUserVideos(userId: string): Promise<void> {
  // This would require a delete function in your videos service
  console.warn('clearUserVideos not yet implemented - implement in videos service');
}
