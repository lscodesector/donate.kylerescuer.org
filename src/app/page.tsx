import Menu from "@/components/sections/01-menu";
import Hero from "@/components/sections/02-hero";
import Prova from "@/components/sections/03-prova";
import QuemE from "@/components/sections/04-quem-e";
import Abrigos from "@/components/sections/05-abrigos";
import Doar from "@/components/sections/06-doar";
import ComoFunciona from "@/components/sections/07-como-funciona";
import PixDireto from "@/components/sections/08-pix-direto";
import Transparencia from "@/components/sections/09-transparencia";
import Atualizacoes from "@/components/sections/10-atualizacoes";
import Depoimentos from "@/components/sections/11-depoimentos";
import Documentacao from "@/components/sections/12-documentacao";
import Faq from "@/components/sections/13-faq";
import CtaFinal from "@/components/sections/14-cta-final";
import Footer from "@/components/sections/15-footer";

import Flutuante from "@/components/overlays/16-flutuante";
import ModalDoacao from "@/components/overlays/17-modal-doacao";
import Checkout from "@/components/overlays/18-checkout";
import ModalDocumento from "@/components/overlays/19-modal-documento";

import { withBasePath } from "@/lib/base-path";
import { showPixSection } from "@/lib/config";
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
 * ── Um bloco por seção ────────────────────────────────────────────────────
 * Cada seção é um arquivo numerado, e o número é a ordem na página. O bloco
 * carrega o próprio texto e os próprios utilitários de desenho (ícones,
 * revelação ao rolar, cabeça de seção, slide de fotos): ele não importa outro
 * bloco e não importa uma pasta de UI compartilhada. O que ele pode importar é
 * `@/lib` - dado de campanha, formatação de dinheiro, pagamento e os gatilhos
 * dos modais. O mapa completo está em `docs/UI-MAP.md`.
 *
 * A ordem das seções, e o que cada uma responde:
 *
 *  01 Menu          a barra fixa e a gaveta de navegação
 *  02 Hero          quem está pedindo e por quê - o VSL da campanha
 *  03 Prova         prova rápida de confiança, antes que a objeção apareça
 *  04 QuemE         "quem é o Caio" - a história, com as fotos dele
 *  05 Abrigos       quem recebe a ajuda, com nome, endereço e perfil
 *  06 Doar          o argumento (o contraste) e o pedido, num botão só
 *  07 ComoFunciona  os três passos, para quem chegou ao fim do pedido sem
 *                   clicar - o que acontece depois do botão
 *  08 PixDireto     a chave da campanha, para quem prefere o app do banco
 *  09 Transparencia a conta mensal dos abrigos e os números da campanha
 *  10 Atualizacoes  a linha do tempo - inclusive o que deu errado
 *  11 Depoimentos   os cinco protetores falando por si, em vídeo
 *  12 Documentacao  documento e canais oficiais de quem recebe
 *  13 Faq           as cinco perguntas da campanha + WhatsApp
 *  14 CtaFinal      fechamento
 *  15 Footer        rodapé, links e selos
 *
 * E o que vive por cima da página, fora do fluxo:
 *
 *  16 Flutuante       a barra de doação colada na base, a partir da 2ª dobra
 *  17 ModalDoacao     quanto e com que frequência (z-60)
 *  18 Checkout        dados e Pix (z-70)
 *  19 ModalDocumento  o cartão CNPJ por cima de tudo (z-65)
 *  20 Pixel           eventos de conversão - montado em `app/layout.tsx`
 *
 * ── A seção "Pix direto" está ligada ──────────────────────────────────────
 * No institucional ela estava desligada, porque a chave solta competia com o
 * checkout. Aqui ela volta porque a campanha a tem em destaque e porque a chave
 * é dela (`caioprotetor@sosanimalhelp.org`): quem paga pelo app do banco
 * continua caindo na campanha certa. Quem manda é `showPixSection` em
 * `lib/config.ts`.
 */
export const metadata: Metadata = {
  /* `withBasePath`, não `"/"` puro - ver o comentário sobre resolução de URL
     relativa em `app/layout.tsx`. Sem ele, publicado em `/v2`, o canonical
     apontaria para a raiz do domínio - que é outro site. */
  alternates: { canonical: withBasePath("/") },
};

export default function DonationPage() {
  return (
    <>
      <Menu />
      <main>
        <Hero />
        <Prova />
        <QuemE />
        <Abrigos />
        <Doar />
        <ComoFunciona />
        {showPixSection && <PixDireto />}
        <Transparencia />
        <Atualizacoes />
        <Depoimentos />
        <Documentacao />
        <Faq />
        <CtaFinal />
      </main>
      <Footer />

      {/* O atalho permanente para doar, a partir da segunda dobra. */}
      <Flutuante />

      {/*
        Os dois modais, na ordem em que se empilham e em que a decisão acontece:

          ModalDoacao(z-60)  quanto e com que frequência
          Checkout(z-70)     dados e Pix

        Cada um se fecha sozinho quando o seguinte abre: dois modais empilhados,
        cada um com a sua trava de rolagem, é o caminho curto para a página
        voltar ao topo sozinha.
      */}
      <ModalDoacao />
      <Checkout />
      <ModalDocumento />
    </>
  );
}
