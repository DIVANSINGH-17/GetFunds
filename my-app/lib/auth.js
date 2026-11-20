import GitHubProvider from "next-auth/providers/github";
import connectDb from "@/db/connectDB";
import User from "@/models/User";
import { RESERVED_USERNAMES } from "@/lib/usernames";

const usernameStemFromEmail = (email) => {
  const emailPrefix = email.split("@")[0].toLowerCase();
  const cleaned = emailPrefix.replace(/[^a-z0-9_]/g, "").slice(0, 24);
  const stem = cleaned.length >= 3 ? cleaned : `creator_${cleaned || "user"}`;

  return RESERVED_USERNAMES.has(stem) ? `${stem}_creator` : stem;
};

const createUserWithAvailableUsername = async ({ email, name }) => {
  const stem = usernameStemFromEmail(email);

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const suffix = attempt === 0 ? "" : `_${attempt + 1}`;
    const username = `${stem.slice(0, 30 - suffix.length)}${suffix}`;

    try {
      return await User.create({
        email,
        name: name?.trim() || "",
        username,
      });
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }

      if (error?.keyPattern?.email || error?.keyValue?.email) {
        return User.findOne({ email });
      }
    }
  }

  throw new Error("Could not generate an available username.");
};

export const authOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      // GitHub includes this RFC 9207 issuer in OAuth callback responses.
      issuer: "https://github.com/login/oauth",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "github") {
        return false;
      }

      const email = user?.email?.trim().toLowerCase();

      if (!email) {
        return false;
      }

      await connectDb();

      const currentUser = await User.findOne({ email });

      if (!currentUser) {
        await createUserWithAvailableUsername({
          email,
          name: user.name,
        });
      }

      return true;
    },
    async session({ session }) {
      const email = session?.user?.email?.trim().toLowerCase();

      if (!email) {
        return session;
      }

      await connectDb();

      const dbUser = await User.findOne({ email })
        .select("_id username")
        .lean();

      if (dbUser) {
        session.user.id = String(dbUser._id);
        session.user.username = dbUser.username;
      }

      return session;
    },
  },
};
