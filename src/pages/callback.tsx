import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      const { error } = await supabase.auth.getSessionFromUrl();

      if (error) {
        console.error('Error restoring session from URL:', error.message);
        toast.error('Verification failed.');
        router.push('/login'); // or your fallback
      } else {
        toast.success('Email verified!');
        router.push('/dashboard'); // or your intended post-login page
      }
    };

    handleRedirect();
  }, []);

  return <p>Verifying...</p>;
}
