import { copy, faq, whatsappHref } from "@/content/landing";
import { IconChevron, IconWhatsApp } from "../ui/Icons";
import { Reveal } from "../ui/Reveal";
import { SectionHead } from "../ui/SectionHead";

/**
 * As dúvidas, em `<details>`/`<summary>` nativos: acordeão sem JavaScript,
 * acessível por teclado de graça e sem custo de bundle.
 *
 * São cinco perguntas, e o corte está documentado em `faq`, no
 * `content/landing.ts` - não em quantas cabem na tela.
 *
 * ── Alinhamento no celular ────────────────────────────────────────────────
 * Pergunta e resposta ficavam centralizadas abaixo de `sm`, e havia um vão
 * fantasma (`w-[17px]`) do lado esquerdo do `<summary>` só para compensar a
 * largura da seta e o texto cair no centro exato. Texto centralizado numa
 * lista de perguntas é o que mais custa a ler no celular: cada linha começa
 * num ponto diferente, e a resposta, com três ou quatro linhas, vira um
 * losango. Agora as duas alinham à esquerda em qualquer largura, o vão
 * fantasma saiu e a seta é o único elemento à direita.
 */
export function Faq() {
  return (
    <section id="duvidas" className="py-[clamp(2.5rem,6vh,4.5rem)]">
      <div className="container-narrow flex max-w-[660px] flex-col gap-5">
        <SectionHead
          eyebrow={copy.faq.eyebrow}
          title={copy.faq.title}
          lead={copy.faq.lead}
        />

        <Reveal className="flex flex-col gap-2">
          {faq.map((item) => (
            <details
              key={item.q}
              className="group rounded-md border border-ink-900/10 bg-surface open:shadow"
            >
              <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-left text-[15px] font-extrabold leading-[1.35] text-ink-900">
                <span className="flex-1">{item.q}</span>
                <IconChevron
                  size={18}
                  className="mt-0.5 shrink-0 self-start text-ink-600 transition-transform group-open:rotate-180"
                />
              </summary>
              {/* `pt-0` com o respiro vindo do `pb` do `<summary>`: sem isso a
                  resposta abria colada na pergunta no celular. */}
              <p className="px-4 pb-4 text-left text-[14px] leading-[1.6] text-ink-600">
                {item.a}
              </p>
            </details>
          ))}
        </Reveal>

        {/* Quem chega ao fim da lista sem achar a resposta não fica num beco
            sem saída. É o único link para fora desta seção, e ele vai para o
            mesmo WhatsApp que a última pergunta cita - o botão flutuante saiu
            da página, então este é o caminho de contato no meio dela. */}
        <Reveal delay={1} className="flex flex-col items-center gap-3 pt-2 text-center">
          <p className="text-[15px] text-ink-600">{copy.faq.help}</p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-[#25D366] px-8 text-[15px] font-extrabold text-white shadow transition-[filter] hover:brightness-95"
          >
            <IconWhatsApp size={21} />
            {copy.faq.ctaWhatsapp}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
