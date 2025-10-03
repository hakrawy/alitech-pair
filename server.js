import express from "express";
import makeWASocket, { useMultiFileAuthState, makeCacheableSignalKeyStore } from "@whiskeysockets/baileys";

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/code", async (req, res) => {
  const number = req.query.number;
  if (!number) return res.json({ code: "No number provided" });

  try {
    const { state, saveCreds } = await useMultiFileAuthState("./session");
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true
    });

    // اطلب pairing code
    const code = await sock.requestPairingCode(number);
    
    // هنا يرسل الكود نفسه كرسالة للواتساب
    await sock.sendMessage(number + "@s.whatsapp.net", { text: `🔑 Your Pairing Code: ${code}` });

    return res.json({ code });
  } catch (err) {
    console.error(err);
    return res.json({ code: "Error generating code" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
