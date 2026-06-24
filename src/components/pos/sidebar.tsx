"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import {
  LayoutGrid,
  ChefHat,
  BookOpen,
  ClipboardList,
  Boxes,
  Users,
  BarChart3,
  Building2,
  Settings,
  UtensilsCrossed,
  ChevronsUpDown,
  ChevronDown,
  HelpCircle,
  ConciergeBell,
  TicketCheck,
  Check,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import { LEVELS, SHIFT, type ModuleId, type Staff, type Branch } from "@/lib/pos-modules";

/** Şube adından kısa rozet (örn. "Snack Bar" → "SB"). */
const branchInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export type View = ModuleId;

type Icon = ComponentType<LucideProps>;

type NavItem = { id: View; label: string; ic: Icon; badge?: string };

/** Üst grup — düz operasyon sekmeleri. */
const OPERATION: { label: string; items: NavItem[] } = {
  label: "Operasyon",
  items: [
    { id: "menu", label: "Menü", ic: BookOpen },
    { id: "masalar", label: "Masa Planı", ic: LayoutGrid },
    { id: "garson", label: "Garson", ic: ConciergeBell },
    { id: "siramatik", label: "Sıramatik", ic: TicketCheck },
    { id: "mutfak", label: "Mutfak (KDS)", ic: ChefHat },
    { id: "rapor", label: "Raporlar", ic: BarChart3 },
  ],
};

/** Açılır "Ayarlar" başlığı altındaki alt-sekmeler. */
const SETTINGS_ITEMS: NavItem[] = [
  { id: "menu_yonetim", label: "Menü Yönetimi", ic: ClipboardList },
  { id: "stok", label: "Stok & Reçeteler", ic: Boxes, badge: "3" },
  { id: "personel", label: "Personel", ic: Users },
  { id: "subeler", label: "Şubeler", ic: Building2 },
  { id: "ayarlar", label: "Genel", ic: Settings },
];

export function Sidebar({
  view,
  setView,
  user,
  onLogout,
  allowed,
  branches,
  activeBranchId,
  onSwitchBranch,
}: {
  view: View;
  setView: (v: View) => void;
  user: Staff;
  onLogout: () => void;
  allowed: ModuleId[];
  branches: Branch[];
  activeBranchId: string;
  onSwitchBranch: (id: string) => void;
}) {
  const [branchOpen, setBranchOpen] = useState(false);
  const lvl = LEVELS[user.level];
  const activeBranch =
    branches.find((b) => b.id === activeBranchId) ?? branches[0];

  // Ayarlar açılır başlığı: varsayılan kapalı; aktif sekme alt-sekmelerden
  // biriyse açık dursun. (Kullanıcı manuel açabilir; aktif sekme zaten açar.)
  const operationItems = OPERATION.items.filter((it) => allowed.includes(it.id));
  const settingsItems = SETTINGS_ITEMS.filter((it) => allowed.includes(it.id));
  const activeInSettings = settingsItems.some((it) => it.id === view);
  const [settingsOpenUser, setSettingsOpenUser] = useState(false);
  const settingsOpen = settingsOpenUser || activeInSettings;

  const renderItem = (it: NavItem, indented: boolean) => {
    const on = view === it.id;
    const Ic = it.ic;
    return (
      <button
        key={it.id}
        onClick={() => setView(it.id)}
        className={cn(
          "group flex items-center gap-3 rounded-xl py-2.5 text-sm font-semibold transition",
          indented ? "pl-4 pr-3" : "px-3",
          on
            ? "bg-brand text-white shadow-sm shadow-brand/30"
            : "text-ink2 hover:bg-surface2 hover:text-ink",
        )}
      >
        <Ic
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition",
            on ? "text-white" : "text-ink3 group-hover:text-ink2",
          )}
          strokeWidth={2.2}
        />
        <span className="flex-1 text-left">{it.label}</span>
        {it.badge && (
          <span
            className={cn(
              "grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold",
              on ? "bg-white/25 text-white" : "bg-brand-soft text-brand",
            )}
          >
            {it.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="flex w-[256px] shrink-0 flex-col border-r border-line bg-panel">
      {/* Marka */}
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand shadow-sm">
          <UtensilsCrossed className="h-5 w-5 text-white" strokeWidth={2.4} />
        </div>
        <div className="text-[17px] font-extrabold tracking-tight text-ink">
          {BRAND.name}
          <span className="ml-1 text-brand">{BRAND.suffix}</span>
        </div>
      </div>

      {/* Şube seçici — aktif şubeyi gösterir; buradan şube değiştirilebilir */}
      <div className="relative px-3 pb-1">
        <div className="px-2 pt-1 pb-1.5 text-[11px] font-bold tracking-wide text-ink3 uppercase">
          Şube
        </div>
        <button
          onClick={() => setBranchOpen((s) => !s)}
          className="flex w-full items-center gap-2.5 rounded-xl border border-line2 bg-surface2 px-2.5 py-2 text-left transition hover:bg-white"
        >
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-[11px] font-bold text-brand">
            {activeBranch ? branchInitials(activeBranch.name) : "—"}
          </div>
          <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
            {activeBranch?.name ?? "Şube seç"}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-ink3" strokeWidth={2} />
        </button>

        {branchOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setBranchOpen(false)} />
            <div className="absolute left-3 right-3 z-20 mt-1 overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
              <div className="border-b border-line px-3 py-2 text-[10px] font-bold tracking-wide text-ink3 uppercase">
                Şube değiştir
              </div>
              <div className="p-1.5">
                {branches.map((b) => {
                  const sel = b.id === activeBranchId;
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        if (!sel) onSwitchBranch(b.id);
                        setBranchOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition",
                        sel ? "bg-brand-soft" : "hover:bg-surface2",
                      )}
                    >
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-[11px] font-bold text-brand">
                        {branchInitials(b.name)}
                      </div>
                      <div className="min-w-0 flex-1 leading-tight">
                        <div className="truncate text-[13px] font-bold text-ink">{b.name}</div>
                        <div className="truncate text-[11px] text-ink3">{b.city}</div>
                      </div>
                      {sel && <Check className="h-4 w-4 shrink-0 text-brand" strokeWidth={2.6} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigasyon — kullanıcı yetkisine göre filtreli */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {/* Operasyon — düz grup */}
        {operationItems.length > 0 && (
          <div className="mb-3">
            <div className="px-2 pt-2 pb-1.5 text-[11px] font-bold tracking-wide text-ink3 uppercase">
              {OPERATION.label}
            </div>
            <div className="flex flex-col gap-1">
              {operationItems.map((it) => renderItem(it, false))}
            </div>
          </div>
        )}

        {/* Ayarlar — açılır başlık */}
        {settingsItems.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setSettingsOpenUser((s) => !s)}
              aria-expanded={settingsOpen}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                activeInSettings && !settingsOpenUser
                  ? "text-ink"
                  : "text-ink2 hover:bg-surface2 hover:text-ink",
              )}
            >
              <Settings
                className="h-[18px] w-[18px] shrink-0 text-ink3 transition group-hover:text-ink2"
                strokeWidth={2.2}
              />
              <span className="flex-1 text-left">Ayarlar</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-ink3 transition-transform",
                  settingsOpen && "rotate-180",
                )}
                strokeWidth={2.4}
              />
            </button>
            {settingsOpen && (
              <div className="mt-1 ml-4 flex flex-col gap-1 border-l border-line2 pl-1">
                {settingsItems.map((it) => renderItem(it, true))}
              </div>
            )}
          </div>
        )}

        <button className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink2 transition hover:bg-surface2 hover:text-ink">
          <HelpCircle className="h-[18px] w-[18px] text-ink3 group-hover:text-ink2" strokeWidth={2.2} />
          Yardım & Destek
        </button>
      </nav>

      {/* Aktif kullanıcı + Çıkış */}
      <div className="border-t border-line px-3 py-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-brand text-xs font-bold text-white">
            {user.initials}
            <span
              className="absolute -right-0 -bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white"
              style={{ background: SHIFT[user.state].dot }}
            />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-bold text-ink">{user.name}</div>
            <div className="flex items-center gap-1 text-[11px] text-ink3">
              <ShieldCheck className="h-3 w-3 shrink-0 text-ink3" strokeWidth={2.2} />
              <span className="truncate">{lvl.label}</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            aria-label="Çıkış"
            title="Çıkış"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line2 bg-white text-ink3 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </aside>
  );
}
