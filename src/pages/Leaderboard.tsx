import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import AppHeader from "@/components/AppHeader";

const regionKeys = ["global", "japan", "emea", "aej", "americas", "india"] as const;

function formatTime(seconds: number) {
  if (seconds == null || Number.isNaN(seconds)) return "-";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Leaderboard() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<string>("global");
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const api =
      import.meta.env.VITE_API_BASE ||
      import.meta.env.VITE_API_URL ||
      "http://13.60.205.129:3000";
    fetch(`${api}/leaderboard`)
      .then((res) => res.json())
      .then((res) => setData(res))
      .catch((err) => console.error("Leaderboard error:", err));
  }, []);

  const filtered =
    activeTab === "global"
      ? data
      : data.filter((d) => (d.region || "").toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-content px-4 pt-20 pb-12">
        <h1 className="mb-6 text-xl font-bold font-heading text-foreground">{t("leaderboard")}</h1>

        <div className="mb-4 flex gap-1 border-b border-border">
          {regionKeys.map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-2 text-sm font-medium font-heading transition-colors border-b-2 -mb-px ${
                activeTab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(key)}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold font-heading text-muted-foreground">{t("rank")}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold font-heading text-muted-foreground">{t("playerName")}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold font-heading text-muted-foreground">{t("region")}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold font-heading text-muted-foreground">{t("score")}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold font-heading text-muted-foreground">{t("time")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-sm font-mono text-foreground">{i + 1}</td>
                  <td className="px-4 py-3 text-sm font-body text-foreground">{row.name}</td>
                  <td className="px-4 py-3 text-sm font-body text-muted-foreground">{row.region}</td>
                  <td className="px-4 py-3 text-sm font-mono text-foreground text-right">{row.score}</td>
                  <td className="px-4 py-3 text-sm font-mono text-muted-foreground text-right">
                    {formatTime(row.time)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
