import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import AppHeader from "@/components/AppHeader";
import { sampleUnjumble } from "@/lib/unjumble-data";
import { API_BASE } from "@/lib/config";

interface WordState {
  userAnswer: string;
  status: "pending" | "correct" | "incorrect";
}

export default function Unjumble() {
  const { t, language } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  // Prefer current UI language over stored user language
  const lang = language || user?.language || "en";
  const [puzzle, setPuzzle] = useState(sampleUnjumble);
  const TOTAL_TIME = 600;
  const [seconds, setSeconds] = useState(TOTAL_TIME);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasPuzzle, setHasPuzzle] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const requestedId = searchParams.get("puzzleContentId");

  const [words, setWords] = useState<WordState[]>(
    (puzzle as any).questions
      ? (puzzle as any).questions.map(() => ({ userAnswer: "", status: "pending" }))
      : puzzle.words.map(() => ({ userAnswer: "", status: "pending" }))
  );

  useEffect(() => {
    const url = `${API_BASE}/puzzle/today?lang=${lang}&t=${Date.now()}`;
    fetch(url, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
      .then((data) => {
    const unj = data?.unjumble?.[0];
    if (!unj) {
      setHasPuzzle(false);
      setLoading(false);
      return;
    }
    const chosen =
      (requestedId
        ? Array.isArray(data?.unjumble)
          ? data.unjumble.find((u: any) => String(u.puzzleContentId ?? u.puzzle_content_id) === requestedId)
          : null
        : null) || unj;
    const questions = Array.isArray(chosen?.questions)
      ? chosen.questions
      : Array.isArray(chosen?.words)
      ? chosen.words
      : [];
    if (!questions.length) {
      setHasPuzzle(false);
      setLoading(false);
      return;
    }
    const uq = {
      ...chosen,
      questions,
      puzzleContentId: chosen.puzzleContentId ?? chosen.puzzle_content_id,
    };
    setPuzzle(uq);
    setHasPuzzle(true);
    setLoading(false);
  })
  .catch((err) => {
    console.error("🚨 Unjumble fetch FAILED:", err);
    setHasPuzzle(false);
    setLoading(false);
  });
}, [lang]);

  // Reset state when a new puzzle arrives
  useEffect(() => {
    const q = (puzzle as any).questions ?? [];
    if (!q.length) return;
    setWords(q.map(() => ({ userAnswer: "", status: "pending" })));
    setSeconds(TOTAL_TIME);
    setSubmitted(false);
    setShowCelebration(false);
  }, [(puzzle as any).puzzleContentId]);

  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(interval);
  }, [submitted]);

  useEffect(() => {
    if (!submitted && seconds === 0) {
      handleSubmit();
    }
  }, [seconds, submitted]);

  // Restore prior attempt: if this puzzle was already completed by the user, fetch
  // saved answers and render in locked review mode.
  useEffect(() => {
    const pcId = Number((puzzle as any)?.puzzleContentId);
    const userId = Number((user as any)?.id);
    const q = (puzzle as any).questions ?? [];
    if (!pcId || !userId || submitted || !q.length) return;
    fetch(`${API_BASE}/attempt/user/${userId}/puzzle/${pcId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const saved: string[] = Array.isArray(data.userInput) ? data.userInput : [];
        const restored: WordState[] = q.map((qu: any, i: number) => {
          const userAnswer = saved[i] ?? "";
          return {
            userAnswer,
            status: (userAnswer === qu.answer ? "correct" : userAnswer ? "incorrect" : "pending") as WordState["status"],
          };
        });
        setWords(restored);
        setSubmitted(true);
      })
      .catch(() => { /* silent */ });
  }, [(puzzle as any)?.puzzleContentId, user, submitted]);

  const handleComplete = async (correctCount: number, answers: string[]) => {
    const puzzleContentId = Number((puzzle as any)?.puzzleContentId);
    const userId = Number((user as any)?.id);
    if (!puzzleContentId || !userId) {
      console.error("🚨 Missing puzzleContentId — attempt NOT saved");
      return;
    }
    const completionKey = `completed_puzzle_${puzzleContentId ?? (puzzle as any)?.puzzleId}`;
    const puzzleId = (puzzle as any)?.puzzleId;
    const timeTaken = TOTAL_TIME - seconds;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId,
          puzzleContentId,
          correctWords: correctCount,
          timeTaken,
          userInput: answers,
        }),
      });
      if (res.ok) {
        localStorage.setItem(completionKey, "true");
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(
          new CustomEvent("puzzle-completed", { detail: { puzzleId, puzzleContentId } })
        );
      } else if (res.status === 409) {
        console.warn("Attempt already recorded for this puzzle; marking as completed.");
        localStorage.setItem(completionKey, "true");
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(
          new CustomEvent("puzzle-completed", { detail: { puzzleId, puzzleContentId } })
        );
      }
    } catch (err) {
      console.error("Failed to save unjumble attempt", err);
    }
  };

  const updateAnswer = useCallback((index: number, value: string) => {
    const normalized =
      /^[A-Za-z]+$/.test(value) ? value.toUpperCase() : value;
    setWords((prev) =>
      prev.map((w, i) => (i === index ? { ...w, userAnswer: normalized } : w))
    );
  }, []);

  const handleSubmit = () => {
    if (submitted) return;
    const questions = (puzzle as any).questions ?? [];
    const nextWords: WordState[] = words.map((w, i) => ({
      ...w,
      status: (w.userAnswer === questions[i]?.answer ? "correct" : "incorrect") as WordState["status"],
    }));
    setWords(nextWords);
    setSubmitted(true);
    const correctCount = nextWords.filter((w) => w.status === "correct").length;
    void handleComplete(correctCount, nextWords.map((w) => w.userAnswer));
    setShowCelebration(true);
  };

  const questions = Array.isArray((puzzle as any).questions) ? (puzzle as any).questions : [];
  const correctCount = words.filter((w) => w.status === "correct").length;
  const allCorrect = submitted && questions.length > 0 && correctCount === questions.length;

  console.log("PUZZLE DATA:", puzzle);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-content px-4 pt-20 pb-12">
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-heading font-semibold text-muted-foreground hover:text-primary transition-colors"
        >
          ← {t("backToHome")}
        </button>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-heading text-foreground">{t("todaysPuzzle")}: {t("unjumbleTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("unjumblePlayDesc")}</p>
          </div>
          {!loading && hasPuzzle && (
            <span className="text-sm font-mono text-muted-foreground">
              {submitted ? `${correctCount}/${questions.length} correct • ` : ""}{Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, "0")}
            </span>
          )}
        </div>
        {loading ? null : !hasPuzzle ? (
          <div className="text-center text-sm text-muted-foreground">No puzzle available today.</div>
        ) : null}

        {!questions.length ? (
          <div className="text-center p-4">No puzzle available</div>
        ) : (
          <>
            <div className="space-y-4">
              {questions.map((word: any, i: number) => {
                const state = words[i];
                const hintText =
                  (language === "ja"
                    ? word.hintJa ?? word.hint ?? word.clueJa ?? word.clue
                    : word.hint ?? word.hintJa ?? word.clue ?? word.clueJa) || "Hint not provided.";
                return (
                  <div
                    key={word.answer}
                    className={`rounded-lg border bg-card p-5 shadow-sm transition-all duration-300 animate-slide-up ${
                      state.status === "correct"
                        ? "border-success scale-[0.99]"
                        : state.status === "incorrect"
                        ? "border-primary"
                        : "border-border hover:shadow-md"
                    }`}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-body">
                        {hintText}
                      </span>
                    </div>

                    {/* Scrambled letters */}
                    <div className="mb-3 flex gap-1">
                      {word.scrambled.split("").map((letter, li) => (
                        <div
                          key={li}
                          className="flex h-9 w-9 items-center justify-center rounded border border-border bg-muted font-mono text-sm font-bold text-foreground animate-cell-pop transition-transform hover:scale-110"
                          style={{ animationDelay: `${i * 80 + li * 40}ms` }}
                        >
                          {letter}
                        </div>
                      ))}
                    </div>

                    {/* Answer input */}
                    <input
                      type="text"
                      value={state.userAnswer}
                      onChange={(e) => updateAnswer(i, e.target.value)}
                      disabled={submitted || seconds === 0}
                      placeholder="Type your answer..."
                      maxLength={word.answer.length}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60 transition-all focus:scale-[1.01]"
                    />

                    {submitted && state.status === "incorrect" && (
                      <p className="mt-2 text-xs font-mono text-primary animate-slide-up">
                        Answer: {word.answer}
                      </p>
                    )}
                    {submitted && state.status === "correct" && (
                      <p className="mt-2 text-xs font-mono text-success animate-celebrate">
                        ✓ Correct!
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowConfirmSubmit(true)}
                disabled={submitted}
                className="rounded-lg bg-primary px-8 py-2.5 text-sm font-semibold font-heading text-primary-foreground hover:opacity-90 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                {t("submit")}
              </button>
            </div>

            {/* How to play */}
            <section className="mt-10">
              <h2 className="mb-4 font-heading text-base font-semibold text-foreground">{t("howToPlay")}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { title: t("ujHowReadTitle"), body: t("ujHowReadBody") },
                  { title: t("ujHowHintTitle"), body: t("ujHowHintBody") },
                  { title: t("ujHowTypeTitle"), body: t("ujHowTypeBody") },
                  { title: t("ujHowSubmitTitle"), body: t("ujHowSubmitBody") },
                ].map((b) => (
                  <div key={b.title} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                    <h3 className="mb-1 font-heading text-sm font-semibold text-foreground">{b.title}</h3>
                    <p className="text-xs text-muted-foreground font-body leading-relaxed">{b.body}</p>
                  </div>
                ))}
              </div>
            </section>

          </>
        )}

        {showConfirmSubmit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
              <h3 className="mb-2 text-lg font-bold font-heading text-foreground">
                {t("confirmSubmitTitle")}
              </h3>
              <p className="mb-6 text-sm text-muted-foreground font-body">
                {t("confirmSubmitDesc")}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold font-heading text-foreground hover:bg-muted transition-colors"
                >
                  {t("takeMeBack")}
                </button>
                <button
                  onClick={() => { setShowConfirmSubmit(false); handleSubmit(); }}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold font-heading text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  {t("lockIt")}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {showCelebration && (() => {
        const totalWords = questions.length;
        const correct = words.filter((w) => w.status === "correct").length;
        const isPerfect = correct === totalWords;
        return (
          <div className="fixed inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-50 animate-fade-in">
            <div className="rounded-xl bg-card border border-border shadow-lg px-8 py-6 text-center space-y-4 animate-celebrate">
              <div className="flex justify-center gap-2">
                {["🎉", "⭐", "🏆", "✨", "🎊"].map((emoji, i) => (
                  <span key={i} className="text-3xl animate-confetti-fall"
                    style={{ animationDelay: `${i * 150}ms`, animationDuration: `${1 + i * 0.2}s` }}>
                    {emoji}
                  </span>
                ))}
              </div>
              <h2 className="text-2xl font-bold font-heading text-foreground">
                {isPerfect ? "Perfect Score!" : "Puzzle Complete"}
              </h2>
              <p className="text-4xl font-bold text-primary">{correct} / {totalWords}</p>
              <p className="text-sm text-muted-foreground">words correct</p>
              <p className="text-sm text-muted-foreground">
                Time: {Math.floor((TOTAL_TIME - seconds) / 60)}:{((TOTAL_TIME - seconds) % 60).toString().padStart(2, "0")}
              </p>
              <button
                onClick={() => setShowCelebration(false)}
                className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90"
              >
                Close
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
