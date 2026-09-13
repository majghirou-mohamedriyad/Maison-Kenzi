/**
 * Handler neutre d'API
 */
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(200).json({ ok: true, message: "Système de traduction bilingue autonome actif." });
}
