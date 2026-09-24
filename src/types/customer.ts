/**
 * Types et Interfaces Client & Authentification — Maison Kenzi
 *
 * Définit la structure des données de profil client (Nom, Prénom, Email, Téléphone, Date de Naissance),
 * les états de session et les charges utiles de mise à jour.
 */

export interface CustomerProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  birth_date: string; // Format YYYY-MM-DD
  address?: string;
  city?: string;
  country?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerSignUpData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  password: string;
}

export interface CustomerAuthContextType {
  customer: CustomerProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: "login" | "register";
  openAuthModal: (tab?: "login" | "register") => void;
  closeAuthModal: () => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (data: CustomerSignUpData) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<CustomerProfile, "id" | "email">>) => Promise<{ error: Error | null }>;
}
