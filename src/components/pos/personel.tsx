"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import {
  Users,
  UserPlus,
  UserCheck,
  Clock,
  Star,
  Coffee,
  ShieldCheck,
  SquarePen,
  KeyRound,
  Trash2,
  Eye,
  EyeOff,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TL } from "@/lib/pos-data";
import {
  SHIFT,
  LEVELS,
  MODULES,
  ALL_MODULES,
  type Staff,
  type AccessLevel,
  type ModuleId,
} from "@/lib/pos-modules";
import { setStaffCredentials } from "@/lib/pos-api";
import { PrimaryButton, Stat, TopBar } from "./ui";

export function Personel({
  staff,
  setStaff,
  onDelete,
  canManage,
}: {
  staff: Staff[];
  setStaff: Dispatch<SetStateAction<Staff[]>>;
  onDelete: (id: string) => void;
  canManage: boolean;
}) {
  // null = kapalı, "new" = ekleme, Staff = düzenleme
  const [editing, setEditing] = useState<Staff | "new" | null>(null);
  // Kimlik (kullanıcı adı + şifre) belirleme modalı için seçili personel.
  const [credsFor, setCredsFor] = useState<Staff | null>(null);

  const aktif = staff.filter((s) => s.state !== "cikis");
  const vardiyada = staff.filter((s) => s.state === "vardiyada");
  const toplamSaat = staff.reduce((s, u) => s + u.hoursToday, 0);
  const enIyi = [...staff].sort((a, b) => b.salesToday - a.salesToday)[0];

  const upsert = (s: Staff) =>
    setStaff((prev) =>
      prev.some((x) => x.id === s.id) ? prev.map((x) => (x.id === s.id ? s : x)) : [...prev, s],
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        title="Personel & Yetkiler"
        icon={Users}
        sub={aktif.length + " aktif personel · " + vardiyada.length + " vardiyada"}
        right={
          <PrimaryButton icon={UserPlus} onClick={() => canManage && setEditing("new")}>
            Personel Ekle
          </PrimaryButton>
        }
      />

      <div className="mb-4 grid grid-cols-4 gap-4 px-7">
        <Stat icon={UserCheck} label="Vardiyada" value={vardiyada.length + " kişi"} tone="green" />
        <Stat icon={Clock} label="Bugün Toplam Saat" value={toplamSaat + " sa"} tone="sky" />
        <Stat
          icon={Star}
          label="En İyi Satış"
          value={enIyi?.initials ?? "—"}
          hint={enIyi ? enIyi.name + " · " + TL(enIyi.salesToday) : ""}
          tone="orange"
        />
        <Stat icon={Users} label="Toplam Kadro" value={staff.length + " kişi"} tone="violet" />
      </div>

      <div className="scroll-light overflow-y-auto px-7 pb-7">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {staff.map((u) => (
            <StaffCard
              key={u.id}
              u={u}
              canManage={canManage}
              onEdit={() => setEditing(u)}
              onCreds={() => setCredsFor(u)}
            />
          ))}
        </div>
      </div>

      {editing && (
        <StaffModal
          initial={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSave={(s) => {
            upsert(s);
            setEditing(null);
          }}
          onDelete={
            editing !== "new"
              ? () => {
                  onDelete(editing.id);
                  setEditing(null);
                }
              : undefined
          }
        />
      )}

      {credsFor && (
        <CredsModal
          staff={credsFor}
          onClose={() => setCredsFor(null)}
          onSaved={(username) => {
            // Görüntüleme için yerel kullanıcı adını güncelle (hash istemcide tutulmaz).
            upsert({ ...credsFor, username });
            setCredsFor(null);
          }}
        />
      )}
    </div>
  );
}

function StaffCard({
  u,
  canManage,
  onEdit,
  onCreds,
}: {
  u: Staff;
  canManage: boolean;
  onEdit: () => void;
  onCreds: () => void;
}) {
  const sh = SHIFT[u.state];
  const lvl = LEVELS[u.level];
  const off = u.state === "cikis";
  const scopeLabel = lvl.scoped
    ? u.access.map((id) => MODULES.find((m) => m.id === id)?.label).filter(Boolean).join(" · ")
    : "Tüm modüller";

  return (
    <div className={cn("pos-card p-4", off && "opacity-70")}>
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-orange-400 to-brand text-sm font-bold text-white">
            {u.initials}
          </div>
          <span
            className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white"
            style={{ background: sh.dot }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-ink">{u.name}</div>
          <div className="truncate text-[11px] font-semibold text-ink3">{u.role}</div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
            sh.chip,
          )}
        >
          {u.state === "molada" && <Coffee className="h-3 w-3" strokeWidth={2.4} />}
          {sh.label}
        </span>
      </div>

      {/* Yetki */}
      <div className="mt-3 rounded-xl bg-surface2 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-ink2">
            <ShieldCheck className="h-3.5 w-3.5 text-ink3" strokeWidth={2.2} />
            Yetki
          </span>
          <div className="flex items-center gap-1.5">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", lvl.chip)}>
              {lvl.label}
            </span>
            {canManage && (
              <>
                <button
                  onClick={onCreds}
                  aria-label="Kullanıcı adı / şifre"
                  title="Kullanıcı adı / şifre belirle"
                  className="grid h-6 w-6 place-items-center rounded-lg text-ink3 transition hover:bg-white hover:text-brand"
                >
                  <KeyRound className="h-3.5 w-3.5" strokeWidth={2.2} />
                </button>
                <button
                  onClick={onEdit}
                  aria-label="Düzenle"
                  className="grid h-6 w-6 place-items-center rounded-lg text-ink3 transition hover:bg-white hover:text-brand"
                >
                  <SquarePen className="h-3.5 w-3.5" strokeWidth={2.2} />
                </button>
              </>
            )}
          </div>
        </div>
        <div className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-ink3">{scopeLabel}</div>
        <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold">
          <KeyRound className="h-3 w-3 shrink-0 text-ink3" strokeWidth={2.2} />
          {u.username ? (
            <span className="text-ink2">
              Giriş: <span className="font-bold text-ink">{u.username}</span>
            </span>
          ) : (
            <span className="text-ink3">Giriş tanımsız</span>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
        <div>
          <div className="font-display tnum text-base font-extrabold text-ink">
            {off ? "—" : u.clockIn}
          </div>
          <div className="text-[10px] font-semibold text-ink3">Giriş</div>
        </div>
        <div>
          <div className="font-display tnum text-base font-extrabold text-ink">
            {u.hoursToday > 0 ? u.hoursToday + " sa" : "—"}
          </div>
          <div className="text-[10px] font-semibold text-ink3">Bugün</div>
        </div>
        <div>
          <div className="font-display tnum inline-flex items-center justify-center gap-0.5 text-base font-extrabold text-amber-600">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {u.rating}
          </div>
          <div className="text-[10px] font-semibold text-ink3">Puan</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Personel Ekle — çalışır form (isim, rol, yetki seviyesi, erişim)
   ============================================================ */
function StaffModal({
  initial,
  onClose,
  onSave,
  onDelete,
}: {
  initial?: Staff;
  onClose: () => void;
  onSave: (s: Staff) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState(initial?.role ?? "Garson");
  const [level, setLevel] = useState<AccessLevel>(initial?.level ?? "personel");
  const [access, setAccess] = useState<ModuleId[]>(initial?.access ?? ["siramatik"]);
  const [confirmDel, setConfirmDel] = useState(false);

  const scoped = LEVELS[level].scoped;
  const valid = name.trim().length > 1 && (!scoped || access.length > 0);

  const toggle = (id: ModuleId) =>
    setAccess((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  const save = () => {
    if (!valid) return;
    const initials =
      name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toLocaleUpperCase("tr-TR") ?? "")
        .join("") || "??";
    onSave({
      id: initial?.id ?? "u" + Date.now(),
      name: name.trim(),
      role: role.trim() || "Personel",
      initials,
      state: initial?.state ?? "vardiyada",
      clockIn: initial?.clockIn ?? "—",
      hoursToday: initial?.hoursToday ?? 0,
      salesToday: initial?.salesToday ?? 0,
      rating: initial?.rating ?? 0,
      level,
      access: scoped ? access : ALL_MODULES,
    });
  };

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="pop flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="flex items-center gap-2 font-display text-lg font-extrabold text-ink">
            <UserPlus className="h-5 w-5 text-brand" strokeWidth={2.2} />
            {initial ? "Personel Düzenle" : "Personel Ekle"}
          </h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-ink3 transition hover:bg-surface2 hover:text-ink">
            <X className="h-4.5 w-4.5" strokeWidth={2.2} />
          </button>
        </div>

        <div className="scroll-light flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ad Soyad">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn. Ayşe Kaya"
                className="w-full bg-transparent text-sm text-ink placeholder:text-ink3 outline-none"
              />
            </Field>
            <Field label="Görev / Ünvan">
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Örn. Garson"
                className="w-full bg-transparent text-sm text-ink placeholder:text-ink3 outline-none"
              />
            </Field>
          </div>

          {/* Yetki seviyesi */}
          <div>
            <div className="mb-1.5 text-[12px] font-semibold text-ink2">Yetki Seviyesi</div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(LEVELS) as AccessLevel[]).map((lv) => {
                const meta = LEVELS[lv];
                const on = level === lv;
                return (
                  <button
                    key={lv}
                    onClick={() => setLevel(lv)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-left transition",
                      on ? "border-brand bg-brand-soft" : "border-line2 bg-white hover:bg-surface2",
                    )}
                  >
                    <div className={cn("text-sm font-bold", on ? "text-brand" : "text-ink")}>
                      {meta.label}
                    </div>
                    <div className="mt-0.5 text-[10.5px] leading-tight text-ink3">{meta.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Erişim alanları */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-ink2">Erişebileceği Alanlar</span>
              {!scoped && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  Tüm modüller
                </span>
              )}
            </div>
            {scoped ? (
              <div className="grid grid-cols-2 gap-2">
                {MODULES.map((m) => {
                  const on = access.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggle(m.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition",
                        on ? "border-brand bg-brand-soft text-brand" : "border-line2 bg-white text-ink2 hover:bg-surface2",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-4.5 w-4.5 shrink-0 place-items-center rounded-[5px] border",
                          on ? "border-brand bg-brand text-white" : "border-line2 bg-white",
                        )}
                      >
                        {on && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      {m.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl bg-surface2 px-3 py-2.5 text-[12px] text-ink3">
                {LEVELS[level].label} seviyesi tüm modülleri görür
                {level === "yonetici" ? " (salt-okunur)." : "."}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-line px-6 py-4">
          {/* Sol: Sil (yalnızca düzenlemede, onaylı) */}
          <div>
            {onDelete &&
              (confirmDel ? (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-rose-600">Emin misiniz?</span>
                  <button
                    onClick={onDelete}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-700"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2.4} />
                    Evet, sil
                  </button>
                  <button
                    onClick={() => setConfirmDel(false)}
                    className="rounded-xl border border-line2 bg-white px-3 py-2 text-xs font-bold text-ink2 transition hover:bg-surface2"
                  >
                    Vazgeç
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDel(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line2 bg-white px-3 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                  Sil
                </button>
              ))}
          </div>

          {/* Sağ: Vazgeç / Kaydet */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-line2 bg-white px-4 py-2.5 text-sm font-bold text-ink2 transition hover:bg-surface2 hover:text-ink"
            >
              Vazgeç
            </button>
            <button
              onClick={save}
              disabled={!valid}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/30 transition hover:bg-brand2 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <Check className="h-4 w-4" strokeWidth={2.6} />
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Kimlik (kullanıcı adı + şifre) belirleme — admin. Şifre bcrypt (sunucuda).
   ============================================================ */
function CredsModal({
  staff,
  onClose,
  onSaved,
}: {
  staff: Staff;
  onClose: () => void;
  onSaved: (username: string) => void;
}) {
  const [username, setUsername] = useState(staff.username ?? "");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const valid = username.trim().length >= 2 && password.length >= 4;

  const save = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setErr("");
    const r = await setStaffCredentials(staff.id, username.trim(), password);
    setBusy(false);
    if (r.ok) {
      onSaved(username.trim());
    } else if (r.error === "username_taken") {
      setErr("Bu kullanıcı adı başka personelde kullanılıyor.");
    } else if (r.error === "weak_password") {
      setErr("Şifre en az 4 karakter olmalı.");
    } else {
      setErr("Kaydedilemedi. Tekrar deneyin.");
    }
  };

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="pop flex w-full max-w-md flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h3 className="flex items-center gap-2 font-display text-lg font-extrabold text-ink">
            <KeyRound className="h-5 w-5 text-brand" strokeWidth={2.2} />
            Giriş Bilgileri
          </h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink3 transition hover:bg-surface2 hover:text-ink"
          >
            <X className="h-4.5 w-4.5" strokeWidth={2.2} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="text-[13px] text-ink2">
            <span className="font-bold text-ink">{staff.name}</span> için kullanıcı adı ve şifre belirle.
          </div>

          <Field label="Kullanıcı Adı">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Örn. ayse"
              autoComplete="off"
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink3 outline-none"
            />
          </Field>

          <Field label="Yeni Şifre">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 4 karakter"
              autoComplete="new-password"
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink3 outline-none"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="text-ink3 transition hover:text-ink2"
              aria-label="Şifreyi göster/gizle"
            >
              {show ? <EyeOff className="h-4.5 w-4.5" strokeWidth={2} /> : <Eye className="h-4.5 w-4.5" strokeWidth={2} />}
            </button>
          </Field>

          <p className="rounded-xl bg-surface2 px-3 py-2.5 text-[11px] leading-snug text-ink3">
            Şifre güvenli biçimde (bcrypt) saklanır, hiçbir yerde düz metin gösterilmez.
          </p>

          {err && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] font-semibold text-rose-600">
              {err}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-line2 bg-white px-4 py-2.5 text-sm font-bold text-ink2 transition hover:bg-surface2 hover:text-ink"
          >
            Vazgeç
          </button>
          <button
            onClick={save}
            disabled={!valid || busy}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/30 transition hover:bg-brand2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check className="h-4 w-4" strokeWidth={2.6} />
            {busy ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold text-ink2">{label}</span>
      <div className="flex items-center gap-2.5 rounded-xl border border-line2 bg-surface2 px-3.5 py-2.5 transition focus-within:border-brand/60 focus-within:bg-white">
        {children}
      </div>
    </label>
  );
}
