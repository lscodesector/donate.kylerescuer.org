# UI-MAP

Rota principal: `/` → `src/app/page.tsx`

## A regra do bloco

Cada seção da página é **um arquivo**, e o número do arquivo é a ordem na
página. O bloco carrega o próprio texto e os próprios utilitários de desenho —
ícones, revelação ao rolar, cabeça de seção, slide de fotos, botões de doar.

Um bloco **não** importa outro bloco e **não** importa uma pasta de UI
compartilhada (ela não existe mais). O que ele pode importar é `@/lib`.

## As seções

| #  | Âncora                | Arquivo                                    |
|----|-----------------------|--------------------------------------------|
| 01 | `#ui:menu`            | `src/components/sections/01-menu.tsx`            |
| 02 | `#ui:hero`            | `src/components/sections/02-hero.tsx`            |
| 03 | `#ui:prova`           | `src/components/sections/03-prova.tsx`           |
| 04 | `#ui:quem-e`          | `src/components/sections/04-quem-e.tsx`          |
| 05 | `#ui:pix-direto`      | `src/components/sections/05-pix-direto.tsx`      |
| 06 | `#ui:abrigos`         | `src/components/sections/06-abrigos.tsx`         |
| 07 | `#ui:doar`            | `src/components/sections/07-doar.tsx`            |
| 08 | `#ui:como-funciona`   | `src/components/sections/08-como-funciona.tsx`   |
| 09 | `#ui:transparencia`   | `src/components/sections/09-transparencia.tsx`   |
| 10 | `#ui:atualizacoes`    | `src/components/sections/10-atualizacoes.tsx`    |
| 11 | `#ui:depoimentos`     | `src/components/sections/11-depoimentos.tsx`     |
| 12 | `#ui:documentacao`    | `src/components/sections/12-documentacao.tsx`    |
| 13 | `#ui:faq`             | `src/components/sections/13-faq.tsx`             |
| 14 | `#ui:cta-final`       | `src/components/sections/14-cta-final.tsx`       |
| 15 | `#ui:footer`          | `src/components/sections/15-footer.tsx`          |

## Overlays e tracking

| #  | Âncora                 | Arquivo                                          |
|----|------------------------|--------------------------------------------------|
| 16 | `#ui:flutuante`        | `src/components/overlays/16-flutuante.tsx`        |
| 17 | `#ui:modal-doacao`     | `src/components/overlays/17-modal-doacao.tsx`     |
| 18 | `#ui:checkout`         | `src/components/overlays/18-checkout.tsx`         |
| 19 | `#ui:modal-documento`  | `src/components/overlays/19-modal-documento.tsx`  |
| 20 | `#ui:pixel`            | `src/components/tracking/20-pixel.tsx`            |

O bloco 20 é montado em `src/app/layout.tsx` (vale para todas as rotas), não em
`page.tsx`. Os outros quatro ficam fora do `<main>`, no fim de `page.tsx`.

**Empilhamento:** menu 50 · barra fixa 40 · modal de doação 60 · ficha de
abrigo 60 · modal de documento 65 · checkout 70.

## O `id` do DOM não é o nome do arquivo

A âncora `#ui:` serve para **achar o bloco**. O `id` que a navegação usa é
outro, e não mudou na reestrutura:

| bloco | `id` no DOM |
|---|---|
| 02 hero | `#topo` |
| 04 quem é | `#missao` |
| 05 abrigos | `#abrigos` |
| 06 doar | `#doar` (é o destino de `DOAR_HREF`) |
| 07 como funciona | `#como-funciona` |
| 08 pix | `#pix` |
| 09 transparência | `#transparencia` |
| 10 atualizações | `#atualizacoes` |
| 11 depoimentos | `#depoimentos` |
| 12 documentação | `#documentacao` |
| 13 faq | `#duvidas` |
| 15 footer | `#contato` |

Todo item do menu (bloco 01) aponta para um desses. Item de menu que rola para
lugar nenhum é o defeito que ninguém testa e todo mundo encontra.

## O que **não** mora nos blocos

`src/lib/` é o que os blocos podem importar. É onde está tudo que, copiado,
divergiria — e divergir aqui significa dinheiro na conta errada.

| arquivo | o que guarda |
|---|---|
| `lib/config.ts` | chave Pix, CNPJ, contatos, taxa do checkout, grade de valores, frentes, `DOAR_HREF`, `showPixSection` |
| `lib/modais.ts` | `openDonationModal`, `openDocumentoModal` e os eventos — é o canal entre um bloco e um overlay |
| `lib/checkout-bus.ts` | o canal entre o bloco 17 e o 18 |
| `lib/format.ts` | `formatBRL`, `formatBRLCurto` e as máscaras de CPF, telefone e valor |
| `lib/payments/` | gateway, cobrança, recorrência, eventos de conversão |
| `lib/campaign.ts` | arrecadado, meta, apoiadores — a **mesma** fonte para a dobra e a barra fixa |
| `lib/base-path.ts` | o prefixo de publicação em subpasta (`/v2`) |
| `lib/scroll-lock.ts` | a trava de rolagem contada, para modais empilhados |

**Tokens de cor:** bloco `:root` em `src/app/globals.css`.
**Imagens:** `public/caio/` e `public/documentos/`.

## Fora da landing

| arquivo | o que é |
|---|---|
| `src/components/LegalPage.tsx` | o desenho das três páginas legais; monta os blocos 01 e 15 |
| `src/content/legal.ts` | o texto dos três documentos |
| `src/app/doar/valor/` | o checkout de valor livre para quem está **sem JavaScript** — rota própria, componentes próprios |
| `src/app/obrigado/` | a tela de agradecimento; só o checkout manda para cá |

## Duas cópias que precisam andar juntas

O bloco isolado tem um preço, e ele está em dois lugares. Não há nada no
código que force a sincronia — está aqui porque é o único aviso que existe.

- **Os abrigos.** A lista completa é do bloco 05; o rodapé (bloco 15) tem uma
  segunda lista, só com nome e link (`ABRIGOS_LINKS`). Abrigo novo entra nos
  dois; abrigo que sai, sai dos dois.
- **As fotos da história.** `historiaPhotos` está no bloco 04 (a seção) e no
  bloco 02 (a dobra usa como plano B, quando não há vídeo). O `focusY` de cada
  foto foi **medido** nela — trocar a foto exige remedir, nos dois arquivos.
