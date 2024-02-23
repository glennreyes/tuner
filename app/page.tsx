import { GitHub } from '@/components/icons/github';
import { X } from '@/components/icons/x';
import { Tuner } from '@/components/tuner';

const RootPage = () => (
  <main className="mx-auto grid min-h-dvh max-w-screen-md items-center p-2">
    <Tuner />
    <div className="flex justify-center gap-2 p-4">
      <a
        className="items-center justify-center rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        href="https://x.com/glnnrys"
        rel="noreferrer"
        target="_blank"
      >
        <X className="h-5 w-5" />
        <span className="sr-only">Twitter</span>
      </a>
      <a
        className="items-center justify-center rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        href="https://github.com/glennreyes/tuner"
        rel="noreferrer"
        target="_blank"
      >
        <GitHub className="h-5 w-5" />
        <span className="sr-only">Twitter</span>
      </a>
    </div>
  </main>
);

export default RootPage;
