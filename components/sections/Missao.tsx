import { copy } from "@/content/landing";
import { IconArrowRight } from "../ui/Icons";
import { Reveal } from "../ui/Reveal";

/**
 * "Nossa missão" - o cartão de propósito, logo depois da dobra.
 *
 * É a pergunta que uma página institucional responde antes de qualquer pedido:
 * quem é essa organização e por que ela existe. A ordem dentro do cartão é
 * rótulo → frase de missão → parágrafos → botão: primeiro o nome do assunto,
 * depois a frase que resume o porquê, e só então a explicação do que a
 * operação faz. O botão fecha mandando para os abrigos, que é a prova do que
 * acabou de ser afirmado.
 *
 * A frase de missão é `<h2>` e não parágrafo de propósito: ela é o título
 * desta seção, e o rótulo acima é só a etiqueta dela.
 *
 * O texto vem inteiro de `copy.missao` - trocar a missão é trocar o conteúdo,
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

          <div className="flex max-w-[58ch] flex-col gap-3">
            {missao.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-[16px] leading-[1.65] text-ink-600">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Contorno, e não preenchido: o botão verde de doar já aparece na
              dobra acima e na barra fixa, e um segundo botão cheio aqui
              disputaria com eles um clique que não é o desta seção. */}
          <a
            href="#abrigos"
            className="mt-1 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border-2 border-accent px-6 text-[15px] font-extrabold text-accent transition-colors hover:bg-accent-soft sm:w-auto"
          >
            {missao.cta}
            <IconArrowRight size={16} />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
