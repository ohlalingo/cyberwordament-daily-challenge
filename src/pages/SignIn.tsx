import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n, Language } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { Lock, Mail, Globe, ArrowRight, ShieldCheck, Trophy, Brain } from "lucide-react";

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
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-primary text-primary-foreground p-12">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-foreground)) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono tracking-[0.2em] uppercase opacity-80">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
            Nomura · Cyberwordament
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="flex flex-wrap gap-[3px]">
            {"CYBERWORDAMENT".split("").map((letter, i) => (
              <div
                key={i}
                className="flex h-10 w-8 items-center justify-center rounded-sm border border-primary-foreground/70 font-mono text-sm font-bold"
              >
                {letter}
              </div>
            ))}
          </div>
          <h1 className="font-heading text-4xl font-bold leading-tight max-w-md">
            Sharpen your mind. <br />
            <span className="opacity-80">One puzzle at a time.</span>
          </h1>
          <p className="font-body text-sm opacity-80 max-w-md leading-relaxed">
            Daily crosswords, word searches and unjumbles for Nomura teams worldwide. Compete across regions and climb the global leaderboard.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4 max-w-md">
          {[
            { icon: Brain, label: "Daily puzzles" },
            { icon: Trophy, label: "Regional champs" },
            { icon: ShieldCheck, label: "Secure access" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="rounded-lg border border-primary-foreground/20 bg-primary-foreground/5 backdrop-blur-sm p-3">
              <Icon className="h-4 w-4 mb-2 opacity-90" />
              <div className="text-[11px] font-heading uppercase tracking-wider opacity-80">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="mb-8 text-center lg:hidden">
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
