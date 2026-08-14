import { copy, timeline } from "@/content/landing";
import { IconClock } from "../ui/Icons";
import { Reveal } from "../ui/Reveal";
import { SectionHead } from "../ui/SectionHead";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  "Atualizações" - a linha do tempo da campanha                        ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Quatro entradas em ordem decrescente: a mais recente em cima, como em
 * qualquer diário de campanha. Vem depois da transparência porque as duas
 * respondem a mesma pergunta por ângulos diferentes - a tabela diz para onde o
 * dinheiro vai, esta seção diz o que aconteceu quando ele faltou.
 *
 * ── Nem toda entrada é boa notícia ────────────────────────────────────────
 * Duas delas são derrota (20 animais que não resistiram; a prefeitura que negou
 * apoio pela terceira vez), e isso é decisão de conteúdo, não descuido: linha do
 * tempo em que só há vitória é publicidade, não prestação de contas. Ver o aviso
 * em `timeline`, no arquivo de conteúdo.
 *
 * ── O desenho ─────────────────────────────────────────────────────────────
 * Um traço vertical contínuo com um marcador por entrada. O traço é um `::` no
 * `<li>` (a borda esquerda), e não um elemento próprio: assim ele acompanha a
 * altura do item sozinho, sem ninguém precisar medir nada. O último item corta
 * o traço (`last:border-transparent`) para a linha não sobrar pendurada abaixo
 * do último marcador.
 *
 * `tone` decide a cor do marcador, e as três só existem porque significam
 * coisas diferentes:
 *
 *   `now`   dourado e com halo - a entrada atual, onde a campanha está
 *   `done`  cheio - aconteceu e teve desfecho
 *   `open`  vazado - aconteceu e ficou em aberto
 */
const MARCADOR = {
  now: "bg-warning ring-4 ring-warning/20",
  done: "bg-action",
  open: "bg-surface ring-2 ring-inset ring-ink-300",
} as const;

export function Atualizacoes() {
  return (
    <section id="atualizacoes" className="surface-alt py-[clamp(2.5rem,6vh,4.5rem)]">
      <div className="container-narrow flex max-w-[660px] flex-col gap-6">
        <SectionHead
          icon={IconClock}
          eyebrow={copy.atualizacoes.eyebrow}
          title={copy.atualizacoes.title}
          lead={copy.atualizacoes.lead}
          align="left"
        />

        <ol className="flex flex-col">
          {timeline.map((item, i) => (
            <Reveal
              key={item.title}
              as="li"
              /* O escalonamento para no quarto item: `Reveal` só tem quatro
                 degraus de atraso, e uma lista maior que isso passaria a
                 receber `undefined`. */
              delay={Math.min(i, 3) as 0 | 1 | 2 | 3}
              /* `pb` no lugar de `gap`: o traço é a borda esquerda do próprio
                 item, então o espaço entre um e outro precisa estar *dentro*
                 dele - com `gap`, a linha ficaria picotada nos vãos. */
              className="relative border-l-2 border-ink-900/10 pb-7 pl-6 last:border-transparent last:pb-0"
            >
              {/* O marcador monta em cima da linha: metade da largura para a
                  esquerda (`-left-[7px]` para 12px de bolinha + 2px de traço). */}
              <span
                aria-hidden="true"
                className={`absolute -left-[7px] top-[6px] h-3 w-3 rounded-full ${MARCADOR[item.tone]}`}
              />

              <p className="text-fs12 font-extrabold uppercase tracking-[0.08em] text-accent">
                {item.date}
              </p>
              <h3 className="mt-1 text-fs16 font-extrabold leading-[1.3] text-ink-900">
                {item.title}
              </h3>
              <p className="mt-1.5 text-fs14 leading-[1.6] text-ink-600">
                {item.text}
              </p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
