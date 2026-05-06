import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

function getModel(apiKey: string | undefined, modelName: string = "gemini-3-flash-preview") {
  if (!apiKey) return null;
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
}

// AI Models (initialized lazily)
const getChatModel = () => getModel(process.env.CHAT_GEMINI_API_KEY);
const getDetectModel = () => getModel(process.env.DETECT_GEMINI_API_KEY);
const getPlannerModel = () => getModel(process.env.PLANNER_GEMINI_API_KEY);

interface Farm {
  id: string;
  name: string;
  owner: string;
  phone: string;
  createdAt: string;
  environment: { temperature: number; humidity: number; light: string };
  devices: { id: string; name: string; type: string; status: boolean }[];
}

let farms: Farm[] = [
  {
    id: "123",
    name: "Farm 123",
    owner: "Quỳnh Anh",
    phone: "0987xxx",
    createdAt: new Date().toISOString(),
    environment: { temperature: 28, humidity: 65, light: "Tốt" },
    devices: [
      { id: "d1", name: "Bơm tưới 1", type: "pump", status: true },
      { id: "d2", name: "Đèn sưởi", type: "light", status: false },
    ]
  },
  {
    id: "456",
    name: "Vườn Sầu Riêng",
    owner: "Farm Đà Lạt 01",
    phone: "0123xxx",
    createdAt: new Date().toISOString(),
    environment: { temperature: 25, humidity: 70, light: "Vừa" },
    devices: [
      { id: "d1", name: "Bơm sương", type: "pump", status: false },
    ]
  }
];

let chats = [
  { id: 1, sender: "Trợ lý AI", text: "Chào mừng bạn đến with hệ thống Nông Trại Thông Minh! Tôi có thể giúp gì for you hôm nay?", time: new Date(Date.now() - 86400000).toISOString() },
];

let products = [
  { id: 1, name: "Dừa Bến Tre", price: 170000, oldPrice: 15.99, image: "https://i.imgur.com/gK2x35x.jpeg", location: "Tp. Bến Tre", description: "Dừa Bến Tre..." },
  { id: 2, name: "Cao Su giống chuẩn", price: 45000, oldPrice: 15.99, image: "https://i.imgur.com/W29F6jT.jpeg", location: "TP. Tây Ninh", description: "Cây cao su..." },
];

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get("/api/farms", (req, res) => res.json(farms));
app.get("/api/farms/:id", (req, res) => {
  const farm = farms.find(f => f.id === req.params.id);
  if (farm) res.json(farm);
  else res.status(404).json({ error: "Farm not found" });
});

app.post("/api/farms/:id/devices/:deviceId", (req, res) => {
  const farm = farms.find(f => f.id === req.params.id);
  if (farm) {
    const device = farm.devices.find(d => d.id === req.params.deviceId);
    if (device) {
      device.status = req.body.status;
      res.json({ success: true, device });
    } else res.status(404).json({ error: "Device not found" });
  } else res.status(404).json({ error: "Farm not found" });
});

app.post("/api/farms", (req, res) => {
  const { name, owner, phone } = req.body;
  const newFarm: Farm = {
    id: Math.random().toString(36).substring(2, 9),
    name: name || "Nông trại mới",
    owner: owner || "Chủ vườn",
    phone: phone || "0xxx",
    createdAt: new Date().toISOString(),
    environment: { temperature: 25, humidity: 60, light: "Bình thường" },
    devices: [{ id: "d1", name: "Bơm tưới 1", type: "pump", status: false }]
  };
  farms.push(newFarm);
  res.json({ status: "0", msg: "Thêm điền trang thành công!" });
});

app.post("/api/ai/assistant", async (req, res) => {
  const { text } = req.body;
  const model = getChatModel();
  if (!model) return res.status(503).json({ error: "AI Assistant Service missing API Key" });

  try {
    const result = await model.generateContent(`Bạn là một trợ lý nông nghiệp thông minh. Trả lời chuyên nghiệp: ${text}`);
    const response = await result.response;
    res.json({ text: response.text() });
  } catch (err: any) {
    console.error("AI Assistant Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/ai/diagnosis", async (req, res) => {
  const { imageBase64, cropType, keywords } = req.body;
  const model = getDetectModel();
  if (!model) return res.status(503).json({ error: "AI Diagnosis Service missing API Key" });

  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const prompt = `Chuẩn đoán bệnh for ${cropType}. Dữ liệu: ${keywords || "Không"}. Trả về JSON: { "disease": "...", "accuracy": "...", "advice": "..." }.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
    ]);
    const response = await result.response;
    let text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    res.json(JSON.parse(text));
  } catch (err: any) {
    console.error("AI Diagnosis Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/ai/plan", async (req, res) => {
  const { farmData } = req.body;
  const model = getPlannerModel();
  if (!model) return res.status(503).json({ error: "AI Planner Service missing API Key" });

  try {
    const result = await model.generateContent(`Lập kế hoạch nông nghiệp (5-7 câu Markdown): ${JSON.stringify(farmData)}`);
    const response = await result.response;
    res.json({ plan: response.text() });
  } catch (err: any) {
    console.error("AI Plan Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/chat", (req, res) => res.json(chats));
app.post("/api/chat", (req, res) => {
  chats.push(req.body.message);
  res.json({ success: true });
});
app.get("/api/products", (req, res) => res.json(products));
app.get("/api/test", (req, res) => res.json({ status: "ok" }));

app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
});

export default app;
