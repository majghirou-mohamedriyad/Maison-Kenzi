/**
 * Page Dédiée Connexion & Inscription — Maison Kenzi
 *
 * Permet l'authentification directe ou la création d'un compte client
 * (Nom, Prénom, Email, Téléphone, Date de Naissance, Mot de passe).
 * Redirige automatiquement vers /compte ou la page précédente après connexion.
 */

import React, { useState, useEffect } from "react";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  ArrowRight,
  Loader2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

const Auth: React.FC = () => {
  const { customer, isAuthenticated, isLoading, signIn, signUp } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [tab, setTab] = useState<"login" | "register">("login");

  // Rediriger vers /compte si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || "/compte";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Formulaire Inscription
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");

  // Formulaire Connexion
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    await signIn(loginEmail, loginPassword);
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !phone || !birthDate || !password) return;
    await signUp({
      firstName,
      lastName,
      email,
      phone,
      birthDate,
      password,
    });
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#0c0d12] text-foreground flex flex-col font-sans">
      <Seo
        title={tab === "login" ? "Connexion | Maison Kenzi" : "Création de Compte | Maison Kenzi"}
        description="Connectez-vous ou créez votre compte Maison Kenzi pour commander nos créations olfactives exclusives et gérer vos commandes."
      />

      <Header />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="w-full max-w-lg bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in-0 duration-300">
          {/* En-tête */}
          <div className="bg-gradient-to-br from-primary/15 via-background to-background p-6 sm:p-8 border-b border-border/50 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-3 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-light text-foreground">
              {tab === "login" ? "Espace Client Privé" : "Rejoindre Maison Kenzi"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              {tab === "login"
                ? "Identifiez-vous pour valider votre commande et accéder à vos privilèges."
                : "Créez votre compte client pour commander et profiter d'un service d'exception."}
            </p>

            {/* Onglets */}
            <div className="flex bg-muted/60 dark:bg-white/5 p-1 rounded-2xl mt-6 border border-border/60 max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => setTab("login")}
                className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  tab === "login"
                    ? "bg-background text-foreground shadow-sm dark:bg-card"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => setTab("register")}
                className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  tab === "register"
                    ? "bg-background text-foreground shadow-sm dark:bg-card"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Créer un compte
              </button>
            </div>
          </div>

          {/* Formulaires */}
          <div className="p-6 sm:p-8">
            {tab === "login" ? (
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
                      placeholder="votre.email@exemple.com"
                      className="pl-10 h-11 rounded-xl bg-background/50 border-border/80 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 h-11 rounded-xl bg-background/50 border-border/80 focus:border-primary"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !loginEmail || !loginPassword}
                  className="w-full h-11 rounded-xl font-medium tracking-wide uppercase text-xs shadow-md bg-foreground text-background hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
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

                <div className="text-center pt-3">
                  <p className="text-xs text-muted-foreground">
                    Vous n'avez pas encore de compte ?{" "}
                    <button
                      type="button"
                      onClick={() => setTab("register")}
                      className="text-primary font-semibold hover:underline cursor-pointer"
                    >
                      Créer un compte
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-foreground">Prénom *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Prénom"
                        className="pl-9 h-10 text-xs rounded-xl bg-background/50 border-border/80 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-foreground">Nom *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Nom"
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
                      className="pl-10 h-10 text-xs rounded-xl bg-background/50 border-border/80 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
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

                  <div className="space-y-1">
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
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Au moins 6 caractères"
                      className="pl-10 h-10 text-xs rounded-xl bg-background/50 border-border/80 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Données confidentielles et sécurisées selon les standards de Maison Kenzi.</span>
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
                  className="w-full h-11 rounded-xl font-medium tracking-wide uppercase text-xs shadow-md bg-foreground text-background hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 mt-3 cursor-pointer"
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

                <div className="text-center pt-2">
                  <p className="text-xs text-muted-foreground">
                    Vous possédez déjà un compte ?{" "}
                    <button
                      type="button"
                      onClick={() => setTab("login")}
                      className="text-primary font-semibold hover:underline cursor-pointer"
                    >
                      Se connecter
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;
