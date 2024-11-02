import { hash } from 'bcrypt';

const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

// Generate users data
export const users = [
  {
    id: generateUUID(),
    username: 'admin@example.com',
    password_hash: await hash('admin123', 10),
    profile_pic_url: '/placeholder/admin-avatar.jpg',
    display_name: 'Admin User',
    bio: 'System administrator and prompt battle enthusiast',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateUUID(),
    username: 'artist@example.com',
    password_hash: await hash('artist123', 10),
    profile_pic_url: '/placeholder/artist-avatar.jpg',
    display_name: 'Creative Artist',
    bio: 'Digital artist specializing in AI-generated art',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateUUID(),
    username: 'demo@example.com',
    password_hash: await hash('demo123', 10),
    profile_pic_url: '/placeholder/demo-avatar.jpg',
    display_name: 'Demo User',
    bio: 'Here to explore the world of AI art battles',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Generate battle sessions data
export const battleSessions = [
  {
    id: generateUUID(),
    host_user_id: users[0].id,
    session_code: 'ABC123',
    is_active: true,
    max_players: 2,
    current_players: 1,
    battle_theme: 'Fantasy Landscapes',
    time_limit: 60,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateUUID(),
    host_user_id: users[1].id,
    session_code: 'XYZ789',
    is_active: true,
    max_players: 2,
    current_players: 2,
    battle_theme: 'Cyberpunk Cities',
    time_limit: 120,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Generate battle prompts data
export const battlePrompts = [
  {
    id: generateUUID(),
    session_id: battleSessions[0].id,
    user_id: users[0].id,
    prompt_text: "A magical forest with glowing mushrooms and floating lanterns at twilight, featuring ethereal creatures and mystical ruins",
    player_position: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: generateUUID(),
    session_id: battleSessions[0].id,
    user_id: users[1].id,
    prompt_text: "A futuristic cyberpunk metropolis during a neon-lit night, with holographic advertisements and flying vehicles weaving between skyscrapers",
    player_position: 2,
    created_at: new Date().toISOString(),
  },
];

// Generate generated images data
export const generatedImages = [
  {
    id: generateUUID(),
    prompt_id: battlePrompts[0].id,
    image_url: '/placeholder/magical-forest-full.jpg',
    thumbnail_url: '/placeholder/magical-forest-thumb.jpg',
    generation_status: 'completed',
    created_at: new Date().toISOString(),
  },
  {
    id: generateUUID(),
    prompt_id: battlePrompts[1].id,
    image_url: '/placeholder/cyberpunk-city-full.jpg',
    thumbnail_url: '/placeholder/cyberpunk-city-thumb.jpg',
    generation_status: 'completed',
    created_at: new Date().toISOString(),
  },
];

// Generate battle results data
export const battleResults = [
  {
    id: generateUUID(),
    session_id: battleSessions[0].id,
    winner_prompt_id: battlePrompts[0].id,
    winner_votes: 8,
    total_votes: 15,
    created_at: new Date().toISOString(),
  },
];

// Export types
export type User = typeof users[0];
export type BattleSession = typeof battleSessions[0];
export type BattlePrompt = typeof battlePrompts[0];
export type GeneratedImage = typeof generatedImages[0];
export type BattleResult = typeof battleResults[0];

// Export all data
export const data = {
  users,
  battleSessions,
  battlePrompts,
  generatedImages,
  battleResults,
};

export default data;