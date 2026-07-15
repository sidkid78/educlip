import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

export const metadata: Metadata = {
  title: "EduClip | Architecture Reference",
  description: "Technical architecture reference for the EduClip micro-learning factory.",
};

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
});

const MONO = "[font-family:var(--font-plex-mono)]";

/* ---------- small building blocks ---------- */

function Section({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-9">
      <h2 className="text-[20px] font-semibold text-[#16211f] border-l-4 border-[#1f5f5b] pl-2.5">
        {num}. {title}
      </h2>
      {children}
    </section>
  );
}

function MonoLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${MONO} text-[12px] uppercase tracking-[0.08em] text-[#5b5f5c] mt-4 mb-1.5`}>{children}</div>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#d8d5cd] rounded-[2px] px-3.5 py-3 break-inside-avoid">
      <div className={`${MONO} text-[11px] uppercase tracking-[0.08em] text-[#1f5f5b] mb-1.5`}>{label}</div>
      <div className="text-[13.5px] leading-relaxed text-[#2b2f2c]">{children}</div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-[#16211f] text-[#e8e6e1] text-[11.5px] leading-[1.65] px-4 py-3.5 rounded-[4px] overflow-x-auto break-inside-avoid">
      <code className={MONO}>{children}</code>
    </pre>
  );
}

function Node({ children, tone = "ink", dashed = false }: { children: React.ReactNode; tone?: "ink" | "teal"; dashed?: boolean }) {
  const cls =
    tone === "teal"
      ? "border-[#1f5f5b] bg-[#eaf1f0] text-[#16211f]"
      : dashed
      ? "border-[#8a8e8a] border-dashed text-[#4a4e4b] bg-transparent"
      : "border-[#16211f] bg-white text-[#16211f]";
  return <div className={`border-[1.5px] ${dashed ? "border" : ""} rounded-[4px] px-3 py-2 text-[12.5px] ${cls}`}>{children}</div>;
}

function Pill({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <div
      className={`rounded-full px-3 py-[5px] text-[11.5px] ${
        active ? "border-[1.5px] border-[#1f5f5b] font-semibold bg-[#eaf1f0] text-[#16211f]" : "border border-[#8a8e8a] text-[#2b2f2c]"
      }`}
    >
      {children}
    </div>
  );
}

/* ---------- page ---------- */

export default function ArchitecturePage() {
  return (
    <div
      className={`${sans.variable} ${mono.variable} -m-6 lg:-m-8 min-h-full bg-[#e8e6e1] [font-family:var(--font-plex-sans)] text-[#2b2f2c]`}
    >
      <div className="mx-auto max-w-[860px] px-5 py-10 sm:px-8 lg:px-10">
        {/* header */}
        <header className="flex items-baseline justify-between border-b-[3px] border-[#16211f] pb-[18px]">
          <div>
            <div className={`${MONO} text-[12px] tracking-[0.12em] uppercase text-[#1f5f5b] mb-1.5`}>
              Technical Architecture Reference
            </div>
            <h1 className="text-[34px] font-bold text-[#16211f] tracking-[-0.01em] leading-none">EduClip</h1>
            <div className="text-[15px] text-[#5b5f5c] mt-1">
              Turning long-form content into viral micro-learning assets — system design for personal reference
            </div>
          </div>
          <div className={`${MONO} text-[11px] text-[#8a8e8a] text-right whitespace-nowrap`}>v1.0 · Jul 2026</div>
        </header>

        {/* 1. OVERVIEW */}
        <Section num={1} title="Overview">
          <p className="text-[14.5px] leading-[1.65] text-[#2b2f2c] mt-3">
            EduClip is an AI SaaS that repurposes long-form video, webinars, and ebooks into social carousels,
            short-form video scripts, and newsletter lessons for solo educators. The system is a{" "}
            <strong>Micro-Learning Factory</strong>: an asynchronous pipeline that ingests raw content, extracts
            teachable concepts via LLMs, renders them into branded assets, and schedules them across platforms — with a
            human-in-the-loop review step throughout.
          </p>
          <table className="w-full border-collapse mt-3.5 text-[13px]">
            <thead>
              <tr className="bg-[#16211f] text-[#f2f0ea]">
                <th className="text-left px-2.5 py-2 font-semibold">Success metric</th>
                <th className="text-left px-2.5 py-2 font-semibold">Target</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Processing time", "1-hour video → assets in <10 min", false],
                ["Extraction accuracy", "<20% manual edit required", true],
                ["Scalability", "1,000+ concurrent active users", false],
                ["Distribution", "Auto-post to 3+ social platforms", true],
                ["Retention", "High content-to-publish conversion", false],
              ].map(([k, v, alt]) => (
                <tr key={k as string} className={`border-b border-[#d8d5cd] ${alt ? "bg-[#f4f2ed]" : ""}`}>
                  <td className="px-2.5 py-[7px]">{k}</td>
                  <td className="px-2.5 py-[7px] text-[#4a4e4b]">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* 2. TECH STACK */}
        <Section num={2} title="Tech Stack">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3">
            <Card label="Frontend">
              Next.js 14 (App Router) · Tailwind CSS + Shadcn/UI · Zustand (editor state) · TanStack Query (server
              state) · Framer Motion
            </Card>
            <Card label="Backend API">
              Python (FastAPI) · REST (external) · gRPC (internal, media↔AI) · Docker on AWS ECS Fargate + Lambda
            </Card>
            <Card label="AI / ML">
              Google Gen AI SDK (Interactions API) · Gemini 3.5 Flash (reasoning + synthesis) · Gemini multimodal audio
              (speech-to-text + diarization) · gemini-embedding-001 (vectorization)
            </Card>
            <Card label="Data">
              PostgreSQL (relational) · Pinecone (vector/RAG) · S3 (media objects) · Redis (cache, queue, rate limit)
            </Card>
            <Card label="Media generation">
              Satori + Resvg (HTML/React → SVG → PNG carousels) · FFmpeg (clipping/resizing)
            </Card>
            <Card label="Auth & billing">
              Clerk (identity + multi-tenant orgs) · Stripe (subscriptions + credit metering)
            </Card>
          </div>
        </Section>

        {/* 3. SYSTEM ARCHITECTURE */}
        <Section num={3} title="System Architecture">
          <MonoLabel>Context — how EduClip meets the world</MonoLabel>
          <div className="flex items-center gap-2.5 flex-wrap break-inside-avoid">
            <Node>Solo Educator</Node>
            <span className="text-[#8a8e8a] text-base">→</span>
            <div className="border-[1.5px] border-[#1f5f5b] rounded-[4px] px-3.5 py-2.5 text-[13px] font-semibold bg-[#eaf1f0]">
              EduClip SaaS
            </div>
            <span className="text-[#8a8e8a] text-base">→</span>
            <div className="flex flex-col gap-1.5">
              {["Google Gemini (AI)", "PostgreSQL / Pinecone (data)", "IG / TikTok / LinkedIn / X", "Beehiiv / Substack"].map(
                (t) => (
                  <div key={t} className="border-[1.5px] border-[#16211f] rounded-[4px] px-3 py-1.5 text-[12px] bg-[#f4f2ed]">
                    {t}
                  </div>
                )
              )}
            </div>
          </div>

          <MonoLabel>Containers — internal service map</MonoLabel>
          <div className="border border-[#d8d5cd] rounded-[4px] p-4 bg-[#fbfaf7] break-inside-avoid">
            <div className="flex justify-center mb-2.5">
              <div className="border-[1.5px] border-[#16211f] rounded-[4px] px-4 py-2 text-[13px] bg-white">Next.js Web App</div>
            </div>
            <div className="flex justify-center mb-2.5 text-[#8a8e8a]">↓ HTTPS/REST</div>
            <div className="flex justify-center mb-2.5">
              <div className="border-[1.5px] border-[#16211f] rounded-[4px] px-4 py-2 text-[13px] bg-white">API Gateway</div>
            </div>
            <div className="flex justify-center gap-2.5 flex-wrap mb-2.5">
              {[
                ["Auth (Clerk)", false],
                ["FastAPI (Main)", true],
                ["Media Worker", false],
                ["AI Orchestrator", false],
              ].map(([t, bold]) => (
                <div
                  key={t as string}
                  className={`border-[1.5px] border-[#1f5f5b] rounded-[4px] px-3 py-[7px] text-[12px] bg-[#eaf1f0] ${
                    bold ? "font-semibold" : ""
                  }`}
                >
                  {t}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2.5 flex-wrap">
              {["S3 (media)", "PostgreSQL", "Pinecone", "SQS/Redis queue"].map((t) => (
                <div key={t} className="border border-dashed border-[#8a8e8a] rounded-[4px] px-3 py-1.5 text-[11.5px] text-[#4a4e4b]">
                  {t}
                </div>
              ))}
            </div>
          </div>
          <p className="text-[13px] text-[#5b5f5c] mt-2.5 leading-relaxed">
            Scaling to zero: workers spin down when queues are empty (Fargate), and back up under load via
            queue-depth-triggered auto-scaling. Dead-letter queues catch failed AI jobs so a single timeout never costs a
            user their credits.
          </p>
        </Section>

        {/* 4. INGESTION */}
        <Section num={4} title="Multi-Modal Ingestion Pipeline">
          <p className="text-[14px] leading-relaxed text-[#2b2f2c] mt-3">
            <strong>Upload:</strong> the client requests a presigned S3 URL and uploads the raw file directly, keeping
            large binaries off the API. On confirmation, a <code className={MONO}>Source</code> row is created (
            <code className={MONO}>PENDING</code>) and a job is pushed to a Celery/Redis queue, split into{" "}
            <code className={MONO}>high_priority</code> (text/PDF) and <code className={MONO}>media_priority</code>{" "}
            (video/audio) lanes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2.5">
            <div className="border border-[#d8d5cd] px-3.5 py-3 break-inside-avoid">
              <div className="text-[12px] font-semibold text-[#1f5f5b] mb-1.5">Media path (video/audio)</div>
              <ol className="text-[13px] leading-[1.7] text-[#2b2f2c] m-0 pl-[18px] list-decimal">
                <li>File sent inline (base64) to Gemini</li>
                <li>Gemini multimodal audio transcribes speech → text</li>
                <li>Speaker diarization for webinars</li>
                <li>Transcript handed to the extraction pipeline</li>
              </ol>
            </div>
            <div className="border border-[#d8d5cd] px-3.5 py-3 break-inside-avoid">
              <div className="text-[12px] font-semibold text-[#1f5f5b] mb-1.5">Document path (PDF/ebook)</div>
              <ol className="text-[13px] leading-[1.7] text-[#2b2f2c] m-0 pl-[18px] list-decimal">
                <li>PyMuPDF text extraction</li>
                <li>AWS Textract/Tesseract OCR fallback for image PDFs</li>
                <li>Cleaning pass strips headers, footers, page numbers</li>
              </ol>
            </div>
          </div>

          <MonoLabel>API surface</MonoLabel>
          <Code>{`GET  /v1/ingest/upload-url?file_name&content_type
       → { upload_url, file_key, expires_in }

POST /v1/ingest/confirm
       { file_key, file_type, metadata } → 202 Accepted { job_id }

GET  /v1/ingest/status/{job_id}
       → { status, progress, estimated_time_remaining }`}</Code>

          <MonoLabel>Sources schema</MonoLabel>
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-[#16211f] text-[#f2f0ea]">
                <th className="text-left px-2.5 py-1.5">Field</th>
                <th className="text-left px-2.5 py-1.5">Type</th>
                <th className="text-left px-2.5 py-1.5">Notes</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["source_type", "enum", "video / audio / pdf / text", false],
                ["processed_s3_url", "string", "cleaned transcript / text JSON", true],
                ["status", "enum", "pending / processing / completed / failed", false],
                ["word_count / duration", "int / float", "drives credit billing", false],
              ].map(([f, t, n, alt]) => (
                <tr key={f as string} className={`border-b border-[#d8d5cd] ${alt ? "bg-[#f4f2ed]" : ""}`}>
                  <td className="px-2.5 py-1.5">{f}</td>
                  <td className="px-2.5 py-1.5 text-[#5b5f5c]">{t}</td>
                  <td className="px-2.5 py-1.5 text-[#5b5f5c]">{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[13px] text-[#5b5f5c] mt-2.5">
            Reliability: videos &gt;2h are chunked into 20-min segments and transcribed in parallel (~60% latency cut).
            Failed jobs retry 3× with backoff, then land in a DLQ for inspection.
          </p>
        </Section>

        {/* 5. AI CORE */}
        <Section num={5} title="AI Concept Extraction & Synthesis">
          <p className="text-[14px] leading-relaxed text-[#2b2f2c] mt-3">
            The engine runs entirely on <strong>Google Gemini via the Interactions API</strong> (google-genai SDK ≥ 2.0)
            with structured, JSON-schema output. A single call can&apos;t safely distill an hour of content, so it runs as
            a <strong>Map-Reduce-Synthesize</strong> pipeline.
          </p>
          <ol className="text-[13.5px] leading-[1.8] text-[#2b2f2c] mt-2.5 pl-[18px] list-decimal">
            <li>
              <strong>Transcription</strong> — Gemini&apos;s native multimodal audio understanding transcribes the
              uploaded audio/video (sent inline as base64) with speaker diarization — no separate transcription service.
            </li>
            <li>
              <strong>Semantic chunking</strong> — sentences are embedded with <code className={MONO}>gemini-embedding-001</code>;
              a new chunk begins when cosine similarity between consecutive sentences drops below threshold (not fixed-size splits).
            </li>
            <li>
              <strong>Master Outline (Map-Reduce)</strong> — each chunk is bullet-summarized, then Gemini 3.5 Flash
              synthesizes a global outline that&apos;s prepended to every extraction call, so no chunk is read out of context.
            </li>
            <li>
              <strong>Structured extraction</strong> — each chunk → a Gemini Interactions call bound to a Pydantic JSON
              schema, returning &quot;Teachable Moments&quot; (title, core lesson, key points, complexity, asset potential).
            </li>
            <li>
              <strong>Per-format synthesis</strong> — every concept fans out to three schema-bound Gemini calls: a
              brand-injected carousel, a hook/body/CTA short-form script, and a Markdown newsletter. Runs in a background
              thread locally, or on Celery workers in production.
            </li>
          </ol>

          <MonoLabel>Extraction prompt (structured output)</MonoLabel>
          <Code>{`SYSTEM: You are an expert Instructional Designer and Viral Content
Strategist. Extract high-signal educational value; ignore filler
and housekeeping talk.

TASK: Identify "Teachable Moments" in this transcript chunk.
CONTEXT: {{global_outline}}

OUTPUT (JSON):
{
  "concepts": [{
    "title": "...", "timestamp_start": "00:12:30",
    "core_lesson": "...", "key_points": ["...", "..."],
    "complexity_level": "Beginner|Intermediate|Advanced",
    "asset_potential": ["Carousel","Short-form Video","Newsletter"]
  }]
}`}</Code>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3.5">
            {[
              ["Gemini 3.5 Flash", "Reasoning, extraction & creative synthesis (structured JSON)"],
              ["Interactions API", "Stateful structured generation via google-genai ≥ 2.0"],
              ["gemini-embedding-001", "Cost-effective vectorization for semantic chunking"],
            ].map(([m, d]) => (
              <div key={m} className="border border-[#d8d5cd] px-3 py-2.5 break-inside-avoid">
                <div className="text-[11.5px] font-semibold text-[#1f5f5b]">{m}</div>
                <div className="text-[12.5px] text-[#4a4e4b] mt-1">{d}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* 6. ASSET GEN */}
        <Section num={6} title="Automated Asset Generation">
          <p className="text-[14px] leading-relaxed text-[#2b2f2c] mt-3">
            The Orchestrator maps each concept to templates by <code className={MONO}>pedagogical_type</code>, then fans
            out to three renderers.
          </p>
          <div className="mt-3">
            {[
              [
                "Carousels — Satori + Resvg",
                "React components → SVG → high-res PNG. Brand kit (color/font/logo) injected per slide. Slide 1 = hook (big type), 2–6 = progressive steps, 7 = CTA with avatar. Fluid typography scales text down if it overflows the safe zone.",
              ],
              [
                "Short-form scripts — pattern matching",
                'A library of proven Hook→Body→CTA structures (e.g. "Negative Hook" for mindset shifts, "Listicle" for how-tos) is selected by vibe/type, then hydrated with the extracted copy — voice stays the creator\'s, structure is algorithm-optimized.',
              ],
              [
                "Newsletter lessons — Markdown",
                'TL;DR blockquote → deep-dive subheads from key_points → visual anchor (carousel image) → a concrete "Action Step" section.',
              ],
            ].map(([t, d]) => (
              <div key={t} className="border-l-[3px] border-[#1f5f5b] px-3.5 py-2 mb-2.5 break-inside-avoid">
                <div className="text-[13px] font-semibold text-[#16211f]">{t}</div>
                <div className="text-[13px] text-[#4a4e4b] leading-relaxed">{d}</div>
              </div>
            ))}
          </div>

          <MonoLabel>Carousel template schema (excerpt)</MonoLabel>
          <Code>{`{
  "template_id": "modern_minimalist_01",
  "dimensions": { "width": 1080, "height": 1350 },
  "global_styles": { "primary_color": "{{brand_primary}}" },
  "slides": [
    { "type": "hook_slide", "elements": { "headline": "{{concept_title}}" } },
    { "type": "content_slide", "repeat_for": "key_points",
      "elements": { "step_number": "Step {{index}}", "body_text": "{{point_text}}" } },
    { "type": "cta_slide", "elements": { "handle": "@{{user_handle}}" } }
  ]
}`}</Code>
          <p className="text-[13px] text-[#5b5f5c] mt-2.5">
            If generated text overflows a slide&apos;s constraints, the engine triggers a summarization retry with an
            explicit character limit rather than truncating. A live preview in the dashboard reuses the same rendering
            logic so what the user edits is what gets published.
          </p>
        </Section>

        {/* 7. SAAS INFRA */}
        <Section num={7} title="SaaS Infrastructure & Multi-Tenancy">
          <p className="text-[14px] leading-relaxed text-[#2b2f2c] mt-3">
            Tenancy is <strong>logical</strong>: every resource carries an{" "}
            <code className={MONO}>organization_id</code>, enforced at the database layer with Row Level Security — so
            even a missing filter in application code can&apos;t leak data across educators.
          </p>
          <MonoLabel>Core tables</MonoLabel>
          <Code>{`organizations( id, name, slug, stripe_customer_id,
               subscription_status, plan_tier, ai_credits_remaining )
users( id, email, full_name, last_login )
memberships( organization_id, user_id, role )   -- owner/admin/member
projects( id, organization_id, name )
sources( id, organization_id, project_id, type, s3_key, vector_namespace )
assets( id, organization_id, source_id, asset_type,
        content_data JSONB, status, scheduled_at, external_platform_id )`}</Code>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
            <div className="border border-[#d8d5cd] px-3.5 py-3 break-inside-avoid">
              <div className="text-[12px] font-semibold text-[#1f5f5b] mb-1.5">Auth flow (Clerk)</div>
              <ol className="text-[12.5px] leading-[1.7] text-[#2b2f2c] m-0 pl-4 list-decimal">
                <li>Sign-up via Clerk-hosted UI</li>
                <li>
                  <code className={MONO}>user.created</code>/<code className={MONO}>organization.created</code> webhooks
                  provision DB rows
                </li>
                <li>
                  JWT carries <code className={MONO}>user_id</code> + <code className={MONO}>org_id</code> claims
                </li>
                <li>Middleware verifies membership before every request</li>
              </ol>
            </div>
            <div className="border border-[#d8d5cd] px-3.5 py-3 break-inside-avoid">
              <div className="text-[12px] font-semibold text-[#1f5f5b] mb-1.5">Credit metering (Stripe)</div>
              <ol className="text-[12.5px] leading-[1.7] text-[#2b2f2c] m-0 pl-4 list-decimal">
                <li>
                  Checkout → <code className={MONO}>invoice.paid</code> webhook activates plan
                </li>
                <li>Credits top up by tier on each cycle</li>
                <li>
                  Before any AI job: check &amp; decrement <code className={MONO}>ai_credits_remaining</code>
                </li>
                <li>
                  Zero credits → <code className={MONO}>402</code>, prompt upgrade
                </li>
              </ol>
            </div>
          </div>
          <p className="text-[13px] text-[#5b5f5c] mt-3">
            Security: API keys live in AWS Secrets Manager; media is served via 15-minute presigned URLs; OAuth tokens
            are encrypted at rest with AES-256-GCM and decrypted only in-memory during publish; all deletes/exports are
            audit-logged; Redis + FastAPI-Limiter rate-limit by <code className={MONO}>organization_id</code>.
          </p>
        </Section>

        {/* 8. DISTRIBUTION */}
        <Section num={8} title="Distribution & Scheduling">
          <table className="w-full border-collapse text-[12.5px] mt-3">
            <thead>
              <tr className="bg-[#16211f] text-[#f2f0ea]">
                <th className="text-left px-2.5 py-1.5">Platform</th>
                <th className="text-left px-2.5 py-1.5">Assets</th>
                <th className="text-left px-2.5 py-1.5">Note</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["LinkedIn", "Carousel (PDF), image, text", "Register upload → upload binary → create post", false],
                ["Instagram", "Reels, carousel images", "Requires linked Business + FB Page", true],
                ["TikTok", "Short-form video", "video.upload + video.publish scopes", false],
                ["Twitter/X", "Threads, images", "Media upload endpoint separate from post", true],
                ["Beehiiv/Substack", "Markdown/HTML", "Beehiiv has a full API; Substack via RSS/automation", false],
              ].map(([p, a, n, alt]) => (
                <tr key={p as string} className={`border-b border-[#d8d5cd] ${alt ? "bg-[#f4f2ed]" : ""}`}>
                  <td className="px-2.5 py-1.5">{p}</td>
                  <td className="px-2.5 py-1.5 text-[#5b5f5c]">{a}</td>
                  <td className="px-2.5 py-1.5 text-[#5b5f5c]">{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[13px] text-[#2b2f2c] leading-relaxed mt-2.5">
            All platforms implement one <code className={MONO}>IPublisher</code> interface (
            <code className={MONO}>validateAsset</code>, <code className={MONO}>uploadMedia</code>,{" "}
            <code className={MONO}>publish</code>, <code className={MONO}>getAnalytics</code>) so the scheduler never
            branches on platform.
          </p>

          <MonoLabel>Asset lifecycle</MonoLabel>
          <div className="flex gap-1.5 flex-wrap items-center break-inside-avoid">
            {["Draft", "Pending review", "Approved", "Scheduled", "Publishing"].map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <Pill>{s}</Pill>
                <span className="text-[#8a8e8a]">→</span>
              </div>
            ))}
            <Pill active>Published</Pill>
          </div>
          <p className="text-[13px] text-[#5b5f5c] leading-relaxed mt-2.5">
            Scheduler is a Redis/BullMQ delayed-job queue keyed by UTC time (converted from the user&apos;s timezone).
            5xx/429s retry with exponential backoff (2, 4, 8, 16 min) before landing in a DLQ with a dashboard
            notification. Edits to an already-<code className={MONO}>PUBLISHING</code> job are rejected to avoid partial
            updates; each job carries a <code className={MONO}>request_id</code> for idempotency.
          </p>
        </Section>

        {/* 9. DASHBOARD */}
        <Section num={9} title="Creator Dashboard & Editor">
          <p className="text-[14px] leading-relaxed text-[#2b2f2c] mt-3">
            Optimized for <strong>Time-to-Asset</strong>: minimum clicks from upload to scheduled post. Three-pane
            editor — source/AI insights on the left, live visual canvas in the center, brand/distribution controls on
            the right — mirrors the render engine exactly (Satori-based CSS replica) so edits are true WYSIWYG.
          </p>
          <div className="border border-[#d8d5cd] rounded-[4px] p-3.5 mt-3 break-inside-avoid bg-[#fbfaf7]">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr_0.8fr] gap-2.5 text-[11.5px]">
              <div className="border border-dashed border-[#8a8e8a] rounded-[3px] p-2.5 text-[#4a4e4b]">
                Source panel
                <br />
                <span className="text-[#8a8e8a]">transcript · AI concepts · regenerate</span>
              </div>
              <div className="border-[1.5px] border-[#1f5f5b] rounded-[3px] p-2.5 text-[#16211f] bg-[#eaf1f0]">
                Visual canvas
                <br />
                <span className="text-[#4a4e4b]">carousel / script / newsletter preview</span>
              </div>
              <div className="border border-dashed border-[#8a8e8a] rounded-[3px] p-2.5 text-[#4a4e4b]">
                Style &amp; distribution
                <br />
                <span className="text-[#8a8e8a]">brand kit · platforms · schedule</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
            <div className="border border-[#d8d5cd] px-3.5 py-3 break-inside-avoid">
              <div className="text-[12px] font-semibold text-[#1f5f5b] mb-1.5">Component tree</div>
              <div className={`${MONO} text-[12px] leading-[1.7] text-[#2b2f2c]`}>
                Layout/ (Sidebar, TenantSwitcher)
                <br />
                Dashboard/ (Dropzone, CreditMeter)
                <br />
                Editor/ (SourcePanel, AssetCanvas, ControlPanel)
                <br />
                Calendar/ (FullCalendar + drag-schedule)
              </div>
            </div>
            <div className="border border-[#d8d5cd] px-3.5 py-3 break-inside-avoid">
              <div className="text-[12px] font-semibold text-[#1f5f5b] mb-1.5">State</div>
              <div className="text-[12.5px] leading-[1.7] text-[#2b2f2c]">
                Zustand for zero-latency editor state (text/theme edits); TanStack Query for source/asset/status sync
                with the API. Drag-drop onto the calendar issues a <code className={MONO}>PATCH</code> that updates{" "}
                <code className={MONO}>scheduled_at</code> + status.
              </div>
            </div>
          </div>
        </Section>

        {/* 10. RECOMMENDATIONS */}
        <Section num={10} title="Open Gaps & Next Steps">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2.5">
            <div>
              <div className="text-[12px] font-semibold text-[#1f5f5b] mb-1.5">Not yet designed</div>
              <ul className="text-[13px] leading-[1.7] text-[#2b2f2c] m-0 pl-[18px] list-disc">
                <li>Mobile app / PWA for on-the-go review</li>
                <li>Cross-platform analytics dashboard</li>
                <li>Template marketplace / community library</li>
              </ul>
            </div>
            <div>
              <div className="text-[12px] font-semibold text-[#1f5f5b] mb-1.5">Recommended next</div>
              <ul className="text-[13px] leading-[1.7] text-[#2b2f2c] m-0 pl-[18px] list-disc">
                <li>Viral feedback loop: engagement data → hook-pattern ranking</li>
                <li>Edge-rendered live previews for zero-latency editing</li>
                <li>Speaker-aware extraction for interview-style content</li>
              </ul>
            </div>
          </div>
        </Section>

        <footer className="mt-10 pt-4 border-t border-[#d8d5cd] text-[11px] text-[#8a8e8a] flex justify-between">
          <span>EduClip — Micro-Learning Factory</span>
          <span className={MONO}>Architecture Reference · v1.0</span>
        </footer>
      </div>
    </div>
  );
}
