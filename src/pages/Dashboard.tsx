import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import AppHeader from "@/components/AppHeader";

export default function Dashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-content px-4 pt-20 pb-12">
        <h1 className="mb-1 text-xl font-bold font-heading text-foreground">{t("dashboard")}</h1>
        <p className="mb-8 text-sm text-muted-foreground font-body">
          {t("welcomeBack")}, {user?.name}
        </p>

        <div className="mb-8 rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-2 text-base font-semibold font-heading text-foreground">{t("dailyChallenge")}</h2>
          <p className="mb-5 text-sm text-muted-foreground font-body">{t("puzzleDescription")}</p>
          <button
            onClick={() => navigate("/puzzle")}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold font-heading text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {t("startPuzzle")}
          </button>
        </div>

        <div>
          <h2 className="mb-4 text-base font-semibold font-heading text-foreground">{t("yourStats")}</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: t("puzzlesCompleted"), value: "12" },
              { label: t("currentStreak"), value: "5" },
              { label: t("bestTime"), value: "2:34" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border bg-card p-4 shadow-sm text-center">
                <div className="text-2xl font-bold font-mono text-foreground">{stat.value}</div>
                <div className="mt-1 text-xs text-muted-foreground font-heading">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
