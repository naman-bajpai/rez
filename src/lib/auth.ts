import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { createServiceRoleClient } from "@/lib/server/supabase";

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  session: {
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const supabase = createServiceRoleClient();
          await supabase
            .from("profiles")
            .upsert(
              {
                user_id: user.id,
                email: user.email,
                name: user.name,
                picture_url: (user as { image?: string | null }).image ?? null,
              },
              { onConflict: "user_id" }
            );
        },
      },
    },
  },
});
