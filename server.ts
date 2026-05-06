import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";

// Initialize AI Clients
const chatAi = process.env.CHAT_GEMINI_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.CHAT_GEMINI_API_KEY }) 
  : (process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null);

const detectAi = process.env.DETECT_GEMINI_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.DETECT_GEMINI_API_KEY }) 
  : (process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null);

const plannerAi = process.env.PLANNER_GEMINI_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.PLANNER_GEMINI_API_KEY }) 
  : (process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null);

// In-memory databases for demo purposes
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
    name: "123",
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
    owner: "arm Đà Lạt 01.",
    phone: "0123xxx",
    createdAt: new Date().toISOString(),
    environment: { temperature: 25, humidity: 70, light: "Vừa" },
    devices: [
      { id: "d1", name: "Bơm sương", type: "pump", status: false },
    ]
  }
];

let chats = [
  { id: 1, sender: "Trợ lý AI", text: "Chào mừng bạn đến với hệ thống Nông Trại Thông Minh! Tôi có thể giúp gì cho bạn hôm nay (hỏi về thời tiết, sâu bệnh, hay cách chăm sóc cây)?", time: new Date(Date.now() - 86400000).toISOString() },
  { id: 2, sender: "Hệ thống", text: "Các cảm biến ở Vườn Sầu Riêng đã được đồng bộ lúc 07:00 AM.", time: new Date(Date.now() - 43200000).toISOString() },
  { id: 3, sender: "Nhóm Cộng Đồng [Kỹ Sư Nông Nghiệp Tự Động]", text: "Xin chào mọi người! Tuần sau sẽ có workshop trực tuyến về tối ưu hóa hệ thống nhỏ giọt, ai quan tâm comment nhé.", time: new Date(Date.now() - 21600000).toISOString() },
  { id: 4, sender: "Cảnh báo tự động", text: "⚠️ Nhiệt độ tại khu vực 2 đang vượt ngưỡng 35 độ C. Hệ thống phun sương đã được kích hoạt.", time: new Date(Date.now() - 10800000).toISOString() },
  { id: 5, sender: "Trợ lý AI", text: "Theo dự báo thời tiết chiều nay có thể có mưa dông. Hãy kiểm tra lại hệ thống thoát nước nhé.", time: new Date(Date.now() - 3600000).toISOString() },
];

let posts = [
  { 
    id: 1, 
    author: "Cách để chữa bệnh trên lá của cây ngô", 
    initial: "C", 
    content: "Lá ngô bị đốm như hình, xin hỏi cách chữa ạ. Năm ngoái mình bị rụng lá nhiều quá, mong các bác kỹ sư cho lời khuyên trị dứt điểm đốm vàng này.", 
    time: new Date(Date.now() - 86400000).toISOString(),
    image: "https://i.imgur.com/Kz87B2E.jpeg",
    verified: true
  },
  { id: 2, author: "Anh Nông Dân", initial: "AN", content: "Mới thu hoạch vụ dưa lưới, năm nay năng suất khá tốt nhờ áp dụng tưới tiêu tự động! Ai cần mua hệ thống tưới ib mình hỗ trợ thiết kế rẻ nhất nhé, tiết kiệm nước tới 40%", time: new Date(Date.now() - 72000000).toISOString() },
  { id: 3, author: "Chị Hai", initial: "CH", content: "Ai có kinh nghiệm trị bọ trĩ trên xà lách chia sẻ mình với ạ. Mình trồng thủy canh nên không muốn dùng thuốc sâu hóa học.", time: new Date(Date.now() - 60000000).toISOString() },
  { id: 4, author: "Hợp tác xã nông sản sạch", initial: "HTX", content: "Cần tìm nguồn cung dâu tây số lượng lớn tại Đà Lạt, ưu tiên nông trại đã áp dụng chuẩn VietGAP, kí hợp đồng thu mua lâu dài. LH trực tiếp 090xxxx.", time: new Date(Date.now() - 40000000).toISOString(), verified: true },
  { id: 5, author: "Kỹ sư Trần V.", initial: "TV", content: "Chia sẻ bộ tài liệu tổng hợp về cách tính toán lượng phân bón dựa trên kết quả soil test (phân tích đất). Anh em nào cần thì lưu lại nhen. Bón đúng - bón trúng là quy tắc số 1.", time: new Date(Date.now() - 24000000).toISOString(), verified: true },
  { id: 6, author: "Nông trại hoa cúc vàng", initial: "NT", content: "Trời mưa liên tục mấy ngày nay mệt ghê. Độ ẩm lên quá cao. May có AI giám sát và bật quạt thông gió kịp thời không thì cũng mệt với cái nấm mốc.", time: new Date(Date.now() - 14400000).toISOString() },
  { id: 7, author: "Cậu Ba", initial: "CB", content: "Giá sầu riêng năm nay có vẻ ổn định định không các bác? Thấy lái báo giá liên tục mà phân vân chưa muốn cắt sơm.", time: new Date(Date.now() - 7200000).toISOString() },
  { id: 8, author: "Phạm T.", initial: "PT", content: "Hỏi ngu các bác tí, đất đỏ bazan Tây Nguyên trồng mắc ca thì mật độ sao là hợp lý nhất ạ? Có nên trồng xen sầu riêng không?", time: new Date(Date.now() - 3600000).toISOString() },
];

let products = [
  { id: 1, name: "Dừa Bến Tre", price: 170000, oldPrice: 15.99, image: "https://i.imgur.com/gK2x35x.jpeg", location: "Tp. Bến Tre", description: "Dừa Bến Tre từ lâu đã trở thành biểu tượng đặc trưng của vùng đất xứ dừa miền Tây..." },
  { id: 2, name: "Cao Su giống chuẩn", price: 45000, oldPrice: 15.99, image: "https://i.imgur.com/W29F6jT.jpeg", location: "TP. Tây Ninh", description: "Cây cao su (Hevea brasiliensis) là cây công nghiệp dài ngày, có nguồn gốc từ Nam Mỹ..." },
  { id: 3, name: "Hạt Điều rang muối", price: 450000, oldPrice: 15.99, image: "https://i.imgur.com/L1n7r1Q.jpeg", location: "Bình Phước", description: "Hạt điều là một trong những nông sản xuất khẩu chủ lực của Việt Nam..." },
  { id: 4, name: "Cà Phê nguyên chất", price: 120000, oldPrice: 15.99, image: "https://i.imgur.com/R38G2rJ.jpeg", location: "Buôn Ma Thuột", description: "Cà phê sạch, nguyên chất, rang mộc 100%..." },
  { id: 5, name: "Cảm Biến Độ Ẩm Đất Thông Minh IoT", price: 350000, oldPrice: 450.00, image: "https://i.imgur.com/pV1HsO3.png", location: "Quận 1, TP HCM", description: "Kết nối trực tiếp qua Wifi, sử dụng chip ESP32 bền bỉ đo độ ẩm đất liên tục 24/7." },
  { id: 6, name: "Hệ Thống Phun Sương Mini Toàn Diện", price: 1200000, oldPrice: null, image: "", location: "Đà Lạt", description: "Bao gồm bơm, béc phun và bộ điều khiển hẹn giờ qua app. Thích hợp cho trồng lan và rau thủy canh." },
  { id: 7, name: "Phân bón NPK siêu kali", price: 210000, oldPrice: 250000, image: "", location: "Cần Thơ", description: "Giúp chắc hạt, to quả, tăng độ ngọt cho các dòng cây ăn trái. Đặc biệt phù hợp cho giai đoạn xiết trái." },
  { id: 8, name: "Máy bay không người lái phun thuốc", price: 150000000, oldPrice: 180000000, image: "", location: "Nội Bài, Hà Nội", description: "Máy bay nông nghiệp DJI thế hệ mới, dung tích lớn, radar tránh vật cản đa hướng." },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for image uploads
  app.use(express.json({ limit: '50mb' }));

  // API Routes - Farms
  app.get("/api/farms", (req, res) => {
    res.json(farms);
  });

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
    const { name, owner, phone, password } = req.body;
    if (!name || !owner || !phone || !password) {
      return res.status(400).json({ status: "1", msg: "Vui lòng điền đầy đủ thông tin" });
    }
    const newFarm: Farm = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      owner,
      phone,
      createdAt: new Date().toISOString(),
      environment: { temperature: 25, humidity: 60, light: "Bình thường" },
      devices: [
        { id: "d1", name: "Bơm tưới 1", type: "pump", status: false },
      ]
    };
    farms.push(newFarm);
    res.json({ status: "0", msg: "Thêm điền trang thành công!" });
  });

  app.delete("/api/farms/:id", (req, res) => {
    const { id } = req.params;
    farms = farms.filter(f => f.id !== id);
    res.json({ status: "0", msg: "Xóa thành công!" });
  });

  // API Routes - AI Assistant (Chat)
  app.post("/api/ai/assistant", async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text required" });
    if (!chatAi) return res.status(503).json({ error: "AI Assistant Service not configured (CHAT_GEMINI_API_KEY)" });

    try {
      const response = await chatAi.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          { role: "user", parts: [{ text: `Bạn là một trợ lý nông nghiệp thông minh. Hãy trả lời câu hỏi của nông dân một cách chuyên nghiệp và thực tế. Tin nhắn: ${text}` }] }
        ]
      });
      res.json({ text: response.text });
    } catch (err: any) {
      console.error("AI Assistant Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // API Routes - AI Diagnosis (Image Analysis)
  app.post("/api/ai/diagnosis", async (req, res) => {
    const { imageBase64, cropType, keywords } = req.body;
    if (!imageBase64 || !cropType) return res.status(400).json({ error: "Image and crop type required" });
    if (!detectAi) return res.status(503).json({ error: "AI Diagnosis Service not configured (DETECT_GEMINI_API_KEY)" });

    try {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const prompt = `Bạn là một chuyên gia nông nghiệp hàng đầu. Hãy chuẩn đoán bệnh cho ${cropType} trong hình ảnh này. 
[Dữ liệu tham khảo đặc thù cho loại cây này]: ${keywords || "Không có thông tin thêm"}. 
Hãy trả lời dưới dạng JSON: { "disease": "...", "accuracy": "...", "advice": "..." }.`;

      const response = await detectAi.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            parts: [
              { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
              { text: prompt }
            ]
          }
        ],
        config: { responseMimeType: "application/json" }
      });

      let text = response.text || "{}";
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      res.json(JSON.parse(text));
    } catch (err: any) {
      console.error("AI Diagnosis Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // API Routes - AI Planning
  app.post("/api/ai/plan", async (req, res) => {
    const { farmData } = req.body;
    if (!farmData) return res.status(400).json({ error: "Farm data required" });
    if (!plannerAi) return res.status(503).json({ error: "AI Planner Service not configured (PLANNER_GEMINI_API_KEY)" });

    try {
      const response = await plannerAi.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `Bạn là một chuyên gia lập kế hoạch nông nghiệp. 
        Dữ liệu về điền trang của tôi: ${JSON.stringify(farmData)}.
        Hãy lập một kế hoạch trồng trọt cực kỳ ngắn gọn (tối đa 5-7 câu) trong 30-90 ngày tới.
        Chỉ bao gồm các mốc chính: Lịch tưới, bón phân, thu hoạch.
        Hãy trả về kết quả dưới dạng Markdown súc tích, gạch đầu dòng rõ ràng.`,
      });
      res.json({ plan: response.text });
    } catch (err: any) {
      console.error("AI Plan Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // API Routes - Chat
  app.get("/api/chat", (req, res) => res.json(chats));

  app.post("/api/chat", async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });
    
    // Just store the message history in this demo server
    chats.push(message);
    res.json({ success: true });
  });

  // API Routes - Products
  app.get("/api/products", (req, res) => res.json(products));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Note: use express v5 routing if required, but v4 is installed (4.21.2)
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
