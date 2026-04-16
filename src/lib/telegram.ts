// =============================================================================
// TELEGRAM ALERT UTILITY
// Sends error notifications to Systems Manager via Telegram Bot
// =============================================================================

const TELEGRAM_BOT_TOKEN = '8222563681:AAFbpen6BjgMnviKAKOSGRibqpzYpd8Ggfk';
const TELEGRAM_CHAT_ID = '+50683598574';

export interface AlertMessage {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  deviceId?: string;
  timestamp?: string;
}

export async function sendTelegramAlert(alert: AlertMessage): Promise<boolean> {
  const timestamp = alert.timestamp || new Date().toISOString();
  const text = `
🚨 *CrystalPOS Alert*

*${alert.title}*
${alert.message}

${alert.deviceId ? `Device: \`${alert.deviceId}\`` : ''}
Time: ${new Date(timestamp).toLocaleString('America/Costa_Rica')}
  `.trim();

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'Markdown',
      }),
    });
    
    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error('Telegram alert failed:', error);
    return false;
  }
}

export async function logErrorAndAlert(
  errorType: string,
  errorMessage: string,
  deviceId?: string
): Promise<void> {
  console.error(`[${errorType}] ${errorMessage}`, deviceId);
  
  await sendTelegramAlert({
    type: 'error',
    title: errorType,
    message: errorMessage,
    deviceId,
  });
}