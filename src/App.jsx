import { useState, useEffect } from "react";
import axios from "axios";

// ⚠️ URL ของ Backend
const API_BASE_URL = "https://backend02-2zhd.onrender.com"; 

export default function App() {
  const [loginEmail, setLoginEmail] = useState(localStorage.getItem("capu_user") || "");
  const [loginPassword, setLoginPassword] = useState(localStorage.getItem("capu_pass") || "");
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("capu_user"));
  
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [folders, setFolders] = useState([]);
  const [emails, setEmails] = useState([]);
  const [activeFolder, setActiveFolder] = useState("INBOX");
  const [selectedUid, setSelectedUid] = useState(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [bodyLoading, setBodyLoading] = useState(false);

  const headers = { 
    headers: { 
      'x-imap-user': localStorage.getItem("capu_user") || loginEmail, 
      'x-imap-pass': localStorage.getItem("capu_pass") || loginPassword 
    } 
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/login`, { email: loginEmail, password: loginPassword });
      if (res.data.success) {
        localStorage.setItem("capu_user", loginEmail);
        localStorage.setItem("capu_pass", loginPassword);
        setIsLoggedIn(true);
      }
    } catch (err) {
      console.error("🔴 Error:", err); 
      const realErrorMessage = err.response?.data?.error || err.message;
      setLoginError(`Login Failed: ${realErrorMessage}`);
    } finally { 
      setIsLoggingIn(false); 
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    window.location.reload();
  };

  useEffect(() => {
    if (isLoggedIn) {
      axios.get(`${API_BASE_URL}/api/folders`, headers).then(res => setFolders(res.data.data)).catch(() => {});
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      setLoading(true);
      axios.get(`${API_BASE_URL}/api/emails?folder=${encodeURIComponent(activeFolder)}`, headers)
        .then(res => { setEmails(res.data.data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [isLoggedIn, activeFolder]);

  useEffect(() => {
    if (selectedUid) {
      setBodyLoading(true);
      axios.get(`${API_BASE_URL}/api/email-content?folder=${encodeURIComponent(activeFolder)}&uid=${selectedUid}`, headers)
        .then(res => { setBody(res.data.content); setBodyLoading(false); })
        .catch(() => setBodyLoading(false));
    }
  }, [selectedUid]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF0] p-6 font-sans">
        <div className="w-full max-w-sm bg-white border-2 border-[#EAD7BB] rounded-[2rem] shadow-xl p-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-[#543310] mb-2 italic">Unponyshop ☕</h1>
            <p className="text-xs text-[#AF8F6F] font-bold uppercase tracking-widest">Freshly Brewed Inbox</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} 
                   className="w-full px-5 py-3 bg-[#FAF7F0] border border-[#D0B8A8] rounded-2xl focus:ring-2 focus:ring-[#AF8F6F] outline-none transition-all text-[#543310]" required />
            <input type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} 
                   className="w-full px-5 py-3 bg-[#FAF7F0] border border-[#D0B8A8] rounded-2xl focus:ring-2 focus:ring-[#AF8F6F] outline-none transition-all text-[#543310]" required />
            {loginError && <div className="text-red-500 text-xs text-center font-bold">{loginError}</div>}
            <button className="w-full bg-[#543310] text-[#FDFCF0] py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-[#74512D] transition-all active:scale-95">
              {isLoggingIn ? "Connecting..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#FAF7F0] text-[#543310] font-sans overflow-hidden">
      <div className="w-64 bg-[#543310] text-[#FDFCF0] flex flex-col shrink-0">
        <div className="p-6 text-2xl font-black italic border-b border-[#74512D]">CapuMail</div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {folders.map(f => (
            <button key={f.path} onClick={() => {setActiveFolder(f.path); setSelectedUid(null);}} 
                 className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center gap-3 ${activeFolder === f.path ? 'bg-[#AF8F6F] text-white font-bold' : 'hover:bg-[#74512D]'}`}>
              📁 {f.name}
            </button>
          ))}
        </div>
        <button onClick={handleLogout} className="m-4 py-2 bg-[#74512D] hover:bg-red-900 rounded-xl text-[10px] font-bold transition-all">SIGN OUT</button>
      </div>

      <div className="w-[400px] bg-white border-r border-[#EAD7BB] flex flex-col">
        <div className="p-5 font-black border-b border-[#EAD7BB] bg-[#FDFCF0] uppercase tracking-tighter text-[#74512D]">{activeFolder}</div>
        <div className="flex-1 overflow-y-auto">
          {loading ? <div className="p-10 text-center animate-pulse">Brewing mail list...</div> : 
            emails.map(m => (
              <div key={m.uid} onClick={() => setSelectedUid(m.uid)} 
                   className={`p-5 border-b border-[#FAF7F0] cursor-pointer transition-all ${selectedUid === m.uid ? 'bg-[#FAF7F0] border-l-4 border-l-[#AF8F6F]' : 'hover:bg-[#FDFCF0]'}`}>
                <div className="text-sm font-black truncate">{m.from}</div>
                <div className="text-xs text-[#AF8F6F] truncate mt-1 italic">{m.subject}</div>
              </div>
            ))
          }
        </div>
      </div>

      <div className="flex-1 bg-white overflow-y-auto p-10">
        {selectedUid ? (
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-black mb-8 italic text-[#543310]">{emails.find(e => e.uid === selectedUid)?.subject}</h1>
            <div className="bg-[#FDFCF0] p-8 rounded-[2.5rem] border-2 border-[#EAD7BB] font-mono text-sm whitespace-pre-wrap leading-relaxed text-[#543310] shadow-inner">
              {bodyLoading ? "Pouring content..." : body}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-[#D0B8A8]">
            <span className="text-7xl mb-4">☕</span>
            <p className="font-bold italic">Pick a coffee bean (email) to read</p>
          </div>
        )}
      </div>
    </div>
  );
}
