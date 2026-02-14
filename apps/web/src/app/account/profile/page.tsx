import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import React from "react";

export const metadata: Metadata = {
  title: "Profile | My Account | Ecommerce Store",
  description: "View your profile information",
};

const getInitials = (name: string | null | undefined) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const ProfilePage: React.FC = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = session.user;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information from Google.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
              <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{user.name ?? "Unknown"}</p>
              <p className="text-muted-foreground text-sm">Signed in with Google</p>
            </div>
          </div>

          {/* Profile fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Name</Label>
              <p className="text-sm font-medium">{user.name ?? "—"}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Email</Label>
              <p className="text-sm font-medium">{user.email ?? "—"}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Role</Label>
              <p className="text-sm font-medium capitalize">{user.role?.toLowerCase() ?? "User"}</p>
            </div>
          </div>

          <p className="text-muted-foreground text-xs">
            Profile information is managed by your Google account and cannot be edited here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
