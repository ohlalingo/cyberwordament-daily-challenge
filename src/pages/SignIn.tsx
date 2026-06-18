import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n, Language } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { Lock, Mail, Globe, ArrowRight } from "lucide-react";

export default function SignIn() {
  const { t, language, setLanguage } = useI18n();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password, language);
      navigate("/dashboard");
    } catch (err) {
      console.error("Sign-in failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Form panel */}
      <div className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="mb-8 text-center">
            <div className="flex justify-center gap-[2px]">
              {"CYBERMAZE".split("").map((letter, i) => (
                <div
                  key={i}
                  className="flex h-6 w-[17px] items-center justify-center rounded-sm border border-primary font-mono text-[11px] font-bold text-primary"
                >
                  {letter}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold font-heading text-foreground">{t("signIn")}</h2>
            <p className="mt-1 text-sm text-muted-foreground font-body">
              Welcome back. Enter your details to continue.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium font-heading text-muted-foreground">
                  {t("preferredLanguage")}
                </label>
                <div className="relative">
                  <Globe className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="w-full appearance-none rounded-lg border border-input bg-card pl-9 pr-3 py-2.5 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition"
                  >
                    <option value="en">{t("english")}</option>
                    <option value="ja">{t("japanese")}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium font-heading text-muted-foreground">
                  {t("email")}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@nomura.com"
                    className="w-full rounded-lg border border-input bg-card pl-9 pr-3 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium font-heading text-muted-foreground">
                  {t("password")}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-input bg-card pl-9 pr-3 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold font-heading text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {loading ? "Signing in…" : t("signIn")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground font-body">
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
