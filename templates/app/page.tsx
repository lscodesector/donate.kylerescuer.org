/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  TEMPLATE · app/page.tsx - a campanha                                 ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Esta página **não desenha nada**. Ela monta os blocos na ordem numerada e
 * mais nada - nenhum estilo, nenhuma classe, nenhum texto. Quem desenha é cada
 * seção, e é lá que se edita.
 *
 * A ordem das seções, e o que cada uma responde:
 *
 *  01 Menu          a barra fixa e a gaveta de navegação
 *  02 Hero          quem está pedindo e por quê - o VSL da campanha
 *  03 Prova         prova rápida de confiança, antes que a objeção apareça
 *  04 QuemE         a história, com as fotos
 *  05 Abrigos       quem recebe a ajuda, com nome, endereço e perfil
 *  06 Doar          o argumento (o contraste) e o pedido, num botão só
 *  07 ComoFunciona  os três passos - o que acontece depois do botão
 *  08 PixDireto     a chave, para quem prefere o app do banco
 *  09 Transparencia a conta mensal e os números da campanha
 *  10 Atualizacoes  a linha do tempo - inclusive o que deu errado
 *  11 Depoimentos   quem recebeu, falando por si
 *  12 Documentacao  documento e canais oficiais de quem recebe
 *  13 Faq           as dúvidas + WhatsApp
 *  14 CtaFinal      fechamento
 *  15 Footer        rodapé, links e selos
 *
 * E o que vive por cima da página, fora do fluxo:
 *
 *  16 Flutuante       a barra de doação colada na base, a partir da 2ª dobra
 *  17 ModalDoacao     quanto e com que frequência (z-60)
 *  18 Checkout        dados e Pix (z-70)
 *  19 ModalDocumento  o documento por cima de tudo (z-65)
 *  20 Pixel           eventos de conversão - montado em `app/layout.tsx`
 *
 * Uma campanha pode não ter alguma delas - basta não montar. O que ela não
 * deve fazer é criar uma seção com desenho próprio: se o conteúdo é novo, ele
 * entra num dos moldes que já existem.
 */

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

export const metadata: Metadata = {
  /* `withBasePath`, e não `"/"` puro - ver o comentário sobre resolução de URL
     relativa em `app/layout.tsx`. Sem ele, publicado numa subpasta, o
     canonical apontaria para a raiz do domínio, que costuma ser outro site. */
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
        Os modais, na ordem em que se empilham e em que a decisão acontece:

          ModalDoacao(z-60)  quanto e com que frequência
          Checkout(z-70)     dados e Pix

        Cada um se fecha sozinho quando o seguinte abre: dois modais
        empilhados, cada um com a sua trava de rolagem, é o caminho curto para
        a página voltar ao topo sozinha.
      */}
      <ModalDoacao />
      <Checkout />
      <ModalDocumento />
    </>
  );
}
