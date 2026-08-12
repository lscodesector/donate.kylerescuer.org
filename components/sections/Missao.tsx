import { copy, historiaPhotos } from "@/content/landing";
import { PhotoSlideshow } from "../ui/PhotoSlideshow";
import { Reveal } from "../ui/Reveal";

/**
 * "Quem é o Caio" - a história, logo depois da dobra.
 *
 * É a pergunta que uma campanha pessoal responde antes de qualquer pedido:
 * quem está pedindo, e por quê. A ordem dentro do cartão é rótulo → frase →
 * fotos → história → citação → desfecho. Sem botão no fim: o CTA verde já
 * está na dobra acima e no botão flutuante, e "Conheça os abrigos" competia
 * com os dois por um clique que este cartão não precisa pedir.
 *
 * ── Por que as fotos vêm antes do texto ───────────────────────────────────
 * Porque a história é dele, e ver o rosto de quem pede muda o que se lê depois.
 * No site institucional este cartão era só texto - lá quem pedia era uma
 * organização, e organização não tem rosto.
 *
 * ── A citação é `<blockquote>`, e não mais um parágrafo ───────────────────
 * Ela carrega o dado mais duro da página inteira (22 vidas perdidas). Em corpo
 * de parágrafo, no meio de outros cinco, ela passaria batida - que é
 * exatamente o que não pode acontecer com o número que justifica a urgência.
 *
 * O texto vem inteiro de `copy.missao` - trocar a história é trocar o conteúdo,
 * nunca este componente.
 */
export function Missao() {
  const { missao } = copy;

  return (
    <section id="missao" className="py-[clamp(2.5rem,6vh,4.5rem)]">
      <div className="container-narrow">
        <Reveal className="mx-auto flex max-w-[760px] flex-col items-center gap-5 rounded-md bg-surface-alt p-6 text-center sm:p-8 md:p-12">
          <p className="text-[13px] font-extrabold uppercase tracking-[0.12em] text-accent">
            {missao.eyebrow}
          </p>

          <h2 className="max-w-[24ch] text-balance text-[clamp(1.375rem,1.05rem+1.3vw,2rem)] font-extrabold leading-[1.2] text-ink-900">
            {missao.statement}
          </h2>

          {/* Quadro 4:3: é o formato em que as seis fotos da campanha foram
              enquadradas, então nenhuma perde rosto no `object-cover`. */}
          <PhotoSlideshow
            photos={historiaPhotos}
            label="Caio Protetor"
            controls
            interval={4200}
            sizes="(min-width: 760px) 640px, 100vw"
            className="aspect-[4/3] w-full max-w-[640px] rounded-md border border-ink-900/10 shadow"
          />

          <div className="flex max-w-[58ch] flex-col gap-3">
            {missao.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="text-[16px] leading-[1.65] text-ink-600"
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Barra à esquerda e fundo quente: é o único bloco de texto da
              página com moldura própria, e é de propósito - ver acima. */}
          <blockquote className="w-full max-w-[58ch] rounded-md border-l-4 border-action bg-action/[.06] p-4 text-left text-[15px] font-semibold leading-[1.6] text-ink-900 sm:p-5">
            {missao.quote}
          </blockquote>

          <div className="flex max-w-[58ch] flex-col gap-3">
            {missao.paragraphsAfter.map((paragraph) => (
              <p
                key={paragraph}
                className="text-[16px] leading-[1.65] text-ink-600"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
