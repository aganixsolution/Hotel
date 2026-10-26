import { DEMO_ADMIN } from "@/data/seed";
import { sessionStore } from "@/lib/app-store";

/** Demo-only admin auth. Credentials live in the bundle — replace with a real backend for production. */
export function login(email: string, password: string): boolean {
  const ok =
    email.trim().toLowerCase() === DEMO_ADMIN.email && password === DEMO_ADMIN.password;
  if (ok) sessionStore.set({ email: DEMO_ADMIN.email, loggedInAt: Date.now() });
  return ok;
}

export function logout() {
  sessionStore.set(null);
}
