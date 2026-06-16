import { Suspense } from "react";
import JoinForm from "./JoinForm";

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 flex items-center justify-center px-4">
      <Suspense>
        <JoinForm />
      </Suspense>
    </div>
  );
}
