/**
 * Google Calendar OAuth2 Client
 * Gerencia autenticação com refresh token da conta mestre
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

if (
  !process.env.GOOGLE_CLIENT_ID ||
  !process.env.GOOGLE_CLIENT_SECRET ||
  !process.env.GOOGLE_REFRESH_TOKEN
) {
  throw new Error(
    'Missing required Google OAuth2 env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN'
  );
}

let cachedAuth: OAuth2Client | null = null;

/**
 * Cria ou retorna instância cached do OAuth2Client
 * Usa refresh token da conta mestre do Google
 */
export function getGoogleAuth(): OAuth2Client {
  if (cachedAuth) {
    return cachedAuth;
  }

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  // Configurar com refresh token da conta mestre
  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  cachedAuth = auth;
  return auth;
}

/**
 * Força refresh do token de acesso
 * Útil se receber erro 401 Unauthorized
 */
export async function refreshAccessToken(): Promise<string> {
  try {
    const auth = getGoogleAuth();
    const { credentials } = await auth.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    return credentials.access_token;
  } catch (error) {
    console.error('Error refreshing Google access token:', error);
    throw new Error('Failed to refresh Google access token');
  }
}

/**
 * Retorna cliente Google Calendar v3 já autenticado
 */
export function getGoogleCalendar() {
  const auth = getGoogleAuth();
  return google.calendar({ version: 'v3', auth });
}

/**
 * Valida se uma agenda pertence à conta mestre (apenas para debug)
 * Em produção, confiamos que users.google_calendar_id é válido
 */
export async function validateCalendarAccess(
  calendarId: string
): Promise<boolean> {
  try {
    const calendar = getGoogleCalendar();
    const response = await calendar.calendars.get({ calendarId });
    return !!response.data.id;
  } catch (error: any) {
    if (error.code === 404) {
      return false; // Calendário não encontrado ou sem acesso
    }
    throw error;
  }
}
