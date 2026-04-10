import { auth, currentUser } from "@clerk/nextjs/server";
import dbConnect from "./db/mongodb";
import User from "@/models/User";
import Institute from "@/models/Institute";
import { ROLE_MAP, DEFAULT_ROLE, INSTITUTE_NAME } from "@/config/appConfig";
import { cache } from "react";

// ============================================================
// AUTO-PROVISIONING AUTH
// On first login, automatically creates a User + Institute
// based on the email→role mapping in config/appConfig.js
// TODO: Replace hardcoded role logic with DB-based roles
// ============================================================

export const getAuthUser = cache(async function getAuthUser() {
  await dbConnect();

  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");
  
  const email = clerkUser.emailAddresses?.[0]?.emailAddress || "";

  // Always prioritize DB-defined email. If the admin reassigned an email, sync the clerk_id.
  if (email) {
    let userByEmail = await User.findOne({ phoneOrEmail: new RegExp(`^${email}$`, "i") }).exec();
    if (userByEmail) {
      if (userByEmail.clerk_id !== userId) {
        // Unlink any other user that currently holds this clerk_id (to prevent duplicates)
        await User.updateMany({ clerk_id: userId }, { $unset: { clerk_id: 1 } });
        
        // Link the correct user to this clerk profile
        userByEmail.clerk_id = userId;
        const clerkName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
        if (!userByEmail.name && clerkName) userByEmail.name = clerkName;
        
        await userByEmail.save();
      }
      return userByEmail;
    }
  }

  // Fallback: If no strict email match was found, check if user exists by clerk_id
  let user = await User.findOne({ clerk_id: userId }).exec();
  if (user) {
    // Optionally update their DB email if they changed it via Clerk profile
    if (email && user.phoneOrEmail.toLowerCase() !== email.toLowerCase()) {
      user.phoneOrEmail = email;
      await user.save();
    }
    return user;
  }

  // Completely new auto-provisioning
  const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || email;

  // TODO: Replace hardcoded role logic with DB-based roles
  const role = ROLE_MAP[email.toLowerCase()] || DEFAULT_ROLE;

  // Find or create institute
  let institute = await Institute.findOne({ name: INSTITUTE_NAME });
  if (!institute) {
    institute = await Institute.create({
      name: INSTITUTE_NAME,
      owner_name: name,
      phone: "+910000000000",
    });
  }

  // Create user in DB
  user = await User.create({
    name,
    phoneOrEmail: email,
    role,
    institute_id: institute._id,
    clerk_id: userId,
  });

  return user;
});

export async function requireRole(allowedRoles) {
  const user = await getAuthUser();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden: Invalid Role");
  }
  return user;
}
