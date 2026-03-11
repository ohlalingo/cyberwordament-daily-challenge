import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import AppHeader from "@/components/AppHeader";

const mockData = [
  { rank: 1, name: "Tanaka Yuki", region: "Japan", score: 100, time: "1:45" },
  { rank: 2, name: "Sarah Chen", region: "APAC", score: 100, time: "2:01" },
  { rank: 3, name: "James Wilson", region: "Americas", score: 95, time: "2:15" },
  { rank: 4, name: "Maria Schmidt", region: "Europe", score: 95, time: "2:34" },
  { rank: 5, name: "Kenji Suzuki", region: "Japan", score: 90, time: "1:58" },
  { rank: 6, name: "Ahmed Hassan", region: "Middle East", score: 90, time: "2:45" },
  { rank: 7, name: "Li Wei", region: "APAC", score: 85, time: "3:02" },
  { rank: 8, name: "Emily Brown", region: "Americas", score: 85, time: "3:15" },
];

const regionKeys = ["global", "japan", "apac", "americas", "europe"] as const;

export default function Leaderboard() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<string>("global");

  const filtered = activeTab === "global"
    ? mockData
    : mockData.filter((d) => d.region.toLowerCase() === activeTab.toLowerCase() ||
        (activeTab === "japan" && d.region === "Japan") ||
        (activeTab === "apac" && d.region === "APAC") ||
        (activeTab === "americas" && d.region === "Americas") ||
        (activeTab === "europe" && d.region === "Europe")
      );

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
                  <td className="px-4 py-3 text-sm font-mono text-foreground">{row.rank}</td>
                  <td className="px-4 py-3 text-sm font-body text-foreground">{row.name}</td>
                  <td className="px-4 py-3 text-sm font-body text-muted-foreground">{row.region}</td>
                  <td className="px-4 py-3 text-sm font-mono text-foreground text-right">{row.score}</td>
                  <td className="px-4 py-3 text-sm font-mono text-muted-foreground text-right">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
