import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import AppHeader from "@/components/AppHeader";

function formatTime(seconds: number) {
  if (seconds == null || Number.isNaN(seconds)) return "-";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Champions() {
  const { t } = useI18n();
  const [champions, setChampions] = useState<any[]>([]);

  useEffect(() => {
    const api =
      import.meta.env.VITE_API_BASE ||
      import.meta.env.VITE_API_URL ||
      "http://13.60.205.129:3000";
    fetch(`${api}/regional-champions`)
      .then((res) => res.json())
      .then(setChampions)
      .catch((err) => console.error("Champions error:", err));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-content px-4 pt-20 pb-12">
        <h1 className="mb-6 text-xl font-bold font-heading text-foreground">{t("regionalChampions")}</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          {champions.map((c) => (
            <div key={c.region} className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="mb-1 text-xs font-semibold font-heading text-primary uppercase tracking-wider">
                {t(c.region as any)} {t("champion")}
              </div>
              <div className="text-lg font-bold font-heading text-foreground">{c.name}</div>
              <div className="mt-3 flex gap-6">
                <div>
                  <div className="text-xs text-muted-foreground font-heading">{t("score")}</div>
                  <div className="text-sm font-mono font-semibold text-foreground">{c.score}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-heading">{t("completionTime")}</div>
                  <div className="text-sm font-mono font-semibold text-foreground">{formatTime(c.time)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
