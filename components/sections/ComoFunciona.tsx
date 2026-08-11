import { copy } from "@/content/landing";
import { IconBowl, IconHeart, IconPix, IconShield } from "../ui/Icons";
import { Reveal } from "../ui/Reveal";

/**
 * Os três passos, logo antes do pedido.
 *
 * Fica entre `Abrigos` e `DoarRacao` de propósito: os abrigos acabaram de
 * mostrar quem recebe, o pedido vem logo abaixo, e no meio falta responder o
 * que acontece depois do clique. Quem nunca doou nesta página trava aí - não
 * por desconfiar da causa, mas por não saber se vai cair num formulário longo,
 * num cadastro ou num boleto.
 *
 * Sem CTA próprio: o botão está logo abaixo, na seção seguinte - que agora é a
 * única da página com botão de doar ração. Um segundo aqui só dividiria o
 * clique com ele.
 *
 * ── Layout ────────────────────────────────────────────────────────────────
 * No celular os passos empilham em linhas de ícone + texto (o número fica no
 * canto do ícone), e a partir de `sm` viram três colunas. É a mesma informação
 * nos dois: nada some no mobile.
 */

const ICONES = {
  bowl: IconBowl,
  pix: IconPix,
  heart: IconHeart,
} as const;

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="surface-alt py-[clamp(2.5rem,6vh,4.5rem)]">
      <div className="container-narrow flex max-w-[660px] flex-col gap-[clamp(1.25rem,3.5vh,2rem)]">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="rule-accent text-[13px] font-extrabold uppercase tracking-[0.12em] text-accent">
            {copy.comoFunciona.eyebrow}
          </p>
          <h2 className="text-[clamp(1.375rem,1.05rem+1.3vw,2.125rem)] font-extrabold leading-[1.15] text-ink-900">
            {copy.comoFunciona.title}
          </h2>

          {/* Selo em pílula verde: é a objeção que este bloco responde, e ela
              vale mais lida de relance do que dentro de um parágrafo. */}
          <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-donate/10 px-3 py-1.5 text-[13px] font-extrabold text-donate">
            <IconShield size={15} className="shrink-0" />
            {copy.comoFunciona.seal}
          </p>
        </div>

        <ol className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {copy.comoFunciona.steps.map((step, i) => {
            const Icon = ICONES[step.icon as keyof typeof ICONES];
            return (
              <Reveal
                key={step.title}
                as="li"
                delay={(i % 3) as 0 | 1 | 2}
                className="flex items-start gap-3 rounded-md border border-ink-900/10 bg-surface p-4 sm:flex-col sm:items-center sm:gap-2.5 sm:text-center"
              >
                {/* Ícone e número no mesmo elemento: o número é a ordem do
                    passo e o ícone é o assunto dele - separados, viravam dois
                    enfeites disputando a mesma linha. */}
                <span className="relative flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-donate/10 text-donate">
                  <Icon size={24} />
                  <span
                    aria-hidden="true"
                    className="absolute -right-1 -top-1 flex h-[20px] w-[20px] items-center justify-center rounded-full bg-donate text-[11px] font-extrabold text-donate-ink"
                  >
                    {i + 1}
                  </span>
                </span>

                <div className="flex flex-col gap-1">
                  <h3 className="text-[15px] font-extrabold leading-tight text-ink-900">
                    {step.title}
                  </h3>
                  <p className="text-[13px] leading-[1.5] text-ink-600">{step.text}</p>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
