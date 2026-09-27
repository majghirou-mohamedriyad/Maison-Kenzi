/**
 * Fenêtre Modale d'Authentification Client — Maison Kenzi
 *
 * Interface élégante et sécurisée permettant aux clients de se connecter ou de créer un compte
 * (Nom, Prénom, Email, Téléphone, Date de Naissance, Mot de passe).
 * Conçue selon la charte graphique Luxury Nude & Dark Mode, sans aucun emoji.
 */

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

// Validation stricte du format d'adresse email
const isValidEmail = (val: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(val.trim());
};

export const CustomerAuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalTab, closeAuthModal, openAuthModal, signIn, signUp, isLoading } =
    useCustomerAuth();
  const { language } = useLanguage();

  // État du formulaire Inscription
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // État du formulaire Connexion
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) return;

    if (!isValidEmail(loginEmail)) {
      toast.error("Format d'email invalide", {
        description: "Veuillez saisir une adresse email valide (ex: contact@exemple.com).",
      });
      return;
    }

    await signIn(loginEmail.trim(), loginPassword);
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !birthDate || !password) {
      toast.error("Champs obligatoires manquants", {
        description: "Veuillez renseigner tous les champs du formulaire.",
      });
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Format d'email invalide", {
        description: "Veuillez saisir une adresse email valide (ex: contact@exemple.com).",
      });
      return;
    }

    if (password.length < 6) {
      toast.error("Mot de passe trop court", {
        description: "Le mot de passe doit comporter au moins 6 caractères.",
      });
      return;
    }

    await signUp({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      birthDate,
      password,
    });
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[480px] p-0 overflow-hidden bg-background/95 dark:bg-[#12141a]/95 backdrop-blur-2xl border-border/80 dark:border-white/10 shadow-2xl rounded-3xl max-h-[92vh] flex flex-col my-auto">
        {/* En-tête de Prestige Fixe */}
        <div className="bg-gradient-to-br from-primary/15 via-background to-background p-4 sm:p-6 border-b border-border/50 text-center relative shrink-0">
          <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-2.5 shadow-inner">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <DialogTitle className="font-serif text-xl sm:text-2xl font-light tracking-wide text-foreground">
            {authModalTab === "login" ? "Espace Client Privé" : "Créer votre Compte"}
          </DialogTitle>
          <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
            {authModalTab === "login"
              ? "Accédez à votre compte pour finaliser votre commande et suivre vos créations."
              : "Rejoignez Maison Kenzi pour commander nos extraits de prestige et bénéficier d'un suivi sur-mesure."}
          </DialogDescription>

          {/* Sélecteur d'Onglets Connexion / Inscription */}
          <div className="flex bg-muted/60 dark:bg-white/5 p-1 rounded-2xl mt-4 border border-border/60 max-w-sm mx-auto">
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className={`flex-1 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                authModalTab === "login"
                  ? "bg-background text-foreground shadow-sm dark:bg-card"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => openAuthModal("register")}
              className={`flex-1 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                authModalTab === "register"
                  ? "bg-background text-foreground shadow-sm dark:bg-card"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Création de Compte
            </button>
          </div>
        </div>

        {/* Corps des formulaires avec défilement fluide sur petits écrans */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {authModalTab === "login" ? (
            /* Formulaire de Connexion */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Adresse Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="exemple@email.com"
                    autoComplete="email"
                    className="pl-10 h-11 rounded-xl bg-background/50 border-border/80 focus:border-primary text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-medium text-foreground">Mot de passe</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="pl-10 pr-10 h-11 rounded-xl bg-background/50 border-border/80 focus:border-primary text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title={showLoginPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !loginEmail || !loginPassword}
                className="w-full h-11 rounded-xl font-medium tracking-wide uppercase text-xs shadow-md bg-foreground text-background hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  Pas encore de compte ?{" "}
                  <button
                    type="button"
                    onClick={() => openAuthModal("register")}
                    className="text-primary font-semibold hover:underline cursor-pointer"
                  >
                    Créer un compte
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* Formulaire d'Inscription */
            <form onSubmit={handleSignUpSubmit} className="space-y-3 sm:space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div className="space-y-1 min-w-0">
                  <Label className="text-xs font-medium text-foreground">Prénom *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Votre prénom"
                      className="pl-9 h-10 text-xs rounded-xl bg-background/50 border-border/80 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1 min-w-0">
                  <Label className="text-xs font-medium text-foreground">Nom *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Votre nom"
                      className="pl-9 h-10 text-xs rounded-xl bg-background/50 border-border/80 focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-foreground">Adresse Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@exemple.com"
                    autoComplete="email"
                    className="pl-10 h-10 text-xs rounded-xl bg-background/50 border-border/80 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div className="space-y-1 min-w-0">
                  <Label className="text-xs font-medium text-foreground">Numéro de téléphone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+32 470 12 34 56"
                      className="pl-9 h-10 text-xs rounded-xl bg-background/50 border-border/80 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1 min-w-0">
                  <Label className="text-xs font-medium text-foreground">Date de naissance *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="date"
                      required
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="pl-9 h-10 text-xs rounded-xl bg-background/50 border-border/80 focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-foreground">Mot de passe *</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showRegisterPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Au moins 6 caractères"
                    autoComplete="new-password"
                    className="pl-10 pr-10 h-10 text-xs rounded-xl bg-background/50 border-border/80 focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title={showRegisterPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showRegisterPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-start sm:items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 sm:mt-0" />
                <span className="leading-tight">Données protégées et confidentielles selon la charte Maison Kenzi.</span>
              </div>

              <Button
                type="submit"
                disabled={
                  isLoading ||
                  !firstName ||
                  !lastName ||
                  !email ||
                  !phone ||
                  !birthDate ||
                  !password ||
                  password.length < 6
                }
                className="w-full h-11 rounded-xl font-medium tracking-wide uppercase text-xs shadow-md bg-foreground text-background hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Créer mon compte</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="text-center pt-1 pb-1">
                <p className="text-xs text-muted-foreground">
                  Vous avez déjà un compte ?{" "}
                  <button
                    type="button"
                    onClick={() => openAuthModal("login")}
                    className="text-primary font-semibold hover:underline cursor-pointer"
                  >
                    Se connecter
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

