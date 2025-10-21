#!/bin/bash

# Comando curl para testar callback do n8n
# Substitua os valores conforme necessário

curl -X POST http://localhost:3000/api/n8n/callback \
  -H "Content-Type: application/json" \
  -d '{
    "recording_job_id": "SUBSTITUA_PELO_ID_DO_RECORDING_JOB",
    "patient_id": "SUBSTITUA_PELO_ID_DO_PACIENTE", 
    "therapist_id": "SUBSTITUA_PELO_ID_DO_TERAPEUTA",
    "texto_transcricao_bruta": "Esta é uma transcrição bruta de exemplo da consulta médica. O paciente relatou dores de cabeça frequentes e dificuldade para dormir. Durante a sessão, discutimos estratégias de relaxamento e técnicas de respiração.",
    "texto_rascunho": "Paciente apresenta queixas de cefaleia e insônia. Foram abordadas técnicas de manejo de estresse e higiene do sono. Paciente demonstrou boa receptividade às orientações.",
    "structured_record": {
      "tipo": "soap",
      "titulo": "Consulta de Acompanhamento - Manejo de Estresse",
      "resumo_executivo": "Paciente com queixas de cefaleia e insônia. Abordadas técnicas de relaxamento e higiene do sono.",
      "palavras_chave": ["cefaleia", "insônia", "estresse", "relaxamento"],
      "conteudo": {
        "subjetivo": "Paciente relata dores de cabeça frequentes, principalmente no final do dia. Dificuldade para adormecer, acordando várias vezes durante a noite. Refere aumento do estresse no trabalho.",
        "objetivo": "Paciente apresenta-se orientado, colaborativo. Sinais vitais estáveis. Não apresenta sinais de alteração neurológica evidente.",
        "avaliacao": "Cefaleia tensional associada a estresse ocupacional. Distúrbio do sono secundário a ansiedade.",
        "plano": "1. Técnicas de relaxamento progressivo; 2. Higiene do sono; 3. Reavaliação em 2 semanas; 4. Considerar encaminhamento para neurologia se persistir."
      }
    }
  }'

# Exemplo para PowerShell (Windows):
# Invoke-RestMethod -Uri "http://localhost:3000/api/n8n/callback" -Method POST -ContentType "application/json" -Body @'
# {
#   "recording_job_id": "SUBSTITUA_PELO_ID_DO_RECORDING_JOB",
#   "patient_id": "SUBSTITUA_PELO_ID_DO_PACIENTE", 
#   "therapist_id": "SUBSTITUA_PELO_ID_DO_TERAPEUTA",
#   "texto_transcricao_bruta": "Esta é uma transcrição bruta de exemplo...",
#   "texto_rascunho": "Paciente apresenta queixas de cefaleia...",
#   "structured_record": {
#     "tipo": "soap",
#     "titulo": "Consulta de Acompanhamento - Manejo de Estresse",
#     "resumo_executivo": "Paciente com queixas de cefaleia e insônia...",
#     "palavras_chave": ["cefaleia", "insônia", "estresse", "relaxamento"],
#     "conteudo": {
#       "subjetivo": "Paciente relata dores de cabeça frequentes...",
#       "objetivo": "Paciente apresenta-se orientado, colaborativo...",
#       "avaliacao": "Cefaleia tensional associada a estresse ocupacional...",
#       "plano": "1. Técnicas de relaxamento progressivo..."
#     }
#   }
# }
# '@