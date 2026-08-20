# Padrões — as receitas

Copie e cole. Cada receita abaixo é a que já está no ar; se você escrever uma
variação, ela vira a peça que destoa da rede inteira.

## Botões

### Primário — vermelho de marca
Fechamento de página, pedido de doação na gaveta.

```tsx
className="inline-flex min-h-[56px] items-center justify-center gap-2 whitespace-nowrap
           rounded-full bg-action px-6 text-fs15 font-extrabold uppercase
           tracking-[0.03em] text-action-ink
           shadow-[0_10px_30px_-10px_rgba(191,5,33,.5)]
           transition-colors hover:bg-action-hover"
```

### Doação — verde
Barra fixa da base, CTA de doar dentro da página.

```tsx
className="inline-flex min-h-[56px] w-full items-center justify-center gap-2
           whitespace-nowrap rounded-full bg-donate px-6 text-fs15 font-extrabold
           uppercase tracking-[0.03em] text-donate-ink shadow
           transition-colors hover:bg-donate-hover"
```

### Secundário — contorno
Sempre que a ação **não** deve disputar com o botão principal.

```tsx
className="inline-flex min-h-[56px] items-center justify-center gap-2
           whitespace-nowrap rounded-full border-2 border-ink-900/[.12] bg-surface
           px-6 text-fs15 font-extrabold text-ink-900
           transition-colors hover:border-action hover:text-action"
```

Variante em verde (o par do CTA final):

```tsx
className="… border-2 border-donate bg-surface text-donate
           hover:bg-donate hover:text-donate-ink"
```

### Só ícone — redondo
Compartilhar na barra, redes no rodapé.

```tsx
<button aria-label="Compartilhar a campanha" title="Compartilhar a campanha"
  className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center
             rounded-full border-2 border-ink-900/[.12] bg-surface text-ink-900
             transition-colors hover:border-action hover:text-action">
```

> ⚠️ Botão só-ícone **exige** `aria-label` — sem ele o leitor de tela anuncia
> "botão" e mais nada.

### WhatsApp
A única cor de fora da paleta, porque é a cor da marca deles.

```tsx
className="inline-flex min-h-[52px] items-center gap-2 whitespace-nowrap
           rounded-full bg-[#25D366] px-8 text-fs15 font-extrabold text-white
           shadow transition-[filter] hover:brightness-95"
```

### As regras dos botões

- **44px** é o mínimo absoluto de altura (alvo de toque). 52 ou 56 nos CTAs.
- `rounded-full` sempre. Não existe botão de canto quadrado nesta rede.
- `font-extrabold` sempre.
- `uppercase tracking-[0.03em]` só no CTA de doação — é o que separa "o pedido"
  de "um link".
- `whitespace-nowrap` sempre: rótulo de botão que quebra em duas linhas dentro
  da cápsula fica torto em qualquer largura.
- `transition-colors`, nunca `transition-all`.

## Card

O card padrão da página:

```tsx
<Reveal className="flex h-full flex-col gap-3 rounded-md border border-ink-900/10
                   bg-surface p-4">
  <h3 className="text-fs15 font-extrabold leading-tight text-ink-900">…</h3>
  <p className="text-fs13 leading-[1.5] text-ink-600">…</p>
</Reveal>
```

- `rounded-md` (16px), `border-ink-900/10`, `p-4`, `gap-3`.
- `h-full` quando está numa grade — sem ele os cards da fileira ficam com
  alturas diferentes.
- Título `text-fs15`, corpo `text-fs13`. Não suba isso.
- Sobre `surface-alt` o card é `bg-surface`; sobre `surface` ele é
  `bg-ink-900/[.03]` **ou** `bg-surface` com a borda dando o recorte.

### Card com ícone numerado
O passo de "como funciona".

```tsx
<span className="relative flex h-[48px] w-[48px] shrink-0 items-center
                 justify-center rounded-full bg-donate/10 text-donate">
  <Icon size={24} />
  <span aria-hidden="true"
    className="absolute -right-1 -top-1 flex h-[20px] w-[20px] items-center
               justify-center rounded-full bg-donate text-fs11 font-extrabold
               text-donate-ink">
    {i + 1}
  </span>
</span>
```

Ícone e número no **mesmo** elemento. Separados, viram dois enfeites disputando
a linha.

## Selo em pílula

```tsx
<p className="inline-flex items-center gap-1.5 rounded-full bg-donate/10
              px-3 py-1.5 text-fs13 font-extrabold text-donate-text">
  <IconShield size={15} className="shrink-0" />
  Doação segura · CNPJ verificado
</p>
```

Use quando a informação vale mais **lida de relance** do que dentro de um
parágrafo. Lembre: `text-donate-text`, não `text-donate`.

## Eyebrow

```tsx
<p className="text-fs13 font-extrabold uppercase tracking-[0.12em] text-accent">
  {eyebrow}
</p>
```

Com a régua vermelha embaixo, some `rule-accent` à classe.

## Grades

```tsx
grid gap-3 sm:grid-cols-3 sm:gap-4    ← três passos
grid gap-4 sm:grid-cols-2             ← o contraste (dois lados)
grid grid-cols-3 gap-2 sm:gap-2.5     ← a escada de valores do modal
```

Quebra sempre em `sm`. Abaixo disso, uma coluna.

## Acordeão

`<details>`/`<summary>` nativos. Sem JavaScript, acessível por teclado de
graça, zero bundle.

```tsx
<details className="group rounded-md border border-ink-900/10 bg-surface open:shadow">
  <summary className="flex min-h-[56px] cursor-pointer list-none items-center
                      justify-between gap-3 px-4 py-3.5 text-left text-fs15
                      font-extrabold leading-[1.35] text-ink-900">
    <span className="flex-1">{item.q}</span>
    <IconChevron size={18}
      className="mt-0.5 shrink-0 self-start text-ink-600
                 transition-transform group-open:rotate-180" />
  </summary>
  <p className="px-4 pb-4 text-left text-fs14 leading-[1.6] text-ink-600">
    {item.a}
  </p>
</details>
```

- `list-none` remove o triângulo nativo.
- `pt-0` na resposta: o respiro vem do `pb` do `<summary>`.
- **Alinhe à esquerda em qualquer largura.** Pergunta centralizada no celular
  é o que mais custa a ler numa lista.

## Barra de progresso

```tsx
<div role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}
     aria-label="Progresso da meta da campanha"
     className="h-[6px] w-full overflow-hidden rounded-full bg-ink-900/10">
  <div className="h-full w-full origin-left rounded-full bg-donate
                  transition-transform duration-700 ease-out"
       style={{ transform: `scaleX(${percent / 100})` }} />
</div>
```

`scaleX`, não `width`: anima na GPU e não força layout a cada quadro.

## Ícones

Todos são SVG inline, `24×24`, definidos **dentro do bloco que os usa**. Não
existe pasta de ícones compartilhada — ver `ESTRUTURA.md`.

A fábrica está em `componentes/Icons.tsx`:

```tsx
function base({ size = 20, ...rest }: IconProps) {
  return {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor", strokeWidth: 2,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
    "aria-hidden": true, focusable: false,
    ...rest,
  };
}

const IconCheck = (p: IconProps) => (
  <svg {...base(p)}><path d="m5 13 4 4L19 7" /></svg>
);
```

- Traço, não preenchimento — exceto a patinha e as marcas de rede social, que
  são desenhos cheios (`fill="currentColor"`, sem `stroke`).
- `currentColor` sempre: a cor vem do `text-*` do pai.
- `aria-hidden` sempre: o ícone acompanha um rótulo, nunca substitui.
- `shrink-0` quando estiver dentro de um flex com texto.

## Números

Sempre `tabular-nums` em valor de dinheiro, porcentagem e contador. Sem isso, o
número dança na tela a cada atualização.

```tsx
<span className="font-extrabold text-ink-900 tabular-nums">{formatBRL(cents)}</span>
```

## Imagens

Nunca `next/image` cru — sempre o envelope de `componentes/Image.tsx`, que
prefixa o `basePath`. Com `images.unoptimized: true` (obrigatório em export
estático) o Next passa o `src` adiante sem tocar nele, e o site publicado em
subpasta aponta toda imagem para a raiz do domínio — que é outro site.

## Seção

```tsx
<section id="…" className="py-[clamp(2.5rem,6vh,4.5rem)]">
  {/* #ui:nome-do-bloco */}
  <div className="container-narrow flex max-w-[660px] flex-col gap-5">
    <SectionHead eyebrow="…" title="…" lead="…" />
    …
  </div>
</section>
```

- O comentário `{/* #ui:nome */}` é o marcador que a skill `editar` usa para
  achar o bloco. **Não remova.**
- Alterne o fundo: uma seção `bg-surface`, a seguinte `surface-alt`.
- O `id` precisa existir se algum item de menu apontar para ele. Item de menu
  que rola para lugar nenhum é o defeito que ninguém testa e todo mundo acha.

## Modais

- O gatilho é **evento de janela**, não contexto React (ver `libs/modais.ts`).
  Quem dispara é um botão dentro de uma seção que é Server Component; com o
  evento, só o botão vira cliente.
- Todo modal usa `useScrollLock(aberto)` — e a trava é **contada**, para que um
  modal aberto por cima de outro não devolva a rolagem ao fechar o de cima.
- `Escape` fecha. Clique no véu fecha (`onMouseDown` no véu, não ouvinte global).
- Cada modal se fecha quando o seguinte abre. Dois modais empilhados, cada um
  com sua trava, é o caminho curto para a página voltar ao topo sozinha.
