"use client";

import { useEffect, useState } from "react";
import { seedTables, type Table } from "@/lib/pos-data";
import {
  STAFF,
  userModules,
  userCanEdit,
  type Staff,
  type ModuleId,
} from "@/lib/pos-modules";
import { Sidebar, type View } from "./sidebar";
import { PermsProvider, ReadOnlyBanner } from "./perms";
import { Masalar } from "./masalar";
import { Adisyon } from "./adisyon";
import { Garson } from "./garson";
import { Mutfak } from "./mutfak";
import { Siramatik } from "./siramatik";
import { Menu } from "./menu";
import { Rapor } from "./rapor";
import { Stok } from "./stok";
import { Personel } from "./personel";
import { Subeler } from "./subeler";
import { Ayarlar } from "./ayarlar";
import { Login } from "./login";

export function PosApp() {
  const [authed, setAuthed] = useState(false);
  const [view, setView] = useState<View>("masalar");
  const [tables, setTables] = useState<Table[]>(seedTables);
  const [activeHall, setActiveHall] = useState("ic");
  const [openNo, setOpenNo] = useState<string | null>(null);
  // SSR-güvenli dakika saati: sunucuda 0, mount sonrası ilerler.
  const [clockMin, setClockMin] = useState(0);

  // Personel & aktif kullanıcı (yetkilendirme)
  const [staff, setStaff] = useState<Staff[]>(STAFF);
  const [currentUserId, setCurrentUserId] = useState("u5"); // Can Aydın · Admin
  const currentUser = staff.find((s) => s.id === currentUserId) ?? staff[0];
  const modules = userModules(currentUser);
  const canEdit = userCanEdit(currentUser);

  useEffect(() => {
    const i = setInterval(() => setClockMin((c) => c + 0.5), 30000);
    return () => clearInterval(i);
  }, []);

  // Kullanıcı değişince, erişimi olmayan bir modüldeyse ilk izinli modüle düş.
  useEffect(() => {
    if (!modules.includes(view as ModuleId)) {
      setView(modules[0] as View);
      setOpenNo(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const updateTable = (no: string, fn: (t: Table) => Table) =>
    setTables((ts) => ts.map((t) => (t.no === no ? fn({ ...t }) : t)));

  const addItem = (no: string, pid: string) =>
    updateTable(no, (t) => {
      if (t.status === "bos" || t.status === "rezerve") {
        t.status = "dolu";
        t.startedAt = t.startedAt ?? clockMin;
        t.waiter = t.waiter ?? "Ahmet";
      }
      const ex = t.items.find((i) => i.pid === pid);
      if (ex) t.items = t.items.map((i) => (i.pid === pid ? { ...i, qty: i.qty + 1 } : i));
      else t.items = [...t.items, { pid, qty: 1 }];
      return t;
    });

  const decItem = (no: string, pid: string) =>
    updateTable(no, (t) => {
      const ex = t.items.find((i) => i.pid === pid);
      if (ex) {
        if (ex.qty <= 1) t.items = t.items.filter((i) => i.pid !== pid);
        else t.items = t.items.map((i) => (i.pid === pid ? { ...i, qty: i.qty - 1 } : i));
      }
      return t;
    });

  const askBill = (no: string) =>
    updateTable(no, (t) => {
      if (t.items.length) t.status = "hesap";
      return t;
    });

  const payTable = (no: string) => {
    updateTable(no, (t) => {
      t.status = "bos";
      t.items = [];
      t.startedAt = null;
      t.waiter = null;
      return t;
    });
    setOpenNo(null);
  };

  const goView = (v: View) => {
    setView(v);
    setOpenNo(null);
  };

  const openTableObj = tables.find((t) => t.no === openNo);
  // Masa Planı ve Garson Terminali, açık masada ortak Adisyon ekranını paylaşır.
  const inAdisyon = openTableObj && (view === "masalar" || view === "garson");

  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  return (
    <PermsProvider canEdit={canEdit}>
      <div className="pos-canvas flex h-screen w-screen overflow-hidden font-sans text-ink">
        <Sidebar
          view={view}
          setView={goView}
          user={currentUser}
          users={staff}
          onSwitchUser={setCurrentUserId}
          allowed={modules}
        />
        <main className="flex min-w-0 flex-1 flex-col">
          {!canEdit && <ReadOnlyBanner />}
          {inAdisyon && openTableObj && (
            <Adisyon
              t={openTableObj}
              onBack={() => setOpenNo(null)}
              addItem={addItem}
              decItem={decItem}
              askBill={askBill}
              payTable={payTable}
              clockMin={clockMin}
            />
          )}
          {!inAdisyon && view === "masalar" && (
            <Masalar
              tables={tables}
              activeHall={activeHall}
              setActiveHall={setActiveHall}
              onOpen={setOpenNo}
              clockMin={clockMin}
            />
          )}
          {!inAdisyon && view === "garson" && (
            <Garson tables={tables} onOpen={setOpenNo} clockMin={clockMin} />
          )}
          {view === "mutfak" && <Mutfak tables={tables} clockMin={clockMin} />}
          {view === "siramatik" && <Siramatik />}
          {view === "menu" && <Menu />}
          {view === "stok" && <Stok />}
          {view === "personel" && (
            <Personel
              staff={staff}
              setStaff={setStaff}
              canManage={currentUser.level === "admin"}
            />
          )}
          {view === "rapor" && <Rapor tables={tables} />}
          {view === "subeler" && <Subeler />}
          {view === "ayarlar" && <Ayarlar />}
        </main>
      </div>
    </PermsProvider>
  );
}
