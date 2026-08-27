import Menu from "./blocos/01-menu";
import Hero from "./blocos/02-hero";
import Prova from "./blocos/03-prova";
import QuemE from "./blocos/04-quem-e";
import PixDireto from "./blocos/05-pix-direto";
import Abrigos from "./blocos/06-abrigos";
import Doar from "./blocos/07-doar";
import ComoFunciona from "./blocos/08-como-funciona";
import Transparencia from "./blocos/09-transparencia";
import Atualizacoes from "./blocos/10-atualizacoes";
import Depoimentos from "./blocos/11-depoimentos";
import Documentacao from "./blocos/12-documentacao";
import Faq from "./blocos/13-faq";
import CtaFinal from "./blocos/14-cta-final";
import Footer from "./blocos/15-footer";
import Flutuante from "./blocos/16-flutuante";

import ModalDoacao from "@/components/overlays/17-modal-doacao";
import Checkout from "@/components/overlays/18-checkout";
import ModalDocumento from "@/components/overlays/19-modal-documento";

import { withBasePath } from "@/lib/base-path";
import { showPixSection } from "@/lib/config";
import type { Metadata } from "next";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  /urgencia-remedios - A CAMPANHA DE SOCORRO VETERINÁRIO                ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Outra campanha do mesmo protetor, não outra versão da mesma página. A raiz
 * pede a manutenção dos abrigos (ração, estrutura, meta de R$ 58.000); esta
 * pede o **atendimento veterinário** dos animais que já estão doentes -
 * consulta, exame, medicação e cirurgia, meta de R$ 42.653,85. Muda o número,
 * muda o abrigo em foco, muda a linha do tempo, mudam as perguntas do FAQ.
 *
 * Ela veio do repositório `doe.caioprotetor.medicamentos.org`, que é onde essa
 * campanha roda hoje como site separado. Aquele repositório continua no ar e
 * intocado - se ele mudar, esta rota **não** muda junto.
 *
 * ── Por que os blocos moram em `./blocos/`, e não em `components/sections/` ─
 * Porque a copy é outra em doze dos quinze blocos. `/ajude-sempre` reaproveita
 * os blocos da raiz porque lá só muda a *frequência* do pedido - a história do
 * Caio, os abrigos e a tabela de custos são os mesmos, e duplicá-los criaria
 * duas versões da mesma verdade. Aqui é o contrário: o texto **é** a
 * diferença. Uma prop por parágrafo divergente seria a mesma duplicação, só
 * que espalhada por quinze arquivos compartilhados e paga também pela raiz.
 *
 * O preço disso está anotado: correção de layout ou de acessibilidade que valha
 * para as duas campanhas precisa ser feita nos dois lugares. Se um dia a
 * terceira campanha aparecer, é hora de extrair a copy para dados em vez de
 * copiar a pasta de novo.
 *
 * ── O que continua compartilhado, de propósito ────────────────────────────
 * Os três overlays de decisão (17 modal de valores, 18 checkout, 19 documento)
 * vêm de `components/overlays/`, não de `./blocos/`. Eles não carregam copy de
 * campanha: quem diz o que mostrar é a intenção que chega no evento
 * (`lib/modais.ts`) e o item que chega no barramento (`lib/checkout-bus.ts`).
 * Duplicá-los levaria junto uma cópia velha do checkout - a deste repositório
 * é mais nova que a do repositório de origem, e é a que tem o
 * `checkoutItemFor` que `/ajude-sempre` também usa.
 *
 * O `16-flutuante` **não** é compartilhado: ele mostra o valor arrecadado, e
 * esse número é o desta campanha.
 *
 * ── O contador ────────────────────────────────────────────────────────────
 * `./campanha.ts` - meta e data de início próprias, mesma fábrica de
 * `lib/campaign.ts`. Ver o comentário lá sobre por que cada campanha precisa
 * do seu próprio retrato.
 */
/**
 * ── Por que `openGraph` e `twitter` estão declarados inteiros aqui ─────────
 *
 * No App Router, metadata de página **substitui por campo de topo** - não
 * funde campo a campo. `title` e `description` sozinhos consertam a aba do
 * navegador e o resultado do Google, mas **não** a prévia do link: sem um
 * `openGraph` próprio, a página herda o do `app/layout.tsx` inteiro, e quem
 * colasse este endereço no WhatsApp veria "Salvar Mais de 400 Animais" e
 * "leva ração, remédios e veterinário" - a copy da campanha da raiz, na
 * página que pede socorro veterinário.
 *
 * Por isso `siteName`, `locale` e `type` aparecem repetidos abaixo: eles não
 * são herdados quando a página declara o seu próprio `openGraph`. Tirar
 * qualquer um deles não volta para o valor do layout, some.
 *
 * Mesma coisa vale para `twitter`, que é um campo de topo separado - o
 * WhatsApp lê `og:`, mas X/Twitter e alguns leitores preferem `twitter:`, e
 * um sem o outro deixa metade dos lugares mostrando a campanha errada.
 */
export const metadata: Metadata = {
  title: "Eles Precisam de Veterinário Agora | Caio Protetor",
  description:
    "Mais de 500 animais precisam de consulta, exames e medicação urgente. Ajude o Caio a levá-los ao veterinário antes que seja tarde demais. Doe via Pix, no valor que puder.",
  /* `withBasePath`, e não o caminho puro - ver o comentário sobre resolução de
     URL relativa em `app/layout.tsx`. A barra final segue o `trailingSlash`
     de `next.config.ts`. */
  alternates: { canonical: withBasePath("/urgencia-remedios/") },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Caio Protetor",
    /* O endereço canônico da prévia. Sem ele, quem compartilhar a URL com
       `?utm_...` colado faz o Facebook tratar cada variante como página
       diferente, e a contagem de compartilhamentos se divide entre elas. */
    url: withBasePath("/urgencia-remedios/"),
    title: "Eles Precisam de Veterinário Agora | Caio Protetor",
    description:
      "Mais de 500 animais precisam de consulta, exames e medicação urgente. Ajude o Caio a levá-los ao veterinário antes que seja tarde demais.",
    images: [
      {
        /* Foto diferente da raiz de propósito: `caio-1` (Caio com um cão no
           colo) é a prévia da campanha de manutenção. Esta é a do animal
           **recebendo cuidado**, que é o que esta página pede - e, quando as
           duas campanhas circulam juntas, a imagem é o que separa uma da
           outra antes de alguém ler o título.

           `width`/`height` declarados porque o WhatsApp monta o espaço da
           prévia antes de baixar a imagem: sem eles, o card pisca com o
           tamanho errado ou cai para o layout pequeno. São as dimensões
           reais do arquivo - conferir se a foto for trocada. */
        url: withBasePath("/caio/historia/caio-3.webp"),
        width: 1034,
        height: 1103,
        alt: "Cão resgatado recebendo cuidado veterinário depois do resgate",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eles Precisam de Veterinário Agora | Caio Protetor",
    description:
      "Mais de 500 animais precisam de consulta, exames e medicação urgente. Ajude o Caio a levá-los ao veterinário antes que seja tarde demais.",
    images: [withBasePath("/caio/historia/caio-3.webp")],
  },
};

export default function UrgenciaRemedios() {
  return (
    <>
      <Menu />
      <main>
        <Hero />
        <Prova />
        <QuemE />
        {/* A chave Pix, para quem prefere o app do banco. `showPixSection`
            manda, como na raiz. */}
        {showPixSection && <PixDireto />}
        <Abrigos />
        <Doar />
        <ComoFunciona />
        <Transparencia />
        <Atualizacoes />
        <Depoimentos />
        <Documentacao />
        <Faq />
        <CtaFinal />
      </main>
      <Footer />

      <Flutuante />

      <ModalDoacao />
      <Checkout />
      <ModalDocumento />
    </>
  );
}
