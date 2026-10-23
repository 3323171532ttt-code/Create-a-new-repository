import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { pool } from "./db";

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    database: {
      validateSchema: false,
    },
  },
  plugins: [
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
