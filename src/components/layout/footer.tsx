import Link from "next/link";
import { LogoSquare } from "@/components/layout/logo-square";
import { FOOTER_MENU, STORE_NAME } from "@/lib/placeholder-data";

export function Footer() {
  const year = new Date().getFullYear();
  const startYear = 2023;
  const copyrightRange = year > startYear ? `${startYear}-${year}` : `${startYear}`;

  return (
    <footer className="text-sm text-neutral-500 dark:text-neutral-400">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 border-t border-neutral-200 px-6 py-12 text-sm md:flex-row md:gap-12 md:px-4 dark:border-neutral-700">
        <div>
          <Link
            href="/"
            className="flex items-center gap-2 text-black dark:text-white md:pt-1"
          >
            <LogoSquare size="sm" />
            <span className="uppercase">{STORE_NAME}</span>
          </Link>
        </div>

        <nav className="flex flex-col gap-2 md:flex-row md:flex-wrap md:gap-8">
          {FOOTER_MENU.map((item) => (
            <Link
              key={item.title}
              href={item.path}
              className="text-neutral-500 underline-offset-4 hover:text-black hover:underline dark:text-neutral-400 dark:hover:text-neutral-300"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="md:ml-auto">
          <span>Built with Next.js</span>
        </div>
      </div>

      <div className="border-t border-neutral-200 py-6 text-sm dark:border-neutral-700">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-1 px-4 md:flex-row md:gap-0">
          <p>
            © {copyrightRange} {STORE_NAME}. All rights reserved.
          </p>
          <p className="md:ml-auto">Designed in California</p>
        </div>
      </div>
    </footer>
  );
}
