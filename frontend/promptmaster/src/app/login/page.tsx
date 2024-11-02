import LoginForm from '@/app/ui/login-form';
import PromptLogo from '@/app/ui/prompt-logo';
import { FaGoogle, FaFacebookF } from 'react-icons/fa';

export default function LoginPage() {
  return (
    <main className="flex items-start justify-center min-h-screen bg-gradient-to-b from-blue-600 to-blue-400">
      <div className="relative mt-16 mx-auto flex w-full max-w-md flex-col items-center space-y-6 p-6 bg-white rounded-2xl shadow-lg">
        <div className="flex w-full items-center justify-center bg-blue-700 p-5 rounded-full shadow-md">
          <div className="w-28 md:w-36 text-white">
            <PromptLogo />
          </div>
        </div>
        
        <div className="w-full mt-2">
          <LoginForm />
        </div>

        <div className="flex flex-col w-full mt-4 space-y-3">
          <button
            className="flex items-center justify-center w-full px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
            // onClick={() => {/* handle Google login here */}}
          >
            <FaGoogle className="mr-2" />
            Sign in with Google
          </button>

          <button
            className="flex items-center justify-center w-full px-4 py-2 text-white bg-blue-800 rounded-lg hover:bg-blue-900"
            // onClick={() => {/* handle Facebook login here */}}
          >
            <FaFacebookF className="mr-2" />
            Sign in with Facebook
          </button>
        </div>
      </div>
    </main>
  );
}
