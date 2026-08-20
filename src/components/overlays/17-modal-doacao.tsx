"use client";

import { useCallback, useEffect, useRef, useState, type SVGProps } from "react";
import { CHECKOUT_EVENT, openCheckout } from "@/lib/checkout-bus";
import {
  causeById,
  donationAmountsMensal,
  donationAmountsUnica,
  testAmount,
  type Cause,
} from "@/lib/config";
import {
  centsFromBRL,
  formatBRL,
  formatBRLCurto,
  maskBRL,
} from "@/lib/format";
import {
  DONATION_MODAL_EVENT,
  type DonationIntent,
  type Freq,
} from "@/lib/modais";
import { payments } from "@/lib/payments/lusa";
import { useScrollLock } from "@/lib/scroll-lock";
import { isLocalhost } from "@/lib/test-mode";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  17 · MODAL DE DOAÇÃO - quanto, e com que frequência                  ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Bloco isolado no que é desenho: os ícones e a tela moram aqui.
 *
 * ⚠️ O que ele **não** carrega é a grade de valores, as frentes, o mínimo da
 * recorrência e a formatação do real - tudo isso vem de `lib/`. É a zona
 * crítica da página: o valor que aparece aqui é o valor que o gateway cobra, e
 * uma segunda escada de degraus escrita dentro deste arquivo seria a que um dia
 * mostra R$ 30 numa tela e cobra R$ 35 na outra.
 *
 * O texto desta tela é escrito direto no JSX ("Qual valor deseja doar?",
 * "Continuar"), como já era antes da reestrutura.
 */

/* ─────────────────────────────────────────────────────────── ícones ──── */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
    ...rest,
  };
}

const IconArrowRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
    <path d="m13 5 7 7-7 7" />
  </svg>
);

const IconClose = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const IconHeart = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8Z" />
  </svg>
);

/* ──────────────────────────────────────────────────────────── o bloco ──── */


/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  Quanto, e com que frequência                                         ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * É a primeira e única etapa antes do checkout: todo CTA de doação abre esta
 * tela direto, sem passar por um menu de "onde ajudar" antes - um passo a
 * menos entre o clique e o Pix. `causeId` continua existindo para quem chega
 * por um link com frente marcada (`MonthlyDonateButton`, por exemplo); sem
 * ele, a doação vai para a rede toda.
 *
 * ── A única vem selecionada ───────────────────────────────────────────────
 * Quem clica em "onde ajudar" ainda não decidiu se quer se comprometer com um
 * valor todo mês - forçar essa escolha antes mesmo de ver quanto custa é pedir
 * demais logo de cara. A doação única abre primeiro, sem fricção nenhuma; a
 * mensal continua a um toque de distância, na mesma tela, com o selo de
 * recomendada - quem já sabia que queria ajudar todo mês não perde nada.
 *
 * Cada frequência tem a **sua escada** (`donationAmountsUnica` contra
 * `donationAmountsMensal`): a única vai de R$ 20 a R$ 1.000, a mensal de R$ 15
 * a R$ 500 - doar R$ 100 uma vez é um gesto, R$ 100 todo mês é um compromisso,
 * e a mesma escada nas duas faria uma delas pedir errado. O selo de "mais
 * escolhido" fica em R$ 30 nos dois casos. Nenhum degrau abre marcado, e o
 * campo logo abaixo da grade recebe o que for clicado.
 *
 * ── As abas "Doação Única / Mensal" já saíram daqui uma vez ───────────────
 * Na versão de campanha o modal era só mensal, e a doação única era a grade de
 * kg da seção de ração. Elas voltam agora porque a página deixou de vender só
 * ração: tratamento, estrutura e "onde for mais urgente" não têm faixa de kg
 * nenhuma, e sem a escolha de frequência essas três frentes não teriam como
 * ser doadas.
 *
 * ── …e viram uma faixa só quando quem abriu já disse "mensal" ─────────────
 * Com `somenteMensal` o cartão é o mesmo de sempre - mesmo título, mesmo
 * emblema, mesma grade -, e o que muda é a linha da frequência: a mensal ocupa
 * a largura das duas, sozinha, sem a única ao lado. É o que os CTAs de doação
 * mensal mandam, e é o que eles prometem no rótulo. Ver
 * `DonationIntent.somenteMensal`.
 */
export default function ModalDoacao() {
  const [intent, setIntent] = useState<DonationIntent | null>(null);
  const [freq, setFreq] = useState<Freq>("unica");
  /*
   * Um estado só para o valor, e ele é o **conteúdo do campo de baixo**.
   *
   * Eram dois - o degrau clicado na grade e o texto digitado -, e o de baixo
   * tinha a palavra final. Clicar em R$ 30 marcava o cartão e deixava o campo
   * vazio: a tela mostrava a escolha em dois lugares e o valor em um só. Agora
   * clicar no cartão **escreve** no campo, digitar no campo acende o cartão de
   * mesmo valor, e o que segue para o checkout é sempre o que está escrito ali.
   */
  const [valor, setValor] = useState("");
  /** Só depois do `blur` ou do clique - ver o campo de valor livre. */
  const [mostrarMinimo, setMostrarMinimo] = useState(false);
  const fecharRef = useRef<HTMLButtonElement>(null);
  const gatilhoRef = useRef<HTMLElement | null>(null);

  const aberto = intent !== null;
  useScrollLock(aberto);

  const fechar = useCallback(() => {
    setIntent(null);
    gatilhoRef.current?.focus();
  }, []);


  useEffect(() => {
    const onAbrir = (e: Event) => {
      const detalhe = (e as CustomEvent<DonationIntent>).detail ?? {};
      gatilhoRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setIntent(detalhe);
      /* `somenteMensal` manda na frequência mesmo sem `freq` junto: quem trava
         a tela na mensal não precisa dizer duas vezes. */
      setFreq(detalhe.somenteMensal ? "mensal" : (detalhe.freq ?? "unica"));
      setValor("");
      setMostrarMinimo(false);
    };

    window.addEventListener(DONATION_MODAL_EVENT, onAbrir);
    return () => window.removeEventListener(DONATION_MODAL_EVENT, onAbrir);
  }, []);

  /* Sai de cena quando o checkout assume - dois modais empilhados, cada um com
     a sua trava de rolagem, é o caminho curto para a página voltar ao topo
     sozinha. Sem devolver o foco: quem manda nele agora é o checkout. */
  useEffect(() => {
    const onCheckout = () => setIntent(null);
    window.addEventListener(CHECKOUT_EVENT, onCheckout);
    return () => window.removeEventListener(CHECKOUT_EVENT, onCheckout);
  }, []);

  // Esc fecha - o scroll do fundo já está travado pelo `useScrollLock`.
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    window.addEventListener("keydown", onKey);
    fecharRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [aberto, fechar]);

  if (!intent) return null;

  const cause = causeById(intent.causeId);
  /* Travada na mensal: sem abas e sem a escada da única - ver
     `DonationIntent.somenteMensal`. */
  const somenteMensal = intent.somenteMensal === true;
  const mensal = somenteMensal || freq === "mensal";

  /*
   * A escada, com o degrau de R$ 0,01 na frente quando a página está sendo
   * servida de `localhost` - nas duas frequências. Ver `lib/test-mode.ts`: a
   * checagem é pelo endereço do servidor, então o centavo não existe no site
   * publicado, mesmo que este mesmo pacote seja o que sobe por FTP.
   *
   * A conta é feita no corpo do componente, e não em `useMemo`: o modal só
   * renderiza depois de um clique (`if (!intent) return null`), então não há
   * HTML pré-gerado com o centavo dentro nem divergência de hidratação.
   */
  const escada = mensal ? donationAmountsMensal : donationAmountsUnica;
  const valores = isLocalhost() ? [testAmount, ...escada] : escada;

  const cents = centsFromBRL(valor);

  /*
   * O piso da mensal não é escolha de campanha: abaixo de R$ 10 a ONZ/Infopago
   * recusa a criação do mandato de recorrência (ver `payments.recurring`). A
   * escada da mensal já começa em R$ 15 - quem esbarra nisso é sempre o campo
   * livre, e barrar aqui é melhor do que deixar a pessoa preencher nome, CPF e
   * WhatsApp para receber a recusa do gateway no fim.
   */
  const minimoCents = mensal ? payments.recurring.minCents : 0;
  const temValor = cents > 0;
  const abaixoDoMinimo = temValor && cents < minimoCents;

  /*
   * O botão continua **clicável** com valor abaixo do mínimo, e é `seguir` que
   * barra. Desabilitado ele engoliria o clique sem dizer nada, e a pessoa
   * ficaria olhando para um botão morto sem saber que o problema é o valor -
   * exatamente o que a mensagem de mínimo existe para evitar.
   */
  const podeSeguir = temValor;

  /*
   * Fecha este modal e abre o checkout no lugar dele - sem trocar de página.
   *
   * Antes era `router.push('/doar/valor?cents=…')`: escolher o valor tirava a
   * pessoa da landing, e voltar significava recarregar tudo e perder o lugar.
   * Agora todos os caminhos de doação terminam no mesmo checkout, com as
   * mesmas etapas. A rota `/doar/valor` continua existindo para quem está sem
   * JavaScript.
   */
  const seguir = () => {
    if (!podeSeguir) return;
    if (abaixoDoMinimo) {
      setMostrarMinimo(true);
      return;
    }
    openCheckout({
      kind: mensal ? "mensal" : "causa",
      amountCents: cents,
      title: tituloDoItem(cause, mensal),
      impact: impactoDoItem(cause, mensal),
      image: null,
      txid: `${cause?.txid ?? "DOACAO"}${mensal ? "MENSAL" : "UNICA"}`,
      /* Vai junto só para o "Voltar" do checkout devolver a pessoa para a
         mesma tela de onde ela saiu - travada, se travada estava. */
      somenteMensal,
    });
  };

  /*
   * A aba escolhida é uma faixa vermelha cheia, com o brilho de baixo que o
   * checkout de `doe.caioprotetor.org` usa (`0 2px 8px` do próprio vermelho a
   * 35%); a outra fica em contorno frio. Raio de 8px, como lá.
   */
  const aba = (destino: Freq) =>
    `flex min-h-[42px] items-center justify-center rounded-[8px] px-3 text-fs13 font-bold transition-colors ${
      freq === destino
        ? "bg-action text-white shadow-[0_2px_8px_rgba(191,5,33,.35)]"
        : "border border-cp-borda bg-surface text-cp-legenda hover:border-action/40 hover:text-cp-titulo"
    }`;

  return (
    /*
     * Fundo escuro **e desfocado**, como no original: `blur(8px)` sobre preto a
     * 60%. A página continua lá atrás, reconhecível, mas nada nela disputa a
     * leitura com o cartão - que é o que um modal de decisão precisa.
     */
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-2.5 backdrop-blur-[8px] anim-fade-in sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) fechar();
      }}
    >
      {/* #ui:modal-doacao */}
      {/*
        Cabeçalho, miolo e rodapé - a mesma anatomia do `CheckoutModal`, e pelo
        mesmo motivo: com nove valores na grade mais o campo livre, o cartão
        inteiro rolando levava o "Continuar" para fora da tela num celular, e o
        botão que fecha a decisão não pode depender de a pessoa rolar até ele.
        Só o miolo rola; o título e o botão ficam parados.
      */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="doacao-titulo"
        /*
          420px e cantos de 16px, com a sombra vermelha e difusa do original
          (`0 30px 80px` do vermelho a 20%) - não a sombra cinza genérica. Era
          uma folha colada na base da tela no celular (`rounded-t-lg`,
          `items-end`); agora é o mesmo cartão centralizado em qualquer
          largura, que é como o checkout de referência aparece.
        */
        className="anim-fade-up flex max-h-[92dvh] w-full max-w-[420px] flex-col overflow-hidden rounded-[16px] border border-[#e5e5e5]/90 bg-surface shadow-[0_30px_80px_rgba(191,5,33,.2)]"
      >
        {/* Emblema quadrado-arredondado, título e o X - a linha de topo do
            print de referência (`public/designe-checkout`). */}
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-[clamp(0.875rem,2.4vh,1.5rem)] sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {/* Coração **cheio** sobre rosa claro, como no original - o de
                contorno lia como ícone de "favoritar", não como emblema. */}
            <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[14px] bg-cp-prefixo-bg text-action">
              <IconHeart size={22} fill="currentColor" stroke="none" />
            </span>
            <div className="flex min-w-0 flex-col">
              {/* Só quando a pessoa chegou por uma frente marcada: aí o rótulo
                  diz onde a doação vai cair. No caminho normal - que é o do
                  print - o título vem sozinho. */}
              {cause && (
                <span className="truncate text-fs12 font-extrabold uppercase tracking-[0.08em] text-accent">
                  {cause.title}
                </span>
              )}
              {/* Azul-ardósia (`--cp-titulo`), e não o preto do resto da
                  página: é a cor que o checkout de referência usa no título e
                  nos números - ver a paleta em `globals.css`. */}
              <h2
                id="doacao-titulo"
                className="text-fs17 font-extrabold leading-tight text-cp-titulo"
              >
                Qual valor deseja doar?
              </h2>
            </div>
          </div>

          {/* 38px e cinza neutro, como no original - o X é saída, não CTA. */}
          <button
            ref={fecharRef}
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] text-[#6b6b6b] transition-colors hover:bg-ink-900/10"
          >
            <IconClose size={18} />
          </button>
        </div>

        {/* ── O miolo: a única parte que rola ─────────────────────────── */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[clamp(0.75rem,2.2vh,1.25rem)] sm:px-6">
          {cause && (
            <p className="mt-3 text-fs14 leading-[1.55] text-ink-600">{cause.text}</p>
          )}

          {/* ── A frequência, antes do valor ──────────────────────────────
              Nesta ordem porque ela muda o que a grade abaixo quer dizer:
              escolher R$ 50 e só então descobrir que era mensal seria a pessoa
              decidindo com metade da informação.

              Duas barras lado a lado, e não mais um par de pílulas dentro de
              uma trilha cinza: é o desenho do print de referência, em que a
              aba escolhida é uma faixa vermelha cheia e a outra fica em
              contorno. A única vem primeiro porque é a que abre selecionada.

              ⚠️ Quando quem abriu a tela já disse "mensal" (`somenteMensal`),
              a faixa da única **não some**: a mensal ocupa a largura das duas,
              sozinha, exatamente como o checkout de referência faz com a única.
              O cartão continua sendo o mesmo de sempre - o que muda é que não
              há segunda opção para trocar, porque o CTA prometeu doação mensal
              e oferecer a única aqui seria trocar o pedido depois do clique.

              Nesse caso ela vira **texto**, e não mais um botão: uma aba que
              não tem para onde alternar é um rótulo com cara de controle, e
              quem usa leitor de tela ouviria "botão, selecionado" sem ter o que
              selecionar. Ver `DonationIntent.somenteMensal`. */}
          {somenteMensal ? (
            <p className={`${aba("mensal")} mt-[clamp(0.625rem,1.9vh,1rem)]`}>
              Doação Mensal
            </p>
          ) : (
            <div
              role="tablist"
              aria-label="Frequência da doação"
              className="mt-[clamp(0.625rem,1.9vh,1rem)] grid grid-cols-2 gap-2"
            >
              <button
                type="button"
                role="tab"
                aria-selected={!mensal}
                onClick={() => {
                  setFreq("unica");
                  setMostrarMinimo(false);
                }}
                className={aba("unica")}
              >
                Doação Única
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={mensal}
                onClick={() => {
                  setFreq("mensal");
                  setMostrarMinimo(false);
                }}
                className={aba("mensal")}
              >
                Doação Mensal
              </button>
            </div>
          )}

          {/* Sem a linha que explicava cada frequência ("com um valor fixo todo
              mês…"): a grade de valores aparece logo abaixo da aba e é ela que
              responde a pergunta do título. O que a mensal tem de diferente -
              o débito automático - continua dito, mas só embaixo do botão, onde
              é uma autorização e não mais um argumento de venda. */}
          <div className="mt-[clamp(0.625rem,1.9vh,1rem)] grid grid-cols-3 gap-2 sm:gap-2.5">
            {valores.map((amount) => {
              const ativo = cents === amount.cents;
              return (
                <button
                  key={amount.cents}
                  type="button"
                  onClick={() => {
                    /* `maskBRL` para o campo receber o número no mesmo formato
                       em que ele seria digitado - "1.000" e não "1000". */
                    setValor(maskBRL(String(amount.cents / 100)));
                    setMostrarMinimo(false);
                  }}
                  /* Cartão do original: 48px de altura, cantos de 10px, borda
                     fria (`--cp-borda`) e o número em azul-ardósia. Marcado, a
                     borda e o texto viram o vermelho de marca. */
                  className={`relative flex min-h-[48px] flex-col items-center justify-center rounded-[10px] border px-1 py-3 text-fs15 font-bold transition-colors ${
                    ativo
                      ? "border-action bg-action/[.06] text-action"
                      : "border-cp-borda bg-surface text-cp-numero hover:border-action/40"
                  }`}
                >
                  {/*
                    A pílula âmbar pendurada no canto de cima, como no checkout
                    de referência: `#F5A623`, texto quase preto, cantos de 4px -
                    um retângulo pequeno, não uma cápsula.

                    "Mais escolhido" quebra em duas linhas dentro da pílula
                    (sem `whitespace-nowrap`, `leading-[1.1]` e `w-[52px]` para
                    a quebra cair sempre entre as duas palavras) - por isso ela
                    cabe na largura do cartão, ao contrário de escrita numa
                    linha só, que passava das duas bordas e encostava no
                    vizinho.

                    ⚠️ Ela sobe para fora do cartão (`-top-2`, um pouco mais que
                    antes por causa da segunda linha), então só funciona na
                    **primeira fileira** da grade - hoje é onde o R$ 30 está. Se
                    o destaque mudar para um valor de outra fileira, a pílula
                    passa a encostar no cartão de cima.
                  */}
                  {amount.popular && (
                    <span className="absolute -top-2 right-1.5 w-[52px] rounded-[4px] bg-[#f5a623] px-1 py-[3px] text-center text-fs9 font-bold leading-[1.1] text-[#181818]">
                      Mais escolhido
                    </span>
                  )}
                  {/* Só o número. O "/mês" que ficava embaixo do valor na aba
                      mensal saiu: a aba já diz a frequência, e a repetição
                      dentro de cada um dos nove cartões só engordava a grade. */}
                  {formatBRLCurto(amount.cents).replace(/\s/g, " ")}
                  {amount.teste && (
                    <span className="block text-fs10 font-extrabold uppercase tracking-[0.06em] text-ink-300">
                      teste
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <label className="mt-[clamp(0.75rem,2.2vh,1.25rem)] block text-fs14 font-semibold text-[#404048]">
            Ou o que o seu coração mandar ❤️:
            <div
              className={`mt-2 flex overflow-hidden rounded-[10px] border ${
                mostrarMinimo
                  ? "border-error"
                  : "border-cp-borda focus-within:border-action"
              }`}
            >
              {/* Prefixo em rosa muito claro com o "R$" no vermelho de marca -
                  é o bloco de 58px do checkout de referência. */}
              <span className="flex w-[58px] shrink-0 items-center justify-center bg-cp-prefixo-bg text-fs17 font-bold text-action">
                R$
              </span>
              <input
                inputMode="decimal"
                value={valor}
                onChange={(e) => {
                  setValor(maskBRL(e.target.value).slice(0, 12));
                  setMostrarMinimo(false);
                }}
                /* No `blur` além do clique em Continuar: descobrir o mínimo só ao
                   tentar seguir é descobrir tarde - a pessoa já tinha decidido o
                   valor. */
                onBlur={() => setMostrarMinimo(abaixoDoMinimo)}
                aria-invalid={mostrarMinimo}
                placeholder="Valor livre"
                /* `text-[16px]` fixos, fora da escala fluida: abaixo disso o
                   Safari do iPhone dá zoom ao focar o campo - ver o mesmo
                   cuidado nos campos do `CheckoutModal`. */
                className="min-h-[54px] w-full bg-surface px-3 text-[16px] font-semibold text-cp-numero outline-none placeholder:font-normal placeholder:text-cp-legenda/70"
              />
            </div>
            {mostrarMinimo && (
              <span className="mt-1.5 block text-fs12 font-semibold text-error">
                O valor mínimo para doação mensal é{" "}
                {formatBRL(payments.recurring.minCents)}.
              </span>
            )}
          </label>
        </div>

        {/* ── Rodapé fixo: o botão que fecha a decisão ─────────────────── */}
        <div className="shrink-0 bg-surface px-5 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-[clamp(0.5rem,1.7vh,0.75rem)] sm:px-6">
          {/*
            56px de altura, cantos de 14px e o halo âmbar em volta - o botão do
            checkout de referência não tem sombra projetada para baixo, tem um
            brilho da própria cor espalhado nos quatro lados. O texto sai em
            azul-ardósia, e não em preto: é o mesmo tom do título.
          */}
          <button
            type="button"
            onClick={seguir}
            disabled={!podeSeguir}
            className="inline-flex min-h-[56px] w-full items-center justify-center gap-2.5 whitespace-nowrap rounded-[14px] bg-highlight px-6 text-fs16 font-bold uppercase tracking-[0.03em] text-cp-titulo shadow-[0_0_10px_1px_rgba(243,182,57,.6)] transition hover:bg-highlight-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            Continuar
            <IconArrowRight size={18} />
          </button>

          <p className="mt-2 hidden items-center justify-center gap-1.5 text-center text-fs11-5 font-medium text-cp-legenda [@media(min-height:620px)]:flex">
            <span aria-hidden="true" className="h-[7px] w-[7px] shrink-0 rounded-full bg-donate" />
            Pagamento 100% seguro e verificado
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * O nome do item como ele aparece no checkout e é conciliado no gateway.
 *
 * Curto de propósito: o checkout mostra este texto numa linha só, com o valor
 * embaixo, e o gateway recebe a versão em maiúsculas como nome do produto.
 */
function tituloDoItem(cause: Cause | null, mensal: boolean) {
  if (!cause) return mensal ? "Doação mensal" : "Doação única";
  return mensal ? `${cause.title} (mensal)` : cause.title;
}

/** A linha de apoio do item, dentro do checkout. */
function impactoDoItem(cause: Cause | null, mensal: boolean) {
  /* Curto de propósito: esta linha vive na faixa do item, no topo do checkout,
     e cada linha que ela quebra empurra o formulário para fora da tela. O
     detalhe do débito automático está inteiro na etapa do Pix. */
  if (mensal) {
    return "Cobrado todo mês. Cancele quando quiser pelo app.";
  }
  return cause?.text ?? "Sua doação vai direto para os abrigos que apoiamos.";
}
