import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/db/mongodb";
import { getAuthUser } from "@/lib/auth";
import DashboardLayoutClient from "@/components/DashboardLayoutClient";

export default async function DashboardGroupLayout({ children }) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const user = await getAuthUser();

  return (
    <DashboardLayoutClient role={user.role} userName={user.name}>
      {children}
    </DashboardLayoutClient>
  );
}
