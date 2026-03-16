import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import AppHeader from "@/components/AppHeader";
import { samplePuzzle, buildGrid, CellState } from "@/lib/puzzle-data";

export default function Puzzle() {
  const { t, language } = useI18n();
  const puzzle = samplePuzzle;
  const { grid, numbers } = buildGrid(puzzle);

  const [userInput, setUserInput] = useState<string[][]>(() =>
    Array.from({ length: puzzle.gridSize }, () => Array(puzzle.gridSize).fill(""))
  );
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [cellStates, setCellStates] = useState<CellState[][]>(() =>
    Array.from({ length: puzzle.gridSize }, () => Array(puzzle.gridSize).fill("empty"))
  );
  const [submitted, setSubmitted] = useState(false);
  const [seconds, setSeconds] = useState(600);
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

    if (allCorrect) {
      setTimeout(() => setShowCelebration(true), delay + 300);
    }
  };

  const acrossClues = puzzle.words.filter((w) => w.direction === "across");
  const downClues = puzzle.words.filter((w) => w.direction === "down");

  const timerWarning = seconds < 30;

  // Calculate staggered delay for cell pop-in
  const getCellDelay = (ri: number, ci: number) => (ri * puzzle.gridSize + ci) * 20;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-content px-4 pt-20 pb-12">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold font-heading text-foreground">{t("todaysPuzzle")}</h1>
          <div className={`font-mono text-sm font-semibold transition-colors ${timerWarning ? "text-primary animate-pulse" : "text-foreground"}`}>
            {t("timeRemaining")}: {formatTime(seconds)}
          </div>
        </div>

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
                      className={`relative border border-border transition-all duration-150 animate-cell-pop ${
                        isSelected ? "border-primary z-10 shadow-sm shadow-primary/20" : ""
                      } ${state === "correct" ? "animate-cell-correct" : ""
                      } ${state === "incorrect" ? "animate-cell-incorrect" : ""
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
