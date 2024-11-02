'use client';

import { useRouter } from 'next/navigation';
import { IconType } from 'react-icons';

interface SocialLoginButtonProps {
  provider: 'google' | 'facebook';
  Icon: IconType;
  label: string;
  bgColor: string;
  hoverColor: string;
}

export function SocialLoginButton({ 
  provider, 
  Icon, 
  label, 
  bgColor, 
  hoverColor 
}: SocialLoginButtonProps) {
  const router = useRouter();
  
  const handleSocialLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    router.push(`/api/auth/${provider}`);
  };

  return (
    <button
      onClick={handleSocialLogin}
      type="button"
      className={`flex items-center justify-center w-full px-4 py-2 text-white ${bgColor} rounded-lg ${hoverColor} transition-colors duration-200`}
    >
      <Icon className="mr-2" />
      {label}
    </button>
  );
}