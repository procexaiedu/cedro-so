# Guia de Configuração de CRONs (VPS)

Este projeto requer 2 tarefas agendadas (CRON jobs) para manter a sincronização com o Google Calendar funcionando corretamente.

## 1. Pré-requisitos

Certifique-se de que seu arquivo `.env` no servidor de produção contém estas variáveis:

```env
# URL pública da aplicação (HTTPS é obrigatório para webhooks do Google)
APP_URL=https://sua-aplicacao.com

# Segredo para proteger os endpoints de CRON (gere uma string aleatória)
CRON_SECRET=seu_segredo_aqui_123
```

## 2. Configurando o Crontab

Acesse sua VPS e edite o crontab do usuário que executa a aplicação:

```bash
crontab -e
```

Adicione as seguintes linhas ao final do arquivo. 

> **Nota:** Assumindo que a aplicação roda localmente na porta 3000. Se estiver usando Docker ou outra porta, ajuste a URL.

### Job 1: Processar Fila de Sincronização (A cada minuto)
Processa mudanças feitas no Cedro e envia para o Google Calendar. Deve rodar frequentemente para o usuário sentir que é "tempo real".

```bash
# Cedro GCal Sync Queue Processor (Every minute)
* * * * * curl -s -X POST http://localhost:3000/api/cron/process-gcal-sync -H "Authorization: Bearer SEU_CRON_SECRET_AQUI" > /dev/null
```

### Job 2: Renovar Canais de Webhook (Diariamente)
Os webhooks do Google Calendar expiram a cada ~24h. Este job renova as subscrições antes que expirem.

```bash
# Cedro GCal Channel Renewer (Daily at 00:00)
0 0 * * * curl -s -X POST http://localhost:3000/api/cron/renew-gcal-channels -H "Authorization: Bearer SEU_CRON_SECRET_AQUI" > /dev/null
```

## 3. Verificação

Para verificar se os CRONs estão funcionando:

1. **Logs da Aplicação:** Verifique os logs do container/processo da aplicação. Você deve ver mensagens como:
   - `Starting Google Calendar sync queue processing...`
   - `Starting Google Calendar channels renewal...`

2. **Banco de Dados:**
   - Tabela `cedro.gcal_sync_queue`: Jobs devem passar de `pending` para `completed`.
   - Tabela `cedro.google_calendar_channels`: A coluna `expiration` deve mostrar datas futuras (> 24h a partir de agora após renovação).

## 4. Troubleshooting

Se os jobs falharem:

1. **Erro 401 Unauthorized:** Verifique se o `CRON_SECRET` no comando curl é EXATAMENTE igual ao do `.env`.
2. **Erro de Conexão:** Se usar `localhost`, garanta que o processo Node.js está ouvindo em 127.0.0.1. Se estiver em Docker, talvez precise usar o nome do container ou IP da rede Docker.
3. **Schema Error:** Se ver erros sobre tabelas não encontradas, certifique-se de que o código foi atualizado com as correções recentes que definem `schema: 'cedro'` nos clientes Supabase.
