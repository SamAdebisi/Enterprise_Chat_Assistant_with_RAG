import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  } catch {
    // fallback to local file for dev
    // @ts-ignore
    const svc = await import("../serviceAccount.json", { with: { type: "json" } } as any).catch(() => null);
    if (!svc) throw new Error("Missing Firebase credentials");
    admin.initializeApp({ credential: admin.credential.cert(svc.default as admin.ServiceAccount) });
  }
}
export const db = admin.firestore();
export const usersCol = db.collection("users");
export const chatsCol = db.collection("chats");

export const saveChatTurn = async (chatId: string, turn: any) => {
  await chatsCol.doc(chatId).collection("turns").add({ ...turn, ts: admin.firestore.FieldValue.serverTimestamp() });
};
export const upsertUser = async (uid: string, data: any) => {
  await usersCol.doc(uid).set(data, { merge: true });
};
export const findUserByEmail = async (email: string) => {
  const snap = await usersCol.where("email", "==", email).limit(1).get();
  return snap.empty ? null : { id: snap.docs[0].id, ...(snap.docs[0].data() as any) };
};
