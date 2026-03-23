import { useState, useCallback, useEffect } from "react";
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
  const { t } = useI18n();
  const { user } = useAuth();
  const language = user?.language || "en";
  const [puzzle, setPuzzle] = useState(sampleUnjumble);
  const TOTAL_TIME = 600;
  const [seconds, setSeconds] = useState(TOTAL_TIME);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasPuzzle, setHasPuzzle] = useState(false);
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const requestedId = searchParams.get("puzzleContentId");

  const [words, setWords] = useState<WordState[]>(
    (puzzle as any).questions
      ? (puzzle as any).questions.map(() => ({ userAnswer: "", status: "pending" }))
      : puzzle.words.map(() => ({ userAnswer: "", status: "pending" }))
  );

  useEffect(() => {
    fetch(`${API_BASE}/puzzle/today?lang=${language || "en"}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
      .then((data) => {
        const ujArr = Array.isArray(data?.unjumble) ? data.unjumble : data?.unjumble ? [data.unjumble] : [];
        if (ujArr[0]) {
          const chosen = requestedId
            ? ujArr.find((u: any) => String(u.puzzleContentId ?? u.puzzle_content_id) === requestedId)
            : ujArr[0];
          const uq = {
            ...chosen,
            questions: chosen.questions ?? chosen.words ?? [],
            puzzleContentId: chosen.puzzleContentId ?? chosen.puzzle_content_id,
          };
          setPuzzle(uq);
          setHasPuzzle(true);
        } else {
          setHasPuzzle(false);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("🚨 Unjumble fetch FAILED:", err);
        setHasPuzzle(false);
        setLoading(false);
      });
  }, [language]);

  // Reset state when a new puzzle arrives
  useEffect(() => {
    const q = (puzzle as any).questions ?? [];
    if (!q.length) return;
    setWords(q.map(() => ({ userAnswer: "", status: "pending" })));
    setSeconds(TOTAL_TIME);
    setSubmitted(false);
  }, [puzzle.puzzleContentId]);

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

  const handleComplete = async (correctCount: number) => {
    const puzzleContentId = Number((puzzle as any)?.puzzleContentId);
    const userId = Number((user as any)?.id);
    if (!puzzleContentId || !userId) {
      console.error("🚨 Missing puzzleContentId — attempt NOT saved");
      return;
    }
    const completionKey = `completed_puzzle_${(puzzle as any)?.puzzleId ?? puzzleContentId}`;
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
    setWords((prev) =>
      prev.map((w, i) => (i === index ? { ...w, userAnswer: value.toUpperCase() } : w))
    );
  }, []);

  const handleSubmit = () => {
    if (submitted) return;
    const questions = (puzzle as any).questions ?? [];
    const nextWords = words.map((w, i) => ({
      ...w,
      status: w.userAnswer === questions[i]?.answer ? "correct" : "incorrect",
    }));
    setWords(nextWords);
    setSubmitted(true);
    const correctCount = nextWords.filter((w) => w.status === "correct").length;
    void handleComplete(correctCount);
  };

  const questions = (puzzle as any).questions ?? [];
  const correctCount = words.filter((w) => w.status === "correct").length;
  const allCorrect = submitted && questions.length > 0 && correctCount === questions.length;

  console.log("PUZZLE DATA:", puzzle);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-content px-4 pt-20 pb-12">
        {loading ? (
          <div className="text-center text-sm text-muted-foreground">Loading puzzle...</div>
        ) : !hasPuzzle ? (
          <div className="text-center text-sm text-muted-foreground">No unjumble puzzle available today.</div>
        ) : (
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-heading text-foreground">Unjumble</h1>
            <p className="text-xs text-muted-foreground">
              Rearrange the scrambled letters to form the correct word. Enter the word once arranged.
            </p>
          </div>
          <span className="text-sm font-mono text-muted-foreground">
            {submitted ? `${correctCount}/${questions.length} correct • ` : ""}{Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, "0")}
          </span>
        </div>
        )}

        {!questions.length ? (
          <div className="text-center p-4">No puzzle available</div>
        ) : (
          <>
            <div className="space-y-4">
              {questions.map((word: any, i: number) => {
                const state = words[i];
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
                        {language === "ja" ? word.hintJa : word.hint}
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
                onClick={handleSubmit}
                disabled={submitted}
                className="rounded-lg bg-primary px-8 py-2.5 text-sm font-semibold font-heading text-primary-foreground hover:opacity-90 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                Submit
              </button>
            </div>

            {allCorrect && (
              <div className="mt-6 animate-celebrate text-center">
                <div className="rounded-lg bg-success/10 p-4 text-success font-semibold">
                  🎉 Perfect! All words unscrambled!
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
