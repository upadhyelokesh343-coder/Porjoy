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

export const DEFAULT_TELEGRAM_BOT_TOKEN = "8247384148:AAFyjCI3K5vTO3_V4oQiN4H_d8eZ2zmsfGg";
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

export interface DepositNotificationData {
  userName?: string;
  userId: string;
  amount: number | string;
  paymentAmount?: number | string;
  orderId: string;
  utr?: string;
  status?: string;
  userChatId?: string;
  customBotToken?: string;
  extraNote?: string;
}

/**
 * Sends automated deposit notification to the user's linked Telegram chat.
 * Works seamlessly in Mobile Browsers, Android APK WebViews, and Desktop.
 */
export async function notifyTelegramDepositSubmitted(data: DepositNotificationData): Promise<TelegramResponse> {
  const token = sanitizeTelegramBotToken(data.customBotToken) || DEFAULT_TELEGRAM_BOT_TOKEN;
  const targetChatId = sanitizeTelegramChatId(data.userChatId);

  // If user has not linked Telegram, quietly skip
  if (!targetChatId) {
    return { success: false, message: 'User has no linked Telegram Chat ID' };
  }

  const timeStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const playerName = data.userName?.trim() || "Player";

  const messageHtml = `
🎮 <b>ProJoy Esports: Deposit Request Received!</b>
━━━━━━━━━━━━━━━━━━
👤 <b>Player Name:</b> ${playerName}
🆔 <b>User ID:</b> <code>${data.userId}</code>
💵 <b>Deposit Amount:</b> <b>₹${data.amount}</b>
${data.paymentAmount ? `💸 <b>Amount Paid:</b> <b>₹${data.paymentAmount}</b>\n` : ''}🔖 <b>Order ID:</b> <code>${data.orderId}</code>
${data.utr ? `🔢 <b>UTR / Ref:</b> <code>${data.utr}</code>\n` : ''}📊 <b>Status:</b> <b>PENDING (Verification in Progress)</b>
⏰ <b>Time:</b> ${timeStr}

📌 <b>Note:</b> <i>Aapka deposit request receive ho gaya hai. Verification ke baad wallet balance automatically add ho jayega.</i>
━━━━━━━━━━━━━━━━━━
⚡ <i>ProJoy Automated Alert System</i>
`.trim();

  // Also best-effort send to server backend for admin logging
  try {
    fetch('/api/telegram/notify-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'PAYMENT_INITIATED',
        userName: playerName,
        userId: data.userId,
        amount: data.amount,
        orderId: data.orderId,
        utr: data.utr,
        status: 'PENDING',
        targetChatId: targetChatId
      })
    }).catch(() => {});
  } catch (e) {}

  // Direct client HTTPS call to Telegram Bot API - works reliably inside APK WebViews!
  return sendTelegramMessage({
    botToken: token,
    chatId: targetChatId,
    text: messageHtml,
    parseMode: 'HTML'
  });
}

/**
 * Sends automated deposit approved & credited notification to user's Telegram
 */
export async function notifyTelegramDepositApproved(data: DepositNotificationData): Promise<TelegramResponse> {
  const token = sanitizeTelegramBotToken(data.customBotToken) || DEFAULT_TELEGRAM_BOT_TOKEN;
  const targetChatId = sanitizeTelegramChatId(data.userChatId);

  if (!targetChatId) {
    return { success: false, message: 'User has no linked Telegram Chat ID' };
  }

  const timeStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const playerName = data.userName?.trim() || "Player";

  const messageHtml = `
✅ <b>ProJoy Esports: Payment Approved & Credited!</b>
━━━━━━━━━━━━━━━━━━
👤 <b>Player Name:</b> ${playerName}
🆔 <b>User ID:</b> <code>${data.userId}</code>
💰 <b>Credited Amount:</b> <b>₹${data.amount}</b>
🔖 <b>Order ID:</b> <code>${data.orderId}</code>
${data.utr ? `🔢 <b>UTR / Ref:</b> <code>${data.utr}</code>\n` : ''}📊 <b>Status:</b> <b>COMPLETED</b>
⏰ <b>Time:</b> ${timeStr}

🎉 <i>Aapka wallet balance successfully update ho gaya hai. Ab aap tournament match join kar sakte hain!</i>
━━━━━━━━━━━━━━━━━━
⚡ <i>ProJoy Automated Alert System</i>
`.trim();

  return sendTelegramMessage({
    botToken: token,
    chatId: targetChatId,
    text: messageHtml,
    parseMode: 'HTML'
  });
}

export interface TournamentAnnouncementData {
  title: string;
  game: string;
  entryFee: number | string;
  prizePool: number | string;
  perKillPrize?: number | string;
  maxSlots: number | string;
  startTime?: string;
  banner?: string;
  prizeDistribution?: { rank: number; prize: number }[];
  type?: 'regular' | 'per_kill';
}

/**
 * Send photo with caption via Telegram Bot API
 * Automatically falls back to sendMessage if photo upload/URL fails.
 */
export async function sendTelegramPhoto(options: {
  botToken?: string;
  chatId: string | number;
  photoUrl: string;
  caption: string;
  parseMode?: 'HTML' | 'MarkdownV2';
  timeoutMs?: number;
}): Promise<TelegramResponse> {
  const token = sanitizeTelegramBotToken(options.botToken) || DEFAULT_TELEGRAM_BOT_TOKEN;
  const cleanChatId = sanitizeTelegramChatId(options.chatId);
  const { photoUrl, caption, parseMode = 'HTML', timeoutMs = 12000 } = options;

  if (!cleanChatId) return { success: false, message: 'Invalid Chat ID' };

  // If no photoUrl, directly send text message
  if (!photoUrl || !photoUrl.startsWith('http')) {
    return sendTelegramMessage({
      botToken: token,
      chatId: cleanChatId,
      text: caption,
      parseMode
    });
  }

  const endpoint = `https://api.telegram.org/bot${token}/sendPhoto`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload: any = {
      chat_id: cleanChatId,
      photo: photoUrl.trim(),
      caption: caption.trim()
    };
    if (parseMode) {
      payload.parse_mode = parseMode;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const resJson: any = await res.json().catch(() => null);

    if (res.ok && resJson && resJson.ok) {
      return { success: true, message: 'Photo sent successfully!', data: resJson.result };
    }

    // Fallback to text message on Telegram photo rejection
    console.warn('[Telegram sendPhoto failed, falling back to text]:', resJson?.description);
    return sendTelegramMessage({
      botToken: token,
      chatId: cleanChatId,
      text: caption,
      parseMode
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    return sendTelegramMessage({
      botToken: token,
      chatId: cleanChatId,
      text: caption,
      parseMode
    });
  }
}

/**
 * Broadcast tournament launch announcement to all registered players on Telegram
 */
export async function broadcastTournamentAnnouncement(
  tournament: TournamentAnnouncementData,
  recipientChatIds: string[]
): Promise<{ total: number; sent: number; failed: number }> {
  const token = DEFAULT_TELEGRAM_BOT_TOKEN;
  const uniqueChatIds = Array.from(new Set(
    recipientChatIds.map(id => sanitizeTelegramChatId(id)).filter(id => id.length > 0)
  ));

  if (uniqueChatIds.length === 0) {
    return { total: 0, sent: 0, failed: 0 };
  }

  // Format date nicely
  let formattedTime = "Coming Soon";
  if (tournament.startTime) {
    try {
      formattedTime = new Date(tournament.startTime).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short"
      });
    } catch (e) {
      formattedTime = tournament.startTime;
    }
  }

  // Format prize distribution ranks if regular tournament
  let prizeText = '';
  if (tournament.type !== 'per_kill' && tournament.prizeDistribution && tournament.prizeDistribution.length > 0) {
    const ranks = tournament.prizeDistribution.slice(0, 5).map(r => `• <b>Rank #${r.rank}:</b> ₹${r.prize}`).join('\n');
    prizeText = `\n🎁 <b>Prize Distribution:</b>\n${ranks}\n`;
  }

  const captionHtml = `
🔥 <b>NEW TOURNAMENT ANNOUNCED!</b> 🔥
━━━━━━━━━━━━━━━━━━━━
🏆 <b>${tournament.title}</b>
🎮 <b>Game:</b> ${tournament.game}
💰 <b>Entry Fee:</b> <b>₹${tournament.entryFee}</b>
🥇 <b>Prize Pool:</b> <b>₹${tournament.prizePool || 'Per Kill'}</b>
${tournament.perKillPrize ? `🎯 <b>Per Kill Prize:</b> <b>₹${tournament.perKillPrize}</b>\n` : ''}👥 <b>Total Slots:</b> ${tournament.maxSlots} Players
⏰ <b>Match Time:</b> ${formattedTime}
${prizeText}━━━━━━━━━━━━━━━━━━━━
⚡ <i>Slot jaldi book karein aur match jeet kar real cash jeetein!</i>
🎮 <b>ProJoy Esports App</b> me turant Join karein!
`.trim();

  // Photo URL (banner image or default high-res gaming banner)
  const defaultBanner = tournament.game.toLowerCase().includes('free fire')
    ? 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1200&auto=format&fit=crop'
    : 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop';

  const photo = tournament.banner && tournament.banner.trim().startsWith('http')
    ? tournament.banner.trim()
    : defaultBanner;

  let sent = 0;
  let failed = 0;

  for (const chatId of uniqueChatIds) {
    try {
      const res = await sendTelegramPhoto({
        botToken: token,
        chatId,
        photoUrl: photo,
        caption: captionHtml,
        parseMode: 'HTML'
      });
      if (res.success) {
        sent++;
      } else {
        failed++;
      }
    } catch (e) {
      failed++;
    }
  }

  return {
    total: uniqueChatIds.length,
    sent,
    failed
  };
}

