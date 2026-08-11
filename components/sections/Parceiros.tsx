import Image from "next/image";
import type { CSSProperties } from "react";
import { copy, partners } from "@/content/landing";
import { Reveal } from "../ui/Reveal";
import { SectionHead } from "../ui/SectionHead";

type Partner = (typeof partners)[number];

/**
 * Um parceiro: o logo quando existir arquivo, o nome quando não.
 *
 * Com `url` vira link para o site dele; sem, é um chip parado. Enquanto o nome
 * for o marcador `COLOCAR LOGOS AQUI` o chip aparece pontilhado - o lugar fica
 * reservado à vista, e ninguém confunde com um parceiro publicado.
 */
function PartnerChip({ item }: { item: Partner }) {
  const pendente = item.name.startsWith("COLOCAR");

  const conteudo = item.logo ? (
    <Image
      src={item.logo.src}
      alt={item.logo.alt}
      width={160}
      height={52}
      className="h-[36px] w-auto object-contain"
    />
  ) : (
    item.name
  );

  const base =
    "flex min-h-[64px] items-center rounded-sm px-8 text-[14px] font-semibold";

  if (item.url) {
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} border border-ink-900/[.08] bg-surface text-ink-900 shadow transition-colors hover:border-accent`}
      >
        {conteudo}
      </a>
    );
  }

  return (
    <span
      className={`${base} ${
        pendente
          ? "border border-dashed border-ink-900/20 bg-surface text-ink-300"
          : "border border-ink-900/[.08] bg-surface text-ink-900 shadow"
      }`}
    >
      {conteudo}
    </span>
  );
}

/**
 * "Parceiros que fazem a diferença" - a fileira que desliza sozinha em loop.
 *
 * A lista é duplicada no DOM e o trilho desliza exatamente metade da própria
 * largura (`.marquee-track`, em `globals.css`): quando a animação termina, a
 * segunda metade está no lugar em que a primeira começou, e o corte não
 * aparece. A cópia é `aria-hidden` e `inert` - para leitor de tela e para o
 * Tab, ela não existe.
 *
 * A duração cresce com o número de itens, para a velocidade na tela ficar a
 * mesma com três parceiros ou com quinze. Passar o mouse (ou chegar de Tab num
 * item que é link) pausa: sem isso, clicar num logo em movimento é sorte.
 */
export function Parceiros() {
  if (partners.length === 0) return null;

  const duracao = `${Math.max(partners.length * 5, 14)}s`;

  return (
    <section id="parceiros" className="py-[clamp(2.5rem,6vh,4.5rem)]">
      {/* A cabeça fica na coluna de leitura; o trilho, não - ele sangra até as
          bordas da tela, que é o que dá a sensação de fileira sem fim. */}
      <div className="container-narrow mb-8 flex max-w-[660px] flex-col">
        <SectionHead
          eyebrow={copy.parceiros.eyebrow}
          title={copy.parceiros.title}
          lead={copy.parceiros.lead}
        />
      </div>

      <Reveal className="marquee-row overflow-x-hidden">
        <ul
          className="marquee-track flex w-max gap-3 px-3"
          style={{ "--marquee-duration": duracao } as CSSProperties}
        >
          {partners.map((item, i) => (
            <li key={`${i}-${item.name}`} className="shrink-0">
              <PartnerChip item={item} />
            </li>
          ))}
          {/* A cópia que fecha o loop. A chave leva o índice porque, enquanto
              os logos não chegam, todos os itens se chamam igual - e duas
              chaves iguais fazem o React embaralhar a lista. */}
          {partners.map((item, i) => (
            <li key={`dup-${i}-${item.name}`} aria-hidden="true" inert className="shrink-0">
              <PartnerChip item={item} />
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
