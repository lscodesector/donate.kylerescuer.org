import Image from "next/image";
import Link from "next/link";
import {
  MENSAL_HREF,
  RACAO_HREF,
  adoption,
  copy,
  org,
  shelters,
} from "@/content/landing";
import { IconMail, IconPin, IconShield } from "./ui/Icons";

/**
 * Os quatro grupos de links, na ordem em que entram na grade 2×2 da direita:
 *
 *   Ajude (4)            │ Abrigos (4)
 *   SOS Animal Help (2)  │ Legal (3)
 *
 * A ordem é escolhida para as linhas fecharem parelhas: os dois grupos de
 * quatro itens em cima, os dois curtos embaixo. Invertendo qualquer par, uma
 * coluna fica com um buraco no meio.
 */
const COLUMNS = [
  {
    label: "Ajude",
    links: [
      { label: "Doe ração", href: RACAO_HREF },
      /* "Doar via Pix" saiu: a seção `#pix` está desligada (ver
         `showPixSection`) e a âncora não existe mais — o link levaria a
         lugar nenhum. O Pix continua sendo o pagamento, dentro do checkout. */
      /* Âncora, e não WhatsApp: a doação mensal agora tem checkout na própria
         página, e o botão que abre o modal está nesse bloco. */
      { label: "Doar todo mês", href: MENSAL_HREF },
      /* Aponta para o app da Lusa, e não mais para `#adotar`: a seção de
         adoção saiu da página e a âncora não existe. O rodapé é onde este
         caminho pode continuar existindo sem disputar com o pedido de doação
         (o link sai em aba nova sozinho — ver `external` abaixo). */
      { label: "Adotar um animal", href: adoption.appHref },
    ],
  },
  {
    label: "Abrigos",
    links: shelters.map((shelter) => ({
      label: shelter.name,
      href: shelter.instagramHref,
    })),
  },
  {
    label: "SOS Animal Help",
    links: [
      { label: "Transparência", href: "#transparencia" },
      { label: "Contato", href: "#documentacao" },
    ],
  },
  {
    label: "Legal",
    links: [
      { label: "Termos de Uso", href: "/termos" },
      { label: "Política de Privacidade", href: "/privacidade" },
      { label: "Política de Doação", href: "/politica-de-doacao" },
    ],
  },
];

/**
 * Rodapé em duas colunas: marca à esquerda, links à direita.
 *
 * ── O que estava quebrado ─────────────────────────────────────────────────
 * Não eram duas colunas, eram cinco. A grade externa era
 * `[minmax(0,320px)_1fr]` e a interna abria em `lg:grid-cols-4`, então em
 * 1024px o `1fr` que sobrava era dividido por quatro: ~110px por coluna, com
 * "Política de Privacidade" quebrando em três linhas. Em `md` era pior — o
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
 *   md  768px  as duas colunas de verdade — marca | links
 *
 * A divisão é meio a meio (`md:grid-cols-2`), o que dá ~456px por coluna no
 * container de 1040px: espaço de sobra para o texto da marca (42ch) e para os
 * links caberem numa linha cada.
 *
 * ── Por que nada centraliza mais ──────────────────────────────────────────
 * No celular, marca, texto, contato e copyright centralizavam e os quatro
 * grupos de links não — o rodapé tinha dois eixos ao mesmo tempo, e o olho
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
          {/* Coluna 1 — marca, o que a organização é e como falar com ela. */}
          <div className="flex flex-col items-start gap-6">
            <Image
              src="/logo/logo-footer.webp"
              alt={org.name}
              width={1024}
              height={765}
              className="h-[48px] w-auto object-contain"
            />

            <p className="max-w-[42ch] text-[15px] leading-[1.65] text-white/60">
              {copy.footerAbout}
            </p>

            {/*
              O bloco "Redes sociais" saiu daqui.

              Ele tinha um ícone só, o do WhatsApp: uma barra de redes sociais
              com um item lê como barra quebrada — a pessoa procura os outros e
              não acha. Melhor não ter ícone nenhum do que ter um solitário.

              O canal não sumiu da página: o WhatsApp da equipe continua na
              seção de documentação e no FAQ, com o número escrito por extenso
              — que é mais útil do que um ícone e é onde quem procura contato
              olha. Se um dia existirem Instagram e Facebook da organização, a
              barra de redes volta aqui com os três.
            */}

            <div className="flex flex-col items-start gap-2 text-[14px] text-white/60">
              <p className="flex items-center gap-2">
                <IconShield size={16} className="shrink-0" />
                <span className="tabular-nums">CNPJ {org.cnpj}</span>
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
                  {org.address.line1} — {org.address.line2}, {org.address.city}
                </span>
              </address>
            </div>
          </div>

          {/* Coluna 2 — os quatro grupos de links, em grade 2×2.
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
                          className="block py-1 text-[15px] leading-[1.4] text-white/65 transition-colors hover:text-white"
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
          {/* Os links legais já estão na coluna "Legal" — repetir aqui só
              duplicaria o mesmo destino duas vezes na mesma tela. */}
          <p>
            © {new Date().getFullYear()} {org.name}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
