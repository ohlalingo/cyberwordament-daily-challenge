import React, { createContext, useContext, useState, useCallback } from "react";

export type Language = "en" | "ja";

const translations = {
  en: {
    appTitle: "CyberWordament",
    signIn: "Sign In",
    signUp: "Sign Up",
    email: "Email",
    password: "Password",
    name: "Name",
    region: "Region",
    preferredLanguage: "Preferred Language",
    createAccount: "Create Account",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    todaysPuzzle: "Today's Puzzle",
    leaderboard: "Leaderboard",
    regionalChampions: "Regional Champions",
    submit: "Submit",
    across: "Across",
    down: "Down",
    rank: "Rank",
    playerName: "Player Name",
    score: "Score",
    time: "Time",
    global: "Global",
    japan: "Japan",
    emea: "EMEA",
    aej: "AEJ",
    americas: "Americas",
    india: "India",
    champion: "Champion",
    completionTime: "Completion Time",
    dashboard: "Game Dashboard",
    welcomeBack: "Welcome back",
    dailyChallenge: "Daily Cyber Challenge",
    puzzleDescription: "Test your cybersecurity knowledge with today's crossword puzzle.",
    startPuzzle: "Start Puzzle",
    yourStats: "Your Stats",
    puzzlesCompleted: "Puzzles Completed",
    currentStreak: "Current Streak",
    bestTime: "Best Time",
    english: "English",
    japanese: "日本語",
    signOut: "Sign Out",
    timeRemaining: "Time Remaining",
    completed: "Completed",
    noData: "No data yet.",
    nextPuzzleUnlocks: "Next puzzle unlocks in",
    crosswordTitle: "Crossword",
    wordSearchTitle: "Word Search",
    unjumbleTitle: "Unjumble",
    crosswordDesc: "Fill in the grid using cybersecurity clues.",
    wordSearchDesc: "Find hidden cybersecurity words in the grid.",
    unjumbleDesc: "Rearrange scrambled letters to form security terms.",
    wordSearchPlayDesc: "Select hidden cybersecurity terms in the grid. Words may appear forward, backward, or diagonally.",
    unjumblePlayDesc: "Unscramble the letters to form the correct cybersecurity term for each hint.",
    crosswordPlayDesc: "Fill every highlighted square using the clues provided. Each clue has a single-word answer.",
  },
  ja: {
    appTitle: "CyberWordament",
    signIn: "サインイン",
    signUp: "サインアップ",
    email: "メールアドレス",
    password: "パスワード",
    name: "名前",
    region: "地域",
    preferredLanguage: "言語設定",
    createAccount: "アカウント作成",
    noAccount: "アカウントをお持ちでないですか？",
    haveAccount: "すでにアカウントをお持ちですか？",
    todaysPuzzle: "今日のパズル",
    leaderboard: "ランキング",
    regionalChampions: "地域チャンピオン",
    submit: "送信",
    across: "横",
    down: "縦",
    rank: "順位",
    playerName: "プレイヤー名",
    score: "スコア",
    time: "タイム",
    global: "グローバル",
    japan: "日本",
    emea: "EMEA",
    aej: "AEJ",
    americas: "アメリカ",
    india: "インド",
    champion: "チャンピオン",
    completionTime: "完了タイム",
    dashboard: "ゲームダッシュボード",
    welcomeBack: "おかえりなさい",
    dailyChallenge: "サイバーチャレンジ",
    puzzleDescription: "今日のクロスワードパズルでサイバーセキュリティの知識をテストしましょう。",
    startPuzzle: "パズルを開始",
    yourStats: "あなたの統計",
    puzzlesCompleted: "完了パズル数",
    currentStreak: "連続記録",
    bestTime: "ベストタイム",
    english: "English",
    japanese: "日本語",
    signOut: "サインアウト",
    timeRemaining: "残り時間",
    completed: "完了",
    noData: "データがありません。",
    nextPuzzleUnlocks: "次のパズルの解放まで",
    crosswordTitle: "クロスワード",
    wordSearchTitle: "ワードサーチ",
    unjumbleTitle: "並べ替え",
    crosswordDesc: "サイバーセキュリティのヒントを使ってマスを埋めましょう。",
    wordSearchDesc: "グリッドの中に隠されたサイバーセキュリティ用語を探しましょう。",
    unjumbleDesc: "並べ替えてサイバーセキュリティ用語を完成させましょう。",
    crosswordPlayDesc: "ハイライトされたマスをすべて埋めてください。各ヒントには1つの答えがあります。",
    wordSearchPlayDesc: "グリッド内に隠されたサイバーセキュリティ用語を選択してください。単語は前後・斜めに配置されています。",
    unjumblePlayDesc: "ヒントを頼りに文字を並べ替えて正しいサイバーセキュリティ用語を完成させてください。",
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    const stored = localStorage.getItem("lang");
    return stored === "ja" ? "ja" : "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", lang);
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[language][key] || key,
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
