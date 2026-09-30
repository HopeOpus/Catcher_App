'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { acceptInviteAction } from '@/app/dashboard/business/actions';
import { Button } from '@/components/ui/button';

export default function AcceptInviteButton({
  token,
  businessName,
}: {
  token: string;
  businessName: string;
}) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleAccept = async () => {
    setIsAccepting(true);
    setError(null);
    const result = await acceptInviteAction(token);

    if (!result.ok) {
      setIsAccepting(false);
      setError(result.error);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <Button
        className="h-11 w-full cursor-pointer bg-[#0F2651] text-white hover:bg-[#36689e]"
        disabled={isAccepting}
        onClick={() => void handleAccept()}
      >
        {isAccepting ? <Loader2 aria-hidden className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isAccepting ? 'Joining…' : `Join ${businessName}`}
      </Button>
      {error ? (
        <p role="alert" className="text-center text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
