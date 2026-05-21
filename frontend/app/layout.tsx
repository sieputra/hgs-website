import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PT Handal Guna Sarana | HGS",
  description:
    "PT Handal Guna Sarana provides trucking, warehousing, last mile delivery, distribution center, and custom logistics project services.",
  openGraph: {
    title: "PT Handal Guna Sarana | HGS",
    description:
      "Simplify your logistics complexity with HGS trucking, warehousing, and delivery services.",
    type: "website",
    locale: "id_ID",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
