import { Button } from "@/components/ui/button";
import Link from "next/link";

const AdminSidebar: React.FC = () => {
  return (
    <aside className="border-border bg-muted/50 w-64 border-r p-4">
      <div className="mb-8">
        <Link href="/admin" className="text-xl font-bold">
          Admin Panel
        </Link>
      </div>
      <nav className="space-y-2">
        <Button asChild variant="ghost" className="w-full justify-start">
          <Link href="/admin">Dashboard</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full justify-start">
          <Link href="/admin/categories">Categories</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full justify-start">
          <Link href="/admin/products">Products</Link>
        </Button>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
