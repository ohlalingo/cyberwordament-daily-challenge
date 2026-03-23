import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n, Language } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";

export default function SignIn() {
  const { t, language, setLanguage } = useI18n();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await signIn(email, password, language);
      navigate("/dashboard");
    } catch (err) {
      console.error("Sign-in failed", err);
      setError(t("loginFailed") ?? "Sign-in failed. Please sign up first.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
        <div className="mx-auto mb-4 h-8 text-2xl font-extrabold text-primary">CyberWordament</div>
          <div className="flex justify-center gap-[2px]">
            {"CYBERWORDAMENT".split("").map((letter, i) => (
              <div
                key={i}
                className="flex h-6 w-[17px] items-center justify-center rounded-sm border border-primary font-mono text-[11px] font-bold text-primary"
              >
                {letter}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-6 text-base font-semibold font-heading text-foreground">{t("signIn")}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium font-heading text-muted-foreground">
                {t("preferredLanguage")}
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="en">{t("english")}</option>
                <option value="ja">{t("japanese")}</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium font-heading text-muted-foreground">
                {t("email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium font-heading text-muted-foreground">
                {t("password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold font-heading text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {t("signIn")}
            </button>
          </form>
          {error ? (
            <p className="mt-3 text-xs font-body text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <p className="mt-4 text-center text-xs text-muted-foreground font-body">
            {t("noAccount")}{" "}
            <button onClick={() => navigate("/signup")} className="text-primary font-semibold hover:underline">
              {t("signUp")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
