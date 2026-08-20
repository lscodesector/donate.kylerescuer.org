# Design tokens

Tudo aqui já está escrito em `estilos/globals.css`. Este documento é a
**consulta rápida**: o que existe, quando usar cada um e o que não misturar.

## Cores

### Neutros — a página inteira

| Token Tailwind | Valor | Onde entra |
|---|---|---|
| `text-ink-900` / `bg-ink-900` | `#282523` | Todo título e todo texto forte |
| `text-ink-600` | `#56504B` | Texto de apoio, parágrafo, legenda |
| `text-ink-300` | `#B9B2AC` | Texto desligado, marca d'água |
| `bg-surface` | `#FFFFFF` | Fundo padrão da seção |
| `surface-alt` (classe) | `#FAF7F4` | Fundo da seção **alternada** |

O `ink-900` é cinza-escuro quente, não preto. É intencional: preto puro numa
página de doação lê como documento, não como conversa.

### Ação — a cor da marca 🎨

| Token | Valor | Onde entra |
|---|---|---|
| `bg-action` | `#BF0521` | Botão principal, barrinha do menu, régua do eyebrow |
| `bg-action-hover` | `#99041A` | O mesmo 20% mais escuro |
| `text-action-ink` | `#FFFFFF` | Texto **por cima** do action |
| `text-accent` | `#BF0521` | Eyebrow, ícone de detalhe, link |
| `bg-accent-soft` | `rgba(191,5,33,.12)` | Fundo de ícone em quadrado |

**A página tem um vermelho só.** Já teve dois (`#DD1C2D` de detalhe e
`#E11D2E` de botão) e a diferença não dizia nada — só reprovava em contraste.

### Doação — o verde

| Token | Valor | Onde entra |
|---|---|---|
| `bg-donate` | `#1B8A4B` | Botão de doar, barra de progresso, ícone |
| `bg-donate-hover` | `#146B3A` | Hover do botão |
| `text-donate-ink` | `#FFFFFF` | Texto por cima do verde cheio |
| `text-donate-text` | `#187942` | ⚠️ Verde **como texto**, mais escuro |

> ⚠️ **Nunca use `text-donate` para texto.** Ele dá 4,39:1 no branco e 4,07:1
> dentro da pílula `bg-donate/10` — reprova nos dois. `text-donate-text` passa
> em todos (5,45 / 5,11 / 4,52). O ícone pode ficar no verde original, porque
> para elemento gráfico o mínimo é 3:1.

### Sinalização e apoio

| Token | Valor | Onde entra |
|---|---|---|
| `text-success` | `#1B8A4B` | Confirmação |
| `text-warning` | `#C8760A` | Âmbar escuro — o ponto "agora" da timeline, fatia de custo |
| `text-error` | `#BF0521` | O mesmo vermelho de marca |
| `bg-progress` | `#E8A33D` | Preenchimento de barra secundária |
| `bg-highlight` | `#F4BC4B` | Amarelo de "olhe aqui": botão Continuar, selo "mais escolhido" |
| `bg-night` | `#0B0A09` | Faixa escura cinematográfica |
| `bg-graphite` | `#211F1D` | Fundo do rodapé |

> `--sos-warning` (âmbar escuro) e `--sos-highlight` (amarelo claro) **não são
> intercambiáveis**. O primeiro é sinalização; o segundo, num botão grande,
> é o único que deixa o preto por cima legível.

### Checkout — os tons frios

Só dentro do modal de checkout. Não vazam para o resto da página.

| Token | Valor | Onde |
|---|---|---|
| `text-cp-titulo` | `#2C425C` | Azul-ardósia — título e texto do botão amarelo |
| `text-cp-numero` | `#1A2535` | O número do cartão de valor |
| `border-cp-borda` | `#E4E9F0` | Borda fria dos cartões |
| `text-cp-legenda` | `#6B7A90` | Legenda, selo de segurança |
| `bg-cp-prefixo-bg` | `#FDF0F1` | Fundo do prefixo "R$" |

## Tipografia

Fonte única: **Inter**, nos pesos 400, 600 e 800. Carregada via
`next/font/google` no layout, exposta como `--font-inter`.

### A escala é fluida — sempre

Nenhum tamanho é fixo. Cada degrau é um `clamp` que sai do piso a **360px** de
tela e chega ao teto a **1280px**.

| Classe | Piso → teto | Onde entra |
|---|---|---|
| `text-fs9` | 9px fixo | Selo "Mais escolhido" |
| `text-fs11` | 10 → 10.5px | Número dentro de bolha, legenda mínima |
| `text-fs12` | 11 → 11.5px | Assinatura do rodapé |
| `text-fs13` | 11.5 → 12.5px | **Eyebrow**, texto de card, selo em pílula |
| `text-fs14` | 12.5 → 13.5px | Resposta do FAQ, item de lista |
| `text-fs15` | 13 → 14px | **Título de card**, item de menu, botão |
| `text-fs16` | 14 → 15px | Linha de apoio da seção (`lead`) |
| `text-fs17`…`fs21` | — | Casos pontuais |
| `text-body` | 15 → 16px | O padrão herdado do `<body>` |

### Títulos

| Classe | Onde |
|---|---|
| `text-h2` / `text-h2-lg` | Título de seção genérico |
| `text-h1` / `text-h1-lg` | Título grande |
| `text-display` / `text-display-lg` | Cartaz |

Na prática, **o título de seção usa a medida escrita por extenso**:

```
text-[clamp(1.279rem,0.977rem+1.209vw,1.976rem)] font-extrabold leading-[1.15] text-ink-900
```

Ela está no `SectionHead` — use o componente e você não precisa lembrar dela.

### A regra da conta

Piso a 360px, teto a 1280px, e o termo do meio é sempre:

```
piso + (teto − piso) ÷ 9,2 × 1vw
```

9,2 é quanto 1vw cresce em pixels entre 360 e 1280. **Mexer no piso ou no teto
sem refazer o termo do meio quebra o encontro nas pontas.**

## Espaçamento

### Vertical de seção — só dois valores

```
py-[clamp(2.5rem,6vh,4.5rem)]   ← toda seção comum
py-[clamp(3rem,7vh,5rem)]       ← só o CTA final, que fecha a página
```

### Containers

| Classe | Largura máx. | Padding lateral |
|---|---|---|
| `container-narrow` | 1040px | 20px → 32px em `md` |
| `container-grid` | 1140px | 20px |
| `container-wide` | 1280px | 20px → 40px em `md` |

**O padrão é `container-narrow` com `max-w-[660px]` dentro.** Os 660px são a
medida de leitura da página; o container é a folga lateral.

### Gap dentro da seção

| Valor | Uso |
|---|---|
| `gap-5` | Cabeça + conteúdo, o padrão |
| `gap-6` | Quando há listas grandes |
| `gap-3` / `gap-4` | Entre cards de uma grade |
| `gap-2` | Entre itens de acordeão |

## Raios

| Token | Valor | Uso |
|---|---|---|
| `rounded-sm` | 8px | Quadrado de ícone, botão de hambúrguer |
| `rounded-md` | 16px | **Card, acordeão, painel** — o raio padrão |
| `rounded-full` | — | Botão, pílula, selo, avatar |
| `rounded-[10px]` | 10px | Cartão de valor no checkout (medida do original) |
| `rounded-[14px]` | 14px | Botão amarelo do checkout |

## Sombra

| Classe | Uso |
|---|---|
| `shadow` | O padrão: `0 2px 12px rgba(20,17,15,.08)` |
| `shadow-[0_10px_30px_-10px_rgba(191,5,33,.5)]` | Botão vermelho grande |
| `shadow-[0_8px_20px_-8px_rgba(27,138,75,.6)]` | Botão verde da barra fixa |
| `shadow-[0_-8px_24px_-8px_rgba(0,0,0,.12)]` | Barra fixa da base (sombra para cima) |
| `shadow-[8px_0_40px_-12px_rgba(20,17,15,.35)]` | Gaveta lateral |

## Bordas

Quase tudo é `border border-ink-900/10`. As variações existem por motivo:

| Classe | Onde |
|---|---|
| `border-ink-900/10` | Card, acordeão, divisória — **o padrão** |
| `border-ink-900/[.07]` | Divisória entre itens de menu (mais leve, são muitos) |
| `border-ink-900/[.12]` | Borda de botão em contorno (precisa ser vista) |
| `border-2` | Só botão em contorno |

## Z-index — a pilha inteira

| Camada | z | Quem |
|---|---|---|
| Conteúdo | — | A página |
| Barra fixa do topo | `z-40` | `01-menu` (`sticky`) |
| Barra fixa da base | `z-40` | `16-flutuante` |
| Gaveta do menu + véu | `z-50` | `01-menu` |
| Modal de doação | `z-60` | `17-modal-doacao` |
| Modal de documento | `z-65` | `19-modal-documento` |
| Checkout | `z-70` | `18-checkout` |

> ⚠️ A gaveta vive **fora** do `<header>`. O header é `sticky z-40`, o que abre
> um contexto de empilhamento próprio — lá dentro, nenhum z-index da gaveta
> passaria por cima da barra fixa de doação, que também é 40.

## Altura da barra fixa

```
--header-h: 72px;          /* padrão */
--header-h: 77px;          /* a partir de 1024px */
```

Qualquer âncora respeita isso sozinha, via
`:where([id]) { scroll-margin-top: calc(var(--header-h) + 12px) }`.

## Animação

| Classe | O quê |
|---|---|
| `.reveal` + `data-visible` | Revelação ao rolar — use o componente `Reveal` |
| `.reveal-delay-1/2/3` | 0.08s / 0.16s / 0.24s de atraso escalonado |
| `.anim-fade-up` | Entrada de baixo (barra fixa) |
| `.anim-fade-in` | Só opacidade (véu do menu) |
| `.anim-slide-in-left` | Gaveta entrando pela esquerda |
| `.anim-pulse-ring` | Anel pulsante em volta de um botão |
| `.marquee-track` | Fileira que desliza em loop (parceiros) |
| `.paw-step` | Rastro de patinhas do fundo do hero |
| `.rule-accent` | Régua de 48px que cresce sob o eyebrow |

**Todas param em `prefers-reduced-motion: reduce`** — a regra global zera
duração de animação e transição. Não escreva animação em JS que ignore isso.
