import React, { PropsWithChildren } from "react";
import "./globals.css";

/**
 * The <html> element is rendered by app/[locale]/layout.tsx (storefront, bg/en)
 * and app/admin/layout.tsx (admin, English).
 */
const RootLayout: React.FC<PropsWithChildren> = ({ children }) => children;

export default RootLayout;
