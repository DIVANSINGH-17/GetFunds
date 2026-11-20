import { getServerSession } from "next-auth";
import connectDb from "@/db/connectDB";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";

export const requireCurrentUser = async () => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    throw new Error("You must be signed in to perform this action.");
  }

  await connectDb();

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("The signed-in user no longer exists.");
  }

  return user;
};
