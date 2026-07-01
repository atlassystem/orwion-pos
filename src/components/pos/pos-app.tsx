"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  seedTables,
  hydrateMenu,
  productInBranch,
  PRODUCTS,
  CATS,
  type Table,
  type Product,
  type Category,
} from "@/lib/pos-data";
import {
  STAFF,
  STOCK,
  BRANCHES,
  userModules,
  userCanEdit,
  type Staff,
  type StockItem,
  type RecipeLine,
  type ModuleId,
  type Branch,
} from "@/lib/pos-modules";
import type { SednaCostMap } from "@/lib/sedna";
import { OKC_AKTIF, buildOkcFis, sendToOkc } from "@/lib/okc";
import {
  fetchBootstrap,
  fetchTables,
  saveTable,
  payTableApi,
  saveRecipes,
  saveStaff,
  deleteStaff,
  saveStockQty,
  createProduct,
  updateProduct,
  deleteProduct,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchEurRate,
  meApi,
  logoutApi,
} from "@/lib/pos-api";
import type { CatDraft } from "./menu-yonetim";
import { Sidebar, type View } from "./sidebar";
import { PermsProvider, ReadOnlyBanner } from "./perms";
import { Masalar } from "./masalar";
import { Adisyon } from "./adisyon";
import { Garson } from "./garson";
import { Mutfak } from "./mutfak";
import { Siramatik } from "./siramatik";
import { Menu } from "./menu";
import { MenuYonetim } from "./menu-yonetim";
import { Rapor } from "./rapor";
import { Stok } from "./stok";
import { Personel } from "./personel";
import { Subeler } from "./subeler";
import { Ayarlar } from "./ayarlar";
import { Login } from "./login";

/** Kısa bildirim sesi (WebAudio — ek dosya yok). Tarayıcı sesi engellerse sessiz. */
function beep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.setValueAtTime(1175, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    o.start();
    o.stop(ctx.currentTime + 0.42);
    o.onended = () => ctx.close();
  } catch {
    /* ses çalınamadıysa sorun değil */
  }
}

export function PosApp() {
  // Gerçek auth: oturum çerezinden gelen kullanıcı. null = giriş yapılmamış.
  const [authUser, setAuthUser] = useState<Staff | null>(null);
  const [authChecked, setAuthChecked] = useState(false); // /me tamamlandı mı
  const [view, setView] = useState<View>("masalar");
  const [tables, setTables] = useState<Table[]>(seedTables);
  const [activeHall, setActiveHall] = useState("ic");
  const [openNo, setOpenNo] = useState<string | null>(null);

  // --- Canlı yenileme + QR sipariş bildirimi ---
  // Yeni sipariş gelen masa no'ları (rozet/vurgu için; masa açılınca temizlenir).
  const [alertTables, setAlertTables] = useState<Set<string>>(() => new Set());
  // Ekranda gösterilen bildirim balonları.
  const [notes, setNotes] = useState<{ id: number; no: string; summary?: string }[]>([]);
  // Son görülen masa → toplam adet imzası (artış = yeni sipariş tespiti).
  const sigRef = useRef<Map<string, number>>(new Map());
  const noteId = useRef(0);
  // Açık adisyonun no'su, yoklama kapanışında güncel okunsun diye ref.
  const openNoRef = useRef<string | null>(null);
  useEffect(() => {
    openNoRef.current = openNo;
  }, [openNo]);

  // Şubeler & aktif şube — operasyon (masalar/ödeme) aktif şubeye göre ayrı.
  const [branches, setBranches] = useState<Branch[]>(() => [...BRANCHES]);
  const [activeBranch, setActiveBranch] = useState(BRANCHES[0].id);
  // SSR-güvenli dakika saati: sunucuda 0, mount sonrası ilerler.
  const [clockMin, setClockMin] = useState(0);

  // TCMB EUR/TRY efektif satış kuru (günlük önbellekli). null = henüz/alınamadı.
  const [eurRate, setEurRate] = useState<number | null>(null);

  // Menü (ürünler & kategoriler) — DB kaynaklı; modül dizileri de hidrate edilir.
  const [products, setProducts] = useState<Product[]>(() => [...PRODUCTS]);
  const [cats, setCats] = useState<Category[]>(() => [...CATS]);

  // Stok tablosu + reçeteler (Sedna malzemeli, DB'den).
  const [stock, setStock] = useState<StockItem[]>(STOCK);
  const [recipes, setRecipesState] = useState<Record<string, RecipeLine[]>>({});
  // Reçetelerde geçen Sedna kodlarının güncel birim maliyeti (canlı maliyet).
  const [sednaCosts, setSednaCosts] = useState<SednaCostMap>({});

  // Personel listesi (admin yönetimi için); aktif kullanıcı ise authUser.
  const [staff, setStaffState] = useState<Staff[]>(STAFF);
  const currentUser = authUser;
  const modules = currentUser ? userModules(currentUser) : [];
  const canEdit = currentUser ? userCanEdit(currentUser) : false;

  // Açılışta oturumu kontrol et (/api/auth/me). Varsa kullanıcı + şubeyi al.
  useEffect(() => {
    let alive = true;
    meApi()
      .then((r) => {
        if (!alive) return;
        if (r) {
          setAuthUser(r.user);
          if (r.branch) setActiveBranch(r.branch);
        }
      })
      .finally(() => {
        if (alive) setAuthChecked(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Giriş yapıldıktan sonra (ve şube değişince) kalıcı veriyi DB'den çek
  // (gerekirse seed eder). Masalar AKTİF ŞUBEYE göre gelir; katalog ortaktır.
  // Hata olursa demo veriyle çalışmaya devam eder (uygulama çökmez).
  useEffect(() => {
    if (!authUser) return;
    let alive = true;
    fetchBootstrap(activeBranch)
      .then((d) => {
        if (!alive) return;
        // Aktif şubenin masaları (boş şubede de listeyi değiştir → karışmasın).
        const freshTables = d.tables ?? [];
        setTables(freshTables);
        // Bildirim taban imzası: ilk yüklemede mevcut siparişler "yeni" sayılmasın.
        const sig = new Map<string, number>();
        for (const t of freshTables) {
          sig.set(t.no, (t.items ?? []).reduce((s: number, i) => s + i.qty, 0));
        }
        sigRef.current = sig;
        setAlertTables(new Set());
        // Ürün/kategoriyi hem React state'ine hem de modül dizilerine (statik
        // import eden ekranlar için) yaz.
        if (d.products?.length || d.categories?.length) {
          hydrateMenu(d.products, d.categories);
          if (d.products?.length) setProducts(d.products);
          if (d.categories?.length) setCats(d.categories);
        }
        if (d.stock?.length) setStock(d.stock);
        if (d.recipes) setRecipesState(d.recipes);
        if (d.sednaCosts) setSednaCosts(d.sednaCosts);
        if (d.staff?.length) setStaffState(d.staff);
        if (d.branches?.length) setBranches(d.branches);
      })
      .catch((e) => console.warn("[pos] bootstrap başarısız, demo veriyle devam:", e));
    return () => {
      alive = false;
    };
  }, [authUser, activeBranch]);

  useEffect(() => {
    const i = setInterval(() => setClockMin((c) => c + 0.5), 30000);
    return () => clearInterval(i);
  }, []);

  // TCMB kurunu açılışta bir kez çek (sunucu günlük önbellekler).
  useEffect(() => {
    let alive = true;
    fetchEurRate().then((r) => {
      if (alive && r) setEurRate(r.eurTry);
    });
    return () => {
      alive = false;
    };
  }, []);

  // CANLI YENİLEME + QR SİPARİŞ BİLDİRİMİ: aktif şubenin masalarını her 7 sn'de
  // bir sessizce çeker; bir masanın toplam adedi arttıysa = yeni sipariş →
  // rozet + balon + ses. Açık adisyon (personel düzenliyor) yerelde kalır
  // (anlık kaydedildiği için sunucu zaten güncel; titreme olmasın diye ezilmez).
  useEffect(() => {
    if (!authUser) return;
    let alive = true;
    const tick = async () => {
      const fresh = await fetchTables(activeBranch);
      if (!alive || !fresh) return;
      const prevSig = sigRef.current;
      const nextSig = new Map<string, number>();
      const newOrders: string[] = [];
      for (const t of fresh) {
        const q = (t.items ?? []).reduce((s, i) => s + i.qty, 0);
        nextSig.set(t.no, q);
        const prev = prevSig.get(t.no);
        if (prev !== undefined && q > prev) newOrders.push(t.no);
      }
      sigRef.current = nextSig;
      const curOpen = openNoRef.current;
      // Masaları güncelle; açık adisyon yerelde kalsın.
      setTables((cur) =>
        fresh.map((t) =>
          t.no === curOpen ? cur.find((c) => c.no === t.no) ?? t : t,
        ),
      );
      // Açık masaya gelen sipariş zaten ekranda; onun için rozet/balon gösterme.
      const toAlert = newOrders.filter((no) => no !== curOpen);
      if (toAlert.length) {
        setAlertTables((s) => {
          const n = new Set(s);
          toAlert.forEach((x) => n.add(x));
          return n;
        });
        setNotes((ns) =>
          [...ns, ...toAlert.map((no) => ({ id: ++noteId.current, no }))].slice(-4),
        );
        beep();
      }
    };
    const i = setInterval(tick, 7000);
    return () => {
      alive = false;
      clearInterval(i);
    };
  }, [authUser, activeBranch]);

  // SSE: QR self-siparişini gecikmesiz ilet (7 sn polling'e ek anlık kanal).
  // Olay geldiğinde masaları tazeler, imzayı eşitler (polling çift bildirim
  // vermesin) ve masa no + sipariş özetiyle balon/rozet/ses gösterir.
  // SSE düşerse tarayıcı otomatik yeniden bağlanır; polling yedek kalır.
  useEffect(() => {
    if (!authUser) return;
    let alive = true;
    let es: EventSource | null = null;
    try {
      es = new EventSource(
        `/api/notifications/stream?branch=${encodeURIComponent(activeBranch)}`,
      );
    } catch {
      return; // EventSource yoksa polling zaten devrede
    }
    es.onmessage = async (e) => {
      if (!alive) return;
      let msg: { type?: string; no?: string; summary?: string };
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      if (msg.type !== "order" || !msg.no) return;
      const no = msg.no;
      // Masaları tazele; açık adisyon yerelde kalsın (polling'deki mantıkla aynı).
      const fresh = await fetchTables(activeBranch);
      const curOpen = openNoRef.current;
      if (fresh && alive) {
        const nextSig = new Map<string, number>();
        for (const t of fresh) {
          nextSig.set(t.no, (t.items ?? []).reduce((s, i) => s + i.qty, 0));
        }
        sigRef.current = nextSig; // polling çift bildirim vermesin
        setTables((cur) =>
          fresh.map((t) =>
            t.no === curOpen ? cur.find((c) => c.no === t.no) ?? t : t,
          ),
        );
      }
      // Açık masaya gelen sipariş zaten ekranda; balon/ses gösterme.
      if (no === curOpen) return;
      setAlertTables((s) => new Set(s).add(no));
      setNotes((ns) =>
        [...ns, { id: ++noteId.current, no, summary: msg.summary }].slice(-4),
      );
      beep();
    };
    es.onerror = () => {
      /* tarayıcı otomatik yeniden bağlanır; polling yedek kanal */
    };
    return () => {
      alive = false;
      es?.close();
    };
  }, [authUser, activeBranch]);

  // Kullanıcı değişince, erişimi olmayan bir modüldeyse ilk izinli modüle düş.
  useEffect(() => {
    if (currentUser && modules.length && !modules.includes(view as ModuleId)) {
      setView(modules[0] as View);
      setOpenNo(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id]);

  // Çocuk bileşenler bu setter'larla yazar; her değişiklik DB'ye kalıcı yazılır.
  const setRecipes: Dispatch<SetStateAction<Record<string, RecipeLine[]>>> = (action) =>
    setRecipesState((prev) => {
      const next =
        typeof action === "function"
          ? (action as (p: Record<string, RecipeLine[]>) => Record<string, RecipeLine[]>)(prev)
          : action;
      void saveRecipes(next);
      return next;
    });

  const setStaff: Dispatch<SetStateAction<Staff[]>> = (action) =>
    setStaffState((prev) => {
      const next =
        typeof action === "function" ? (action as (p: Staff[]) => Staff[])(prev) : action;
      void saveStaff(next);
      return next;
    });

  // Personel sil: belgeyi (kimlik dahil) sunucudan sil, listeden çıkar.
  const removeStaff = async (id: string) => {
    const ok = await deleteStaff(id);
    if (!ok) return;
    setStaffState((prev) => prev.filter((s) => s.id !== id));
  };

  // Stok girişi: yeni mutlak miktarı yaz + kalıcı kaydet.
  const stockIn = (id: string, qty: number) => {
    setStock((s) => s.map((x) => (x.id === id ? { ...x, qty } : x)));
    void saveStockQty(id, qty);
  };

  // ---- Ürün CRUD (Menü Yönetimi). Her değişiklik DB'ye yazılır ve hem React
  // state'i hem modül dizileri güncellenir; böylece "Menü", adisyon ve reçeteler
  // anında yeni veriyle çalışır. ----
  type ProductDraft = {
    name: string;
    cat: string;
    price: number;
    route: Product["route"];
    img?: string;
    kcal?: number;
    allergens?: string[];
    meat?: string;
    content?: string;
    kdv_orani?: number;
    eur_price?: number;
    branches?: string[];
  };

  const addProduct = async (d: ProductDraft) => {
    const created = await createProduct(d);
    if (!created) return;
    const next = [...products, created];
    setProducts(next);
    hydrateMenu(next);
  };

  const editProduct = async (id: string, d: ProductDraft) => {
    const updated = await updateProduct(id, d);
    if (!updated) return;
    const next = products.map((p) => (p.id === id ? updated : p));
    setProducts(next);
    hydrateMenu(next);
  };

  const removeProduct = async (id: string) => {
    const ok = await deleteProduct(id);
    if (!ok) return;
    const next = products.filter((p) => p.id !== id);
    setProducts(next);
    hydrateMenu(next);
    // Sunucuda reçetesi de silindi; yerel reçete haritasından da temizle.
    setRecipesState((r) => {
      if (!r[id]) return r;
      const n = { ...r };
      delete n[id];
      return n;
    });
  };

  // ---- Kategori CRUD (Menü Yönetimi). DB'ye yazılır; cats state + modül
  // dizileri (CATS) güncellenir. ----
  const addCategory = async (d: CatDraft): Promise<Category | null> => {
    const created = await createCategory(d);
    if (!created) return null;
    const next = [...cats, created];
    setCats(next);
    hydrateMenu(undefined, next);
    return created;
  };

  const editCategory = async (id: string, patch: Partial<Category>) => {
    const ok = await updateCategory(id, patch);
    if (!ok) return;
    const next = cats.map((c) => (c.id === id ? { ...c, ...patch } : c));
    setCats(next);
    hydrateMenu(undefined, next);
  };

  // Kategori sil: ürünü varsa sunucu 409 → false döner (silinmez).
  const removeCategory = async (id: string): Promise<boolean> => {
    const r = await deleteCategory(id);
    if (!r.ok) return false;
    const next = cats.filter((c) => c.id !== id);
    setCats(next);
    hydrateMenu(undefined, next);
    return true;
  };

  // Masayı güncelle + kalıcı kaydet (yeni durumu sunucuya yaz).
  const updateTable = (no: string, fn: (t: Table) => Table) => {
    const cur = tables.find((t) => t.no === no);
    if (!cur) return;
    const updated = fn({ ...cur, items: cur.items.map((i) => ({ ...i })) });
    setTables((ts) => ts.map((t) => (t.no === no ? updated : t)));
    // İmzayı yerel değişiklikle eşitle → personelin kendi eklemesi "yeni QR
    // sipariş" gibi yanlış bildirim üretmesin.
    sigRef.current.set(no, updated.items.reduce((s, i) => s + i.qty, 0));
    void saveTable(updated);
  };

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

  const payTable = async (no: string) => {
    // ÖKC köprüsü için ödenen masanın anlık görüntüsü (sıfırlamadan önce).
    const paying = tables.find((t) => t.no === no);
    // Optimistik: masayı anında sıfırla. (Sedna malzemesinde stok düşümü yok.)
    setTables((ts) =>
      ts.map((t) =>
        t.no === no
          ? { ...t, status: "bos", items: [], startedAt: null, waiter: null }
          : t,
      ),
    );
    // Ödenen masa sıfırlandı → imza 0 (sonraki yoklama yanlış alarm vermesin).
    sigRef.current.set(no, 0);
    setOpenNo(null);
    // Kalıcı: sunucuda order+payment kaydı (aktif şube) + stok düşümü. Sunucu otoritatif.
    const { stock: freshStock } = await payTableApi(no, "nakit", activeBranch);
    if (freshStock) setStock(freshStock);
    // ÖKC / mali fiş köprüsü — yalnızca bayrak açıkken çalışır; kapalıyken no-op.
    if (OKC_AKTIF && paying && paying.items.length) {
      void sendToOkc(buildOkcFis(paying, "nakit", activeBranch));
    }
  };

  // Masa aç: açılınca o masanın "yeni sipariş" rozetini + balonunu temizle.
  const openTable = (no: string) => {
    setOpenNo(no);
    setAlertTables((s) => {
      if (!s.has(no)) return s;
      const n = new Set(s);
      n.delete(no);
      return n;
    });
    setNotes((ns) => ns.filter((x) => x.no !== no));
  };

  // Bildirim balonlarını bir süre sonra otomatik kapat (rozet masada kalır).
  useEffect(() => {
    if (!notes.length) return;
    const t = setTimeout(() => setNotes((ns) => ns.slice(1)), 8000);
    return () => clearTimeout(t);
  }, [notes]);

  const goView = (v: View) => {
    setView(v);
    setOpenNo(null);
  };

  // Şube değiştir: açık adisyonu kapat; effect yeni şubenin masalarını yükler.
  const switchBranch = (id: string) => {
    if (id === activeBranch) return;
    setOpenNo(null);
    setActiveBranch(id);
  };

  // Çıkış: oturum çerezini temizle, login'e dön.
  const onLogout = async () => {
    await logoutApi();
    setOpenNo(null);
    setView("masalar");
    setAuthUser(null);
  };

  // Sipariş/menü görünümlerinde yalnızca aktif şubede geçerli ürünler. Şubesiz
  // (branches boş) ürünler tüm şubelerde görünür → tek şubeli kurulumda hepsi.
  const branchProducts = products.filter((p) => productInBranch(p, activeBranch));

  const openTableObj = tables.find((t) => t.no === openNo);
  // Masa Planı ve Garson Terminali, açık masada ortak Adisyon ekranını paylaşır.
  const inAdisyon = openTableObj && (view === "masalar" || view === "garson");

  // Oturum kontrolü tamamlanana kadar boş ekran (login yanıp sönmesin).
  if (!authChecked) return <div className="h-screen w-screen bg-[#e6e6e8]" />;

  if (!authUser)
    return (
      <Login
        onAuthenticated={(user, branch) => {
          setActiveBranch(branch);
          setAuthUser(user);
        }}
      />
    );

  return (
    <PermsProvider canEdit={canEdit}>
      <div className="pos-canvas flex h-screen w-screen overflow-hidden font-sans text-ink">
        <Sidebar
          view={view}
          setView={goView}
          user={authUser}
          onLogout={onLogout}
          allowed={modules}
          branches={branches}
          activeBranchId={activeBranch}
          onSwitchBranch={switchBranch}
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
              products={branchProducts}
              cats={cats}
              eurRate={eurRate}
            />
          )}
          {!inAdisyon && view === "masalar" && (
            <Masalar
              tables={tables}
              activeHall={activeHall}
              setActiveHall={setActiveHall}
              onOpen={openTable}
              clockMin={clockMin}
              alerts={alertTables}
            />
          )}
          {!inAdisyon && view === "garson" && (
            <Garson tables={tables} onOpen={openTable} clockMin={clockMin} />
          )}
          {view === "mutfak" && <Mutfak tables={tables} clockMin={clockMin} />}
          {view === "siramatik" && <Siramatik branchId={activeBranch} />}
          {view === "menu" && <Menu products={branchProducts} cats={cats} />}
          {view === "menu_yonetim" && (
            <MenuYonetim
              products={products}
              cats={cats}
              branches={branches}
              onCreate={addProduct}
              onUpdate={editProduct}
              onDelete={removeProduct}
              onCatCreate={addCategory}
              onCatUpdate={editCategory}
              onCatDelete={removeCategory}
              eurRate={eurRate}
            />
          )}
          {view === "stok" && (
            <Stok
              stock={stock}
              recipes={recipes}
              setRecipes={setRecipes}
              onStockIn={stockIn}
              products={products}
              cats={cats}
              sednaCosts={sednaCosts}
            />
          )}
          {view === "personel" && (
            <Personel
              staff={staff}
              setStaff={setStaff}
              onDelete={removeStaff}
              canManage={authUser.level === "admin"}
            />
          )}
          {view === "rapor" && (
            <Rapor
              branchId={activeBranch}
              branchName={
                branches.find((b) => b.id === activeBranch)?.name ?? activeBranch
              }
            />
          )}
          {view === "subeler" && <Subeler />}
          {view === "ayarlar" && <Ayarlar />}
        </main>

        {/* QR sipariş bildirim balonları (sağ üst). Tıkla → masaya git. */}
        {notes.length > 0 && (
          <div className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-2">
            {notes.map((n) => {
              const tbl = tables.find((t) => t.no === n.no);
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    if (tbl) setActiveHall(tbl.hall);
                    setView("masalar");
                    openTable(n.no);
                  }}
                  className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-left shadow-xl shadow-rose-500/10 ring-1 ring-rose-100 transition hover:bg-rose-50"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-500 text-base text-white">
                    🔔
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-extrabold text-ink">
                      Masa {n.no} — yeni QR sipariş
                    </span>
                    {n.summary ? (
                      <span className="block truncate text-[12px] font-semibold text-ink/70">
                        {n.summary}
                      </span>
                    ) : null}
                    <span className="block text-[12px] font-semibold text-rose-600">
                      Görmek için tıkla
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </PermsProvider>
  );
}
