import { copy } from "@/content/landing";
import { SectionHead } from "../ui/SectionHead";
import { AbrigosLista } from "./AbrigosLista";

/**
 * Quem recebe a ração: os abrigos, com nome, cidade e perfil aberto.
 *
 * Esta seção ocupa o lugar das antigas "histórias reais" - três legendas
 * genéricas sobre fotos do acervo, que a página não tinha como comprovar.
 * Abrigo com nome, estado e perfil aberto é a mesma prova social, só que
 * verificável: a pessoa confere o trabalho sozinha, sem depender do que esta
 * página afirma.
 *
 * O card mostra o essencial e um botão só, "Saiba mais". O que dá para
 * conferir - endereço, CNPJ, responsável, Instagram e o WhatsApp da equipe -
 * está na ficha que abre no clique, sem sair da página. A lista mora em
 * `AbrigosLista` porque é ela que precisa de estado; esta seção continua sendo
 * Server Component.
 */
export function Abrigos() {
  return (
    <section id="abrigos" className="surface-alt py-[clamp(2.5rem,6vh,4.5rem)]">
      <div className="container-narrow flex max-w-[660px] flex-col gap-6">
        <SectionHead
          eyebrow={copy.abrigos.eyebrow}
          title={copy.abrigos.title}
          lead={copy.abrigos.lead}
        />

        <AbrigosLista />
      </div>
    </section>
  );
}
