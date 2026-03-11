export interface PuzzleWord {
  word: string;
  clue: string;
  clueJa: string;
  direction: "across" | "down";
  row: number;
  col: number;
  number: number;
}

export interface PuzzleData {
  puzzle_id: string;
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
  difficulty: "medium",
  score: 100,
  type: "crossword",
  gridSize: 10,
  words: [
    { word: "PHISHING", clue: "Fraudulent email attack", clueJa: "詐欺メール攻撃", direction: "across", row: 2, col: 0, number: 1 },
    { word: "VPN", clue: "Secure communication tunnel", clueJa: "安全な通信トンネル", direction: "down", row: 1, col: 0, number: 2 },
    { word: "MALWARE", clue: "Malicious software", clueJa: "悪意のあるソフトウェア", direction: "across", row: 4, col: 2, number: 3 },
    { word: "SPAM", clue: "Unwanted bulk messages", clueJa: "迷惑メール", direction: "down", row: 2, col: 3, number: 4 },
    { word: "FIREWALL", clue: "Network security barrier", clueJa: "ネットワークセキュリティの壁", direction: "across", row: 6, col: 0, number: 5 },
    { word: "RANSOMWARE", clue: "Encrypts files for payment", clueJa: "身代金を要求する暗号化", direction: "across", row: 8, col: 0, number: 6 },
  ],
};

export type CellState = "empty" | "active" | "correct" | "incorrect";

export function buildGrid(puzzle: PuzzleData) {
  const grid: (string | null)[][] = Array.from({ length: puzzle.gridSize }, () =>
    Array(puzzle.gridSize).fill(null)
  );
  const numbers: (number | null)[][] = Array.from({ length: puzzle.gridSize }, () =>
    Array(puzzle.gridSize).fill(null)
  );

  for (const word of puzzle.words) {
    for (let i = 0; i < word.word.length; i++) {
      const r = word.direction === "across" ? word.row : word.row + i;
      const c = word.direction === "across" ? word.col + i : word.col;
      if (r < puzzle.gridSize && c < puzzle.gridSize) {
        grid[r][c] = word.word[i];
      }
    }
    numbers[word.row][word.col] = word.number;
  }

  return { grid, numbers };
}
