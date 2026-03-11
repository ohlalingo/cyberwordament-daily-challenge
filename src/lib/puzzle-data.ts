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

export const samplePuzzle: PuzzleData = {
  puzzle_id: "daily-2026-03-11",
  difficulty: "medium",
  score: 100,
  type: "crossword",
  gridSize: 10,
  words: [
    { word: "PHISHING", clue: "Fraudulent email attack", clueJa: "詐欺メール攻撃", direction: "across", row: 0, col: 0, number: 1 },
    { word: "MALWARE", clue: "Malicious software", clueJa: "悪意のあるソフトウェア", direction: "across", row: 2, col: 1, number: 3 },
    { word: "FIREWALL", clue: "Network security barrier", clueJa: "ネットワークセキュリティの壁", direction: "across", row: 5, col: 0, number: 5 },
    { word: "PATCH", clue: "Software security update", clueJa: "ソフトウェアセキュリティ更新", direction: "down", row: 0, col: 0, number: 1 },
    { word: "VPN", clue: "Secure communication tunnel", clueJa: "安全な通信トンネル", direction: "down", row: 0, col: 4, number: 2 },
    { word: "RANSOMWARE", clue: "Encrypts files for payment", clueJa: "身代金を要求する暗号化", direction: "across", row: 7, col: 0, number: 6 },
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
