import { Img as Image } from "@/components/ui/Img";
import Link from "next/link";
import {
  DOAR_HREF,
  copy,
  org,
  shelters,
  showPixSection,
  whatsappHref,
} from "@/content/landing";
import { MonthlyDonateButton } from "./MonthlyDonateButton";
import {
  IconFacebook,
  IconInstagram,
  IconMail,
  IconPin,
  IconShield,
  IconWhatsApp,
} from "./ui/Icons";

/**
 * Os quatro grupos de links, na ordem em que entram na grade 2×2 da direita:
 *
 *   Ajude (3)            │ Abrigos (até 5)
 *   Campanha (2)         │ Legal (3)
 *
 * A ordem é escolhida para as linhas fecharem parelhas: os dois grupos altos
 * em cima, os dois curtos embaixo. Invertendo qualquer par, uma coluna fica com
 * um buraco no meio.
 */
const COLUMNS = [
  {
    label: "Ajude",
    links: [
      { label: "Doar agora", href: DOAR_HREF },
      /*
       * "Doar todo mês" é o único item destas listas que **não** é link: não há
       * âncora de recorrência na página (a decisão "de quanto em quanto tempo"
       * acontece no modal), então ele abre a tela de valor travada na mensal -
       * o mesmo destino do botão da barra fixa e do fechamento da página. Ver
       * `MonthlyDonateButton`.
       */
      { label: "Doar todo mês", action: "mensal" as const },
      /* Só entra se a seção existir: com `showPixSection` em `false` a âncora
         `#pix` não é renderizada e o link levaria a lugar nenhum. */
      ...(showPixSection ? [{ label: "Doar via Pix", href: "#pix" }] : []),
    ],
  },
  {
    label: "Abrigos",
    /*
     * Cada abrigo aponta para o site próprio quando tem um, e para o Instagram
     * quando não tem. O que não tiver nenhum dos dois **fica de fora da lista**
     * em vez de virar um link morto - é o caso do Abrigo Dona Rose, que a
     * campanha não publica em lugar nenhum (ver o aviso em `shelters`).
     */
    links: shelters
      .map((shelter) => ({
        label: shelter.name,
        href: shelter.siteHref || shelter.instagramHref,
      }))
      .filter((link) => link.href),
  },
  {
    label: "Campanha",
    links: [
      { label: "Transparência", href: "#transparencia" },
      { label: "Atualizações", href: "#atualizacoes" },
      { label: "Contato", href: "#documentacao" },
    ],
  },
  {
    label: "Legal",
    /* As três políticas ficam no site institucional da campanha
       (`caioprotetor.org`), não aqui: este projeto é só a página de doação. */
    links: org.policies,
  },
];

/** As redes da campanha - todas com perfil publicado e conferido. */
const SOCIALS = [
  { label: "Instagram", href: org.instagramHref, Icon: IconInstagram },
  { label: "Facebook", href: org.facebookHref, Icon: IconFacebook },
  { label: "WhatsApp", href: whatsappHref, Icon: IconWhatsApp },
];

/**
 * Rodapé em duas colunas: marca à esquerda, links à direita.
 *
 * ── O que estava quebrado ─────────────────────────────────────────────────
 * Não eram duas colunas, eram cinco. A grade externa era
 * `[minmax(0,320px)_1fr]` e a interna abria em `lg:grid-cols-4`, então em
 * 1024px o `1fr` que sobrava era dividido por quatro: ~110px por coluna, com
 * "Política de Privacidade" quebrando em três linhas. Em `md` era pior - o
 * mesmo `1fr` valia ~336px e ainda segurava duas colunas.
 *
 * O segundo problema era de alinhamento. O bloco da marca centralizava até
 * `md` e os links até `sm`: entre 640px e 768px um estava centralizado e o
 * outro à esquerda, na mesma linha. O rodapé de copyright virava em `md`, um
 * terceiro ponto de virada. Agora tudo troca em `sm`, de uma vez só.
 *
 * ── Como fica ─────────────────────────────────────────────────────────────
 *   celular    tudo empilhado, **tudo alinhado à esquerda**
 *   sm  640px  os links abrem em 2 subcolunas
 *   md  768px  as duas colunas de verdade - marca | links
 *
 * A divisão é meio a meio (`md:grid-cols-2`), o que dá ~456px por coluna no
 * container de 1040px: espaço de sobra para o texto da marca (42ch) e para os
 * links caberem numa linha cada.
 *
 * ── Por que nada centraliza mais ──────────────────────────────────────────
 * No celular, marca, texto, contato e copyright centralizavam e os quatro
 * grupos de links não - o rodapé tinha dois eixos ao mesmo tempo, e o olho
 * batia na quebra na metade dele. Agora existe uma margem esquerda só, do
 * logo até o copyright, em qualquer largura. É também o que casa com o resto
 * da página: as listas e as fichas já leem alinhadas à esquerda.
 */
export function Footer() {
  return (
    /* `pb` reservado para a barra fixa de doação, que fica ancorada no rodapé
       da janela e cobriria as últimas linhas daqui. Encolheu quando o botão
       flutuante do WhatsApp saiu da página: a folga era para os dois. */
    <footer id="contato" className="bg-graphite pb-[112px] text-white md:pb-[96px]">
      <div aria-hidden="true" className="h-[3px] w-full bg-action" />

      <div className="container-narrow flex flex-col gap-12 pt-16">
        <div className="grid gap-12 text-left md:grid-cols-2 md:gap-16">
          {/* Coluna 1 - marca, o que a organização é e como falar com ela. */}
          <div className="flex flex-col items-start gap-6">
            <Image
              src="/caio/logo-caio.webp"
              alt={org.name}
              width={160}
              height={160}
              className="h-[72px] w-auto object-contain"
            />

            <p className="max-w-[42ch] text-[15px] leading-[1.65] text-white/60">
              {copy.footerAbout}
            </p>

            {/*
              A barra de redes voltou.

              Ela tinha saído do rodapé do site institucional porque sobrava um
              ícone só, o do WhatsApp - barra de redes com um item lê como barra
              quebrada. A campanha do Caio tem os três perfis publicados, então
              agora ela tem o que uma barra precisa para existir.
            */}
            <ul className="flex items-center gap-3">
              {SOCIALS.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${org.name} no ${label}`}
                    className="flex h-[44px] w-[44px] items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/40 hover:text-white"
                  >
                    <Icon size={18} />
                  </a>
                </li>
              ))}
            </ul>

            <div className="flex flex-col items-start gap-2 text-[14px] text-white/60">
              {/* O CNPJ é o de quem **recebe** - a SOS Animal Help -, e é por
                  isso que o nome dela aparece escrito ao lado dele. O Caio é
                  protetor independente e não tem CNPJ próprio nesta campanha. */}
              <p className="flex items-center gap-2">
                <IconShield size={16} className="shrink-0" />
                <span>
                  {org.supporter} · CNPJ{" "}
                  <span className="tabular-nums">{org.cnpj}</span>
                </span>
              </p>

              <a
                href={`mailto:${org.email}`}
                className="flex min-h-[44px] items-center gap-2 transition-colors hover:text-white"
              >
                <IconMail size={16} className="shrink-0" />
                <span className="break-all">{org.email}</span>
              </a>

              <address className="flex items-start gap-2 not-italic leading-[1.5]">
                <IconPin size={16} className="mt-0.5 shrink-0" />
                <span>
                  {org.address.line1} - {org.address.line2}, {org.address.city}
                </span>
              </address>
            </div>
          </div>

          {/* Coluna 2 - os quatro grupos de links, em grade 2×2.
              `content-start` para os grupos encostarem no topo da célula: sem
              ele o grupo curto de uma linha fica flutuando no meio da altura
              que o grupo alto ao lado criou. */}
          <div className="grid content-start gap-8 sm:grid-cols-2 sm:gap-x-6">
            {COLUMNS.map((column) => (
              <nav key={column.label} aria-label={column.label}>
                <p className="mb-4 text-[12px] font-extrabold uppercase tracking-[0.14em] text-white">
                  {column.label}
                </p>
                <ul className="flex flex-col gap-2">
                  {column.links.map((link) => {
                    const estilo =
                      "block py-1 text-left text-[15px] leading-[1.4] text-white/65 transition-colors hover:text-white";

                    /* O item que abre modal em vez de navegar - hoje só o
                       "Doar todo mês" (ver o comentário em `COLUMNS`). */
                    if ("action" in link) {
                      return (
                        <li key={link.label}>
                          <MonthlyDonateButton className={estilo}>
                            {link.label}
                          </MonthlyDonateButton>
                        </li>
                      );
                    }

                    /* Os abrigos apontam para o Instagram de cada um, que é
                       outro site: eles precisam abrir em aba nova e com `rel`,
                       ao contrário das âncoras internas. */
                    const external = link.href.startsWith("http");
                    return (
                      <li key={link.href + link.label}>
                        <Link
                          href={link.href}
                          {...(external
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                          className={estilo}
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* À esquerda em qualquer largura, como o resto do rodapé. */}
        <div className="border-t border-white/10 pt-6 text-left text-[13px] leading-[1.6] text-white/50">
          {/* Os links legais já estão na coluna "Legal" - repetir aqui só
              duplicaria o mesmo destino duas vezes na mesma tela. */}
          <p>
            © {new Date().getFullYear()} {org.name}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
