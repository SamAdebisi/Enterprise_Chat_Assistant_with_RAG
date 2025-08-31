export type Role = "all" | "sales" | "hr" | "engineering" | "finance";
export interface JwtUser { uid: string; email: string; roles: Role[]; }
