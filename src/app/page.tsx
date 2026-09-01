import type { Metadata } from "next";
import CampanhaCaio from "@/components/campaign/campanha-caio";
import { withBasePath } from "@/lib/base-path";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  / - A CAMPANHA CAIO PROTETOR (v1, o controle)                        ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * A página em si é `@/components/campaign/campanha-caio` - a mesma árvore que
 * a rota de teste A/B `/v2` (`app/v2/page.tsx`) serve. Aqui fica só o que é da
 * rota raiz: o `metadata` e o `canonical`.
 */
export const metadata: Metadata = {
  /* `withBasePath`, não `"/"` puro - ver o comentário sobre resolução de URL
     relativa em `app/layout.tsx`. Sem ele, publicado em `/v2`, o canonical
     apontaria para a raiz do domínio - que é outro site. */
  alternates: { canonical: withBasePath("/") },
};

export default function DonationPage() {
  return <CampanhaCaio />;
}
