import React, { useState } from "react";
import { AuthClient } from "../api/client";
import type { LoginResponse } from "../types";

interface LoginProps {
  onLogin: (data: LoginResponse) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("alice@company.com");
  const [password, setPassword] = useState("pass1234");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const seed = async () => {
    setError("");
    try {
      await AuthClient.seedDemo();
    } catch (err: any) {
      setError(err?.message || "Unable to seed demo users");
    }
  };
  const submit = async (e:any) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await AuthClient.login({ email, password });
      onLogin(data);
    } catch (err:any) {
      setError(err?.response?.data?.error || err?.message || "login failed");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="center">
      <h1>Enterprise Chat</h1>
      <form onSubmit={submit}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" />
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="password" />
        <button type="submit" disabled={isLoading}>{isLoading ? "Signing in..." : "Login"}</button>
        <button type="button" onClick={seed} disabled={isLoading}>Seed Demo Users</button>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
}
