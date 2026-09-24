/**
 * Contexte d'Authentification & Gestion de Profil Client — Maison Kenzi
 *
 * Gère l'état de session utilisateur, l'inscription, la connexion, la déconnexion
 * et la mise à jour des informations personnelles (Nom, Prénom, Email, Téléphone, Date de Naissance).
 * Synchronise les données avec Supabase Auth et le stockage local de secours.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { CustomerProfile, CustomerAuthContextType, CustomerSignUpData } from "@/types/customer";
import { toast } from "sonner";

const LOCAL_STORAGE_KEY = "mk_customer_profile";

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<CustomerProfile | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.email && (parsed.first_name || parsed.birth_date)) {
            return parsed;
          } else {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
          }
        } catch {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          return null;
        }
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");

  // Charge le profil depuis une session Supabase ou le stockage local
  const loadProfileFromUser = useCallback(async (user: any) => {
    if (!user) {
      setCustomer(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      return;
    }

    const meta = user.user_metadata || {};
    const localSaved = localStorage.getItem(LOCAL_STORAGE_KEY);

    // Vérifier si l'utilisateur est bien un client (et non un administrateur sans profil client)
    const hasCustomerMeta = Boolean(meta.first_name || meta.birth_date || meta.role === "customer");
    if (!hasCustomerMeta && !localSaved) {
      setCustomer(null);
      return;
    }

    let parsedLocal: Partial<CustomerProfile> = {};
    if (localSaved) {
      try {
        parsedLocal = JSON.parse(localSaved);
      } catch {
        parsedLocal = {};
      }
    }

    const firstName = meta.first_name || parsedLocal.first_name || "";
    const lastName = meta.last_name || parsedLocal.last_name || "";
    const birthDate = meta.birth_date || parsedLocal.birth_date || "";

    // Si aucune donnée client (prénom, nom ou date de naissance), ne pas connecter
    if (!firstName && !lastName && !birthDate) {
      setCustomer(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      return;
    }

    const profile: CustomerProfile = {
      id: user.id,
      email: user.email || parsedLocal.email || "",
      first_name: firstName,
      last_name: lastName,
      phone: meta.phone || parsedLocal.phone || "",
      birth_date: birthDate,
      address: meta.address || parsedLocal.address || "",
      city: meta.city || parsedLocal.city || "",
      country: meta.country || parsedLocal.country || "Maroc",
      created_at: user.created_at || new Date().toISOString(),
    };

    setCustomer(profile);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
  }, []);

  // Initialisation de la session Supabase
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          await loadProfileFromUser(session.user);
        } else {
          // Vérification du stockage local si pas de session active
          const localSaved = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (localSaved && isMounted) {
            try {
              const parsed = JSON.parse(localSaved);
              if (parsed.email) {
                setCustomer(parsed);
              }
            } catch {
              localStorage.removeItem(LOCAL_STORAGE_KEY);
            }
          }
        }
      } catch (err) {
        console.warn("Erreur lors de l'initialisation de l'authentification client :", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    // Écouteur des changements d'état d'authentification Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadProfileFromUser(session.user);
      } else {
        const localSaved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!localSaved) {
          setCustomer(null);
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [loadProfileFromUser]);

  const openAuthModal = (tab: "login" | "register" = "login") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Inscription
  const signUp = async (data: CustomerSignUpData): Promise<{ error: Error | null }> => {
    setIsLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
          data: {
            first_name: data.firstName.trim(),
            last_name: data.lastName.trim(),
            phone: data.phone.trim(),
            birth_date: data.birthDate,
          },
        },
      });

      if (error) throw error;

      const newProfile: CustomerProfile = {
        id: authData.user?.id || `client_${Date.now()}`,
        email: data.email.trim().toLowerCase(),
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        phone: data.phone.trim(),
        birth_date: data.birthDate,
        created_at: new Date().toISOString(),
      };

      setCustomer(newProfile);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newProfile));

      // Synchronisation avec la table 'customers' si possible
      try {
        await supabase.from("customers").upsert({
          email: newProfile.email,
          name: `${newProfile.first_name} ${newProfile.last_name}`.trim(),
          first_name: newProfile.first_name,
          last_name: newProfile.last_name,
          phone: newProfile.phone,
          birth_date: newProfile.birth_date,
          created_at: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.warn("Note synchronisation table customers :", dbErr);
      }

      toast.success("Compte créé avec succès !", {
        description: `Bienvenue chez Maison Kenzi, ${newProfile.first_name}.`,
      });

      closeAuthModal();
      return { error: null };
    } catch (err: any) {
      console.error("Erreur d'inscription client :", err);
      toast.error("Erreur lors de la création du compte", {
        description: err.message || "Une erreur est survenue lors de l'enregistrement.",
      });
      return { error: err };
    } finally {
      setIsLoading(false);
    }
  };

  // Connexion
  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      if (data.user) {
        await loadProfileFromUser(data.user);
      }

      toast.success("Connexion réussie !", {
        description: "Ravi de vous revoir chez Maison Kenzi.",
      });

      closeAuthModal();
      return { error: null };
    } catch (err: any) {
      console.error("Erreur de connexion client :", err);
      toast.error("Échec de la connexion", {
        description: err.message || "Email ou mot de passe incorrect.",
      });
      return { error: err };
    } finally {
      setIsLoading(false);
    }
  };

  // Déconnexion
  const signOut = async () => {
    setIsLoading(true);
    try {
      setCustomer(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      await supabase.auth.signOut().catch(() => {});
    } finally {
      setCustomer(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setIsLoading(false);
      toast.info("Déconnexion effectuée", {
        description: "À très bientôt sur Maison Kenzi.",
      });
    }
  };

  // Mise à jour du profil
  const updateProfile = async (
    updates: Partial<Omit<CustomerProfile, "id" | "email">>
  ): Promise<{ error: Error | null }> => {
    if (!customer) {
      return { error: new Error("Aucun client connecté") };
    }

    setIsLoading(true);
    try {
      const updatedProfile: CustomerProfile = {
        ...customer,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Mise à jour métadonnées Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: updatedProfile.first_name,
          last_name: updatedProfile.last_name,
          phone: updatedProfile.phone,
          birth_date: updatedProfile.birth_date,
          address: updatedProfile.address,
          city: updatedProfile.city,
          country: updatedProfile.country,
        },
      });

      if (authError) {
        console.warn("Mise à jour Auth Supabase note :", authError.message);
      }

      // Synchronisation table customers
      try {
        await supabase.from("customers").upsert({
          email: updatedProfile.email,
          name: `${updatedProfile.first_name} ${updatedProfile.last_name}`.trim(),
          first_name: updatedProfile.first_name,
          last_name: updatedProfile.last_name,
          phone: updatedProfile.phone,
          birth_date: updatedProfile.birth_date,
          address: updatedProfile.address ? `${updatedProfile.address}, ${updatedProfile.city || ""}` : undefined,
          city: updatedProfile.city,
          country: updatedProfile.country,
        });
      } catch (dbErr) {
        console.warn("Synchronisation table customers :", dbErr);
      }

      setCustomer(updatedProfile);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProfile));

      toast.success("Profil mis à jour", {
        description: "Vos informations personnelles ont été enregistrées.",
      });

      return { error: null };
    } catch (err: any) {
      console.error("Erreur de mise à jour du profil :", err);
      toast.error("Erreur lors de la mise à jour", {
        description: err.message || "Impossible de sauvegarder vos informations.",
      });
      return { error: err };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        isAuthenticated: !!customer,
        isLoading,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        signIn,
        signUp,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = (): CustomerAuthContextType => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth doit être utilisé au sein d'un CustomerAuthProvider");
  }
  return context;
};
