import Link from "next/link";
import { LogoSquare } from "@/components/layout/logo-square";
import { CartIcon, MenuIcon } from "@/components/icons";
import { NAV_MENU, STORE_NAME } from "@/lib/placeholder-data";
import { Search } from "./search";

export function Navbar() {
  const menu = NAV_MENU;

  return (
    <nav className="relative flex items-center justify-between p-4 lg:px-6">
      <div className="block flex-none md:hidden">
        <button
          type="button"
          aria-label="Open menu"
          className="flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 text-black transition-colors dark:border-neutral-700 dark:text-white"
        >
          <MenuIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex w-full items-center">
        <div className="flex w-full md:w-1/3">
          <Link
            href="/"
            prefetch={true}
            className="mr-2 flex w-full items-center justify-center md:w-auto lg:mr-6"
          >
            <LogoSquare />
            <div className="ml-2 flex-none text-sm font-medium uppercase md:hidden lg:block">
              {STORE_NAME}
            </div>
          </Link>
          {menu.length ? (
            <ul className="hidden gap-6 text-sm md:flex md:items-center">
              {menu.map((item) => (
                <li key={item.title}>
                  <Link
                    href={item.path}
                    prefetch={true}
                    className="text-neutral-500 underline-offset-4 hover:text-black hover:underline dark:text-neutral-400 dark:hover:text-neutral-300"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="hidden justify-center md:flex md:w-1/3">
          <Search />
        </div>

        <div className="flex justify-end md:w-1/3">
          <button
            type="button"
            aria-label="Open cart"
            className="relative flex h-11 w-11 items-center justify-center rounded-md border border-neutral-200 text-black transition-colors dark:border-neutral-700 dark:text-white"
          >
            <CartIcon className="h-4 w-4 transition-all ease-in-out hover:scale-110" />
            <span className="absolute right-0 top-0 -mr-2 -mt-2 grid h-4 w-4 place-items-center rounded-full bg-blue-600 text-[11px] font-medium text-white">
              0
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
