import { heroCopy, heroVideo, historiaPhotos } from "@/content/landing";
import { DonateMenuButton } from "../DonateMenuButton";
import { CampaignProgress } from "../ui/CampaignProgress";
import { IconArrowRight, IconHeart, IconShield } from "../ui/Icons";
import { PawTrails } from "../ui/PawTrails";
import { PhotoSlideshow } from "../ui/PhotoSlideshow";
import { Reveal } from "../ui/Reveal";
import { VturbPlayer } from "../ui/VturbPlayer";

/**
 * Primeira dobra da campanha, e ela fecha em **uma tela**:
 *
 *   manchete → linha de apoio → vídeo → os dois botões → selo
 *
 * ── O VSL voltou para o miolo da dobra ────────────────────────────────────
 * No site institucional este espaço era um slide de fotos: um vídeo de vendas
 * é o argumento de uma *campanha*, e ali a página existia para apresentar a
 * organização. Aqui é campanha de novo, e o vídeo é o argumento - é o Caio
 * contando a própria história, que é o que faz alguém doar. O slide continua
 * como plano B: com `heroVideo.vturb: null` a dobra cai para as fotos sozinha,
 * sem ninguém mexer neste arquivo.
 *
 * ── Quem cede altura é o vídeo ────────────────────────────────────────────
 * A seção tem **altura travada** em uma tela (100svh menos a barra fixa), e o
 * vídeo é quem se ajusta ao que sobra. O player é width-driven - o VTurb
 * segura a altura por `padding-top` em % da largura -, então limitar a altura
 * dele não adianta nada: quem precisa encolher é a **largura**, e é isso que o
 * `max-width` do quadro faz, calculando a maior largura cuja altura ainda cabe
 * na sobra da dobra (ver o comentário no quadro).
 *
 * Já foi `min-height`, e o resultado era o que o print do notebook mostrava: a
 * seção crescia junto com o vídeo e a barra de meta, os dois botões e o selo
 * caíam abaixo da linha da tela. Numa página cujo primeiro pedido é "escolher
 * um valor", o botão não pode depender de rolagem.
 *
 * O `min-h` de 520px é o limite da conta: abaixo disso (celular deitado,
 * basicamente) não sobra altura para o vídeo existir, a seção para de encolher
 * e a página rola um pouco. Rolar é melhor do que espremer o player.
 */
export function Hero() {
  const { vturb } = heroVideo;

  return (
    /*
      Uma tela, nem mais nem menos: `height` travada em 100svh menos a barra
      fixa, com um piso de 520px para telas deitadas. `svh` e não `vh` porque
      no celular a `vh` ignora a barra do navegador e deixaria a dobra sempre
      um naco maior que a tela.
    */
    <section
      id="topo"
      className="surface-alt relative flex h-[max(520px,calc(100svh-var(--header-h)))] flex-col justify-center overflow-hidden"
    >
      <PawTrails />

      {/*
        Uma coluna só, e todo mundo na mesma medida: `--hero-col` (definida em
        `globals.css`, com a conta e o porquê). Manchete, vídeo, barra de meta e
        botões saem todos com ela.
      */}
      <div className="container-narrow relative flex h-full max-w-[860px] flex-col items-center justify-center gap-[clamp(0.5rem,1.4vh,1rem)] py-[clamp(0.75rem,2vh,1.5rem)] text-center">
        <Reveal className="flex flex-col items-center gap-2">
          {/*
            H1 único da página. A escala tem `vw` e `vh` no mesmo termo: a
            largura manda no tamanho do cartaz, mas cada pixel de fonte aqui
            sai da altura do vídeo, então a altura da janela precisa ter voz.
          */}
          {/*
            ── A manchete tem medida própria, e é a única peça que tem ────────
            Ela usa a largura inteira da dobra (860px menos o respiro lateral),
            contra os ~475-594px da coluna. É o que faz a frase fechar em **duas
            linhas** no notebook e no desktop: na medida da coluna, "400
            filhinhos que sofrem todos os dias." não cabe numa linha só com
            fonte de cartaz - só caberia encolhendo a fonte para ~23px, que é
            menor do que ela era. Alargando a manchete, a fonte pôde **crescer**
            (o teto subiu de 2,25rem para 2,4rem) e a frase ainda fecha em duas.

            ⚠️ O teto de 2,4rem é o limite medido: a 2,625rem a frase voltava a
            três linhas em telas de 1440px para cima, porque a fonte crescia
            mais rápido do que a largura disponível. Ao mexer nele, confira as
            duas pontas - 1366 e 1920.

            As duas frases são dois `block`, e não texto corrido com `balance`:
            a quebra cai sempre entre elas ("Um protetor desesperado!" /
            "400 filhinhos que sofrem todos os dias."), que é onde a frase pede
            para respirar. Deixada ao critério do navegador, ela caía no meio da
            segunda oração e a manchete virava três linhas tortas.

            No celular cada uma delas ainda quebra sozinha, porque lá não existe
            largura - e é o que já acontecia antes.
          */}
          <h1 className="w-full text-balance text-[clamp(1.279rem,0.883rem+1.256vw+0.465vh,2.232rem)] font-extrabold leading-[1.12] text-ink-900">
            <span className="block">{heroCopy.headline}</span>
            <span className="block text-action">{heroCopy.headlineAccent}</span>
          </h1>

          {/* Some em tela baixa: é a linha que a manchete já resume, e o espaço
              dela vale mais para o vídeo.

              O limite era 700px de janela, e por isso ela **aparecia** num
              notebook de 768 - onde ela e o selo, somados, comiam 55px que
              faltavam justamente ao player. 820px é a altura a partir da qual
              a dobra comporta os dois sem apertar o vídeo. */}
          <p className="hidden max-w-[46ch] text-[clamp(0.814rem,1.488vh,0.93rem)] leading-[1.5] text-ink-600 [@media(min-height:820px)]:block">
            {heroCopy.lead}
          </p>
        </Reveal>

        {/*
          `flex-initial` (`flex: 0 1 auto`): o slot toma a altura natural do
          vídeo e **encolhe** se precisar, mas não cresce. Com `flex-1` ele
          engolia toda a sobra da dobra e centralizava o player dentro dela -
          o vídeo ficava do mesmo tamanho e o que aparecia era um buraco em
          volta dele. Sem crescer, a sobra volta para o `justify-center` da
          seção e vira respiro em cima e embaixo da pilha inteira.
        */}
        {/*
          `flex-1` + `min-h-0`: o slot **toma a sobra da dobra** e passa a ter
          uma altura definida - é dela que o quadro do vídeo se mede (ver
          abaixo). Já foi `flex-initial` para não "engolir a sobra e deixar um
          buraco em volta do player": aquilo acontecia porque o quadro era
          medido pela largura e ignorava a altura do slot. Medido pela altura,
          ele preenche o que recebe, e não sobra buraco nenhum.
        */}
        <Reveal
          delay={1}
          className="flex min-h-0 w-full flex-1 items-center justify-center"
        >
          {vturb ? (
            /*
              ── O quadro do player: medido pela ALTURA que sobrou ────────────
              `height: 100%` + `aspect-ratio` + `width: auto`: o quadro recebe a
              altura do slot (que é a sobra da dobra, ver o `flex-1` acima) e a
              largura sai da proporção do vídeo. O teto é a medida da coluna -
              os mesmos 594px da manchete, da barra e dos botões.

              ⚠️ Isto substituiu uma conta com constante:
              `min(560px, (100svh - header - 23rem) × 1,28)`. Os 23rem eram um
              chute do quanto o resto da pilha ocupa, e ele custava duas coisas:

                • **desalinhamento** - num 1366×768 a conta dava 413px de vídeo
                  contra 594 da manchete e 520 dos botões, três medidas
                  diferentes na mesma coluna centralizada;
                • **sobreposição** - baixar a constante para engordar o vídeo
                  fazia o slot encolher além do conteúdo e o player passava por
                  cima do contador de doações.

              Medido pela altura não há constante para acertar: o que sobra é o
              que o vídeo ocupa, e o que não couber vira largura menor - nunca
              transbordo. O player do VTurb segura a própria altura com
              `padding-top` de 78,125% da largura, que é a mesma proporção
              daqui, então ele preenche o quadro exatamente.
            */
            <div
              className="mx-auto"
              style={{
                aspectRatio: heroVideo.aspect,
                height: "100%",
                width: "auto",
                maxWidth: "min(var(--hero-col), 100%)",
              }}
            >
              <VturbPlayer
                playerId={vturb.playerId}
                scriptSrc={vturb.scriptSrc}
                smartplayerSrc={vturb.smartplayerSrc}
                streamSrc={vturb.streamSrc}
                ratio={vturb.ratio}
                poster={vturb.poster}
              />
            </div>
          ) : (
            <PhotoSlideshow
              photos={historiaPhotos}
              label={heroCopy.headline}
              controls
              priority
              interval={4200}
              sizes="(min-width: 600px) 520px, 100vw"
              className="h-full max-h-[640px] w-full max-w-[520px] rounded-md border border-ink-900/10 shadow"
            />
          )}
        </Reveal>

        <Reveal
          delay={2}
          className="flex w-full flex-col items-center gap-[clamp(0.5rem,1.2vh,0.75rem)]"
        >
          {/* A barra de meta, na mesma largura dos botões logo abaixo: os dois
              formam uma coluna só sob o vídeo. Vem antes deles de propósito -
              é o argumento ("falta isto") que o botão responde. */}
          <CampaignProgress className="max-w-[var(--hero-col)]" />
          {/*
            Os dois botões, na mesma linha e na mesma medida - só a pintura
            muda. No celular eles empilham, porque lado a lado numa largura de
            350px o rótulo quebraria em duas linhas.
          */}
          <div className="flex w-full max-w-[var(--hero-col)] flex-col items-stretch gap-[clamp(0.5rem,1.2vh,0.75rem)] sm:flex-row">
            {/* Abre a tela de valor (`DonationModal`) direto; sem JavaScript
                continua sendo um link para o bloco de doação. */}
            <DonateMenuButton className="inline-flex min-h-[clamp(2.875rem,5.2vh,3.25rem)] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-donate px-5 text-[clamp(0.814rem,1.302vh,0.872rem)] font-extrabold uppercase tracking-[0.03em] text-donate-ink shadow-[0_10px_30px_-8px_rgba(27,138,75,.55)] transition-colors hover:bg-donate-hover">
              <IconHeart size={17} />
              {heroCopy.ctaPrimary}
            </DonateMenuButton>

            <a
              href="#abrigos"
              className="inline-flex min-h-[clamp(2.875rem,5.2vh,3.25rem)] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-ink-900/[.12] bg-surface px-5 text-[clamp(0.814rem,1.302vh,0.872rem)] font-extrabold text-ink-900 transition-colors hover:border-action hover:text-action"
            >
              {heroCopy.ctaSecondary}
              <IconArrowRight size={16} />
            </a>
          </div>

          {/* Some antes de tudo em tela baixa: é a linha menos essencial da
              dobra, e o CNPJ está publicado na seção de documentação.

              `mt-[5px]` em cima do `gap` da coluna: o selo é uma legenda dos
              botões, não mais um item da pilha, e colado neles lia como um
              terceiro controle. São 5px fixos de propósito - o `gap` já
              encolhe com a altura da tela, e um respiro que também encolhe
              desaparece justo onde ele é mais necessário. */}
          <span className="mt-[5px] hidden items-center gap-1.5 [@media(min-height:800px)]:inline-flex">
            <IconShield size={15} className="shrink-0 text-donate" />
            <span className="text-fs13 font-semibold text-ink-600">
              {heroCopy.seal}
            </span>
          </span>
        </Reveal>
      </div>
    </section>
  );
}
