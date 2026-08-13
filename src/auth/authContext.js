import { createContext } from "react";

export const AuthContext = createContext({
  user: null,
  loading: true,
  configured: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});
