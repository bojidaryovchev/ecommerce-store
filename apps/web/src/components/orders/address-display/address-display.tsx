import React from "react";

type AddressData = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
};

type Props = {
  address: AddressData;
};

const AddressDisplay: React.FC<Props> = ({ address }) => {
  const cityLine = [address.city, address.state].filter(Boolean).join(", ");
  const cityStateZip = [cityLine, address.postalCode].filter(Boolean).join(" ");

  return (
    <div className="space-y-1.5 text-sm">
      <p className="text-foreground font-medium">{address.name}</p>
      <p className="text-muted-foreground">{address.line1}</p>
      {address.line2 && <p className="text-muted-foreground">{address.line2}</p>}
      <p className="text-muted-foreground">{cityStateZip}</p>
      <p className="text-muted-foreground">{address.country}</p>
      {address.phone && <p className="text-muted-foreground pt-1">{address.phone}</p>}
    </div>
  );
};

export { AddressDisplay };
