import React, { createContext, useContext, useState, useCallback } from "react";

export type Language = "en" | "ja";

const translations = {
  en: {
    appTitle: "CyberMaze",
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
    confirmSubmitTitle: "Are you sure you want to submit?",
    confirmSubmitDesc: "Once submitted, your answers cannot be changed.",
    lockIt: "Lock it",
    takeMeBack: "Take me back",
    howToPlay: "How to play",
    howClueTitle: "Pick a clue",
    howClueBody: "Click an Across or Down clue to jump to the first empty cell of that word.",
    howGridTitle: "Or start in the grid",
    howGridBody: "Click any empty cell and type. The cursor advances in that word's direction.",
    howSwitchTitle: "Switch direction",
    howSwitchBody: "Click the same cell again to flip between Across and Down at an intersection.",
    howHintsTitle: "Pre-filled hints",
    howHintsBody: "Greyed cells are hint letters. They're locked but count toward your score.",
    howSubmitTitle: "Submit when ready",
    howSubmitBody: "You have 10 minutes. Submissions are final — review before locking in.",
    howCyberMazeWorks: "How CyberMaze works",
    rulesOnePuzzleTitle: "One puzzle a day",
    rulesOnePuzzleBody: "A new puzzle drops daily. You get one attempt — make it count.",
    rulesResetTitle: "Resets at 00:00 GMT",
    rulesResetBody: "Tomorrow's puzzle unlocks at midnight GMT. Today's disappears.",
    rulesTimerTitle: "10-minute timer",
    rulesTimerBody: "Beat the clock. If time runs out, your answers are auto-submitted.",
    rulesReviewTitle: "Review before submitting",
    rulesReviewBody: "Submissions are final. No re-attempts once you confirm.",
    rulesHintsTitle: "Pre-filled hints",
    rulesHintsBody: "Greyed cells are hint letters. They count toward your score.",
    rulesPlayDailyTitle: "Play daily to win",
    rulesPlayDailyBody: "Faster wins ties. Keep your streak alive to climb the leaderboard.",
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
    appTitle: "CyberMaze",
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
    confirmSubmitTitle: "本当に送信しますか？",
    confirmSubmitDesc: "送信後は回答を変更できません。",
    lockIt: "確定する",
    takeMeBack: "戻る",
    howToPlay: "遊び方",
    howClueTitle: "ヒントを選ぶ",
    howClueBody: "横または縦のヒントをクリックすると、その単語の最初の空きマスに移動します。",
    howGridTitle: "マスから始める",
    howGridBody: "空きマスをクリックして入力。カーソルは単語の方向に進みます。",
    howSwitchTitle: "方向を切り替える",
    howSwitchBody: "交差マスでは同じマスをもう一度クリックすると横と縦が切り替わります。",
    howHintsTitle: "ヒントとして埋まったマス",
    howHintsBody: "灰色のマスはヒント文字です。変更不可ですがスコアに加算されます。",
    howSubmitTitle: "準備ができたら送信",
    howSubmitBody: "制限時間は10分。送信は確定するので、よく確認してください。",
    howCyberMazeWorks: "CyberMazeの遊び方",
    rulesOnePuzzleTitle: "1日1パズル",
    rulesOnePuzzleBody: "毎日新しいパズルが公開され、挑戦できるのは1回だけ。",
    rulesResetTitle: "00:00 GMTにリセット",
    rulesResetBody: "翌日のパズルはGMTの午前0時に解禁。今日のパズルは消えます。",
    rulesTimerTitle: "10分のタイマー",
    rulesTimerBody: "時間切れになると、入力済みの回答が自動送信されます。",
    rulesReviewTitle: "送信前に確認",
    rulesReviewBody: "送信は確定。一度確定すると再挑戦はできません。",
    rulesHintsTitle: "ヒントとして埋まったマス",
    rulesHintsBody: "灰色のマスはヒント文字。スコアに加算されます。",
    rulesPlayDailyTitle: "毎日プレイして勝つ",
    rulesPlayDailyBody: "同点の場合はタイムで決定。連続プレイでランキング上位を目指そう。",
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
