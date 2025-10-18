export type Role = "all" | "sales" | "hr" | "engineering" | "finance" | "admin";
export interface JwtUser { uid: string; email: string; roles: Role[]; }
