import { DEMO_ADMIN } from "@/data/seed";
import { sessionStore } from "@/lib/app-store";

/** Demo-only admin auth. Credentials live in the bundle — replace with a real backend for production. */
export function login(email: string, password: string): boolean {
  const norm = email.trim().toLowerCase();
  const ok =
    (norm === DEMO_ADMIN.email || norm === "admin@aganix.in" || norm === "admin@savirasa.in") &&
    password === DEMO_ADMIN.password;
  if (ok) sessionStore.set({ email: norm, loggedInAt: Date.now() });
  return ok;
}

export function logout() {
  sessionStore.set(null);
}
