import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { API_BASE } from "@/lib/config";
import AppHeader from "@/components/AppHeader";
import { Trophy } from "lucide-react";

function formatTime(seconds: number) {
  if (seconds == null || Number.isNaN(seconds)) return "-";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Champions() {
  const { t } = useI18n();
  const [data, setData] = useState<{ today: any[]; week: any[]; allTime: any[] }>({
    today: [],
    week: [],
    allTime: [],
  });

  useEffect(() => {
    const api = API_BASE;
    fetch(`${api}/leaderboard/regional-champions`)
      .then((res) => res.json())
      .then((res) => setData({ today: res.today || [], week: res.week || [], allTime: res.allTime || [] }))
      .catch((err) => console.error("Champions error:", err));
  }, []);

  const renderSection = (title: string, rows: any[]) => (
    <section className="mb-10">
      <div className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Trophy className="h-5 w-5 text-primary" />
        <span>{title}</span>
      </div>
      {!rows.length ? (
        <div className="text-sm text-muted-foreground">{t("noData") || "No champions yet."}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {rows.map((c) => (
            <div key={`${title}-${c.region}`} className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="mb-1 text-xs font-semibold font-heading text-primary uppercase tracking-wider">
                {c.region}
              </div>
              <div className="text-lg font-bold font-heading text-foreground">{c.name}</div>
              <div className="mt-2 text-sm text-muted-foreground font-body">
                <div>Score: {c.score}</div>
                <div>⏱ {formatTime(c.time)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-content px-4 pt-20 pb-12">
        <h1 className="mb-6 text-xl font-bold font-heading text-foreground">{t("regionalChampions")}</h1>
        {renderSection("Today", data.today)}
        {renderSection("This Week", data.week)}
        {renderSection("All Time", data.allTime)}
      </main>
    </div>
  );
}
