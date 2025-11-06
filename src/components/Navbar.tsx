"use client";

import { FC, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import MiniLogo from "@/../public/revfin-logo.png";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import useUser from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import UserRestricted from "./UserRestricted";
import { auth } from "@/firebase/config";
import {
  FaHome,
  FaSignInAlt,
  FaUserFriends,
  FaUsers,
  FaBullhorn,
  FaPhone,
  FaMoon,
  FaSun,
} from "react-icons/fa";
import { useTheme } from "next-themes";

type ILink = {
  name: string;
  to: string;
  loggedIn?: boolean;
  icon?: ReactNode;
};

const Navlink: FC<{
  href: string;
  children?: ReactNode;
  onClick?: () => any;
  icon?: ReactNode;
}> = ({ href, children, onClick, icon }) => {
  return (
    <Link
      className="group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 active:bg-primary/20"
      href={href}
      onClick={onClick}
    >
      {icon && (
        <span className="text-muted-foreground group-hover:text-primary transition-colors">
          {icon}
        </span>
      )}
      {children}
    </Link>
  );
};

const MenuIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

export const LINKS: ILink[] = [
  { name: "Home", to: "/", loggedIn: true, icon: <FaHome /> },
  { name: "Agents", to: "/agents", loggedIn: true, icon: <FaUserFriends /> },
  { name: "Campaigns", to: "/campaigns", loggedIn: true, icon: <FaBullhorn /> },
  { name: "Calls", to: "/calls", loggedIn: true, icon: <FaPhone /> },
];

const Icon = ({ className }: { className?: string }) => (
  <div className={cn("relative aspect-square", className)}>
    <Image
      src={MiniLogo}
      alt="Revfin Logo"
      fill
      className="object-contain transition-transform hover:scale-105"
      priority
    />
  </div>
);

const Navbar = () => {
  const { user } = useUser();
  const { systemTheme, theme, setTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;

  const handleLogout = async () => {
    await auth.signOut();
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-50 w-screen border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-row h-16 items-center px-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-transparent"
            >
              <MenuIcon className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <div className="flex items-center gap-2 pb-8">
              <Icon className="h-10 w-10" />
              {/* <span className="font-semibold text-lg">Revfin</span> */}
            </div>
            <nav className="flex flex-col gap-4">
              {LINKS.map((link) => (
                <UserRestricted
                  user={user}
                  loginNeeded={link.loggedIn}
                  key={link.name}
                >
                  <Navlink href={link.to} icon={link.icon}>
                    {link.name}
                  </Navlink>
                </UserRestricted>
              ))}
              {user && (
                <Navlink href="#" onClick={handleLogout}>
                  Logout
                </Navlink>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/" className="mr-6 hidden lg:flex items-center gap-2">
          <Icon className="h-24 w-24" />
          {/* <span className="font-semibold text-lg">Revfin</span> */}
        </Link>

        <nav className="hidden lg:flex flex-1 items-center gap-6 px-6">
          {LINKS.map((link) => (
            <UserRestricted
              user={user}
              loginNeeded={link.loggedIn}
              key={link.name}
            >
              <Navlink href={link.to} icon={link.icon}>
                {link.name}
              </Navlink>
            </UserRestricted>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden lg:flex">
              <Navlink href="#" onClick={handleLogout}>
                Logout
              </Navlink>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full"
          >
            {theme === "dark" ? (
              <FaSun className="h-5 w-5 transition-transform hover:rotate-45" />
            ) : (
              <FaMoon className="h-5 w-5 transition-transform hover:-rotate-12" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
