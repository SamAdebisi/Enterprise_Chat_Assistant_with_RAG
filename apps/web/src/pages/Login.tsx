import React, { useState } from "react";
import { API } from "../api";
export default function Login({ onLogin }: { onLogin: (t: string, u:any)=>void }) {
  const [email, setEmail] = useState("alice@company.com");
  const [password, setPassword] = useState("pass1234");
  const [error, setError] = useState("");
  const seed = async () => { await API.post("/auth/seed"); };
  const submit = async (e:any) => {
    e.preventDefault();
    try {
      const r = await API.post("/auth/login", { email, password });
      onLogin(r.data.token, r.data.user);
    } catch (err:any) { setError(err?.response?.data?.error || "login failed"); }
  };
  return (
    <div className="center">
      <h1>Enterprise Chat</h1>
      <form onSubmit={submit}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" />
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="password" />
        <button type="submit">Login</button>
        <button type="button" onClick={seed}>Seed Demo Users</button>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
}
