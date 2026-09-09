import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock } from "lucide-react";
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
        console.error("Auth login error:", err);
        const lowerMsg = (err.message || "").toLowerCase();
        if (
          lowerMsg.includes("invalid") ||
          lowerMsg.includes("credentials") ||
          lowerMsg.includes("grant")
        ) {
          setError("Email ou mot de passe incorrect.");
        } else if (lowerMsg.includes("too many") || lowerMsg.includes("rate")) {
          setError("Trop de tentatives de connexion. Veuillez réessayez dans quelques minutes.");
        } else if (lowerMsg.includes("fetch") || lowerMsg.includes("network")) {
          setError("Impossible de contacter le serveur. Veuillez vérifier votre connexion.");
        } else {
          setError("Identifiants incorrects ou erreur de connexion.");
        }
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      navigate("/admin", { replace: true });
    } catch (err) {
      setSubmitting(false);
      setError("Identifiants incorrects ou erreur de connexion.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#0F0F0F] font-sans px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-[#FFFFFF] dark:bg-[#1A1A1A] rounded-lg border border-[#E5E7EB] dark:border-[#2A2A2A] shadow-sm p-8 space-y-6"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/logo.png" alt="Maison Kenzi Logo" className="h-12 w-auto object-contain dark:invert mb-1" />
          <h1 className="text-2xl font-medium text-[#111827] dark:text-[#F9FAFB]">Admin · Maison Kenzi</h1>
          <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
            Connectez-vous pour accéder au panneau.
          </p>
        </div>

        <div className="space-y-3">
          <label className="block text-sm">
            <span className="text-[#111827] dark:text-[#F9FAFB]">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="mt-1 w-full px-3 py-2 border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9A96E] bg-[#FFFFFF] dark:bg-[#1A1A1A] text-[#111827] dark:text-[#F9FAFB]"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="text-[#111827] dark:text-[#F9FAFB]">Mot de passe</span>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-3 py-2 pr-10 border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9A96E] bg-[#FFFFFF] dark:bg-[#1A1A1A] text-[#111827] dark:text-[#F9FAFB]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F9FAFB] transition-colors cursor-pointer"
                title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </label>
          {error && <p className="text-sm text-[#EF4444]">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#111827] hover:bg-[#1F2937] dark:bg-[#C9A96E] dark:hover:bg-[#B8985F] dark:text-[#111827] text-white py-2.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
        >
          {submitting ? "Connexion…" : "Se connecter"}
        </button>

        <p className="text-xs text-center text-[#6B7280] dark:text-[#9CA3AF]">
          Accès réservé · Maison Kenzi © {new Date().getFullYear()}
        </p>
      </form>
    </div>
  );
};

export default AdminLogin;
