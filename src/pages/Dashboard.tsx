import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import AppHeader from "@/components/AppHeader";



export default function Dashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [puzzleCompleted, setPuzzleCompleted] = useState<boolean>(false);
  const [available, setAvailable] = useState<{ crossword?: boolean; wordsearch?: boolean; unjumble?: boolean }>({});

  const getTimeUntilNextReset = useMemo(
    () => () => {
      const now = new Date();
      // Convert to Stockholm time by re-parsing a localized string
      const stockholmNow = new Date(
        now.toLocaleString("en-US", { timeZone: "Europe/Stockholm" })
      );
      const nextMidnight = new Date(stockholmNow);
      nextMidnight.setHours(24, 0, 0, 0);
      let diff = nextMidnight.getTime() - stockholmNow.getTime();
      if (diff < 0) diff += 24 * 60 * 60 * 1000; // safety

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      return {
        hours,
        minutes,
        seconds,
        totalMs: diff,
      };
    },
    []
  );

  const [timeLeft, setTimeLeft] = useState(getTimeUntilNextReset());

  useEffect(() => {
    const id = setInterval(() => {
      const next = getTimeUntilNextReset();
      if (next.totalMs <= 0) {
        window.location.reload();
        return;
      }
      setTimeLeft(next);
    }, 1000);
    return () => clearInterval(id);
  }, [getTimeUntilNextReset]);

  useEffect(() => {
    const flag = localStorage.getItem("puzzle_completed");
    setPuzzleCompleted(flag === "true");
    const onStorage = (e: StorageEvent) => {
      if (e.key === "puzzle_completed") {
        setPuzzleCompleted(e.newValue === "true");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const api =
      import.meta.env.VITE_API_BASE ||
      import.meta.env.VITE_API_URL ||
      "http://13.60.205.129:3000";
    fetch(`${api}/puzzle/today?lang=en`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
      .then((data) => {
        setAvailable({
          crossword: Boolean(data?.crossword),
          wordsearch: Boolean(data?.wordsearch),
          unjumble: Boolean(data?.unjumble),
        });
      })
      .catch(() => {
        setAvailable({});
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-content px-4 pt-20 pb-12">

        <p className="mb-8 text-sm text-muted-foreground font-body text-center">
          {t("welcomeBack")}, {user?.name}
        </p>
        <p className="mb-8 text-xs text-muted-foreground font-mono text-center">
          Next puzzle unlocks in{" "}
          {String(timeLeft.hours).padStart(2, "0")}h:
          {String(timeLeft.minutes).padStart(2, "0")}m:
          {String(timeLeft.seconds).padStart(2, "0")}s
        </p>

        {/* Puzzle type cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {available.crossword && (
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm flex flex-col">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold font-mono">1</span>
              <h2 className="text-sm font-semibold font-heading text-foreground">Crossword</h2>
            </div>
            <p className="mb-4 text-xs text-muted-foreground font-body flex-1">Fill in the grid using cybersecurity clues.</p>
            <button
              onClick={() => navigate("/puzzle")}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold font-heading text-primary-foreground hover:opacity-90 transition-opacity w-full"
            >
              {puzzleCompleted ? t("completed") : t("startPuzzle")}
            </button>
          </div>
          )}

          {available.wordsearch && (
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm flex flex-col">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold font-mono">2</span>
              <h2 className="text-sm font-semibold font-heading text-foreground">Word Search</h2>
            </div>
            <p className="mb-4 text-xs text-muted-foreground font-body flex-1">Find hidden cybersecurity words in the grid.</p>
            <button
              onClick={() => navigate("/wordsearch")}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold font-heading text-primary-foreground hover:opacity-90 transition-opacity w-full"
            >
              {t("startPuzzle")}
            </button>
          </div>
          )}

          {available.unjumble && (
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm flex flex-col">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold font-mono">3</span>
              <h2 className="text-sm font-semibold font-heading text-foreground">Unjumble</h2>
            </div>
            <p className="mb-4 text-xs text-muted-foreground font-body flex-1">Rearrange scrambled letters to form security terms.</p>
            <button
              onClick={() => navigate("/unjumble")}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold font-heading text-primary-foreground hover:opacity-90 transition-opacity w-full"
            >
              {t("startPuzzle")}
            </button>
          </div>
          )}
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
