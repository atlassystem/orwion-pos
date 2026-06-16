import { SearchIcon } from "@/components/icons";

export function Search() {
  return (
    <form className="relative w-full lg:w-80 xl:w-full">
      <input
        type="text"
        name="q"
        placeholder="Search for products..."
        autoComplete="off"
        className="w-full rounded-lg border bg-white px-4 py-2 text-sm text-black placeholder:text-neutral-500 dark:border-neutral-800 dark:bg-transparent dark:text-white dark:placeholder:text-neutral-400"
      />
      <div className="absolute right-0 top-0 mr-3 flex h-full items-center">
        <SearchIcon className="h-4 w-4 text-neutral-500" />
      </div>
    </form>
  );
}
