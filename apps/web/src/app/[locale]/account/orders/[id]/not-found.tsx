import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Package } from "lucide-react";
import { getTranslations } from "next-intl/server";
import React from "react";

const OrderNotFound: React.FC = async () => {
  const t = await getTranslations("account.orderNotFound");

  return (
    <div className="py-8 text-center">
      <Package className="text-muted-foreground mx-auto h-16 w-16" />
      <h2 className="mt-6 text-2xl font-bold">{t("title")}</h2>
      <p className="text-muted-foreground mt-2">{t("description")}</p>
      <div className="mt-8">
        <Button asChild>
          <Link href="/account/orders">{t("backToOrders")}</Link>
        </Button>
      </div>
    </div>
  );
};

export default OrderNotFound;
