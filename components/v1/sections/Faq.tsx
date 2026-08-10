import { copy, faq } from "@/content/v1/landing";
import { IconChevron, IconQuestion } from "../ui/Icons";
import { Reveal } from "../ui/Reveal";
import { SectionHead } from "../ui/SectionHead";

/**
 * As dúvidas, em `<details>`/`<summary>` nativos: acordeão sem JavaScript,
 * acessível por teclado de graça e sem custo de bundle.
 */
export function Faq() {
  return (
    <section id="duvidas" className="py-[clamp(2.5rem,6vh,4.5rem)]">
      <div className="container-narrow flex max-w-[660px] flex-col gap-5">
        <SectionHead
          icon={IconQuestion}
          eyebrow={copy.faq.eyebrow}
          title={copy.faq.title}
          align="left"
        />

        <Reveal className="flex flex-col gap-2">
          {faq.map((item) => (
            <details
              key={item.q}
              className="group rounded-md border border-ink-900/10 bg-surface open:shadow"
            >
              <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 p-4 text-[15px] font-extrabold text-ink-900">
                {item.q}
                <IconChevron
                  size={17}
                  className="shrink-0 text-ink-600 transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="px-4 pb-4 text-[14px] leading-[1.6] text-ink-600">{item.a}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
