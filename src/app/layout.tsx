"use client";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/toaster";
import { UserContextProvider } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "Revfin - AI Caller",
//   description:
//     "Level up your sales and support with AI, now with completely automated end to end calling",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathName = usePathname();

  if (pathName.includes("/embed")) {
    return (
      <html>
        <body
          style={{ backgroundColor: "transparent" }}
          className={cn(inter.className)}
        >
          {" "}
          <ThemeProvider attribute="class">{children}</ThemeProvider>
        </body>
      </html>
    ); // Render children directly, no layout
  }
  return (
    <html lang="en">
      <body className={cn(inter.className)}>
        <ThemeProvider attribute="class">
          <UserContextProvider>
            <Navbar />
            <div className="max-w-[125ch] lg:mx-auto mt-8">{children}</div>{" "}
            {/* Added mt-8 class */}
          </UserContextProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
