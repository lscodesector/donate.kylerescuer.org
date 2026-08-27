import Menu from "@/components/sections/01-menu";
import Hero from "@/components/sections/02-hero";
import Prova from "@/components/sections/03-prova";
import QuemE from "@/components/sections/04-quem-e";
import Abrigos from "@/components/sections/06-abrigos";
import Doar from "@/components/sections/07-doar";
import ComoFunciona from "@/components/sections/08-como-funciona";
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

import ModoMensal from "./ModoMensal";
import OfertaDeSaida from "./OfertaDeSaida";
import TodoMes from "./TodoMes";

import { withBasePath } from "@/lib/base-path";
import type { Metadata } from "next";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  /ajude-sempre - A MESMA CAMPANHA, PEDINDO A DOAÇÃO MENSAL            ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * ⚠️ **ESTA ROTA ESTÁ FORA DO AR** ⚠️
 *
 * A pasta começa com `_` de propósito: no App Router, `_pasta` é pasta
 * privada - o Next não a transforma em rota. `/ajude-sempre/` responde 404
 * hoje, e o build não gera mais a página.
 *
 * O código continua aqui, inteiro e compilando, porque a decisão foi "esconder
 * por enquanto", não "remover". Para republicar, basta renomear a pasta de
 * volta para `ajude-sempre` - nada mais precisa mudar: nenhum link do site
 * aponta para cá (só comentários citam a rota pelo nome), e as props `mensal`
 * dos blocos compartilhados seguem existindo e em uso pelo modal.
 *
 * Esta página é a campanha do Caio (`app/page.tsx`) com **um pedido só**: a
 * doação que se repete todo mês.
 *
 * Ela não é uma cópia dos blocos. São os mesmos quinze arquivos, na mesma
 * ordem, montados aqui - a história do Caio, os cinco abrigos, a tabela de
 * custos, os depoimentos e a documentação não mudam por causa da frequência da
 * doação, e duplicá-los criaria duas versões da mesma verdade para alguém
 * atualizar em dois lugares. O que muda é o pedido, e ele muda em três lugares:
 *
 *   1. **O rótulo**, por prop. Os blocos que carregam CTA de doação recebem
 *      `mensal` e trocam o texto do botão (02 hero, 06 abrigos, 07 doar,
 *      14 fechamento, 16 barra fixa). É prop, e não estado de cliente, porque
 *      assim o HTML estático já sai com a palavra certa - sem a página piscar
 *      "Doar agora" antes de a hidratação corrigir.
 *
 *   2. **O comportamento**, por `ModoMensal`. Ele arma o padrão de doação da
 *      página (`setDonationDefaults`, em `lib/modais.ts`): todo gatilho que não
 *      diga o contrário abre a tela travada na mensal, inclusive os que moram
 *      fundo demais para receber prop - a ficha de abrigo, o "voltar" do
 *      checkout, e qualquer botão de doação que apareça aqui amanhã.
 *
 *   3. **A estrutura**, por `TodoMes`. É o único bloco novo, e ele entra
 *      exatamente onde a raiz põe o "Pix direto" - ver logo abaixo.
 *
 * ── O que sai: a seção "Pix direto" (bloco 05) ────────────────────────────
 * Ela não é montada aqui. Chave Pix copiada e colada no app do banco é
 * pagamento de uma vez - não existe recorrência que nasça de um Pix estático -,
 * então numa página que pede compromisso mensal ela é o atalho para a pessoa
 * fazer justamente a outra coisa, com a melhor das intenções. Quem prefere a
 * chave continua tendo a página raiz, onde `showPixSection` manda.
 *
 * ── O que entra no lugar: `TodoMes` ───────────────────────────────────────
 * Por que todo mês, quanto (três degraus da escada mensal, cada um abrindo a
 * tela já com o valor no campo) e as três objeções da recorrência - controle,
 * data e quem recebe. É o bloco que só existe nesta rota, e por isso ele mora
 * aqui, na pasta da página, e não em `components/sections/`.
 *
 * ── A ordem, e o que cada bloco responde ──────────────────────────────────
 *
 *  01 Menu          a barra fixa e a gaveta - o pedido dela já era só o mensal
 *  02 Hero          o VSL, agora com um botão só: o da recorrência
 *  03 Prova         prova rápida de confiança, antes que a objeção apareça
 *  04 QuemE         "quem é o Caio" - a história, com as fotos dele
 *   M TodoMes       o pedido mensal, a escada e as objeções da recorrência
 *  06 Abrigos       quem recebe a ajuda, com nome, endereço e perfil
 *  07 Doar          o contraste, agora fechado pelo argumento do "todo mês"
 *  08 ComoFunciona  os três passos - o que acontece depois do botão
 *  09 Transparencia a conta mensal dos abrigos, que é o argumento da página
 *  10 Atualizacoes  a linha do tempo - inclusive o que deu errado
 *  11 Depoimentos   os cinco protetores falando por si, em vídeo
 *  12 Documentacao  documento e canais oficiais de quem recebe
 *  13 Faq           as cinco perguntas da campanha + WhatsApp
 *  14 CtaFinal      fechamento, com um botão só
 *  15 Footer        rodapé, links e selos - o CTA dele já era só o mensal
 *
 * ── `#doar` continua sendo o bloco 07 ─────────────────────────────────────
 * `DOAR_HREF` é `#doar`, e cabeçalho, hero, rodapé e o checkout sem JavaScript
 * apontam todos para lá. O bloco novo tem âncora própria (`#todo-mes`)
 * justamente para não disputar esse nome: duas seções com o mesmo `id` na
 * mesma página quebram a navegação de quem está sem script.
 */
export const metadata: Metadata = {
  title:
    "Ajude Todo Mês e Mantenha Mais de 400 Animais de Pé | Caio Protetor",
  description:
    "A conta dos cinco abrigos volta todo mês. Com uma doação mensal, o Caio garante ração, remédios e veterinário sem começar do zero a cada trinta dias. Cancele quando quiser.",
  /* `withBasePath`, e não o caminho puro - ver o comentário sobre resolução de
     URL relativa em `app/layout.tsx`. Sem ele, publicado em `/v2`, o canonical
     apontaria para a raiz do domínio, que é outro site. A barra final segue o
     `trailingSlash: true` de `next.config.ts`. */
  alternates: { canonical: withBasePath("/ajude-sempre/") },
};

export default function AjudeSempre() {
  return (
    <>
      {/* Primeiro filho da árvore, de propósito: ele arma o padrão de doação
          da página antes de qualquer outro efeito de montagem rodar. */}
      <ModoMensal />

      <Menu />
      <main>
        <Hero mensal />
        <Prova />
        <QuemE />
        {/* Onde a raiz põe o "Pix direto" - ver o comentário lá em cima. */}
        <TodoMes />
        <Abrigos mensal />
        <Doar mensal />
        <ComoFunciona />
        <Transparencia />
        <Atualizacoes />
        <Depoimentos />
        <Documentacao />
        <Faq />
        <CtaFinal mensal />
      </main>
      <Footer />

      {/* O atalho permanente, a partir da segunda dobra - aqui ele pede a
          mensal, como todo o resto da página. */}
      <Flutuante mensal />

      {/*
        Os dois modais, na ordem em que se empilham e em que a decisão acontece:

          ModalDoacao(z-60)  quanto - nesta página, sem as abas de frequência
          Checkout(z-70)     dados e Pix

        Nenhum dos dois precisa saber que está numa página mensal: quem diz
        isso é a intenção que chega no evento, e nesta rota ela vem travada
        (`ModoMensal`).
      */}
      <ModalDoacao />
      <Checkout />
      <ModalDocumento />

      {/*
        A oferta de saída (z-55), entre a barra fixa e os modais de decisão.

        Ela é o consumidor que faltava do contrato de "voltar" que já morava em
        `lib/checkout-bus.ts` e que o bloco 18 já alimentava - ver o comentário
        no arquivo dela. Aparece **uma vez** por carregamento e não reempurra a
        entrada do histórico: o "voltar" seguinte sai da página de verdade.

        Só nesta rota. A raiz continua sem nada escutando o "voltar".
      */}
      <OfertaDeSaida />
    </>
  );
}
