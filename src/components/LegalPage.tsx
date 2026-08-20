import Link from "next/link";
import { org } from "@/lib/config";
import { documentosLegais, type DocumentoLegal } from "@/content/legal";
import Footer from "./sections/15-footer";
import Menu from "./sections/01-menu";
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
    ...rest,
  };
}

const IconArrowLeft = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </svg>
);

const IconShield = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

/**
 * O desenho das três páginas legais - privacidade, termos e doação.
 *
 * Elas são **texto**, e o desenho existe para não atrapalhar a leitura: uma
 * coluna estreita (68ch), tipografia do resto do site e nada de ilustração,
 * card ou cor de fundo. O cabeçalho e o rodapé são os mesmos da campanha, então
 * quem chega aqui pelo rodapé continua dentro do site - e o botão de doar da
 * barra continua à mão, que é o que essas páginas não podem tirar de quem
 * estava no meio de uma doação.
 *
 * ── Por que os três documentos são um componente só ───────────────────────
 * Porque o desenho é o mesmo e o que muda é o conteúdo (`content/legal.ts`).
 * Três páginas com o mesmo layout copiado seriam três lugares para consertar
 * quando o rodapé mudasse.
 */
export function LegalPage({ documento }: { documento: DocumentoLegal }) {
  return (
    <>
      <Menu />

      <main className="flex-1 bg-surface pb-[clamp(2.5rem,6vh,4rem)] pt-[clamp(1.5rem,4vh,2.5rem)]">
        <article className="container-narrow flex max-w-[760px] flex-col">
          {/* Volta para a campanha. Primeiro elemento da página de propósito:
              quem abriu um documento legal veio de algum lugar e vai querer
              voltar - e o `<Link>` é uma navegação de verdade, não um
              `history.back()` que quebra quando a página é aberta direto. */}
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-1.5 text-fs14 font-extrabold text-ink-600 transition-colors hover:text-action"
          >
            <IconArrowLeft size={16} />
            Voltar para a campanha
          </Link>

          <p className="mt-6 text-fs12 font-extrabold uppercase tracking-[0.12em] text-accent">
            Legal
          </p>

          <h1 className="mt-1 text-[clamp(1.395rem,1.116rem+1.302vw,1.976rem)] font-extrabold leading-[1.15] text-ink-900">
            {documento.titulo}
          </h1>

          {/* Quem responde pelo documento e desde quando ele vale. A data é
              parte do conteúdo jurídico, não enfeite: é ela que diz qual versão
              a pessoa está lendo. */}
          <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-fs13 text-ink-600">
            <IconShield size={15} className="shrink-0 text-donate" />
            {org.supporter} · CNPJ <span className="tabular-nums">{org.cnpj}</span> ·
            Atualizado em {documento.atualizado}
          </p>

          <div className="mt-8 flex flex-col">
            {documento.blocos.map((bloco, i) => {
              switch (bloco.tipo) {
                case "titulo":
                  return (
                    <h2
                      key={i}
                      className="mt-8 text-fs19 font-extrabold leading-[1.3] text-ink-900 first:mt-0"
                    >
                      {bloco.texto}
                    </h2>
                  );

                case "subtitulo":
                  return (
                    <h3
                      key={i}
                      className="mt-5 text-fs15 font-extrabold leading-[1.35] text-ink-900"
                    >
                      {bloco.texto}
                    </h3>
                  );

                case "lista":
                  return (
                    <ul key={i} className="mt-3 flex flex-col gap-2">
                      {bloco.itens.map((item) => (
                        <li
                          key={item}
                          className="flex gap-2.5 text-fs15 leading-[1.7] text-ink-600"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-[10px] h-[5px] w-[5px] shrink-0 rounded-full bg-action/60"
                          />
                          <span className="min-w-0 break-words">{item}</span>
                        </li>
                      ))}
                    </ul>
                  );

                case "destaque":
                  return (
                    <p
                      key={i}
                      className="mt-4 break-words rounded-md border border-cp-borda bg-surface-alt p-4 text-fs15 font-semibold leading-[1.6] text-ink-900"
                    >
                      {bloco.texto}
                    </p>
                  );

                default:
                  return (
                    <p key={i} className="mt-4 text-fs15 leading-[1.7] text-ink-600">
                      {bloco.texto}
                    </p>
                  );
              }
            })}
          </div>

          <p className="mt-8 border-t border-ink-900/10 pt-4 text-fs13 text-ink-600">
            Última atualização: {documento.atualizado}
          </p>

          {/* Os outros dois documentos, no fim: quem leu um costuma querer
              conferir o próximo, e voltar ao rodapé para achá-los é atravessar
              a página inteira. */}
          <nav aria-label="Outros documentos" className="mt-6 flex flex-wrap gap-2">
            {documentosLegais
              .filter((outro) => outro.slug !== documento.slug)
              .map((outro) => (
                <Link
                  key={outro.slug}
                  href={`/${outro.slug}`}
                  className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-full border border-cp-borda px-4 text-fs14 font-extrabold text-ink-900 transition-colors hover:border-action hover:text-action"
                >
                  {outro.rotulo}
                </Link>
              ))}
          </nav>
        </article>
      </main>

      <Footer />
    </>
  );
}
