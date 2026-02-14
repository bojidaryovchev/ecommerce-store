import { auth } from "@/lib/auth";
import { UserRole } from "@ecommerce/database/schema";

/**
 * Require the current user to be an admin (ADMIN or SUPER_ADMIN).
 * Throws an error if not authenticated or not authorized.
 * Use at the top of admin-only server actions.
 */
async function requireAdmin() {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN) {
    throw new Error("Unauthorized");
  }

  return session;
}

export { requireAdmin };
