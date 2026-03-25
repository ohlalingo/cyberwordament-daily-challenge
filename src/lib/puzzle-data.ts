export interface PuzzleWord {
  word: string;
  clue: string;
  clueJa: string;
  direction: "across" | "down";
  row: number;
  col: number;
  number: number;
  letters?: string[]; // optional pre-split graphemes
}

export interface PuzzleData {
  puzzle_id: string;
  puzzleContentId?: number;
  difficulty: string;
  score: number;
  type: "crossword" | "wordsearch" | "unjumble";
  words: PuzzleWord[];
  gridSize: number;
}

// Grid layout (10x10):
//      0 1 2 3 4 5 6 7 8 9
//  0:  . . . . . . . . . .
//  1:  V . . . . . . . . .
//  2:  P H I S H I N G . .   1-across: PHISHING
//  3:  N . . P . . . . . .
//  4:  . . M A L W A R E .   3-across: MALWARE
//  5:  . . . M . . . . . .
//  6:  F I R E W A L L . .   5-across: FIREWALL
//  7:  . . . . . . . . . .
//  8:  R A N S O M W A R E   6-across: RANSOMWARE
//
// Intersections:
//  VPN(2) ↓ col 0 shares P with PHISHING at (2,0)
//  SPAM(4) ↓ col 3 shares S with PHISHING at (2,3) and A with MALWARE at (4,3)

export const samplePuzzle: PuzzleData = {
  puzzle_id: "daily-2026-03-11",
  puzzleContentId: 1,
  difficulty: "medium",
  score: 100,
  type: "crossword",
  gridSize: 10,
  words: [
    { word: "PHISHING", clue: "Fraudulent email attack", clueJa: "詐欺メール攻撃", direction: "across", row: 2, col: 0, number: 1 },
    { word: "VPN", clue: "Secure communication tunnel", clueJa: "安全な通信トンネル", direction: "down", row: 1, col: 0, number: 2 },
    { word: "MALWARE", clue: "Malicious software", clueJa: "悪意のあるソフトウェア", direction: "across", row: 4, col: 2, number: 3 },
    { word: "SPAM", clue: "Unwanted bulk messages", clueJa: "迷惑メール", direction: "down", row: 2, col: 3, number: 4 },
    { word: "FIREWALL", clue: "Network security barrier", clueJa: "ネットワークセキュリティの壁", direction: "across", row: 7, col: 0, number: 5 },
    { word: "RANSOMWARE", clue: "Encrypts files for payment", clueJa: "身代金を要求する暗号化", direction: "across", row: 9, col: 0, number: 6 },
  ],
};

export type CellState = "empty" | "active" | "correct" | "incorrect";

// Grapheme-safe splitter (uses Intl.Segmenter when available)
export const splitGraphemes = (s: string): string[] => {
  if (!s) return [];
  const Seg = (Intl as any)?.Segmenter;
  if (Seg) {
    try {
      return [...new Seg("ja", { granularity: "grapheme" }).segment(s)].map((x: any) => x.segment);
    } catch {
      // fall through
    }
  }
  return Array.from(s);
};

export function buildGrid(puzzle: PuzzleData) {
  const size = Math.max(1, puzzle.gridSize || 0);
  const grid: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const numbers: (number | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));

  for (const word of puzzle.words) {
    if (!word?.word && !(word as any)?.letters?.length) continue;
    const letters = word.letters && word.letters.length ? word.letters : splitGraphemes(word.word || "");
    for (let i = 0; i < letters.length; i++) {
      const r = word.direction === "across" ? word.row : word.row + i;
      const c = word.direction === "across" ? word.col + i : word.col;
      if (r >= 0 && c >= 0 && r < size && c < size) {
        grid[r][c] = letters[i];
      }
    }
    if (word.row >= 0 && word.col >= 0 && word.row < size && word.col < size) {
      numbers[word.row][word.col] = word.number;
    }
  }

  return { grid, numbers };
}
