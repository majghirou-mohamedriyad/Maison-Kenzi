/**
 * Page de Connexion Administrateur — Maison Kenzi
 *
 * Interface d'authentification sécurisée avec design Luxe Nude,
 * typographie éditoriale haute parfumerie, micro-interactions soignées
 * et conformité stricte zéro emoji.
 */

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, ArrowLeft, Loader2, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/admin", { replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (err) {
        console.error("Erreur d'authentification admin :", err);
        const lowerMsg = (err.message || "").toLowerCase();
        if (
          lowerMsg.includes("invalid") ||
          lowerMsg.includes("credentials") ||
          lowerMsg.includes("grant")
        ) {
          setError("Identifiants incorrects. Veuillez vérifier votre adresse email et votre mot de passe.");
        } else if (lowerMsg.includes("too many") || lowerMsg.includes("rate")) {
          setError("Nombre excessif de tentatives. Par mesure de sécurité, veuillez patienter quelques minutes.");
        } else if (lowerMsg.includes("fetch") || lowerMsg.includes("network")) {
          setError("Connexion au serveur impossible. Vérifiez votre accès réseau.");
        } else {
          setError("Authentification échouée. Veuillez réessayer.");
        }
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      navigate("/admin", { replace: true });
    } catch (err) {
      setSubmitting(false);
      setError("Une erreur inattendue est survenue lors de la connexion.");
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#FAF7F2] dark:bg-[#0E0D0C] font-sans px-4 py-12 overflow-hidden selection:bg-[#C9A96E]/20 selection:text-[#C9A96E]">
      {/* Halos lumineux d'ambiance luxe */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#E5D7C5]/50 dark:bg-[#C9A96E]/10 blur-[100px] transform-gpu"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#D4C3AC]/40 dark:bg-[#C9A96E]/5 blur-[120px] transform-gpu"
      />

      <div className="w-full max-w-md relative z-10">
        {/* Lien retour boutique */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#8C827A] hover:text-[#1A1816] dark:text-[#9E958C] dark:hover:text-[#F3EFEA] transition-colors duration-300 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-1 transition-transform duration-300 stroke-[1.5]" />
            <span>Retour à la Maison</span>
          </Link>

          <span className="inline-flex items-center gap-1.5 text-[11px] tracking-wider uppercase text-[#C9A96E] border border-[#C9A96E]/30 bg-[#C9A96E]/5 px-2.5 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3 stroke-[1.75]" />
            <span>Portail Sécurisé</span>
          </span>
        </div>

        {/* Carte de connexion principale */}
        <div className="bg-[#FFFFFF]/90 dark:bg-[#151413]/90 backdrop-blur-xl border border-[#E8E1D7] dark:border-[#262320] shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] rounded-2xl p-8 sm:p-10 transition-all duration-300">

          {/* En-tête / Identité de marque */}
          <div className="flex flex-col items-center text-center mb-8">
            <Link to="/" className="inline-block mb-3 transition-transform hover:scale-105" title="Retour au site">
              <img
                src="/mk-logo.png"
                alt="Maison Kenzi"
                className="h-16 sm:h-20 w-auto object-contain dark:hidden"
              />
              <img
                src="/mk-logo.png"
                alt="Maison Kenzi"
                className="h-16 sm:h-20 w-auto object-contain hidden dark:block"
              />
            </Link>

            <span className="text-[10px] tracking-[0.35em] uppercase text-[#C9A96E] font-medium mb-1">
              Haute Parfumerie Privée
            </span>
            <h1 className="text-xl sm:text-2xl font-serif tracking-tight text-[#1A1816] dark:text-[#FBF9F5]">
              Espace Administration
            </h1>
            <p className="mt-2 text-xs text-[#7A726A] dark:text-[#A39B91] leading-relaxed max-w-xs">
              Authentification réservée à la direction et aux gestionnaires de la maison.
            </p>
          </div>

          {/* Formulaire de connexion */}
          <form onSubmit={submit} className="space-y-5">
            {/* Champ Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-email"
                className="block text-[11px] font-medium tracking-[0.15em] uppercase text-[#4A453E] dark:text-[#D1C9BF]"
              >
                Adresse Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9E958C]">
                  <Mail className="w-4 h-4 stroke-[1.5]" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  placeholder="direction@maisonkenzi.com"
                  className="w-full pl-10 pr-3.5 py-3 text-sm rounded-xl bg-[#FAF7F2]/80 dark:bg-[#1C1A17]/80 border border-[#E5DDD0] dark:border-[#2D2A26] text-[#1A1816] dark:text-[#F3EFEA] placeholder-[#A8A196] dark:placeholder-[#5E5851] focus:outline-none focus:border-[#C9A96E] focus:ring-1 focus:ring-[#C9A96E] transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-password"
                className="block text-[11px] font-medium tracking-[0.15em] uppercase text-[#4A453E] dark:text-[#D1C9BF]"
              >
                Code Secret / Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9E958C]">
                  <Lock className="w-4 h-4 stroke-[1.5]" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 text-sm rounded-xl bg-[#FAF7F2]/80 dark:bg-[#1C1A17]/80 border border-[#E5DDD0] dark:border-[#2D2A26] text-[#1A1816] dark:text-[#F3EFEA] placeholder-[#A8A196] dark:placeholder-[#5E5851] focus:outline-none focus:border-[#C9A96E] focus:ring-1 focus:ring-[#C9A96E] transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#9E958C] hover:text-[#1A1816] dark:hover:text-[#F3EFEA] transition-colors cursor-pointer"
                  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 stroke-[1.5]" />
                  ) : (
                    <Eye className="w-4 h-4 stroke-[1.5]" />
                  )}
                </button>
              </div>
            </div>

            {/* Affichage d'erreur élégant */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50/80 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs leading-relaxed animate-in fade-in duration-200">
                {error}
              </div>
            )}

            {/* Bouton de soumission luxe */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 relative group overflow-hidden bg-[#1A1816] hover:bg-[#2B2724] dark:bg-[#C9A96E] dark:hover:bg-[#B8985F] text-[#FBF9F5] dark:text-[#0E0D0C] py-3.5 px-6 rounded-xl text-xs uppercase tracking-[0.25em] font-medium transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin stroke-[2]" />
                  <span>Vérification…</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 stroke-[1.75]" />
                  <span>Accéder au Panneau</span>
                </>
              )}
            </button>
          </form>

          {/* Pied de carte */}
          <div className="mt-8 pt-6 border-t border-[#EAE3D8] dark:border-[#24211E] text-center">
            <p className="text-[11px] text-[#8C827A] dark:text-[#80776E] tracking-wide">
              Maison Kenzi Parfums · Espace de Gestion Privé
            </p>
          </div>
        </div>

        {/* Copyright */}
        <p className="mt-6 text-center text-[10px] uppercase tracking-[0.2em] text-[#9E958C] dark:text-[#665F57]">
          Confidentialité & Chiffrement SSL 256-bit
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
