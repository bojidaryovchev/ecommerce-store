import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Reviews",
  description: "Manage product reviews",
};

const ReviewsPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Reviews</h1>
        <p className="text-muted-foreground mt-2">Moderate and manage product reviews</p>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Star className="text-muted-foreground mb-4 h-16 w-16" />
          <h3 className="mb-2 text-xl font-semibold">Reviews Management</h3>
          <p className="text-muted-foreground text-center">
            This section is coming soon. You&apos;ll be able to moderate and respond to product reviews here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewsPage;
