// app/lib/actions.ts
'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import bcrypt from 'bcrypt';

// Define the form schema
const LoginSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters',
  }),
});

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    // Validate form fields using Zod
    const validatedFields = LoginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    if (!validatedFields.success) {
      return 'Invalid email or password format';
    }

    const { email, password } = validatedFields.data;

    // Query the database for the user
    const user = await sql`
      SELECT id, username, password_hash
      FROM users
      WHERE username = ${email}
      LIMIT 1
    `;

    // Check if user exists
    if (user.rows.length === 0) {
      return 'Invalid email or password';
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(
      password,
      user.rows[0].password_hash
    );

    if (!passwordMatch) {
      return 'Invalid email or password';
    }

    // Create session
    const session = await sql`
      INSERT INTO battle_sessions (
        host_user_id,
        session_code,
        is_active
      )
      VALUES (
        ${user.rows[0].id},
        ${generateSessionCode()},
        true
      )
      RETURNING id, session_code
    `;

    // Set authentication cookie or token (implementation depends on your auth strategy)
    // For example, using NextAuth.js:
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/dashboard',
    });

    revalidatePath('/dashboard');
    redirect('/dashboard');

  } catch (error) {
    // Check if error is from NextAuth
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials';
        default:
          return 'Authentication error';
      }
    }
    
    // Handle other errors
    console.error('Authentication error:', error);
    return 'Something went wrong! Please try again.';
  }
}

// Helper function to generate a unique 6-character session code
function generateSessionCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  return code;
}

// Optional: Function to validate session code
export async function validateSessionCode(code: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT id 
      FROM battle_sessions 
      WHERE session_code = ${code} 
      AND is_active = true
      AND current_players < max_players
      LIMIT 1
    `;
    return result.rows.length > 0;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
}

// Optional: Function to join session
export async function joinSession(code: string, userId: string) {
  try {
    await sql`
      UPDATE battle_sessions
      SET current_players = current_players + 1
      WHERE session_code = ${code}
      AND is_active = true
      AND current_players < max_players
    `;
    revalidatePath('/battle');
    redirect('/battle');
  } catch (error) {
    console.error('Join session error:', error);
    return 'Failed to join session';
  }
}