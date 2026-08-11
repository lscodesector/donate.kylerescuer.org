import Image from "next/image";
import { copy, stories } from "@/content/v1/landing";
import { IconSparkle } from "../ui/Icons";
import { Reveal } from "../ui/Reveal";
import { SectionHead } from "../ui/SectionHead";

/**
 * As histórias, com as fotos reais do acervo.
 *
 * O `alt` da imagem descreve a cena para quem usa leitor de tela; o título e o
 * texto visíveis são a narrativa. São coisas diferentes de propósito - legenda
 * não é texto alternativo, e repetir uma como a outra atrapalha os dois usos.
 *
 * Foto e texto lado a lado a partir de `sm`, empilhados no celular. As fotos
 * são `lazy` por padrão (só a do hero é `priority`).
 */
export function Historias() {
  return (
    <section className="surface-alt py-[clamp(2.5rem,6vh,4.5rem)]">
      <div className="container-narrow flex max-w-[660px] flex-col gap-6">
        <SectionHead
          icon={IconSparkle}
          eyebrow={copy.stories.eyebrow}
          title={copy.stories.title}
          align="left"
        />

        <ul className="flex flex-col gap-4">
          {stories.map((story, i) => (
            <Reveal
              as="li"
              key={story.image.src}
              delay={(i % 3) as 0 | 1 | 2}
              className="flex flex-col overflow-hidden rounded-md border border-ink-900/10 bg-surface shadow sm:flex-row"
            >
              <div className="relative aspect-[16/10] w-full shrink-0 sm:aspect-square sm:w-[190px]">
                <Image
                  src={story.image.src}
                  alt={story.image.alt}
                  fill
                  sizes="(min-width: 640px) 190px, 92vw"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col justify-center gap-1.5 p-4 sm:p-5">
                <h3 className="text-[16px] font-extrabold leading-[1.3] text-ink-900 sm:text-[17px]">
                  {story.title}
                </h3>
                <p className="text-[14px] leading-[1.55] text-ink-600">{story.text}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
