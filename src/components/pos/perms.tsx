"use client";

import { createContext, useContext, type ReactNode } from "react";
import { Lock } from "lucide-react";

/** Aktif kullanıcının düzenleme yetkisi (yönetici = salt-okunur). */
const PermsContext = createContext<{ canEdit: boolean }>({ canEdit: true });

export function PermsProvider({
  canEdit,
  children,
}: {
  canEdit: boolean;
  children: ReactNode;
}) {
  return <PermsContext.Provider value={{ canEdit }}>{children}</PermsContext.Provider>;
}

export const usePerms = () => useContext(PermsContext);

/** !canEdit iken içerik üstünde gösterilen salt-okunur şeridi. */
export function ReadOnlyBanner() {
  return (
    <div className="flex items-center justify-center gap-2 border-b border-sky-200 bg-sky-50 px-7 py-2 text-[12.5px] font-semibold text-sky-700">
      <Lock className="h-3.5 w-3.5" strokeWidth={2.4} />
      Görüntüleme modu — Yönetici yetkisiyle giriş yaptınız, düzenleme yapılamaz.
    </div>
  );
}
