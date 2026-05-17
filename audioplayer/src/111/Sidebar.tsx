"use client";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { HiHome } from "react-icons/hi";
import { BiSearch } from "react-icons/bi";
import { Box } from "./Box";
import { SidebarItem } from "./SidebarItem";
import { Library } from "./Library";
import { Headphones, ListMusic, Tv, ShieldCheck } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  children: React.ReactNode;
}
export const Sidebar = ({ children }: SidebarProps) => {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const routes = useMemo(
    () => [
      {
        icon: HiHome,
        label: "Home",
        active: pathname !== "/search" && pathname !== "/sounds" && pathname !== "/playlist" && pathname !== "/tv" && pathname !== "/admin",
        href: "/",
      },
      {
        icon: BiSearch,
        label: "Search",
        active: pathname === "/search",
        href: "/search",
      },
      {
        icon: Headphones,
        label: "Sounds",
        active: pathname === "/sounds",
        href: "/sounds",
      },
      {
        icon: ListMusic,
        label: "Playlist",
        active: pathname === "/playlist",
        href: "/playlist",
      },
      {
        icon: Tv,
        label: "Tv",
        active: pathname === "/tv",
        href: "/tv",
      },
      {
        icon: ShieldCheck,
        label: "Admin",
        active: pathname === "/admin",
        href: "/admin",
      }
    ],
    [pathname]
  );
  return (
    <div className="h-full">
      <div
        className={`hidden md:flex flex-col gap-y-2 bg-black h-full w-[300px] p-2 fixed inset-y-0`}
      >
        <Box>
          <div className="flex flex-col gap-y-4 px-5 py-4">
            {routes.map((item) => (
              <SidebarItem key={item.label} {...item} />
            ))}
          </div>
        </Box>
        <Box className="overflow-y-auto h-full">
          <Library />
        </Box>
      </div>
      <main className={`h-full flex-1 overflow-y-auto ${!isMobile ? "md:pl-[300px]" : ""}`}>
        {children}
      </main>
    </div>
  );
};
