// app/seed/route.ts
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { hash } from 'bcrypt';

export async function GET(request: Request) {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
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
        player_position INTEGER NOT NULL, -- 1 or 2
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create generated images table
    await sql`
      CREATE TABLE IF NOT EXISTS generated_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        prompt_id UUID REFERENCES battle_prompts(id),
        image_url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create battle results table
    await sql`
      CREATE TABLE IF NOT EXISTS battle_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES battle_sessions(id),
        winner_prompt_id UUID REFERENCES battle_prompts(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_battle_sessions_host_user ON battle_sessions(host_user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_battle_prompts_session ON battle_prompts(session_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_battle_results_session ON battle_results(session_id);`;

    // Insert default admin user
    const defaultPassword = 'admin123'; // Change this in production
    const hashedPassword = await hash(defaultPassword, 10);
    
    await sql`
      INSERT INTO users (username, password_hash)
      VALUES ('admin', ${hashedPassword})
      ON CONFLICT (username) DO NOTHING;
    `;

    // Create trigger function for updating timestamps
    await sql`
      CREATE OR REPLACE FUNCTION update_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;

    // Create triggers for all tables with updated_at
    await sql`
      DROP TRIGGER IF EXISTS update_users_timestamp ON users;
      CREATE TRIGGER update_users_timestamp
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
    `;

    await sql`
      DROP TRIGGER IF EXISTS update_battle_sessions_timestamp ON battle_sessions;
      CREATE TRIGGER update_battle_sessions_timestamp
      BEFORE UPDATE ON battle_sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
    `;

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
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}