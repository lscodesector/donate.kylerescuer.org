import { BackIntercept } from "@/components/v1/BackIntercept";
import { DonationModal } from "@/components/v1/DonationModal";
import { Footer } from "@/components/v1/Footer";
import { Header } from "@/components/v1/Header";
import { StickyDonateBar } from "@/components/v1/StickyDonateBar";
import { Documentacao } from "@/components/v1/sections/Documentacao";
import { Faq } from "@/components/v1/sections/Faq";
import { FinalCta } from "@/components/v1/sections/FinalCta";
import { Hero } from "@/components/v1/sections/Hero";
import { Historias } from "@/components/v1/sections/Historias";
import { Impacto } from "@/components/v1/sections/Impacto";
import { Pix } from "@/components/v1/sections/Pix";
import { Racao } from "@/components/v1/sections/Racao";
import { Transparencia } from "@/components/v1/sections/Transparencia";
import { TrustStrip } from "@/components/v1/sections/TrustStrip";
import type { Metadata } from "next";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  VERSÃO 1 DA LANDING — congelada no commit 0d0ecce                    ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Esta rota existe para comparar as duas versões da página lado a lado. Ela é
 * uma **cópia congelada**: sai inteira de `components/v1/` e `content/v1/`, e
 * nada aqui divide arquivo com a v2 — mexer numa não altera a outra.
 *
 * O que é da v1 e não existe mais na v2: a barra de arrecadação em reais no
 * hero (`CampaignProgress`), a seção "Histórias" (legendas sobre fotos do
 * acervo) e o `DonateButton`, que abria o modal de valores. A v2 trocou isso
 * por números de impacto, abrigos com nome e perfil, adoção e faixas de kg.
 *
 * O que **não** foi duplicado, porque é caminho de pagamento e precisa ser um
 * só: o checkout (`/doar/...`), a página de obrigado e o `globals.css`. As
 * faixas de ração são idênticas nos dois conteúdos (mesmos ids e preços), então
 * um clique em "5 kg" na v1 chega no mesmo checkout da v2. Se um dia os preços
 * da v2 mudarem, `content/v1/landing.ts` precisa acompanhar — senão a v1
 * anuncia um valor e cobra outro.
 *
 * ── A jornada desta versão ────────────────────────────────────────────────
 *  1. Hero          promessa, vídeo e a barra de arrecadação (itens 2 e 3)
 *  2. TrustStrip    prova rápida de confiança, antes que a objeção apareça
 *  3. Historias     quem recebe
 *  4. Impacto       com e sem a ajuda
 *  5. Racao         o pedido concreto + outro valor e recorrência
 *  6. Pix           o caminho de menor atrito
 *  7. Transparencia para onde vai o dinheiro
 *  8. Documentacao  documento e canais oficiais
 *  9. Faq           as últimas dúvidas
 * 10. FinalCta      fechamento
 */

/**
 * Fora do índice: v1 e v2 são a mesma campanha em duas versões, e deixar as
 * duas indexáveis divide a página entre si na busca. A canônica é a v2, que é
 * para onde a raiz manda.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function DonationPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustStrip />
        <Historias />
        <Impacto />
        <Racao />
        <Pix />
        <Transparencia />
        <Documentacao />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <StickyDonateBar />
      <DonationModal />
      <BackIntercept />
    </>
  );
}
