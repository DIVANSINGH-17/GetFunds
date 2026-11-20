import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Dashboard from "@/components/Dashboard";
import { authOptions } from "@/lib/auth";

const DashboardPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return <Dashboard />;
};

export default DashboardPage;

export const metadata = {
  title: "Creator Analytics",
  description: "Manage your funding target, project folders, and verified Razorpay test contribution analytics.",
};
