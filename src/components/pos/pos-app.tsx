"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  seedTables,
  hydrateMenu,
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
import {
  fetchBootstrap,
  saveTable,
  payTableApi,
  saveRecipes,
  saveStaff,
  deleteStaff,
  saveStockQty,
  createProduct,
  updateProduct,
  deleteProduct,
  meApi,
  logoutApi,
} from "@/lib/pos-api";
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

export function PosApp() {
  // Gerçek auth: oturum çerezinden gelen kullanıcı. null = giriş yapılmamış.
  const [authUser, setAuthUser] = useState<Staff | null>(null);
  const [authChecked, setAuthChecked] = useState(false); // /me tamamlandı mı
  const [view, setView] = useState<View>("masalar");
  const [tables, setTables] = useState<Table[]>(seedTables);
  const [activeHall, setActiveHall] = useState("ic");
  const [openNo, setOpenNo] = useState<string | null>(null);

  // Şubeler & aktif şube — operasyon (masalar/ödeme) aktif şubeye göre ayrı.
  const [branches, setBranches] = useState<Branch[]>(() => [...BRANCHES]);
  const [activeBranch, setActiveBranch] = useState(BRANCHES[0].id);
  // SSR-güvenli dakika saati: sunucuda 0, mount sonrası ilerler.
  const [clockMin, setClockMin] = useState(0);

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
        setTables(d.tables ?? []);
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

  // Masayı güncelle + kalıcı kaydet (yeni durumu sunucuya yaz).
  const updateTable = (no: string, fn: (t: Table) => Table) => {
    const cur = tables.find((t) => t.no === no);
    if (!cur) return;
    const updated = fn({ ...cur, items: cur.items.map((i) => ({ ...i })) });
    setTables((ts) => ts.map((t) => (t.no === no ? updated : t)));
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
    // Optimistik: masayı anında sıfırla. (Sedna malzemesinde stok düşümü yok.)
    setTables((ts) =>
      ts.map((t) =>
        t.no === no
          ? { ...t, status: "bos", items: [], startedAt: null, waiter: null }
          : t,
      ),
    );
    setOpenNo(null);
    // Kalıcı: sunucuda order+payment kaydı (aktif şube) + stok düşümü. Sunucu otoritatif.
    const { stock: freshStock } = await payTableApi(no, "nakit", activeBranch);
    if (freshStock) setStock(freshStock);
  };

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
              products={products}
              cats={cats}
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
          {view === "menu" && <Menu products={products} cats={cats} />}
          {view === "menu_yonetim" && (
            <MenuYonetim
              products={products}
              cats={cats}
              onCreate={addProduct}
              onUpdate={editProduct}
              onDelete={removeProduct}
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
      </div>
    </PermsProvider>
  );
}
