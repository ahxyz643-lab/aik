import type { Config } from '@react-router/dev/config';

export default {
  ssr: true,
  // Vercel's forwarded browser origin can differ from the internal request URL.
  // Allow only AIK's production host and Vercel deployment hosts for actions.
  allowedActionOrigins: ['aik-nine.vercel.app', '*.vercel.app'],
} satisfies Config;
