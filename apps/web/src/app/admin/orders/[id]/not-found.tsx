import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import Link from "next/link";

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <Package className="text-muted-foreground mb-4 h-16 w-16" />
      <h2 className="mb-2 text-2xl font-bold">Order Not Found</h2>
      <p className="text-muted-foreground mb-6">The order you&apos;re looking for doesn&apos;t exist.</p>
      <Button asChild>
        <Link href="/admin/orders">View All Orders</Link>
      </Button>
    </div>
  );
};

export default NotFound;
