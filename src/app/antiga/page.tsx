import type { Metadata } from "next";
import { Nunito } from "next/font/google";

import Menu from "./blocos/01-menu";
import Hero from "./blocos/03-hero";
import QuemEOKyle from "./blocos/04-quem-e-o-kyle";
import Abrigos from "./blocos/05-abrigos";
import Impacto from "./blocos/06-impacto";
import Transparencia from "./blocos/07-transparencia";
import Timeline from "./blocos/08-timeline";
import Depoimentos from "./blocos/09-depoimentos";
import Faq from "./blocos/10-faq";
import Footer from "./blocos/11-footer";
import Flutuante from "./blocos/12-flutuante";

import ModalDoacao from "@/components/overlays/17-modal-doacao";
import Checkout from "@/components/overlays/18-checkout";
import ModalDocumento from "@/components/overlays/19-modal-documento";

import { withBasePath } from "@/lib/base-path";
import "./antiga.css";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  /antiga - A PÁGINA ANTIGA DA CAMPANHA, PORTADA PARA O NEXT           ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * A versão anterior desta campanha - a que rodava em WordPress + Elementor,
 * montada por fragmentos de HTML soltos - reconstruída aqui como rota do
 * Next. A fonte está em `clone-sites-antigos/site-antigo/`: onze arquivos
 * `.html`, cada um com o próprio `<style>` e o próprio `<script>`, mais a
 * pasta `flexbox/` com a barra flutuante e o rastreio.
 *
 * ⚠️ **Não é a campanha atual.** A campanha viva é `/` (ver
 * `components/campaign/campanha-caio.tsx`), em verde e com outro texto. Esta
 * rota existe para ter a página antiga de pé no mesmo projeto - comparação,
 * teste A/B, ou só não perder o que já estava escrito. As duas não
 * compartilham desenho nenhum, e é de propósito: mexer numa não pode mexer na
 * outra.
 *
 * ── O que foi convertido, e o que foi reaproveitado ───────────────────────
 * O **desenho** veio inteiro: o CSS dos onze fragmentos foi extraído para
 * `antiga.css` sem reescrever nada em Tailwind - reescrever 2.200 linhas de
 * CSS autoral seria trocar uma coisa que funciona por uma tradução cheia de
 * chances de errar. O que mudou nele está anotado lá dentro, regra a regra:
 * os seletores globais (`:root`, `html`, `body`) foram escopados no invólucro
 * `.antiga`, senão vazariam para todas as outras rotas do site.
 *
 * O **comportamento** virou React: carrossel, acordeão, barra que aparece ao
 * rolar, menu lateral. Cada bloco carrega o seu, sem `document.getElementById`.
 *
 * E três coisas **não** foram copiadas, porque o projeto já as tem melhores:
 *
 *   contador       `lib/campaign.ts` já é a transcrição literal do
 *                  `CP_CONFIG` de `02-ajustar-valores.html` - mesmas
 *                  constantes, mesmo gerador pseudoaleatório, mesma conta.
 *                  Duplicar criaria duas verdades para o mesmo número.
 *   contato        `lib/hooks/use-shelter-phone.ts` já busca WhatsApp,
 *                  Instagram, Facebook e e-mail no painel (Nest), com cache
 *                  em módulo e valor de reserva - é o mesmo `data-cp-contact`
 *                  do rodapé antigo, só que tipado.
 *   trava de rolagem  `lib/scroll-lock.ts`, que também compensa a barra de
 *                  rolagem - o `body { overflow: hidden }` do original não
 *                  compensava, e a página saltava ao abrir o menu.
 *
 * ── O bloco 02 não existe, e a numeração ficou ────────────────────────────
 * `02-ajustar-valores.html` não era seção: era o `<script>` que calculava o
 * contador. Ele virou o reaproveitamento de `lib/campaign.ts` descrito acima,
 * e por isso a contagem pula de 01 para 03. Os números são os do arquivo de
 * origem de propósito - é o que deixa achar o original a partir daqui.
 *
 * ── O que ficou de fora, e por quê ────────────────────────────────────────
 * `flexbox/recaptcha-block.html` escondia o selo do reCAPTCHA que um plugin
 * do WordPress injetava. Não há plugin nem selo aqui.
 *
 * `flexbox/nest.html` e `flexbox/pixel.html` eram o rastreio (InitiateCheckout
 * e pixel da Meta). Este projeto já faz os dois - `lib/payments/tracking.ts` e
 * `components/tracking/20-pixel.tsx`, este último montado no `app/layout.tsx`
 * e portanto já ativo nesta rota. ⚠️ Note que o funil do site antigo era
 * `caio-protetor-us`, e o deste projeto é `cp-caio-protetor`: os eventos desta
 * página caem no funil do projeto, não no antigo.
 *
 * `flexbox/modal-doacao.html` é byte a byte igual a `flexbox/flutuante.html` -
 * o nome promete um modal que o arquivo não tem. O clone **não tem** modal de
 * doação nenhum: os CTAs só disparam `cp:openDonation`, e nada no clone
 * escuta. Aqui esse mesmo clique abre o modal de doação deste projeto
 * (`openDonationModal`, blocos 17/18), que é o fluxo que cobra de verdade.
 * Ele tem o desenho do projeto, não o vermelho e dourado desta página.
 */

/**
 * A única fonte que o desenho antigo usa.
 *
 * O `<link>` original também pedia DM Sans e DM Serif Display; nenhuma das
 * duas é referenciada em regra nenhuma dos 2.200 linhas de CSS (conferido), e
 * carregá-las seria pagar por duas famílias que ninguém desenha.
 *
 * Servida por `next/font` em vez do `<link>` para o Google: a fonte passa a
 * ser servida do mesmo domínio, sem ida e volta a `fonts.gstatic.com` e sem o
 * salto de layout que o carregamento tardio causava. O nome real da família
 * passa a ser gerado pelo Next, e é por isso que as 50 declarações
 * `font-family` de `antiga.css` apontam para `var(--font-nunito)`.
 */
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const TITLE = "Kyle Rescuer · 400 animals need you";
const DESCRIPTION =
  "Kyle is an animal rescuer who brings food, medicine and vet care to shelters at their breaking point. More than 400 animals depend on every donation.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: withBasePath("/antiga") },
  /*
   * ⚠️ `openGraph` declarado inteiro, e não só `title`/`description`: no App
   * Router a metadata da página **substitui por campo de topo**, não funde
   * campo a campo. Sem um `openGraph` próprio aqui, a prévia do link herdaria
   * a do `app/layout.tsx` inteira - e quem colasse este endereço veria o
   * título da campanha atual numa página que não é ela. Mesmo raciocínio (e
   * mesmo comentário) de `/urgencia-remedios`.
   */
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: withBasePath("/antiga"),
    siteName: "Kyle Rescuer",
    locale: "en_US",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  /* Página de arquivo: não deve competir com a campanha viva na busca. */
  robots: { index: false, follow: true },
};

export default function PaginaAntiga() {
  return (
    <>
      {/*
        Todo o CSS antigo vive daqui para dentro. `.antiga` é o que carrega as
        variáveis `--ln-*`, o fundo e a fonte - fora deste nó, nada de
        `antiga.css` se aplica. Ver o cabeçalho de `antiga.css`.
      */}
      <div className={`antiga ${nunito.variable}`}>
        <Menu />
        <main>
          <Hero />
          <QuemEOKyle />
          <Abrigos />
          <Impacto />
          <Transparencia />
          <Timeline />
          <Depoimentos />
          <Faq />
        </main>
        <Footer />
        <Flutuante />
      </div>

      {/*
        Os modais ficam FORA do invólucro de propósito. Eles são os do projeto
        (verde, tipografia do projeto), e dentro de `.antiga` herdariam a
        Nunito e a cor de texto do desenho antigo - um híbrido que não é nem
        uma página nem a outra.
      */}
      <ModalDoacao />
      <Checkout />
      <ModalDocumento />
    </>
  );
}
