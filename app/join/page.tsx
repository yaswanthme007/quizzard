import { Suspense } from "react";
import JoinForm from "./JoinForm";

export default function JoinPage() {
  return (
    <div className="relative min-h-screen bg-[#080810] flex items-center justify-center px-4">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-indigo-600/8 blur-[120px]" />
      <Suspense>
        <JoinForm />
      </Suspense>
    </div>
  );
}
