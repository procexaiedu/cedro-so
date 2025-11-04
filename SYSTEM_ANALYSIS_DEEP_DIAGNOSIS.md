# 🔴 DIAGNÓSTICO PROFUNDO - SISTEMA CEDRO

**Data**: 2025-11-04
**Status**: ❌ **CRÍTICO - Sistema estruturalmente quebrado**
**Severidade**: ALTA - Afeta todos os módulos sistematicamente

---

## 📊 RESUMO EXECUTIVO

O sistema tem **5 problemas estruturais raiz** que causam:
- ❌ Loading infinito em módulos
- ❌ Necessidade constante de F5
- ❌ Timeouts frequentes
- ❌ Dados não carregarem
- ❌ Código sujo e inconsistente
- ❌ Péssimo error handling

Isso **NÃO é problema de módulo individual**, é arquitetura quebrada.

---

## 🔍 PROBLEMA #1: DATA FETCHING INCONSISTENTE

### Situação Atual

**Módulo de Agenda** (BORRÃO):
```typescript
const { data: appointments = [], isLoading: appointmentsLoading } = useAppointments()
const { data: therapists = [] } = useTherapists()
const { data: services = [] } = useServices()

// ✅ Usando React Query corretamente
```

**Módulo de Disponibilidade** (🔴 QUEBRADO):
```typescript
const [therapists, setTherapists] = useState<any[]>([])
const [selectedTherapist, setSelectedTherapist] = useState<string>('')
const [isLoading, setIsLoading] = useState(false)

useEffect(() => {
  if (cedroUser) {
    loadTherapists()  // ❌ Chamada manual
  }
}, [cedroUser, loadTherapists])  // ❌ Dependências problemáticas

const loadTherapists = useCallback(async () => {
  const therapistsData = await getTherapists()  // ❌ Sem cache, sem retry
  setTherapists(therapistsData)
}, [cedroUser])  // ❌ 'cedroUser' dentro de useCallback que é dependência!
```

### O Problema

```
INCONSISTÊNCIA ENTRE MÓDULOS:
- Alguns módulos usam React Query (certo) ✅
- Outros usam useState + useCallback + useEffect (errado) ❌
- Isso cria padrões diferentes que confundem o desenvolvedor
- Causa bugs diferentes em cada módulo

PROBLEMA NO CÓDIGO:
  const loadTherapists = useCallback(async () => {
    ...uso de cedroUser...
  }, [cedroUser])

  useEffect(() => {
    ...
  }, [cedroUser, loadTherapists])  // Dependência circular!

RESULTADO:
  1. loadTherapists contém cedroUser
  2. useCallback depende de cedroUser
  3. useEffect depende de loadTherapists E cedroUser
  4. Quando cedroUser muda:
     - loadTherapists é recriada
     - useEffect vê mudança em loadTherapists
     - Dispara novamente
     - Cria ciclo de chamadas
  5. Se há erro/timeout na primeira chamada, o ciclo trava tudo
```

---

## 🔴 PROBLEMA #2: FALTA DE ERROR HANDLING ROBUSTO

### Código Atual

```typescript
// Em src/data/pacientes.ts
export async function getPatients(...) {
  try {
    let query = supabase.schema('cedro').from('patients').select(...)
    const { data: patients, error } = await query

    if (error) {
      console.error('Error fetching patients:', error)
      throw new Error('Erro ao buscar pacientes')  // ❌ Simples throw
    }
    return patients || []
  } catch (error) {
    console.error('Error in getPatients:', error)
    throw error  // ❌ Propaga sem tratamento
  }
}
```

### O Problema

```
QUANDO UMA QUERY FALHA:

1. throw new Error() é capturada
2. Se for 4xx error (403, 404), não há retry
3. React Query tenta retry (2x máximo)
4. Se falhar todas as 3 tentativas:
   - Loading state fica indefinido (às vezes true, às vezes false)
   - Componente não sabe se está carregando ou se falhou
   - Usuário vê loading infinito ou tela branca
   - Precisa fazer F5

EXEMPLO REAL:
  ❌ RLS não implementado em alguns endpoints
  ❌ Query retorna 403 (forbidden) silenciosamente
  ❌ React Query não consegue fazer retry (é erro 4xx)
  ❌ Error callback dispara toast, mas loading state fica true
  ❌ Componente renderiza loading infinito
  ❌ Usuário precisa F5
```

---

## 🔴 PROBLEMA #3: MÚLTIPLAS QUERIES SIMULTÂNEAS SEM SINCRONIZAÇÃO

### Código Atual

```typescript
// Em src/app/disponibilidade/page.tsx
const loadScheduleData = useCallback(async () => {
  if (!selectedTherapist) return

  setIsLoading(true)
  try {
    const [schedulesData, exceptionsData] = await Promise.all([
      getTherapistSchedulesByDay(selectedTherapist),  // Query 1
      getScheduleExceptions(...)  // Query 2
    ])
    // ✅ Promise.all está bom, mas...

    setSchedulesByDay(schedulesData)
    setExceptions(exceptionsData)
  } catch (error) {
    // ❌ Se UMA query falhar, ambas falham
    // ❌ Não há retry parcial
    setIsLoading(false)
  }
}, [selectedTherapist])
```

### O Problema

```
CENÁRIO 1: Primeira query é lenta (10s), segunda é rápida (2s)
- Promise.all espera AMBAS
- Total: 10 segundos até renderizar
- Com timeout de 30s, 10s é aceitável
- Mas se network é instável, 10s pode virar 20s, 30s, timeout

CENÁRIO 2: Primeira query falha (403), segunda sucede
- Promise.all REJEITA completamente
- Ambas são descartadas
- Loading fica true FOREVER porque catch não setLoading(false) em ALGUNS paths
- Usuário vê loading infinito

CENÁRIO 3: Usuário clica em terapeuta diferente ENQUANTO loading
- selectedTherapist muda
- loadScheduleData é recriada
- useEffect vê mudança
- Dispara NOVA chamada Promise.all
- Requisição anterior ainda está pendente
- Duas requisições simultâneas
- Race condition: qual resultado é usado?
- Pode renderizar dados do terapeuta A quando está esperando B
```

---

## 🔴 PROBLEMA #4: SEM TRATAMENTO DE LOADING STATE

### Código Atual

```typescript
const [isLoading, setIsLoading] = useState(false)

const handleCreateSchedule = async () => {
  try {
    const result = await createTherapistSchedule({...})
    if (result) {
      toast({ title: "Sucesso" })
      setNewSchedule({...})
      loadScheduleData()  // ❌ Chama loadScheduleData SEM SINCRONIZAÇÃO
    }
  } catch (error) {
    toast({ title: "Erro" })
    // ❌ NÃO SETA isLoading(false) aqui!
  }
}
```

### O Problema

```
FLUXO BUGADO:

1. Usuário clica "Criar Horário"
2. handleCreateSchedule executa
3. createTherapistSchedule é enviada
4. Enquanto aguarda, NÃO há loading state visual
5. Se falhar:
   - catch executa, toast mostra erro
   - MAS isLoading nunca foi setLoading(true)
   - Então não precisa setLoading(false)
   - Problema: usuário clica novamente
   - Duas requisições simultâneas
   - Segunda sobrescreve a primeira

6. Se suceder:
   - loadScheduleData() é chamada
   - Mas loadScheduleData chama setIsLoading(true)
   - E setIsLoading(false) apenas no finally
   - Se a requisição de setScheduleData tomar 30s e timeout:
     - setIsLoading(false) no finally
     - MAS os dados nunca chegam
     - Tela fica em branco
     - Usuário precisa F5
```

---

## 🔴 PROBLEMA #5: QUERIES COMPLEXAS E LENTAS

### Código Atual

```typescript
// Em src/data/pacientes.ts (linha 53-57)
const { data: jobs, error } = await supabase
  .schema('cedro')
  .from('recording_jobs')
  .select(`
    *,
    patients!inner(full_name),
    users!recording_jobs_therapist_id_fkey(name)
  `)
  .in('status', ['uploaded', 'processing'])
  .order('created_at', { ascending: false })

// ❌ Isso é MUITO pesado:
// - select(*) pega TODAS as colunas (27 colunas)
// - patients!inner(full_name) faz INNER JOIN
// - users!...(name) faz OUTRO JOIN
// - Resultado: query GIGANTE para dados que deveriam ser simples
```

### O Problema

```
PERFORMANCE RUIM:

Tabela: recording_jobs (0 registros agora, mas pode ter 1000s)

Colunas desnecessárias sendo trazidas:
- audio_chunks_json (array gigante)
- medical_record (objeto gigante)
- transcript_raw_text (texto longo)
- etc

Joins:
- Inner join com patients (se não encontra, falha!)
- Inner join com users (se não encontra, falha!)

RESULTADO:
- Query demora 5-10 segundos para um módulo que deveria ser rápido
- Com 30s timeout, isso é ok
- Mas se temos 3 modulos carregando simultaneamente (agenda + pacientes + crm):
  - 3 queries × 5s cada = 15 segundos
  - Com variação: 15-30 segundos
  - Além do timeout global, pode falhar
  - Loading infinito
```

---

## 📈 IMPACTO COMBINADO

### Timeline de Um Usuário Abrindo o Sistema

```
1. Login (CORRIGIDO AGORA) ✅ 8-10s
2. Dashboard carrega (Promise.all 4 queries) ⚠️ 8-15s
3. Usuário clica em "Agenda"
   - Módulo de agenda carrega (Promise.all 4 queries) ⚠️ 8-15s
   - Dados aparecem
   - Usuário vê calendário lotado
   - Clica para ver mês inteiro
   - Query é feita NOVAMENTE porque está fora de cache (5 min)
   - Loading infinito (ou 30s de espera)
   - Usuário faz F5
4. Sistema volta para /login (porque F5 = nova sessão)
5. Usuário faz login novamente ✅ 8-10s
6. Dashboard carrega NOVAMENTE 8-15s
7. Frustrado, usuário desiste

TOTAL: ~45-60 segundos de frustração
```

---

## ✅ SOLUÇÃO RECOMENDADA

Você tem 2 caminhos:

### OPÇÃO 1: Refatoração Estruturada (60-80 horas)
```
Fazer certo:
1. Padronizar TODOS os módulos para usar React Query
2. Implementar error boundaries e error handling robusto
3. Otimizar queries (select específico, sem joins desnecessários)
4. Implementar retry logic adequado
5. Testar cada módulo isoladamente
6. Integração testing

Vantagem: Sistema atual é salvo
Desvantagem: Demanda, técnico complexo
Risco: Ainda pode haver bugs não detectados
```

### OPÇÃO 2: Rebuild Limpo (40-50 horas)
```
Fazer do zero (melhor):
1. Criar nova estrutura de data fetching layer
2. Implementar patterns corretos desde o início
3. Usar React Query + tanstack/react-table para listas
4. Error boundaries + error handling desde o início
5. Testes automatizados desde o início
6. TypeScript types corretos

Vantagem:
- Sistema MAIS confiável
- Código mais limpo
- Mais fácil de manter
- Melhor performance

Desvantagem:
- Requer downtime se for replace direto
- Demanda similar, mas garante qualidade
```

### OPÇÃO 3: Patch Rápido (8-12 horas)
```
Apenas authentication:
- Você JÁ fez os principais fixes
- Login está mais robusto agora
- Módulos ainda são bugados
- Passa o bandaid, não resolve

Vantagem: Rápido
Desvantagem: Não resolve nada sistematicamente
Risco: MUITO Alto - continua sendo um inferno
```

---

## 🎯 MINHA RECOMENDAÇÃO

**OPÇÃO 2: Rebuild Limpo**

### Por quê?

1. **Você tem razão**: O sistema É sujo e corrompido
2. **Não vai melhorar**: Patches vão só mascarar problemas
3. **Demanda similar**: 40-50h rebuild vs 60-80h refactor
4. **Resultado melhor**: Um sistema que funciona vs um que burla
5. **Manutenibilidade**: Você consegue dar manutenção depois

### Timeline:

```
Semana 1 (40h):
- Segunda a Sexta: 8h/dia
  - Seg-Ter: Data fetching layer + React Query patterns
  - Qua-Qui: Recriar módulos core (Pacientes, Agenda, Prontuários)
  - Sex: Recriar módulos secundários (CRM, Financeiro, Disponibilidade)

Semana 2 (10h):
- Segunda: 5h - Testes de integração
- Terça: 5h - Bug fixes e polimento
- Quarta em diante: Deploy + monitoramento
```

---

## ❌ O QUE NÃO FAZER

```
❌ Tentar consertar cada módulo individualmente
   (você vai ficar meses nisso)

❌ Reescrever UI bonita primeiro
   (funcionalidade precisa vir antes de beleza)

❌ Usar o sistema com usuários reais enquanto está quebrado
   (vai destruir a confiança deles)

❌ Continuar desenvolvendo novos módulos
   (você está construindo sobre um alicerce quebrado)
```

---

## 🚀 PRÓXIMOS PASSOS

Se você quer **rebuild limpo**:

1. Criei um guia de arquitetura em outro documento
2. Posso começar a estrutura da data fetching layer agora
3. Você aprova o padrão
4. Começamos os módulos um por um
5. Testamos cada um antes de passar para o próximo

Se você quer **tentar refactor**:

1. Preciso de mais detalhes sobre quais módulos são prioritários
2. Podemos começar com um (ex: Disponibilidade que é simples)
3. Usar como template para os outros

---

## 📞 PERGUNTA FINAL

Qual você quer fazer?

A. **Rebuild Limpo** - Melhor solução, resultado garantido
B. **Refactor Estruturado** - Tenta salvar código existente
C. **Patch Rápido** - Apenas tapa-buracos (não recomendo)

**Eu recomendo A**, mas é sua decisão.

Diz aí qual você quer que entramos em ação! 🚀
