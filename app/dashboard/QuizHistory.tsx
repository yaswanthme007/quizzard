"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Quiz = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  questions: { id: string }[];
};

export default function QuizHistory({ quizzes }: { quizzes: Quiz[] }) {
  const router = useRouter();

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
      <h3 className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-4">
        Recent Quizzes
      </h3>

      {quizzes.length === 0 ? (
        <p className="text-sm text-white/25 text-center py-8">
          No quizzes yet. Create your first one!
        </p>
      ) : (
        <div className="space-y-1">
          {quizzes.map((quiz, i) => (
            <motion.button
              key={quiz.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => router.push(`/quiz/${quiz.id}`)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/8 transition-all text-left group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/80 group-hover:text-white truncate transition-colors">
                  {quiz.title}
                </p>
                <p className="text-xs text-white/30 mt-0.5">
                  {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""} ·{" "}
                  {new Date(quiz.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <span
                className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                  quiz.status === "published"
                    ? "bg-green-500/15 text-green-400 border border-green-500/20"
                    : "bg-white/6 text-white/35 border border-white/10"
                }`}
              >
                {quiz.status}
              </span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
