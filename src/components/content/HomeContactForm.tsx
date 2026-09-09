import { useState } from "react";
import { Send, CheckCircle2, MessageSquare, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAppSettings } from "@/hooks/useAppSettings";

const HomeContactForm = () => {
  const { settings } = useAppSettings();
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    subject: "Conseil Parfumerie",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.contact.trim() || !formData.message.trim()) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success("Votre message a été envoyé avec succès !");
    }, 600);
  };

  const handleWhatsappSend = () => {
    const text = `Bonjour Maison Kenzi,\nNom: ${formData.name}\nContact: ${formData.contact}\nSujet: ${formData.subject}\nMessage: ${formData.message}`;
    const rawPhone = settings.whatsapp_phone || settings.store_phone || "212752850156";
    const waNumber = rawPhone.replace(/[^0-9]/g, "") || "212752850156";
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <section className="w-full mb-16 sm:mb-28 px-4 sm:px-6 max-w-4xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <p className="text-xs uppercase tracking-[0.35em] text-primary font-medium mb-2.5">
          Besoin d'aide ou d'un conseil ?
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl text-foreground tracking-tight mb-3">
          Contactez-Nous
        </h2>
        <div className="w-12 h-[1px] bg-primary/40 mx-auto" />
      </div>

      {/* Form Container */}
      <div className="relative rounded-2xl border border-primary/20 bg-card/40 backdrop-blur-md p-6 sm:p-10 shadow-sm overflow-hidden">
        {submitted ? (
          <div className="text-center py-10 space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl text-foreground font-medium">
              Message Transmis avec Succès !
            </h3>
            <p className="text-sm font-light text-muted-foreground max-w-md mx-auto leading-relaxed">
              Merci {formData.name}, nous avons bien reçu votre message. Notre équipe d'experts vous répondra dans les plus brefs délais.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: "", contact: "", subject: "Conseil Parfumerie", message: "" });
                }}
                variant="outline"
                className="rounded-full text-xs uppercase tracking-wider px-6 border-primary/30 hover:bg-primary/5"
              >
                Envoyer un autre message
              </Button>
              <Button
                type="button"
                onClick={handleWhatsappSend}
                className="rounded-full text-xs uppercase tracking-wider px-6 bg-[#25D366] hover:bg-[#20bd5a] text-white gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Continuer sur WhatsApp
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Name input */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-foreground/80 mb-2">
                  Nom & Prénom <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Mohamed Alami"
                  className="w-full bg-background border border-border/80 focus:border-primary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors"
                />
              </div>

              {/* Contact (Phone/Email) input */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-foreground/80 mb-2">
                  Téléphone ou Email <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="Ex: 06 12 34 56 78"
                  className="w-full bg-background border border-border/80 focus:border-primary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors"
                />
              </div>
            </div>

            {/* Subject Select */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-foreground/80 mb-2">
                Sujet de votre demande
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-background border border-border/80 focus:border-primary rounded-xl px-4 py-3 text-sm text-foreground outline-none transition-colors cursor-pointer"
              >
                <option value="Conseil Parfumerie">Conseil & Choix de Parfum</option>
                <option value="Suivi de Commande">Suivi de ma Commande</option>
                <option value="Information Produit">Question sur la Décantation</option>
                <option value="Autre">Autre Demande</option>
              </select>
            </div>

            {/* Message Textarea */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-foreground/80 mb-2">
                Votre Message <span className="text-primary">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Posez votre question ou décrivez votre besoin..."
                className="w-full bg-background border border-border/80 focus:border-primary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors resize-none"
              />
            </div>

            {/* Submit Buttons Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto rounded-full bg-primary text-primary-foreground hover:bg-primary-hover uppercase tracking-[0.2em] text-xs h-12 px-8 shadow-md hover:scale-105 transition-all gap-2 font-medium"
              >
                {loading ? (
                  "Envoi en cours..."
                ) : (
                  <>
                    Envoyer le Message <Send className="w-4 h-4" />
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={handleWhatsappSend}
                className="inline-flex items-center gap-2 text-xs font-medium text-[#25D366] hover:underline"
              >
                <MessageSquare className="w-4 h-4" /> Préférer contacter directement sur WhatsApp
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

export default HomeContactForm;
