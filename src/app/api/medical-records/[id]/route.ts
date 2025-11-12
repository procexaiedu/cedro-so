import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      console.error('DELETE medical-records: ID não fornecido')
      return NextResponse.json(
        { error: 'ID do registro é obrigatório' },
        { status: 400 }
      )
    }

    console.log('DELETE medical-records: Tentando deletar ID:', id)

    const supabase = createClient()

    // Primeiro, vamos verificar se o registro existe
    const { data: existingRecord, error: fetchError } = await supabase
      .schema('cedro')
      .from('medical_records')
      .select('id, patient_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar registro:', fetchError)
      return NextResponse.json(
        { error: 'Registro não encontrado', details: fetchError.message },
        { status: 404 }
      )
    }

    console.log('Registro encontrado:', existingRecord);

    // Verificar se há recording_jobs relacionados
     const { data: relatedJobs, error: jobsError } = await supabase
       .schema('cedro')
       .from('recording_jobs')
       .select('id')
       .eq('record_id', id);

    if (jobsError) {
      console.error('Erro ao verificar recording_jobs:', jobsError);
    } else {
      console.log('Recording jobs relacionados:', relatedJobs);
      
      if (relatedJobs && relatedJobs.length > 0) {
        console.log('Deletando recording_jobs relacionados primeiro...');
         const { error: deleteJobsError } = await supabase
           .schema('cedro')
           .from('recording_jobs')
           .delete()
           .eq('record_id', id);
          
        if (deleteJobsError) {
          console.error('Erro ao deletar recording_jobs:', deleteJobsError);
          return NextResponse.json(
            { 
              error: 'Erro ao deletar jobs relacionados',
              details: deleteJobsError.message
            },
            { status: 500 }
          );
        }
        console.log('Recording jobs deletados com sucesso');
      }
    }

    // Agora tentamos deletar o medical_record
      const { error } = await supabase
        .schema('cedro')
        .from('medical_records')
        .delete()
        .eq('id', id);

    if (error) {
      console.error('Erro detalhado ao deletar prontuário:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { 
          error: 'Erro ao deletar prontuário',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      )
    }

    console.log('Prontuário deletado com sucesso:', id)
    return NextResponse.json(
      { message: 'Prontuário deletado com sucesso' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erro interno completo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}