/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from "react";
import { CATEGORIES, MENU_ITEMS } from "./data";
import { MenuItem, MenuCategory, CartItem } from "./types";
import Logo from "./components/Logo";
import MenuItemCard from "./components/MenuItemCard";
import BankDetails from "./components/BankDetails";
import CartDrawer from "./components/CartDrawer";
import {
  Instagram,
  Phone,
  ShoppingBag,
  Search,
  ChevronDown,
  Sparkles,
  UtensilsCrossed,
  Clock,
  MapPin,
  MessageCircle,
  TrendingUp,
  X,
  Compass,
  Shield,
  Lock,
  Unlock,
  LogOut,
  Save,
  KeyRound,
  PlusCircle,
  Edit,
  Check,
  Trash2
} from "lucide-react";

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("entradas");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Admin Mode States & Helpers ---
  const [isAdminPath, setIsAdminPath] = useState(false);
  const [isAdminLogged, setIsAdminLogged] = useState(() => {
    return localStorage.getItem("montepork_admin_logged") === "true";
  });
  const [isAdminPreviewMode, setIsAdminPreviewMode] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  // Modals
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [currentPassInput, setCurrentPassInput] = useState("");
  const [newPassInput, setNewPassInput] = useState("");
  const [confirmPassInput, setConfirmPassInput] = useState("");

  // Check if password remains the default "1234"
  const [isPassDefault, setIsPassDefault] = useState(false);

  // Editable configurations state (initialized from localStorage or file defaults)
  const [categories, setCategories] = useState<MenuCategory[]>(() => {
    const saved = localStorage.getItem("montepork_categories");
    return saved ? JSON.parse(saved) : CATEGORIES;
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem("montepork_menu_items");
    return saved ? JSON.parse(saved) : MENU_ITEMS;
  });

  const [bankAccounts, setBankAccounts] = useState(() => {
    const saved = localStorage.getItem("montepork_bank_accounts");
    const defaultAccounts = [
      {
        id: "rnc",
        bank: "RP2, SRL",
        type: "RNC (Registro Nacional de Contribuyentes)",
        number: "133410389",
        accent: "border-primary/20 bg-primary/5",
        logoType: "rnc"
      },
      {
        id: "bhd",
        bank: "Banco BHD",
        type: "Cuenta de Ahorros",
        number: "39729570017",
        accent: "border-emerald-500/20 bg-emerald-500/5",
        logoType: "bhd"
      },
      {
        id: "banreservas",
        bank: "Banreservas",
        type: "Cuenta de Ahorros",
        number: "9609051377",
        accent: "border-sky-500/20 bg-sky-500/5",
        logoType: "banreservas"
      }
    ];
    return saved ? JSON.parse(saved) : defaultAccounts;
  });

  const [rncHeader, setRncHeader] = useState(() => {
    return localStorage.getItem("montepork_rnc_header") || "RNC: 133-41038-9";
  });

  const [contactInfo, setContactInfo] = useState(() => {
    const saved = localStorage.getItem("montepork_contact_info");
    return saved ? JSON.parse(saved) : { phone: "18498140019", instagram: "monteporkrd" };
  });

  // Server-saved SHA-256 password hash (default is "1234")
  const [adminPasswordHash, setAdminPasswordHash] = useState(() => {
    return localStorage.getItem("montepork_admin_pwd_hash") || "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4";
  });

  // Load configuration from local server disk
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch("/api/config");
        if (res.ok) {
          const data = await res.json();
          if (data.found) {
            if (data.categories) setCategories(data.categories);
            if (data.menuItems) setMenuItems(data.menuItems);
            if (data.bankAccounts) setBankAccounts(data.bankAccounts);
            if (data.rncHeader) setRncHeader(data.rncHeader);
            if (data.contactInfo) setContactInfo(data.contactInfo);
            if (data.adminPasswordHash) {
              setAdminPasswordHash(data.adminPasswordHash);
              localStorage.setItem("montepork_admin_pwd_hash", data.adminPasswordHash);
            }
          }
        }
      } catch (err) {
        console.error("Error loading config from server disk:", err);
      }
    };
    loadConfig();
  }, []);

  // Sync password default state reactively which works with both disk-backed or memoized state
  useEffect(() => {
    const defaultHash = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"; // 1234
    setIsPassDefault(adminPasswordHash === defaultHash);
  }, [adminPasswordHash]);

  // Native cryptographical SHA-256 function
  const hashPassword = async (password: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  useEffect(() => {
    const checkPath = () => {
      const isPath = window.location.pathname.endsWith("/admin") || window.location.hash === "#admin" || window.location.search === "?admin";
      setIsAdminPath(isPath);
    };

    checkPath();
    window.addEventListener("hashchange", checkPath);

    return () => {
      window.removeEventListener("hashchange", checkPath);
    };
  }, []);

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!adminPasswordInput) {
      setLoginError("Por favor ingresa la contraseña.");
      return;
    }
    const defaultHash = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"; // 1234
    const currentHash = adminPasswordHash;
    const computed = await hashPassword(adminPasswordInput);

    if (computed === currentHash) {
      localStorage.setItem("montepork_admin_logged", "true");
      setIsAdminLogged(true);
      setAdminPasswordInput("");
      setLoginError("");
      
      // Check if logged password is '1234'
      if (computed === defaultHash) {
        setIsPassDefault(true);
      } else {
        setIsPassDefault(false);
      }
      showToast("🔓 ¡Sesión administrativa iniciada! 🔥");
    } else {
      setLoginError("Contraseña incorrecta. Inténtalo de nuevo.");
      setAdminPasswordInput("");
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("montepork_admin_logged");
    setIsAdminLogged(false);
    setIsAdminPreviewMode(false);
    showToast("🚪 Sesión administrativa cerrada.");
  };

  const handleExitAdminPath = () => {
    setIsAdminPath(false);
    window.history.pushState({}, "", "/");
  };

  // State modification callbacks
  const handleUpdateItem = (itemId: string, updated: Partial<MenuItem>) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...updated } : item))
    );
  };

  const handleDeleteItem = (itemId: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== itemId));
    showToast("Plato eliminado. ¡Recuerda guardar los cambios! 🗑️");
  };

  const handleAddItem = (catId: string) => {
    const defaultNewItem: MenuItem = {
      id: `custom_${Date.now()}`,
      name: "Nuevo Plato Crujiente",
      description: "Descripción tradicional.",
      price: 300,
      unit: "SERV",
      subCategory: catId,
    };
    setMenuItems((prev) => [...prev, defaultNewItem]);
    showToast("¡Has añadido un plato a la sección! Sube una foto o edita su información.");
  };

  const handleUpdateCategory = (catId: string, updated: Partial<MenuCategory>) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === catId ? { ...cat, ...updated } : cat))
    );
  };

  const handleAddCategory = () => {
    const newCatId = `cat_${Date.now()}`;
    const newCat: MenuCategory = {
      id: newCatId,
      name: "Nueva Sección",
      tagline: "Sazón crujiente opcional"
    };
    setCategories((prev) => [...prev, newCat]);
    showToast("¡Nueva sección creada! Edítala a continuación y añade platos.");
  };

  const handleDeleteCategory = (catId: string) => {
    if (confirm("¿Estás seguro de eliminar esta sección entera y todos sus platos asociados?")) {
      setCategories((prev) => prev.filter((cat) => cat.id !== catId));
      setMenuItems((prev) => prev.filter((item) => item.subCategory !== catId));
      showToast("Sección y platos limpiados. ¡No olvides guardar!");
    }
  };

  const handleUpdateAccount = (accountId: string, updated: any) => {
    setBankAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, ...updated } : acc))
    );
  };

  const handleSaveAllChanges = async () => {
    // 1. Keep saving to localStorage (as a fallback/local copy)
    localStorage.setItem("montepork_categories", JSON.stringify(categories));
    localStorage.setItem("montepork_menu_items", JSON.stringify(menuItems));
    localStorage.setItem("montepork_bank_accounts", JSON.stringify(bankAccounts));
    localStorage.setItem("montepork_rnc_header", rncHeader);
    localStorage.setItem("montepork_contact_info", JSON.stringify(contactInfo));
    
    // 2. Submit to server disk file
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categories,
          menuItems,
          bankAccounts,
          rncHeader,
          contactInfo,
          adminPasswordHash
        }),
      });
      if (response.ok) {
        showToast("💾 ¡Cambios de la tienda guardados exitosamente en el disco! 🔥");
      } else {
        showToast("❌ Error al guardar en el disco del servidor.");
      }
    } catch (err) {
      console.error("Error saving config to disk:", err);
      showToast("❌ No se pudo conectar con el servidor para guardar.");
    }
  };

  // Asset paths from generated assets
  const chicharronHeroImage = "/images/chicharron_hero_1780744755885.png";
  const mofongoImage = "/images/mofongo_plate_1780744771022.png";

  // Intersection observer refs for highlighting sticky active tabs on scroll
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setSelectedCategory(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    CATEGORIES.forEach((cat) => {
      const el = sectionRefs.current[cat.id];
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleScrollToSection = (id: string) => {
    setSelectedCategory(id);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 130; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Cart operations
  const handleAddToCart = (item: MenuItem) => {
    setCart((prevCart) => {
      const existing = prevCart.find((ci) => ci.item.id === item.id);
      if (existing) {
        showToast(`Marcado otro ${item.name} en tu plato! 🐷`);
        return prevCart.map((ci) =>
          ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      showToast(`¡Agregado ${item.name} al plato! 🔥`);
      return [...prevCart, { item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((ci) => {
          if (ci.item.id === itemId) {
            const newQty = ci.quantity + delta;
            return { ...ci, quantity: newQty };
          }
          return ci;
        })
        .filter((ci) => ci.quantity > 0);
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((ci) => ci.item.id !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
    showToast("¡Vaciaste tu plato! Puedes rearmar tu pedido.");
  };

  const handleUpdateNotes = (itemId: string, notes: string) => {
    setCart((prevCart) =>
      prevCart.map((ci) => (ci.item.id === itemId ? { ...ci, notes } : ci))
    );
  };

  const getCartItemCount = (itemId: string) => {
    const found = cart.find((ci) => ci.item.id === itemId);
    return found ? found.quantity : 0;
  };

  const totalCartCount = cart.reduce((acc, ci) => acc + ci.quantity, 0);
  const cartSubtotal = cart.reduce((acc, ci) => acc + ci.item.price * ci.quantity, 0);

  // Filter items based on search query
  const filteredItems = (catId: string) => {
    const itemsOfCat = menuItems.filter((item) => item.subCategory === catId);
    if (!searchQuery.trim()) return itemsOfCat;
    return itemsOfCat.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  // Split beverages grouped nicely
  const getBebidasByGroup = (group: string) => {
    return menuItems.filter(
      (item) => item.subCategory === "bebidas" && item.description === group
    ).filter(
      (item) =>
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleChangePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentPassInput || !newPassInput || !confirmPassInput) {
      showToast("⚠️ Por favor completa todos los campos.");
      return;
    }

    const defaultHash = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"; // 1234
    const currentHash = adminPasswordHash;
    const computedCurrent = await hashPassword(currentPassInput);

    if (computedCurrent !== currentHash) {
      showToast("❌ La contraseña actual ingresada es incorrecta.");
      return;
    }

    if (newPassInput === "1234") {
      showToast("⚠️ No puedes usar '1234' como tu nueva contraseña.");
      return;
    }

    if (newPassInput !== confirmPassInput) {
      showToast("❌ Las nuevas contraseñas no coinciden.");
      return;
    }

    if (newPassInput.length < 4) {
      showToast("⚠️ La nueva contraseña debe tener al menos 4 caracteres.");
      return;
    }

    // Set new password hash
    const computedNew = await hashPassword(newPassInput);
    setAdminPasswordHash(computedNew);
    localStorage.setItem("montepork_admin_pwd_hash", computedNew);
    setIsPassDefault(false);
    setShowChangePassModal(false);
    setCurrentPassInput("");
    setNewPassInput("");
    setConfirmPassInput("");

    // Auto-save the new password hash along with current layout config to the server disk immediately
    try {
      await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categories,
          menuItems,
          bankAccounts,
          rncHeader,
          contactInfo,
          adminPasswordHash: computedNew
        }),
      });
      showToast("🔒 ¡Contraseña modificada y respaldada en el servidor disk! 🔥");
    } catch (err) {
      console.error("Error auto-saving password to disk:", err);
      showToast("🔒 ¡Contraseña modificada! No se pudo actualizar en disco, recuerda guardar antes de salir.");
    }
  };

  if (isAdminPath && !isAdminLogged) {
    return (
      <div className="min-h-screen bg-dark-bg text-gray-100 font-sans flex flex-col justify-center items-center p-4 select-none relative overflow-hidden">
        {/* Neon lights background decoration */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-wine/25 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-dark-card border border-white/10 rounded-3xl p-8 relative shadow-2xl space-y-6 z-10">
          <div className="text-center space-y-3">
            <Logo size="lg" />
            <div className="space-y-1">
              <span className="text-primary text-xs font-black uppercase tracking-widest font-display block">Acceso Administrativo</span>
              <h1 className="text-2xl font-display font-black text-white">Panel Monte Pork</h1>
            </div>
            <p className="text-xs text-gray-400 font-light">
              Ingresa la clave de administración para realizar cambios instantáneos en la carta, fotos e información.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-400 block">Contraseña de Administrador (Inicial es 1234)</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => {
                    setAdminPasswordInput(e.target.value);
                    if (loginError) setLoginError("");
                  }}
                  placeholder="••••"
                  className="w-full bg-black/35 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono tracking-widest text-center"
                  autoFocus
                />
              </div>
              {loginError && (
                <span className="text-xs text-primary font-medium animate-pulse block">
                  ⚠️ {loginError}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-primary hover:bg-primary-dark rounded-2xl text-white font-display font-black tracking-wider uppercase transition-all duration-300 transform active:scale-95 cursor-pointer shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              style={{ backgroundColor: "#E8005A" }}
            >
              <Unlock className="w-4 h-4 shrink-0" />
              <span>Entrar al Horno</span>
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              onClick={handleExitAdminPath}
              className="text-xs text-gray-500 hover:text-white transition-colors cursor-pointer font-mono"
            >
              Cancelar y volver al menú
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isChangePasswordEnforced = isAdminLogged && isPassDefault;

  return (
    <div className="min-h-screen flex flex-col items-stretch overflow-x-hidden select-none bg-dark-bg text-gray-100 font-sans selection:bg-primary selection:text-white">
      
      {/* Admin Action Panel Header */}
      {isAdminLogged && (
        <div className="bg-gradient-to-r from-dark-card to-black border-b border-primary/25 text-white py-3 px-4 sticky top-0 z-[60] shadow-xl flex flex-wrap items-center justify-between gap-4 font-sans">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary animate-pulse border border-primary/40 leading-none shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs uppercase font-display font-black tracking-widest text-primary block leading-tight">Panel Administrativo (Monte Pork)</span>
              <span className="text-[10px] text-gray-400 font-mono">Modo de Vista: {isAdminPreviewMode ? "👁️ Vista Cliente" : "✍️ Edición Directa"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsAdminPreviewMode(!isAdminPreviewMode)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isAdminPreviewMode
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
                  : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
              }`}
            >
              {isAdminPreviewMode ? "✍️ Volver a Editar" : "👁️ Probar Vista Cliente"}
            </button>

            <button
              onClick={() => setShowChangePassModal(true)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-primary" />
              <span>Cambiar Clave</span>
            </button>

            <button
              onClick={handleSaveAllChanges}
              className="px-4 py-1.5 bg-primary hover:opacity-90 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-primary/20"
              style={{ backgroundColor: "#E8005A" }}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Configuración</span>
            </button>

            <div className="h-6 w-px bg-white/10 mx-1"></div>

            <button
              onClick={handleAdminLogout}
              className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 text-red-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar</span>
            </button>
          </div>
        </div>
      )}

      {/* Forced Password Change Overlay Modal */}
      {(showChangePassModal || isChangePasswordEnforced) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-dark-card border border-white/10 p-6 md:p-8 rounded-3xl w-full max-w-sm space-y-4 shadow-2xl relative">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary mx-auto border border-primary/35">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-display font-black text-white">
                {isChangePasswordEnforced ? "⚠️ CAMBIO DE CONTRASEÑA OBLIGATORIO" : "Cambiar Contraseña"}
              </h3>
              <p className="text-xs text-gray-400 font-light leading-relaxed">
                {isChangePasswordEnforced
                  ? "Estás con la contraseña inicial '1234'. Por motivos de seguridad, debes ingresar una clave nueva para activar las funciones del panel."
                  : "Ingresa tu clave actual y tu nueva clave secreta de administración."}
              </p>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4 pt-1 font-sans">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-gray-500 font-bold block">Contraseña Actual ({isChangePasswordEnforced && "es 1234"})</label>
                <input
                  type="password"
                  value={currentPassInput}
                  onChange={(e) => setCurrentPassInput(e.target.value)}
                  className="w-full bg-black/35 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
                  placeholder="Clave actual"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-gray-500 font-bold block">Nueva Contraseña</label>
                <input
                  type="password"
                  value={newPassInput}
                  onChange={(e) => setNewPassInput(e.target.value)}
                  className="w-full bg-black/35 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
                  placeholder="Clave nueva"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-gray-500 font-bold block">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  value={confirmPassInput}
                  onChange={(e) => setConfirmPassInput(e.target.value)}
                  className="w-full bg-black/35 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
                  placeholder="Confirmar clave nueva"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                {!isChangePasswordEnforced && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePassModal(false);
                      setCurrentPassInput("");
                      setNewPassInput("");
                      setConfirmPassInput("");
                    }}
                    className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary rounded-xl text-xs font-black text-white hover:opacity-95 uppercase tracking-wide cursor-pointer transition-all shadow-md shadow-primary/20"
                  style={{ backgroundColor: "#E8005A" }}
                >
                  Registar Clave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Visual Toast Notification Overlay */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-black/95 text-white border border-primary/50 text-sm font-display font-medium px-5 py-3 rounded-2xl shadow-2xl shadow-primary/20 flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Section */}
      <section
        id="home"
        className="relative min-h-[92vh] flex flex-col justify-end items-center px-4 py-16 overflow-hidden md:px-8 border-b border-white/5"
      >
        {/* Background photo & overlay */}
        <div className="absolute inset-0 bg-black">
          <img
            src={chicharronHeroImage}
            alt="Monte Pork Chicharrón"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-60 mix-blend-luminosity scale-105 transition-all duration-1000 transform hover:scale-100"
          />
          {/* Intense vignette & custom fucsia gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/70 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-black/85"></div>
        </div>

        {/* Floating status bubble */}
        <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="font-display font-bold uppercase tracking-wider text-[10px] text-gray-300">Activos en el horno 🇩🇴</span>
        </div>

        {/* Content Container */}
        <div className="relative max-w-4xl text-center space-y-6 z-10">
          <div className="space-y-2 animate-fadeIn">
            <Logo size="xl" />
            <h2 className="text-xl md:text-3xl font-display font-black text-white/95 uppercase tracking-wide italic">
              "El Más Crujiente de la Región"
            </h2>
            <div className="h-1 w-24 bg-primary mx-auto rounded-full"></div>
          </div>

          <p className="max-w-xl mx-auto text-sm md:text-lg text-gray-300 font-light leading-relaxed">
            Chicharrón de verdad, macerado por 24 horas y explotado al momento. Mofongos, combos del coro y las cervezas más frías de la comarca.
          </p>

          {/* Social connections bar */}
          <div className="flex items-center justify-center gap-4 text-xs font-mono font-medium text-gray-400 py-3 bg-white/5 border border-white/5 rounded-2xl max-w-sm mx-auto backdrop-blur-md">
            <a
              href="https://instagram.com/monteporkrd"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
            >
              <Instagram className="w-4 h-4 text-primary" />
              <span>@monteporkrd</span>
            </a>
            <span className="text-white/20">|</span>
            <a
              href="https://wa.me/18498140019"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>+1 (849) 814-0019</span>
            </a>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => handleScrollToSection("menu")}
              style={{ backgroundColor: "#E8005A" }}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl font-display font-black text-white tracking-wide uppercase shadow-lg shadow-primary/30 transform transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <UtensilsCrossed className="w-5 h-5 shrink-0" />
              <span>Ver Menú</span>
            </button>

            <a
              href="https://wa.me/18498140019"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-10 py-4 bg-white/10 hover:bg-white/15 backdrop-blur-md text-white font-display font-black tracking-wide uppercase border border-white/10 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 shrink-0 text-emerald-400 fill-emerald-400/10" />
              <span>Escribenos</span>
            </a>
          </div>

          <div className="pt-6 animate-pulse">
            <ChevronDown className="w-6 h-6 mx-auto text-gray-500 hover:text-primary transition-colors cursor-pointer" onClick={() => handleScrollToSection("menu")} />
          </div>
        </div>

        {/* Left decoration watermark */}
        <div className="absolute left-6 bottom-6 hidden md:block text-left opacity-30 select-none pointer-events-none">
          <span className="font-mono text-[10px] tracking-wider block text-gray-500">MONTE PORK DE RD SRL</span>
          <span className="font-mono text-[10px] tracking-wider block text-gray-500">SANTO DOMINGO, RD</span>
        </div>
      </section>

      {/* Signature Dishes Showcase (Mofongo MP highlight) */}
      <section className="bg-gradient-to-b from-dark-bg to-dark-card py-16 px-4 md:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-black/45 rounded-3xl p-6 md:p-10 border border-white/5 relative overflow-hidden">
          {/* Neon lights */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-wine/20 rounded-full blur-3xl"></div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-primary/20 border border-primary/30 px-3 py-1 rounded-full text-xs font-display font-black text-primary uppercase tracking-wider animate-pulse">
              <Sparkles className="w-3.5 h-3.5 fill-primary" />
              <span>La Gloria en Pilón</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight">
              Nuestra Especialidad: <span className="text-primary text-pulse-glow" style={{ color: "#E8005A" }}>Mofongo MP</span>
            </h2>
            
            <p className="text-sm md:text-base text-gray-300 font-light leading-relaxed">
              Majo de plátano verde o maduro y yuca con abundante ajo confitado tradicional, frito con tropezones de chicharrón crujientito. Coronado con su capa de queso fundido burbujeante y servido con porción de tocino, longaniza artesanal o más chicharrón.
            </p>

            <div className="flex items-center gap-6 py-2 border-t border-b border-white/5 my-4">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-widest font-display block">Precio</span>
                <span className="text-2xl font-black font-mono text-white">RD$ 400</span>
              </div>
              <div className="h-8 w-px bg-white/10"></div>
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-widest font-display block">Sabor</span>
                <span className="text-sm font-bold text-gray-300">100% Criollo 🇩🇴</span>
              </div>
            </div>

            <button
              onClick={() => {
                const item = menuItems.find((i) => i.id === "mofongo_mp");
                if (item) handleAddToCart(item);
              }}
              style={{ backgroundColor: "#E8005A" }}
              className="px-6 py-3 rounded-xl font-display font-bold text-sm text-white hover:opacity-90 transform active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Quiero probarlo</span>
            </button>
          </div>

          {/* Photo */}
          <div className="relative rounded-2xl overflow-hidden aspect-square border border-white/10 shadow-2xl shadow-black group">
            <img
              src={mofongoImage}
              alt="Mofongo Monte Pork"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-4 left-4">
              <span className="text-xs font-display font-medium text-gray-400 uppercase tracking-wider block">Foto real de cocina</span>
              <span className="text-sm font-bold text-white">El Mofongo MP recién salido del pilón</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Top Menu Navigator & Search Bar wrapper */}
      <div id="sticky-header" className="sticky top-0 bg-dark-bg/95 backdrop-blur-lg border-b border-white/5 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            
            {/* Logo and Tagline representation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Logo size="sm" />
                <span className="hidden sm:inline text-xs border-l border-white/10 pl-3 text-gray-400 font-mono">El Más Crujiente</span>
              </div>
              
              {/* Responsive Quick Cart icon trigger if items in cart */}
              {totalCartCount > 0 && (
                <button
                  id="float-cart-mobile"
                  onClick={() => setIsCartOpen(true)}
                  className="md:hidden flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-xl font-display font-black text-xs shadow-lg shadow-primary/20 animate-pulse cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{totalCartCount}</span>
                </button>
              )}
            </div>

            {/* Smart Search box layout */}
            <div className="relative flex-1 md:max-w-xs xl:max-w-md">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                id="menu-search-input"
                type="text"
                placeholder="Busca por plato, ingrediente o bebida..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/35 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary transition-all font-sans"
              />
              {searchQuery && (
                <button
                  id="search-clear-btn"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Tab Categories scroller */}
          <div className="flex items-center gap-2 overflow-x-auto mt-3 py-2 scrollbar-none snap-x touch-pan-x -mx-4 px-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleScrollToSection(cat.id)}
                className={`snap-center px-4 py-2 rounded-xl text-xs md:text-sm font-display font-black tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-primary text-white shadow-md shadow-primary/25 translate-y-0"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Menu List Section */}
      <main id="menu" className="flex-1 max-w-7xl mx-auto px-4 py-8 md:px-8 space-y-16">
        
        {/* If searching and no results */}
        {searchQuery && categories.every(cat => filteredItems(cat.id).length === 0) && (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-gray-500 border border-white/5">
              <Search className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-display font-medium text-lg text-white">No encontramos ningún "crujido" similar</h4>
              <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
                No hay resultados para "{searchQuery}". Intenta con otros términos como chicharrón, tocino, mofongo o Presidente.
              </p>
            </div>
            <button
              onClick={() => setSearchQuery("")}
              className="text-primary hover:text-primary-dark font-medium underline text-sm cursor-pointer"
            >
              Ver menú completo
            </button>
          </div>
        )}

        {/* Render Sections Dynamically */}
        {categories.map((cat) => {
          const items = filteredItems(cat.id);
          
          // In admin mode, we want to show category blocks even if they don't have items so administrators can add items to them!
          const showSection = items.length > 0 || (isAdminLogged && !isAdminPreviewMode);
          if (!showSection) return null;
          
          return (
            <section
              id={cat.id}
              key={cat.id}
              ref={(el) => { sectionRefs.current[cat.id] = el; }}
              className="scroll-mt-32 space-y-6 pt-4"
            >
              {/* Category Header */}
              <div className="border-b border-white/5 pb-4">
                {isAdminLogged && !isAdminPreviewMode ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={cat.name}
                        onChange={(e) => handleUpdateCategory(cat.id, { name: e.target.value })}
                        className="text-2xl md:text-3xl font-display font-black text-white uppercase italic tracking-tight bg-black/45 border border-white/10 rounded-xl px-4 py-1.5 focus:outline-none focus:border-primary font-sans"
                        placeholder="Nombre de la Sección"
                      />
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2.5 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 text-red-400 rounded-xl transition-all cursor-pointer"
                        title="Eliminar Sección"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={cat.tagline || ""}
                      onChange={(e) => handleUpdateCategory(cat.id, { tagline: e.target.value })}
                      className="text-xs text-gray-400 font-light italic bg-black/25 border border-white/5 rounded-lg px-3 py-1.5 w-full max-w-lg focus:outline-none focus:border-primary font-sans"
                      placeholder="Tagline opcional..."
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-3">
                      <h2 className="text-2xl md:text-3xl font-display font-black text-white uppercase italic tracking-tight">
                        {cat.name}
                      </h2>
                      <span className="text-xs font-mono font-bold text-primary" style={{ color: "#E8005A" }}>
                        ({items.length} {items.length === 1 ? "ítem" : "ítems"})
                      </span>
                    </div>
                    {cat.tagline && (
                      <p className="text-sm text-gray-400 mt-1 font-light italic">
                        {cat.tagline}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Special rendering for Bebidas divided internally */}
              {cat.id === "bebidas" ? (
                <div className="space-y-10">
                  {/* Category groups inside beverages */}
                  {["Bebidas sin alcohol", "Tragos de Autor y Licores", "Cervezas Extra Frías"].map((groupName) => {
                    const groupItems = groupName === "Bebidas sin alcohol" 
                      ? getBebidasByGroup(groupName).concat(menuItems.filter(i => i.subCategory === "bebidas" && (!i.description || i.description === "Bebidas sin alcohol" || i.description === "Descripción tradicional.")).filter(i => !["Tragos de Autor y Licores", "Cervezas Extra Frías"].includes(i.description || "")))
                      : getBebidasByGroup(groupName);

                    if (groupItems.length === 0 && !(isAdminLogged && !isAdminPreviewMode)) return null;

                    return (
                      <div key={groupName} className="space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary" style={{ backgroundColor: "#E8005A" }}></span>
                          <h3 className="font-display font-bold text-lg text-white/90">
                            {groupName}
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {groupItems.map((item) => (
                            <MenuItemCard
                              key={item.id}
                              item={item}
                              onAdd={handleAddToCart}
                              count={getCartItemCount(item.id)}
                              isAdminMode={isAdminLogged && !isAdminPreviewMode}
                              onUpdateItem={handleUpdateItem}
                              onDeleteItem={handleDeleteItem}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {isAdminLogged && !isAdminPreviewMode && (
                    <div className="flex justify-center pt-2">
                      <button
                        onClick={() => handleAddItem("bebidas")}
                        className="px-5 py-2.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-2xl text-xs font-display font-black text-primary uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4 shrink-0" />
                        <span>Añadir Bebida o Trago</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Standard grid layout for entries, tajos, fuertes, coro, etc. */
                <div className="space-y-6">
                  {items.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-white/5 bg-white/5 rounded-2xl text-xs text-gray-500">
                      Esta sección se encuentra vacía. Agrega un plato ingresando abajo.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {items.map((item) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          onAdd={handleAddToCart}
                          count={getCartItemCount(item.id)}
                          isAdminMode={isAdminLogged && !isAdminPreviewMode}
                          onUpdateItem={handleUpdateItem}
                          onDeleteItem={handleDeleteItem}
                        />
                      ))}
                    </div>
                  )}

                  {isAdminLogged && !isAdminPreviewMode && (
                    <div className="flex justify-center pt-2">
                      <button
                        onClick={() => handleAddItem(cat.id)}
                        className="px-5 py-2.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 rounded-2xl text-xs font-display font-black text-primary uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4 shrink-0" />
                        <span>Añadir Plato a {cat.name}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}

        {/* Section Adder for Administrators */}
        {isAdminLogged && !isAdminPreviewMode && (
          <div className="text-center pt-6 pb-2 border-t border-white/5">
            <button
              onClick={handleAddCategory}
              className="px-6 py-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-2xl text-xs font-display font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2 mx-auto transition-all cursor-pointer"
            >
              <PlusCircle className="w-4.5 h-4.5 shrink-0" />
              <span>Añadir Nueva Sección / Categoría 🌱</span>
            </button>
          </div>
        )}

        {/* Bank transfer Section */}
        <section id="pagos" className="pt-8">
          <BankDetails
            onNotify={showToast}
            isAdminMode={isAdminLogged && !isAdminPreviewMode}
            accountsData={bankAccounts}
            onUpdateAccount={handleUpdateAccount}
            rncHeader={rncHeader}
            onUpdateRncHeader={setRncHeader}
          />
        </section>
      </main>

      {/* Sticky Bottom Quick-Plate / Mini Cart trigger for desktop and mobile */}
      {totalCartCount > 0 && (
        <div id="sticky-bottom-cart" className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 max-w-lg w-[90%] font-sans animate-slideUp">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-primary text-white p-4 rounded-2xl flex items-center justify-between shadow-2xl shadow-primary/40 transform transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] select-none cursor-pointer"
            style={{ backgroundColor: "#E8005A" }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <span className="text-xs block text-white/80 uppercase font-display font-black tracking-wider">
                  Tu Plato Crujiente
                </span>
                <span className="text-sm font-bold block leading-none">
                  {totalCartCount} {totalCartCount === 1 ? "Artículo" : "Artículos"} añadidos
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-black/25 px-4 py-2 rounded-xl text-sm font-mono font-black border border-white/5">
              <span>Subtotal:</span>
              <span className="text-white">RD$ {cartSubtotal.toLocaleString()}</span>
            </div>
          </button>
        </div>
      )}

      {/* Sticky Floating WhatsApp Help widget on bottom-right */}
      {totalCartCount === 0 && (
        <a
          id="whatsapp-floating-ball"
          href={`https://wa.me/${contactInfo.phone}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-6 right-6 z-40 bg-emerald-500 text-white p-4 rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-all duration-300 hover:scale-110 active:scale-90 cursor-pointer shadow-emerald-500/20 group"
        >
          {/* Chat Bubble Help effect */}
          <span className="absolute right-14 bg-black/90 text-white border border-white/5 text-[10px] font-display font-bold px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
            ¡Dime de qué tienes deseos! 👋
          </span>
          <MessageCircle className="w-6 h-6 fill-white text-emerald-500" />
        </a>
      )}

      {/* Cart Drawer Component */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onUpdateNotes={handleUpdateNotes}
        whatsappPhone={contactInfo.phone}
      />

      {/* Brand Footer */}
      <footer className="bg-black/95 border-t border-white/5 pt-16 pb-8 px-4 md:px-8 text-center space-y-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <Logo size="lg" />
          <p className="max-w-md mx-auto text-sm text-gray-500 font-light">
            Sazón monteplatense tradicional con crujido urbano. Sigue nuestro chicharrón en nuestras redes. ¡Buen provecho!
          </p>

          <div className="flex items-center justify-center gap-6">
            <a
              href={`https://instagram.com/${contactInfo.instagram}`}
              target="_blank"
              rel="noreferrer"
              className="w-11 h-11 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href={`https://wa.me/${contactInfo.phone}`}
              target="_blank"
              rel="noreferrer"
              className="w-11 h-11 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
            >
              <Phone className="w-5 h-5 text-emerald-400" />
            </a>
          </div>
        </div>

        <div className="max-w-md mx-auto h-px bg-white/5"></div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto text-xs text-gray-600 font-mono">
          <div>
            <span>© {new Date().getFullYear()} MONTE PORK. Todos los derechos reservados.</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-red-500/80 font-bold bg-red-500/5 border border-red-500/10 px-3 py-1 rounded-md uppercase tracking-wider text-[10px]">
              IMPUESTOS NO INCLUIDOS
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
