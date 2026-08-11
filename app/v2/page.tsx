import { BackIntercept } from "@/components/BackIntercept";
import { DonationModal } from "@/components/DonationModal";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { StickyDonateBar } from "@/components/StickyDonateBar";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import { Abrigos } from "@/components/sections/Abrigos";
import { ComoFunciona } from "@/components/sections/ComoFunciona";
import { Documentacao } from "@/components/sections/Documentacao";
import { Faq } from "@/components/sections/Faq";
import { FinalCta } from "@/components/sections/FinalCta";
import { Hero } from "@/components/sections/Hero";
import { Impacto } from "@/components/sections/Impacto";
import { Pix } from "@/components/sections/Pix";
import { Racao } from "@/components/sections/Racao";
import { Transparencia } from "@/components/sections/Transparencia";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { showPixSection } from "@/content/landing";
import type { Metadata } from "next";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  VERSÃO 2 DA LANDING — a versão viva                                  ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * É esta que a raiz (`/`) mostra: `app/page.tsx` redireciona para cá. Toda
 * alteração de campanha acontece aqui e em `components/` + `content/landing.ts`
 * — a v1 é cópia congelada em `components/v1/` e não recebe nada disso.
 *
 * A jornada, na ordem em que a decisão de doar acontece:
 *
 * entender o problema → ver quem recebe → perceber a urgência →
 * escolher quanto doar → confirmar que é confiável → doar.
 *
 *  1. Hero          promessa, vídeo e os números da rede
 *  2. TrustStrip    prova rápida de confiança, antes que a objeção apareça
 *  3. Abrigos       quem recebe a ração, com nome e perfil conferível
 *  4. Impacto       o que muda quando a ração chega
 *  5. ComoFunciona  os três passos, para o clique não ser um salto no escuro
 *  6. Racao         o pedido concreto (faixas de kg) + doação mensal
 *  7. Transparencia a conta mensal da rede e os números de impacto
 *  8. Documentacao  documento e canais oficiais
 *  9. Faq           as últimas dúvidas
 * 10. FinalCta      fechamento
 *
 * ── A seção "Pix direto" está desligada ───────────────────────────────────
 * `Pix` ficava entre `Racao` e `Transparencia` e oferecia a chave solta, no
 * valor que a pessoa quisesse — um segundo caminho de doação competindo com o
 * checkout, e sem a ração, o valor e o impacto na frente. Agora o Pix é o meio
 * de pagamento **dentro** do modal de checkout. A seção continua importada e o
 * componente intacto: quem manda é `showPixSection` em `content/landing.ts`.
 *
 * ── A seção de adoção saiu daqui ──────────────────────────────────────────
 * `Adocao` (os cães publicados no app da Lusa) era o item 4 e foi retirada:
 * era a única seção cujo CTA saía do site, e ela saía **antes** das faixas de
 * kg — quem clicava num cachorro ia para o app sem nunca ver o pedido de
 * doação. O componente continua em `components/sections/Adocao.tsx` e os
 * animais continuam em `adoption`, então devolvê-la é só uma linha aqui.
 *
 * O caminho da adoção não sumiu: o link para o app segue no rodapé e na
 * pergunta "Posso adotar um dos animais?" do FAQ.
 */

/**
 * A canônica das duas versões. Sem isto, `/` (que redireciona), `/v2` e `/v1`
 * disputariam a mesma campanha na busca; a v1 está fora do índice.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/v2" },
};

export default function DonationPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustStrip />
        <Abrigos />
        <Impacto />
        <ComoFunciona />
        <Racao />
        {showPixSection && <Pix />}
        <Transparencia />
        <Documentacao />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      {/* O botão flutuante do WhatsApp saiu daqui. Ele passava por baixo da
          barra fixa e do rodapé, e a barra ainda reservava uma faixa de 84px
          só para não colidir com ele — espaço que agora é do botão de doar. */}
      <StickyDonateBar />
      <DonationModal />
      <CheckoutModal />
      <BackIntercept />
    </>
  );
}
