'use client';

import { useEffect } from 'react';
import { NeynarAuthButton, useNeynarContext } from '@neynar/react';

interface AuthButtonProps {
  onAuthSuccess: (data: any) => void;
}

export default function AuthButton({ onAuthSuccess }: AuthButtonProps) {
  const { user } = useNeynarContext();

  useEffect(() => {
    const storedAuth = localStorage.getItem('farcaster_auth');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (authData.fid) {
          onAuthSuccess(authData);
          return;
        }
      } catch (error) {
        localStorage.removeItem('farcaster_auth');
      }
    }

    if (user && user.fid) {
      const authData = {
        signer_uuid: user.signer_uuid || 'sdk',
        fid: user.fid,
        username: user.username,
        display_name: user.display_name || user.username,
        pfp_url: user.pfp_url || '',
      };
      
      localStorage.setItem('farcaster_auth', JSON.stringify(authData));
      onAuthSuccess(authData);
    }
  }, [user, onAuthSuccess]);

  return (
    <div className="flex justify-center">
      <NeynarAuthButton />
    </div>
  );
}
