import { CausasModal } from "@/components/CausasModal";
import { DonationModal } from "@/components/DonationModal";
import { FloatingDonate } from "@/components/FloatingDonate";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import { Abrigos } from "@/components/sections/Abrigos";
import { Atualizacoes } from "@/components/sections/Atualizacoes";
import { ComoFunciona } from "@/components/sections/ComoFunciona";
import { Depoimentos } from "@/components/sections/Depoimentos";
import { DoarAgora } from "@/components/sections/DoarAgora";
import { Documentacao } from "@/components/sections/Documentacao";
import { Faq } from "@/components/sections/Faq";
import { FinalCta } from "@/components/sections/FinalCta";
import { Hero } from "@/components/sections/Hero";
import { Missao } from "@/components/sections/Missao";
import { Pix } from "@/components/sections/Pix";
import { Transparencia } from "@/components/sections/Transparencia";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { showPixSection } from "@/content/landing";
import type { Metadata } from "next";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  CAMPANHA CAIO PROTETOR                                               ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Esta página é a campanha de `doe.caioprotetor.org` (WordPress + Elementor)
 * reconstruída aqui: o **conteúdo** é o de lá - história, abrigos, custos,
 * depoimentos, chave Pix, links -, e a **casca** é a do site da SOS Animal Help
 * - o desenho, os componentes, o fluxo de doação em modal e o checkout Pix.
 *
 * A ordem das seções, e o que cada uma responde:
 *
 *  1. Hero          quem está pedindo e por quê - o VSL da campanha
 *  2. TrustStrip    prova rápida de confiança, antes que a objeção apareça
 *  3. Missao        "quem é o Caio" - a história, com as fotos dele
 *  4. Abrigos       quem recebe a ajuda, com nome, endereço e perfil
 *  5. ComoFunciona  os três passos, para o clique não ser um salto no escuro
 *  6. DoarAgora     o argumento (o contraste) e o pedido, num botão só
 *  7. Pix           a chave da campanha, para quem prefere o app do banco
 *  8. Transparencia a conta mensal dos abrigos e os números da campanha
 *  9. Atualizacoes  a linha do tempo - inclusive o que deu errado
 * 10. Depoimentos   os cinco protetores falando por si, em vídeo
 * 11. Documentacao  documento e canais oficiais de quem recebe
 * 12. Faq           as cinco perguntas da campanha + WhatsApp
 * 13. FinalCta      fechamento
 *
 * ── O que veio do site institucional e mudou de papel ─────────────────────
 * `Missao` era "nossa missão" (uma organização se apresentando) e virou "quem é
 * o Caio" (uma pessoa contando a própria história), com o carrossel de fotos
 * que o cartão de texto não tinha. `Depoimentos` ocupa o lugar de `Parceiros`,
 * cuja fileira de logos ainda era feita de marcadores "COLOCAR LOGOS AQUI".
 * `Atualizacoes` não existia dos dois lados no mesmo formato - é a timeline da
 * campanha, trazida inteira.
 *
 * ── A seção "Pix direto" está ligada ──────────────────────────────────────
 * No institucional ela estava desligada, porque a chave solta competia com o
 * checkout. Aqui ela volta porque a campanha a tem em destaque e porque a chave
 * é dela (`caioprotetor@sosanimalhelp.org`): quem paga pelo app do banco
 * continua caindo na campanha certa. Quem manda é `showPixSection` em
 * `content/landing.ts`.
 *
 * ── O que saiu do projeto junto com esta virada ───────────────────────────
 * As rotas `/v1`, `/v2` e `/alternativa`, as faixas de ração por kg (`Racao`,
 * `RacaoModal`, `/doar/[tier]`), a seção de adoção e o popup de saída. Nenhum
 * deles tem conteúdo correspondente nesta campanha, e faixa de kg inventada
 * numa página que pede dinheiro é o tipo de erro que não se conserta depois.
 * Estão no histórico do git se um dia voltarem a fazer sentido.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function DonationPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustStrip />
        <Missao />
        <Abrigos />
        <ComoFunciona />
        <DoarAgora />
        {showPixSection && <Pix />}
        <Transparencia />
        <Atualizacoes />
        <Depoimentos />
        <Documentacao />
        <Faq />
        <FinalCta />
      </main>
      <Footer />

      {/* O atalho permanente para doar, a partir da segunda dobra. */}
      <FloatingDonate />

      {/*
        Os três modais, na ordem em que se empilham e em que a decisão acontece:

          CausasModal  (z-55)  onde ajudar - as quatro frentes
          DonationModal(z-60)  quanto e com que frequência
          CheckoutModal(z-70)  dados e Pix

        Cada um se fecha sozinho quando o seguinte abre: dois modais empilhados,
        cada um com a sua trava de rolagem, é o caminho curto para a página
        voltar ao topo sozinha.
      */}
      <CausasModal />
      <DonationModal />
      <CheckoutModal />
    </>
  );
}
