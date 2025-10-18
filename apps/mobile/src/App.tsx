import React, { useState } from "react";
import { View, Text, TextInput, Button, FlatList, SafeAreaView, Alert, StyleSheet } from "react-native";
import { API } from "./api";

type Message = { role: "user" | "assistant"; content: string };

export default function App() {
  const [email, setEmail] = useState("alice@company.com");
  const [password, setPassword] = useState("pass1234");
  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    try {
      setLoading(true);
      const r = await API.post("/auth/login", { email, password });
      setToken(r.data.token);
      setMessages([{ role: "assistant", content: `Hi ${r.data.user.email}, ask me anything!` }]);
    } catch (err: any) {
      Alert.alert("Login failed", err?.response?.data?.error || err?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const ask = async () => {
    const trimmed = question.trim();
    if (!trimmed || !token) return;
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setQuestion("");
    try {
      setLoading(true);
      const r = await API.post(
        "/chat/ask",
        { question: trimmed },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessages((m) => [...m, { role: "assistant", content: r.data.answer }]);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Inference failed";
      Alert.alert("Chat error", msg);
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setMessages([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {!token ? (
        <View style={styles.card}>
          <Text style={styles.title}>Enterprise Chat</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="email"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="password"
            secureTextEntry
            style={styles.input}
          />
          <Button title={loading ? "Signing in..." : "Login"} onPress={login} disabled={loading} />
        </View>
      ) : (
        <View style={styles.chatPane}>
          <View style={styles.chatHeader}>
            <Text style={styles.title}>{email}</Text>
            <Button title="Logout" onPress={logout} />
          </View>
          <FlatList
            data={messages}
            renderItem={({ item }) => (
              <View style={[styles.message, item.role === "user" ? styles.user : styles.assistant]}>
                <Text>{item.content}</Text>
              </View>
            )}
            keyExtractor={(_, i) => String(i)}
            style={styles.list}
          />
          <View style={styles.inputRow}>
            <TextInput
              value={question}
              onChangeText={setQuestion}
              placeholder="Ask a question..."
              style={[styles.input, styles.flex]}
              editable={!loading}
            />
            <Button title={loading ? "..." : "Send"} onPress={ask} disabled={loading} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 12 },
  card: { gap: 12, padding: 16, backgroundColor: "#fff", borderRadius: 12, elevation: 2 },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#cbd5f5", borderRadius: 8, padding: 10, backgroundColor: "#fff" },
  chatPane: { flex: 1, gap: 12 },
  chatHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  list: { flex: 1 },
  message: { padding: 10, borderRadius: 10, marginVertical: 4 },
  user: { alignSelf: "flex-end", backgroundColor: "#dbeafe" },
  assistant: { alignSelf: "flex-start", backgroundColor: "#dcfce7" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  flex: { flex: 1 },
});
