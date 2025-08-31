import React, { useState } from "react";
import { View, Text, TextInput, Button, FlatList, SafeAreaView } from "react-native";
import { API } from "./api";
export default function App(){
  const [email, setEmail] = useState("alice@company.com");
  const [password, setPassword] = useState("pass1234");
  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const login = async ()=>{ const r = await API.post("/auth/login",{email,password}); setToken(r.data.token); };
  const ask = async ()=>{ const r = await API.post("/chat/ask",{question:q},{headers:{Authorization:`Bearer ${token}`}}); setMessages(m=>[...m,{role:"user",content:q},{role:"assistant",content:r.data.answer}]); setQ(""); };
  return (
    <SafeAreaView style={{flex:1,padding:12}}>
      {!token ? (
        <View>
          <Text>Email</Text><TextInput value={email} onChangeText={setEmail} style={{borderWidth:1,padding:8}} />
          <Text>Password</Text><TextInput value={password} onChangeText={setPassword} secureTextEntry style={{borderWidth:1,padding:8}} />
          <Button title="Login" onPress={login} />
        </View>
      ) : (
        <View style={{flex:1}}>
          <FlatList data={messages} renderItem={({item})=><Text>{item.role}: {item.content}</Text>} keyExtractor={(_,i)=>String(i)} />
          <View style={{flexDirection:"row", gap:8}}>
            <TextInput value={q} onChangeText={setQ} placeholder="Ask..." style={{flex:1,borderWidth:1,padding:8}} />
            <Button title="Send" onPress={ask} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
