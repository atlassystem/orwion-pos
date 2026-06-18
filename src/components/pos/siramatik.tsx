"use client";

import { useState } from "react";
import {
  TicketCheck,
  Monitor,
  ChefHat,
  Plus,
  Minus,
  Printer,
  Check,
  Megaphone,
  DoorOpen,
  Clock,
  ShoppingBag,
  ConciergeBell,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SNACK_MENU,
  snackById,
  STATION_META,
  type Station,
  type SnackState,
} from "@/lib/pos-modules";
import { Tab, TopBar } from "./ui";
import { usePerms } from "./perms";

interface Line {
  id: string;
  qty: number;
}
interface Ticket {
  no: number;
  room: string;
  items: Line[];
  state: SnackState;
  min: number;
}

const SEED: Ticket[] = [
  { no: 146, room: "412", items: [{ id: "burger", qty: 1 }, { id: "fries", qty: 1 }, { id: "cola", qty: 2 }], state: "hazir", min: 6 },
  { no: 147, room: "228", items: [{ id: "tost", qty: 2 }, { id: "cay", qty: 2 }, { id: "icecream", qty: 1 }], state: "hazirlaniyor", min: 3 },
];

const stationOf = (id: string): Station => snackById[id]?.station ?? "mutfak";
const splitByStation = (items: Line[]) => ({
  mutfak: items.filter((i) => stationOf(i.id) === "mutfak"),
  bar: items.filter((i) => stationOf(i.id) === "bar"),
});

export function Siramatik() {
  const [tab, setTab] = useState<"kiosk" | "kuyruk" | "ekran">("kiosk");
  const [tickets, setTickets] = useState<Ticket[]>(SEED);
  const [nextNo, setNextNo] = useState(148);

  const createTicket = (items: Line[], room: string) => {
    const no = nextNo;
    setTickets((ts) => [...ts, { no, room, items, state: "hazirlaniyor", min: 0 }]);
    setNextNo((n) => n + 1);
    return no;
  };
  const markReady = (no: number) =>
    setTickets((ts) => ts.map((t) => (t.no === no ? { ...t, state: "hazir" } : t)));
  const deliver = (no: number) =>
    setTickets((ts) => ts.map((t) => (t.no === no ? { ...t, state: "teslim" } : t)));

  const active = tickets.filter((t) => t.state === "hazirlaniyor");
  const ready = tickets.filter((t) => t.state === "hazir");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar
        title="Sıramatik — Snack Bar"
        icon={TicketCheck}
        sub="Her şey dahil · kiosk siparişi, sıra numarası ve çağrı ekranı"
        right={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand">
            ✦ Her Şey Dahil
          </span>
        }
      />

      <div className="mb-4 flex items-center gap-2 px-7">
        <Tab on={tab === "kiosk"} onClick={() => setTab("kiosk")}>
          <span className="inline-flex items-center gap-1.5">
            <ShoppingBag className="h-4 w-4" strokeWidth={2.1} />
            Kiosk
          </span>
        </Tab>
        <Tab on={tab === "kuyruk"} onClick={() => setTab("kuyruk")}>
          <span className="inline-flex items-center gap-1.5">
            <ChefHat className="h-4 w-4" strokeWidth={2.1} />
            Hazırlık Kuyruğu
            {active.length > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                {active.length}
              </span>
            )}
          </span>
        </Tab>
        <Tab on={tab === "ekran"} onClick={() => setTab("ekran")}>
          <span className="inline-flex items-center gap-1.5">
            <Monitor className="h-4 w-4" strokeWidth={2.1} />
            Çağrı Ekranı
            {ready.length > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                {ready.length}
              </span>
            )}
          </span>
        </Tab>
      </div>

      {tab === "kiosk" && <Kiosk onCreate={createTicket} />}
      {tab === "kuyruk" && <Kuyruk active={active} onReady={markReady} />}
      {tab === "ekran" && <Ekran ready={ready} active={active} onDeliver={deliver} />}
    </div>
  );
}

/* ============================================================
   Kiosk — sipariş girişi (ödeme yok), sıra no + fiş önizleme
   ============================================================ */
function Kiosk({ onCreate }: { onCreate: (items: Line[], room: string) => number }) {
  const { canEdit } = usePerms();
  const [filter, setFilter] = useState<"hepsi" | Station>("hepsi");
  const [cart, setCart] = useState<Line[]>([]);
  const [room, setRoom] = useState("");
  const [printed, setPrinted] = useState<Ticket | null>(null);

  const list = SNACK_MENU.filter((s) => (filter === "hepsi" ? true : s.station === filter));
  const count = cart.reduce((a, i) => a + i.qty, 0);

  const add = (id: string) =>
    setCart((c) => {
      const ex = c.find((i) => i.id === id);
      return ex ? c.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i)) : [...c, { id, qty: 1 }];
    });
  const dec = (id: string) =>
    setCart((c) =>
      c.flatMap((i) => (i.id === id ? (i.qty <= 1 ? [] : [{ ...i, qty: i.qty - 1 }]) : [i])),
    );

  const submit = () => {
    if (!cart.length) return;
    const no = onCreate(cart, room || "—");
    setPrinted({ no, room: room || "—", items: cart, state: "hazirlaniyor", min: 0 });
    setCart([]);
    setRoom("");
  };

  return (
    <div className="relative grid min-h-0 flex-1 grid-cols-[1fr_360px] gap-4 overflow-hidden px-7 pb-7">
      {/* SOL: menü */}
      <div className="flex min-h-0 flex-col">
        <div className="mb-3 flex items-center gap-2">
          {(["hepsi", "mutfak", "bar"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-xl px-3.5 py-2 text-sm font-semibold ring-1 transition",
                filter === f
                  ? "bg-brand text-white ring-brand/0 shadow-sm shadow-brand/30"
                  : "bg-white text-ink2 ring-line2 hover:bg-surface2 hover:text-ink",
              )}
            >
              {f === "hepsi" ? "Tümü" : `${STATION_META[f].emoji} ${STATION_META[f].label}`}
            </button>
          ))}
        </div>
        <div className="scroll-light grid min-h-0 flex-1 grid-cols-3 content-start gap-3 overflow-y-auto pr-1 sm:grid-cols-4 lg:grid-cols-5">
          {list.map((s) => (
            <button
              key={s.id}
              onClick={() => add(s.id)}
              className="lift flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-white py-4 transition hover:border-brand/40 hover:bg-brand-soft/40"
            >
              <span className="text-3xl">{s.emoji}</span>
              <span className="px-1 text-center text-[12px] leading-tight font-bold text-ink">
                {s.name}
              </span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                  STATION_META[s.station].chip,
                )}
              >
                {STATION_META[s.station].label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* SAĞ: sipariş */}
      <div className="flex min-h-0 flex-col overflow-hidden rounded-[1.25rem] border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <span className="flex items-center gap-2 font-display font-extrabold text-ink">
            <ShoppingBag className="h-4 w-4 text-ink3" strokeWidth={2.2} />
            Sipariş
          </span>
          <span className="text-[11px] font-semibold text-ink3">{count} ürün</span>
        </div>

        {/* Oda no */}
        <div className="px-5 pt-3">
          <label className="flex items-center gap-2.5 rounded-xl border border-line2 bg-surface2 px-3.5 py-2.5 transition focus-within:border-brand/60 focus-within:bg-white">
            <DoorOpen className="h-4.5 w-4.5 shrink-0 text-ink3" strokeWidth={2} />
            <input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Oda no (opsiyonel)"
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink3 outline-none"
            />
          </label>
        </div>

        <div className="scroll-light flex-1 overflow-y-auto px-3 py-3">
          {cart.length === 0 ? (
            <div className="grid h-full place-items-center px-6 text-center text-sm text-ink3">
              <div>
                <ConciergeBell className="mx-auto mb-2 h-8 w-8 text-ink3/60" strokeWidth={1.6} />
                Soldaki ürünlere dokunarak
                <br />
                sipariş oluşturun
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((i) => {
                const s = snackById[i.id];
                return (
                  <div key={i.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface2 p-2">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-lg ring-1 ring-line">
                      {s.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-ink">{s.name}</div>
                      <div className="text-[10px] font-semibold text-ink3">
                        {STATION_META[s.station].label}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => dec(i.id)} className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-white text-ink2 transition hover:bg-rose-50 hover:text-rose-600">
                        <Minus className="h-3.5 w-3.5" strokeWidth={2.6} />
                      </button>
                      <span className="tnum w-5 text-center font-bold text-ink">{i.qty}</span>
                      <button onClick={() => add(i.id)} className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-white text-ink2 transition hover:bg-emerald-50 hover:text-emerald-600">
                        <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-line px-5 py-4">
          <button
            onClick={submit}
            disabled={!cart.length || !canEdit}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-bold text-white shadow-sm shadow-brand/30 transition hover:bg-brand2 disabled:opacity-40 disabled:shadow-none"
          >
            <Printer className="h-4 w-4" strokeWidth={2.3} />
            Sıra Al & Fiş Yazdır
          </button>
          <p className="mt-2 text-center text-[11px] text-ink3">
            Fiş mutfağa ve bara düşer · misafire sıra numarası verilir
          </p>
        </div>
      </div>

      {/* Fiş / sıra no önizleme */}
      {printed && <PrintPreview ticket={printed} onClose={() => setPrinted(null)} />}
    </div>
  );
}

function PrintPreview({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const grp = splitByStation(ticket.items);
  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-ink/40 p-6 backdrop-blur-sm">
      <div className="pop w-full max-w-sm overflow-hidden rounded-[1.25rem] bg-white shadow-2xl">
        {/* Sıra no başlık */}
        <div className="bg-gradient-to-br from-brand to-brand2 px-6 py-6 text-center text-white">
          <div className="text-[11px] font-bold tracking-widest uppercase opacity-80">
            Sıra Numaranız
          </div>
          <div className="font-display text-6xl font-extrabold tnum leading-none">
            {ticket.no}
          </div>
          <div className="mt-1 text-[12px] font-semibold opacity-90">
            Oda {ticket.room} · sıranız ekranda yanınca alın
          </div>
        </div>
        {/* Fiş içeriği */}
        <div className="space-y-3 px-6 py-5">
          <StationLines title="🍳 Mutfak" lines={grp.mutfak} />
          <StationLines title="🍹 Bar" lines={grp.bar} />
          <div className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2 text-[12px] font-bold text-emerald-700">
            <Printer className="h-3.5 w-3.5" strokeWidth={2.4} />
            Fiş mutfağa ve bara gönderildi
          </div>
        </div>
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-bold text-white transition hover:opacity-90"
          >
            Misafire Verildi · Yeni Sipariş
            <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}

function StationLines({ title, lines }: { title: string; lines: Line[] }) {
  if (!lines.length) return null;
  return (
    <div>
      <div className="mb-1 text-[11px] font-bold tracking-wide text-ink3 uppercase">{title}</div>
      <div className="space-y-1">
        {lines.map((i) => (
          <div key={i.id} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-ink">
              <span className="text-base">{snackById[i.id].emoji}</span>
              {snackById[i.id].name}
            </span>
            <span className="tnum font-bold text-ink2">×{i.qty}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Hazırlık Kuyruğu — fişler mutfak/bar ayrımıyla, "Hazır" işaretle
   ============================================================ */
function Kuyruk({ active, onReady }: { active: Ticket[]; onReady: (no: number) => void }) {
  const { canEdit } = usePerms();
  return (
    <div className="scroll-light grid grid-cols-1 content-start gap-4 overflow-y-auto px-7 pb-7 md:grid-cols-2 xl:grid-cols-3">
      {active.map((t) => {
        const grp = splitByStation(t.items);
        return (
          <div key={t.no} className="pos-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-white">
                  <span className="font-display tnum text-lg font-extrabold">{t.no}</span>
                </span>
                <div className="leading-tight">
                  <div className="text-sm font-bold text-ink">Oda {t.room}</div>
                  <div className="tnum flex items-center gap-1 text-[11px] text-ink3">
                    <Clock className="h-3 w-3" strokeWidth={2.4} />
                    {t.min} dk
                  </div>
                </div>
              </div>
              <button
                onClick={() => onReady(t.no)}
                disabled={!canEdit}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2.5 text-xs font-bold text-white shadow-sm shadow-brand/30 transition hover:bg-brand2 disabled:opacity-40 disabled:shadow-none"
              >
                <Check className="h-4 w-4" strokeWidth={2.6} />
                Hazır
              </button>
            </div>
            <div className="grid grid-cols-2 divide-x divide-line">
              <KuyrukStation title="🍳 Mutfak" lines={grp.mutfak} />
              <KuyrukStation title="🍹 Bar" lines={grp.bar} />
            </div>
          </div>
        );
      })}
      {active.length === 0 && (
        <div className="pos-card col-span-full grid place-items-center py-12 text-center text-sm text-ink3">
          <div>
            <ChefHat className="mx-auto mb-2 h-8 w-8 text-ink3/60" strokeWidth={1.6} />
            Hazırlanacak sipariş yok. Kiosk&apos;tan sipariş alın.
          </div>
        </div>
      )}
    </div>
  );
}

function KuyrukStation({ title, lines }: { title: string; lines: Line[] }) {
  return (
    <div className="px-4 py-3">
      <div className="mb-1.5 text-[11px] font-bold tracking-wide text-ink3 uppercase">{title}</div>
      {lines.length === 0 ? (
        <div className="text-[12px] text-ink3">—</div>
      ) : (
        <div className="space-y-1.5">
          {lines.map((i) => (
            <div key={i.id} className="flex items-center gap-2 text-sm">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-brand text-xs font-extrabold text-white tnum">
                {i.qty}
              </span>
              <span className="text-ink">
                {snackById[i.id].emoji} {snackById[i.id].name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Çağrı Ekranı — misafire dönük; sırası gelince numara yanar
   ============================================================ */
function Ekran({
  ready,
  active,
  onDeliver,
}: {
  ready: Ticket[];
  active: Ticket[];
  onDeliver: (no: number) => void;
}) {
  const { canEdit } = usePerms();
  return (
    <div className="min-h-0 flex-1 px-7 pb-7">
      <div className="flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-ink text-white shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <span className="flex items-center gap-2.5 font-display text-lg font-extrabold tracking-wide uppercase">
            <Megaphone className="h-5 w-5 text-emerald-400" strokeWidth={2.2} />
            Sıranız Hazır
          </span>
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-white/50">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            canlı · teslim için numaraya dokun
          </span>
        </div>

        <div className="scroll-light flex-1 overflow-y-auto p-6">
          {ready.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-white/40">
              <div>
                <Monitor className="mx-auto mb-3 h-10 w-10 text-white/25" strokeWidth={1.4} />
                Hazır sipariş bekleniyor…
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {ready.map((t) => (
                <button
                  key={t.no}
                  onClick={() => onDeliver(t.no)}
                  disabled={!canEdit}
                  className="pop group rounded-3xl border-2 border-emerald-400/40 bg-emerald-400/10 p-5 text-center transition hover:bg-emerald-400/20 disabled:cursor-default"
                >
                  <div className="font-display text-6xl font-extrabold tnum leading-none text-emerald-300 blink">
                    {t.no}
                  </div>
                  <div className="mt-2 text-[12px] font-semibold text-white/60">
                    Oda {t.room}
                  </div>
                  <div className="mt-1 text-[10px] font-bold text-emerald-300/0 transition group-hover:text-emerald-300">
                    teslim et
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 px-6 py-4">
          <div className="mb-2 text-[11px] font-bold tracking-wide text-white/40 uppercase">
            Hazırlanıyor
          </div>
          <div className="flex flex-wrap gap-2">
            {active.length === 0 && <span className="text-[13px] text-white/40">—</span>}
            {active.map((t) => (
              <span
                key={t.no}
                className="tnum rounded-xl bg-white/5 px-3 py-1.5 text-lg font-bold text-white/70"
              >
                {t.no}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
