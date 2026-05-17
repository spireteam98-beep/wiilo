
"use client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Headphones, ListMusic, Radio, ShieldCheck, Tv, Video } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { BiSearch } from "react-icons/bi";
import { HiHome } from "react-icons/hi";
import { Box } from "./Box";
import { Library } from "./Library";
import { SidebarItem } from "./SidebarItem";

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
        active: pathname === "/",
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
        active: pathname === "/",
        href: "/",
      },
      {
        icon: ListMusic,
        label: "Playlist",
        active: pathname === "/",
        href: "/",
      },
       {
        icon: Radio,
        label: "Podcasts",
        active: pathname === "/",
        href: "/",
      },
      {
        icon: Tv,
        label: "Tv",
        active: pathname === "/",
        href: "/",
      },
      {
        icon: ShieldCheck,
        label: "Admin",
        active: pathname === "/",
        href: "/",
      },
      {
        icon: Video,
        label: "Video",
        active: pathname === "/",
        href: "/",
      },
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
