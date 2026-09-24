/**
 * Page Espace Client & Profil — Maison Kenzi
 *
 * Affiche l'ensemble des détails du client :
 * - Nom
 * - Prénom
 * - Adresse Email
 * - Numéro de téléphone
 * - Date de naissance
 * - Adresse & Ville de livraison
 * Permet l'édition en temps réel des informations personnelles et le suivi des commandes.
 * Intègre directement le formulaire de connexion / création de compte si le client n'est pas encore identifié.
 * Conforme aux règles strictes : zéro emoji, icônes lucide-react exclusives, commentaires en français.
 */

import React, { useState, useEffect } from "react";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Link, useNavigate } from "react-router-dom";
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
  MapPin,
  Lock,
  LogOut,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Edit3,
  Check,
  X,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatMAD } from "@/lib/sizes";
import { ORDER_STATUS_LABEL, type Order } from "@/types/database";
import { toast } from "sonner";

const Account: React.FC = () => {
  const {
    customer,
    isAuthenticated,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  } = useCustomerAuth();
  const navigate = useNavigate();

  // Onglet pour les visiteurs non connectés (connexion ou inscription)
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  // Formulaire d'inscription inline
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regBirthDate, setRegBirthDate] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Formulaire de connexion inline
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // État d'édition du profil connecté
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Historique des commandes
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Initialisation des données du profil connecté
  useEffect(() => {
    if (customer) {
      setFirstName(customer.first_name || "");
      setLastName(customer.last_name || "");
      setPhone(customer.phone || "");
      setBirthDate(customer.birth_date || "");
      setAddress(customer.address || "");
      setCity(customer.city || "");
    }
  }, [customer]);

  // Chargement des commandes du client connecté
  useEffect(() => {
    const fetchCustomerOrders = async () => {
      if (!customer?.email && !customer?.phone) return;
      setIsLoadingOrders(true);
      try {
        let query = supabase.from("orders").select("*").order("created_at", { ascending: false });

        if (customer.email && customer.phone) {
          query = query.or(`customer_email.eq.${customer.email},customer_phone.eq.${customer.phone}`);
        } else if (customer.email) {
          query = query.eq("customer_email", customer.email);
        } else if (customer.phone) {
          query = query.eq("customer_phone", customer.phone);
        }

        const { data, error } = await query;
        if (!error && data) {
          setOrders(data as Order[]);
        }
      } catch (err) {
        console.warn("Erreur chargement commandes client :", err);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    if (isAuthenticated) {
      fetchCustomerOrders();
    }
  }, [customer, isAuthenticated]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    await signIn(loginEmail, loginPassword);
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFirstName || !regLastName || !regEmail || !regPhone || !regBirthDate || !regPassword) {
      toast.error("Veuillez renseigner tous les champs obligatoires.");
      return;
    }
    await signUp({
      firstName: regFirstName,
      lastName: regLastName,
      email: regEmail,
      phone: regPhone,
      birthDate: regBirthDate,
      password: regPassword,
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !birthDate) {
      toast.error("Veuillez renseigner les champs obligatoires (Nom, Prénom, Téléphone, Date de naissance).");
      return;
    }

    setIsSaving(true);
    const { error } = await updateProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      birth_date: birthDate,
      address: address.trim(),
      city: city.trim(),
    });

    setIsSaving(false);
    if (!error) {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    if (customer) {
      setFirstName(customer.first_name || "");
      setLastName(customer.last_name || "");
      setPhone(customer.phone || "");
      setBirthDate(customer.birth_date || "");
      setAddress(customer.address || "");
      setCity(customer.city || "");
    }
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      <Seo
        title="Mon Compte Client | Maison Kenzi"
        description="Consultez et gérez vos informations personnelles, vos coordonnées et l'historique de vos commandes de haute parfumerie."
        path="/compte"
      />

      <Header />

      <main className="flex-1 pt-28 sm:pt-36 pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            /* Chargement initial */
            <div className="py-24 text-center space-y-4">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground uppercase tracking-widest">
                Chargement de votre espace privé...
              </p>
            </div>
          ) : !isAuthenticated ? (
            /* Vue Formulaire Connexion / Inscription si non connecté */
            <div className="max-w-lg mx-auto bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
              {/* En-tête de Prestige */}
              <div className="bg-gradient-to-br from-primary/15 via-background to-background p-6 sm:p-8 border-b border-border/50 text-center">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-3 shadow-inner">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-light text-foreground">
                  {authTab === "login" ? "Espace Client Privé" : "Créer votre Compte"}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  {authTab === "login"
                    ? "Connectez-vous pour accéder à vos détails personnels et vos commandes."
                    : "Rejoignez Maison Kenzi pour enregistrer vos coordonnées et commander nos créations."}
                </p>

                {/* Sélecteur d'Onglets */}
                <div className="flex bg-muted/60 dark:bg-white/5 p-1 rounded-2xl mt-6 border border-border/60 max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={() => setAuthTab("login")}
                    className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                      authTab === "login"
                        ? "bg-background text-foreground shadow-sm dark:bg-card"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Connexion
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthTab("register")}
                    className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                      authTab === "register"
                        ? "bg-background text-foreground shadow-sm dark:bg-card"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Inscription
                  </button>
                </div>
              </div>

              {/* Formulaires Connexion / Inscription */}
              <div className="p-6 sm:p-8">
                {authTab === "login" ? (
                  /* Formulaire Connexion */
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
                      disabled={!loginEmail || !loginPassword}
                      className="w-full h-11 rounded-xl font-medium tracking-wide uppercase text-xs shadow-md bg-foreground text-background hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
                    >
                      <span>Se connecter</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>

                    <div className="text-center pt-2">
                      <p className="text-xs text-muted-foreground">
                        Vous n'avez pas encore de compte ?{" "}
                        <button
                          type="button"
                          onClick={() => setAuthTab("register")}
                          className="text-primary font-semibold hover:underline cursor-pointer"
                        >
                          Créer un compte
                        </button>
                      </p>
                    </div>
                  </form>
                ) : (
                  /* Formulaire Inscription */
                  <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-foreground">Prénom *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            type="text"
                            required
                            value={regFirstName}
                            onChange={(e) => setRegFirstName(e.target.value)}
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
                            value={regLastName}
                            onChange={(e) => setRegLastName(e.target.value)}
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
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
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
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
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
                            value={regBirthDate}
                            onChange={(e) => setRegBirthDate(e.target.value)}
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
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Au moins 6 caractères"
                          className="pl-10 h-10 text-xs rounded-xl bg-background/50 border-border/80 focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Données confidentielles et sécurisées selon les normes Maison Kenzi.</span>
                    </div>

                    <Button
                      type="submit"
                      disabled={
                        !regFirstName ||
                        !regLastName ||
                        !regEmail ||
                        !regPhone ||
                        !regBirthDate ||
                        !regPassword ||
                        regPassword.length < 6
                      }
                      className="w-full h-11 rounded-xl font-medium tracking-wide uppercase text-xs shadow-md bg-foreground text-background hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 mt-3 cursor-pointer"
                    >
                      <span>Créer mon compte</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>

                    <div className="text-center pt-2">
                      <p className="text-xs text-muted-foreground">
                        Vous avez déjà un compte ?{" "}
                        <button
                          type="button"
                          onClick={() => setAuthTab("login")}
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
          ) : (
            /* Vue Profil Connecté */
            <div className="space-y-8 sm:space-y-10 animate-in fade-in-0 duration-300">
              {/* Bannière de Bienvenue */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-sm relative overflow-hidden">
                <div className="space-y-1.5 z-10">
                  <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-widest">
                    <Sparkles className="w-4 h-4" />
                    <span>Espace Client Privilège</span>
                  </div>
                  <h1 className="font-serif text-2xl sm:text-4xl font-light text-foreground">
                    Bonjour, {customer?.first_name} {customer?.last_name}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Membre Maison Kenzi • {customer?.email}
                  </p>
                </div>

                <div className="flex items-center gap-3 z-10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut()}
                    className="rounded-xl border-border/80 text-xs font-semibold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Déconnexion</span>
                  </Button>
                </div>
              </div>

              {/* Fiche Détails Personnels */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Informations Personnelles (2 Colonnes) */}
                <div className="lg:col-span-2 bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center justify-between pb-6 mb-6 border-b border-border/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-serif text-lg sm:text-xl font-medium text-foreground">
                          Détails Personnels
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Coordonnées utilisées lors de vos commandes
                        </p>
                      </div>
                    </div>

                    {!isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="rounded-xl border-border/80 text-xs font-medium gap-1.5 hover:border-primary hover:text-primary cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Modifier</span>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        className="rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        <span>Annuler</span>
                      </Button>
                    )}
                  </div>

                  {!isEditing ? (
                    /* Vue lecture seule */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {/* Nom */}
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                          Nom de famille
                        </span>
                        <p className="text-sm font-medium text-foreground">
                          {customer?.last_name || "Non renseigné"}
                        </p>
                      </div>

                      {/* Prénom */}
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                          Prénom
                        </span>
                        <p className="text-sm font-medium text-foreground">
                          {customer?.first_name || "Non renseigné"}
                        </p>
                      </div>

                      {/* Email */}
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                          Adresse Email
                        </span>
                        <p className="text-sm font-medium text-foreground truncate">
                          {customer?.email}
                        </p>
                      </div>

                      {/* Téléphone */}
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                          Numéro de Téléphone
                        </span>
                        <p className="text-sm font-medium text-foreground">
                          {customer?.phone || "Non renseigné"}
                        </p>
                      </div>

                      {/* Date de Naissance */}
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-1 sm:col-span-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                          Date de Naissance
                        </span>
                        <p className="text-sm font-medium text-foreground">
                          {customer?.birth_date
                            ? new Date(customer.birth_date).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : "Non renseignée"}
                        </p>
                      </div>

                      {/* Adresse & Ville */}
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-1 sm:col-span-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                          Adresse de Livraison Enregistrée
                        </span>
                        <p className="text-sm font-medium text-foreground">
                          {customer?.address ? (
                            <>
                              {customer.address}
                              {customer.city ? `, ${customer.city}` : ""}
                              {customer.country ? ` (${customer.country})` : ""}
                            </>
                          ) : (
                            <span className="text-muted-foreground italic">
                              Non renseignée (sera enregistrée lors de votre commande)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Formulaire d'édition */
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Prénom *</Label>
                          <Input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="h-10 rounded-xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Nom *</Label>
                          <Input
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="h-10 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Numéro de téléphone *</Label>
                          <Input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+32 470 12 34 56"
                            className="h-10 rounded-xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Date de naissance *</Label>
                          <Input
                            type="date"
                            required
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="h-10 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1 sm:col-span-2">
                          <Label className="text-xs font-medium">Adresse</Label>
                          <Input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Rue, quartier, numéro..."
                            className="h-10 rounded-xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Ville</Label>
                          <Input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Ex: Casablanca, Rabat, Paris..."
                            className="h-10 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="rounded-xl text-xs font-medium cursor-pointer"
                        >
                          Annuler
                        </Button>
                        <Button
                          type="submit"
                          disabled={isSaving}
                          className="rounded-xl text-xs font-semibold uppercase tracking-wider bg-foreground text-background hover:bg-foreground/90 gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isSaving ? "Enregistrement..." : "Enregistrer"}</span>
                        </Button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Volet Latéral Conciergerie */}
                <div className="space-y-6">
                  <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-serif text-base font-medium text-foreground">
                        Sécurité & Confidentialité
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Vos informations personnelles sont sécurisées et strictement réservées à la préparation de vos colis Maison Kenzi.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-border/50">
                      <Link
                        to="/collection/all"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        <span>Explorer la collection</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-serif text-base font-medium text-foreground">
                        Suivi en Temps Réel
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Consultez l'avancement de vos envois à tout moment grâce à votre code de référence.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-border/50">
                      <Link
                        to="/suivi-commande"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        <span>Accéder au suivi direct</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historique des Commandes */}
              <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-serif text-lg sm:text-xl font-medium text-foreground">
                        Mes Commandes
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Historique de vos commandes passées chez Maison Kenzi
                      </p>
                    </div>
                  </div>
                </div>

                {isLoadingOrders ? (
                  <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p>Chargement de vos commandes...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <Package className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                    <p className="text-sm font-medium text-foreground">Aucune commande enregistrée</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Vous n'avez pas encore passé de commande avec ce compte. Découvrez nos créations olfactives.
                    </p>
                    <div className="pt-2">
                      <Link to="/collection/all">
                        <Button className="rounded-xl text-xs uppercase tracking-wider font-semibold bg-foreground text-background hover:bg-foreground/90 cursor-pointer">
                          Découvrir les créations
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const statusLabel = ORDER_STATUS_LABEL[order.status] || order.status;
                      let statusColor = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
                      if (order.status === "confirmee") {
                        statusColor = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
                      } else if (order.status === "livree") {
                        statusColor = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
                      } else if (order.status === "annulee") {
                        statusColor = "bg-destructive/10 text-destructive border-destructive/20";
                      }

                      return (
                        <div
                          key={order.id}
                          className="p-5 rounded-2xl bg-muted/20 border border-border/60 hover:border-primary/40 transition-all space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-sm font-bold text-foreground">
                                #{order.order_number}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColor}`}
                              >
                                {statusLabel}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          {/* Liste des articles */}
                          <div className="space-y-1.5 py-1">
                            {order.items?.map((it, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs text-foreground/90"
                              >
                                <span>
                                  {it.name || it.parfum_name || "Extrait de Parfum"} ({it.size || "10ml"}) x{it.quantity}
                                </span>
                                <span className="font-medium text-foreground">
                                  {formatMAD((it.price || it.unit_price || 0) * (it.quantity || 1))}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs">
                            <span className="text-muted-foreground">Montant Total :</span>
                            <span className="font-serif text-base font-bold text-primary">
                              {formatMAD(order.total_amount)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Account;
