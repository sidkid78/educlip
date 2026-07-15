import type { Metadata } from "next";
import { Bricolage_Grotesque, Public_Sans } from "next/font/google";
import PipelineAnimation from "./PipelineAnimation";

export const metadata: Metadata = {
  title: "EduClip | Pipeline Animation",
  description:
    "Animated walkthrough of the EduClip pipeline: ingest, extract, generate, distribute.",
};

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});
const body = Public_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

export default function PipelinePage() {
  return (
    <div className={`${display.variable} ${body.variable} mx-auto max-w-[1328px]`}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Pipeline Animation</h1>
        <p className="mt-1 text-sm text-slate-500">
          How EduClip turns one long-form upload into an entire content system — ingest,
          extract, generate, distribute.
        </p>
      </div>
      <PipelineAnimation />
    </div>
  );
}
