export interface UnjumbleWord {
  answer: string;
  scrambled: string;
  hint: string;
  hintJa: string;
}

export interface UnjumbleData {
  puzzle_id: string;
  words: UnjumbleWord[];
}

function scramble(word: string): string {
  const arr = word.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const result = arr.join("");
  return result === word ? scramble(word) : result;
}

export const sampleUnjumble: UnjumbleData = {
  puzzle_id: "uj-2026-03-11",
  words: [
    { answer: "RANSOMWARE", scrambled: scramble("RANSOMWARE"), hint: "Encrypts files for payment", hintJa: "身代金を要求する暗号化" },
    { answer: "PHISHING", scrambled: scramble("PHISHING"), hint: "Fraudulent email attack", hintJa: "詐欺メール攻撃" },
    { answer: "FIREWALL", scrambled: scramble("FIREWALL"), hint: "Network security barrier", hintJa: "ネットワークセキュリティの壁" },
    { answer: "MALWARE", scrambled: scramble("MALWARE"), hint: "Malicious software", hintJa: "悪意のあるソフトウェア" },
    { answer: "BOTNET", scrambled: scramble("BOTNET"), hint: "Network of compromised computers", hintJa: "乗っ取られたコンピューターのネットワーク" },
  ],
};
