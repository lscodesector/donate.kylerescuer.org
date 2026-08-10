import Image from "next/image";
import { adoption, copy } from "@/content/landing";
import { CardsCarousel } from "../ui/CardsCarousel";
import { IconArrowRight, IconHome, IconPaw } from "../ui/Icons";
import { Reveal } from "../ui/Reveal";
import { SectionHead } from "../ui/SectionHead";

/**
 * "Adote um deles" — os animais dos abrigos, publicados no app da Lusa.
 *
 * Cada card é um bicho: a foto, o nome, os dados que ajudam a decidir (idade,
 * peso, raça e em que abrigo ele está) e uma saída só, "Ver mais no Lusa App".
 * É no app que a adoção acontece, então um segundo botão de doar aqui dentro
 * só dividiria o clique entre dois caminhos.
 *
 * ── Por que fileira rolável, e não grid ───────────────────────────────────
 * A lista de animais é aberta: cresce a cada publicação nova no app. Um grid
 * de tamanho imprevisível empurraria a seção de ração — que é o que esta
 * página existe para vender — cada vez mais para baixo. Na fileira, dez ou
 * trinta animais ocupam a mesma altura.
 *
 * A rolagem em si é CSS puro (`overflow-x` + `snap`): funciona por arrasto,
 * roda do mouse, teclado e leitor de tela de graça. O `CardsCarousel` só
 * acrescenta as setas por cima disso — sem JavaScript a fileira continua
 * rolável, o que some é o atalho.
 *
 * ── Sobre o card sem foto ─────────────────────────────────────────────────
 * Entra assim mesmo, com a moldura de patinha no lugar da imagem — nome,
 * idade e abrigo são o que a pessoa lê primeiro. O que não pode acontecer é
 * pôr a foto de outro animal para tapar o buraco: foto trocada em card de
 * adoção é o erro que não dá para consertar depois.
 */
export function Adocao() {
  if (adoption.animals.length === 0) return null;

  return (
    <section id="adotar" className="py-[clamp(2.5rem,6vh,4.5rem)]">
      <div className="container-narrow flex max-w-[660px] flex-col gap-6">
        <SectionHead
          eyebrow={copy.adocao.eyebrow}
          title={copy.adocao.title}
          lead={copy.adocao.lead}
        />
      </div>

      {/* Trilho num container próprio, sem o teto de 660px da coluna de texto:
          os cards têm mais largura para andar, mas continuam alinhados com a
          margem do resto da página.

          `-mx-5 px-5` (e o par em `md`) anulam e devolvem o padding do
          container: o corte acontece na borda da tela, não numa margem interna,
          e o primeiro e o último card encostam onde o texto encosta. Sem
          `justify-center` de propósito — centralizar conteúdo que transborda
          torna o começo da fileira inalcançável pela rolagem. */}
      <div className="container-narrow mt-6">
        <CardsCarousel
          label={copy.adocao.title}
          className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 md:-mx-8 md:px-8"
        >
          {adoption.animals.map((animal, i) => (
            <Reveal
              as="li"
              key={animal.id}
              delay={(i % 3) as 0 | 1 | 2}
              className="flex w-[220px] shrink-0 snap-start flex-col overflow-hidden rounded-md border border-ink-900/10 bg-surface shadow sm:w-[240px]"
            >
              <div className="relative aspect-[4/5] w-full">
                {animal.image ? (
                  <Image
                    src={animal.image.src}
                    alt={animal.image.alt}
                    fill
                    sizes="(min-width: 640px) 240px, 220px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-accent-soft text-accent">
                    <IconPaw size={52} />
                  </div>
                )}

                {animal.urgent && (
                  /* Vermelho de erro, e não o acento nem o verde do botão: é o
                     tom que passa no contraste em texto pequeno sem se
                     confundir com "clique aqui". */
                  <span className="absolute left-3 top-3 rounded-full bg-error/[.12] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em] text-error backdrop-blur">
                    Urgente
                  </span>
                )}
              </div>

              {/* Centralizado em qualquer largura, ao contrário do resto da
                  página: o card do bicho tem a mesma largura estreita no
                  celular e no desktop, então não existe "versão desktop" dele
                  para alinhar à esquerda. */}
              <div className="flex flex-1 flex-col items-center gap-1.5 p-4 text-center">
                <h3 className="text-[17px] font-extrabold leading-tight text-ink-900">
                  {animal.name}
                </h3>

                {/* Idade, peso e raça numa linha só: são três dados curtos, e
                    três linhas para eles fariam o card crescer sem dizer mais. */}
                <p className="text-[13px] leading-[1.45] text-ink-600">
                  {[animal.age, animal.weight, animal.breed].join(" · ")}
                </p>

                <p className="flex items-center justify-center gap-1.5 text-[12px] leading-[1.4] text-ink-600">
                  <IconHome size={14} className="shrink-0" />
                  {animal.shelter}
                </p>

                {/* `mt-auto`: nome comprido quebra em duas linhas e os botões
                    precisam alinhar na mesma base em toda a fileira. */}
                <a
                  href={animal.href ?? adoption.appHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${adoption.cta}: ${animal.name}`}
                  className="mt-auto inline-flex w-full min-h-[44px] items-center justify-center gap-1.5 rounded-sm bg-action px-3 text-[13px] font-extrabold text-action-ink transition-colors hover:bg-action-hover"
                >
                  {adoption.cta}
                  <IconArrowRight size={15} className="shrink-0" />
                </a>
              </div>
            </Reveal>
          ))}
        </CardsCarousel>
      </div>
    </section>
  );
}
