import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/lib/config";
import AppHeader from "@/components/AppHeader";



export default function Dashboard() {
  const { t, language } = useI18n();
  const { user } = useAuth();
  // Prefer current UI language; fall back to user preference then English
  const lang = language || user?.language || "en";
  const navigate = useNavigate();
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [puzzleMeta, setPuzzleMeta] = useState<{
    crossword: { puzzleId?: number; puzzleContentId?: number }[];
    wordsearch: { puzzleId?: number; puzzleContentId?: number }[];
    unjumble: { puzzleId?: number; puzzleContentId?: number }[];
  }>({ crossword: [], wordsearch: [], unjumble: [] });
  const [stats, setStats] = useState<{ puzzlesCompleted: number; currentStreak: number; bestTimeSeconds: number | null }>({
    puzzlesCompleted: 0,
    currentStreak: 0,
    bestTimeSeconds: null,
  });

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

  // Helper to recompute completion flags from localStorage and latest puzzle ids
  const recomputeCompleted = useCallback((meta: typeof puzzleMeta) => {
    const next: Record<string, boolean> = {};
    const add = (key: string, items: { puzzleId?: number; puzzleContentId?: number }[]) => {
      items.forEach((m) => {
        const id = m.puzzleContentId || m.puzzleId; // prefer contentId so multiple slots per day stay independent
        const token = `completed_puzzle_${id}`;
        next[token] = Boolean(localStorage.getItem(token));
      });
    };
    add("crossword", meta.crossword);
    add("wordsearch", meta.wordsearch);
    add("unjumble", meta.unjumble);
    setCompleted(next);
  }, []);

  useEffect(() => {
    const onStorage = () => recomputeCompleted(puzzleMeta);
    const onCompletedEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const meta = puzzleMeta;
      const matches = [...meta.crossword, ...meta.wordsearch, ...meta.unjumble].some(
        (m) => m.puzzleId === detail.puzzleId || m.puzzleContentId === detail.puzzleContentId
      );
      if (matches) recomputeCompleted(meta);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("puzzle-completed", onCompletedEvent as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("puzzle-completed", onCompletedEvent as EventListener);
    };
  }, [puzzleMeta, recomputeCompleted]);

  useEffect(() => {
    const api = API_BASE;
    fetch(`${api}/puzzle/today?lang=${lang}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
      .then((data) => {
        const cwArrRaw = Array.isArray(data?.crossword) ? data.crossword : data?.crossword ? [data.crossword] : [];
        const wsArrRaw = Array.isArray(data?.wordsearch) ? data.wordsearch : data?.wordsearch ? [data.wordsearch] : [];
        const ujArrRaw = Array.isArray(data?.unjumble) ? data.unjumble : data?.unjumble ? [data.unjumble] : [];

        // Keep only puzzles in the requested language to avoid fallback rows showing up
        const filterLang = (arr: any[]) =>
          arr.filter((r) => String(r?.language || "").toLowerCase() === lang);
        const cwArr = filterLang(cwArrRaw);
        const wsArr = filterLang(wsArrRaw);
        const ujArr = filterLang(ujArrRaw);
        const normalize = (c: any) => ({
          puzzleId: c.puzzleId || c.puzzle_id,
          puzzleContentId: c.puzzleContentId || c.puzzle_content_id,
          slot: Number(c.slot ?? 1),
        });
        const meta = {
          crossword: cwArr.map(normalize).sort((a, b) => a.slot - b.slot),
          wordsearch: wsArr.map(normalize).sort((a, b) => a.slot - b.slot),
          unjumble: ujArr.map(normalize).sort((a, b) => a.slot - b.slot),
        };
        setPuzzleMeta(meta);
        recomputeCompleted(meta);
      })
      .catch(() => {
        setPuzzleMeta({ crossword: [], wordsearch: [], unjumble: [] });
      });
  }, [lang, recomputeCompleted]);

  // Fetch user stats
  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_BASE}/leaderboard/user-stats/${user.id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
      .then((data) => {
        setStats({
          puzzlesCompleted: data?.puzzlesCompleted ?? 0,
          currentStreak: data?.currentStreak ?? 0,
          bestTimeSeconds: data?.bestTimeSeconds ?? null,
        });
      })
      .catch((err) => console.error("Failed to load user stats", err));
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-content px-4 pt-20 pb-12">

        <p className="mb-8 text-sm text-muted-foreground font-body text-center">
          {t("welcomeBack")}, {user?.name}
        </p>
        <p className="mb-8 text-xs text-muted-foreground font-mono text-center">
          {t("nextPuzzleUnlocks")}{" "}
          {String(timeLeft.hours).padStart(2, "0")}h:
          {String(timeLeft.minutes).padStart(2, "0")}m:
          {String(timeLeft.seconds).padStart(2, "0")}s
        </p>

        {/* Puzzle type cards (supports multiple slots) */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {puzzleMeta.crossword.map((c, idx) => {
            const labelNum = c.slot ?? idx + 1;
            const token = `completed_puzzle_${c.puzzleContentId || c.puzzleId}`;
            const isDone = completed[token];
            return (
              <div key={token} className="rounded-lg border border-border bg-card p-5 shadow-sm flex flex-col">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold font-mono">
                    {labelNum}
                  </span>
                  <h2 className="text-sm font-semibold font-heading text-foreground">
                    {t("crosswordTitle")}
                  </h2>
                </div>
                <p className="mb-4 text-xs text-muted-foreground font-body flex-1">
                  {t("crosswordDesc")}
                </p>
                <button
                  onClick={() => navigate(`/puzzle?puzzleContentId=${c.puzzleContentId || c.puzzleId}`)}
                  disabled={isDone}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold font-heading w-full transition-opacity ${
                    isDone ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:opacity-90"
                  }`}
                >
                  {isDone ? t("completed").replace(/^./, (ch) => ch.toUpperCase()) : t("startPuzzle")}
                </button>
              </div>
            );
          })}

          {puzzleMeta.wordsearch.map((c, idx) => {
            const labelNum = c.slot ?? idx + 1;
            const token = `completed_puzzle_${c.puzzleContentId || c.puzzleId}`;
            const isDone = completed[token];
            return (
              <div key={token} className="rounded-lg border border-border bg-card p-5 shadow-sm flex flex-col">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold font-mono">
                    {labelNum}
                  </span>
                  <h2 className="text-sm font-semibold font-heading text-foreground">
                    {t("wordSearchTitle")}
                  </h2>
                </div>
                <p className="mb-4 text-xs text-muted-foreground font-body flex-1">
                  {t("wordSearchDesc")}
                </p>
                <button
                  onClick={() => navigate(`/wordsearch?puzzleContentId=${c.puzzleContentId || c.puzzleId}`)}
                  disabled={isDone}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold font-heading w-full transition-opacity ${
                    isDone ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:opacity-90"
                  }`}
                >
                  {isDone ? t("completed").replace(/^./, (ch) => ch.toUpperCase()) : t("startPuzzle")}
                </button>
              </div>
            );
          })}

          {puzzleMeta.unjumble.map((c, idx) => {
            const labelNum = c.slot ?? idx + 1;
            const token = `completed_puzzle_${c.puzzleContentId || c.puzzleId}`;
            const isDone = completed[token];
            return (
              <div key={token} className="rounded-lg border border-border bg-card p-5 shadow-sm flex flex-col">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold font-mono">
                    {labelNum}
                  </span>
                  <h2 className="text-sm font-semibold font-heading text-foreground">
                    {t("unjumbleTitle")}
                  </h2>
                </div>
                <p className="mb-4 text-xs text-muted-foreground font-body flex-1">
                  {t("unjumbleDesc")}
                </p>
                <button
                  onClick={() => navigate(`/unjumble?puzzleContentId=${c.puzzleContentId || c.puzzleId}`)}
                  disabled={isDone}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold font-heading w-full transition-opacity ${
                    isDone ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:opacity-90"
                  }`}
                >
                  {isDone ? t("completed").replace(/^./, (ch) => ch.toUpperCase()) : t("startPuzzle")}
                </button>
              </div>
            );
          })}
        </div>

        <div>
          <h2 className="mb-4 text-base font-semibold font-heading text-foreground">{t("yourStats")}</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: t("puzzlesCompleted"), value: String(stats.puzzlesCompleted ?? 0) },
              { label: t("currentStreak"), value: String(stats.currentStreak ?? 0) },
              {
                label: t("bestTime"),
                value:
                  stats.bestTimeSeconds != null
                    ? `${Math.floor(stats.bestTimeSeconds / 60)}:${(stats.bestTimeSeconds % 60)
                        .toString()
                        .padStart(2, "0")}`
                    : "--",
              },
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
