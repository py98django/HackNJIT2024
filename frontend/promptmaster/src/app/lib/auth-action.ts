'use server';

export async function handleSocialLogin(provider: 'google' | 'facebook') {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  return redirect(`/api/auth/${provider}`);
}