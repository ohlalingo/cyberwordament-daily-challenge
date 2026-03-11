import { useState, useEffect, useCallback, useRef } from "react";
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
  const inputRefs = useRef<(HTMLInputElement | null)[][]>(
    Array.from({ length: puzzle.gridSize }, () => Array(puzzle.gridSize).fill(null))
  );

  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(interval);
  }, [submitted]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleCellChange = useCallback(
    (row: number, col: number, value: string) => {
      if (submitted || grid[row][col] === null) return;
      const char = value.toUpperCase().slice(-1);
      setUserInput((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = char;
        return next;
      });
    },
    [submitted, grid]
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
      } else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        nextC = Math.min(col + 1, puzzle.gridSize - 1);
      } else return;

      if (grid[nextR]?.[nextC] !== null) {
        setSelectedCell([nextR, nextC]);
        inputRefs.current[nextR]?.[nextC]?.focus();
      }
    },
    [submitted, grid, userInput, puzzle.gridSize]
  );

  const handleSubmit = () => {
    setSubmitted(true);
    const newStates: CellState[][] = Array.from({ length: puzzle.gridSize }, () =>
      Array(puzzle.gridSize).fill("empty")
    );

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
  };

  const acrossClues = puzzle.words.filter((w) => w.direction === "across");
  const downClues = puzzle.words.filter((w) => w.direction === "down");

  const timerWarning = seconds < 30;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-content px-4 pt-20 pb-12">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold font-heading text-foreground">{t("todaysPuzzle")}</h1>
          <div className={`font-mono text-sm font-semibold ${timerWarning ? "text-primary" : "text-foreground"}`}>
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
                    return <div key={`${ri}-${ci}`} className="h-9 w-9 bg-background" />;
                  }
                  const isSelected = selectedCell?.[0] === ri && selectedCell?.[1] === ci;
                  const state = cellStates[ri][ci];
                  return (
                    <div
                      key={`${ri}-${ci}`}
                      className={`relative border border-border ${
                        isSelected ? "border-primary z-10" : ""
                      } ${
                        state === "correct" ? "animate-cell-correct" : ""
                      } ${
                        state === "incorrect" ? "animate-cell-incorrect" : ""
                      }`}
                      style={{
                        width: isSelected ? "38px" : "36px",
                        height: isSelected ? "38px" : "36px",
                        margin: isSelected ? "-1px" : "0",
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
                        onFocus={() => setSelectedCell([ri, ci])}
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
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold font-heading text-foreground">{t("across")}</h3>
              <ul className="space-y-2">
                {acrossClues.map((w) => (
                  <li key={w.number} className="text-sm font-mono text-foreground">
                    <span className="text-muted-foreground mr-2">{w.number}.</span>
                    {language === "ja" ? w.clueJa : w.clue}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold font-heading text-foreground">{t("down")}</h3>
              <ul className="space-y-2">
                {downClues.map((w) => (
                  <li key={w.number} className="text-sm font-mono text-foreground">
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
            className="rounded-lg bg-primary px-8 py-2.5 text-sm font-semibold font-heading text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {t("submit")}
          </button>
        </div>
      </main>
    </div>
  );
}
