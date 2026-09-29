/**
 * Telegram Bot API Client & Validation Helper
 * Provides robust validation, sanitization, and delivery handling for Telegram Bot messages.
 */

export interface TelegramSendOptions {
  botToken: string;
  chatId: string | number;
  text: string;
  parseMode?: 'HTML' | 'MarkdownV2' | 'Markdown';
  timeoutMs?: number;
}

export interface TelegramResponse {
  success: boolean;
  message?: string;
  data?: any;
  errorCode?: number;
  description?: string;
}

export const DEFAULT_TELEGRAM_BOT_TOKEN = "8247384148:AAFxD--Im6ZVK4hCFCm5ByXPtVjch6SAolU";
export const DEFAULT_TELEGRAM_BOT_USERNAME = "ProJoyAlert_bot";

/**
 * Clean & sanitize Telegram Bot Token
 * Strips whitespace, 'bot' prefix, quotes, and full URL prefixes.
 */
export function sanitizeTelegramBotToken(rawToken?: string): string {
  if (!rawToken) return '';
  let token = String(rawToken).trim();
  // Strip enclosing quotes if user accidentally pasted them
  token = token.replace(/^["']|["']$/g, '').trim();
  // Strip full URL if user pasted "https://api.telegram.org/bot<token>"
  token = token.replace(/^https?:\/\/api\.telegram\.org\/bot/i, '');
  // Strip leading "bot" if user wrote "bot123456:ABC..."
  if (/^bot\d+:/i.test(token)) {
    token = token.slice(3);
  }
  return token.trim();
}

/**
 * Clean & sanitize Telegram Chat ID
 * Strips whitespace, quotes, and trailing unwanted symbols.
 */
export function sanitizeTelegramChatId(rawChatId?: string | number): string {
  if (rawChatId === undefined || rawChatId === null) return '';
  let chatId = String(rawChatId).trim();
  chatId = chatId.replace(/^["']|["']$/g, '').trim();
  return chatId;
}

/**
 * Validate Telegram Bot Token format: <bot_id>:<alphanumeric_secret>
 */
export function isValidTelegramBotToken(token: string): boolean {
  const clean = sanitizeTelegramBotToken(token);
  // Telegram bot tokens follow format: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ_1234567
  return /^\d{7,14}:[A-Za-z0-9_-]{30,}$/.test(clean);
}

/**
 * Validate Telegram Chat ID format (numeric or channel username with @)
 */
export function isValidTelegramChatId(chatId: string | number): boolean {
  const clean = sanitizeTelegramChatId(chatId);
  // Standard user chat IDs are numbers (positive for users, negative for groups/channels)
  // Public channels/supergroups can also be @channel_username
  return /^-?\d{5,18}$/.test(clean) || /^@[a-zA-Z0-9_]{4,32}$/.test(clean);
}

/**
 * Robust sendMessage implementation with timeout, entity error fallback, and clear error diagnostics.
 */
export async function sendTelegramMessage(options: TelegramSendOptions): Promise<TelegramResponse> {
  const { 
    botToken, 
    chatId, 
    text, 
    parseMode = 'HTML', 
    timeoutMs = 12000 
  } = options;

  const cleanToken = sanitizeTelegramBotToken(botToken);
  const cleanChatId = sanitizeTelegramChatId(chatId);

  // 1. Client-Side Input Validations
  if (!cleanToken) {
    return {
      success: false,
      message: 'Telegram Bot Token missing hai. Kripya valid token daalein.'
    };
  }

  if (!cleanChatId) {
    return {
      success: false,
      message: 'Telegram Chat ID missing hai. Kripya apni numeric Chat ID daalein.'
    };
  }

  if (!isValidTelegramBotToken(cleanToken)) {
    return {
      success: false,
      message: 'Bot Token ka format galat hai! @BotFather se mila token iss tarah hota hai: 123456789:AAFx...'
    };
  }

  if (!text || !text.trim()) {
    return {
      success: false,
      message: 'Message text empty nahi ho sakta.'
    };
  }

  const endpoint = `https://api.telegram.org/bot${cleanToken}/sendMessage`;

  // 2. AbortController for reliable timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload: any = {
      chat_id: cleanChatId,
      text: text.trim()
    };
    if (parseMode) {
      payload.parse_mode = parseMode;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const resJson: any = await response.json().catch(() => null);

    // 3. Success scenario
    if (response.ok && resJson && resJson.ok) {
      return {
        success: true,
        message: 'Message delivered successfully to Telegram!',
        data: resJson.result
      };
    }

    // 4. If parse_mode HTML caused entity parsing error, retry once as plain text
    if (
      resJson && 
      resJson.error_code === 400 && 
      typeof resJson.description === 'string' &&
      resJson.description.toLowerCase().includes("can't parse entities")
    ) {
      console.warn('[Telegram] HTML parsing failed, retrying as plain text...');
      const fallbackPayload = {
        chat_id: cleanChatId,
        text: text.replace(/<[^>]*>?/gm, '').trim() // Strip HTML tags
      };

      const fallbackResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fallbackPayload)
      });
      const fallbackJson: any = await fallbackResponse.json().catch(() => null);
      if (fallbackResponse.ok && fallbackJson && fallbackJson.ok) {
        return {
          success: true,
          message: 'Message delivered successfully (plain text fallback)!',
          data: fallbackJson.result
        };
      }
    }

    // 5. Friendly, actionable error translation based on Telegram error codes
    const errorCode = resJson?.error_code || response.status;
    const description = resJson?.description || 'Unknown Telegram API error';

    let userFriendlyMessage = description;

    if (errorCode === 401) {
      userFriendlyMessage = 'Invalid Bot Token (401 Unauthorized)! @BotFather se liya gaya token galat ya revoked hai.';
    } else if (errorCode === 400 && description.toLowerCase().includes('chat not found')) {
      userFriendlyMessage = `Chat ID ${cleanChatId} Telegram par mili nahi! Kripya pehle Telegram par apne Bot (@${DEFAULT_TELEGRAM_BOT_USERNAME}) ko open karein aur "/start" button dabayein.`;
    } else if (errorCode === 403) {
      userFriendlyMessage = 'Bot blocked (403 Forbidden)! User ne bot ko block kiya hua hai ya bot ko message bhejne ki permission nahi hai.';
    } else if (errorCode === 429) {
      userFriendlyMessage = 'Telegram Rate Limit (429)! Bahut saare messages bhej diye gaye hain, kripya kuch seconds baad try karein.';
    }

    return {
      success: false,
      errorCode,
      description,
      message: userFriendlyMessage
    };

  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      return {
        success: false,
        message: 'Telegram API connection timeout (12s)! Internet connection check karein ya thodi der baad try karein.'
      };
    }

    return {
      success: false,
      message: error?.message 
        ? `Connection Error: ${error.message}` 
        : 'Telegram server se connect nahi ho paya. Kripya internet ya bot token check karein.'
    };
  }
}
