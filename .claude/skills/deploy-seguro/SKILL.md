---
name: deploy-seguro
description: Publicar um site estático (export do Next) num servidor aaPanel/nginx via SSH, com backup nomeado antes de qualquer troca e rollback de um comando. Use quando pedirem "deploy", "subir o site", "publicar", "atualizar a página no ar", "trocar o build do servidor" — ou antes de qualquer escrita em /www/sites.
---

# Deploy seguro (aaPanel + nginx + export estático)

Este guia é para o padrão de deploy usado nos funis de doação: o site é um
**export estático do Next** (`out/`), servido direto pelo nginx a partir de uma
pasta em `/www/sites/`. **Não há Node/PM2 atrás dele** — nenhum processo para
reiniciar, nenhuma porta para proxiar. Trocar o site é trocar uma pasta.

Isso torna o deploy simples e o estrago também: `rm -rf` na pasta errada derruba
o site no mesmo segundo. Por isso a regra abaixo é inegociável.

> **Regra única:** nada é sobrescrito, movido ou apagado antes de existir um
> backup verificado da pasta que está no ar. Nunca faça `rm -rf` da pasta de
> produção enquanto ela for a única cópia.

---

## Passo 0 — Perguntar antes de tocar em qualquer coisa

**Sempre comece por aqui, mesmo que o pedido pareça óbvio.** Um "sobe o site aí"
não diz qual URL, qual pasta nem se pode substituir o que está no ar. Use o
**AskUserQuestion** (uma chamada, várias perguntas) e só siga depois das
respostas. Ofereça como opções o que você já descobriu inspecionando o servidor
— pergunta com opção certa é rápida de responder, pergunta em aberto trava.

Perguntas obrigatórias:

1. **Qual projeto vai subir?**
   Caminho local do repositório e **o que exatamente** vai ao ar: o commit atual,
   ou o working tree como está (com alterações não commitadas)? Se houver
   arquivos modificados/não commitados, diga quais e confirme — subir working
   tree sujo é legítimo, mas precisa ser escolha, não acidente.

2. **Qual URL / host / slug?**
   O domínio (`doe.caioprotetor.org`), o host SSH (`lusa`) e se é a **raiz** do
   domínio ou uma **subpasta** (`/v2/`, `/teste-v2/`). Isso decide o
   `NEXT_PUBLIC_BASE_PATH`: raiz → sem variável; subpasta → `NEXT_PUBLIC_BASE_PATH=/v2`.
   Errar aqui gera um site que carrega o HTML e não acha nenhum CSS/JS.

3. **Qual o nome do backup?**
   Proponha um default com data (`doe-caio-backup-AAAAMMDD-HHMM`) e pergunte se
   é esse ou outro. Pergunte também **onde**: pasta irmã em `/www/sites/`
   (rollback instantâneo, ocupa o dobro de disco) ou `.tar.gz` (leve, restauro
   mais lento). Se já existir uma pasta com o nome escolhido, **pare e
   pergunte** — sobrescrever backup é perder a única rede de segurança.

4. **Substituir ou publicar ao lado?**
   Trocar o que está na URL de produção, ou subir numa pasta nova (`/teste-v2/`)
   para conferir antes? Se o site recebe tráfego de anúncio pago, ofereça o "ao
   lado" primeiro.

5. **Confirmar a janela.** O site fica fora do ar por ~1 segundo na troca.
   Se houver campanha ativa rodando, confirme que é hora de trocar.

Perguntas condicionais (faça só quando o caso aparecer):

- **O `next.config.ts` não tem `output: "export"`?** Pergunte antes de mexer:
  ativar de vez no repositório, ou patch temporário só para este build (e
  restaurar o arquivo depois). Nunca deixe o config alterado sem avisar.
- **Existem pastas vizinhas na mesma URL** (WordPress em `/origin`, build
  antigo em `/v2`)? Confirme que devem continuar intactas — normalmente devem.

---

## Passo 1 — Reconhecimento (leitura, sem escrita)

Antes de buildar, saiba exatamente o que está no ar:

```bash
ssh <host> 'cat /www/server/panel/vhost/nginx/<dominio>.conf'      # qual é o root?
ssh <host> 'cat /www/server/panel/vhost/rewrite/<dominio>.conf'    # try_files
ssh <host> 'ls -la /www/sites/ | head -40; df -h /www | tail -1'   # vizinhos e disco
```

Confirme e anote:

- **`root`** do vhost — é essa pasta que você vai trocar, e só ela.
- **Vizinhos na mesma URL**: blocos `location ^~ /origin`, `/wp-`, `/wp-json/`,
  `/v2/`, `/teste-v2/` apontam para **outras pastas** (o WordPress, builds
  antigos). Eles não são seus. Não toque.
- **Disco livre**: backup + build novo convivem com o antigo por alguns
  instantes. Se `df` estiver acima de ~90%, resolva o espaço antes.
- **Build id atual** (`ls <root>/_next | grep -v static`) — serve para provar,
  no fim, que a troca de fato aconteceu.

---

## Passo 2 — Backup, com verificação

```bash
ssh <host> 'cp -a /www/sites/<pasta-do-ar> /www/sites/<nome-do-backup>'
ssh <host> 'du -sh /www/sites/<nome-do-backup>; ls /www/sites/<nome-do-backup> | head'
```

`cp -a` preserva dono, permissão e mtime — o backup volta idêntico. **Olhe a
saída**: tamanho parecido com o original e `index.html` presente. Backup que
você não conferiu não é backup. Se preferir tarball:
`tar -czf /www/sites/<nome>.tar.gz -C /www/sites <pasta-do-ar>`.

---

## Passo 3 — Build local

```bash
rm -rf out
NEXT_PUBLIC_SITE_URL=https://<dominio> npx next build
```

- `NEXT_PUBLIC_SITE_URL` é lido **no momento do build** e vira a base das URLs de
  metadata/og:image. Sem ela, o site publica `og:image` apontando para `localhost`.
- Publicando em subpasta, acrescente `NEXT_PUBLIC_BASE_PATH=/v2`.
- Se o config não tiver `output: "export"`, aplique o que ficou decidido no
  Passo 0. Fazendo patch temporário: copie o `next.config.ts` para o scratchpad
  antes, restaure logo depois do build e confirme com `git diff --stat` que o
  repositório voltou ao estado original.
- Confira a saída: a lista de rotas deve bater com as páginas esperadas, e
  `out/` precisa existir. **Build que falhou não vira deploy** — pare aqui.

---

## Passo 4 — Subir para uma pasta de staging (nunca por cima)

```bash
ssh <host> 'rm -rf /www/sites/<pasta>-novo && mkdir -p /www/sites/<pasta>-novo'
tar -czf - -C out . | ssh <host> 'tar -xzf - -C /www/sites/<pasta>-novo'
ssh <host> 'du -sh /www/sites/<pasta>-novo; ls /www/sites/<pasta>-novo'
```

O upload vai para uma pasta **nova**. Enquanto ele roda, o site no ar continua
intocado — se a conexão cair no meio, nada quebrou. Confira tamanho e listagem
antes de seguir: `index.html`, `_next/`, e as pastas de página esperadas.

---

## Passo 5 — Troca e reload

```bash
ssh <host> 'set -e
chown -R root:root /www/sites/<pasta>-novo
find /www/sites/<pasta>-novo -type d -exec chmod 755 {} +
find /www/sites/<pasta>-novo -type f -exec chmod 755 {} +
mv /www/sites/<pasta> /www/sites/<pasta>-substituido
mv /www/sites/<pasta>-novo /www/sites/<pasta>
nginx -t && nginx -s reload'
```

- `set -e` é o que impede o pior caso: sem ele, um `mv` que falha não interrompe
  a linha seguinte e você fica sem pasta nenhuma na URL.
- **Dono e permissão precisam bater com os da pasta antiga** (veja no `ls -la`
  do Passo 1). Arquivo que o nginx não consegue ler vira 403 no site inteiro.
- A troca é `mv` + `mv`: dois renames, ~1 segundo de indisponibilidade. Nunca
  `rm -rf` na pasta de produção seguido de upload — isso deixa o site fora do ar
  por todo o tempo da transferência.
- `nginx -t` **antes** do reload. Avisos de `protocol options redefined` de
  outros vhosts são normais neste servidor; o que importa é `syntax is ok`.
- Só apague `<pasta>-substituido` depois de o Passo 6 passar. E só apague ela —
  o backup nomeado do Passo 2 fica.

---

## Passo 6 — Verificar em produção

```bash
ssh <host> 'for u in / /doar/valor/ /obrigado/ /origin /wp-login.php /v2/; do
  printf "%-32s %s\n" "$u" "$(curl -s -o /dev/null -w "%{http_code}" https://<dominio>$u)"; done'
```

Teste três grupos:

1. **As páginas novas** — raiz, checkout, obrigado, páginas que só existem no
   build novo (boa prova de que a troca pegou).
2. **Um asset** (`.webp`, `_next/static/...`) — pega erro de permissão e de
   `basePath` errado.
3. **Os vizinhos** (`/origin`, `/wp-login.php`, `/v2/`) — prova de que você não
   derrubou o WordPress nem os builds antigos junto.

Rode os curls **do próprio servidor e com calma**: o WAF do aaPanel responde
**429** a rajadas de requisição. 429 num loop rápido é o firewall, não o site —
repita a URL isolada antes de chamar de falha.

Feche comparando os build ids:

```bash
ls out/_next | grep -v static                                       # local
ssh <host> 'ls /www/sites/<pasta>/_next | grep -v static'           # servidor
```

Iguais = o que está no ar é o que você buildou. Diferentes = a troca não pegou.

---

## Rollback

Uma linha, a qualquer momento:

```bash
ssh <host> 'mv /www/sites/<pasta> /www/sites/<pasta>-ruim &&
            cp -a /www/sites/<nome-do-backup> /www/sites/<pasta> &&
            nginx -s reload'
```

Usa `cp -a` em vez de `mv` de propósito: o backup continua existindo depois do
rollback, caso a segunda tentativa também dê errado.

Se o problema for de configuração e não de conteúdo, o vhost e o rewrite têm
`.bak-*` datados ao lado deles em `/www/server/panel/vhost/nginx/` e
`/www/server/panel/vhost/rewrite/` — restaure o par e `nginx -t && nginx -s reload`.

---

## Nunca faça

- **Não** rode `rm -rf` em `/www/sites/*` sem ter conferido o backup com os
  próprios olhos.
- **Não** toque em pastas de outros sites. `/www/sites/` hospeda dezenas de
  domínios; o pedido é sobre **um**.
- **Não** edite `/www/sites/<dominio>/` (o WordPress) achando que é o site novo
  — o export do Next mora numa pasta separada, e a confusão entre as duas é o
  erro mais fácil de cometer aqui.
- **Não** faça o deploy "só até a metade". Se algo falhar no meio, ou termine,
  ou faça rollback — não deixe staging pela metade ocupando disco e ambiguidade.
- **Não** relate sucesso sem os códigos HTTP e o build id na mão.

---

## Fechamento

Reporte, com os números reais que você viu:

- onde ficou o backup e qual build ele guarda;
- o build id que está no ar agora;
- a tabela de URLs testadas com os códigos;
- o que mudou de comportamento (páginas novas, rotas que sumiram);
- qualquer coisa que ficou pendente ou que você alterou fora do combinado
  (config tocado, disco apertado, workflow de CI quebrado).
