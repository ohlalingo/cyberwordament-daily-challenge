export interface WordSearchData {
  puzzle_id: string;
  gridSize: number;
  words: { word: string; hint: string; hintJa: string }[];
  grid: string[][];
  // Each placement: [startRow, startCol, direction]
  placements: { word: string; row: number; col: number; dir: "right" | "down" | "diag" }[];
}

function placeWords(size: number, words: string[]): { grid: string[][]; placements: WordSearchData["placements"] } {
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(""));
  const placements: WordSearchData["placements"] = [];
  const dirs: ("right" | "down" | "diag")[] = ["right", "down", "diag"];
  const dr = { right: 0, down: 1, diag: 1 };
  const dc = { right: 1, down: 0, diag: 1 };

  for (const word of words) {
    let placed = false;
    for (const dir of dirs) {
      const maxR = size - (dr[dir] * word.length);
      const maxC = size - (dc[dir] * word.length);
      for (let r = 0; r <= maxR && !placed; r++) {
        for (let c = 0; c <= maxC && !placed; c++) {
          let canPlace = true;
          for (let i = 0; i < word.length; i++) {
            const cell = grid[r + dr[dir] * i][c + dc[dir] * i];
            if (cell !== "" && cell !== word[i]) { canPlace = false; break; }
          }
          if (canPlace) {
            for (let i = 0; i < word.length; i++) {
              grid[r + dr[dir] * i][c + dc[dir] * i] = word[i];
            }
            placements.push({ word, row: r, col: c, dir });
            placed = true;
          }
        }
      }
    }
  }

  // Fill empty with random letters
  const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === "") grid[r][c] = alpha[Math.floor(Math.random() * 26)];
    }
  }

  return { grid, placements };
}

const wordsToFind = [
  { word: "FIREWALL", hint: "Network security barrier", hintJa: "ネットワークセキュリティの壁" },
  { word: "PHISHING", hint: "Fraudulent email attack", hintJa: "詐欺メール攻撃" },
  { word: "MALWARE", hint: "Malicious software", hintJa: "悪意のあるソフトウェア" },
  { word: "ENCRYPT", hint: "Encode data for security", hintJa: "データを暗号化する" },
  { word: "TROJAN", hint: "Disguised malicious program", hintJa: "偽装された悪意のあるプログラム" },
];

const { grid, placements } = placeWords(12, wordsToFind.map((w) => w.word));

export const sampleWordSearch: WordSearchData = {
  puzzle_id: "ws-2026-03-11",
  gridSize: 12,
  words: wordsToFind,
  grid,
  placements,
};
