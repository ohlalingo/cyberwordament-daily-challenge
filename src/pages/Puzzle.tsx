import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import AppHeader from "@/components/AppHeader";
import { samplePuzzle, buildGrid, CellState } from "@/lib/puzzle-data";
import { API_BASE } from "@/lib/config";

export default function Puzzle() {
  const { t, language } = useI18n();
  const { user, isHydrated, signOut } = useAuth();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const requestedId = searchParams.get("puzzleContentId");
  const lang = user?.language || language || "en";
  const [puzzle, setPuzzle] = useState(samplePuzzle);
  const [hasPuzzle, setHasPuzzle] = useState(false);
  const [loading, setLoading] = useState(true);
  const { grid, numbers } = useMemo(() => buildGrid(puzzle), [puzzle]);

  const [userInput, setUserInput] = useState<string[][]>(() =>
    Array.from({ length: puzzle.gridSize }, () => Array(puzzle.gridSize).fill(""))
  );
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [cellStates, setCellStates] = useState<CellState[][]>(() =>
    Array.from({ length: puzzle.gridSize }, () => Array(puzzle.gridSize).fill("empty"))
  );
  const [submitted, setSubmitted] = useState(false);
  const TOTAL_TIME = 600;
  const [seconds, setSeconds] = useState(TOTAL_TIME);
  const [bouncingCell, setBouncingCell] = useState<string | null>(null);
  const [activeClue, setActiveClue] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[][]>(
    Array.from({ length: puzzle.gridSize }, () => Array(puzzle.gridSize).fill(null))
  );

  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(interval);
  }, [submitted]);

  // Auto-submit/lock when timer hits zero
  useEffect(() => {
    if (!submitted && seconds === 0) {
      handleSubmit();
    }
  }, [seconds, submitted]);

  const handlePuzzleComplete = async (correctWords: number) => {
    const timeTaken = TOTAL_TIME - seconds;
    const puzzleContentId = Number((puzzle as any)?.puzzleContentId);
    const userId = Number(user?.id);
    if (!puzzleContentId || !userId) {
      console.error("🚨 Missing puzzleContentId — attempt NOT saved");
      return;
    }
        const completionKey = `completed_puzzle_${(puzzle as any)?.puzzleId ?? puzzleContentId}`;
        const altCompletionKey = `completed_puzzle_${puzzleContentId}`;
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
        console.log("✅ Attempt saved");
        localStorage.setItem(completionKey, "true");
        localStorage.setItem(altCompletionKey, "true");
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(
          new CustomEvent("puzzle-completed", { detail: { puzzleId, puzzleContentId } })
        );
      } else if (res.status === 409) {
        // Already completed in another language/session — treat as completed/locked
        setSubmitted(true);
        setShowCelebration(false);
        console.warn("Attempt already recorded for this puzzle; marking as completed.");
        localStorage.setItem(completionKey, "true");
        localStorage.setItem(altCompletionKey, "true");
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(
          new CustomEvent("puzzle-completed", { detail: { puzzleId, puzzleContentId } })
        );
      } else {
        console.error("❌ Attempt save failed", res.status);
      }
    } catch (err) {
      console.error("❌ Failed to save attempt", err);
    }
  };

  useEffect(() => {
    if (!isHydrated) return;
    const preferredLang = lang || "en";

    fetch(`${API_BASE}/puzzle/today?lang=${preferredLang}&t=${Date.now()}`)
      .then((res) => {
        if (res.status === 401) {
          signOut();
          navigate("/");
          throw new Error("Unauthorized");
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const crossArr = Array.isArray(data?.crossword) ? data.crossword : data?.crossword ? [data.crossword] : [];
        const first = crossArr[0];
        if (first) {
        const chosen = requestedId
          ? crossArr.find((c: any) => String(c.puzzleContentId ?? c.puzzle_content_id) === requestedId)
          : first;
        const cw = {
          ...chosen,
          puzzleContentId: chosen.puzzleContentId ?? chosen.puzzle_content_id,
          // Normalize word fields so UI always has clue/clueJa even if API sends hint/hintJa
          words: (chosen.words || []).map((w: any) => ({
            ...w,
            clue: w.clue ?? w.hint ?? "",
            clueJa: w.clueJa ?? w.hintJa ?? w.clue ?? w.hint ?? "",
          })),
        };
          setPuzzle(cw);
          setHasPuzzle(true);
        } else {
          console.warn("Puzzle fetch succeeded but no crossword in payload");
          setHasPuzzle(false);
        }
      })
      .catch((err) => {
        console.warn("Puzzle fetch failed:", err);
        setHasPuzzle(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isHydrated, lang, navigate, signOut]);

  // Reset grid-dependent state whenever we load a fresh puzzle (size/content may change).
  useEffect(() => {
    const size = puzzle.gridSize;
    setUserInput(Array.from({ length: size }, () => Array(size).fill("")));
    setCellStates(Array.from({ length: size }, () => Array(size).fill("empty")));
    setSelectedCell(null);
    setActiveClue(null);
    setSubmitted(false);
    setSeconds(TOTAL_TIME);
    setShowCelebration(false);
  }, [puzzle.puzzleContentId, puzzle.gridSize, TOTAL_TIME]);

  // If today's puzzle is already completed, bounce back to dashboard
  useEffect(() => {
    const completionKey = `completed_puzzle_${(puzzle as any)?.puzzleId ?? (puzzle as any)?.puzzleContentId}`;
    if (completionKey && localStorage.getItem(completionKey)) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, puzzle.puzzleId, puzzle.puzzleContentId]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // Find which clue a cell belongs to
  const findClueForCell = useCallback(
    (row: number, col: number) => {
      for (const word of puzzle.words) {
        for (let i = 0; i < word.word.length; i++) {
          const r = word.direction === "across" ? word.row : word.row + i;
          const c = word.direction === "across" ? word.col + i : word.col;
          if (r === row && c === col) return word.number;
        }
      }
      return null;
    },
    [puzzle.words]
  );

  const handleCellChange = useCallback(
    (row: number, col: number, value: string) => {
      if (submitted || grid[row][col] === null) return;
      const char = value.toUpperCase().slice(-1);
      setUserInput((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = char;
        return next;
      });
      // Bounce animation on type
      if (char) {
        setBouncingCell(`${row},${col}`);
        setTimeout(() => setBouncingCell(null), 200);
        requestAnimationFrame(() => {
          for (let nc = col + 1; nc < puzzle.gridSize; nc++) {
            if (grid[row]?.[nc] !== null) {
              setSelectedCell([row, nc]);
              inputRefs.current[row]?.[nc]?.focus();
              break;
            }
          }
        });
      }
    },
    [submitted, grid, puzzle.gridSize]
  );

  const handleKeyDown = useCallback(
    (row: number, col: number, e: React.KeyboardEvent) => {
      if (submitted) return;
      let nextR = row, nextC = col;
      if (e.key === "ArrowRight") nextC = Math.min(col + 1, puzzle.gridSize - 1);
      else if (e.key === "ArrowLeft") nextC = Math.max(col - 1, 0);
      else if (e.key === "ArrowDown") nextR = Math.min(row + 1, puzzle.gridSize - 1);
      else if (e.key === "ArrowUp") nextR = Math.max(row - 1, 0);
      else if (e.key === "Backspace" && !userInput[row][col]) {
        nextC = Math.max(col - 1, 0);
      } else return;

      if (grid[nextR]?.[nextC] !== null) {
        setSelectedCell([nextR, nextC]);
        inputRefs.current[nextR]?.[nextC]?.focus();
      }
    },
    [submitted, grid, userInput, puzzle.gridSize]
  );

  const handleCellFocus = useCallback(
    (row: number, col: number) => {
      setSelectedCell([row, col]);
      const clueNum = findClueForCell(row, col);
      setActiveClue(clueNum);
    },
    [findClueForCell]
  );

  const handleSubmit = () => {
    setSubmitted(true);
    const newStates: CellState[][] = Array.from({ length: puzzle.gridSize }, () =>
      Array(puzzle.gridSize).fill("empty")
    );

    let allCorrect = true;
    let correctWordCount = 0;
    let delay = 0;
    for (const word of puzzle.words) {
      let correct = true;
      const cells: [number, number][] = [];
      for (let i = 0; i < word.word.length; i++) {
        const r = word.direction === "across" ? word.row : word.row + i;
        const c = word.direction === "across" ? word.col + i : word.col;
        cells.push([r, c]);
        if (userInput[r]?.[c] !== word.word[i]) correct = false;
      }
      if (!correct) allCorrect = false;
      if (correct) correctWordCount += 1;

      setTimeout(() => {
        setCellStates((prev) => {
          const next = prev.map((r) => [...r]);
          for (const [r, c] of cells) {
            next[r][c] = correct ? "correct" : "incorrect";
          }
          return next;
        });
      }, delay);
      delay += 150;
    }

    // Save attempt
    void handlePuzzleComplete(correctWordCount);

    if (allCorrect) {
      setTimeout(() => setShowCelebration(true), delay + 300);
    }
  };

  const acrossClues = puzzle.words.filter((w) => w.direction === "across");
  const downClues = puzzle.words.filter((w) => w.direction === "down");

  const timerWarning = seconds < 30;

  // Calculate staggered delay for cell pop-in
  const getCellDelay = (ri: number, ci: number) => (ri * puzzle.gridSize + ci) * 20;

  // Defensive guards to prevent rendering while state is inconsistent
  if (!puzzle?.words?.length) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-content px-4 pt-20 pb-12">
          <div className="text-center text-sm text-muted-foreground">No puzzle available today.</div>
        </main>
      </div>
    );
  }
  if (!userInput?.length || userInput.length !== puzzle.gridSize) {
    return null;
  }

  console.log("PUZZLE DATA:", puzzle);

  if (!loading && !hasPuzzle) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="mx-auto max-w-content px-4 pt-20 pb-12">
          <div className="text-center text-sm text-muted-foreground">No puzzle available today.</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-content px-4 pt-20 pb-12">
        {loading ? (
          <div className="text-center text-sm text-muted-foreground">Loading puzzle...</div>
        ) : (
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-heading text-foreground">{t("todaysPuzzle")}</h1>
            <p className="text-xs text-muted-foreground">
              Fill every highlighted square using the clues provided. Each clue has a single-word answer.
            </p>
          </div>
          <div className={`font-mono text-sm font-semibold transition-colors ${timerWarning ? "text-primary animate-pulse" : "text-foreground"}`}>
            {t("timeRemaining")}: {formatTime(seconds)}
          </div>
        </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Grid */}
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="inline-grid gap-0" style={{ gridTemplateColumns: `repeat(${puzzle.gridSize}, 1fr)` }}>
              {grid.map((row, ri) =>
                row.map((cell, ci) => {
                  if (cell === null) {
                    return (
                      <div
                        key={`${ri}-${ci}`}
                        className="h-9 w-9 bg-background animate-cell-pop"
                        style={{ animationDelay: `${getCellDelay(ri, ci)}ms` }}
                      />
                    );
                  }
                  const isSelected = selectedCell?.[0] === ri && selectedCell?.[1] === ci;
                  const state = cellStates[ri][ci];
                  const isBouncing = bouncingCell === `${ri},${ci}`;
                  return (
                    <div
                      key={`${ri}-${ci}`}
                      className={`relative border border-border transition-all duration-150 ${
                        isSelected ? "border-primary z-10 shadow-sm shadow-primary/20" : ""
                      } ${
                        state === "correct"
                          ? "animate-cell-correct-pop"
                          : state === "incorrect"
                          ? "animate-cell-incorrect-pop"
                          : "animate-cell-pop"
                      } ${isBouncing ? "animate-type-bounce" : ""}`}
                      style={{
                        width: isSelected ? "38px" : "36px",
                        height: isSelected ? "38px" : "36px",
                        margin: isSelected ? "-1px" : "0",
                        animationDelay: state === "empty" && !isBouncing ? `${getCellDelay(ri, ci)}ms` : "0ms",
                      }}
                    >
                      {numbers[ri][ci] && (
                        <span className="absolute left-0.5 top-0 text-[8px] font-mono text-muted-foreground leading-none">
                          {numbers[ri][ci]}
                        </span>
                      )}
                      <input
                        ref={(el) => { inputRefs.current[ri][ci] = el; }}
                        type="text"
                        maxLength={1}
                        value={userInput[ri][ci]}
                        onChange={(e) => handleCellChange(ri, ci, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(ri, ci, e)}
                        onFocus={() => handleCellFocus(ri, ci)}
                        disabled={submitted}
                        className="h-full w-full bg-transparent text-center font-mono text-sm font-bold text-foreground focus:outline-none uppercase"
                        aria-label={`Cell ${ri + 1}, ${ci + 1}`}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Clues */}
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm animate-slide-up" style={{ animationDelay: "100ms" }}>
              <h3 className="mb-3 text-sm font-semibold font-heading text-foreground">{t("across")}</h3>
              <ul className="space-y-2">
                {acrossClues.map((w) => (
                  <li
                    key={w.number}
                    className={`text-sm font-mono text-foreground rounded px-2 py-1 transition-all duration-300 ${
                      activeClue === w.number ? "animate-clue-glow bg-primary/5 border-l-2 border-primary pl-3" : "border-l-2 border-transparent"
                    }`}
                  >
                    <span className="text-muted-foreground mr-2">{w.number}.</span>
                    {language === "ja" ? w.clueJa : w.clue}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm animate-slide-up" style={{ animationDelay: "200ms" }}>
              <h3 className="mb-3 text-sm font-semibold font-heading text-foreground">{t("down")}</h3>
              <ul className="space-y-2">
                {downClues.map((w) => (
                  <li
                    key={w.number}
                    className={`text-sm font-mono text-foreground rounded px-2 py-1 transition-all duration-300 ${
                      activeClue === w.number ? "animate-clue-glow bg-primary/5 border-l-2 border-primary pl-3" : "border-l-2 border-transparent"
                    }`}
                  >
                    <span className="text-muted-foreground mr-2">{w.number}.</span>
                    {language === "ja" ? w.clueJa : w.clue}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handleSubmit}
            disabled={submitted}
            className="rounded-lg bg-primary px-8 py-2.5 text-sm font-semibold font-heading text-primary-foreground hover:opacity-90 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            {t("submit")}
          </button>
        </div>

        {/* Celebration overlay */}
        {showCelebration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="animate-celebrate text-center space-y-4">
              <div className="flex justify-center gap-2">
                {["🎉", "⭐", "🏆", "✨", "🎊"].map((emoji, i) => (
                  <span
                    key={i}
                    className="text-4xl animate-confetti-fall"
                    style={{ animationDelay: `${i * 150}ms`, animationDuration: `${1 + i * 0.2}s` }}
                  >
                    {emoji}
                  </span>
                ))}
              </div>
              <h2 className="text-2xl font-bold font-heading text-foreground">Perfect Score!</h2>
              <p className="text-sm text-muted-foreground font-body">
                Completed in {formatTime(600 - seconds)}
              </p>
              <button
                onClick={() => setShowCelebration(false)}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
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
