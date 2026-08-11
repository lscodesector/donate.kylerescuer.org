import { CausasModal } from "@/components/CausasModal";
import { DonationModal } from "@/components/DonationModal";
import { FloatingDonate } from "@/components/FloatingDonate";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { RacaoModal } from "@/components/RacaoModal";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import { Abrigos } from "@/components/sections/Abrigos";
import { ComoFunciona } from "@/components/sections/ComoFunciona";
import { Documentacao } from "@/components/sections/Documentacao";
import { DoarRacao } from "@/components/sections/DoarRacao";
import { Faq } from "@/components/sections/Faq";
import { FinalCta } from "@/components/sections/FinalCta";
import { Hero } from "@/components/sections/Hero";
import { Missao } from "@/components/sections/Missao";
import { Parceiros } from "@/components/sections/Parceiros";
import { Pix } from "@/components/sections/Pix";
import { Transparencia } from "@/components/sections/Transparencia";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { showPixSection } from "@/content/landing";
import type { Metadata } from "next";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  SITE INSTITUCIONAL DA SOS ANIMAL HELP                                ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Esta página nasceu como landing de campanha de ração (a "v2") e virou o site
 * institucional da organização. A diferença não é de tema, é de pergunta: a
 * landing existia para converter um clique em doação e abria com o vídeo de
 * vendas; o institucional existe para apresentar quem é a organização, quem
 * recebe a ajuda e por que dá para confiar - e o pedido de doação continua na
 * página inteira, mas como consequência, não como abertura.
 *
 * O que mudou de estrutura, e por quê:
 *
 *  • **Hero** - o VSL do VTurb deu lugar ao slide de fotos felizes, e a dobra
 *    perdeu a altura travada em uma tela que existia só para o player caber.
 *  • **Missao** (nova) - o "nossa missão" do site institucional, o cartão de
 *    propósito que responde "quem é essa organização?" antes de qualquer
 *    pedido.
 *  • **DoarRacao** substitui `Racao` **e** `Impacto` - a grade com as seis
 *    faixas de kg saiu da página e virou modal (`RacaoModal`), e o contraste
 *    "o que muda quando a ração chega" foi absorvido pela mesma seção. O
 *    argumento e o pedido agora são um bloco só, com um botão no fim em vez de
 *    três espalhados. O componente antigo (`components/sections/Racao.tsx`)
 *    continua no projeto, sem uso, e a grade dentro do modal é a mesma.
 *  • **Parceiros** (nova) - a fileira de logos que desliza, com os marcadores
 *    "COLOCAR LOGOS AQUI" até os arquivos chegarem.
 *  • **Faq** - as cinco perguntas viraram as do site institucional, e a seção
 *    ganhou a saída para o WhatsApp no fim.
 *
 * A v1 é cópia congelada em `components/v1/` e não recebe nada disso.
 * `/v2` continua respondendo, como apelido desta página, para os links já
 * espalhados por aí (ver `app/v2/page.tsx`).
 *
 * A ordem das seções, e o que cada uma responde:
 *
 *  1. Hero          quem somos, em uma frase e em fotos
 *  2. TrustStrip    prova rápida de confiança, antes que a objeção apareça
 *  3. Missao        por que existimos - a missão e a operação
 *  4. Abrigos       quem recebe a ajuda, com nome e perfil conferível
 *  5. ComoFunciona  os três passos, para o clique não ser um salto no escuro
 *  6. DoarRacao     o argumento (o contraste) e o pedido, num botão só
 *  7. Transparencia a conta mensal da rede e os números de impacto
 *  8. Parceiros     as empresas que sustentam a operação
 *  9. Documentacao  documento e canais oficiais
 * 10. Faq           as perguntas do institucional + WhatsApp
 * 11. FinalCta      fechamento
 *
 * ── A seção "Pix direto" está desligada ───────────────────────────────────
 * `Pix` ficava entre a ração e a transparência e oferecia a chave solta, no
 * valor que a pessoa quisesse - um segundo caminho de doação competindo com o
 * checkout, e sem a ração, o valor e o impacto na frente. Agora o Pix é o meio
 * de pagamento **dentro** do modal de checkout. A seção continua importada e o
 * componente intacto: quem manda é `showPixSection` em `content/landing.ts`.
 *
 * ── A seção de adoção saiu daqui ──────────────────────────────────────────
 * `Adocao` (os cães publicados no app da Lusa) era o item 4 e foi retirada:
 * era a única seção cujo CTA saía do site, e ela saía **antes** das faixas de
 * kg - quem clicava num cachorro ia para o app sem nunca ver o pedido de
 * doação. O componente continua em `components/sections/Adocao.tsx` e os
 * animais continuam em `adoption`, então devolvê-la é só uma linha aqui.
 *
 * O caminho da adoção não sumiu: o link para o app segue no rodapé e na
 * pergunta "Posso adotar um dos animais?" do FAQ.
 */

/**
 * A canônica das três URLs que mostram esta campanha: `/`, o apelido `/v2` e
 * a v1. Sem isto elas disputariam a mesma campanha na busca; a v1 está fora do
 * índice e o apelido aponta para cá.
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
        <DoarRacao />
        {showPixSection && <Pix />}
        <Transparencia />
        <Parceiros />
        <Documentacao />
        <Faq />
        <FinalCta />
      </main>
      <Footer />

      {/* O atalho permanente para doar, a partir da segunda dobra. Era uma
          barra colada na base (`StickyDonateBar`, retirada); virou botão
          flutuante no canto, que entrega o mesmo atalho sem cobrar uma faixa
          de altura em todas as telas. */}
      <FloatingDonate />

      {/*
        Os quatro modais, na ordem em que se empilham e em que a decisão
        acontece:

          CausasModal  (z-55)  onde ajudar - as quatro frentes
          RacaoModal   (z-60)  quantos kg, quando a frente é ração
          DonationModal(z-60)  quanto e com que frequência, nas outras frentes
          CheckoutModal(z-70)  dados e Pix

        Cada um se fecha sozinho quando o seguinte abre: dois modais
        empilhados, cada um com a sua trava de rolagem, é o caminho curto para
        a página voltar ao topo sozinha.
      */}
      <CausasModal />
      <RacaoModal />
      <DonationModal />
      <CheckoutModal />
    </>
  );
}
