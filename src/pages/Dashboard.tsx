import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { API_BASE } from "@/lib/config";
import AppHeader from "@/components/AppHeader";
import {
  Grid3x3,
  Search,
  Shuffle,
  Clock,
  Flame,
  Trophy,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Info,
} from "lucide-react";

type PuzzleKind = "crossword" | "wordsearch" | "unjumble";

const PUZZLE_META: Record<
  PuzzleKind,
  { icon: typeof Grid3x3; route: string; titleKey: any; descKey: any }
> = {
  crossword: { icon: Grid3x3, route: "/puzzle", titleKey: "crosswordTitle", descKey: "crosswordDesc" },
  wordsearch: { icon: Search, route: "/wordsearch", titleKey: "wordSearchTitle", descKey: "wordSearchDesc" },
  unjumble: { icon: Shuffle, route: "/unjumble", titleKey: "unjumbleTitle", descKey: "unjumbleDesc" },
};

export default function Dashboard() {
  const { t, language } = useI18n();
  const { user } = useAuth();
  const lang = language || user?.language || "en";
  const navigate = useNavigate();
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [puzzleMeta, setPuzzleMeta] = useState<{
    crossword: { puzzleId?: number; puzzleContentId?: number; slot?: number }[];
    wordsearch: { puzzleId?: number; puzzleContentId?: number; slot?: number }[];
    unjumble: { puzzleId?: number; puzzleContentId?: number; slot?: number }[];
  }>({ crossword: [], wordsearch: [], unjumble: [] });
  const [stats, setStats] = useState<{ puzzlesCompleted: number; currentStreak: number; bestTimeSeconds: number | null }>({
    puzzlesCompleted: 0,
    currentStreak: 0,
    bestTimeSeconds: null,
  });

  const getTimeUntilNextReset = useMemo(
    () => () => {
      const now = new Date();
      const stockholmNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Stockholm" }));
      const nextMidnight = new Date(stockholmNow);
      nextMidnight.setHours(24, 0, 0, 0);
      let diff = nextMidnight.getTime() - stockholmNow.getTime();
      if (diff < 0) diff += 24 * 60 * 60 * 1000;
      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
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

  const recomputeCompleted = useCallback((meta: typeof puzzleMeta) => {
    const next: Record<string, boolean> = {};
    const add = (items: { puzzleId?: number; puzzleContentId?: number }[]) => {
      items.forEach((m) => {
        const id = m.puzzleContentId || m.puzzleId;
        const token = `completed_puzzle_${id}`;
        next[token] = Boolean(localStorage.getItem(token));
      });
    };
    add(meta.crossword);
    add(meta.wordsearch);
    add(meta.unjumble);
    setCompleted(next);
  }, []);

  // Sync completion state from the backend so it persists across browsers/cache-clears.
  // Writes to localStorage so the rest of the app (which still reads it) stays in sync.
  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_BASE}/attempt/user/${user.id}/completed`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
      .then((data) => {
        const ids: number[] = Array.isArray(data?.completedPuzzleContentIds)
          ? data.completedPuzzleContentIds
          : [];
        ids.forEach((id) => {
          localStorage.setItem(`completed_puzzle_${id}`, "true");
        });
        window.dispatchEvent(new Event("storage"));
      })
      .catch((err) => console.warn("Failed to sync completed puzzles", err));
  }, [user?.id, puzzleMeta]);

  useEffect(() => {
    const onStorage = () => recomputeCompleted(puzzleMeta);
    const onCompletedEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const matches = [...puzzleMeta.crossword, ...puzzleMeta.wordsearch, ...puzzleMeta.unjumble].some(
        (m) => m.puzzleId === detail.puzzleId || m.puzzleContentId === detail.puzzleContentId
      );
      if (matches) recomputeCompleted(puzzleMeta);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("puzzle-completed", onCompletedEvent as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("puzzle-completed", onCompletedEvent as EventListener);
    };
  }, [puzzleMeta, recomputeCompleted]);

  useEffect(() => {
    fetch(`${API_BASE}/puzzle/today?lang=${lang}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
      .then((data) => {
        const toArr = (v: any) => (Array.isArray(v) ? v : v ? [v] : []);
        const filterLang = (arr: any[]) =>
          arr.filter((r) => String(r?.language || "").toLowerCase() === lang);
        const normalize = (c: any) => ({
          puzzleId: c.puzzleId || c.puzzle_id,
          puzzleContentId: c.puzzleContentId || c.puzzle_content_id,
          slot: Number(c.slot ?? 1),
        });
        const meta = {
          crossword: filterLang(toArr(data?.crossword)).map(normalize).sort((a, b) => a.slot - b.slot),
          wordsearch: filterLang(toArr(data?.wordsearch)).map(normalize).sort((a, b) => a.slot - b.slot),
          unjumble: filterLang(toArr(data?.unjumble)).map(normalize).sort((a, b) => a.slot - b.slot),
        };
        setPuzzleMeta(meta);
        recomputeCompleted(meta);
      })
      .catch(() => setPuzzleMeta({ crossword: [], wordsearch: [], unjumble: [] }));
  }, [lang, recomputeCompleted]);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_BASE}/leaderboard/user-stats/${user.id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
      .then((data) =>
        setStats({
          puzzlesCompleted: data?.puzzlesCompleted ?? 0,
          currentStreak: data?.currentStreak ?? 0,
          bestTimeSeconds: data?.bestTimeSeconds ?? null,
        })
      )
      .catch((err) => console.error("Failed to load user stats", err));
  }, [user?.id]);

  // Build flat list of all puzzles with their kind
  const allPuzzles: { kind: PuzzleKind; slot: number; id: number | undefined; token: string }[] = [];
  (Object.keys(puzzleMeta) as PuzzleKind[]).forEach((kind) => {
    puzzleMeta[kind].forEach((c, idx) => {
      const id = c.puzzleContentId || c.puzzleId;
      allPuzzles.push({
        kind,
        slot: c.slot ?? idx + 1,
        id,
        token: `completed_puzzle_${id}`,
      });
    });
  });

  const totalToday = allPuzzles.length;
  const doneToday = allPuzzles.filter((p) => completed[p.token]).length;
  const progressPct = totalToday > 0 ? Math.round((doneToday / totalToday) * 100) : 0;

  const formatBestTime = () =>
    stats.bestTimeSeconds != null
      ? `${Math.floor(stats.bestTimeSeconds / 60)}:${(stats.bestTimeSeconds % 60).toString().padStart(2, "0")}`
      : "--";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-content px-4 pt-20 pb-12">
        {/* Banner placeholder — replace with <img src="/banner.jpg" /> when ready */}
        <section className="mb-6 flex aspect-[6/1] w-full items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 text-sm font-heading text-muted-foreground">
          Banner image
        </section>

        {/* Hero / status bar */}
        <section className="relative mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative grid gap-6 p-6 md:grid-cols-[1.4fr_1fr] md:p-8">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-heading uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" />
                {t("dailyChallenge")}
              </div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                {t("welcomeBack")}{user?.name ? `, ${user.name}` : ""}.
              </h1>
              <p className="mt-1 text-sm text-muted-foreground font-body">
                {doneToday === totalToday && totalToday > 0
                  ? "All puzzles solved for today. Come back tomorrow."
                  : `You have ${totalToday - doneToday} puzzle${totalToday - doneToday === 1 ? "" : "s"} left today.`}
              </p>

              {/* Progress */}
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span>Today's progress</span>
                  <span>{doneToday}/{totalToday || 0}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Countdown */}
            <div className="flex flex-col justify-center rounded-xl border border-border bg-background/60 p-5">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-heading uppercase tracking-wider text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {t("nextPuzzleUnlocks")}
              </div>
              <div className="flex items-end gap-2 font-mono">
                {[
                  { v: timeLeft.hours, l: "H" },
                  { v: timeLeft.minutes, l: "M" },
                  { v: timeLeft.seconds, l: "S" },
                ].map((u, i) => (
                  <div key={i} className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground tabular-nums">
                      {String(u.v).padStart(2, "0")}
                    </span>
                    <span className="text-xs text-muted-foreground">{u.l}</span>
                    {i < 2 && <span className="ml-1 text-2xl text-muted-foreground/40">:</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Puzzle cards */}
        <section className="mb-10">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-heading text-base font-semibold text-foreground">{t("todaysPuzzle")}</h2>
            <span className="font-mono text-xs text-muted-foreground">
              {allPuzzles.length} puzzle{allPuzzles.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {allPuzzles.map((p) => {
              const meta = PUZZLE_META[p.kind];
              const Icon = meta.icon;
              const isDone = completed[p.token];
              return (
                <button
                  key={p.token}
                  onClick={() => navigate(`${meta.route}?puzzleContentId=${p.id}`)}
                  className={`group relative flex flex-col rounded-xl border bg-card p-5 text-left shadow-sm transition-all ${
                    isDone
                      ? "border-border hover:border-primary hover:shadow-md hover:-translate-y-0.5"
                      : "border-border hover:border-primary hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                        isDone
                          ? "bg-success/10 text-success"
                          : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                  </div>

                  <h3 className="mb-1 font-heading text-base font-semibold text-foreground">
                    {t(meta.titleKey)}
                  </h3>
                  <p className="mb-5 text-xs text-muted-foreground font-body line-clamp-2">
                    {t(meta.descKey)}
                  </p>

                  <div
                    className={`mt-auto inline-flex items-center gap-1.5 text-xs font-heading font-semibold ${
                      isDone ? "text-success" : "text-primary"
                    }`}
                  >
                    {isDone ? t("completed") : t("startPuzzle")}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              );
            })}

            {allPuzzles.length === 0 && (
              <div className="md:col-span-3 rounded-xl border border-dashed border-border bg-card p-10 text-center">
                <p className="text-sm text-muted-foreground font-body">{t("noData")}</p>
              </div>
            )}
          </div>
        </section>

        {/* Stats */}
        <section>
          <h2 className="mb-4 font-heading text-base font-semibold text-foreground">{t("yourStats")}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: t("puzzlesCompleted"), value: String(stats.puzzlesCompleted ?? 0), Icon: Trophy },
              { label: t("currentStreak"), value: String(stats.currentStreak ?? 0), Icon: Flame },
              { label: t("bestTime"), value: formatBestTime(), Icon: Clock },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <stat.Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-mono text-2xl font-bold text-foreground tabular-nums">{stat.value}</div>
                  <div className="text-xs text-muted-foreground font-heading">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="my-12 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {t("rules")}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* How it works (contrasting block) */}
        <section className="rounded-2xl bg-muted/40 p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Info className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">
                {t("howCyberMazeWorks")}
              </h2>
              <p className="text-xs text-muted-foreground font-body">
                {t("howCyberMazeWorksSub")}
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { Icon: Sparkles, title: t("rulesOnePuzzleTitle"), body: t("rulesOnePuzzleBody") },
              { Icon: Clock, title: t("rulesResetTitle"), body: t("rulesResetBody") },
              { Icon: Clock, title: t("rulesTimerTitle"), body: t("rulesTimerBody") },
              { Icon: CheckCircle2, title: t("rulesReviewTitle"), body: t("rulesReviewBody") },
              { Icon: Grid3x3, title: t("rulesHintsTitle"), body: t("rulesHintsBody") },
              { Icon: Trophy, title: t("rulesPlayDailyTitle"), body: t("rulesPlayDailyBody") },
            ].map(({ Icon, title, body }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-background p-4"
              >
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mb-1 font-heading text-sm font-semibold text-foreground">
                  {title}
                </h3>
                <p className="text-xs text-muted-foreground font-body leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Stale-data hint */}
        <footer className="mt-10 text-center">
          <p className="text-xs text-muted-foreground font-body italic">
            {t("staleHint")}
          </p>
        </footer>
      </main>
    </div>
  );
}
