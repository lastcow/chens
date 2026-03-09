import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { apiLogin, apiGoogleSignIn } from "@/lib/api";

const PUBLIC_PATHS = ["/", "/signin", "/register", "/unauthorized", "/api/auth", "/api/images"];

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
    authorized({ auth: session, request: { nextUrl } }) {
      const pathname = nextUrl.pathname;

      // Allow public paths
      if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;

      // Not signed in → redirect to sign in
      if (!session) return false;

      // role lives in token as top-level field; session callback maps it to session.user.role
      // Fall back to checking both locations
      const user = session.user as { role?: string; id?: string } | undefined;
      const role = user?.role;

      console.log("[auth middleware]", pathname, "role=", role, "user=", JSON.stringify(user));

      // Signed in but not ADMIN → unauthorized
      if (role !== "ADMIN") {
        return Response.redirect(new URL("/unauthorized", nextUrl));
      }

      return true;
    },
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
