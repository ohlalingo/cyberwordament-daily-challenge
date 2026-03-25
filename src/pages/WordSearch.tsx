import { useState, useCallback, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import AppHeader from "@/components/AppHeader";
import { sampleWordSearch } from "@/lib/wordsearch-data";
import { API_BASE } from "@/lib/config";

type Coord = [number, number];

export default function WordSearch() {
  const { t, language } = useI18n();
  const { user } = useAuth();
  // Prefer current UI language over stored user language
  const lang = language || user?.language || "en";
  const [puzzle, setPuzzle] = useState(sampleWordSearch);
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const requestedId = searchParams.get("puzzleContentId");
  const TOTAL_TIME = 600;
  const [seconds, setSeconds] = useState(TOTAL_TIME);
  const [completed, setCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasPuzzle, setHasPuzzle] = useState(false);

  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState(false);
  const [selection, setSelection] = useState<Coord[]>([]);
  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set());
  const [lastFoundCells, setLastFoundCells] = useState<Set<string>>(new Set());
  const gridRef = useRef<HTMLDivElement>(null);

  const coordKey = (r: number, c: number) => `${r},${c}`;

  const startSelect = useCallback((r: number, c: number) => {
    if (completed || seconds === 0) return;
    setSelecting(true);
    setSelection([[r, c]]);
  }, [completed, seconds]);

  const moveSelect = useCallback(
    (r: number, c: number) => {
      if (!selecting || completed || seconds === 0) return;
      const start = selection[0];
      if (!start) return;
      const [sr, sc] = start;
      const dr = Math.sign(r - sr);
      const dc = Math.sign(c - sc);
      if (dr !== 0 && dc !== 0 && Math.abs(r - sr) !== Math.abs(c - sc)) return;
      if (dr === 0 && dc === 0) { setSelection([start]); return; }

      const cells: Coord[] = [];
      let cr = sr, cc = sc;
      while (true) {
        cells.push([cr, cc]);
        if (cr === r && cc === c) break;
        cr += dr;
        cc += dc;
        if (cr < 0 || cr >= puzzle.gridSize || cc < 0 || cc >= puzzle.gridSize) break;
      }
      setSelection(cells);
    },
    [selecting, selection, puzzle.gridSize, completed, seconds]
  );

  const handleComplete = useCallback(async (correctWords: number) => {
    if (completed) return;
    setCompleted(true);
    const timeTaken = TOTAL_TIME - seconds;
    const puzzleContentId = Number((puzzle as any)?.puzzleContentId);
    const userId = Number((user as any)?.id);
    if (!puzzleContentId || !userId) {
      console.error("🚨 Missing puzzleContentId — attempt NOT saved");
      return;
    }
    const completionKey = `completed_puzzle_${puzzleContentId ?? (puzzle as any)?.puzzleId}`;
    const puzzleId = (puzzle as any)?.puzzleId;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId,
          puzzleContentId,
          correctWords,
          timeTaken,
        }),
      });
      if (res.ok) {
        localStorage.setItem(completionKey, "true");
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(
          new CustomEvent("puzzle-completed", { detail: { puzzleId, puzzleContentId } })
        );
      } else if (res.status === 409) {
        console.warn("Attempt already recorded for this puzzle; marking as completed.");
        localStorage.setItem(completionKey, "true");
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(
          new CustomEvent("puzzle-completed", { detail: { puzzleId, puzzleContentId } })
        );
      }
    } catch (err) {
      console.error("Failed to save wordsearch attempt", err);
    }
  }, [puzzle, seconds, completed, user]);

  const endSelect = useCallback(() => {
    if (!selecting || completed || seconds === 0) return;
    setSelecting(false);

    const selectedWord = selection.map(([r, c]) => puzzle.grid?.[r]?.[c]).join("");
    const reversed = [...selection].reverse().map(([r, c]) => puzzle.grid?.[r]?.[c]).join("");

    const wordsArr = Array.isArray(puzzle.words) ? puzzle.words : [];
    const match = wordsArr.find((w) => w.word === selectedWord || w.word === reversed);
    if (match && !foundWords.has(match.word)) {
      const newCells = new Set<string>();
      const newFound = new Set(foundWords);
      newFound.add(match.word);
      setFoundWords(newFound);
      setHighlightedCells((prev) => {
        const next = new Set(prev);
        for (const [r, c] of selection) {
          next.add(coordKey(r, c));
          newCells.add(coordKey(r, c));
        }
        return next;
      });
      setLastFoundCells(newCells);
      setTimeout(() => setLastFoundCells(new Set()), 600);

      if (newFound.size === wordsArr.length) {
        handleComplete(newFound.size);
        setShowCelebration(true);
      }
    }
    setSelection([]);
  }, [selecting, selection, puzzle, foundWords, completed, seconds, handleComplete]);

  const isSelected = (r: number, c: number) => selection.some(([sr, sc]) => sr === r && sc === c);
  const isHighlighted = (r: number, c: number) => highlightedCells.has(coordKey(r, c));
  const isJustFound = (r: number, c: number) => lastFoundCells.has(coordKey(r, c));
  const wordsArray = Array.isArray(puzzle.words) ? puzzle.words : [];
  const allFound = foundWords.size === wordsArray.length;

  const getCellDelay = (ri: number, ci: number) => (ri * puzzle.gridSize + ci) * 15;

  useEffect(() => {
    if (completed) return;
    const interval = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(interval);
  }, [completed]);

  useEffect(() => {
    if (!completed && seconds === 0) {
      handleComplete(foundWords.size);
    }
  }, [seconds, completed, foundWords.size, handleComplete]);

  useEffect(() => {
    const url = `${API_BASE}/puzzle/today?lang=${lang}&t=${Date.now()}`;
    fetch(url, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
      .then((data) => {
        const wordsearch = data?.wordsearch?.[0];
        if (!wordsearch || !Array.isArray(wordsearch.grid) || !Array.isArray(wordsearch.words)) {
          setHasPuzzle(false);
          return;
        }
        const chosen =
          (requestedId
            ? Array.isArray(data?.wordsearch)
              ? data.wordsearch.find((c: any) => String(c.puzzleContentId ?? c.puzzle_content_id) === requestedId)
              : null
            : null) || wordsearch;
        if (!Array.isArray(chosen?.grid) || !Array.isArray(chosen?.words)) {
          setHasPuzzle(false);
          return;
        }
        const ws = {
          ...chosen,
          grid: chosen.grid,
          words: chosen.words,
          puzzleContentId: chosen.puzzleContentId ?? chosen.puzzle_content_id,
        };
        setPuzzle(ws);
        setHasPuzzle(true);
      })
      .catch((err) => {
        console.error("🚨 Wordsearch fetch FAILED:", err);
        setHasPuzzle(false);
        setLoading(false);
      });
  }, [lang]);

  // Reset state when a new puzzle loads
  useEffect(() => {
    if (!puzzle?.grid || !Array.isArray(puzzle.words)) return;
    setFoundWords(new Set());
    setHighlightedCells(new Set());
    setLastFoundCells(new Set());
    setSelection([]);
    setCompleted(false);
    setSeconds(TOTAL_TIME);
    setShowCelebration(false);
  }, [(puzzle as any).puzzleContentId, puzzle.gridSize, puzzle.grid]);

  if (
    !puzzle?.grid ||
    puzzle.grid.length !== puzzle.gridSize ||
    !Array.isArray(puzzle.words)
  ) {
    return (
      <div className="text-center p-4">
        Puzzle unavailable. Please try again.
      </div>
    );
  }

  console.log("PUZZLE DATA:", puzzle);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-content px-4 pt-20 pb-12">
        <div className="mb-4">
          <h1 className="text-xl font-bold font-heading text-foreground">{t("todaysPuzzle")}</h1>
          <p className="text-sm text-muted-foreground">{t("wordSearchPlayDesc")}</p>
        </div>
        {loading ? null : !hasPuzzle ? (
          <div className="text-center text-sm text-muted-foreground">No puzzle available today.</div>
        ) : (
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-heading text-foreground">{t("wordSearchTitle")}</h1>
            <p className="text-xs text-muted-foreground">
              {t("wordSearchDesc")}
            </p>
          </div>
          <div className="text-sm font-mono text-muted-foreground">
            {foundWords.size}/{puzzle.words.length} found • {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, "0")}
          </div>
        </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Grid */}
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div
              ref={gridRef}
              className="inline-grid select-none"
              style={{ gridTemplateColumns: `repeat(${puzzle.gridSize}, 1fr)` }}
              onMouseLeave={endSelect}
            >
              {puzzle.grid.map((row, ri) =>
                row.map((letter, ci) => (
                  <div
                    key={`${ri}-${ci}`}
                    onMouseDown={(e) => { e.preventDefault(); startSelect(ri, ci); }}
                    onMouseEnter={() => moveSelect(ri, ci)}
                    onMouseUp={endSelect}
                    className={`flex h-8 w-8 cursor-pointer items-center justify-center font-mono text-sm font-bold transition-all duration-200 animate-cell-pop ${
                      isJustFound(ri, ci)
                        ? "bg-success text-success-foreground scale-110"
                        : isHighlighted(ri, ci)
                        ? "bg-success text-success-foreground"
                        : isSelected(ri, ci)
                        ? "bg-primary text-primary-foreground scale-105"
                        : "text-foreground hover:bg-muted hover:scale-105"
                    }`}
                    style={{ animationDelay: `${getCellDelay(ri, ci)}ms` }}
                  >
                    {letter}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Word list */}
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm animate-slide-up" style={{ animationDelay: "150ms" }}>
            <h3 className="mb-3 text-sm font-semibold font-heading text-foreground">Words to Find</h3>
            <ul className="space-y-3">
              {puzzle.words.map((w) => (
                <li key={w.word} className="flex items-center gap-3 transition-all duration-300">
                  <span
                    className={`font-mono text-sm font-bold transition-all duration-500 ${
                      foundWords.has(w.word) ? "text-success line-through scale-95 opacity-70" : "text-foreground"
                    }`}
                  >
                    {w.word}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    — {lang === "ja" ? (w as any).hintJa ?? w.hint : w.hint}
                  </span>
                  {foundWords.has(w.word) && (
                    <span className="animate-celebrate text-sm">✓</span>
                  )}
                </li>
              ))}
            </ul>
            {allFound && (
              <div className="mt-6 rounded-lg bg-success/10 p-3 text-center text-sm font-semibold text-success animate-celebrate">
                🎉 All words found!
              </div>
            )}
          </div>
        </div>

        {showCelebration && (
          <div className="fixed inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-50 animate-fade-in">
            <div className="rounded-xl bg-card border border-border shadow-lg px-6 py-5 text-center space-y-2">
              <div className="text-3xl">🎉</div>
              <div className="text-lg font-semibold text-foreground">All words found!</div>
              <button
                onClick={() => setShowCelebration(false)}
                className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
