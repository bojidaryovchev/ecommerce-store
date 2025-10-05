import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

/**
 * Get the current user session
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

/**
 * Check if user has a specific role
 */
export function hasRole(userRoles: UserRole[], role: UserRole): boolean {
  return userRoles.includes(role);
}

/**
 * Check if user has admin role
 */
export function isAdmin(userRoles: UserRole[]): boolean {
  return hasRole(userRoles, UserRole.ADMIN) || hasRole(userRoles, UserRole.SUPER_ADMIN);
}

/**
 * Check if user has super admin role
 */
export function isSuperAdmin(userRoles: UserRole[]): boolean {
  return hasRole(userRoles, UserRole.SUPER_ADMIN);
}

/**
 * Require admin role or redirect to unauthorized page
 */
export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/api/auth/signin");
  }

  if (!isAdmin(user.roles)) {
    redirect("/admin/unauthorized");
  }

  return user;
}

/**
 * Require super admin role or redirect to unauthorized page
 */
export async function requireSuperAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/api/auth/signin");
  }

  if (!isSuperAdmin(user.roles)) {
    redirect("/admin/unauthorized");
  }

  return user;
}
