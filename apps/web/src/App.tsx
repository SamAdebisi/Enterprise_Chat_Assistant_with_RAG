import React, { useState } from "react";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import type { UserProfile, LoginResponse } from "./types";

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  const handleLogin = (resp: LoginResponse) => {
    setToken(resp.token);
    setUser(resp.user);
  };

  if (!token || !user) {
    return <Login onLogin={handleLogin} />;
  }

  return <Chat token={token} user={user} onLogout={() => { setToken(null); setUser(null); }} />;
}
