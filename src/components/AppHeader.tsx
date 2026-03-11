import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import nomuraLogo from "@/assets/nomura-logo.png";

export default function AppHeader() {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { key: "todaysPuzzle" as const, path: "/puzzle" },
    { key: "leaderboard" as const, path: "/leaderboard" },
    { key: "regionalChampions" as const, path: "/champions" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-content items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {location.pathname !== "/dashboard" && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-3">
            <img src={nomuraLogo} alt="Nomura" className="h-5" />
            <div className="flex gap-[1px]">
              {"CYBERWORDAMENT".split("").map((letter, i) => (
                <div
                  key={i}
                  className="flex h-4 w-[13px] items-center justify-center rounded-[2px] border border-primary font-mono text-[8px] font-bold text-primary"
                >
                  {letter}
                </div>
              ))}
            </div>
          </button>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-3 py-1.5 text-sm font-medium font-heading transition-colors ${
                  location.pathname === item.path
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(item.key)}
              </button>
            ))}
          </nav>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold font-heading">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={() => { signOut(); navigate("/"); }}
              className="text-xs text-muted-foreground hover:text-foreground font-heading"
            >
              {t("signOut")}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
