'use client';

import { useState } from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CopyShareLinkButton() {
  const [message, setMessage] = useState(null);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage('Copied');
    } catch (_error) {
      setMessage('Copy failed');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="secondary" onClick={handleCopyLink}>
        <Copy />
        Copy share link
      </Button>
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </div>
  );
}
