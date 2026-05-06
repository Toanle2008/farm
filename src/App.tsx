import React, { useState, useEffect, useRef } from "react";
import { 
  Menu, X, MessageSquare, Users, ShoppingCart, LayoutDashboard, 
  PlusCircle, Palette, Download, CloudSun, User, Lock, MoreHorizontal, ArrowRightCircle, Upload, Search, Activity, RotateCcw, MapPin, PhoneCall, ShieldCheck, Sun, Moon, Settings, Cpu, Send, FileText
} from "lucide-react";
import Swal from "sweetalert2";
import Markdown from "react-markdown";
import { cn } from "./lib/utils";
import { Routes, Route, Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp 
} from "firebase/firestore";
import { db } from "./lib/firebase";

interface Farm {
  id: string;
  name: string;
  owner: string;
  phone: string;
  createdAt: string;
  environment?: {
    temperature: number;
    humidity: number;
    light: string;
  };
  devices?: any[];
  grid?: Record<string, string>;
}

// Global Error Handler for Firestore
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

function Sidebar({ isOpen, setOpen }: { isOpen: boolean, setOpen: (b: boolean) => void }) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const { selectedTool, setSelectedTool } = React.useContext(FarmContext);
  const { sidebarCaption, themeMode } = React.useContext(ThemeContext);

  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-[260px] border-r transition-transform duration-300 ease-in-out flex flex-col shadow-sm h-full",
        isOpen ? "translate-x-0" : "-translate-x-full",
        themeMode === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-primary-light"
      )}
    >
      <div className="flex justify-center items-center h-[90px] px-6 mt-4 mb-4">
        <Link to="/" className="block text-center" id="logo-link">
            <div className="flex items-center justify-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
                <LayoutDashboard size={24} id="logo-icon"/>
              </div>
              <span className={cn("text-xl font-bold tracking-tight", themeMode === 'dark' ? "text-white" : "text-[#111928]")}>
                Farm<span className="text-primary">Console</span>
              </span>
            </div>
        </Link>
        <button 
          className="ml-auto lg:hidden text-slate-400 hover:text-slate-600"
          onClick={() => setOpen(false)}
          id="close-sidebar-btn"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        <div>
          {sidebarCaption === 'show' && (
            <div className={cn("text-[13px] font-bold uppercase mb-4 px-4 flex items-center gap-2 tracking-wide", themeMode === 'dark' ? "text-slate-500" : "text-[#111928]")}>
              Menu Chính
            </div>
          )}
          <nav className="space-y-1">
            <Link to="/ai-assistant" className={cn("flex items-center gap-3 px-4 py-2.5 text-[15px] font-medium rounded-lg transition-colors border", isActive('/ai-assistant') ? "text-primary bg-primary/10 border-primary" : (themeMode === 'dark' ? "text-slate-400 border-transparent hover:bg-slate-800" : "text-[#364152] border-transparent hover:bg-slate-50"))} id="nav-ai">
              <Cpu size={20} className={isActive('/ai-assistant') ? "text-primary" : "text-slate-400"} />
              Trợ Lý AI
            </Link>
            <Link to="/chat" className={cn("flex items-center gap-3 px-4 py-2.5 text-[15px] font-medium rounded-lg transition-colors border", isActive('/chat') ? "text-primary bg-primary/10 border-primary" : (themeMode === 'dark' ? "text-slate-400 border-transparent hover:bg-slate-800" : "text-[#364152] border-transparent hover:bg-slate-50"))} id="nav-chat">
              <MessageSquare size={20} className={isActive('/chat') ? "text-primary" : "text-slate-400"} />
              Trò Chuyện
            </Link>
            <Link to="/forum" className={cn("flex items-center gap-3 px-4 py-2.5 text-[15px] font-medium rounded-lg transition-colors border", isActive('/forum') ? "text-primary bg-primary/10 border-primary" : (themeMode === 'dark' ? "text-slate-400 border-transparent hover:bg-slate-800" : "text-[#364152] border-transparent hover:bg-slate-50"))} id="nav-forum">
              <Users size={20} className={isActive('/forum') ? "text-primary" : "text-slate-400"} />
              Cộng Đồng
            </Link>
            <Link to="/store" className={cn("flex items-center gap-3 px-4 py-2.5 text-[15px] font-medium rounded-lg transition-colors border", isActive('/store') ? "text-primary bg-primary/10 border-primary" : (themeMode === 'dark' ? "text-slate-400 border-transparent hover:bg-slate-800" : "text-[#364152] border-transparent hover:bg-slate-50"))} id="nav-store">
              <ShoppingCart size={20} className={isActive('/store') ? "text-primary" : "text-slate-400"} />
              Gian Hàng
            </Link>
          </nav>
        </div>

        {location.pathname.includes('/farm/') && (
           <div id="drawing-tools">
             {sidebarCaption === 'show' && (
               <div className={cn("text-[13px] font-bold uppercase mb-3 px-4 flex items-center justify-between", themeMode === 'dark' ? "text-slate-500" : "text-[#111928]")}>
                  <span className="flex items-center gap-2">
                    <Palette size={16} className="text-slate-500" />
                    Công Cụ Vẽ
                  </span>
               </div>
             )}
             <nav className={cn("space-y-1", sidebarCaption === 'hide' ? "mt-4" : "")}>
                {['Ngô', 'Lúa', 'Khoai', 'Đậu', 'Nước', 'Đường Đi'].map(tool => (
                  <button 
                    key={tool} 
                    onClick={() => setSelectedTool(tool)}
                    className={cn("w-full flex items-center gap-3 px-4 py-2 text-[14.5px] font-medium rounded-lg transition-colors text-left group relative", selectedTool === tool ? "text-primary bg-primary/10" : (themeMode === 'dark' ? "text-slate-500 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-50"))}
                    id={`tool-${tool}`}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full transition-colors ml-2", selectedTool === tool ? "bg-primary" : "bg-slate-300 group-hover:bg-primary")}></span>
                    {tool}
                  </button>
                ))}
             </nav>
           </div>
        )}

        <div className="p-5 bg-primary rounded-2xl text-white relative overflow-hidden shadow-sm mt-8 border border-white/10" id="ai-card">
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/20 rounded-full blur-[1px] opacity-40"></div>
          <h4 className="font-bold mb-1.5 text-[15px] relative z-10 text-white">Chẩn Đoán AI</h4>
          <p className="text-[13px] text-white/90 mb-5 leading-relaxed font-medium relative z-10">Phát hiện sâu bệnh tự động</p>
          <Link to="/diagnosis" className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white text-primary text-[13px] rounded-xl hover:bg-gray-100 transition-all font-bold relative z-10 shadow-sm" id="diagnosis-link">
            Thử Ngay
            <ShieldCheck size={14} />
          </Link>
        </div>
      </div>
      <div className="p-4 text-center text-xs text-slate-400 font-medium pb-6 pt-2">
         Farm Console v2.0
      </div>
    </aside>
  );
}

// Weather service for Da Nang
const fetchDaNangWeather = async () => {
  try {
    // Using a more realistic mock or a public API if available, 
    // but here we simulate the data sync for Da Nang specifically.
    return {
      temp: 29 + Math.floor(Math.random() * 5),
      humidity: 70 + Math.floor(Math.random() * 10),
      desc: "Nắng ráo, mây rải rác",
      location: "Đà Nẵng, Việt Nam"
    };
  } catch (err) {
    return null;
  }
};

function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
  const { themeMode } = React.useContext(ThemeContext);
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    fetchDaNangWeather().then(setWeather);
  }, []);

  return (
    <header className={cn("h-[76px] flex items-center px-4 md:px-6 justify-between sticky top-0 z-40 border-b transition-colors", themeMode === 'dark' ? "bg-slate-900 border-slate-800 shadow-lg shadow-black/20" : "bg-white border-slate-200")}>
      <div className="flex items-center gap-4">
        <button 
          id="sidebar-toggle"
          className={cn("w-[42px] h-[42px] flex justify-center items-center rounded-xl transition-all shadow-sm border", themeMode === 'dark' ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white" : "text-[#673ab7] bg-[#ede7f6] border-fuchsia-100 hover:bg-[#673ab7] hover:text-white")}
          onClick={toggleSidebar}
        >
          <Menu size={20} />
        </button>
        {weather && (
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
            <CloudSun size={18} className="text-primary" />
            <div className="text-xs font-bold whitespace-nowrap">
              <span className="text-slate-400 mr-2">{weather.location}:</span>
              <span className={themeMode === 'dark' ? "text-white" : "text-slate-700"}>{weather.temp}°C - {weather.desc}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button id="weather-btn" onClick={() => Swal.fire('Thời Tiết Đà Nẵng', `Hôm nay tại Đà Nẵng: ${weather?.temp}°C, ${weather?.desc}. Độ ẩm ${weather?.humidity}%. Thích hợp cho canh tác lúa và hoa màu.`, 'info')} className="w-[42px] h-[42px] flex items-center justify-center text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-xl transition-all shadow-sm">
          <CloudSun size={20} />
        </button>
        <button id="notif-btn" onClick={() => Swal.fire('Thông báo mới', 'Cảm biến đất số 5 vừa được cập nhật.', 'info')} className="w-[42px] h-[42px] flex items-center justify-center text-orange-500 bg-orange-500/10 hover:bg-orange-500 hover:text-white rounded-xl transition-all shadow-sm">
          <Activity size={20} />
        </button>
        <div className="w-[42px] h-[42px] bg-slate-200 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-sm shadow-sm border dark:border-slate-700" id="user-avatar">
          FA
        </div>
      </div>
    </header>
  );
}

function Dashboard() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isAddFormOpen, setAddFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { themeMode } = React.useContext(ThemeContext);
  
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "farms"), (snapshot) => {
      const farmData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Farm[];
      setFarms(farmData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, "farms"));
    return () => unsub();
  }, []);

  const handleAddFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !owner || !phone || !password) {
      Swal.fire("Lỗi!", "Vui lòng điền đủ thông tin", "error");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "farms"), {
        name, owner, phone, password,
        createdAt: new Date().toISOString(),
        environment: { temperature: 28, humidity: 65, light: "Tốt" },
        devices: [{ id: "1", name: "Hệ thống tưới", status: false }],
        grid: {}
      });
      Swal.fire("Thành Công!", "Đã tạo điền trang", "success");
      setAddFormOpen(false);
      setName(""); setOwner(""); setPhone(""); setPassword("");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "farms");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa?',
      text: "Dữ liệu sẽ mất vĩnh viễn!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Xóa điền trang',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "farms", id));
        Swal.fire('Đã xóa!', 'Điền trang đã được gỡ bỏ.', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `farms/${id}`);
      }
    }
  };

  return (
    <div className="p-4 md:p-10 w-full max-w-7xl mx-auto" id="dashboard-page">
      <div className={cn("rounded-2xl shadow-xl border overflow-hidden", themeMode === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h5 className={cn("text-xl font-black", themeMode === 'dark' ? "text-white" : "text-slate-900")}>Hệ Thống Điền Trang</h5>
          <button 
            id="add-farm-btn"
            onClick={() => setAddFormOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            <PlusCircle size={18} /> Thêm Điền Trang
          </button>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {farms.length === 0 ? (
              <div className="col-span-full py-32 text-center bg-slate-50/5 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4">
                <LayoutDashboard size={64} className="text-slate-300 dark:text-slate-700" />
                <p className={cn("font-bold text-lg", themeMode === 'dark' ? "text-slate-400" : "text-slate-500")}>Chưa có điền trang nào được tạo</p>
              </div>
            ) : (
              farms.map(farm => (
                <div 
                  key={farm.id} 
                  id={`farm-card-${farm.id}`}
                  onClick={() => navigate(`/farm/${farm.id}`)}
                  className="bg-primary text-white rounded-[2rem] overflow-hidden relative p-8 h-[240px] shadow-2xl cursor-pointer hover:translate-y-[-8px] transition-all group flex flex-col justify-between"
                >
                  <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
                  
                  <div className="flex justify-between items-start relative z-10">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                      <Cpu size={28} className="text-white" />
                    </div>
                    <button 
                      id={`delete-btn-${farm.id}`}
                      onClick={(e) => { e.stopPropagation(); handleDelete(farm.id); }}
                      className="w-10 h-10 bg-white/10 hover:bg-red-500/80 rounded-xl transition-all flex items-center justify-center border border-white/10"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="text-3xl font-black tracking-tight leading-none mb-2">{farm.name}</h3>
                    <div className="flex items-center gap-2 text-white/70 font-bold">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-[10px]">OS</div>
                      <span className="text-sm">{farm.owner}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isAddFormOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center items-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setAddFormOpen(false)}></div>
          <div className={cn("w-full max-w-md rounded-3xl shadow-2xl z-10 flex flex-col p-10 border animate-in zoom-in-95 duration-200", themeMode === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
            <h3 className={cn("text-3xl font-black mb-8", themeMode === 'dark' ? "text-white" : "text-slate-900")}>Tạo Điền Trang Mới</h3>
            <form onSubmit={handleAddFarm} className="space-y-4">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Tên Điền Trang" className={cn("w-full px-6 py-4 rounded-2xl border outline-none focus:ring-4 focus:ring-primary/20 transition-all font-bold", themeMode === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200")} id="input-farm-name" />
              <input value={owner} onChange={e => setOwner(e.target.value)} placeholder="Chủ Sở Hữu" className={cn("w-full px-6 py-4 rounded-2xl border outline-none focus:ring-4 focus:ring-primary/20 transition-all font-bold", themeMode === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200")} id="input-owner" />
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Số Điện Thoại" className={cn("w-full px-6 py-4 rounded-2xl border outline-none focus:ring-4 focus:ring-primary/20 transition-all font-bold", themeMode === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200")} id="input-phone" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mật Mã Truy Cập" className={cn("w-full px-6 py-4 rounded-2xl border outline-none focus:ring-4 focus:ring-primary/20 transition-all font-bold", themeMode === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200")} id="input-password" />
              <button type="submit" disabled={loading} className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50 mt-4 h-[60px]" id="submit-farm-btn">
                {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div> : "Khởi Tạo Hệ Thống"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Chat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const { themeMode } = React.useContext(ThemeContext);
  const scrollRef = useRef<HTMLDivElement>(null);

  const welcomeMessages = [
    { sender: "Hệ thống", text: "Chào mừng bạn đến với kênh thảo luận chung của cộng đồng FarmConsole! 🌾", time: { seconds: Date.now()/1000 - 10000 }, system: true },
    { sender: "Admin_Farm", text: "Lưu ý: Bà con hãy tôn trọng nhau và không đăng tin quảng cáo rác nhé.", time: { seconds: Date.now()/1000 - 9000 }, system: true },
    { sender: "Anh Sáu", text: "Chào cả nhà, khu vực Long An hôm nay có ai bị sâu keo không ạ?", time: { seconds: Date.now()/1000 - 5000 } }
  ];

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("time", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const dbMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages([...welcomeMessages, ...dbMsgs]);
    }, (err) => handleFirestoreError(err, OperationType.LIST, "messages"));
    return () => unsub();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input;
    setInput("");
    try {
      await addDoc(collection(db, "messages"), {
        sender: "User-" + Math.floor(Math.random() * 1000),
        text,
        time: Timestamp.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "messages");
    }
  };

  return (
    <div className="p-4 md:p-10 w-full max-w-5xl mx-auto h-[calc(100vh-120px)]" id="chat-page">
      <div className={cn("rounded-3xl shadow-2xl flex flex-col h-full border overflow-hidden", themeMode === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
            <MessageSquare size={24} />
          </div>
          <h2 className={cn("text-xl font-black", themeMode === 'dark' ? "text-white" : "text-slate-900")}>Cộng Đồng Farmer Trực Tuyến</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-10 space-y-6 flex flex-col">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30 gap-4">
              <MessageSquare size={80} />
              <p className="font-bold text-lg">Chưa có hội thoại nào</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cn("flex flex-col gap-2", m.system ? "items-center my-4" : "")}>
              {!m.system ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500">{m.sender.charAt(0)}</div>
                    <span className="text-xs font-black text-slate-400">{m.sender}</span>
                  </div>
                  <div className={cn("max-w-[80%] px-6 py-4 rounded-3xl shadow-sm text-sm font-bold leading-relaxed", themeMode === 'dark' ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700")}>
                    {m.text}
                  </div>
                </>
              ) : (
                <div className="bg-primary/5 border border-primary/10 px-6 py-3 rounded-2xl text-[12px] font-black text-primary/60 italic">
                  {m.text}
                </div>
              )}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        <form onSubmit={handleSend} className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-4 bg-slate-50/5" id="chat-form">
          <input 
            id="chat-input"
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder="Mọi người ơi, cho mình hỏi về lúa với..." 
            className={cn("flex-1 px-8 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-primary/20 transition-all font-bold", themeMode === 'dark' ? "bg-slate-800 text-white border-slate-700" : "bg-white border-slate-200")}
          />
          <button type="submit" className="bg-primary text-white w-[60px] h-[60px] rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"><ArrowRightCircle size={28} /></button>
        </form>
      </div>
    </div>
  );
}

function Community() {
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const { themeMode } = React.useContext(ThemeContext);

  const seedPosts = [
    { id: "seed-1", author: "Bác Ba Nông", initial: "B", content: "Mọi người cho hỏi năm nay giống ngô CP-511 có chịu hạn tốt không? Mình đang tính xuống giống đợt tới.", time: new Date(Date.now() - 3600000 * 2).toISOString(), verified: true },
    { id: "seed-2", author: "Kỹ Sư Minh", initial: "M", content: "Vừa cập nhật chỉ số độ ẩm cho khu vực Miền Tây, bà con chú ý bón thúc đợt 2 cho lúa nhé.", time: new Date(Date.now() - 3600000 * 5).toISOString(), verified: true },
    { id: "seed-3", author: "Chị Thảo Farm", initial: "T", content: "Mô hình thủy canh của mình vừa đạt chuẩn VietGAP, khoe với anh em quả cà chua đỏ mọng!", time: new Date(Date.now() - 3600000 * 12).toISOString(), verified: false }
  ];

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("time", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const dbPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts([...dbPosts, ...seedPosts]);
    });
    return () => unsub();
  }, []);

  const handlePost = async () => {
    if (!content.trim()) return;
    try {
      await addDoc(collection(db, "posts"), {
        author: "Anh Hai Lúa",
        initial: "H",
        content,
        time: new Date().toISOString()
      });
      setContent("");
      Swal.fire({ title: "Thành công", text: "Đã đăng bài lên cộng đồng", icon: "success", timer: 1000, showConfirmButton: false });
    } catch (err) { handleFirestoreError(err, OperationType.CREATE, "posts"); }
  };

  return (
    <div className="p-4 md:p-14 w-full max-w-6xl mx-auto space-y-12" id="community-page">
      <div className={cn("p-10 rounded-[2.5rem] border shadow-2xl", themeMode === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
        <h2 className={cn("text-3xl font-black mb-8", themeMode === 'dark' ? "text-white" : "text-slate-900")}>Bảng Tin Cộng Đồng</h2>
        <div className="relative">
          <textarea 
            id="post-textarea"
            value={content} 
            onChange={e => setContent(e.target.value)} 
            placeholder="Hôm nay nông trại của bạn thế nào?" 
            className={cn("w-full p-8 rounded-3xl border focus:ring-4 focus:ring-primary/20 outline-none transition-all font-bold min-h-[160px] text-lg", themeMode === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 placeholder-slate-400")}
          />
        </div>
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm font-bold text-slate-400">Đồng bộ tức thì với 2000+ người dùng</p>
          <button onClick={handlePost} className="px-10 py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-2xl shadow-primary/20 hover:translate-y-[-4px] active:translate-y-0 transition-all" id="post-btn">Đăng Bài</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {posts.map(p => (
          <div key={p.id} className={cn("p-10 rounded-[2.5rem] border flex gap-8 shadow-sm hover:shadow-xl transition-all", themeMode === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100")} id={`post-${p.id}`}>
            <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center font-black text-primary shrink-0 text-xl border border-primary/20">{p.initial}</div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <h4 className={cn("font-black text-xl", themeMode === 'dark' ? "text-white" : "text-slate-900")}>{p.author}</h4>
                  {p.verified && <ShieldCheck size={18} className="text-primary" />}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-full">
                  <Activity size={14} className="text-green-500" />
                  {new Date(p.time).toLocaleDateString('vi-VN')}
                </div>
              </div>
              <p className={cn("leading-relaxed text-lg font-medium", themeMode === 'dark' ? "text-slate-300" : "text-slate-600")}>{p.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Store() {
  const { themeMode } = React.useContext(ThemeContext);
  const products = [
    { id: 1, name: "Cảm Biến IoT v4 Smart", price: 1250000, category: "Thiết bị", img: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&q=80&w=600" },
    { id: 2, name: "Hệ Thống Phun Tưới Tự Động", price: 4500000, category: "Hệ thống", img: "https://images.unsplash.com/photo-1592984788913-2947116bd06c?auto=format&fit=crop&q=80&w=600" },
    { id: 3, name: "Phân Bón Hữu Cơ Cao Cấp", price: 320000, category: "Vật tư", img: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&q=80&w=600" },
    { id: 4, name: "Máy Bay Xịt Thuốc DJI T40", price: 125000000, category: "Drone", img: "https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&q=80&w=600" },
    { id: 5, name: "Bộ Kit Thủy Canh 20 Ống", price: 2100000, category: "Trồng trọt", img: "https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&q=80&w=600" },
    { id: 6, name: "Hạt Giống Ngô Mỹ F1", price: 150000, category: "Hạt giống", img: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=600" },
    { id: 7, name: "Trạm Thời Tiết IoT", price: 3500000, category: "Thiết bị", img: "https://images.unsplash.com/photo-1590055531615-f16d36e2f181?auto=format&fit=crop&q=80&w=600" },
    { id: 8, name: "Đèn LED Quang Phổ Full", price: 850000, category: "Thiết bị", img: "https://images.unsplash.com/photo-1501862700950-18382cd41497?auto=format&fit=crop&q=80&w=600" },
    { id: 9, name: "Máy Cắt Cỏ Cầm Tay", price: 1800000, category: "Công cụ", img: "https://images.unsplash.com/photo-1599423423927-aa28e0892015?auto=format&fit=crop&q=80&w=600" },
    { id: 10, name: "Bình Phun Thuốc Điện 20L", price: 750000, category: "Vật tư", img: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&q=80&w=600" },
    { id: 11, name: "Hạt Giống Đậu Nành Thái", price: 220000, category: "Hạt giống", img: "https://images.unsplash.com/photo-1558448834-8be05c56dc48?auto=format&fit=crop&q=80&w=600" },
    { id: 12, name: "Cảm Biến pH Đất Bluetooth", price: 650000, category: "Thiết bị", img: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?auto=format&fit=crop&q=80&w=600" }
  ];

  return (
    <div className="p-10 w-full max-w-7xl mx-auto space-y-12" id="store-page">
      <div className="flex justify-between items-end">
        <div>
           <h2 className={cn("text-4xl font-black", themeMode === 'dark' ? "text-white" : "text-slate-900")}>Gian Hàng Vật Tư</h2>
           <p className={cn("font-bold mt-2", themeMode === 'dark' ? "text-slate-400" : "text-slate-500")}>Dành riêng cho cộng đồng FarmConsole - 8 Sản phẩm sẵn có</p>
        </div>
        <button className="bg-slate-900 dark:bg-white dark:text-black text-white px-8 py-4 rounded-2xl font-black shadow-2xl flex items-center gap-3 active:scale-95 transition-all">
          Giỏ Hàng <ShoppingCart size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {products.map(p => (
          <div key={p.id} className={cn("rounded-[2.5rem] border overflow-hidden shadow-sm hover:shadow-2xl transition-all group", themeMode === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100")}>
            <div className="h-64 overflow-hidden relative">
              <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute top-4 left-4 bg-primary text-white p-3 rounded-2xl font-black text-xs shadow-xl">{p.category.toUpperCase()}</div>
            </div>
            <div className="p-8">
              <h4 className={cn("text-xl font-black mb-2 line-clamp-1", themeMode === 'dark' ? "text-white" : "text-slate-900")}>{p.name}</h4>
              <p className="text-primary font-black text-3xl mb-8">{p.price.toLocaleString('vi-VN')} đ</p>
              <button 
                id={`buy-btn-${p.id}`}
                onClick={() => Swal.fire('Thông báo', 'Chúng tôi sẽ liên hệ báo giá lắp đặt cho bạn!', 'info')}
                className="w-full bg-slate-900 dark:bg-primary text-white py-4 rounded-2xl font-black shadow-lg hover:translate-y-[-4px] active:translate-y-0 transition-all tracking-wider"
              >
                LIÊN HỆ MUA
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FarmDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [farm, setFarm] = useState<Farm | null>(null);
  const { themeMode } = React.useContext(ThemeContext);
  const { selectedTool } = React.useContext(FarmContext);
  const [taskProgress, setTaskProgress] = useState<Record<string, number>>({});
  const [activeTasks, setActiveTasks] = useState<Record<string, boolean>>({});

  const startAutomatedTask = (taskName: string, durationSec: number = 10) => {
    if (activeTasks[taskName]) return;
    
    setActiveTasks(prev => ({ ...prev, [taskName]: true }));
    setTaskProgress(prev => ({ ...prev, [taskName]: 0 }));
    
    const interval = 100; // ms
    const increments = durationSec * (1000 / interval);
    let current = 0;
    
    const timer = setInterval(() => {
      current++;
      const progress = Math.min((current / increments) * 100, 100);
      setTaskProgress(prev => ({ ...prev, [taskName]: progress }));
      
      if (progress >= 100) {
        clearInterval(timer);
        setActiveTasks(prev => ({ ...prev, [taskName]: false }));
        Swal.fire({
          title: "Hoàn tất!",
          text: `Tiến trình: ${taskName} đã hoàn thành xuất sắc.`,
          icon: "success",
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      }
    }, interval);
  };

  const iotFeatures = [
    { id: 'water', name: 'Tưới cây tự động', icon: <RotateCcw size={18} />, color: 'bg-blue-500' },
    { id: 'mist', name: 'Phun sương làm mát', icon: <Sun size={18} />, color: 'bg-cyan-500' },
    { id: 'pesticide', name: 'Phun thuốc AI', icon: <ShieldCheck size={18} />, color: 'bg-purple-500' },
  ];

  const [grid, setGrid] = useState<Record<string, string>>({});
  const [isEditingMap, setIsEditingMap] = useState(false);
  const [aiPlan, setAiPlan] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "farms", id), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as Farm;
        setFarm(data);
        setGrid(data.grid || {});
      } else {
        Swal.fire("Lỗi", "Không tìm thấy điền trang", "error");
        navigate("/");
      }
    });
    return () => unsub();
  }, [id, navigate]);

  const handleSyncIoT = async () => {
    if (!id) return;
    const progress = Swal.fire({
      title: 'Đang kết nối Cloud IoT...',
      text: 'Vui lòng chờ dữ liệu truyền tải',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    // Simulated IoT data payload
    const iotGrid: Record<string, string> = {
      "1_1": "Nước", "1_2": "Nước", "1_3": "Nước",
      "4_4": "Ngô", "4_5": "Ngô", "4_6": "Ngô",
      "5_4": "Ngô", "5_5": "Ngô", "5_6": "Ngô",
      "4_7": "Lúa", "4_8": "Lúa", "5_7": "Lúa", "5_8": "Lúa",
      "8_1": "Đường Đi", "8_2": "Đường Đi", "8_3": "Đường Đi", "8_4": "Đường Đi", "8_5": "Đường Đi"
    };

    try {
      await updateDoc(doc(db, "farms", id), {
        grid: iotGrid,
        environment: { temperature: 31, humidity: 55, light: "Nắng Gắt" }
      });
      Swal.close();
      Swal.fire({
        title: "Dữ Liệu Đã Cập Nhật",
        text: "Sơ đồ và chỉ số môi trường đã được đồng bộ từ cảm biến IoT",
        icon: "success",
        confirmButtonColor: "#2196f3"
      });
    } catch (err) { handleFirestoreError(err, OperationType.UPDATE, `farms/${id}`); }
  };

  const handleGeneratePlan = async () => {
    if (!farm) return;
    setIsGeneratingPlan(true);
    try {
      const resp = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmData: farm })
      });
      
      const text = await resp.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        data = { error: `Mã phản hồi từ máy chủ không hợp lệ (JSON Error): ${text.substring(0, 50)}...` };
      }

      if (resp.ok) {
        setAiPlan(data.plan);
      } else {
        throw new Error(data.error || `Lỗi AI (${resp.status})`);
      }
    } catch (err: any) {
      console.error("Plan Error:", err);
      Swal.fire("Lỗi", err.message || "Không thể tạo kế hoạch", "error");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleCellClick = async (r: number, c: number) => {
    if (!isEditingMap || !id) return;
    const key = `${r}_${c}`;
    const newGrid = { ...grid };
    if (selectedTool) {
      newGrid[key] = selectedTool;
    } else {
      delete newGrid[key];
    }
    setGrid(newGrid);
    await updateDoc(doc(db, "farms", id), { grid: newGrid });
  };

  const getEmoji = (tool: string) => {
    const emojis: Record<string, string> = { 'Ngô': '🌽', 'Lúa': '🌾', 'Khoai': '🥔', 'Đậu': '🌱', 'Nước': '💧', 'Đường Đi': '🟫' };
    return emojis[tool] || '';
  };

  if (!farm) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="p-4 md:p-14 w-full max-w-7xl mx-auto space-y-10" id="farm-detail-page">
      <div className={cn("p-10 rounded-[3rem] border shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6", themeMode === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100")}>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-primary/40">
             <Cpu size={40} />
          </div>
          <div>
            <h2 className={cn("text-4xl font-black tracking-tight", themeMode === 'dark' ? "text-white" : "text-slate-900")}>{farm.name}</h2>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-slate-400 font-bold text-sm tracking-widest flex items-center gap-1.5"><MapPin size={14} /> CLOUD IOT ACTIVE</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <button 
            id="iot-sync-btn"
            onClick={handleSyncIoT}
            className="flex-1 flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white px-8 py-5 rounded-[1.5rem] font-black text-lg shadow-2xl shadow-green-500/20 hover:translate-y-[-4px] active:translate-y-0 transition-all"
          >
            <RotateCcw size={22} className="animate-spin-slow" />
            LẤY DỮ LIỆU IOT
          </button>
          <button 
            id="ai-plan-btn"
            onClick={handleGeneratePlan}
            className="flex-1 flex items-center justify-center gap-3 bg-primary hover:bg-primary-dark text-white px-8 py-5 rounded-[1.5rem] font-black text-lg shadow-2xl shadow-primary/20 hover:translate-y-[-4px] active:translate-y-0 transition-all"
          >
            {isGeneratingPlan ? <RotateCcw size={22} className="animate-spin" /> : <FileText size={22} />}
            {isGeneratingPlan ? "ĐANG LẬP..." : "KẾ HOẠCH AI"}
          </button>
        </div>
      </div>

      {aiPlan && (
        <div className={cn("p-10 rounded-[3rem] border shadow-2xl animate-in slide-in-from-top-4 duration-300", themeMode === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100")}>
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className={cn("text-2xl font-black flex items-center gap-3", themeMode === 'dark' ? "text-white" : "text-slate-900")}>
              <FileText className="text-primary" /> Kế Hoạch Trồng Trọt Gợi Ý
            </h3>
            <button onClick={() => setAiPlan(null)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
          </div>
          <div className={cn("markdown-body font-medium leading-relaxed prose prose-slate dark:prose-invert max-w-none", themeMode === 'dark' ? "text-slate-300" : "text-slate-700")}>
            <Markdown>{aiPlan}</Markdown>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className={cn("lg:col-span-2 p-10 rounded-[3.5rem] border flex flex-col items-center justify-center gap-10 relative overflow-hidden", themeMode === 'dark' ? "bg-slate-950 border-slate-800 shadow-2xl" : "bg-slate-50 border-slate-100 shadow-xl shadow-slate-200/50")}>
           <div className="flex justify-between w-full items-center z-10">
             <h3 className={cn("font-black text-2xl px-6 py-2 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md", themeMode === 'dark' ? "text-white" : "text-slate-900")}>Mô Hình Nông Trại</h3>
             <button 
                id="edit-map-btn"
                onClick={() => setIsEditingMap(!isEditingMap)}
                className={cn("px-10 py-3 rounded-2xl font-black text-lg shadow-xl transition-all hover:scale-105", isEditingMap ? "bg-green-500 text-white shadow-green-500/20" : "bg-slate-900 text-white shadow-black/20")}
             >
               {isEditingMap ? "HOÀN TẤT" : "CHỈNH SỬA"}
             </button>
           </div>
           
           <div className="z-10 bg-white/5 p-4 rounded-[2.5rem] border border-white/10 backdrop-blur-md shadow-2xl">
             <div className="grid grid-cols-10 gap-2">
               {Array.from({ length: 10 }).map((_, r) => (
                 Array.from({ length: 10 }).map((_, c) => {
                   const key = `${r}_${c}`;
                   return (
                     <div 
                       key={key}
                       id={`cell-${key}`}
                       onClick={() => handleCellClick(r, c)}
                       className={cn(
                        "w-12 h-12 border rounded-2xl flex items-center justify-center text-2xl transition-all shadow-sm", 
                        isEditingMap ? "cursor-pointer hover:bg-primary/20 hover:scale-110 border-primary/20" : "border-white/5", 
                        themeMode === 'dark' ? "bg-slate-900" : "bg-white"
                       )}
                      >
                        {getEmoji(grid[key])}
                     </div>
                   );
                 })
               ))}
             </div>
           </div>
           
           <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at center, #2196f3 1.5px, transparent 1.5px)', backgroundSize: '40px 40px'}}></div>
        </div>

        <div className="space-y-8">
          <div className={cn("p-10 rounded-[3rem] border shadow-xl flex flex-col gap-8", themeMode === 'dark' ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100")}>
            <h4 className="font-black uppercase text-xs tracking-[0.2em] mb-4 flex items-center gap-3 text-primary"><Activity size={20} /> CHỈ SỐ MÔI TRƯỜNG</h4>
            <div className="space-y-6">
              {[
                { label: "Nhiệt độ", value: farm.environment?.temperature + "°C", color: "text-orange-500", bg: "bg-orange-500/10" },
                { label: "Độ ẩm đất", value: farm.environment?.humidity + "%", color: "text-blue-500", bg: "bg-blue-500/10" },
                { label: "Ánh sáng", value: farm.environment?.light, color: "text-yellow-500", bg: "bg-yellow-500/10" }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">{item.label}</span>
                  <span className={cn("font-black text-2xl px-4 py-1 rounded-xl", item.color, item.bg)}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className={cn("p-10 rounded-[3rem] border shadow-xl", themeMode === 'dark' ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100")}>
             <h4 className="font-black uppercase text-xs tracking-[0.2em] mb-6 flex items-center gap-3 text-primary"><Cpu size={20} /> TỰ ĐỘNG HÓA & HẸN GIỜ</h4>
             <div className="space-y-6">
                {iotFeatures.map((feat) => (
                  <div key={feat.id} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg", feat.color)}>
                          {feat.icon}
                        </div>
                        <span className="font-bold text-sm">{feat.name}</span>
                      </div>
                      <button 
                        disabled={activeTasks[feat.id]}
                        onClick={() => startAutomatedTask(feat.id)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-black transition-all",
                          activeTasks[feat.id] ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-primary text-white hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                        )}
                      >
                        {activeTasks[feat.id] ? "ĐANG CHẠY" : "KÍCH HOẠT"}
                      </button>
                    </div>
                    {activeTasks[feat.id] && (
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-300", feat.color)}
                          style={{ width: `${taskProgress[feat.id] || 0}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                ))}
             </div>
          </div>

          <div className={cn("p-10 rounded-[3rem] border shadow-xl", themeMode === 'dark' ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100")}>
             <h4 className="font-black uppercase text-xs tracking-[0.2em] mb-6 flex items-center gap-3 text-primary"><Cpu size={20} /> ĐIỀU KHIỂN THIẾT BỊ</h4>
             <div className="space-y-4">
                {farm.devices?.map((d: any) => (
                  <div key={d.id} className="flex justify-between items-center p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                    <span className="font-black text-slate-700 dark:text-slate-300">{d.name}</span>
                    <button 
                      onClick={() => Swal.fire('IoT Control', `Đã chuyển đổi trạng thái ${d.name}`, 'success')}
                      className={cn("w-14 h-8 rounded-full relative transition-all duration-500 shadow-inner", d.status ? "bg-primary" : "bg-slate-300 dark:bg-slate-700")}
                    >
                       <div className={cn("w-6 h-6 bg-white rounded-full absolute top-1 transition-all shadow-md", d.status ? "right-1" : "left-1")}></div>
                    </button>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIAssistant() {
  const { themeMode } = React.useContext(ThemeContext);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchHistory = async () => {
    try {
      const resp = await fetch("/api/chat");
      const data = await resp.json();
      setMessages(data);
    } catch (err) {
      console.error("Fetch History Error:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    const text = input;
    setInput("");
    setIsTyping(true);
    
    // Add user message locally for immediate feedback
    const userMsg = { sender: "Bạn", text, time: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Get response from AI Assistant API
      const resp = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      const respText = await resp.text();
      let data;
      try {
        data = respText ? JSON.parse(respText) : {};
      } catch (e) {
        data = { error: `Lỗi định dạng phản hồi (JSON Error): ${respText.substring(0, 50)}...` };
      }

      if (!resp.ok) {
        throw new Error(data.error || `Lỗi server (${resp.status})`);
      }

      const responseText = data.text;
      
      if (responseText) {
        const aiMsg = { sender: "Trợ lý AI", text: responseText, time: new Date().toISOString() };
        setMessages(prev => [...prev, aiMsg]);
        
        // Sync messages to server history
        await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMsg })
        });
        await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: aiMsg })
        });
      }
    } catch (err: any) {
      console.error("Chat Error:", err);
      const errMsg = { sender: "Trợ lý AI", text: `Lỗi AI: ${err.message || "Không thể kết nối"}.`, time: new Date().toISOString() };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="p-4 md:p-10 w-full max-w-5xl mx-auto h-[calc(100vh-120px)]" id="ai-assistant-page">
      <div className={cn("rounded-3xl shadow-2xl flex flex-col h-full border overflow-hidden", themeMode === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200")}>
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
            <Cpu size={24} />
          </div>
          <h2 className={cn("text-xl font-black", themeMode === 'dark' ? "text-white" : "text-slate-900")}>Trợ Lý Nông Nghiệp AI</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-10 space-y-6 flex flex-col">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex flex-col gap-2", m.sender === "Bạn" ? "items-end" : "items-start")}>
              <div className="flex items-center gap-2">
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black", m.sender === "Bạn" ? "bg-primary text-white" : "bg-slate-200 text-slate-500")}>
                  {m.sender.charAt(0)}
                </div>
                <span className="text-xs font-black text-slate-400">{m.sender}</span>
              </div>
              <div className={cn(
                "max-w-[80%] px-6 py-4 rounded-3xl shadow-sm text-sm font-bold leading-relaxed", 
                m.sender === "Bạn" 
                  ? "bg-primary text-white" 
                  : (themeMode === 'dark' ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700")
              )}>
                {m.text}
              </div>
            </div>
          ))}
          {isTyping && (
             <div className="flex flex-col gap-2 items-start animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-black">T</div>
                  <span className="text-xs font-black text-slate-400">Trợ lý AI</span>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 px-6 py-4 rounded-3xl text-sm font-bold italic">Đang suy nghĩ...</div>
             </div>
          )}
          <div ref={scrollRef} />
        </div>

        <form onSubmit={handleSend} className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-4">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hỏi AI về kỹ thuật trồng trọt, sâu bệnh..."
            className={cn("flex-1 px-8 py-4 rounded-2xl border-2 focus:border-primary outline-none font-bold transition-all", themeMode === 'dark' ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-100")}
          />
          <button type="submit" disabled={!input.trim() || isTyping} className="bg-primary text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
            <Send size={24} />
          </button>
        </form>
      </div>
    </div>
  );
}

function Diagnosis() {
  const { themeMode } = React.useContext(ThemeContext);
  const [step, setStep] = useState(1);
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const navigate = useNavigate();

  const crops = [
    { name: "Cây Ngô", icon: "🌽", keywords: "corn leaf disease, maize disease classification. Labels: Rust (Gỉ sắt), Blight (Đốm lá), Gray Leaf Spot (Đốm xám), Healthy (Khỏe mạnh). Model ref: Qilex/corn-disease-classification" },
    { name: "Cây Lúa", icon: "🌾", keywords: "rice leaf disease classification. Labels: Rice Blast (Đạo ôn), Sheath Blight (Khô vằn), Bacterial Leaf Blight (Bạc lá), Healthy (Khỏe mạnh). Model ref: ViT/MobileNet fine-tuned for rice" },
    { name: "Cây Đậu", icon: "🌱", keywords: "soybean/bean leaf disease classification. Labels: Frog Eye Leaf Spot, Leaf Rust, Healthy" }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDiagnose = async () => {
    if (!selectedCrop || !selectedImage) return;
    
    setIsAnalyzing(true);
    const cropInfo = crops.find(c => c.name === selectedCrop);

    try {
      const resp = await fetch("/api/ai/diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: selectedImage,
          cropType: selectedCrop,
          keywords: cropInfo?.keywords
        })
      });

      const respText = await resp.text();
      let diagnosticData;
      try {
        diagnosticData = respText ? JSON.parse(respText) : {};
      } catch (e) {
        diagnosticData = { error: `Lỗi chuẩn đoán: Phản hồi không đúng định dạng. (${respText.substring(0, 50)})` };
      }

      if (!resp.ok) {
        throw new Error(diagnosticData.error || `Lỗi server (${resp.status})`);
      }

      setResult({
        crop: selectedCrop,
        ...diagnosticData
      });
      setStep(3);
    } catch (err: any) {
      console.error("Diagnosis Error:", err);
      Swal.fire("Lỗi", err.message || "Không thể kết nối với AI để chuẩn đoán. Vui lòng kiểm tra lại hình ảnh hoặc kết nối mạng.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-4 md:p-14 w-full max-w-5xl mx-auto min-h-[calc(100vh-100px)] flex flex-col items-center justify-center text-center space-y-10" id="diagnosis-page">
      {step === 1 && (
        <>
          <div className="w-32 h-32 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary mb-4 shadow-2xl animate-pulse">
            <ShieldCheck size={64} />
          </div>
          <div className="space-y-4">
            <h2 className={cn("text-5xl font-black leading-tight", themeMode === 'dark' ? "text-white" : "text-slate-900")}>Phòng Khám Nông Nghiệp AI</h2>
            <p className="text-slate-500 max-w-xl font-bold text-lg mx-auto leading-relaxed">Sử dụng sức mạnh của Computer Vision để chuẩn đoán bệnh cho Ngô, Lúa, Đậu chỉ với 1 bức ảnh.</p>
          </div>
          <button 
            onClick={() => setStep(2)}
            className="px-12 py-5 bg-primary text-white rounded-[1.5rem] font-black text-xl shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
          >
            <Upload size={24} /> BẮT ĐẦU CHẨN ĐOÁN
          </button>
        </>
      )}

      {step === 2 && (
        <div className="w-full space-y-12">
           <div className="flex flex-col md:flex-row gap-10 items-start">
             <div className="flex-1 space-y-8 w-full">
                <h3 className={cn("text-3xl font-black text-left", themeMode === 'dark' ? "text-white" : "text-slate-900")}>1. Chọn loại cây trồng</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {crops.map(c => (
                    <button 
                      key={c.name}
                      onClick={() => setSelectedCrop(c.name)}
                      className={cn(
                        "p-6 rounded-[2.5rem] border-4 transition-all flex flex-col items-center gap-3",
                        selectedCrop === c.name ? "border-primary bg-primary/5" : "border-transparent bg-slate-50 dark:bg-slate-900"
                      )}
                    >
                      <span className="text-5xl">{c.icon}</span>
                      <span className={cn("text-lg font-black", themeMode === 'dark' ? "text-white" : "text-slate-900")}>{c.name}</span>
                    </button>
                  ))}
                </div>
             </div>

             <div className="flex-1 space-y-8 w-full">
                <h3 className={cn("text-3xl font-black text-left", themeMode === 'dark' ? "text-white" : "text-slate-900")}>2. Tải ảnh thực tế</h3>
                <div 
                  className={cn(
                    "relative h-[300px] border-4 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center p-4 transition-all overflow-hidden",
                    selectedImage ? "border-primary bg-primary/5" : "border-slate-200 dark:border-slate-800"
                  )}
                >
                  {selectedImage ? (
                    <>
                      <img src={selectedImage} className="max-h-full rounded-2xl shadow-xl" alt="Preview" />
                      <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg"><X size={16} /></button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                       <Upload size={48} className="text-slate-300" />
                       <p className={cn("font-bold text-center px-10", themeMode === 'dark' ? "text-slate-400" : "text-slate-400")}>Kéo thả hoặc nhấp để tải ảnh lá cây bị bệnh</p>
                       <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  )}
                </div>
             </div>
           </div>

           <div className="flex gap-4 justify-center">
             <button onClick={() => setStep(1)} className="px-10 py-4 bg-slate-200 dark:bg-slate-800 rounded-2xl font-black">QUAY LẠI</button>
             <button 
              disabled={!selectedCrop || !selectedImage || isAnalyzing} 
              onClick={handleDiagnose} 
              className="px-12 py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 disabled:opacity-50 min-w-[280px] flex items-center justify-center gap-3 hover:scale-105 transition-all"
             >
               {isAnalyzing ? <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : <ShieldCheck size={24} />}
               {isAnalyzing ? "ĐANG PHÂN TÍCH..." : "XÁC NHẬN CHẨN ĐOÁN"}
             </button>
           </div>
        </div>
      )}

      {step === 3 && result && (
        <div className={cn("w-full p-12 rounded-[3.5rem] border-4 border-primary text-left bg-white dark:bg-slate-900 animate-in fade-in zoom-in duration-500 shadow-2xl relative overflow-hidden", themeMode === 'dark' ? "" : "border-slate-100")}>
           <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <ShieldCheck size={200} />
           </div>
           
           <div className="flex justify-between items-start mb-10 flex-col md:flex-row gap-6 relative z-10">
              <div className="flex gap-8 items-center">
                <img src={selectedImage || ""} className="w-32 h-32 rounded-[2rem] object-cover border-4 border-primary/20 shadow-xl" alt="Analyzed" />
                <div>
                  <h4 className="text-primary font-black uppercase tracking-[0.2em] text-xs mb-2">BÁO CÁO PHÂN TÍCH AI CHUYÊN SÂU</h4>
                  <h3 className={cn("text-4xl font-black", themeMode === 'dark' ? "text-white" : "text-slate-900")}>{result.disease}</h3>
                </div>
              </div>
              <div className="bg-primary/10 text-primary px-10 py-5 rounded-[1.5rem] font-black text-2xl border-2 border-primary/20 shadow-lg">
                Độ tin cậy: {result.accuracy}
              </div>
           </div>
           
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
             <div className="space-y-6">
                <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-white/5">
                   <h5 className={cn("font-black mb-2 uppercase text-xs tracking-widest", themeMode === 'dark' ? "text-slate-400" : "text-slate-500")}>Loại cây trồng</h5>
                   <p className={cn("text-2xl font-black", themeMode === 'dark' ? "text-white" : "text-slate-900")}>{result.crop}</p>
                </div>
                <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-white/5">
                   <h5 className={cn("font-black mb-2 uppercase text-xs tracking-widest", themeMode === 'dark' ? "text-slate-400" : "text-slate-500")}>Phương pháp chẩn đoán</h5>
                   <p className={cn("text-2xl font-black", themeMode === 'dark' ? "text-white" : "text-slate-900")}>Computer Vision</p>
                </div>
             </div>
             <div className="p-10 bg-primary/5 border-2 border-primary/10 rounded-[3rem] shadow-inner">
                <h5 className="font-black text-primary mb-6 flex items-center gap-3 px-1 text-lg">
                  <Activity size={24} /> LỜI KHUYÊN TỪ CHUYÊN GIA
                </h5>
                <p className={cn("leading-relaxed font-bold text-xl", themeMode === 'dark' ? "text-slate-300" : "text-slate-700")}>{result.advice}</p>
             </div>
           </div>

           <div className="mt-12 flex flex-col md:flex-row gap-6 relative z-10">
              <button 
                onClick={() => { setStep(2); setSelectedCrop(null); setSelectedImage(null); setResult(null); }}
                className="flex-1 py-6 bg-slate-900 dark:bg-white dark:text-black text-white rounded-[1.5rem] font-black text-xl shadow-2xl hover:translate-y-[-6px] active:translate-y-0 transition-all"
              >
                CHẨN ĐOÁN MẪU TIẾP THEO
              </button>
              <button onClick={() => navigate('/forum')} className="flex-1 py-6 border-4 border-slate-200 dark:border-slate-800 rounded-[1.5rem] font-black text-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                <Users size={24} /> THẢO LUẬN CỘNG ĐỒNG
              </button>
           </div>
        </div>
      )}
    </div>
  );
}

export const ThemeContext = React.createContext<any>({});
export const FarmContext = React.createContext<any>({});

export default function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState('light');
  const [accentColor, setAccentColor] = useState('#2196f3');
  const [sidebarCaption, setSidebarCaption] = useState('show');
  const [themeLayout, setThemeLayout] = useState('ltr');
  const [layoutWidth, setLayoutWidth] = useState('full');

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', accentColor);
    document.documentElement.style.setProperty('--primary-dark', accentColor);
    document.documentElement.style.setProperty('--primary-light', accentColor + '20'); 
  }, [accentColor]);

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, accentColor, setAccentColor, sidebarCaption, setSidebarCaption, themeLayout, setThemeLayout, layoutWidth, setLayoutWidth }}>
      <FarmContext.Provider value={{ selectedTool, setSelectedTool }}>
        <div 
          className={cn(
            "min-h-screen font-sans transition-all duration-500", 
            themeMode === 'dark' ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
          )}
          dir={themeLayout}
          id="app-root"
        >
          <Sidebar isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
          
          <div className={cn("flex-1 flex flex-col min-h-screen transition-all duration-300", isSidebarOpen ? "lg:pl-[260px]" : "pl-0")}>
            <Header toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
            <main className={cn("flex-1 overflow-x-hidden", layoutWidth === 'fixed' ? "max-w-7xl mx-auto w-full" : "w-full")}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/ai-assistant" element={<AIAssistant />} />
                <Route path="/forum" element={<Community />} />
                <Route path="/store" element={<Store />} />
                <Route path="/farm/:id" element={<FarmDetail />} />
                <Route path="/diagnosis" element={<Diagnosis />} />
              </Routes>
            </main>
          </div>

          <div className="fixed bottom-10 right-10 flex flex-col gap-4 z-50">
            <button 
              id="theme-toggle"
              onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
              className={cn("w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95", themeMode === 'dark' ? "bg-white text-slate-950" : "bg-slate-900 text-white")}
            >
              {themeMode === 'dark' ? <Sun size={28} /> : <Moon size={28} />}
            </button>
          </div>
        </div>
      </FarmContext.Provider>
    </ThemeContext.Provider>
  );
}
