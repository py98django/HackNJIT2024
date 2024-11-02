// app/seed/route.ts
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import data from '../lib/placeholder-data';

export async function GET(request: Request) {
  try {
    // Create users table with profile picture
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        profile_pic_url TEXT DEFAULT '/placeholder/default-avatar.jpg',
        display_name VARCHAR(255),
        bio TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS battle_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        host_user_id UUID REFERENCES users(id),
        session_code VARCHAR(6) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        max_players INTEGER DEFAULT 2,
        current_players INTEGER DEFAULT 1,
        battle_theme TEXT,
        time_limit INTEGER DEFAULT 60,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create prompts table
    await sql`
      CREATE TABLE IF NOT EXISTS battle_prompts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES battle_sessions(id),
        user_id UUID REFERENCES users(id),
        prompt_text TEXT NOT NULL,
        player_position INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create generated images table
    await sql`
      CREATE TABLE IF NOT EXISTS generated_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        prompt_id UUID REFERENCES battle_prompts(id),
        image_url TEXT NOT NULL,
        thumbnail_url TEXT,
        generation_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create battle results table
    await sql`
      CREATE TABLE IF NOT EXISTS battle_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES battle_sessions(id),
        winner_prompt_id UUID REFERENCES battle_prompts(id),
        winner_votes INTEGER DEFAULT 0,
        total_votes INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Insert seed data
    console.log('Seeding users...');
    for (const user of data.users) {
      await sql`
        INSERT INTO users (id, username, password_hash, profile_pic_url, display_name, bio)
        VALUES (${user.id}, ${user.username}, ${user.password_hash}, ${user.profile_pic_url}, ${user.display_name}, ${user.bio})
        ON CONFLICT (username) DO UPDATE SET
          profile_pic_url = EXCLUDED.profile_pic_url,
          display_name = EXCLUDED.display_name,
          bio = EXCLUDED.bio;
      `;
    }

    console.log('Seeding battle sessions...');
    for (const session of data.battleSessions) {
      await sql`
        INSERT INTO battle_sessions (id, host_user_id, session_code, is_active, max_players, current_players, battle_theme, time_limit)
        VALUES (${session.id}, ${session.host_user_id}, ${session.session_code}, ${session.is_active}, ${session.max_players}, ${session.current_players}, ${session.battle_theme}, ${session.time_limit})
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    console.log('Seeding battle prompts...');
    for (const prompt of data.battlePrompts) {
      await sql`
        INSERT INTO battle_prompts (id, session_id, user_id, prompt_text, player_position)
        VALUES (${prompt.id}, ${prompt.session_id}, ${prompt.user_id}, ${prompt.prompt_text}, ${prompt.player_position})
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    console.log('Seeding generated images...');
    for (const image of data.generatedImages) {
      await sql`
        INSERT INTO generated_images (id, prompt_id, image_url, thumbnail_url, generation_status)
        VALUES (${image.id}, ${image.prompt_id}, ${image.image_url}, ${image.thumbnail_url}, ${image.generation_status})
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    console.log('Seeding battle results...');
    for (const result of data.battleResults) {
      await sql`
        INSERT INTO battle_results (id, session_id, winner_prompt_id, winner_votes, total_votes)
        VALUES (${result.id}, ${result.session_id}, ${result.winner_prompt_id}, ${result.winner_votes}, ${result.total_votes})
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    return NextResponse.json({
      message: 'Database seeded successfully',
      tables: [
        'users',
        'battle_sessions',
        'battle_prompts',
        'generated_images',
        'battle_results'
      ]
    }, { status: 200 });

  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}