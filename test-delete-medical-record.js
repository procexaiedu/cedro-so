require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Configuração Supabase:');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Definida' : 'Não definida');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDeleteMedicalRecord() {
  try {
    console.log('🔍 Testando delete de medical record...');
    
    // Primeiro, vamos listar todos os medical records
    const { data: records, error: listError } = await supabase
      .schema('cedro')
      .from('medical_records')
      .select('id, patient_id')
      .limit(5);
      
    if (listError) {
      console.error('❌ Erro ao listar medical records:', listError);
      return;
    }
    
    console.log('📋 Medical records encontrados:', records);
    
    if (records && records.length > 0) {
      const recordId = records[0].id;
      console.log(`🎯 Testando delete do record: ${recordId}`);
      
      // Verificar recording_jobs relacionados
      const { data: jobs, error: jobsError } = await supabase
        .schema('cedro')
        .from('recording_jobs')
        .select('id, record_id')
        .eq('record_id', recordId);
        
      if (jobsError) {
        console.error('❌ Erro ao verificar recording_jobs:', jobsError);
      } else {
        console.log('🔗 Recording jobs relacionados:', jobs);
      }
      
      // Tentar deletar
      const { error: deleteError } = await supabase
        .schema('cedro')
        .from('medical_records')
        .delete()
        .eq('id', recordId);
        
      if (deleteError) {
        console.error('❌ Erro ao deletar medical record:', {
          message: deleteError.message,
          details: deleteError.details,
          hint: deleteError.hint,
          code: deleteError.code
        });
      } else {
        console.log('✅ Medical record deletado com sucesso!');
      }
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

testDeleteMedicalRecord();