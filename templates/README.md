# Template de landing de doação

Este é o **guia único** de estilização e formato para todos os sites de
campanha. Ele foi extraído de `doe.caioprotetor.org` — a página que já está no
ar — e o que está aqui é o padrão, não uma sugestão.

> Regra de ouro: **um site novo copia esta pasta e troca o conteúdo.**
> Não redesenhe. Se algo aqui não serve para a campanha nova, o certo é
> discutir a mudança *neste* template, para que todos os sites a recebam.

## O que tem aqui

```
templates/
├── README.md                 ← este arquivo: o guia
├── ESTRUTURA.md              ← stack, árvore de pastas, ordem das seções
├── DESIGN-TOKENS.md          ← paleta, tipografia, espaçamento, raios, z-index
├── PADROES.md                ← as receitas: botão, card, selo, grade, acordeão
│
├── estilos/
│   └── globals.css           ← o CSS inteiro, pronto para copiar
│
├── config/                   ← a configuração de build, sem alteração
│   ├── next.config.ts        ← output: export, basePath, trailingSlash
│   ├── postcss.config.mjs
│   └── tsconfig.json
│
├── app/                      ← a casca das rotas
│   ├── layout.tsx            ← fonte, metadata, noscript, pixel
│   └── page.tsx              ← só monta as seções em ordem
│
├── libs/                     ← copie inteiro para src/lib/
│   ├── config.ts             ← ⚠️ o molde dos dados de campanha — preencher
│   ├── base-path.ts          ← publicar em subpasta sem quebrar link/imagem
│   ├── modais.ts             ← o canal entre seções e modais (eventos)
│   ├── scroll-lock.ts        ← trava de rolagem contada, para modais
│   └── format.ts             ← dinheiro, máscaras, telefone
│
├── componentes/              ← o catálogo (ver a nota de isolamento abaixo)
│   ├── Reveal.tsx            ← revelação ao rolar, sem biblioteca
│   ├── SectionHead.tsx       ← eyebrow + título + linha de apoio
│   ├── Icons.tsx             ← a fábrica e os 29 ícones da rede
│   └── Image.tsx             ← next/image com basePath
│
├── secoes/
│   ├── 00-MOLDE.tsx          ← ⭐ o esqueleto de qualquer seção nova
│   ├── 01-menu.tsx           ← navbar fixa + gaveta lateral
│   ├── 02-hero.tsx           ← primeira dobra, com o player
│   ├── 07-como-funciona.tsx  ← grade de 3 cards com ícone numerado
│   ├── 13-faq.tsx            ← acordeão nativo, sem JS
│   ├── 14-cta-final.tsx      ← fechamento com dois botões
│   └── 15-footer.tsx         ← rodapé escuro
│
└── overlays/
    ├── 16-flutuante.tsx      ← barra fixa da base, com a meta
    └── 17-modal-doacao.tsx   ← valor e frequência
```

**Os arquivos de `secoes/` e `overlays/` são referência viva**: são as seções
como estão no ar, copiadas sem edição. Troque o texto e as imagens; não troque
as medidas nem as classes. Os comentários dentro deles registram o que já foi
tentado e não funcionou — é a parte que se perde ao copiar só o visual.

## Como usar num site novo

1. `config/` → a raiz do projeto. Não precisa de ajuste.
2. `estilos/globals.css` → `src/app/globals.css`. **Só troque** o bloco
   `--sos-action*` e o `--org-accent`, que são a cor da marca. Meça o contraste
   depois de trocar — o cabeçalho do arquivo explica como.
3. `libs/` → `src/lib/`. Preencha `config.ts`: cada `⚠️ PREENCHER` é um campo
   obrigatório, e cada `⚠️ CONFERIR ANTES DE PUBLICAR` é um que manda dinheiro
   para o lugar errado se estiver errado.
4. `app/` → `src/app/`. Preencha `TITLE`, `DESCRIPTION` e o domínio.
5. `componentes/` → dentro do primeiro bloco que precisar deles, **ou** em
   `src/components/ui/` se o projeto preferir compartilhar. Escolha uma das
   duas formas e siga até o fim — ver `ESTRUTURA.md`.
6. Copie as seções para `src/components/sections/`, renumere na ordem da
   página e troque o conteúdo. Para uma seção que não existe aqui, parta de
   `secoes/00-MOLDE.tsx`.

Existe uma skill que faz os passos 1 a 5 sozinha: **`novo-site`**.

## As três regras que não se quebram

**1. Um bloco por seção, numerado.**
`01-menu`, `02-hero`, `03-prova`… O número é a ordem na página. Uma seção
carrega o próprio texto e os próprios ícones. Ela não importa outra seção.
O que pode importar é `@/lib` — dado de campanha, formatação, modais.

**2. A página inteira usa a mesma medida.**
`container-narrow` + `max-w-[660px]` para conteúdo de leitura,
`py-[clamp(2.5rem,6vh,4.5rem)]` para o respiro vertical. Uma seção com margem
própria é o que faz um site parecer costurado de pedaços.

**3. Nada de tamanho fixo em texto.**
Todo tamanho é um degrau da escala (`text-fs13`, `text-fs15`, `text-body`…),
que já é fluida. `text-[14px]` num componente é o começo de uma página que não
acompanha a largura da tela.

## Acessibilidade — o mínimo que já vem resolvido

- Todo alvo de toque tem **44px** de altura mínima.
- O foco é visível em tudo (`outline: 3px solid`, definido no `globals.css`).
- Toda animação respeita `prefers-reduced-motion`.
- Ícone decorativo leva `aria-hidden`; botão só-ícone leva `aria-label`.
- Contraste: os tokens já foram medidos contra a WCAG AA. `--sos-donate-text`
  existe *porque* o verde de botão reprova como texto — não troque um pelo outro.
