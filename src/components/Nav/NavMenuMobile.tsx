"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { MenuIcon, SearchIcon, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode, useState } from "react";

import { Link } from "@/lib/i18n";

import type { NavItem } from "./items";

export const NavMenuMobile = ({
  logo,
  items,
  footer,
}: {
  logo: ReactNode;
  items: NavItem[];
  footer?: ReactNode;
}) => {
  const t = useTranslations("menu");
  const [open, setOpen] = useState(false);

  return (
    <nav className="flex w-auto items-center justify-between lg:hidden">
      <div className="flex gap-8">
        {/* <SearchIcon className="size-6" /> */}
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger>
            <MenuIcon className="size-[calc(var(--sm)*1.5)]" />
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed left-0 top-0 z-50 flex h-screen w-screen overflow-y-auto bg-background">
              <Dialog.Content className="flex w-full flex-col p-6">
                <Dialog.Title className="hidden">{t("menu")}</Dialog.Title>

                <header className="flex items-center justify-between pb-6 text-nav">
                  {logo}
                  <div className="flex flex-row gap-8">
                    {/* <SearchIcon className="size-6" /> */}
                    <Dialog.Close>
                      <X className="size-[calc(var(--sm)*1.5)]" />
                    </Dialog.Close>
                  </div>
                </header>

                <div className="flex h-full flex-col justify-between pb-16 pt-6">
                  <ol
                    className="flex flex-col gap-8 text-sm text-nav"
                    onClick={() => setOpen(false)}
                  >
                    {items.map((item) => (
                      <li key={item.id} className="flex flex-col gap-6">
                        <Link href={item.href} target={item.target}>
                          {item.title}
                        </Link>
                        {/* Laid out in full: a full-screen menu has room, and
                            a tap-to-open level would be one more step. */}
                        {item.children.length ? (
                          <ul className="flex flex-col gap-6 pl-4 opacity-50">
                            {item.children.map((child) => (
                              <li key={child.id}>
                                <Link href={child.href} target={child.target}>
                                  {child.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                  <footer>{footer}</footer>
                </div>
              </Dialog.Content>
            </Dialog.Overlay>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </nav>
  );
};
