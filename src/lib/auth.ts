// src/lib/auth.ts
import { betterAuth } from 'better-auth';
import { Pool } from 'pg'; 
export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  emailAndPassword: { enabled: true },
  // optionally add Google OAuth:
  // socialProviders: { google: { clientId: '...', clientSecret: '...' } },
  session: {
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
});