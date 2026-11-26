"use client";

import { Link } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { SearchInput } from "../Search/SearchInput";
import { useSearchQuery } from "../Search/provider";
import { NavDropdown } from "./NavDropdown";
import type { NavItem } from "./items";

export const NavMenuDesktop = ({
  showSearch,
  items,
}: {
  showSearch: boolean;
  items: NavItem[];
}) => {
  const { isActive } = useSearchQuery();

  return (
    <nav
      className={cn(
        "hidden w-full items-center justify-end lg:flex",
        // The open search field spans the nav, so it needs the nav as its
        // containing block. While closed, the links instead position against
        // the header so they sit centered on the page, not in this column.
        isActive && "relative",
      )}
    >
      {!isActive ? (
        <ol className="absolute left-1/2 top-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 items-center gap-8 whitespace-nowrap text-sm text-nav">
          {items.map((item) =>
            item.children.length ? (
              <NavDropdown key={item.id} item={item} />
            ) : (
              <li key={item.id}>
                <Link href={item.href} target={item.target}>
                  {item.title}
                </Link>
              </li>
            ),
          )}
        </ol>
      ) : null}
      {showSearch ? <SearchInput /> : null}
    </nav>
  );
};
