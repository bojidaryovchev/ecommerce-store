import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Props {
  children: React.ReactNode;
}

const AdminProductsHeader: React.FC<Props> = ({ children }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button asChild>
          <Link href="/admin/products/new">Add Product</Link>
        </Button>
      </div>
      {children}
    </div>
  );
};

export { AdminProductsHeader };
