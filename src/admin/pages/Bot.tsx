import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save, Bot as BotIcon, ChevronUp, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAppSettings } from "@/hooks/useAppSettings";

type QA = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
};

const inputCls =
  "w-full px-3 py-2 text-sm bg-[#FFFFFF] dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9A96E] text-[#111827] dark:text-[#F9FAFB]";
const labelCls = "block text-xs font-medium text-[#111827] dark:text-[#F9FAFB] mb-1";

const BotAdmin = () => {
  const { settings, update } = useAppSettings();
  const [qas, setQas] = useState<QA[]>([]);
  const [loading, setLoading] = useState(true);

  const [enabled, setEnabled] = useState(settings.bot_enabled);
  const [name, setName] = useState(settings.bot_name);
  const [welcome, setWelcome] = useState(settings.bot_welcome);

  useEffect(() => {
    setEnabled(settings.bot_enabled);
    setName(settings.bot_name);
    setWelcome(settings.bot_welcome);
  }, [settings]);

  const load = async () => {
    const { data, error } = await supabase
      .from("bot_qa")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    else setQas((data as QA[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const saveSettings = async () => {
    const { error } = await update({ bot_enabled: enabled, bot_name: name, bot_welcome: welcome });
    if (error) toast.error("Erreur: " + error.message);
    else toast.success("Paramètres du bot sauvegardés");
  };

  const addQA = async () => {
    const nextOrder = qas.length > 0 ? Math.max(...qas.map((q) => q.sort_order)) + 1 : 1;
    const { data, error } = await supabase
      .from("bot_qa")
      .insert({ question: "Nouvelle question", answer: "Réponse...", sort_order: nextOrder })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setQas((q) => [...q, data as QA]);
  };

  const updateQA = (id: string, patch: Partial<QA>) => {
    setQas((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const saveQA = async (qa: QA) => {
    const { error } = await supabase
      .from("bot_qa")
      .update({
        question: qa.question,
        answer: qa.answer,
        sort_order: qa.sort_order,
        is_active: qa.is_active,
      })
      .eq("id", qa.id);
    if (error) toast.error(error.message);
    else toast.success("Question enregistrée");
  };

  const removeQA = async (id: string) => {
    const { error } = await supabase.from("bot_qa").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setQas((qs) => qs.filter((q) => q.id !== id));
    toast.success("Question supprimée");
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= qas.length) return;
    const a = qas[idx];
    const b = qas[j];
    const next = [...qas];
    next[idx] = { ...b, sort_order: a.sort_order };
    next[j] = { ...a, sort_order: b.sort_order };
    setQas(next);
    await Promise.all([
      supabase.from("bot_qa").update({ sort_order: a.sort_order }).eq("id", b.id),
      supabase.from("bot_qa").update({ sort_order: b.sort_order }).eq("id", a.id),
    ]);
  };

  return (
    <div className="space-y-4">
      {/* Settings card */}
      <div className="bg-[#FFFFFF] dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-lg p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${enabled ? "bg-[#C9A96E]/15 text-[#C9A96E]" : "bg-[#F8F9FA] dark:bg-white/5 text-[#6B7280] dark:text-[#9CA3AF]"}`}>
              <BotIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">Assistant virtuel</h3>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                Affiche un chatbot flottant sur le site avec les questions/réponses configurées ci-dessous.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${enabled ? "bg-[#C9A96E]" : "bg-[#E5E7EB] dark:bg-[#2A2A2A]"}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"} translate-y-0.5`} />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nom du bot</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Message d'accueil</label>
            <input className={inputCls} value={welcome} onChange={(e) => setWelcome(e.target.value)} />
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={saveSettings}
            className="px-4 py-2 text-sm rounded-md bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] hover:bg-[#1F2937]"
          >
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Q&A list */}
      <div className="bg-[#FFFFFF] dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">Questions & Réponses</h3>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
              Ces questions s'afficheront comme suggestions dans le chatbot.
            </p>
          </div>
          <button
            type="button"
            onClick={addQA}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-[#C9A96E] text-[#111827] hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Chargement...</div>
        ) : qas.length === 0 ? (
          <div className="text-sm text-[#6B7280] dark:text-[#9CA3AF] py-6 text-center">
            Aucune question. Cliquez sur "Ajouter" pour commencer.
          </div>
        ) : (
          <div className="space-y-3">
            {qas.map((qa, idx) => (
              <div
                key={qa.id}
                className="border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-md p-3 space-y-2 bg-[#F8F9FA] dark:bg-[#0F0F0F]"
              >
                <div className="flex items-start gap-2">
                  <div className="flex flex-col gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      className="p-0.5 rounded text-[#6B7280] hover:text-[#111827] dark:hover:text-white disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(idx, 1)}
                      disabled={idx === qas.length - 1}
                      className="p-0.5 rounded text-[#6B7280] hover:text-[#111827] dark:hover:text-white disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      className={inputCls}
                      value={qa.question}
                      onChange={(e) => updateQA(qa.id, { question: e.target.value })}
                      placeholder="Question"
                    />
                    <textarea
                      className={inputCls + " min-h-[72px] resize-y"}
                      value={qa.answer}
                      onChange={(e) => updateQA(qa.id, { answer: e.target.value })}
                      placeholder="Réponse"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-2 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                    <input
                      type="checkbox"
                      checked={qa.is_active}
                      onChange={(e) => updateQA(qa.id, { is_active: e.target.checked })}
                    />
                    Active
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => saveQA(qa)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] hover:bg-[#1F2937]"
                    >
                      <Save className="w-3.5 h-3.5" /> Enregistrer
                    </button>
                    <button
                      type="button"
                      onClick={() => removeQA(qa.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-red-500/30 text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BotAdmin;
