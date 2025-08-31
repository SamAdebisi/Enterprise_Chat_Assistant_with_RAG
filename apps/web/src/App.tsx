import React, { useState } from "react";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  if (!token) return <Login onLogin={(t,u)=>{setToken(t); setUser(u);}} />
  return <Chat token={token} user={user} onLogout={()=>{setToken(null); setUser(null);}} />
}
