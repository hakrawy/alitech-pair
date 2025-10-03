import express from "express"
import path from "path"
import { fileURLToPath } from "url"
import {
  makeWASocket,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(express.json())
app.use(express.static(path.join(__dirname, "public")))

app.post("/generate", async (req, res) => {
  try {
    const { phone } = req.body
    if (!phone) return res.status(400).json({ error: "Phone required" })

    const { state, saveCreds } = await useMultiFileAuthState(`sessions/${phone}`)
    const { version } = await fetchLatestBaileysVersion()
    
    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, console),
      },
      printQRInTerminal: false,
    })

    sock.ev.on("connection.update", (update) => {
      if (update.pairingCode) {
        return res.json({ pairingCode: update.pairingCode })
      }
    })

    sock.ev.on("creds.update", saveCreds)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: "Failed to generate" })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`))
