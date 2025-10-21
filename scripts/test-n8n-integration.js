/**
 * Script de teste para validar a integração N8N com o sistema Cedro
 * 
 * Este script testa o fluxo completo:
 * 1. Upload de áudio
 * 2. Disparo do processamento via n8n
 * 3. Callback e atualização dos dados
 */

const fs = require('fs');
const path = require('path');

// Configurações
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_AUDIO_PATH = path.join(__dirname, 'test-audio.mp3');

// Dados de teste
const testData = {
  patient_id: '123e4567-e89b-12d3-a456-426614174000',
  therapist_id: '123e4567-e89b-12d3-a456-426614174001',
  appointment_id: '123e4567-e89b-12d3-a456-426614174002',
  note_type: 'anamnesis'
};

/**
 * Cria um arquivo de áudio de teste simples
 */
function createTestAudioFile() {
  if (!fs.existsSync(TEST_AUDIO_PATH)) {
    console.log('⚠️  Arquivo de teste não encontrado. Criando arquivo de teste...');
    
    // Cria um arquivo MP3 vazio para teste (você deve substituir por um arquivo real)
    const testContent = Buffer.from('Test audio content - replace with real MP3');
    fs.writeFileSync(TEST_AUDIO_PATH, testContent);
    
    console.log('📁 Arquivo de teste criado em:', TEST_AUDIO_PATH);
    console.log('⚠️  IMPORTANTE: Substitua este arquivo por um MP3 real para testes completos');
  }
}

/**
 * Faz upload do arquivo de áudio
 */
async function uploadAudio() {
  console.log('📤 Iniciando upload de áudio...');
  
  try {
    const formData = new FormData();
    const audioBuffer = fs.readFileSync(TEST_AUDIO_PATH);
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mp3' });
    
    formData.append('audio', audioBlob, 'test-audio.mp3');
    formData.append('patient_id', testData.patient_id);
    formData.append('therapist_id', testData.therapist_id);
    formData.append('appointment_id', testData.appointment_id);
    formData.append('note_type', testData.note_type);
    
    const response = await fetch(`${BASE_URL}/api/audio/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ Upload concluído:', result);
    
    return result.recording_job_id;
    
  } catch (error) {
    console.error('❌ Erro no upload:', error);
    throw error;
  }
}

/**
 * Dispara o processamento via n8n
 */
async function triggerProcessing(recordingJobId) {
  console.log('🚀 Disparando processamento via n8n...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/audio/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recording_job_id: recordingJobId
      })
    });
    
    if (!response.ok) {
      throw new Error(`Processing failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ Processamento disparado:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Erro no processamento:', error);
    throw error;
  }
}

/**
 * Monitora o status do job
 */
async function monitorJobStatus(recordingJobId, maxAttempts = 30, intervalMs = 10000) {
  console.log('👀 Monitorando status do job...');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`${BASE_URL}/api/recording-jobs/${recordingJobId}`);
      
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }
      
      const job = await response.json();
      console.log(`📊 Tentativa ${attempt}/${maxAttempts} - Status: ${job.status}`);
      
      if (job.status === 'completed') {
        console.log('✅ Job concluído com sucesso!');
        console.log('📋 Detalhes:', {
          record_id: job.record_id,
          transcript_length: job.transcript_raw_text?.length || 0,
          medical_record: job.medical_record ? 'Criado' : 'Não criado'
        });
        return job;
      }
      
      if (job.status === 'error' || job.status === 'completed_with_errors') {
        console.error('❌ Job falhou:', job.error_message);
        return job;
      }
      
      // Aguarda antes da próxima verificação
      if (attempt < maxAttempts) {
        console.log(`⏳ Aguardando ${intervalMs/1000}s antes da próxima verificação...`);
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
      
    } catch (error) {
      console.error(`❌ Erro na verificação ${attempt}:`, error);
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
  
  throw new Error('Timeout: Job não foi concluído no tempo esperado');
}

/**
 * Testa o callback do n8n (simulação)
 */
async function testCallback(recordingJobId) {
  console.log('🔄 Testando callback do n8n...');
  
  const callbackData = {
    recording_job_id: recordingJobId,
    patient_id: testData.patient_id,
    therapist_id: testData.therapist_id,
    texto_transcricao_bruta: 'Esta é uma transcrição de teste do áudio processado.',
    texto_rascunho: 'Prontuário de teste gerado pelo sistema.',
    structured_record: {
      tipo: 'soap',
      titulo: 'Teleconsulta - Teste',
      conteudo: 'Conteúdo estruturado do prontuário de teste.',
      resumo_executivo: 'Resumo executivo do teste.',
      palavras_chave: ['teste', 'integração', 'n8n']
    }
  };
  
  try {
    const response = await fetch(`${BASE_URL}/api/n8n/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(callbackData)
    });
    
    if (!response.ok) {
      throw new Error(`Callback failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ Callback processado:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Erro no callback:', error);
    throw error;
  }
}

/**
 * Executa o teste completo
 */
async function runFullTest() {
  console.log('🧪 Iniciando teste completo da integração N8N...\n');
  
  try {
    // 1. Criar arquivo de teste
    createTestAudioFile();
    
    // 2. Upload de áudio
    const recordingJobId = await uploadAudio();
    console.log('');
    
    // 3. Disparar processamento
    await triggerProcessing(recordingJobId);
    console.log('');
    
    // 4. Monitorar status (apenas se n8n estiver configurado)
    if (process.env.N8N_WEBHOOK_URL) {
      await monitorJobStatus(recordingJobId);
    } else {
      console.log('⚠️  N8N_WEBHOOK_URL não configurado. Testando callback diretamente...');
      await testCallback(recordingJobId);
    }
    
    console.log('\n🎉 Teste completo concluído com sucesso!');
    
  } catch (error) {
    console.error('\n💥 Teste falhou:', error);
    process.exit(1);
  }
}

/**
 * Executa teste individual do callback
 */
async function testCallbackOnly() {
  console.log('🔄 Testando apenas o callback...\n');
  
  const mockJobId = '123e4567-e89b-12d3-a456-426614174999';
  
  try {
    await testCallback(mockJobId);
    console.log('\n✅ Teste de callback concluído!');
  } catch (error) {
    console.error('\n❌ Teste de callback falhou:', error);
    process.exit(1);
  }
}

// Execução baseada em argumentos
const command = process.argv[2];

switch (command) {
  case 'callback':
    testCallbackOnly();
    break;
  case 'full':
  default:
    runFullTest();
    break;
}

// Exporta funções para uso em outros scripts
module.exports = {
  uploadAudio,
  triggerProcessing,
  monitorJobStatus,
  testCallback,
  runFullTest
};