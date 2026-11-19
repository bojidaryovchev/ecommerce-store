import { auth } from "@/lib/auth";
import { db, users } from "@ecommerce/database";
import { UserRole } from "@ecommerce/database/schema";
import { eq } from "drizzle-orm";

const ADMIN_ROLES: ReadonlySet<string> = new Set([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

/**
 * Whether the user is an admin right now, read from the database. The role in the session cookie is the one
 * they had at sign-in: an admin demoted or deleted since keeps it until the cookie expires, so it never decides
 * access (it only shows the admin link in the navbar). A user promoted since signing in is let in at once.
 */
async function isAdminNow(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  const user = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { role: true } });
  return user !== undefined && ADMIN_ROLES.has(user.role);
}

/**
 * Require the current user to be an admin (ADMIN or SUPER_ADMIN) as the database has it now.
 * Throws if not signed in or not authorised. Use at the top of admin-only server actions and route handlers.
 */
async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !(await isAdminNow(session.user.id))) {
    throw new Error("Unauthorized");
  }
  return session;
}

export { isAdminNow, requireAdmin };
