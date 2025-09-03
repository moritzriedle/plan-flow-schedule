import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error restoring session from URL:', error.message);
          toast.error('Verification failed.');
          navigate('/auth');
        } else if (data?.session) {
          toast.success('Email verified!');
          navigate('/');
        } else {
          navigate('/auth');
        }
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        navigate('/auth');
      }
    };

    handleRedirect();
  }, [navigate]);

  return <p>Verifying...</p>;
}
