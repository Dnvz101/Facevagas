// ---------------------------------------------------------------
// SiteFooter — logo, links pras páginas legais, endereço/e-mail/
// telefone (itens que a checklist oficial da Stripe pede
// explicitamente no site pra aprovar a conta de pagamento).
// ---------------------------------------------------------------

import { MapPin, Mail, Phone } from "lucide-react";
import { toWhatsAppLink, toTelLink, ADMIN_WHATSAPP_RAW } from "../utils/format.js";

export default function SiteFooter({ onOpenLegal }) {
  return (
    <footer className="mx-auto max-w-3xl px-5 py-8">
      <div className="border-t border-slate-100 pt-6">
        <div className="nv-display mb-3 flex items-baseline text-[16px] font-extrabold tracking-tight">
          <span className="text-slate-900">nihon</span>
          <span className="text-blue-600">vagas</span>
          <span className="text-slate-400">.jp</span>
        </div>
        <p className="nv-body mb-4 text-[11.5px] leading-relaxed text-slate-400">
          Conectando brasileiros a oportunidades de trabalho no Japão. Uso gratuito para candidatos, sempre.
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11.5px]">
          <button onClick={() => onOpenLegal("termos")} className="text-slate-500 hover:text-blue-600 hover:underline">
            Termos de Uso
          </button>
          <button onClick={() => onOpenLegal("privacidade")} className="text-slate-500 hover:text-blue-600 hover:underline">
            Política de Privacidade
          </button>
          <button onClick={() => onOpenLegal("reembolso")} className="text-slate-500 hover:text-blue-600 hover:underline">
            Política de Reembolso
          </button>
          <a
            href={toWhatsAppLink(ADMIN_WHATSAPP_RAW) || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-blue-600 hover:underline"
          >
            Fale Conosco
          </a>
        </div>

        <div className="mt-5 space-y-1.5 border-t border-slate-100 pt-5">
          <p className="nv-body flex items-start gap-1.5 text-[11px] text-slate-400">
            <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />
            〒471-0045 Aichi-ken, Toyota-shi, Toshincho 4-17, Corrage II 303, Japan
          </p>
          <p className="nv-body flex items-center gap-1.5 text-[11px] text-slate-400">
            <Mail className="h-3 w-3 flex-shrink-0" />
            <a href="mailto:NihonVagas@gmail.com" className="hover:text-blue-600 hover:underline">NihonVagas@gmail.com</a>
          </p>
          <p className="nv-body flex items-center gap-1.5 text-[11px] text-slate-400">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <a href={toTelLink(ADMIN_WHATSAPP_RAW) || "#"} className="hover:text-blue-600 hover:underline">070-1415-7833</a>
          </p>
        </div>

        <p className="nv-body mt-5 text-[10.5px] text-slate-300">© {new Date().getFullYear()} nihonvagas.jp — Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
