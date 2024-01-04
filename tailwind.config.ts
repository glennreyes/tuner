import type { Config } from 'tailwindcss';

import containerQueries from '@tailwindcss/container-queries';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import { fontFamily } from 'tailwindcss/defaultTheme';

const config: Config = {
  content: ['./components/**/*.{mdx,ts,tsx}', './app/**/*.{mdx,ts,tsx}'],
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [containerQueries, forms, typography],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-mono)', ...fontFamily.mono],
        sans: ['var(--font-sans)', ...fontFamily.sans],
      },
    },
  },
};
export default config;
