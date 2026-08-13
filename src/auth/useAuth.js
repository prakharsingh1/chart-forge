import { useContext } from "react";
import { AuthContext } from "./authContext.js";

export function useAuth() {
  return useContext(AuthContext);
}
