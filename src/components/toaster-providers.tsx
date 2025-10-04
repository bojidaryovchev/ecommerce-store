import { TOASTER_DURATION_MS } from "@/constants";
import React, { PropsWithChildren } from "react";
import { Toaster } from "react-hot-toast";

const ToasterProviders: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      {children}
      <Toaster
        toastOptions={{
          style: {
            fontSize: "0.875rem",
          },
          duration: TOASTER_DURATION_MS,
        }}
      />
    </>
  );
};

export default ToasterProviders;
