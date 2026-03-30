import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LoginClient from "@/components/LoginClient";
import ContactSupport from "@/components/ContactSupport";

export default async function Page() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <>
      <LoginClient />
      <ContactSupport />
    </>
  );
}
