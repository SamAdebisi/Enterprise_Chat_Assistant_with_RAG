import axios from "axios";

const baseURL = process.env.EXPO_PUBLIC_API_BASE || "http://10.0.2.2:8080";

export const API = axios.create({ baseURL });
