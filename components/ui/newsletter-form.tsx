'use client';

import { cn } from '@/lib/utils';

interface NewsletterFormProps {
  className?: string;
}

export function NewsletterForm({ className }: NewsletterFormProps) {
  return (
    <section
      className={cn(
        'bg-card/20 border border-border rounded-sm p-6 flex flex-col items-center text-center text-foreground',
        className,
      )}
    >
      <h2 className="text-xl font-bold mb-4 text-foreground">Join the Newsletter</h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        Occasional updates on new blog posts, experiments & project drops. No spam, pinky promise.
      </p>
      {/* Beehiiv iframe embed */}
      <iframe
        src="https://embeds.beehiiv.com/836c8a14-2b82-447a-80e8-d419a489ff75?slim=true"
        data-test-id="beehiiv-embed"
        height="52"
        frameBorder="0"
        scrolling="no"
        style={{ margin: 0, borderRadius: 0, backgroundColor: 'transparent', width: '100%' }}
      />
    </section>
  );
} 