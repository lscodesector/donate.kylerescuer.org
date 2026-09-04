---
name: criar-api-doacao-givewp
description: Expor o motor de doação do GiveWP (PayPal Commerce e/ou Stripe Payment Element) como API REST própria no functions.php do WordPress, pra um form customizado (forms.html avulso, Next.js etc.) processar doações sem depender do form nativo React estar renderizado na página. Inclui como testar sem gastar dinheiro real, como limpar a poluição de teste (GiveWP + Utmify) se algo vazar pra produção, e como fechar o ciclo de confirmação assíncrona do Stripe até um webhook próprio.
---

# Criar API própria pro motor de doação do GiveWP

Contexto: um form de doação customizado (visual próprio, modal, steps) hoje
depende de um hack frágil — esconder o form nativo do GiveWP num iframe fora
da tela e manipular o DOM dele pra extrair só o botão do PayPal. Este skill
documenta a alternativa: expor rotas REST no `functions.php` do tema que
fazem *proxy* pro motor real do GiveWP, e o form customizado passa a falar
só com essas rotas via `fetch()`.

**Validado em**: GiveWP 4.16.5.1 (PayPal Commerce) e GiveWP 4.16.7 (+ Stripe
Payment Element), WordPress com tema filho carregando `functions.php`.

## Por que proxy, e não reimplementar o pagamento

O GiveWP **não processa doação via REST**. O fluxo público real (o mesmo que
o form React roda) é:

1. `admin-ajax.php?action=give_paypal_commerce_create_order` — exige um
   nonce por-formulário: `wp_create_nonce("give_donation_form_nonce_{$formId}")`.
2. `admin-ajax.php?action=give_paypal_commerce_approve_order`.
3. Uma rota própria do Give (`?givewp-route=donate`, **não** é REST) que cria
   a doação de fato e só aceita requisições com uma assinatura HMAC
   (`wp_hash()`) gerada com os salts do WordPress, válida por 1 dia.

Nonce e assinatura só existem porque hoje a página do WordPress é carregada
primeiro — um form fora do WP (domínio separado, Next.js) não tem como gerar
nenhum dos dois sozinho. A solução não é recriar o fluxo do PayPal na mão
(perderia toda validação que o GiveWP já faz: 3D Secure, captura recusada
etc.) — é mintar nonce/assinatura no servidor e repassar a chamada pro
próprio GiveWP, exatamente como o form nativo faz.

## As 4 rotas

Registrar em `functions.php`, dentro do `add_action('rest_api_init', ...)`
já existente do tema (namespace `givewp/v1`), com CORS aberto (`Access-Control-Allow-Origin: *`)
já que o form pode rodar em domínio separado.

### `GET /config?form_id=<id>`

Devolve o que o front precisa pra montar o botão do PayPal sem hardcoded:
`gatewayId`, `paypal.clientId` (via `give(\Give\PaymentGateways\PayPalCommerce\Models\MerchantDetail::class)->clientId`),
`paypal.mode` (sandbox/live — ver "Live vs sandbox" abaixo), `currency`,
`minAmount`/`maxAmount` (`give_get_form_minimum_price`/`give_get_form_maximum_price`),
e um `formNonce` já mintado.

### `POST /paypal/create-order`

Proxy pro `admin-ajax.php` (loopback via `wp_remote_post`) injetando o nonce
do form. Campos: `give-form-id`, `give-form-hash` (o nonce), `give-amount`,
`give_first`, `give_last`, `give_email` + endereço opcional (`billing_country`,
`card_address`, `card_city`, `card_state`, `card_zip` — só entram se
preenchidos, o GiveWP só valida país se algum campo de endereço vier).

### `POST /paypal/approve-order`

Mesmo padrão, `admin-ajax.php?action=give_paypal_commerce_approve_order&order=<id>&update_amount=<bool>`.

### `POST /donate`

O passo que cria a doação de verdade. Minta a assinatura na hora:

```php
$signature = new \Give\DonationForms\Routes\DonateRouteSignature('givewp-donate');
$signed_url = \Give\Framework\Routes\Route::url('donate', [
    'givewp-route-signature'            => $signature->toHash(),
    'givewp-route-signature-id'         => 'givewp-donate',
    'givewp-route-signature-expiration' => $signature->expiration,
]);
```

POST em `$signed_url` com JSON contendo os campos do **schema do form**
(descobrir via `\Give\DonationForms\Models\DonationForm::find($id)->schema()->getFields()`
— varia por form, mas tipicamente): `formId`, `gatewayId`, `originUrl`,
`isEmbed`, `amount`, `currency`, `firstName`, `lastName`, `email`, o campo
honeypot antispam (nome varia, ex. `donationBirthday` — **tem que ir vazio**),
e dois campos ocultos fáceis de esquecer:

- **`donationType: 'single'`** — sem isso, fatal error
  `Call to a member function isSingle() on null` em `DonateController.php`.
- **`levelId`** — string vazia serve pra valor customizado (sem nível
  pré-definido).

Pra doação com PayPal, o resultado da aprovação entra em
`gatewayData: { payPalOrderId: '<id>' }` (a `GetGatewayDataFromRequest` do
GiveWP só lê essa chave, não os campos soltos).

## Stripe Payment Element — segundo gateway, fluxo bem diferente do PayPal

Não existe skill/doc oficial pra isso, foi tudo reverse-engineered lendo o
código-fonte do plugin instalado (`wp-content/plugins/give/src/
PaymentGateways/Gateways/Stripe/StripePaymentElementGateway/`).

**Diferença estrutural**: no PayPal, `create-order` → `approve-order` → o
`/donate` assinado fecha a doação síncrono, na mesma resposta. No Stripe
**não existe "create-order"** — é o próprio `/donate` (com `gatewayId:
"stripe_payment_element"`) que, dentro de `StripePaymentElementGateway::
createPayment()`, cria o Payment Intent na Stripe e devolve só isso:

```php
return new RespondToBrowser([
    'clientSecret'   => $intent->client_secret,
    'returnUrl'      => $stripeGatewayData->successUrl,
    'billingDetails' => [ /* name, email, address */ ],
]);
```

A doação fica com status `processing` até a Stripe confirmar via webhook
(ver a seção própria mais abaixo) — **nunca fecha nessa chamada**, diferente
do PayPal.

### `gatewayData` obrigatório: 4 chaves, nenhuma opcional

`StripeGatewayData::fromRequest()` (no plugin) lê as 4 chaves abaixo **sem
`??`** — faltar qualquer uma é fatal error, não erro de validação:

```php
$payload['gatewayData'] = [
    'stripePaymentMethod'             => 'card',
    'stripePaymentMethodIsCreditCard' => true,
    'stripeConnectedAccountId'        => $stripe_account_id, // do SERVIDOR (/config), nunca do body — o cliente não decide a conta
    'successUrl'                      => $origin_url,
];
```

Só `stripeConnectedAccountId` e `successUrl` são de fato usados por
`createPayment()`; os outros dois são metadata que o form nativo também
manda, mas o servidor não lê — mandar mesmo assim, porque o DTO explode se
a chave não existir.

### ⚠️ Duas camadas de `data` aninhadas — bug real, já caiu em produção

A resposta do GiveWP pro comando `RespondToBrowser` (usado pelo Stripe) já
vem embrulhada como `{ data: { clientSecret, ... } }` — e a rota `/donate`
deste skill embrulha de novo (`{ ok, data: <resposta do GiveWP> }`). No fio,
o front recebe:

```json
{"ok":true,"data":{"data":{"clientSecret":"pi_..._secret_...", "returnUrl":"...", "billingDetails":{...}}}}
```

Se a função que consome `/donate` no front guardar o **corpo inteiro** da
resposta HTTP como seu próprio `data` (em vez de só o campo `.data` dela),
sobra uma camada de aninhamento a mais e quem lê `result.data.data.clientSecret`
nunca acha nada — erro visto ao vivo: *"O GiveWP não devolveu o clientSecret
do pagamento Stripe"*, com o Payment Intent já criado do lado da Stripe (sem
cobrar, já que `confirmPayment` nunca chega a rodar). Fix é garantir que a
função de `/donate` no front desembrulhe só o SEU PRÓPRIO nível antes de
devolver — quem lê a resposta depois é que desembrulha o nível do GiveWP.

### Correlação: `/donate` não devolve ID de doação nenhum

Diferente do que se esperaria, a resposta do Stripe (`clientSecret`,
`returnUrl`, `billingDetails`) **não tem `donationId`**. Se o seu backend
(Nest, CRM, o que for) precisa casar essa doação com um lead/registro criado
antes no front, use o **Payment Intent ID**, extraído do próprio
`clientSecret` (tudo antes de `_secret_`, formato `pi_XXXX_secret_YYYY`) — é
o mesmo ID que a Stripe manda no evento `PaymentIntentSucceeded` que o
GiveWP processa depois, então dá pra usar como chave de correlação nos dois
lados sem inventar nada novo nem depender de e-mail (que muitas vezes nem é
coletado de verdade nesses forms customizados).

### Front: montar o Payment Element

Sem instalar `@stripe/stripe-js` — só carregar `https://js.stripe.com/v3/`
via `<script>` (mesmo padrão de tag que o SDK do PayPal já usa) e usar
`window.Stripe(publishableKey, { stripeAccount: connectedAccountId })`.

```js
const stripe = window.Stripe(publishableKey, { stripeAccount: connectedAccountId });
const elements = stripe.elements({ mode: "payment", amount, currency }); // SEM clientSecret ainda — Payment Intent "diferido"
const paymentElement = elements.create("payment");
paymentElement.mount(container);

// no submit:
await elements.submit(); // valida campos no navegador, não chama a Stripe ainda
const resultado = await submitDonation({ gatewayId: "stripe_payment_element", ...gatewayData });
const { clientSecret } = extractStripeIntent(resultado); // é AQUI que o Payment Intent é criado de verdade

const { error } = await stripe.confirmPayment({
  elements,
  clientSecret,
  confirmParams: { return_url: returnUrl },
  redirect: "if_required", // mantém a pessoa na mesma página pra cartão comum; só navega se o método exigir página inteira
});
```

Registrar a correlação (lead ↔ Payment Intent ID) **antes** de chamar
`confirmPayment`, não depois — um método que exigir redirect de página
inteira leva a pessoa embora antes de qualquer chamada seguinte rodar, e o
webhook do lado do WordPress pode chegar bem antes do navegador voltar.

### Wallets (Apple Pay / Google Pay) no Payment Element

Aparecem sozinhos no topo do Payment Element, sem código extra, **se**:
- Habilitados no dashboard da Stripe (Settings → Payment methods).
- **Domínio verificado** em Settings → Payment method domains — o domínio
  onde o **JS do Payment Element roda de fato**, não necessariamente o
  domínio do WordPress. Numa arquitetura com form separado (Next.js/site
  próprio) falando com o GiveWP via essas rotas REST, é o domínio do form
  que precisa ser cadastrado e verificado, não o do WordPress.
- HTTPS.
- Dispositivo/navegador compatível (Apple Pay só em Safari com Wallet
  configurada; Google Pay só em Chrome/Android com cartão salvo na conta
  Google) — não dá pra forçar aparecer testando de outro navegador/SO.

## Confirmação assíncrona do Stripe → seu backend (ex.: Nest, CRM)

**Duas pernas separadas, não confundir uma com a outra:**

1. **Stripe → WordPress**: cadastrar um webhook endpoint no dashboard da
   Stripe (Developers → Webhooks, **abas "Test mode" e "Live mode" são
   cadastros independentes**) apontando pra `https://<seu-wordpress>/?give-listener=stripe`,
   escutando pelo menos `payment_intent.succeeded`. Sem esse endpoint
   cadastrado do lado da Stripe, ela nunca avisa o WordPress — não importa o
   que esteja configurado no lado de cá.

   O listener legado que recebe isso (`Give_Stripe_Webhooks::listen()`,
   hookado em `init`, ativo por padrão) **não verifica assinatura nenhuma**
   — monta o evento direto do corpo da requisição
   (`Event::constructFrom($payload)`), sem `Stripe\Webhook::constructEvent()`
   nem secret. Não é preciso configurar nenhum "webhook secret" no
   WordPress pra esse listener funcionar — só o endpoint cadastrado do lado
   da Stripe importa.

2. **WordPress → seu backend**: um hook seu em `give_update_payment_status`
   (dispara tanto na conclusão síncrona do PayPal quanto na assíncrona do
   Stripe, já que os dois passam pelo mesmo ponto do core) que, quando o
   `$new_status` vira o de doação completa e o `$gateway` bate com o que
   você quer notificar, monta um payload PRÓPRIO (não repassa o payload da
   Stripe) e faz `wp_remote_post` pro seu endpoint:

   ```php
   add_action('give_update_payment_status', function ($donation_id, $new_status, $old_status) {
       if ('publish' !== $new_status) return; // ver nota sobre o valor certo abaixo
       $gateway = give_get_payment_gateway($donation_id);
       if ('stripe_payment_element' !== $gateway) return;

       $transaction_id = give_get_payment_transaction_id($donation_id); // Payment Intent ID (pi_XXXX) - a MESMA chave que o front já registrou como ref
       // ... montar payload próprio e wp_remote_post pro seu backend ...
   }, 10, 3);
   ```

   ⚠️ **`$new_status` é `'publish'`, não `'complete'`** — confirmar contra
   `\Give\Donations\ValueObjects\DonationStatus::COMPLETE` no plugin
   instalado antes de assumir qualquer um dos dois; já vi código de
   referência (de outra integração, versão mais antiga do Give) usando
   `'complete'` como string literal, que é o *label*, não o valor do enum
   nesta versão (4.16.7). Não copiar sem checar no `DonationStatus.php` do
   servidor de destino.

   `give_complete_donation` (outro hook às vezes citado como alternativa)
   é redundante com isso — ele só é disparado *de dentro* de
   `give_complete_purchase()`, que por sua vez já está pendurado em
   `give_update_payment_status` (prioridade 100). Não precisa dos dois.

## Armadilha: resposta contaminada por hooks legados

Se o `functions.php` já tiver algo em `add_action('give_complete_donation', ...)`
que ecoa HTML/`<script>` (comum: pixel do Facebook client-side disparado
server-side), essa saída **entra na mesma resposta HTTP** da rota `donate`
assinada — o hook dispara *antes* do GiveWP mandar o JSON de sucesso. Isso
quebra `json_decode()` mesmo a doação tendo sido criada com sucesso, e sem
correção o doador vê "não conseguimos confirmar seu pagamento" com o
pagamento já aprovado.

Fix: não pular pro primeiro `{` (pode ser de um bloco `if (){` do JS, que é
exatamente o bug que caiu aqui na primeira tentativa) — remover o(s) bloco(s)
`<script>` inteiro(s) antes de decodificar:

```php
$stripped = trim((string) preg_replace('#<script\b[^>]*>.*?</script>#is', '', $raw));
$decoded = $stripped !== '' ? json_decode($stripped, true) : null;
```

E ao montar `ok`, sucesso não vem com chave `success` no corpo (só erro
tem) — usar `?? true`, não `empty($decoded['success'] === false)` (isso
gera `Undefined array key` warning em todo sucesso).

## Live vs sandbox

GiveWP não tem uma chave `paypal_environment` — quem manda é o **Test Mode**
global (`give_settings['test_mode']`, Give → Settings → General). Se
`test_mode !== 'enabled'`, está em modo live de verdade, mesmo que pareça
que devia ter uma env separada.

## Front-end: montar o botão do PayPal

Carregar o SDK oficial com o `clientId` devolvido por `/config`
(`https://www.paypal.com/sdk/js?client-id=...&currency=USD&intent=capture&components=buttons`)
e usar `paypal.Buttons({ createOrder, onApprove, onError, onCancel })`
chamando as 3 rotas acima em sequência: `createOrder` → `/paypal/create-order`
(devolve `id` do pedido PayPal); `onApprove` → `/paypal/approve-order` depois
`/donate` com `gatewayData.payPalOrderId`.

**Erro `UNSUPPORTED_PAYEE_CURRENCY`** no botão de "Cartão de Débito ou
Crédito" (guest checkout, funding source separado do botão PayPal
principal): não é bug de código — é a conta PayPal não suportar guest
checkout com cartão pra aquele país/moeda do comprador (comum quando a
conta é US/USD e o testador está em outro país). O botão "PayPal" (login)
não passa por essa restrição. Se quiser cortar de vez esse funding source
problemático: `&disable-funding=card,credit,paylater` na URL do SDK.

## Testar sem gastar dinheiro — e sem sujar métricas

### Cartão de teste da Stripe (pra validar o fluxo Stripe de verdade)

O **Test Mode global do GiveWP** (mesmo toggle da seção "Live vs sandbox"
acima) controla PayPal **e** Stripe juntos — não dá pra testar só um dos
dois. Ligando, `/config` passa a devolver a chave `pk_test_...` da Stripe em
vez de `pk_live_...`, e aí o cartão oficial de teste (`4242 4242 4242 4242`,
validade futura qualquer, CVC qualquer) completa um Payment Intent de
mentira.

⚠️ Se você tiver um webhook de conclusão configurado (Utmify/CAPI/CRM, ver
seção anterior), ele **dispara de verdade** pra esse pagamento de teste —
mesmo aviso da seção "Test Donation" abaixo. Desligar temporariamente o
envio externo (ou aceitar limpar depois) antes de testar.

Sem um webhook endpoint cadastrado em **Test mode** no dashboard da Stripe
(aba separada do Live mode, ver seção de confirmação assíncrona acima), a
doação de teste fica presa em `processing` pra sempre — não é bug do
código, é falta de cadastro do lado da Stripe.

**Lembrar de reverter o Test Mode depois** — ele afeta doações reais de
quem estiver no site enquanto ligado.

### Gateway "Test Donation" (mais rápido, mas não testa o Stripe de verdade)

GiveWP tem um gateway embutido "Test Donation" (`TestGateway::id()` retorna
literalmente `'manual'`) que completa a doação **instantaneamente, sem
nenhuma chamada externa**. Pra habilitar: Give → Settings → Payment Gateways
→ Gateways → marcar o checkbox "Test Donation" (isso grava em
`give_settings['gateways_v3']`, ex.: `{"paypal-commerce":"1","manual":"1"}`
— sem isso o form rejeita `gatewayId: manual` com
`"gatewayId must be a valid gateway"`, mesmo o TestGateway suportando forms
v3).

Testar o fluxo completo direto no servidor (sem UI, sem navegador):

```php
wp eval '
$req = new WP_REST_Request("POST", "/givewp/v1/donate");
$req->set_header("Content-Type", "application/json");
$req->set_body(json_encode([
  "form_id" => 78, "gateway_id" => "manual", "amount" => "10.00",
  "currency" => "USD", "first_name" => "Teste", "last_name" => "X",
  "email" => "teste-x@example.com", "origin_url" => "https://site.com/",
]));
$res = rest_do_request($req);
echo $res->get_status() . " " . json_encode($res->get_data());
'
```

Confirmar que o webhook de conclusão (`give_complete_donation` →
seu hook pro Nest/CRM) disparou de verdade olhando o log de erro do PHP —
`error_log()` dentro do hook aparece lá mesmo em requisições internas via
wp-cli.

### ⚠️ "Test Donation" ainda é PRODUÇÃO de verdade

O gateway completa a doação de forma síncrona e real dentro do GiveWP —
cria post de doação, cria donor, e dispara `give_complete_donation` **igual
uma doação real**. Se o site tiver qualquer webhook de conclusão configurado
(pixel do Facebook, envio pra Utmify/CAPI, CRM), esse teste vai **poluir
métricas de produção de verdade**. Não existe modo sandbox pra isso — é
"fake payment, real side-effects".

**Antes de testar**: confirmar com quem gerencia a conta que não tem
integração de analytics/ads ligada nesse form, OU aceitar que vai precisar
limpar depois (ver seção seguinte), OU desligar temporariamente o envio pro
serviço externo enquanto testa.

## Limpar poluição de teste (se vazou pra produção)

### No WordPress/GiveWP

Cada doação de teste cria um post `give_forms`/donation E um registro de
doador (`wp_give_donors`) se o e-mail for novo. Apagar os dois:

```php
wp eval '
foreach ([<ids das doacoes>] as $id) { wp_delete_post($id, true); }
'
// Achar o donor id pelo e-mail:
wp eval '
global $wpdb;
$donor = $wpdb->get_row($wpdb->prepare(
  "SELECT id FROM {$wpdb->prefix}give_donors WHERE email = %s", $email
));
'
// Apagar via o MODEL novo, não a classe legada (Give_Donor não tem ->delete()):
wp eval '\Give\Donors\Models\Donor::find($id)->delete();'
```

Fazer backup via `mysqldump --where="ID IN (...)"` (`wp_posts` +
`wp_postmeta` pra doação, `wp_give_donors` + `wp_give_donormeta` pro donor)
antes de apagar.

### Numa integração tipo Utmify (tracking de ads)

Essas plataformas normalmente **não têm endpoint de exclusão** — só dá pra
reenviar o mesmo pedido com status atualizado. Confirmar no código da
integração (não confiar só na doc): procurar como o `orderId` é montado
(geralmente = algum id/lead interno) e reenviar o **mesmo `orderId`** com
`status: "refunded"` + `refundedAt` preenchido — a chave de reconciliação no
painel é o `orderId`, reenviar atualiza em vez de duplicar. Status válidos
(Utmify): `waiting_payment | paid | refused | refunded | chargedback`.

Reconstruir o payload o mais fiel possível ao original (nome, e-mail, valor,
timestamp) — campos como `paymentMethod` costumam ser derivados de lógica
própria do backend (ex.: `gateway.includes('paypal') ? 'paypal' : 'credit_card'`),
então **ler o código de quem monta o payload original**, não assumir o
valor. Testar com 1 pedido só primeiro e conferir no painel visual antes de
mandar o resto em lote — o comportamento de "atualiza em vez de duplica"
raramente está 100% documentado, só inferido de exemplos.

Meta CAPI (se também disparado) geralmente não tem reversão automatizável —
avisar quem gerencia a conta de ads que pode precisar de ajuste manual.

## Erros comuns

- **Pular pro primeiro `{` numa resposta contaminada por `<script>`**: pega
  a chave errada se o JS dentro do script tiver seu próprio `{`. Sempre
  remover o bloco `<script>...</script>` inteiro via regex antes de decodificar.
- **Esquecer `donationType`/`levelId`** no payload da rota `donate`: fatal
  error, não erro de validação — mais difícil de debugar à primeira vista.
- **Testar com "Test Donation" sem checar se tem webhook de analytics
  ligado**: gera dado fake em produção que parece real (mesmo webhook, mesmo
  formato). Sempre perguntar/checar antes.
- **OPcache/staleness pós-deploy**: uma rota nova pode devolver 404 por
  1-2 minutos logo após salvar o `functions.php`, mesmo com o código
  correto — não é bug, é o worker do PHP-FPM ainda não ter recarregado.
  Esperar um pouco e testar de novo antes de assumir que quebrou.
- **Widget/shortcode nativo do GiveWP ainda na página**: se o form
  customizado substituiu o hack de esconder o form nativo (removendo o CSS
  que o escondia), mas o widget nativo continua na página por baixo, ele
  aparece cru pro visitante. Ou remove o widget de vez, ou mantém o CSS de
  esconder até remover.
- **`order_id` como chave literal no body JSON bloqueada por WAF**: em pelo
  menos um servidor, um POST cujo corpo JSON tem a chave `order_id` (mesmo
  com valor inofensivo) leva 404 puro do nginx, nem chega no PHP — regra de
  infra, não do GiveWP. Renomear a chave (ex.: `paypal_order_id`) resolve;
  não é óbvio pela mensagem de erro (não tem mensagem, é 404 seco), só
  aparece testando via curl direto contra o servidor.
- **Desembrulhar um nível a mais ou a menos na resposta de `/donate`**: a
  função que consome essa rota no front deve devolver só o SEU PRÓPRIO
  `data` (o que a rota REST devolveu), não o corpo HTTP inteiro — quem lê
  depois (ex. `extractStripeIntent`) já espera desembrulhar o nível do
  GiveWP por cima disso. Errar esse nível não dá erro de sintaxe, só um
  "campo não encontrado" confuso rio abaixo — ver a seção do Stripe acima
  pro caso real que isso já causou em produção.
- **Assumir o valor do enum de status do GiveWP sem checar a versão
  instalada**: `DonationStatus::COMPLETE` já foi `'publish'` numa versão e
  pode ter sido `'complete'` (ou outra coisa) em versões mais antigas/outras
  integrações de referência. Sempre conferir `DonationStatus.php` do plugin
  de destino antes de copiar um hook de outro projeto.
