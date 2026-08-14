import type { ReactNode } from "react";
import { copy, historiaPhotos } from "@/content/landing";
import { PhotoSlideshow } from "../ui/PhotoSlideshow";
import { Reveal } from "../ui/Reveal";

/**
 * "Quem é o Caio" - a história, logo depois da dobra.
 *
 * É a pergunta que uma campanha pessoal responde antes de qualquer pedido:
 * quem está pedindo, e por quê. A ordem é rótulo → frase → fotos → história →
 * citação → desfecho. Sem botão no fim: o CTA verde já está na dobra acima e no
 * botão flutuante, e "Conheça os abrigos" competia com os dois por um clique que
 * esta seção não precisa pedir.
 *
 * ── Não é um cartão ───────────────────────────────────────────────────────
 * Já foi: bloco creme (`bg-surface-alt`) com cantos arredondados e preenchimento
 * generoso, desenhado como um cartão sobre o branco da página. O fundo saiu -
 * a história do Caio é o corpo da página, não um aparte dentro dela, e a moldura
 * a empurrava para longe do texto que vem antes e depois. O único bloco com
 * moldura própria aqui passa a ser a citação, e é isso que a destaca.
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
 * ── Os realces em vermelho ────────────────────────────────────────────────
 * Seis trechos saem no vermelho da marca, no meio do parágrafo cinza: o que o
 * Caio faz, quem é a organização, e as frases que dizem o tamanho da urgência.
 * Quais são eles é decisão de conteúdo e está em `copy.missao.realces` - aqui
 * só mora a mecânica de pintá-los (`comRealces`, no fim do arquivo).
 *
 * O texto vem inteiro de `copy.missao` - trocar a história é trocar o conteúdo,
 * nunca este componente.
 */
export function Missao() {
  const { missao } = copy;

  return (
    <section id="missao" className="py-[clamp(2.5rem,6vh,4.5rem)]">
      <div className="container-narrow">
        {/* Sem fundo e sem preenchimento próprios: a seção assenta direto no
            branco da página. O respiro lateral já vem do `container-narrow`
            (20px, 32px no desktop) e o vertical do `py` da `<section>` - por
            isso tirar o `p-6/sm:p-8/md:p-12` daqui não cola o texto na borda
            da tela nem encosta na seção de cima. */}
        <Reveal className="mx-auto flex max-w-[760px] flex-col items-center gap-5 text-center">
          <p className="text-fs13 font-extrabold uppercase tracking-[0.12em] text-accent">
            {missao.eyebrow}
          </p>

          <h2 className="max-w-[24ch] text-balance text-[clamp(1.279rem,0.977rem+1.209vw,1.86rem)] font-extrabold leading-[1.2] text-ink-900">
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
                className="text-fs16 leading-[1.65] text-ink-600"
              >
                {comRealces(paragraph, missao.realces)}
              </p>
            ))}
          </div>

          {/* Barra à esquerda e fundo quente: é o único bloco de texto da
              página com moldura própria, e é de propósito - ver acima.

              O texto sai em preto, e o vermelho ficou só na moldura (barra e
              fundo). Ele já era vermelho por dentro também, e isso disputava
              com os seis realces dos parágrafos: numa seção em que vermelho
              significa "leia esta frase", um bloco inteiro vermelho tira o
              sentido da marcação. A moldura sozinha já destaca a citação. */}
          <blockquote className="w-full max-w-[58ch] rounded-md border-l-4 border-action bg-action/[.06] p-4 text-left text-fs15 font-semibold leading-[1.6] text-ink-900 sm:p-5">
            {missao.quote}
          </blockquote>

          <div className="flex max-w-[58ch] flex-col gap-3">
            {missao.paragraphsAfter.map((paragraph) => (
              <p
                key={paragraph}
                className="text-fs16 leading-[1.65] text-ink-600"
              >
                {comRealces(paragraph, missao.realces)}
              </p>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/**
 * Pinta em vermelho os trechos de `realces` que aparecerem em `texto`.
 *
 * Procura cada trecho como texto literal (`indexOf`), na ordem em que eles
 * aparecem no parágrafo, e devolve a mistura de string crua e `<strong>`. O que
 * não for encontrado é ignorado em silêncio: a lista de realces cobre a seção
 * inteira e cada parágrafo casa só com uma parte dela - e, mais importante,
 * reescrever a história em `content/landing.ts` nunca pode quebrar a tela, no
 * máximo apagar um realce.
 *
 * `<strong>`, e não `<span>`: o trecho está em destaque porque *importa*, que é
 * exatamente o que a tag significa. O peso vem em `font-semibold` para não
 * chegar ao 700 do padrão do navegador - dentro de um parágrafo de 16px, o
 * vermelho já separa o trecho sozinho, e negrito cheio junto viraria grito.
 *
 * Trechos que se sobrepõem: vale o que começa antes; o outro é descartado.
 * Não há caso assim hoje, e a alternativa seria aninhar `<strong>` dentro de
 * `<strong>`, que não pinta nada de novo e complica a montagem.
 */
function comRealces(texto: string, realces: readonly string[]) {
  const marcas = realces
    .map((trecho) => ({ trecho, inicio: texto.indexOf(trecho) }))
    .filter(({ inicio }) => inicio !== -1)
    .sort((a, b) => a.inicio - b.inicio);

  const partes: ReactNode[] = [];
  let cursor = 0;

  for (const { trecho, inicio } of marcas) {
    if (inicio < cursor) continue;
    if (inicio > cursor) partes.push(texto.slice(cursor, inicio));
    partes.push(
      <strong key={inicio} className="font-semibold text-action">
        {trecho}
      </strong>,
    );
    cursor = inicio + trecho.length;
  }

  // Nenhum realce neste parágrafo: devolve a string, e não um array de uma
  // posição só - é um nó de texto a menos para o React reconciliar.
  if (!partes.length) return texto;

  if (cursor < texto.length) partes.push(texto.slice(cursor));
  return partes;
}
