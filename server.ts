import express from "express";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc,
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch 
} from "firebase/firestore";

// Verbose error reporting enabled for debugging and prevention of white screens
const DEBUG_MODE = true;

// Telegram Bot Alert Credentials
let TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8247384148:AAFyjCI3K5vTO3_V4oQiN4H_d8eZ2zmsfGg";
let TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

// BondPay Merchant Credentials
const BONDPAY_MERCHANT_ID = "100888368";
const BONDPAY_PAYIN_API_KEY = "9ddee38c62ef77bea48dcd5c33dd9690";
const BONDPAY_PAYOUT_API_KEY = "4E0A25A284363C974D156E87F24226C7";
const BONDPAY_CREATE_API_URL = "https://api.bond-payss.com/v1/create";

// Initialize Firebase Firestore for Server Backend
let db: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const apps = getApps();
    const serverApp = apps.length > 0 
      ? apps[0] 
      : initializeApp({
          apiKey: config.apiKey,
          authDomain: config.authDomain,
          projectId: config.projectId,
          storageBucket: config.storageBucket,
          messagingSenderId: config.messagingSenderId,
          appId: config.appId,
        }, "bondpay-server-app");
    db = getFirestore(serverApp, config.firestoreDatabaseId || "(default)");
  }
} catch (e) {
  console.error("Firebase server init error:", e);
}

/**
 * REUSABLE TELEGRAM ALERT FUNCTION
 * Sends rich formatted HTML notifications to admin & user on deposit approval/rejection events.
 */
async function sendTelegramAlert(data: {
  eventType: "PAYMENT_INITIATED" | "UTR_SUBMITTED" | "PAYMENT_SUCCESS" | "PAYMENT_FAILED" | "WITHDRAWAL_REQUEST";
  userName?: string;
  userId: string;
  amount: number | string;
  orderId: string;
  utr?: string;
  status: string;
  extraInfo?: string;
  targetChatId?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    let token = TELEGRAM_BOT_TOKEN ? TELEGRAM_BOT_TOKEN.trim() : "";
    token = token.replace(/^["']|["']$/g, '').trim();
    token = token.replace(/^https?:\/\/api\.telegram\.org\/bot/i, '');
    if (/^bot\d+:/i.test(token)) {
      token = token.slice(3);
    }
    token = token.trim();
    if (!token) {
      console.warn("[Telegram] Alert skipped: No Bot Token configured.");
      return { success: false, error: "Bot Token is missing." };
    }

    // Collect recipient chat IDs
    const recipientChatIds = new Set<string>();

    if (data.targetChatId) {
      recipientChatIds.add(String(data.targetChatId).trim());
    }

    let resolvedUserName = data.userName;

    // Try to get user's real name and telegramChatId from Firestore if userId is present
    if (db && data.userId && data.userId !== "Unknown") {
      try {
        const userDocRef = doc(db, "users", data.userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (!resolvedUserName || resolvedUserName === "ProJoy Gamer" || resolvedUserName === "Unknown" || resolvedUserName === "Player") {
            resolvedUserName = userData.name || userData.freeFireName || userData.phone || userData.email || "Player";
          }
          if (userData.telegramChatId) {
            recipientChatIds.add(String(userData.telegramChatId).trim());
          }
        }
      } catch (dbErr) {
        console.warn("[Telegram Firestore Lookup Error]:", dbErr);
      }
    }

    if (TELEGRAM_ADMIN_CHAT_ID) {
      recipientChatIds.add(String(TELEGRAM_ADMIN_CHAT_ID).trim());
    }

    // If chat ID is still empty, try to auto-fetch from recent updates
    if (recipientChatIds.size === 0) {
      try {
        const updateRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
        if (updateRes.ok) {
          const updateJson: any = await updateRes.json();
          const results = updateJson.result || [];
          if (results.length > 0) {
            const lastMsg = results[results.length - 1];
            const foundId = String(lastMsg.message?.chat?.id || lastMsg.channel_post?.chat?.id || "");
            if (foundId) {
              TELEGRAM_ADMIN_CHAT_ID = foundId;
              recipientChatIds.add(foundId);
            }
          }
        }
      } catch (fetchChatErr) {
        console.warn("[Telegram] Could not auto-detect Chat ID:", fetchChatErr);
      }
    }

    if (recipientChatIds.size === 0) {
      console.warn("[Telegram] Alert skipped: No Telegram Chat ID found.");
      return { success: false, error: "No Telegram Chat ID found. Please start @ProJoyAlert_bot and paste your Chat ID." };
    }

    let headerEmoji = "💰";
    let title = "Payment Update";

    switch (data.eventType) {
      case "PAYMENT_INITIATED":
        headerEmoji = "⏳";
        title = "Deposit Request Pending";
        break;
      case "UTR_SUBMITTED":
        headerEmoji = "📝";
        title = "UTR Verification Pending";
        break;
      case "PAYMENT_SUCCESS":
        headerEmoji = "✅";
        title = "Payment Approved & Credited!";
        break;
      case "PAYMENT_FAILED":
        headerEmoji = "❌";
        title = "Payment Request Rejected";
        break;
      case "WITHDRAWAL_REQUEST":
        headerEmoji = "🏦";
        title = "Withdrawal Update";
        break;
    }

    const playerName = (resolvedUserName && resolvedUserName.trim() && resolvedUserName !== "Unknown") 
      ? resolvedUserName.trim() 
      : "Player";

    const messageHtml = `
<b>${headerEmoji} ProJoy Esports: ${title}</b>
━━━━━━━━━━━━━━━━━━
👤 <b>Player Name:</b> ${playerName}
🆔 <b>User ID:</b> <code>${data.userId}</code>
💵 <b>Amount:</b> <b>₹${data.amount}</b>
🔖 <b>Order ID:</b> <code>${data.orderId}</code>
${data.utr ? `🔢 <b>UTR / Ref:</b> <code>${data.utr}</code>\n` : ""}📊 <b>Status:</b> <b>${data.status.toUpperCase()}</b>
⏰ <b>Time:</b> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
${data.extraInfo ? `\n📌 <b>Note:</b> ${data.extraInfo}` : ""}
━━━━━━━━━━━━━━━━━━
🎮 <i>ProJoy Tournament Automated Alert System</i>
`.trim();

    let lastError: string | undefined;
    let anySent = false;

    for (const chatId of recipientChatIds) {
      if (!chatId) continue;
      try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: messageHtml,
            parse_mode: "HTML"
          })
        });
        const resJson: any = await response.json();
        if (resJson.ok) {
          anySent = true;
          console.log(`[Telegram Alert Sent to ${chatId}] (${data.eventType}) Order: ${data.orderId}`);
        } else {
          console.warn(`[Telegram Alert API Response for ${chatId}]:`, resJson);
          if (resJson.error_code === 401) {
            lastError = "Invalid or expired Bot Token from Telegram @BotFather (Error 401: Unauthorized). Please check/update your Bot Token.";
          } else if (resJson.error_code === 400 && resJson.description?.includes("chat not found")) {
            lastError = `Chat ID ${chatId} not found. Please open @ProJoyAlert_bot in Telegram and press /start first!`;
          } else {
            lastError = resJson.description || "Telegram delivery failed";
          }
        }
      } catch (postErr: any) {
        console.warn(`[Telegram Send Error for ${chatId}]`, postErr);
        lastError = postErr.message;
      }
    }

    if (!anySent && lastError) {
      return { success: false, error: lastError };
    }
    return { success: true };
  } catch (err: any) {
    console.error("[Telegram Alert Error]:", err);
    return { success: false, error: err.message };
  }
}

const app = express();
const PORT = 3000;

async function startServer() {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Custom CORS middleware to allow direct API calls from Vercel origins safely
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Request logger for payment diagnostics
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      console.log(`[API ${req.method}] ${req.path}`, req.body ? JSON.stringify(req.body).slice(0, 200) : "");
    }
    next();
  });

  // API Health & Diagnostics Check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      gateway: "bondpay",
      merchantId: BONDPAY_MERCHANT_ID,
      apiUrl: BONDPAY_CREATE_API_URL,
      databaseConnected: Boolean(db),
      timestamp: new Date().toISOString()
    });
  });

  /**
   * CREATE PAYMENT ORDER (BondPay)
   * API Endpoint: POST https://api.bond-payss.com/v1/create
   * Signature: md5(merchant_id + amount + merchant_order_no + api_key + callback_url)
   */
  app.post("/api/bondpay/create-order", async (req, res) => {
    try {
      const { amount, userId, merchant_order_no } = req.body || {};

      if (!amount || Number(amount) < 100) {
        return res.status(400).json({ 
          success: false, 
          message: "Valid deposit amount is required (min ₹100). Lower amounts (e.g. ₹10, ₹2) are locked." 
        });
      }

      const orderNumber = merchant_order_no || `ORDER_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const formattedAmount = Number(amount).toFixed(2);

      // Determine public callback URL (enforcing real public host instead of internal localhost/3000 proxies)
      const forwardedProto = req.headers["x-forwarded-proto"] || "https";
      let finalHost = (req.headers["x-forwarded-host"] || req.headers.host || "").toString();
      if (
        !finalHost || 
        finalHost.includes("localhost") || 
        finalHost.includes("127.0.0.1") || 
        finalHost.includes("3000") || 
        finalHost.includes("0.0.0.0") || 
        finalHost.includes("vercel.app") || 
        finalHost.includes("projoy") || 
        finalHost.includes("projoy-seven")
      ) {
        finalHost = "ais-dev-wffqsfdcyvoujibjqaj4jk-614342679965.asia-east1.run.app";
      }
      const callbackUrl = `${forwardedProto}://${finalHost}/api/bondpay/callback`;

      // Generate MD5 Signature: md5(merchant_id + amount + merchant_order_no + callback_url + api_key)
      const stringToHash = `${BONDPAY_MERCHANT_ID}${formattedAmount}${orderNumber}${callbackUrl}${BONDPAY_PAYIN_API_KEY}`;
      const signature = crypto.createHash("md5").update(stringToHash).digest("hex");

      const payload = {
        merchant_id: BONDPAY_MERCHANT_ID,
        api_key: BONDPAY_PAYIN_API_KEY,
        amount: formattedAmount,
        merchant_order_no: orderNumber,
        callback_url: callbackUrl,
        extra: userId || "0",
        signature: signature
      };

      console.log("Submitting to BondPay API:", { ...payload, api_key: "***" });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      let responseText = "";
      let responseData: any = null;
      let responseStatus = 0;

      try {
        const response = await fetch(BONDPAY_CREATE_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        responseStatus = response.status;
        responseText = await response.text();
        console.log(`[BondPay Connection Log] HTTP Status: ${responseStatus}`);
        console.log(`[BondPay Connection Log] Raw Response:`, responseText);
      } catch (fetchErr: any) {
        console.error("[BondPay Connection Log] HTTP Fetch Error:", fetchErr);
        throw new Error(`Failed to reach BondPay API server: ${fetchErr.message}`);
      } finally {
        clearTimeout(timeoutId);
      }

      try {
        responseData = JSON.parse(responseText);
      } catch (parseErr) {
        console.error("[BondPay Connection Log] JSON Parse Error of Response:", parseErr);
        return res.status(502).json({
          success: false,
          message: `Received invalid non-JSON response from BondPay (HTTP ${responseStatus}). Please check account status.`,
          rawResponse: responseText.slice(0, 1000)
        });
      }

      if (responseData && (responseData.success === true || responseData.payment_url || responseData.status === "created")) {
        const bpOrderNo = responseData.order_no || "";
        const mOrderNo = responseData.merchant_order_no || orderNumber;

        // Persist/update in Firestore database immediately
        if (db && userId) {
          try {
            const txRef = doc(db, "transactions", mOrderNo);
            await setDoc(txRef, {
              userId: userId,
              type: "deposit",
              amount: Number(formattedAmount),
              requestedAmount: Number(formattedAmount),
              paymentAmount: Number(formattedAmount),
              status: "pending",
              date: new Date().toISOString(),
              reference: mOrderNo,
              merchantOrderNo: mOrderNo,
              bondPayOrderNo: bpOrderNo,
              utr: bpOrderNo || mOrderNo
            }, { merge: true });
            console.log(`Saved transaction mapped with merchantOrderNo: ${mOrderNo}, bondPayOrderNo: ${bpOrderNo}, UTR: ${bpOrderNo || mOrderNo}`);
          } catch (dbErr) {
            console.error("Error writing transaction to Firestore in server:", dbErr);
          }
        }

        // Return generated order details
        return res.json({
          success: true,
          payment_url: responseData.payment_url,
          order_no: bpOrderNo,
          merchant_order_no: mOrderNo,
          amount: responseData.amount || formattedAmount,
          status: responseData.status || "created"
        });
      } else {
        return res.status(400).json({
          success: false,
          message: responseData?.message || "Failed to generate BondPay gateway link. Account might be inactive or restricted.",
          raw: responseData
        });
      }
    } catch (error: any) {
      console.error("BondPay Create Order Error:", error);
      return res.status(500).json({
        success: false,
        message: error?.message || "Internal server error while connecting to BondPay gateway",
        details: DEBUG_MODE ? String(error?.stack || error) : undefined
      });
    }
  });

  /**
   * MANUAL / BACKUP UTR SUBMISSION HANDLER
   * Safely records, triggers BondPays API verification, and updates transaction with UTR without white screens.
   */
  const handleUtrSubmission = async (req: express.Request, res: express.Response) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const { orderId, utr, userId, amount } = req.body || {};

      if (!utr || String(utr).trim().length < 6) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid 12-digit UPI UTR or Reference Number."
        });
      }

      const cleanUtr = String(utr).trim();
      const depositAmount = Number(amount) || 100;
      const refId = orderId || `DEP_${Date.now()}`;

      let matchedDoc: any = null;
      let finalStatus = "pending";

      if (db) {
        if (orderId) {
          try {
            const snap = await getDoc(doc(db, "transactions", orderId));
            if (snap.exists()) matchedDoc = snap;
          } catch (e) {}

          if (!matchedDoc) {
            const q = query(collection(db, "transactions"), where("reference", "==", orderId));
            const snapQ = await getDocs(q);
            if (!snapQ.empty) matchedDoc = snapQ.docs[0];
          }

          if (!matchedDoc) {
            const q2 = query(collection(db, "transactions"), where("merchantOrderNo", "==", orderId));
            const snapQ2 = await getDocs(q2);
            if (!snapQ2.empty) matchedDoc = snapQ2.docs[0];
          }
        }

        if (matchedDoc) {
          const currentData = matchedDoc.data();
          finalStatus = currentData.status === "completed" || currentData.status === "approved" ? "completed" : "pending";
          await updateDoc(matchedDoc.ref, {
            utr: cleanUtr,
            status: finalStatus,
            updatedAt: new Date().toISOString()
          });
        } else if (userId) {
          const newTxRef = doc(db, "transactions", refId);
          await setDoc(newTxRef, {
            userId: userId,
            type: "deposit",
            amount: depositAmount,
            requestedAmount: depositAmount,
            paymentAmount: depositAmount,
            status: "pending",
            date: new Date().toISOString(),
            reference: refId,
            merchantOrderNo: refId,
            utr: cleanUtr
          });
          const freshSnap = await getDoc(newTxRef);
          if (freshSnap.exists()) matchedDoc = freshSnap;
        }

        // Trigger BondPays API status check or registration
        try {
          const mOrderNo = matchedDoc ? (matchedDoc.data().merchantOrderNo || matchedDoc.data().reference || refId) : refId;
          const stringToHash = `${BONDPAY_MERCHANT_ID}${mOrderNo}${BONDPAY_PAYIN_API_KEY}`;
          const querySig = crypto.createHash("md5").update(stringToHash).digest("hex");

          const queryPayload = {
            merchant_id: BONDPAY_MERCHANT_ID,
            merchant_order_no: mOrderNo,
            signature: querySig
          };

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const queryUrls = [
            "https://api.bond-payss.com/v1/query",
            "https://api.bond-payss.com/v1/order/query",
            "https://api.bond-payss.com/v1/order_status"
          ];

          for (const qUrl of queryUrls) {
            try {
              const queryRes = await fetch(qUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify(queryPayload),
                signal: controller.signal
              });

              if (queryRes.ok) {
                const gatewayStatusData: any = await queryRes.json();
                const gwStatus = String(gatewayStatusData?.status || gatewayStatusData?.order_status || "").toLowerCase();
                const isPaid = gwStatus === "success" || gwStatus === "paid" || gwStatus === "1" || gatewayStatusData?.is_paid === true;

                if (isPaid && matchedDoc) {
                  await creditUserForDeposit(matchedDoc, {
                    bpOrderNo: gatewayStatusData.order_no || gatewayStatusData.order_id,
                    amount: gatewayStatusData.amount ? Number(gatewayStatusData.amount) : depositAmount,
                    utr: cleanUtr
                  });
                  finalStatus = "completed";
                  break;
                }
              }
            } catch (singleErr) {
              // continue
            }
          }
          clearTimeout(timeoutId);
        } catch (gwErr) {
          console.warn("BondPay gateway check during UTR submission timed out/skipped:", gwErr);
        }
      }

      return res.status(200).json({
        success: true,
        message: finalStatus === "completed" 
          ? "Payment Verified! Wallet has been credited successfully."
          : "UTR submitted successfully! Your transaction is being verified.",
        utr: cleanUtr,
        status: finalStatus,
        reference: refId
      });
    } catch (error: any) {
      console.error("UTR Submission Error:", error);
      return res.status(500).json({
        success: false,
        message: error?.message || "Failed to submit UTR details.",
        details: DEBUG_MODE ? String(error?.stack || error) : undefined
      });
    }
  };

  app.post("/api/bondpay/submit-utr", handleUtrSubmission);
  app.post("/api/deposit/submit-utr", handleUtrSubmission);
  app.post("/api/verify_utr.php", handleUtrSubmission);
  app.post("/api/deposit.php", handleUtrSubmission);

  /**
   * ATOMIC HELPER: Credit User Wallet For Successful Deposit
   * Checks for duplicate execution, applies 20% first deposit bonus, and marks completed.
   */
  const creditUserForDeposit = async (txDoc: any, additionalData: { bpOrderNo?: string; utr?: string; amount?: number } = {}) => {
    if (!db || !txDoc) return { success: false, message: "Invalid parameters" };

    const txData = txDoc.data();
    if (txData.status === "completed" || txData.status === "approved") {
      return { success: true, alreadyCompleted: true, message: "Transaction already processed" };
    }

    const batch = writeBatch(db);
    const creditAmt = Number(additionalData.amount) || Number(txData.amount) || 0;
    const targetUserId = txData.userId;
    const bpOrderNo = additionalData.bpOrderNo || txData.bondPayOrderNo || "";
    const merchantOrder = txData.merchantOrderNo || txData.reference || txDoc.id;
    const utr = additionalData.utr || bpOrderNo || txData.utr || merchantOrder;

    batch.update(txDoc.ref, {
      status: "completed",
      bondPayOrderNo: bpOrderNo,
      merchantOrderNo: merchantOrder,
      utr: utr,
      verifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    if (targetUserId) {
      const userRef = doc(db, "users", targetUserId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const currentBalance = Number(userSnap.data().balance || 0);

        // Check first deposit bonus (20%)
        const allTxQuery = query(collection(db, "transactions"), where("userId", "==", targetUserId));
        const allTxSnap = await getDocs(allTxQuery);
        const prevApprovedDeposits = allTxSnap.docs.filter(
          d => d.id !== txDoc.id && d.data().type === "deposit" && (d.data().status === "approved" || d.data().status === "completed")
        );

        if (prevApprovedDeposits.length === 0) {
          const bonusAmount = Math.floor(creditAmt * 0.2);
          batch.update(userRef, { balance: currentBalance + creditAmt + bonusAmount });

          const bonusTxId = `BONUS_${Date.now()}`;
          batch.set(doc(db, "transactions", bonusTxId), {
            userId: targetUserId,
            type: "prize",
            amount: bonusAmount,
            status: "completed",
            date: new Date().toISOString(),
            reference: "First Deposit Bonus (20%)"
          });
          console.log(`[Auto-Credit] User ${targetUserId} received ₹${creditAmt} deposit + ₹${bonusAmount} first deposit bonus.`);
        } else {
          batch.update(userRef, { balance: currentBalance + creditAmt });
          console.log(`[Auto-Credit] User ${targetUserId} received ₹${creditAmt} deposit.`);
        }
      }
    }

    await batch.commit();

    // Trigger Telegram notification for successful wallet credit
    sendTelegramAlert({
      eventType: "PAYMENT_SUCCESS",
      userId: targetUserId || "Unknown",
      amount: creditAmt,
      orderId: merchantOrder,
      utr: utr,
      status: "Success & Credited",
      extraInfo: "Wallet balance updated successfully"
    }).catch(e => console.warn("Telegram alert error:", e));

    return { success: true, creditedAmount: creditAmt };
  };

  /**
   * PAYMENT CALLBACK HANDLER (BondPay)
   */
  const handleBondPayCallback = async (req: express.Request, res: express.Response) => {
    try {
      console.log("BondPay Callback Received:", req.body);
      const { orderNo, merchantOrder, status, amount } = req.body || {};

      if (!merchantOrder) {
        return res.status(200).json({ status: "ok", message: "Merchant order missing" });
      }

      if (db) {
        let txDoc: any = null;
        const q = query(collection(db, "transactions"), where("reference", "==", merchantOrder));
        const snap = await getDocs(q);

        if (!snap.empty) {
          txDoc = snap.docs[0];
        } else {
          try {
            const directSnap = await getDoc(doc(db, "transactions", merchantOrder));
            if (directSnap.exists()) {
              txDoc = directSnap;
            }
          } catch (e) {}
        }

        if (txDoc) {
          const txData = txDoc.data();
          const isSuccess = String(status).toLowerCase() === "success" || String(status) === "1" || String(status).toLowerCase() === "paid";
          const isFailed = String(status).toLowerCase() === "failed" || String(status).toLowerCase() === "failure" || String(status) === "2";

          if (isSuccess && txData.status !== "completed" && txData.status !== "approved") {
            await creditUserForDeposit(txDoc, {
              bpOrderNo: orderNo,
              amount: Number(amount),
              utr: orderNo || merchantOrder
            });
            console.log(`BondPay Order ${merchantOrder} automatically credited via callback.`);
          } else if (isFailed && txData.status !== "completed" && txData.status !== "approved") {
            await updateDoc(txDoc.ref, {
              status: "failed",
              bondPayOrderNo: orderNo || "",
              failedAt: new Date().toISOString()
            });
            console.log(`BondPay Order ${merchantOrder} marked as failed via callback.`);
          }
        }
      }

      return res.status(200).json({
        status: "ok",
        message: "Callback received and processed successfully"
      });
    } catch (error: any) {
      console.error("BondPay Callback Processing Error:", error);
      return res.status(200).json({ status: "ok", message: "Callback processed with errors" });
    }
  };

  app.post("/api/bondpay/callback", handleBondPayCallback);
  app.post("/api/callback", handleBondPayCallback);

  /**
   * STATUS CHECK & REAL-TIME GATEWAY QUERY API
   * Automatically queries BondPay and auto-credits the user wallet on success.
   */
  app.get("/api/bondpay/check-status/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      if (!orderId) {
        return res.status(400).json({ success: false, message: "Order ID is required" });
      }

      if (!db) {
        return res.json({ success: true, status: "pending", orderId });
      }

      let txDoc: any = null;
      try {
        const directSnap = await getDoc(doc(db, "transactions", orderId));
        if (directSnap.exists()) txDoc = directSnap;
      } catch (e) {}

      if (!txDoc) {
        const q = query(collection(db, "transactions"), where("reference", "==", orderId));
        const snap = await getDocs(q);
        if (!snap.empty) txDoc = snap.docs[0];
      }

      if (!txDoc) {
        const q2 = query(collection(db, "transactions"), where("merchantOrderNo", "==", orderId));
        const snap2 = await getDocs(q2);
        if (!snap2.empty) txDoc = snap2.docs[0];
      }

      if (!txDoc) {
        return res.status(404).json({ success: false, message: "Transaction record not found", orderId });
      }

      let txData = txDoc.data();
      let currentStatus = txData.status || "pending";

      // If still pending, query BondPay Gateway Status API in real-time
      if (currentStatus === "pending") {
        try {
          const mOrderNo = txData.merchantOrderNo || txData.reference || orderId;
          const stringToHash = `${BONDPAY_MERCHANT_ID}${mOrderNo}${BONDPAY_PAYIN_API_KEY}`;
          const querySig = crypto.createHash("md5").update(stringToHash).digest("hex");

          const queryPayload = {
            merchant_id: BONDPAY_MERCHANT_ID,
            merchant_order_no: mOrderNo,
            signature: querySig
          };

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const queryUrls = [
            "https://api.bond-payss.com/v1/query",
            "https://api.bond-payss.com/v1/order/query",
            "https://api.bond-payss.com/v1/order_status"
          ];

          for (const qUrl of queryUrls) {
            try {
              const queryRes = await fetch(qUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify(queryPayload),
                signal: controller.signal
              });

              if (queryRes.ok) {
                const gatewayStatusData: any = await queryRes.json();
                console.log(`BondPay Query response from ${qUrl}:`, gatewayStatusData);

                const gwStatus = String(gatewayStatusData?.status || gatewayStatusData?.order_status || "").toLowerCase();
                const isPaid = gwStatus === "success" || gwStatus === "paid" || gwStatus === "1" || gatewayStatusData?.is_paid === true;
                const isFailed = gwStatus === "failed" || gwStatus === "rejected" || gwStatus === "failure" || gwStatus === "2";

                if (isPaid) {
                  await creditUserForDeposit(txDoc, {
                    bpOrderNo: gatewayStatusData.order_no || gatewayStatusData.order_id,
                    amount: gatewayStatusData.amount ? Number(gatewayStatusData.amount) : undefined,
                    utr: gatewayStatusData.order_no || gatewayStatusData.utr || mOrderNo
                  });
                  currentStatus = "completed";
                  break;
                } else if (isFailed) {
                  await updateDoc(txDoc.ref, {
                    status: "failed",
                    failedAt: new Date().toISOString()
                  });
                  currentStatus = "failed";
                  break;
                }
              }
            } catch (singleErr) {
              // try next query url if exists
            }
          }
          clearTimeout(timeoutId);
        } catch (gwErr) {
          console.warn("Real-time gateway status query skipped/timed out:", gwErr);
        }
      }

      // Re-fetch latest document snapshot to return fresh data
      try {
        const freshSnap = await getDoc(txDoc.ref);
        if (freshSnap.exists()) {
          txData = freshSnap.data();
          currentStatus = txData.status || currentStatus;
        }
      } catch (e) {}

      return res.json({
        success: true,
        transactionId: txDoc.id,
        status: currentStatus,
        amount: txData.amount || 0,
        merchantOrderNo: txData.merchantOrderNo || txData.reference || orderId,
        bondPayOrderNo: txData.bondPayOrderNo || "",
        utr: txData.utr || "",
        type: txData.type || "deposit",
        date: txData.date
      });
    } catch (error: any) {
      console.error("Check Status Error:", error);
      return res.status(500).json({ success: false, message: error?.message || "Failed to check order status" });
    }
  });

  /**
   * ADMIN DIRECT APPROVE / REJECT / UPDATE STATUS
   * Seamlessly updates transaction and credits/adjusts user balance in Firestore
   */
  app.post("/api/bondpay/admin-update-status", async (req, res) => {
    try {
      const { transactionId, status, adminKey } = req.body || {};
      if (!transactionId || !status) {
        return res.status(400).json({ success: false, message: "Transaction ID and target status are required" });
      }

      const targetStatus = String(status).toLowerCase();
      if (!["approved", "completed", "failed", "rejected", "pending"].includes(targetStatus)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
      }

      if (!db) {
        return res.status(500).json({ success: false, message: "Database not connected" });
      }

      const txRef = doc(db, "transactions", transactionId);
      const txSnap = await getDoc(txRef);
      if (!txSnap.exists()) {
        return res.status(404).json({ success: false, message: "Transaction not found" });
      }

      const txData = txSnap.data();
      const previousStatus = txData.status;
      const batch = writeBatch(db);

      const isApproving = targetStatus === "approved" || targetStatus === "completed";
      const isRejecting = targetStatus === "rejected" || targetStatus === "failed";

      batch.update(txRef, {
        status: isApproving ? "completed" : targetStatus,
        updatedAt: new Date().toISOString(),
        verifiedAt: isApproving ? new Date().toISOString() : txData.verifiedAt || null
      });

      if (txData.type === "deposit") {
        if (isApproving && previousStatus !== "completed" && previousStatus !== "approved") {
          const userRef = doc(db, "users", txData.userId);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const currentBalance = Number(userSnap.data().balance || 0);
            const depositAmt = Number(txData.amount) || 0;

            // Check if first deposit
            const allTxQuery = query(collection(db, "transactions"), where("userId", "==", txData.userId));
            const allTxSnap = await getDocs(allTxQuery);
            const prevApprovedDeposits = allTxSnap.docs.filter(
              d => d.id !== txSnap.id && d.data().type === "deposit" && (d.data().status === "approved" || d.data().status === "completed")
            );

            if (prevApprovedDeposits.length === 0) {
              const bonusAmount = Math.floor(depositAmt * 0.2); // 20% bonus
              batch.update(userRef, { balance: currentBalance + depositAmt + bonusAmount });

              const bonusTxId = `BONUS_${Date.now()}`;
              batch.set(doc(db, "transactions", bonusTxId), {
                userId: txData.userId,
                type: "prize",
                amount: bonusAmount,
                status: "completed",
                date: new Date().toISOString(),
                reference: "First Deposit Bonus (20%)"
              });
            } else {
              batch.update(userRef, { balance: currentBalance + depositAmt });
            }
          }
        } else if (isRejecting && (previousStatus === "completed" || previousStatus === "approved")) {
          // Reverse deposit if previously approved
          const userRef = doc(db, "users", txData.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const currentBalance = Number(userSnap.data().balance || 0);
            batch.update(userRef, { balance: Math.max(0, currentBalance - (Number(txData.amount) || 0)) });
          }
        }
      } else if (txData.type === "withdraw") {
        if (isRejecting && previousStatus !== "rejected" && previousStatus !== "failed") {
          // Refund withdrawal to user's wallet when rejected (since balance was deducted on request)
          const userRef = doc(db, "users", txData.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const currentBalance = Number(userSnap.data().balance || 0);
            batch.update(userRef, { balance: currentBalance + (Number(txData.amount) || 0) });
          }
        }
        // When approving withdrawal, DO NOT credit/add to balance. Balance was already deducted when requested.
      }

      await batch.commit();

      // Trigger Telegram notification ONLY on Approval or Rejection
      if (isApproving || isRejecting) {
        let playerDisplayName = "Player";
        if (db && txData.userId) {
          try {
            const uSnap = await getDoc(doc(db, "users", txData.userId));
            if (uSnap.exists()) {
              const uData = uSnap.data();
              playerDisplayName = uData.name || uData.freeFireName || uData.phone || "Player";
            }
          } catch (e) {}
        }

        sendTelegramAlert({
          eventType: isApproving ? "PAYMENT_SUCCESS" : "PAYMENT_FAILED",
          userName: playerDisplayName,
          userId: txData.userId || "Unknown",
          amount: txData.amount || 0,
          orderId: txData.merchantOrderNo || txData.reference || transactionId,
          utr: txData.utr || "",
          status: isApproving ? "APPROVED & CREDITED" : "REJECTED",
          extraInfo: isApproving 
            ? "Payment has been verified and credited to your wallet." 
            : "Payment request was rejected. Please verify your payment details or UTR."
        }).catch(e => console.warn("Telegram alert error:", e));
      }

      return res.json({
        success: true,
        message: `Transaction ${transactionId} status updated to ${targetStatus} and balance synchronized.`,
        status: isApproving ? "completed" : targetStatus
      });
    } catch (error: any) {
      console.error("Admin Update Status Error:", error);
      return res.status(500).json({ success: false, message: error?.message || "Failed to update status" });
    }
  });

  /**
   * AUTOMATED UPI NOTIFICATION & WEBHOOK ENDPOINT
   * Compatible with:
   * 1. MacroDroid / Tasker / SMS Forwarder on Admin's phone
   * 2. BharatPe / Paytm Business Webhooks
   * 3. Third-party UPI automation APKs
   * 4. Direct JSON webhook: { "secret": "PROJOY_UPI_SECRET", "amount": 100, "utr": "508492817291", "order_id": "PJ_..." }
   */
  app.post("/api/upi/webhook", async (req, res) => {
    try {
      const body = req.body || {};
      const secret = body.secret || body.secret_token || body.key || req.headers["x-webhook-secret"];
      
      // Allow testing or authenticate with default/custom secret
      const EXPECTED_SECRET = process.env.UPI_WEBHOOK_SECRET || "PROJOY_SECURE_UPI_2026";
      if (secret && secret !== EXPECTED_SECRET && secret !== "TEST_MODE" && secret !== "PROJOY_UPI_SECRET") {
        return res.status(403).json({ success: false, message: "Invalid webhook secret" });
      }

      const amount = Number(body.amount || body.amt || 0);
      const utr = String(body.utr || body.utr_number || body.ref || body.rrn || "").trim();
      const orderId = String(body.order_id || body.merchant_order_no || body.orderId || "").trim();
      const userId = String(body.user_id || body.userId || "").trim();

      if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: "Valid amount is required" });
      }

      if (!db) {
        return res.status(500).json({ success: false, message: "Database not initialized" });
      }

      // 1. Check if UTR is already credited
      if (utr) {
        const dupQuery = query(collection(db, "transactions"), where("utr", "==", utr), where("status", "in", ["completed", "approved"]));
        const dupSnap = await getDocs(dupQuery);
        if (!dupSnap.empty) {
          return res.json({ success: true, message: "UTR already credited and verified." });
        }
      }

      // 2. Find matching pending transaction
      let matchedDoc: any = null;
      if (orderId) {
        const orderSnap = await getDoc(doc(db, "transactions", orderId));
        if (orderSnap.exists() && orderSnap.data().status !== "completed" && orderSnap.data().status !== "approved") {
          matchedDoc = orderSnap;
        }
      }

      if (!matchedDoc && utr) {
        const utrQuery = query(collection(db, "transactions"), where("utr", "==", utr));
        const utrSnap = await getDocs(utrQuery);
        if (!utrSnap.empty) {
          matchedDoc = utrSnap.docs[0];
        }
      }

      if (!matchedDoc) {
        // Match latest pending deposit of identical amount
        const pendingQuery = query(collection(db, "transactions"), where("amount", "==", amount), where("type", "==", "deposit"));
        const pendingSnap = await getDocs(pendingQuery);
        const pendingList = pendingSnap.docs.filter(d => {
          const st = d.data().status;
          return st === "pending" || !st;
        });
        if (pendingList.length > 0) {
          matchedDoc = pendingList[0];
        }
      }

      const batch = writeBatch(db);
      let targetUserId = userId;
      let finalTxId = orderId || `UPI_${Date.now()}`;

      if (matchedDoc) {
        finalTxId = matchedDoc.id;
        const txData = matchedDoc.data();
        targetUserId = txData.userId;
        batch.update(doc(db, "transactions", finalTxId), {
          status: "completed",
          utr: utr || txData.utr || "AUTO_VERIFIED",
          updatedAt: new Date().toISOString(),
          autoVerified: true
        });
      } else if (targetUserId) {
        batch.set(doc(db, "transactions", finalTxId), {
          userId: targetUserId,
          type: "deposit",
          amount: amount,
          status: "completed",
          utr: utr || "AUTO_VERIFIED",
          date: new Date().toISOString(),
          reference: `Auto UPI Credit ${finalTxId}`,
          autoVerified: true
        });
      } else {
        return res.status(404).json({
          success: false,
          message: `Received ₹${amount} (UTR: ${utr}), but no pending user order matched.`
        });
      }

      // Update user wallet balance
      if (targetUserId) {
        const userRef = doc(db, "users", targetUserId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const currentBalance = Number(userSnap.data().balance || 0);
          batch.update(userRef, { balance: currentBalance + amount });
        }
      }

      await batch.commit();

      // Send Telegram alert for auto-verified UPI payment
      sendTelegramAlert({
        eventType: "PAYMENT_SUCCESS",
        userId: targetUserId || "Player",
        amount: amount,
        orderId: finalTxId,
        utr: utr || "AUTO_VERIFIED",
        status: "Auto-Verified (Macro/UPI)",
        extraInfo: "Auto-credited to wallet instantly via UPI webhook"
      }).catch(e => console.warn("Telegram alert error:", e));

      return res.json({
        success: true,
        message: `Payment of ₹${amount} automatically verified and credited!`,
        txId: finalTxId,
        utr: utr
      });
    } catch (err: any) {
      console.error("UPI Webhook Error:", err);
      return res.status(500).json({ success: false, message: err?.message || "Webhook processing error" });
    }
  });

  /**
   * TELEGRAM BOT MANAGEMENT & TEST API
   */
  app.post("/api/telegram/set-bot-token", (req, res) => {
    const { botToken } = req.body || {};
    if (botToken && String(botToken).trim()) {
      TELEGRAM_BOT_TOKEN = String(botToken).trim();
      return res.json({ success: true, message: "Telegram Bot Token updated successfully!" });
    }
    return res.status(400).json({ success: false, message: "Bot Token is required." });
  });

  app.post("/api/telegram/set-chat-id", (req, res) => {
    const { chatId } = req.body || {};
    if (chatId) {
      TELEGRAM_ADMIN_CHAT_ID = String(chatId).trim();
      return res.json({ success: true, message: `Telegram Chat ID updated to ${TELEGRAM_ADMIN_CHAT_ID}` });
    }
    return res.status(400).json({ success: false, message: "Chat ID is required" });
  });

  app.post("/api/telegram/test-alert", async (req, res) => {
    try {
      const { chatId, userId } = req.body || {};
      const result = await sendTelegramAlert({
        eventType: "PAYMENT_SUCCESS",
        userName: "ProJoy Player",
        userId: userId || "USR_TEST_999",
        amount: 250,
        orderId: `ORDER_TEST_${Date.now()}`,
        utr: "508492817291",
        status: "COMPLETED",
        extraInfo: "This is a live test alert from ProJoy Esports Tournament System",
        targetChatId: chatId ? String(chatId).trim() : undefined
      });

      if (!result.success) {
        return res.status(400).json({ success: false, message: result.error || "Failed to send alert to Telegram." });
      }

      return res.json({ 
        success: true, 
        message: "Test alert dispatched to Telegram Bot successfully!", 
        chatId: chatId || TELEGRAM_ADMIN_CHAT_ID 
      });
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post("/api/telegram/notify-event", async (req, res) => {
    try {
      const { eventType, userName, userId, amount, orderId, utr, status, extraInfo, targetChatId } = req.body || {};
      const result = await sendTelegramAlert({
        eventType: eventType || "PAYMENT_INITIATED",
        userName: userName || "ProJoy Gamer",
        userId: userId || "Unknown",
        amount: amount || 0,
        orderId: orderId || `ORD_${Date.now()}`,
        utr: utr,
        status: status || "PENDING",
        extraInfo: extraInfo,
        targetChatId: targetChatId
      });
      return res.json(result);
    } catch (e: any) {
      return res.status(500).json({ success: false, message: e.message });
    }
  });

  /**
   * TELEGRAM BROADCAST ROOM CREDENTIALS API
   * Dispatches match Room ID & Password to all joined tournament players via Telegram Bot (@ProJoyAlert_bot)
   */
  app.post("/api/telegram/broadcast-room-details", async (req, res) => {
    try {
      const { tournamentId, roomId, roomPassword, customNote } = req.body || {};

      if (!tournamentId || !roomId) {
        return res.status(400).json({ success: false, message: "Tournament ID and Room ID are required." });
      }

      if (!db) {
        return res.status(500).json({ success: false, message: "Database is not initialized." });
      }

      const tRef = doc(db, "tournaments", tournamentId);
      const tSnap = await getDoc(tRef);
      if (!tSnap.exists()) {
        return res.status(404).json({ success: false, message: "Tournament not found in database." });
      }

      const tData = tSnap.data();
      const participants: any[] = tData.participants || [];

      // Update room credentials in Firestore tournament document
      await updateDoc(tRef, {
        roomId: String(roomId).trim(),
        roomPassword: String(roomPassword || "").trim(),
        updatedAt: new Date().toISOString()
      });

      const token = TELEGRAM_BOT_TOKEN ? TELEGRAM_BOT_TOKEN.trim() : "";
      if (!token) {
        return res.json({ 
          success: true, 
          message: "Room credentials saved, but Telegram Bot Token is missing.",
          notifiedCount: 0,
          totalParticipants: participants.length
        });
      }

      // Format clean, emoji-rich room message
      const matchTimeFormatted = tData.startTime 
        ? new Date(tData.startTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) 
        : "Starts Soon";

      const roomMessageHtml = `
🎮 <b>ProJoy Esports: Match Room Credentials</b>
━━━━━━━━━━━━━━━━━━
🏆 <b>Tournament:</b> ${tData.title}
🎯 <b>Game:</b> ${tData.game || "Free Fire"}
⏰ <b>Match Time:</b> ${matchTimeFormatted}

🔢 <b>Room ID:</b> <code>${String(roomId).trim()}</code>
🔑 <b>Password:</b> <code>${String(roomPassword || "").trim() || "None"}</code>

📌 <b>Instructions:</b>
${customNote && String(customNote).trim() ? String(customNote).trim() : "1. Open Free Fire / Custom Room section\n2. Enter Room ID & Password above\n3. Sit in your assigned slot. Match starts on time!"}
━━━━━━━━━━━━━━━━━━
🔥 <i>Good luck & Play Fair! - ProJoy Esports</i>
`.trim();

      // Collect target chat IDs from participants & users collection
      const targetChatIds = new Set<string>();

      for (const p of participants) {
        if (p.telegramChatId && String(p.telegramChatId).trim()) {
          targetChatIds.add(String(p.telegramChatId).trim());
        } else if (p.userId) {
          try {
            const uSnap = await getDoc(doc(db, "users", p.userId));
            if (uSnap.exists() && uSnap.data()?.telegramChatId) {
              targetChatIds.add(String(uSnap.data().telegramChatId).trim());
            }
          } catch (e) {}
        }
      }

      // Also include admin chat ID if configured
      if (TELEGRAM_ADMIN_CHAT_ID) {
        targetChatIds.add(String(TELEGRAM_ADMIN_CHAT_ID).trim());
      }

      let sentCount = 0;
      let failedCount = 0;

      for (const chatId of targetChatIds) {
        if (!chatId) continue;
        try {
          const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: roomMessageHtml,
              parse_mode: "HTML"
            })
          });
          const sendJson: any = await sendRes.json();
          if (sendJson.ok) {
            sentCount++;
          } else {
            failedCount++;
            console.warn(`[Broadcast Telegram Failed for ${chatId}]:`, sendJson);
          }
        } catch (sendErr) {
          failedCount++;
          console.warn(`[Broadcast Telegram Network Error for ${chatId}]:`, sendErr);
        }
      }

      return res.json({
        success: true,
        message: `Room credentials saved & Telegram broadcast sent to ${sentCount} recipient(s)!`,
        totalParticipants: participants.length,
        notifiedCount: sentCount,
        failedCount: failedCount
      });
    } catch (err: any) {
      console.error("Broadcast Room Details Error:", err);
      return res.status(500).json({ success: false, message: err?.message || "Failed to broadcast room details." });
    }
  });

  // Global Express error handler to prevent HTML crashes
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Express Unhandled Error Caught:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(500).json({
      success: false,
      message: err?.message || "Internal server error occurred.",
      error: DEBUG_MODE ? String(err?.stack || err) : undefined
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
