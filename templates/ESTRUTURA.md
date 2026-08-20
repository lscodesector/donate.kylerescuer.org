# Estrutura de um projeto

## Stack fixa

| | |
|---|---|
| Next.js | **16.3** — App Router, `output: "export"` |
| React | **19.2** |
| Tailwind | **v4** — via `@tailwindcss/postcss`, sem `tailwind.config` |
| TypeScript | strict, alias `@/*` → `./src/*` |
| Fonte | Inter (400/600/800), `next/font/google` |

> Esta é uma versão do Next com mudanças de API em relação ao que a maioria das
> ferramentas conhece. Antes de escrever código, leia o guia em
> `node_modules/next/dist/docs/`.

## A árvore

```
projeto/
├── AGENTS.md              ← instruções do projeto (gerado pelo next dev)
├── next.config.ts         ← output: export, basePath, trailingSlash
├── postcss.config.mjs     ← só @tailwindcss/postcss
├── tsconfig.json          ← alias @/* → ./src/*
├── public/
│   └── <campanha>/        ← imagens, agrupadas por assunto
└── src/
    ├── app/
    │   ├── layout.tsx           ← fonte, metadata, Pixel, noscript
    │   ├── globals.css          ← ← copiado de templates/estilos/
    │   ├── page.tsx             ← a campanha: só monta as seções em ordem
    │   ├── favicon.ico
    │   ├── obrigado/page.tsx
    │   ├── doar/valor/          ← checkout sem JS (lê o valor da URL)
    │   ├── termos-de-uso/
    │   ├── politica-de-privacidade/
    │   └── politica-de-doacao/
    ├── components/
    │   ├── sections/            ← 01…15, um arquivo por seção
    │   ├── overlays/            ← 16…19, o que vive por cima da página
    │   └── tracking/            ← 20-pixel
    └── lib/
        ├── config.ts            ← dado de campanha (CNPJ, Pix, valores)
        ├── base-path.ts
        ├── modais.ts
        ├── scroll-lock.ts
        ├── format.ts
        ├── campaign.ts
        ├── pix.ts
        └── payments/
```

## A ordem das seções

O número **é** a posição na página. Renumerar é reordenar.

| # | Arquivo | O que responde |
|---|---|---|
| 01 | `01-menu` | A barra fixa e a gaveta de navegação |
| 02 | `02-hero` | Quem está pedindo e por quê — o VSL |
| 03 | `03-prova` | Prova rápida de confiança, antes da objeção aparecer |
| 04 | `04-quem-e` | A história, com as fotos |
| 05 | `05-abrigos` | Quem recebe a ajuda |
| 06 | `06-doar` | O argumento (o contraste) e o pedido |
| 07 | `07-como-funciona` | Os três passos — o que acontece depois do botão |
| 08 | `08-pix-direto` | A chave, para quem prefere o app do banco |
| 09 | `09-transparencia` | A conta mensal e os números da campanha |
| 10 | `10-atualizacoes` | A linha do tempo — inclusive o que deu errado |
| 11 | `11-depoimentos` | Quem recebeu, falando por si |
| 12 | `12-documentacao` | Documento e canais oficiais |
| 13 | `13-faq` | As dúvidas + WhatsApp |
| 14 | `14-cta-final` | Fechamento |
| 15 | `15-footer` | Rodapé, links e selos |

E o que vive **fora** do fluxo:

| # | Arquivo | z |
|---|---|---|
| 16 | `16-flutuante` | 40 — barra de doação colada na base, a partir da 2ª dobra |
| 17 | `17-modal-doacao` | 60 — quanto e com que frequência |
| 18 | `18-checkout` | 70 — dados e Pix |
| 19 | `19-modal-documento` | 65 — o cartão CNPJ |
| 20 | `20-pixel` | — eventos de conversão, montado no `layout.tsx` |

Uma campanha pode não ter alguma delas. O que ela **não** deve fazer é criar
uma seção nova com desenho próprio: se o conteúdo é novo, ele entra num dos
moldes que já existem.

## O isolamento dos blocos — e por que ele é assim

**Cada seção carrega o próprio texto e os próprios utilitários de desenho.**
Os ícones, o `Reveal`, o `SectionHead` estão duplicados dentro de cada arquivo
que os usa. Isso é deliberado:

- Uma seção pode ser reescrita, movida ou deletada sem que nada mais quebre.
- Uma edição de "muda a cor desse card" toca **um** arquivo.
- Não existe o efeito de mudar um componente compartilhado e quebrar quatro
  seções que ninguém estava olhando.

O que um bloco **pode** importar:

```
@/lib/config     dado de campanha
@/lib/modais     gatilho de modal
@/lib/format     formatação de dinheiro e máscaras
@/lib/base-path  prefixo de publicação
@/lib/payments   gateway
```

O que ele **não** importa: outro bloco, ou uma pasta de UI compartilhada.

> Se o projeto novo preferir compartilhar `Reveal`/`SectionHead`/`Icons`, tudo
> bem — coloque em `src/components/ui/`. Mas escolha **uma** das duas formas e
> siga até o fim: metade duplicada e metade compartilhada é o pior dos dois.

## O marcador `#ui:`

Logo dentro de cada `<section>`:

```tsx
<section id="duvidas" className="…">
  {/* #ui:faq */}
```

É por ele que a skill `editar` acha o bloco a partir de um pedido em português
("muda o card do FAQ"). Não remova, e mantenha o nome igual ao do arquivo.

## Export estático — o que isso proíbe

`output: "export"` significa que não existe servidor Node do outro lado. Sobem
só HTML, CSS, JS e as imagens de `public/`.

Não use:
- `redirect()`, `rewrites`, `headers`
- Server Actions
- Route Handlers que leiam a requisição

Por isso `/doar/valor` lê o valor **da URL, no navegador**. E por isso o
gateway de Pix é chamado direto do navegador, sem rota intermediária.

## Variáveis de build

| Variável | O que faz |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Base das URLs de metadata (og:image, canonical). Sem ela, o build publica `localhost` — e ninguém percebe até o link estar no WhatsApp. |
| `NEXT_PUBLIC_BASE_PATH` | Publica em subpasta (`/v2`). Precisa casar **exatamente** com o `basePath` de `next.config.ts`, que lê a mesma variável. |

## Um site novo, do zero

Existe uma skill para isso: **`novo-site`**. Ela monta a estrutura inteira com
os blocos em branco. Este template é o que ela usa como referência de desenho —
e é o que você consulta quando for preencher.

Para converter HTML solto (export de WordPress/Elementor) em projeto Next, a
skill é **`converter-em-next`**.

Para alterar um bloco de um site já pronto, a skill é **`editar`**.
