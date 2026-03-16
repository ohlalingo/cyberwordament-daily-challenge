import { useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import AppHeader from "@/components/AppHeader";
import { sampleUnjumble } from "@/lib/unjumble-data";

interface WordState {
  userAnswer: string;
  status: "pending" | "correct" | "incorrect";
}

export default function Unjumble() {
  const { language } = useI18n();
  const puzzle = sampleUnjumble;

  const [words, setWords] = useState<WordState[]>(
    puzzle.words.map(() => ({ userAnswer: "", status: "pending" }))
  );
  const [submitted, setSubmitted] = useState(false);

  const updateAnswer = useCallback((index: number, value: string) => {
    setWords((prev) =>
      prev.map((w, i) => (i === index ? { ...w, userAnswer: value.toUpperCase() } : w))
    );
  }, []);

  const handleSubmit = () => {
    setSubmitted(true);
    setWords((prev) =>
      prev.map((w, i) => ({
        ...w,
        status: w.userAnswer === puzzle.words[i].answer ? "correct" : "incorrect",
      }))
    );
  };

  const correctCount = words.filter((w) => w.status === "correct").length;
  const allCorrect = submitted && correctCount === puzzle.words.length;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-content px-4 pt-20 pb-12">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold font-heading text-foreground">Unjumble</h1>
          {submitted && (
            <span className="text-sm font-mono text-muted-foreground animate-slide-up">
              {correctCount}/{puzzle.words.length} correct
            </span>
          )}
        </div>

        <div className="space-y-4">
          {puzzle.words.map((word, i) => {
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
                  disabled={submitted}
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
      </main>
    </div>
  );
}
