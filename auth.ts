import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { apiLogin, apiGoogleSignIn } from "@/lib/api";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const { user } = await apiLogin(
            credentials.email as string,
            credentials.password as string
          );
          return user;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {

    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          const { user: dbUser } = await apiGoogleSignIn(
            user.email, user.name, user.image,
            account.provider,        // oauth_provider = "google"
            account.providerAccountId // oauth_id = Google sub
          );
          (user as Record<string, unknown>).role = dbUser.role;
          user.id = dbUser.id;
        } catch {
          return false;
        }
      }
      return true;
    },
  },
});
