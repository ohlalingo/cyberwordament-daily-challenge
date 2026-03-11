import { useState, useCallback, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import AppHeader from "@/components/AppHeader";
import { sampleWordSearch } from "@/lib/wordsearch-data";

type Coord = [number, number];

export default function WordSearch() {
  const { t, language } = useI18n();
  const puzzle = sampleWordSearch;

  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [selecting, setSelecting] = useState(false);
  const [selection, setSelection] = useState<Coord[]>([]);
  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set());
  const gridRef = useRef<HTMLDivElement>(null);

  const coordKey = (r: number, c: number) => `${r},${c}`;

  const startSelect = useCallback((r: number, c: number) => {
    setSelecting(true);
    setSelection([[r, c]]);
  }, []);

  const moveSelect = useCallback(
    (r: number, c: number) => {
      if (!selecting) return;
      const start = selection[0];
      if (!start) return;
      const [sr, sc] = start;
      const dr = Math.sign(r - sr);
      const dc = Math.sign(c - sc);
      // Only allow straight lines
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
    [selecting, selection, puzzle.gridSize]
  );

  const endSelect = useCallback(() => {
    if (!selecting) return;
    setSelecting(false);

    const selectedWord = selection.map(([r, c]) => puzzle.grid[r][c]).join("");
    const reversed = [...selection].reverse().map(([r, c]) => puzzle.grid[r][c]).join("");

    const match = puzzle.words.find((w) => w.word === selectedWord || w.word === reversed);
    if (match && !foundWords.has(match.word)) {
      setFoundWords((prev) => new Set([...prev, match.word]));
      setHighlightedCells((prev) => {
        const next = new Set(prev);
        for (const [r, c] of selection) next.add(coordKey(r, c));
        return next;
      });
    }
    setSelection([]);
  }, [selecting, selection, puzzle, foundWords]);

  const isSelected = (r: number, c: number) => selection.some(([sr, sc]) => sr === r && sc === c);
  const isHighlighted = (r: number, c: number) => highlightedCells.has(coordKey(r, c));
  const allFound = foundWords.size === puzzle.words.length;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-content px-4 pt-20 pb-12">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold font-heading text-foreground">Word Search</h1>
          <span className="text-sm font-mono text-muted-foreground">
            {foundWords.size}/{puzzle.words.length} found
          </span>
        </div>

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
                    className={`flex h-8 w-8 cursor-pointer items-center justify-center font-mono text-sm font-bold transition-colors ${
                      isHighlighted(ri, ci)
                        ? "bg-success text-success-foreground"
                        : isSelected(ri, ci)
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {letter}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Word list */}
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold font-heading text-foreground">Words to Find</h3>
            <ul className="space-y-3">
              {puzzle.words.map((w) => (
                <li key={w.word} className="flex items-center gap-3">
                  <span
                    className={`font-mono text-sm font-bold ${
                      foundWords.has(w.word) ? "text-success line-through" : "text-foreground"
                    }`}
                  >
                    {w.word}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    — {language === "ja" ? w.hintJa : w.hint}
                  </span>
                </li>
              ))}
            </ul>
            {allFound && (
              <div className="mt-6 rounded-lg bg-success/10 p-3 text-center text-sm font-semibold text-success">
                🎉 All words found!
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
