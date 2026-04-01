'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ReceiptViewActions() {
  return (
    <Button
      type="button"
      variant="outline"
      className="border-[#36689e] text-[#0F2651] print:hidden"
      onClick={() => {
        window.print();
      }}
    >
      <Download className="mr-2 h-4 w-4" />
      Download / Print Receipt
    </Button>
  );
}
