import { auth, currentUser } from "@clerk/nextjs/server";
import dbConnect from "./db/mongodb";
import User from "@/models/User";
import Institute from "@/models/Institute";
import { ROLE_MAP, DEFAULT_ROLE, INSTITUTE_NAME } from "@/config/appConfig";

// ============================================================
// AUTO-PROVISIONING AUTH
// On first login, automatically creates a User + Institute
// based on the email→role mapping in config/appConfig.js
// TODO: Replace hardcoded role logic with DB-based roles
// ============================================================

export async function getAuthUser() {
  await dbConnect();

  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");
  
  const email = clerkUser.emailAddresses?.[0]?.emailAddress || "";

  // Check if user already exists in DB by clerk_id
  let user = await User.findOne({ clerk_id: userId }).exec();
  if (user) return user;

  // If not found by clerk_id, check if Admin pre-created the user by email
  if (email) {
    user = await User.findOne({ phoneOrEmail: email }).exec();
    if (user) {
      // User was pre-created! Claim the account by attaching the clerk_id
      user.clerk_id = userId;
      // Optionally update name if it was blank
      const clerkName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
      if (!user.name && clerkName) user.name = clerkName;
      await user.save();
      return user;
    }
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
}

export async function requireRole(allowedRoles) {
  const user = await getAuthUser();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden: Invalid Role");
  }
  return user;
}
