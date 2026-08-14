---
name: implementar-pagamento-recorrente-infopago
description: Implementar doação/pagamento mensal recorrente real (Pix Automático via ONZ/Infopago) numa página de checkout estática, replicando o padrão validado na Adrielly e aplicado na SOS Animal Help (Ração).
---

# Implementar Pix Automático (recorrência real) num funil de doação

Guia para replicar, num novo funil/abrigo, a doação mensal com cobrança
recorrente de verdade (não a versão falsa que só gera 1 Pix e promete
combinar os próximos meses por WhatsApp). Baseado na stack:
Laravel (`lusapayments`) + Nest (`ic-wh/webhooks-nest-back`) + página
estática exportada (`forms.html`/`recorrencia.html`) colada no
WordPress/Elementor.

## Visão geral do fluxo (Jornada 3 da Infopago)

Um único QR Code composto faz duas coisas ao mesmo tempo:
1. Cobra a **1ª parcela agora** (`cob` normal).
2. Cria o **mandato de recorrência** (`rec`) que autoriza as próximas
   cobranças a saírem direto da conta do doador, sem precisar gerar
   novo Pix.

Internamente isso é `POST /rec` + `PUT /cob/{txid}` no Infopago, mas o
Laravel já expõe isso pronto — não reinventar.

## Passo a passo

### 1. Laravel — confirmar/ajustar o profile de cobrança

Em `config/services.php`, cada abrigo/campanha tem um profile dentro de
`charge_profiles` (ex.: `sos_animal_help_racao`). Se o abrigo novo ainda
não tem um profile próprio, criar um novo bloco lá dentro seguindo o
padrão dos existentes (client_id/secret, chave Pix, certificado mTLS).

`OnzInfopagoController` (`handleCreateRecurringCharge`,
`handleGetRecurrence`, `createRecurringCycleCharge`) é **genérico** —
funciona para qualquer profile registrado, não precisa mexer nele salvo
se faltar algo no response. Um ajuste que já foi necessário: garantir que
`normalizeRecurringResponse()` devolve `status_check_url`/`status_poll_url`
reaproveitando as MESMAS rotas de status do charge avulso — o status do
Pix (pago/não pago) é sempre o da cobrança imediata, nunca o do mandato.

### 2. Front (página estática) — copiar o bloco de `recorrencia.html` (Adrielly)

Elementos que o front precisa ter/fazer:

- **Coleta de Nome + CPF** — exigidos pelo Banco Central para autorizar o
  mandato; sem isso a ONZ/Infopago rejeita a recorrência. Validar CPF de
  verdade (algoritmo de dígito verificador), não só formato.
- **Máscara de valor em centavos** (`maskBRLMensal`/`toCentsMensal`) — se
  o campo "valor livre" só aceitar inteiros de reais, fica impossível
  testar com centavos e o doador fica travado em múltiplos de R$1.
- **Valor mínimo** — validar tanto no clique do botão "Continuar" quanto
  no `blur` do campo (para o doador não só descobrir o erro ao tentar
  enviar). Mensagem clara: "O valor mínimo para doação mensal é R$ X,XX."
- **`recStartDate()`** — a recorrência deve começar 1 mês à frente da
  data de hoje, nunca no mesmo dia: a cobrança imediata do QR já cobre o
  mês corrente, então se `data_inicial` do mandato fosse hoje o doador
  seria cobrado duas vezes no primeiro mês. Fixar no último dia válido do
  mês alvo (dia 31 → cai pro 28/29 em fevereiro).
- **`buildContrato(seed)`** — identificador do vínculo (máx. 35
  caracteres alfanuméricos); o **banco mostra isso na tela de
  autorização** pro doador, então usar algo legível (ex.:
  `RACAOMES<leadIdSemPrefixo>`).
- **Chamada real**: `POST {chargeUrl}/recurring-charge` com
  `periodicidade`, `data_inicial`, `politica_retentativa`, `contrato`,
  `cpf`, `name`, `amount_cents`, `txid`, `integration_id`.
- **Bind do mandato no Nest** (ver passo 3) logo após a resposta de
  sucesso, ANTES de tratar `data.paid` — fire-and-forget, sem travar a
  exibição do QR pro doador se falhar.
- **`trackInitiateCheckout`**: garantir que `first_name`/`last_name` vão
  no payload (quebrando o nome completo digitado) — esquecer isso faz o
  nome do doador nunca chegar no registro do lead (bug já visto).
- **Gateway marcado como recorrência**: mandar `gateway:
  "infopago_pix_recurring"` no evento de IC da 1ª parcela. Esse
  substring `"recurring"` é o que o Nest usa pra saber que deve trocar
  pro cenário de recorrência na Utmify/CAPI — não usar outro nome aqui.

### 3. Nest (`ic-wh`) — bind do mandato

O webhook oficial `/rec` do Pix Automático nunca chega em produção nessa
integração com a Infopago, então o bind é feito pelo PRÓPRIO front,
chamando `POST https://track.lusapayments.com/api/wh/pixauto/bind` com
`{ slug, lead_id, id_rec }` assim que o `recurring-charge` responde.

Isso só funciona se o `lead_id` **já existir** na tabela IC do funil
(`funnel.icTableName`) na hora do bind — senão
`registerRecurringAuthorization` retorna `{ok:false, reason:
'lead_not_found'}` silenciosamente (sem erro visível pro doador). Por
isso a ordem importa: `trackInitiateCheckout()` (que dispara o IC) tem
que rodar ANTES do bind.

**Diagnóstico se o mandato não aparecer em `recurring_authorizations`:**
1. Confirmar que o POST realmente chegou no servidor: `grep "pixauto"
   nos access logs do vhost` (aaPanel: `/www/wwwlogs/<dominio>.log`).
2. Se só aparecer o `OPTIONS` (preflight) sem o `POST` seguinte depois, é
   CORS bloqueando — geralmente porque o teste foi feito **abrindo o
   HTML local no navegador** (`Origin: null`/`file://`), não a página
   publicada. Testar sempre no domínio real.
3. Testar a rota manualmente com `curl -X POST .../api/wh/pixauto/bind
   -d '{"slug":"...","lead_id":"...","id_rec":"..."}'` pra isolar
   back x front.

### 4. Nest — cobrança dos ciclos seguintes (cron)

`RecurringChargesService` varre `recurring_authorizations` diariamente
(09:00 SP, janela D-10..D-2 antes do `data_inicial` do mandato) e chama
`POST /onz/infopago/{profile}/cycle-charge` no Laravel pra instruir a
CobR daquele mês.

Duas env vars no `.env` do Nest em produção:
```
IC_CYCLE_CHARGES_ENABLED=true
IC_CYCLE_PROFILE_<SLUG_EM_MAIUSCULO_COM_UNDERSCORE>="<profile_do_laravel>"
```
A segunda só é necessária se `funnel_configs.infopago_account` (enum
grosso, ex. `sos_animal_help`) não bater com o profile granular do
Laravel (ex. `sos_animal_help_racao`) — o que acontece sempre que várias
campanhas/abrigos compartilham a mesma conta Infopago genérica. Confirmar
lendo o comentário em `recurring-charges.service.ts` (`profileFor`).

Depois de editar o `.env` do processo real (não confundir com
`.env.production` do repo, que pode estar desatualizado/não usado — checar
`pm2 describe <processo> | grep cwd`), reiniciar com
`pm2 restart <processo> --update-env`.

### 5. Rastreamento das parcelas (Utmify/CAPI)

Por design, **só a 1ª parcela (ativação) é reportada** pra Utmify/CAPI.
As parcelas seguintes (2ª+) são gravadas como `paid` no BD/painel (fecham
o ciclo em `recurring_charges`) mas não disparam evento externo — ver
comentário em `dynamic-funnels.service.ts` no método que processa o
webhook de CobR.

Convenção de `gateway` pra diferenciar no BD:
- `infopago_pix_recurring` → 1ª parcela / ativação do mandato.
- `infopago_pix_recurring_installment` → parcelas seguintes (2ª+),
  geradas pelo cron via CobR. `lead_id` sintético:
  `rec_<idRec>_<txid da parcela>`.

## Checklist rápido pra replicar num funil novo

- [ ] Profile em `config/services.php > charge_profiles` (Laravel)
- [ ] Bloco "doação mensal" no front: nome, CPF, máscara de centavos,
      validação de mínimo (clique + blur)
- [ ] `recurringChargeUrl` apontando pro profile certo
- [ ] `bindRecurringAuthorization` com slug do funil certo
- [ ] `gateway: "infopago_pix_recurring"` no IC da 1ª parcela
- [ ] Testar SEMPRE na página publicada (nunca HTML local — CORS quebra
      silenciosamente o bind)
- [ ] `IC_CYCLE_PROFILE_<SLUG>` no `.env` de produção do Nest, se o
      profile do Laravel não bater com o enum de `infopago_account`
- [ ] Confirmar com a Infopago que a conta tem Pix Automático habilitado
      no lado deles (fora do nosso controle)
