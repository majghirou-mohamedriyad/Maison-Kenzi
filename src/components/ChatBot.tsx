/**
 * Assistant Virtuel & Conciergerie ChatBot — Maison Kenzi
 * Support bilingue FR / EN avec assistance directe WhatsApp et FAQ instantanée.
 */
import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Sparkles, Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useLanguage } from "@/contexts/LanguageContext";

type QA = { id: string; question: string; answer: string };
type Msg = { id: string; from: "bot" | "user"; text: string };

const uid = () => Math.random().toString(36).slice(2);

const WhatsAppIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.461c-1.884 0-3.649-.508-5.176-1.393l-.371-.215-3.847 1.009 1.026-3.748-.236-.375c-.97-1.545-1.482-3.344-1.482-5.187 0-5.385 4.381-9.766 9.766-9.766 5.384 0 9.765 4.381 9.765 9.766 0 5.384-4.381 9.765-9.765 9.765m0-21.5c-6.48 0-11.754 5.274-11.754 11.754 0 2.07.539 4.095 1.562 5.88l-1.658 6.059 6.2-1.626c1.716.936 3.659 1.44 5.65 1.44 6.479 0 11.754-5.274 11.754-11.754s-5.275-11.753-11.754-11.753" />
  </svg>
);

const DEFAULT_QAS_FR: QA[] = [
  {
    id: "qa-1",
    question: "Quels sont vos délais d'expédition et de livraison ?",
    answer: "Nous assurons la livraison partout au Maroc (24-48h) et en Europe (3-5 jours ouvrés). L'expédition est soignée et chaque colis bénéficie d'un numéro de suivi direct.",
  },
  {
    id: "qa-2",
    question: "Vos parfums sont-ils 100% authentiques ?",
    answer: "Garantie 100% Authenticité. Tous nos flacons et jus proviennent directement des circuits officiels des plus prestigieuses maisons de haute parfumerie.",
  },
  {
    id: "qa-3",
    question: "Comment choisir le format idéal (5ml, 10ml, Flacon) ?",
    answer: "• 5ml (~75 pulvérisations) : Idéal pour découvrir et tester sur votre peau.\n• 10ml (~150 pulvérisations) : Format voyage pour 3 à 4 semaines.\n• Flacon complet : Pour votre signature olfactive quotidienne.",
  },
  {
    id: "qa-4",
    question: "Quel est le mode de règlement accepté ?",
    answer: "Le règlement s'effectue de manière sécurisée par internet lors de la commande (carte bancaire et protocoles de chiffrement SSL).",
  },
  {
    id: "qa-5",
    question: "Quelle est votre politique de retour ou d'échange ?",
    answer: "Afin de préserver l'intégrité, l'hygiène et l'authenticité inviolable de chaque fragrance, toutes les ventes sont définitives. Aucun retour ni échange n'est accepté une fois le colis expédié.",
  },
  {
    id: "qa-6",
    question: "Proposez-vous des coffrets et packs découverte ?",
    answer: "Oui, explorez notre sélection de Packs Découverte dans l'onglet Collection pour des harmonies olfactives exclusives.",
  },
];

const DEFAULT_QAS_EN: QA[] = [
  {
    id: "qa-1",
    question: "What are your shipping and delivery lead times?",
    answer: "We deliver across Morocco (24-48h) and throughout Europe (3-5 business days). Shipping is secure and every parcel receives a direct live tracking number.",
  },
  {
    id: "qa-2",
    question: "Are your perfumes 100% genuine and sealed?",
    answer: "100% Authenticity Guarantee. All our bottles and essences are sourced directly from authorized channels of the finest haute parfumerie houses.",
  },
  {
    id: "qa-3",
    question: "How do I choose the ideal bottle size?",
    answer: "• 5ml (~75 sprays): Ideal to explore and test on your skin.\n• 10ml (~150 sprays): Travel format for 3 to 4 weeks.\n• Full Bottle: For your daily signature sillage.",
  },
  {
    id: "qa-4",
    question: "What payment methods are supported?",
    answer: "Payment is processed 100% securely online via encrypted SSL card checkout upon placing your order.",
  },
  {
    id: "qa-5",
    question: "What is your return and exchange policy?",
    answer: "To preserve hygiene, pure essence preservation, and the inviolable seal of every fragrance, all sales are final once dispatched.",
  },
  {
    id: "qa-6",
    question: "Do you offer discovery sets and bundles?",
    answer: "Yes, explore our curated selection of Discovery Sets in the Collection section for exclusive olfactory harmonies.",
  },
];

const ChatBot = () => {
  const { settings } = useAppSettings();
  const { language } = useLanguage();
  const isEn = language === "en";

  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [qas, setQas] = useState<QA[]>(isEn ? DEFAULT_QAS_EN : DEFAULT_QAS_FR);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const rawPhone = settings.whatsapp_phone || settings.store_phone || "212652535301";
  const waNumber = rawPhone.replace(/[^0-9]/g, "") || "212652535301";
  const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    isEn ? "Hello Maison Kenzi, I would like information about your fragrances." : "Bonjour Maison Kenzi, je souhaite avoir des informations sur vos parfums."
  )}`;
  const instagramUrl = settings.instagram_url || "https://www.instagram.com/maisonkenzi";

  useEffect(() => {
    setQas(isEn ? DEFAULT_QAS_EN : DEFAULT_QAS_FR);
  }, [isEn]);

  useEffect(() => {
    if (!settings.bot_enabled) return;
    supabase
      .from("bot_qa")
      .select("id, question, answer")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setQas(data as QA[]);
      });
  }, [settings.bot_enabled]);

  useEffect(() => {
    if (open && messages.length === 0) {
      const welcomeMsg = isEn
        ? "Hello, welcome to Maison Kenzi! How may I assist you in discovering our fragrances?"
        : (settings.bot_welcome || "Bonjour, bienvenue chez Maison Kenzi ! Comment puis-je vous aider aujourd'hui ?");
      setMessages([{ id: uid(), from: "bot", text: welcomeMsg }]);
    }
  }, [open, settings.bot_welcome, messages.length, isEn]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const ask = (qa: QA) => {
    setMessages((m) => [...m, { id: uid(), from: "user", text: qa.question }]);
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { id: uid(), from: "bot", text: qa.answer }]);
      setTyping(false);
    }, 700);
  };

  const contactWhatsapp = () => {
    window.open(whatsappUrl, "_blank");
  };

  return (
    <>
      {/* Single Luxury Floating Trigger Pill */}
      <div className="fixed bottom-5 right-4 sm:right-6 z-[60] pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            if (open) {
              setOpen(false);
            } else {
              setMenuOpen((v) => !v);
            }
          }}
          className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-black/90 hover:bg-black text-white border border-primary/40 shadow-2xl backdrop-blur-xl transition-all duration-300 active:scale-95 cursor-pointer hover:border-primary"
          aria-label={isEn ? "Need assistance" : "Besoin d'aide"}
        >
          {open || menuOpen ? (
            <>
              <X className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold tracking-wider uppercase">
                {isEn ? "Close" : "Fermer"}
              </span>
            </>
          ) : (
            <>
              <div className="relative flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <span className="text-xs font-semibold tracking-wider uppercase">
                {isEn ? "Need Help?" : "Besoin d'Aide ?"}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Luxury Contact Speed Dial Sheet (Modal when menuOpen) */}
      {menuOpen && !open && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[65] animate-in fade-in duration-200"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed bottom-20 right-4 sm:right-6 z-[70] w-[min(340px,calc(100vw-2rem))] bg-card border border-primary/30 rounded-3xl p-4 shadow-2xl backdrop-blur-2xl space-y-2.5 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="flex items-center justify-between px-1 pb-1 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {isEn ? "Maison Kenzi Assistance" : "Assistance Maison Kenzi"}
                </span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. WhatsApp Action */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 text-foreground hover:bg-[#25D366]/20 transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <WhatsAppIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-foreground group-hover:text-[#25D366] transition-colors">
                  {isEn ? "WhatsApp Direct" : "WhatsApp Direct"}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {isEn ? "Instant fast assistance" : "Réponse rapide par message"}
                </div>
              </div>
            </a>

            {/* 2. Virtual Assistant IA Action */}
            {settings.bot_enabled && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setOpen(true);
                }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-primary/10 border border-primary/30 text-foreground hover:bg-primary/20 transition-all group w-full text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {isEn ? "AI Virtual Assistant" : "Assistant Virtuel IA"}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {isEn ? "Perfume advice & instant FAQ" : "Conseils parfums & FAQ instantanés"}
                  </div>
                </div>
              </button>
            )}

            {/* 3. Instagram Action */}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/80 border border-border text-foreground hover:border-primary/40 transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                  <Instagram className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {isEn ? "Official Instagram" : "Instagram Officiel"}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    @maisonkenzii
                  </div>
                </div>
              </a>
            )}
          </div>
        </>
      )}

      {/* Chat Window */}
      {settings.bot_enabled && open && (
        <div
          className="fixed bottom-20 right-4 z-[70] w-[min(340px,calc(100vw-1.5rem))] h-[min(460px,calc(100vh-7rem))] bg-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden origin-bottom-right backdrop-blur-2xl"
          style={{ animation: "chatbot-in 280ms cubic-bezier(0.16,1,0.3,1)" }}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-secondary border-b border-border flex items-center gap-3 text-foreground">
            <div className="relative w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 border border-primary/30">
              <Sparkles className="w-4 h-4" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate">{settings.bot_name || "Maison Kenzi Bot"}</div>
              <div className="text-[10px] text-muted-foreground">
                {isEn ? "Online · Maison Kenzi Concierge" : "En ligne · Support Maison Kenzi"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-full hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label={isEn ? "Close" : "Fermer"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-background/50"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
                style={{ animation: "chatbot-msg 260ms ease-out" }}
              >
                <div
                  className={`max-w-[82%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-xs whitespace-pre-wrap ${m.from === "user"
                      ? "bg-primary text-primary-foreground font-medium rounded-br-xs"
                      : "bg-card text-foreground border border-border rounded-bl-xs"
                    }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start" style={{ animation: "chatbot-msg 260ms ease-out" }}>
                <div className="bg-card border border-border px-3.5 py-2.5 rounded-2xl rounded-bl-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" style={{ animation: "chatbot-dot 1.2s infinite", animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" style={{ animation: "chatbot-dot 1.2s infinite", animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" style={{ animation: "chatbot-dot 1.2s infinite", animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          {/* Quick questions */}
          <div className="border-t border-border bg-card px-3 py-3 space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
              {isEn ? "Frequently Asked Questions" : "Questions fréquentes"}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto no-scrollbar">
              {qas.length === 0 && (
                <div className="text-xs text-muted-foreground px-1">
                  {isEn ? "No questions configured." : "Aucune question configurée."}
                </div>
              )}
              {qas.map((qa) => (
                <button
                  key={qa.id}
                  type="button"
                  onClick={() => ask(qa)}
                  className="text-xs px-2.5 py-1 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground border border-border text-foreground transition-colors cursor-pointer text-left"
                >
                  {qa.question}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={contactWhatsapp}
              className="w-full mt-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <WhatsAppIcon className="w-4 h-4" /> {isEn ? "Chat on WhatsApp" : "Discuter sur WhatsApp"}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatbot-in {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatbot-msg {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes chatbot-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default ChatBot;
