import { authenticators } from "../tables/authenticators";

export type Authenticator = typeof authenticators.$inferSelect;
export type NewAuthenticator = typeof authenticators.$inferInsert;
