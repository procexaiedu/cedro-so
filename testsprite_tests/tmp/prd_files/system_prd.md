# PRD - Sistema Cedro: Plataforma de Atendimento AI para Terapeutas

## 1. Visão Geral do Produto

### 1.1 Descrição
O Sistema Cedro é uma plataforma completa de gestão para terapeutas que integra inteligência artificial para automatizar a criação de prontuários médicos através do processamento de áudio de consultas.

### 1.2 Objetivos
- Digitalizar e automatizar o processo de criação de prontuários médicos
- Facilitar a gestão de pacientes, agendamentos e aspectos financeiros
- Implementar um sistema de CRM para captação e conversão de leads
- Proporcionar uma interface intuitiva e responsiva para terapeutas

## 2. Funcionalidades Principais

### 2.1 Dashboard
**Objetivo**: Painel central com visão geral do sistema
**Funcionalidades**:
- Exibição de estatísticas gerais (total de pacientes, consultas, receita)
- Lista de próximas consultas
- Alertas e notificações do sistema
- Métricas financeiras resumidas
- Indicadores de performance

**Critérios de Aceitação**:
- Dados devem ser atualizados em tempo real
- Interface responsiva para desktop e mobile
- Carregamento rápido (< 2 segundos)

### 2.2 Gestão de Pacientes
**Objetivo**: CRUD completo para gerenciamento de pacientes
**Funcionalidades**:
- Cadastro de novos pacientes com dados pessoais e médicos
- Listagem com filtros avançados (nome, status, terapeuta)
- Visualização detalhada do histórico do paciente
- Edição e exclusão de registros
- Cálculo automático de idade
- Histórico de consultas e prontuários

**Critérios de Aceitação**:
- Validação de dados obrigatórios
- Busca em tempo real
- Paginação para listas grandes
- Proteção contra exclusão acidental

### 2.3 Sistema de Agendamento
**Objetivo**: Gestão completa de consultas e horários
**Funcionalidades**:
- Calendário interativo com visualizações (dia/semana/mês)
- Agendamento de novas consultas
- Edição e cancelamento de agendamentos
- Associação com pacientes e terapeutas
- Status de consultas (agendada, confirmada, realizada, cancelada)
- Integração com disponibilidade dos terapeutas

**Critérios de Aceitação**:
- Interface de calendário intuitiva
- Prevenção de conflitos de horário
- Notificações de lembretes
- Sincronização em tempo real

### 2.4 Gestão de Disponibilidade
**Objetivo**: Configuração de horários disponíveis dos terapeutas
**Funcionalidades**:
- Configuração de horários por dia da semana
- Múltiplos horários por dia
- Exceções de agenda (feriados, ausências)
- Visualização semanal da disponibilidade
- Edição rápida de horários

**Critérios de Aceitação**:
- Interface drag-and-drop para facilitar configuração
- Validação de conflitos de horário
- Persistência automática das alterações

### 2.5 Prontuários Médicos com IA
**Objetivo**: Criação automatizada de prontuários através de processamento de áudio
**Funcionalidades**:
- Upload de arquivos de áudio de consultas
- Transcrição automática via IA (Groq Whisper)
- Geração estruturada de prontuários via OpenAI
- Edição manual dos prontuários gerados
- Histórico completo de versões
- Categorização por tipo (anamnese, evolução, consulta)
- Sistema de prompts dinâmicos (Cerebro)

**Critérios de Aceitação**:
- Suporte a múltiplos formatos de áudio
- Processamento assíncrono com feedback de status
- Qualidade de transcrição > 95%
- Tempo de processamento < 5 minutos
- Interface de edição rica em texto

### 2.6 Gestão Financeira
**Objetivo**: Controle de faturamento e pagamentos
**Funcionalidades**:
- Criação e gestão de faturas
- Controle de status de pagamento
- Relatórios financeiros
- Integração com gateway de pagamento (Asaas)
- Histórico de transações
- Filtros por período, status e terapeuta

**Critérios de Aceitação**:
- Cálculos financeiros precisos
- Geração automática de faturas
- Notificações de vencimento
- Relatórios exportáveis

### 2.7 Sistema CRM
**Objetivo**: Gestão de leads e pipeline de vendas
**Funcionalidades**:
- Cadastro e gestão de leads
- Pipeline visual (Kanban)
- Sistema de scoring automático
- Histórico de atividades e interações
- Conversão de leads em pacientes
- Filtros e busca avançada
- Métricas de conversão

**Critérios de Aceitação**:
- Interface Kanban intuitiva
- Drag-and-drop entre estágios
- Cálculo automático de métricas
- Integração com módulo de pacientes

### 2.8 Sistema de Conversas
**Objetivo**: Comunicação interna e com pacientes
**Funcionalidades**:
- Chat interno entre terapeutas
- Histórico de conversas
- Interface de mensagens em tempo real

**Critérios de Aceitação**:
- Mensagens em tempo real
- Histórico persistente
- Interface responsiva

## 3. Requisitos Técnicos

### 3.1 Performance
- Tempo de carregamento inicial < 3 segundos
- Navegação entre páginas < 1 segundo
- Suporte a 100+ usuários simultâneos
- Otimização para dispositivos móveis

### 3.2 Segurança
- Autenticação baseada em roles (admin/terapeuta)
- Criptografia de dados sensíveis
- Backup automático diário
- Conformidade com LGPD

### 3.3 Usabilidade
- Interface responsiva (desktop, tablet, mobile)
- Suporte a navegadores modernos
- Acessibilidade (WCAG 2.1)
- Feedback visual para todas as ações

### 3.4 Integração
- API REST para integrações externas
- Webhooks para N8N (processamento de áudio)
- Integração com Supabase (banco de dados)
- Integração com MinIO (armazenamento de arquivos)

## 4. Fluxos de Usuário Principais

### 4.1 Fluxo de Criação de Prontuário
1. Terapeuta realiza consulta e grava áudio
2. Upload do arquivo de áudio no sistema
3. Sistema processa áudio via N8N (transcrição + IA)
4. Prontuário estruturado é gerado automaticamente
5. Terapeuta revisa e edita se necessário
6. Prontuário é salvo no histórico do paciente

### 4.2 Fluxo de Agendamento
1. Terapeuta acessa agenda
2. Seleciona data/horário disponível
3. Escolhe paciente existente ou cadastra novo
4. Define tipo de consulta e observações
5. Confirma agendamento
6. Sistema atualiza disponibilidade

### 4.3 Fluxo de Gestão de Lead (CRM)
1. Lead é cadastrado no sistema
2. Sistema calcula score automático
3. Lead é posicionado no pipeline
4. Terapeuta realiza atividades de follow-up
5. Lead progride pelos estágios
6. Conversão em paciente quando apropriado

## 5. Critérios de Sucesso

### 5.1 Métricas de Performance
- Tempo de resposta médio < 2 segundos
- Disponibilidade > 99.5%
- Taxa de erro < 0.1%

### 5.2 Métricas de Usabilidade
- Taxa de adoção > 90% dos terapeutas
- Tempo de treinamento < 2 horas
- Satisfação do usuário > 4.5/5

### 5.3 Métricas de Negócio
- Redução de 70% no tempo de criação de prontuários
- Aumento de 30% na eficiência de agendamentos
- Melhoria de 50% na conversão de leads

## 6. Limitações e Exclusões

### 6.1 Fora do Escopo Atual
- Telemedicina/videochamadas
- Integração com sistemas hospitalares
- Prescrição eletrônica
- Faturamento automático para convênios

### 6.2 Limitações Técnicas
- Processamento de áudio limitado a arquivos < 100MB
- Suporte inicial apenas para português brasileiro
- Integração limitada a APIs específicas (Groq, OpenAI)

## 7. Roadmap de Desenvolvimento

### 7.1 Fase 1 (Atual)
- ✅ Módulos principais implementados
- ✅ Integração com IA funcional
- ✅ Interface responsiva
- ✅ Sistema de autenticação

### 7.2 Fase 2 (Próximos passos)
- Testes automatizados completos
- Otimizações de performance
- Melhorias na UX
- Relatórios avançados

### 7.3 Fase 3 (Futuro)
- Aplicativo mobile nativo
- Integração com mais provedores de IA
- Funcionalidades de telemedicina
- Analytics avançados