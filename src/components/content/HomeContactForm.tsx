import { useState } from "react";
import { Send, CheckCircle2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useLanguage } from "@/contexts/LanguageContext";

const HomeContactForm = () => {
  const { t } = useLanguage();
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
      toast.success(t.contactHome.successTitle);
    }, 600);
  };

  const handleWhatsappSend = () => {
    const text = `Bonjour Maison Kenzi,\nNom: ${formData.name}\nContact: ${formData.contact}\nSujet: ${formData.subject}\nMessage: ${formData.message}`;
    const rawPhone = settings.whatsapp_phone || settings.store_phone || "212652535301";
    const waNumber = rawPhone.replace(/[^0-9]/g, "") || "212652535301";
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <section className="w-full mb-16 sm:mb-28 px-4 sm:px-6 max-w-4xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <p className="text-xs uppercase tracking-[0.35em] text-primary font-medium mb-2.5">
          {t.contactHome.tag}
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl text-foreground tracking-tight mb-3">
          {t.contactHome.title}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground font-light max-w-md mx-auto">
          {t.contactHome.subtitle}
        </p>
        <div className="w-12 h-[1px] bg-primary/40 mx-auto mt-3" />
      </div>

      {/* Form Container */}
      <div className="relative rounded-2xl border border-primary/20 bg-card/40 backdrop-blur-md p-6 sm:p-10 shadow-sm overflow-hidden">
        {submitted ? (
          <div className="text-center py-10 space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl text-foreground font-medium">
              {t.contactHome.successTitle}
            </h3>
            <p className="text-sm font-light text-muted-foreground max-w-md mx-auto leading-relaxed">
              {t.contactHome.successDesc}
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
                {t.contactHome.sendAnother}
              </Button>
              <Button
                type="button"
                onClick={handleWhatsappSend}
                className="rounded-full text-xs uppercase tracking-wider px-6 bg-[#25D366] hover:bg-[#20bd5a] text-white gap-2"
              >
                <MessageSquare className="w-4 h-4" /> {t.contactHome.continueWhatsApp}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Name input */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-foreground/80 mb-2">
                  {t.contactHome.nameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t.contactHome.namePlaceholder}
                  className="w-full bg-background border border-border/80 focus:border-primary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors"
                />
              </div>

              {/* Contact (Phone/Email) input */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-foreground/80 mb-2">
                  {t.contactHome.contactLabel}
                </label>
                <input
                  type="text"
                  required
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder={t.contactHome.contactPlaceholder}
                  className="w-full bg-background border border-border/80 focus:border-primary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors"
                />
              </div>
            </div>

            {/* Subject Select */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-foreground/80 mb-2">
                {t.contactHome.subjectLabel}
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-background border border-border/80 focus:border-primary rounded-xl px-4 py-3 text-sm text-foreground outline-none transition-colors cursor-pointer"
              >
                <option value="Conseil Parfumerie">{t.contactHome.subjectAdvice}</option>
                <option value="Suivi de Commande">{t.contactHome.subjectOrder}</option>
                <option value="Demande Spécifique">{t.contactHome.subjectSpecial}</option>
              </select>
            </div>

            {/* Message Textarea */}
            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-foreground/80 mb-2">
                {t.contactHome.messageLabel}
              </label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder={t.contactHome.messagePlaceholder}
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
                  t.contactHome.sending
                ) : (
                  <>
                    {t.contactHome.sendBtn} <Send className="w-4 h-4" />
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={handleWhatsappSend}
                className="inline-flex items-center gap-2 text-xs font-medium text-[#25D366] hover:underline cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" /> {t.contactHome.continueWhatsApp}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

export default HomeContactForm;
