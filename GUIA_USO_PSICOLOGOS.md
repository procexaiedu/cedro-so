# 📚 CEDRO - GUIA COMPLETO DE USO PARA PSICÓLOGOS

Bem-vindo ao **CEDRO**, sua plataforma digital de gestão clínica. Este guia foi desenvolvido para ajudar você a aproveitar ao máximo todas as funcionalidades do sistema de forma simples e prática.

---

## 📋 ÍNDICE

1. [Como Começar](#como-começar)
2. [Dashboard - Sua Visão Geral](#dashboard)
3. [Agenda - Gerenciar Suas Consultas](#agenda)
4. [Pacientes - Seus Clientes](#pacientes)
5. [Prontuários - Registros Clínicos](#prontuários) ⚠️ **EM TESTES**
6. [Disponibilidade - Seu Horário](#disponibilidade)
7. [Planos de Atendimento](#planos-de-atendimento)
8. [Gravação de Consultas](#gravação-de-consultas)
9. [Dicas e Boas Práticas](#dicas-e-boas-práticas)
10. [Suporte](#suporte)

---

## 🚀 Como Começar

### Login no Sistema

1. Acesse: `http://localhost:3000` (ou o domínio do seu servidor)
2. Insira seu **email** e **senha**
3. Clique em "Entrar"
4. Você será redirecionado automaticamente para o **Dashboard**

### Sua Área de Trabalho

Ao fazer login, você verá:
- **Barra Lateral**: Navegação entre módulos
- **Seu Perfil**: Canto superior direito com seu nome
- **Notificações**: Avisos e alertas do sistema

---

## 📊 Dashboard - Sua Visão Geral

Seu dashboard mostra um resumo executivo do seu trabalho:

### O Que Você Vê

**Estatísticas Rápidas:**
- **Próximas Consultas**: Suas próximas 5 consultas programadas
- **Pacientes Ativos**: Total de pacientes em acompanhamento
- **Consultas Hoje**: Quantas consultas você tem hoje
- **Últimas Notas**: Prontuários mais recentes

### Como Usar

- **Clique em "Próximas Consultas"** → Ir direto para a Agenda
- **Clique em "Pacientes Ativos"** → Abrir lista de Pacientes
- **Clique em uma data** → Ver detalhes daquele dia

> **💡 Dica**: Confira o dashboard todo dia de manhã para se preparar!

---

## 📅 Agenda - Gerenciar Suas Consultas

A **Agenda** é o coração do CEDRO. Aqui você gerencia todas as suas consultas com seus pacientes.

### Visualizações Disponíveis

Você pode escolher entre **3 formas de visualizar** sua agenda:

#### 1️⃣ **Visualização Dia**
Veja todas as suas consultas de um dia específico com detalhes completos.

**Como usar:**
1. Clique na aba **"Dia"**
2. Use as setas (< >) para navegar entre dias
3. Ou clique no calendário para escolher uma data

#### 2️⃣ **Visualização Semana** (Padrão)
Veja 7 dias em uma única tela, com um resumo visual de todas as suas consultas.

**Como usar:**
1. Clique na aba **"Semana"**
2. Navegue com as setas para próximas/anteriores semanas
3. Veja todas as suas consultas lado a lado

#### 3️⃣ **Visualização Mês**
Uma visão completa do mês inteiro para planejamento.

**Como usar:**
1. Clique na aba **"Mês"**
2. Veja o calendário completo
3. Clique em um dia para ver detalhes

### Criando uma Nova Consulta

**Passo a Passo:**

1. Clique no botão **"+ Novo Agendamento"** (canto superior direito)
2. Preencha os dados:
   - **Paciente**: Selecione da lista (ou crie um novo)
   - **Serviço**: Tipo de atendimento (ex: Psicoterapia, Orientação)
   - **Data e Hora**: Quando será a consulta
   - **Duração**: Quantos minutos (padrão: 60 min)
   - **Notas**: Observações extras (opcional)

3. Clique em **"Salvar"**

> ✅ **Pronto!** A consulta aparecerá na sua agenda imediatamente.

### Editando uma Consulta

1. **Clique na consulta** na agenda
2. Clique em **"Editar"**
3. Altere os dados que precisar
4. Clique em **"Salvar"**

### Cancelando uma Consulta

1. **Clique na consulta** na agenda
2. Clique em **"Deletar"**
3. Confirme o cancelamento

> **⚠️ Importante**: O cancelamento é imediato. Seu paciente não será notificado automaticamente.

### Filtrando Sua Agenda

**Por Paciente (Busca):**
1. Use a barra de busca para procurar por nome do paciente
2. Resultados aparecem em tempo real

**Por Terapeuta (Apenas Admins):**
- Filtre para ver consultas de outros colegas

### Informações Importantes da Consulta

Ao clicar em uma consulta, você vê:
- ✅ Status (Agendada, Confirmada, Realizada, Cancelada)
- 👤 Nome e dados do paciente
- 📋 Serviço contratado
- 🕐 Hora de início e término
- 📝 Notas adicionadas
- 🎥 Link para chamada de vídeo (se configurado)

> **💡 Dica**: Adicione notas antes da consulta para não esquecer pontos importantes!

---

## 👥 Pacientes - Seus Clientes

A seção de **Pacientes** é onde você gerencia informações de todas as suas pessoas em acompanhamento.

### Listando Seus Pacientes

1. Clique em **"Pacientes"** na barra lateral
2. Veja todos os seus pacientes com informações-chave:
   - Nome completo
   - Email e telefone
   - Última consulta
   - Total de consultas

### Procurando um Paciente

Use a **barra de busca** para encontrar rapidamente:
- Digite o nome
- Resultados aparecem conforme você digita
- Clique para abrir o perfil

### Criando um Novo Paciente

1. Clique em **"+ Novo Paciente"**
2. Preencha os dados básicos:
   - **Nome completo** ⭐ (obrigatório)
   - **Email** (para contato)
   - **Telefone** (para contato)
   - **Data de nascimento** (ajuda com cálculo de idade)
   - **Gênero** (para registros)

3. Dados opcionais:
   - CPF
   - Estado civil
   - Profissão/Ocupação
   - Notas gerais
   - Tags (para organização)

4. Clique em **"Salvar"**

> ✅ **Seu paciente foi criado!** Agora você pode agendar consultas com ele.

### Editando Dados do Paciente

1. **Clique no paciente** na lista
2. Clique em **"Editar"**
3. Altere os dados necessários
4. Clique em **"Salvar"**

### Visualizando o Perfil Completo

Clique no paciente para ver:
- ✅ Todos os dados pessoais
- 📅 Histórico de consultas agendadas
- 📊 Estatísticas de acompanhamento
- 📝 Última nota registrada
- 💰 Situação de pagamento (se houver)

### Organizando Seus Pacientes

Use as **tags** para categorizar:
- "Novo paciente"
- "Prioridade"
- "Encaminhado"
- "Alta clínica"

---

## 📋 Prontuários - Registros Clínicos

> ⚠️ **ATENÇÃO**: Esta seção está em **FASE DE TESTES**. Funcionalidades podem mudar. Envie feedback para melhorias!

Os **Prontuários** armazenam todos os seus registros clínicos de forma segura e organizada.

### Tipos de Registros

Você pode criar diferentes tipos de registros:

#### 1. **Anamnese** (Avaliação Inicial)
Coleta de informações histórico da pessoa no início do acompanhamento.

#### 2. **SOAP Notes** (Registro Estruturado)
Formato padrão em saúde:
- **S (Subjetivo)**: O que o paciente relata
- **O (Objetivo)**: O que você observa
- **A (Assessment)**: Sua análise
- **P (Plan)**: Plano de ação

#### 3. **Notas de Evolução**
Atualizações sobre o progresso do paciente ao longo do tempo.

#### 4. **Rascunho de Prescrição**
Notas para possíveis encaminhamentos (se necessário).

### Criando um Novo Prontuário

1. Clique em **"Prontuários"** na barra lateral
2. Clique em **"+ Novo Registro"**
3. Selecione o **tipo de registro**
4. Escolha o **paciente**
5. Escolha a **consulta** relacionada (opcional)
6. Escreva suas **anotações**
7. Escolha se será **privado** (só você) ou **visível para a equipe**
8. Clique em **"Salvar"**

> ✅ **Seu registro foi salvo!**

### Acessando Prontuários

**Para visualizar registros:**
1. Vá para **"Prontuários"**
2. Você verá seus registros listados
3. Clique para ler ou editar

**Por Paciente:**
1. Acesse o perfil do paciente
2. Veja seus registros naquela aba

### Assinando um Prontuário (Validação)

Após terminar um registro, você pode **assiná-lo digitalmente**:

1. Abra o registro
2. Clique em **"Assinar"**
3. Sua assinatura digital será registrada automaticamente
4. O registro fica marcado como **finalizado**

> **🔒 Segurança**: Registros assinados não podem ser alterados.

### Integração com Gravações

Se você ativou a **gravação de consultas**:
- O sistema gera um **rascunho do prontuário** automaticamente
- Baseado na transcrição da sua consulta
- Você revisa, edita, e confirma as informações
- Depois assina normalmente

> **💡 Dica**: Essa integração economiza muito tempo!

### ⚠️ Observações Importantes (Fase de Testes)

Nesta fase, por favor:
- ✅ Sempre faça **backup** de registros críticos
- ✅ Revise bem antes de **assinar** (não pode reverter)
- ✅ Se encontrar erros ou problemas, **comunique imediatamente**
- ✅ A geração automática de registros está sendo melhorada
- ✅ Feedbacks são muito bem-vindos!

---

## ⏰ Disponibilidade - Seu Horário

Configure aqui **quando você trabalha** e **quando não está disponível**.

### Configurando Seu Horário Regular

1. Clique em **"Disponibilidade"** na barra lateral
2. Você verá **7 cards** (um para cada dia da semana)
3. Para cada dia que você trabalha:
   - Clique em **"Editar"** (ou **"+ Adicionar"** se não houver ainda)
   - Defina a **hora de início** (ex: 08:00)
   - Defina a **hora de término** (ex: 18:00)
   - Adicione uma **nota** se quiser (opcional)
   - Clique em **"Salvar"**

4. Para dias que **você não trabalha**: deixe em branco ou clique "Deletar"

> **Exemplo**:
> - Segunda a sexta: 08:00 às 18:00
> - Sábado: 09:00 às 13:00
> - Domingo: não trabalha

### Adicionando Exceções (Faltas, Férias, Extras)

Às vezes sua disponibilidade muda em datas específicas:

**Situações Comuns:**
- 🏥 Você está doente
- 🏖️ Período de férias
- 📚 Participando de treinamento
- ⏱️ Disponibilidade extra em um dia específico

**Como Adicionar:**

1. Procure a seção **"Exceções"** na página
2. Clique em **"+ Adicionar Exceção"**
3. Escolha a **data**
4. Escolha o **tipo**:
   - **Bloqueio** = você NÃO está disponível
   - **Extra** = você ESTÁ disponível (além do horário normal)
5. Defina o **horário** (início e fim)
6. Adicione uma **nota** (ex: "Férias")
7. Clique em **"Salvar"**

### Exemplo Prático

**Você trabalha de seg-sex 09:00-17:00, mas:**
- Próxima segunda-feira será feriado → Adicione **Bloqueio** de 09:00-17:00
- Próxima terça você pode atender até as 19:00 → Adicione **Extra** de 17:00-19:00

> **🔒 Importante**: O sistema usa sua disponibilidade para evitar conflitos de agendamento!

---

## 💰 Planos de Atendimento

Os **Planos de Atendimento** definem a quantidade e frequência de sessões com seus pacientes.

### Tipos de Planos

Você pode oferecer diferentes planos:

| Plano | Sessões | Frequência |
|-------|---------|-----------|
| **Avulsa** | 1 sessão | Conforme necessário |
| **4 Sessões** | 4 sessões | Mensal |
| **10 Sessões** | 10 sessões | Trimestral |
| **Quinzenal** | Ilimitado | 1x cada 2 semanas |

### Criando um Plano para um Paciente

1. Acesse o **perfil do paciente**
2. Clique em **"Planos"** ou **"+ Novo Plano"**
3. Preencha:
   - **Tipo de plano** (escolha acima)
   - **Valor do plano** (em reais)
   - **Desconto** (se houver)
   - **Status** (ativo, pausado ou finalizado)

4. Clique em **"Salvar"**

### Acompanhando o Progresso

Quando um plano é criado, o sistema rastreia:
- ✅ Total de sessões incluídas
- ✅ Sessões já utilizadas
- ✅ Sessões restantes
- ✅ Próxima consulta esperada

> **Exemplo**: Paciente com plano de 10 sessões:
> - Total: 10 sessões
> - Usadas: 3 sessões
> - Restantes: 7 sessões

### Finalizando um Plano

Quando o paciente completar todas as sessões:
1. Acesse o plano
2. Clique em **"Finalizar"**
3. Escolha a próxima ação:
   - Criar novo plano
   - Deixar disponível para consultas avulsas
   - Finalizar acompanhamento

---

## 🎙️ Gravação de Consultas (Recurso Avançado)

Se sua clínica ativou este recurso, você pode **gravar suas consultas** para fins de qualidade e documentação.

### Como Funciona

1. **Antes da Consulta**: Sistema ativa gravação automaticamente
2. **Durante**: Você foca na consulta, sistema grava áudio
3. **Depois**: Sistema processa a gravação
4. **Resultado**: Transcrição gerada automaticamente
5. **Revisão**: Você revisa e aprova o conteúdo
6. **Integração**: Prontuário é gerado com base na transcrição

### Fluxo Completo

#### Passo 1: Consulta é Agendada
- Sistema marca consulta como "pronta para gravação"

#### Passo 2: Gravação Acontece
- Quando você inicia a consulta, gravação começa automaticamente
- Sistema captura o áudio da sessão

#### Passo 3: Envio Automático
- Após a consulta, arquivo é enviado para processamento
- Pode levar alguns minutos a horas (depende da duração)

#### Passo 4: Transcrição
- Sistema transcreve o áudio em texto
- Gera transcrição bruta (todas as palavras)
- Gera transcrição limpa (otimizada para leitura)

#### Passo 5: Revisão
- Você acessa a transcrição
- **Revisa a acurácia**
- Faz correções se necessário

#### Passo 6: Geração de Prontuário
- Sistema usa a transcrição revisada
- **Gera automaticamente um rascunho de prontuário**
- Estruturado em formato SOAP
- Você revisa, edita se necessário, e assina

### Vantagens

✅ **Economiza Tempo**: Não precisa escrever durante a sessão
✅ **Mais Preciso**: Nada é esquecido
✅ **Documentação Completa**: Registro detalhado da sessão
✅ **Qualidade**: Permite revisão da sua própria prática

### ⚠️ Importante (Privacidade)

- 🔒 **Consentimento**: Sempre obtenha consentimento do paciente ANTES de gravar
- 🔐 **Segurança**: Gravações são armazenadas com criptografia
- 👤 **Sigilo**: Apenas você e equipe autorizada veem as gravações
- ✅ **LGPD**: Sistema está em conformidade com legislação de privacidade

---

## 💡 Dicas e Boas Práticas

### Dica 1: Organize Seu Dia

Toda manhã:
1. ✅ Confira o Dashboard
2. ✅ Veja suas próximas consultas
3. ✅ Revise suas notas anteriores
4. ✅ Confirme disponibilidade

### Dica 2: Use Tags nos Pacientes

Categorize para encontrar rápido:
- "Primeira vez"
- "Caso complexo"
- "Encaminhamento especializado"
- "Acompanhamento intensivo"

### Dica 3: Mantenha Prontuários Atualizados

Melhor prática:
- ✅ Registre logo após a sessão (informações fresca)
- ✅ Use a estrutura SOAP
- ✅ Seja objetivo e claro
- ✅ Assine quando finalizar

### Dica 4: Sincronize com Sua Rotina

**Sugestão de Workflow:**

| Horário | Ação |
|---------|------|
| 07:30 | Verificar Dashboard e confirmar dia |
| 08:45 | Preparar sala, revisar notas do paciente |
| 09:00 | Primeira consulta |
| 10:00 | Registrar prontuário (enquanto fresco) |
| 10:15 | Próxima consulta |
| ... | Continue assim ao longo do dia |
| 18:00 | Revise dia, confirme planos de pacientes |

### Dica 5: Aproveite a Busca

Você pode procurar:
- Por nome do paciente
- Por serviço
- Por data da consulta
- Por status

Use a busca para encontrar informações rapidamente!

### Dica 6: Revise Regularmente

Uma vez por mês:
- ✅ Verifique pacientes em aberto
- ✅ Confirme planos de atendimento
- ✅ Atualize disponibilidade se necessário
- ✅ Prepare relatórios (se sua clínica usa)

---

## 🆘 Suporte

### Encontrou um Problema?

**Se o sistema não está funcionando corretamente:**

1. Primeiro, **recarregue a página** (F5)
2. Limpe o cache do navegador (Ctrl+Shift+Delete)
3. Tente em outro navegador
4. Se persistir, entre em contato com o admin

### Dúvidas sobre Uso?

📧 **Email de Suporte**: suporte@cedro.com
📞 **Telefone**: (XX) XXXXX-XXXX
💬 **Chat**: Disponível no sistema (canto inferior direito)
📚 **Base de Conhecimento**: Procure por tutoriais em vídeo

### Reportando Problemas

Ao reportar um problema, inclua:
- ✅ **O que você tentou fazer**
- ✅ **Qual erro apareceu** (screenshot ajuda!)
- ✅ **Qual navegador está usando**
- ✅ **Em qual horário aconteceu**
- ✅ **Se conseguir reproduzir** (sempre, às vezes, nunca)

### 📢 Feedback

Sua opinião importa! Se você tem sugestões de melhorias:

1. Acesse o menu do seu perfil (canto superior direito)
2. Clique em **"Enviar Feedback"**
3. Descreva sua sugestão
4. Clique em **"Enviar"**

> Melhorias são desenvolvidas baseado no feedback dos usuários!

---

## 📱 Acessando do Celular

CEDRO funciona em qualquer navegador:
- ✅ Desktop (recomendado para melhor experiência)
- ✅ Tablet (bom para consultar rápido)
- ✅ Celular (visualização móvel disponível)

**Dica**: Salve o link do CEDRO na tela inicial do seu telefone para acesso rápido!

---

## 🔐 Segurança e Privacidade

### Seu Login é Pessoal

⚠️ **NUNCA** compartilhe sua senha com ninguém, nem com colegas!

Cada pessoa da clínica tem seu próprio acesso com suas permissões.

### Sessão Expirada?

Se você fica muito tempo sem usar:
1. Sistema desconecta automaticamente (segurança)
2. Simplesmente faça login novamente
3. Seus dados estão intactos

### Certificado de Segurança

- 🔒 Todas as comunicações são criptografadas (HTTPS)
- 🔐 Senhas são criptografadas no banco de dados
- ✅ Conformidade com LGPD (Lei Geral de Proteção de Dados)

---

## 📞 Próximos Passos

Parabéns! Você aprendeu o básico do CEDRO!

### Agora você está pronto para:
1. ✅ Agendar e gerenciar suas consultas
2. ✅ Organizar seus pacientes
3. ✅ Registrar prontuários com segurança
4. ✅ Controlar sua disponibilidade
5. ✅ Acompanhar planos de atendimento

### Quando se Sentir Confortável:
- 📚 Explore recursos avançados
- 🎙️ Teste a gravação de consultas
- 📊 Confira relatórios e estatísticas
- 🤝 Colabore com colegas (se sua clínica tem múltiplos usuários)

---

## 📝 Última Atualização

**Versão**: 1.0
**Data**: Novembro de 2024
**Status**: Sistema em melhorias contínuas

> 💬 Sua feedback ajuda a tornar o CEDRO cada vez melhor!

---

## ✨ Bem-vindo ao CEDRO!

Agora você tem tudo que precisa para começar a usar o sistema com confiança.

**Qualquer dúvida, estamos aqui para ajudar! 🙌**

---

**CEDRO - Seu Sistema de Gestão Clínica Inteligente**
*Desenvolvido com ❤️ para profissionais de saúde mental*
