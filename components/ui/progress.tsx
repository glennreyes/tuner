'use client';

import { cn } from '@/lib/utils';
import { Indicator, Root } from '@radix-ui/react-progress';
import { forwardRef } from 'react';

const Progress = forwardRef<
  React.ElementRef<typeof Root>,
  React.ComponentPropsWithoutRef<typeof Root>
>(({ className, value, ...props }, ref) => (
  <Root
    className={cn(
      'relative h-1 w-full overflow-hidden rounded-full bg-secondary',
      className,
    )}
    ref={ref}
    {...props}
  >
    <Indicator
      className="h-full w-full flex-1 bg-muted-foreground transition-all"
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
    />
  </Root>
));

Progress.displayName = Root.displayName;

export { Progress };
