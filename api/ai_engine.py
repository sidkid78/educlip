from typing import List, Dict, Any, Optional, Type, TypeVar
import math
from pydantic import BaseModel, Field
from google import genai
from api.config import settings

T = TypeVar("T", bound=BaseModel)

# 1. Pydantic Schemas for Structured AI Extraction

class ExtractedConcept(BaseModel):
    title: str = Field(..., description="Short, punchy title for the educational concept")
    core_lesson: str = Field(..., description="A 1-sentence summary of the main concept")
    key_points: List[str] = Field(..., description="Detailed takeaways or step-by-step instructions")
    complexity_level: str = Field(..., description="Beginner, Intermediate, or Advanced")
    vibe_check: str = Field(..., description="Estimated tone of the section (e.g., energetic, professional, humorous)")

class ExtractedConceptsList(BaseModel):
    concepts: List[ExtractedConcept]

# Pydantic Schemas for Structured Asset Generation

class CarouselSlide(BaseModel):
    slide_type: str = Field(..., description="hook_slide, content_slide, or cta_slide")
    headline: Optional[str] = Field(None, description="Main large text on the slide")
    body_text: Optional[str] = Field(None, description="Supporting details or explanation text")
    step_number: Optional[str] = Field(None, description="For progressive slides, e.g., 'Step 1 of 5'")
    icon: Optional[str] = Field(None, description="Optional icon name to display (e.g., check, arrow, alert)")

class CarouselAsset(BaseModel):
    template_id: str = Field(..., description="Theme template identifier, e.g., 'modern_minimalist_01'")
    primary_color: str = Field(..., description="Brand hex primary color")
    bg_color: str = Field(..., description="Hex background color")
    slides: List[CarouselSlide] = Field(..., description="Complete set of slides from Hook to CTA")

class ScriptSegment(BaseModel):
    role: str = Field(..., description="hook, body, or cta")
    text: str = Field(..., description="Spoken words/script script text")
    visual_cue: str = Field(..., description="On-screen visual guidance or b-roll descriptions")
    duration: str = Field(..., description="Segment duration, e.g., '3s', '15s'")

class ShortVideoScript(BaseModel):
    estimated_duration: str = Field(..., description="Total estimated video length, e.g., '45s'")
    segments: List[ScriptSegment]

class NewsletterLesson(BaseModel):
    title: str = Field(..., description="Lesson headline")
    tagline: str = Field(..., description="Short catchphrase summary")
    tl_dr: str = Field(..., description="A blockquote section for quick scanning")
    breakdown_markdown: str = Field(..., description="The main content formatted in clear Markdown with subheaders")
    action_item_markdown: str = Field(..., description="Practical homework or action step for the reader")


# 2. AI Engine Implementation

class EduClipAIEngine:
    def __init__(self):
        # Initialize Gemini GenAI client (google-genai >= 2.0, Interactions API).
        # It automatically resolves GEMINI_API_KEY from environment variables if not passed.
        api_key = None if settings.GEMINI_API_KEY == "mock_gemini_key" else settings.GEMINI_API_KEY
        # Generous per-request timeout (ms) — structured multi-slide generations can
        # occasionally exceed the SDK default and would otherwise fall back to mock.
        self.client = genai.Client(api_key=api_key, http_options={"timeout": 180_000})

    @property
    def _is_mock(self) -> bool:
        """True when no real API key is configured, so we return rich simulated data."""
        return settings.GEMINI_API_KEY == "mock_gemini_key"

    def _generate_structured(
        self,
        prompt: str,
        schema_model: Type[T],
        system_instruction: str,
        temperature: float = 0.4,
    ) -> T:
        """
        Single structured-generation call via the new Interactions API.
        Returns a validated instance of `schema_model`.
        """
        interaction = self.client.interactions.create(
            model=settings.GEMINI_MODEL,
            input=prompt,
            system_instruction=system_instruction,
            generation_config={"temperature": temperature},
            response_format={
                "type": "text",
                "mime_type": "application/json",
                "schema": schema_model.model_json_schema(),
            },
        )
        return schema_model.model_validate_json(interaction.output_text)

    def _generate_text(
        self,
        prompt: str,
        temperature: float = 0.2,
        system_instruction: Optional[str] = None,
    ) -> str:
        """Plain free-text generation via the Interactions API."""
        kwargs: Dict[str, Any] = {
            "model": settings.GEMINI_MODEL,
            "input": prompt,
            "generation_config": {"temperature": temperature},
        }
        if system_instruction:
            kwargs["system_instruction"] = system_instruction
        interaction = self.client.interactions.create(**kwargs)
        return interaction.output_text

    def transcribe_media(self, file_path: str, mime_type: Optional[str] = None) -> str:
        """
        Transcribe an audio OR video file to text using Gemini's native multimodal
        understanding (speech-to-text + speaker labels) via the Interactions API.
        Returns "" in mock mode so callers can fall back to a simulated transcript.
        """
        if self._is_mock:
            return ""

        import base64
        import mimetypes
        from pathlib import Path

        mt = mime_type or mimetypes.guess_type(file_path)[0] or "audio/wav"
        part_type = "video" if mt.startswith("video/") else "audio"
        # Inline base64 (≤100MB) instead of the Files API — avoids the resumable-upload
        # write timeout and rides the client's 120s request timeout.
        import time

        data = base64.b64encode(Path(file_path).read_bytes()).decode("utf-8")
        # Retry transient connection resets/timeouts on the larger audio payload,
        # backing off between attempts to let flaky connections recover.
        last_err: Optional[Exception] = None
        for attempt in range(5):
            if attempt:
                time.sleep(2 * attempt)
            try:
                interaction = self.client.interactions.create(
                    model=settings.GEMINI_MODEL,
                    system_instruction=(
                        "You are a professional transcriptionist. Produce a clean, verbatim "
                        "transcript of the speech in this recording. Label distinct speakers "
                        "(Speaker 1, Speaker 2) when more than one is present. Omit filler-only "
                        "utterances and non-speech description."
                    ),
                    input=[
                        {"type": "text", "text": "Transcribe the spoken content of this recording to text."},
                        {"type": part_type, "data": data, "mime_type": mt},
                    ],
                )
                return interaction.output_text
            except Exception as e:
                last_err = e
                print(f"transcribe_media attempt {attempt + 1} failed: {e}")
        if last_err:
            raise last_err
        raise RuntimeError("transcription failed")

    def compute_cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Helper to compute cosine similarity between two vector lists."""
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        magnitude_1 = math.sqrt(sum(a * a for a in vec1))
        magnitude_2 = math.sqrt(sum(b * b for b in vec2))
        if magnitude_1 == 0 or magnitude_2 == 0:
            return 0.0
        return dot_product / (magnitude_1 * magnitude_2)

    def semantic_chunking(self, text: str, max_words: int = 500, threshold: float = 0.65) -> List[str]:
        """
        Splits a text document/transcript into semantically bounded chunks using Gemini Embeddings.
        Slices text on sentence boundaries, embeds sentences, and groups them based on cosine similarity.
        """
        # Split into raw sentences
        import re
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]
        if not sentences:
            return []

        # If API key is mock, use simple word-count based chunking
        if self._is_mock:
            return self._fallback_word_chunking(sentences, max_words)

        try:
            # Embed all sentences in a single batched request (gemini-embedding-001
            # returns one embedding per input string).
            res = self.client.models.embed_content(
                model=settings.GEMINI_EMBED_MODEL,
                contents=sentences,
            )
            embeddings = [e.values for e in res.embeddings]

            chunks = []
            current_chunk_sentences = [sentences[0]]
            current_chunk_word_count = len(sentences[0].split())

            for i in range(1, len(sentences)):
                similarity = self.compute_cosine_similarity(embeddings[i-1], embeddings[i])
                sentence_words = len(sentences[i].split())

                # Split condition: similarity is below threshold OR adding would exceed max_words
                if similarity < threshold or (current_chunk_word_count + sentence_words) > max_words:
                    chunks.append(" ".join(current_chunk_sentences))
                    current_chunk_sentences = [sentences[i]]
                    current_chunk_word_count = sentence_words
                else:
                    current_chunk_sentences.append(sentences[i])
                    current_chunk_word_count += sentence_words

            if current_chunk_sentences:
                chunks.append(" ".join(current_chunk_sentences))

            return chunks

        except Exception as e:
            # Fallback on failure
            print(f"Embedding chunking failed: {e}. Falling back to simple chunking.")
            return self._fallback_word_chunking(sentences, max_words)

    def _fallback_word_chunking(self, sentences: List[str], max_words: int) -> List[str]:
        chunks = []
        current_chunk = []
        word_count = 0
        for sentence in sentences:
            sentence_word_count = len(sentence.split())
            if word_count + sentence_word_count > max_words:
                chunks.append(" ".join(current_chunk))
                current_chunk = [sentence]
                word_count = sentence_word_count
            else:
                current_chunk.append(sentence)
                word_count += sentence_word_count
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        return chunks

    def extract_concepts(self, text: str) -> List[ExtractedConcept]:
        """
        Main distillation logic. Takes text, splits it, runs Map-Reduce style synthesis via LLM,
        and returns structured educational concepts.
        """
        chunks = self.semantic_chunking(text, max_words=600)
        if not chunks:
            return []

        # If mock key, return beautiful simulation values
        if self._is_mock:
            return self._mock_concepts()

        extracted_concepts: List[ExtractedConcept] = []
        try:
            # To respect RAG and maintain global context, we first ask for a global outline
            global_outline = self._generate_global_outline(chunks)

            # Extract concepts from chunks in parallel or sequential
            for chunk in chunks[:3]: # Limit to first 3 chunks to prevent excessive API costs/limits
                prompt = f"""
                You are a world-class Instructional Designer and Social Media Strategist.
                Your task is to analyze the provided educational transcript chunk and extract clear, actionable teachable moments.

                GLOBAL CONTEXT OUTLINE:
                {global_outline}

                TRANSCRIPT CHUNK:
                {chunk}
                """

                parsed = self._generate_structured(
                    prompt=prompt,
                    schema_model=ExtractedConceptsList,
                    system_instruction="Extract 'Teachable Moments' defined as a problem, solution, and actionable takeaway. Ignore filler words.",
                    temperature=0.2,
                )
                if parsed and parsed.concepts:
                    extracted_concepts.extend(parsed.concepts)

            return extracted_concepts if extracted_concepts else self._mock_concepts()

        except Exception as e:
            print(f"Gemini concept extraction failed: {e}. Falling back to simulation.")
            return self._mock_concepts()

    def _generate_global_outline(self, chunks: List[str]) -> str:
        """Helper to create a unified outline of the entire source text."""
        try:
            summaries = []
            for chunk in chunks[:5]: # Take first few chunks
                prompt = f"Summarize the educational content in this chunk into 2 bullet points:\n\n{chunk}"
                summaries.append(self._generate_text(prompt, temperature=0.1))

            prompt_outline = "Synthesize these chunk summaries into a cohesive Master Outline for the entire lecture:\n\n" + "\n".join(summaries)
            return self._generate_text(prompt_outline, temperature=0.3)
        except Exception:
            return "General educational lecture on concepts."

    def synthesize_carousel(self, concept: ExtractedConcept, brand_kit: Optional[Dict[str, Any]] = None) -> CarouselAsset:
        """Transforms a distilled concept into a multi-slide Satori-ready Carousel asset."""
        if self._is_mock:
            return self._mock_carousel(concept, brand_kit)

        primary_color = (brand_kit or {}).get("primary_color", "#4F46E5")
        bg_color = (brand_kit or {}).get("bg_color", "#FFFFFF")

        prompt = f"""
        Transform the following educational concept into a high-converting 7-slide social media carousel script.

        CONCEPT DETAIL:
        - Title: {concept.title}
        - Core Lesson: {concept.core_lesson}
        - Key Takeaways: {', '.join(concept.key_points)}
        - Complexity: {concept.complexity_level}

        BRAND:
        - Use primary_color: {primary_color}
        - Use bg_color: {bg_color}

        CONSTRAINTS:
        - Slide 1: High-tension Hook slide (Slide Type: 'hook_slide')
        - Slide 2: The Core Problem or Challenge (Slide Type: 'content_slide')
        - Slide 3-5: The step-by-step framework/solution details (Slide Type: 'content_slide')
        - Slide 6: The overall transformation or benefit (Slide Type: 'content_slide')
        - Slide 7: Actionable Call to Action (Slide Type: 'cta_slide')
        - Max 25 words per slide. Avoid generic descriptions.
        """

        try:
            return self._generate_structured(
                prompt=prompt,
                schema_model=CarouselAsset,
                system_instruction="Format the slide deck output as a carousel asset matching the target schema.",
                temperature=0.4,
            )
        except Exception as e:
            print(f"Gemini carousel synthesis failed: {e}")
            return self._mock_carousel(concept, brand_kit)

    def synthesize_video_script(self, concept: ExtractedConcept) -> ShortVideoScript:
        """Transforms an educational concept into a high-retention short-form video script."""
        if self._is_mock:
            return self._mock_video_script(concept)

        prompt = f"""
        Write a viral, educational short-form script (Reels/TikTok/Shorts) based on this concept.

        CONCEPT:
        - Title: {concept.title}
        - Lesson: {concept.core_lesson}
        - Key Takeaways: {', '.join(concept.key_points)}
        - Vibe: {concept.vibe_check}

        STRUCTURE:
        - Hook: Captivate attention within 3 seconds. Role is 'hook'.
        - Body: Deliver value through a clear framework. Role is 'body'.
        - CTA: Call to Action. Role is 'cta'.
        - Include rich 'visual_cue' descriptions for overlays, b-roll, and face-to-camera instructions.
        """

        try:
            return self._generate_structured(
                prompt=prompt,
                schema_model=ShortVideoScript,
                system_instruction="Create a video script with segment roles, visual cues, and spoken scripts.",
                temperature=0.6,
            )
        except Exception as e:
            print(f"Gemini script synthesis failed: {e}")
            return self._mock_video_script(concept)

    def synthesize_newsletter(self, concept: ExtractedConcept) -> NewsletterLesson:
        """Transforms an educational concept into a deep-dive markdown-based newsletter lesson."""
        if self._is_mock:
            return self._mock_newsletter(concept)

        prompt = f"""
        Write an authoritative and engaging newsletter lesson based on this concept.

        CONCEPT:
        - Title: {concept.title}
        - Lesson: {concept.core_lesson}
        - Steps/Key points: {', '.join(concept.key_points)}
        - Tone: {concept.vibe_check}

        STRUCTURE:
        - Title: Lesson headline
        - Tagline: Punchy catchphrase
        - TL;DR: Summarized quick-win blockquote
        - Main breakdown in Markdown (with subheaders, bold text, clear spacing)
        - Action Item: Dynamic homework or practical next step
        """

        try:
            return self._generate_structured(
                prompt=prompt,
                schema_model=NewsletterLesson,
                system_instruction="Create an engaging, pedagogical newsletter with Markdown fields.",
                temperature=0.5,
            )
        except Exception as e:
            print(f"Gemini newsletter synthesis failed: {e}")
            return self._mock_newsletter(concept)

    # 3. Secure and Rich Simulation Methods

    def _mock_concepts(self) -> List[ExtractedConcept]:
        return [
            ExtractedConcept(
                title="The 3-Step Semantic Chunking Framework",
                core_lesson="Break down long lectures into coherent educational units by tracking cosine similarity boundaries.",
                key_points=[
                    "Sentence Boundary Isolation: Split text strictly at sentence ends to maintain structural flow.",
                    "Gemini Multi-Modal Embeddings: Generate 768-dimension vectors for all sentence blocks.",
                    "Similarity Shift Detection: Create a clean split point when cosine similarity drops below 0.65."
                ],
                complexity_level="Intermediate",
                vibe_check="Professional, technical yet highly accessible"
            ),
            ExtractedConcept(
                title="Optimizing 'Time-To-Asset' (TTA) for Creators",
                core_lesson="Enable solopreneurs to go from raw video upload to a scheduled batch of social posts in under 5 minutes.",
                key_points=[
                    "Direct S3 Uploads: Bypass API bottlenecks via presigned uploads.",
                    "Parallel Processing Chains: Trigger transcribers, vectorizers, and synthesizers concurrently.",
                    "WYSIWYG Live Previews: Update Satori/Resvg templates on the canvas in real-time."
                ],
                complexity_level="Beginner",
                vibe_check="Energetic, practical, and highly motivational"
            )
        ]

    def _mock_carousel(self, concept: ExtractedConcept, brand_kit: Optional[Dict[str, Any]]) -> CarouselAsset:
        primary = (brand_kit or {}).get("primary_color", "#4F46E5")
        bg = (brand_kit or {}).get("bg_color", "#FFFFFF")
        
        slides = [
            CarouselSlide(
                slide_type="hook_slide",
                headline=f"Stop summarizing. Master {concept.title} instead!",
                body_text="Most educators waste hours on manual summaries. Here is a better 3-step system.",
                icon="alert"
            ),
            CarouselSlide(
                slide_type="content_slide",
                headline="The Core Problem",
                body_text=f"Traditional lessons are too dense. {concept.core_lesson}",
                step_number="Step 1 of 5",
                icon="x"
            )
        ]
        
        for idx, point in enumerate(concept.key_points[:3]):
            parts = point.split(":")
            head = parts[0] if len(parts) > 1 else f"Insight {idx+1}"
            body = parts[1].strip() if len(parts) > 1 else point
            slides.append(
                CarouselSlide(
                    slide_type="content_slide",
                    headline=head,
                    body_text=body,
                    step_number=f"Step {idx+2} of 5",
                    icon="check"
                )
            )
            
        slides.append(
            CarouselSlide(
                slide_type="cta_slide",
                headline="Ready to scale your content?",
                body_text="Join EduClip and turn your long videos into professional social carousels automatically.",
                icon="arrow"
            )
        )
        
        return CarouselAsset(
            template_id="modern_minimalist_01",
            primary_color=primary,
            bg_color=bg,
            slides=slides
        )

    def _mock_video_script(self, concept: ExtractedConcept) -> ShortVideoScript:
        return ShortVideoScript(
            estimated_duration="45s",
            segments=[
                ScriptSegment(
                    role="hook",
                    text=f"If you're still teaching long-form without chunking, stop right now! Here's how to master {concept.title}.",
                    visual_cue="Face-to-camera, fast zoom, high energy. Text overlay: 'STOP EXPLAINING DENSELY'.",
                    duration="5s"
                ),
                ScriptSegment(
                    role="body",
                    text=f"The secret is {concept.core_lesson}. To apply this today: first, {concept.key_points[0].split(':')[0]}. Next, {concept.key_points[1].split(':')[0]}.",
                    visual_cue="Green screen b-roll showing an interactive code/design canvas. Pop-up graphics for Step 1 and Step 2.",
                    duration="30s"
                ),
                ScriptSegment(
                    role="cta",
                    text="That's it! If you want to automate this whole workflow, drop a 🔥 in the comments below, and I'll send you early access to EduClip.",
                    visual_cue="Points down with cursor overlay. End screen showing brand logo.",
                    duration="10s"
                )
            ]
        )

    def _mock_newsletter(self, concept: ExtractedConcept) -> NewsletterLesson:
        body_points = "\n".join(f"### {point.split(':')[0] if ':' in point else 'Point'}\n{point.split(':')[1].strip() if ':' in point else point}\n" for point in concept.key_points)
        return NewsletterLesson(
            title=f"The Ultimate Guide to {concept.title}",
            tagline="Repurpose your webinars like an expert, with zero extra effort.",
            tl_dr=f"Dense lectures fail online. Repurpose them using semantic chunking into highly readable micro-units: {concept.core_lesson}",
            breakdown_markdown=f"""
## Why Traditional Educational Content Fails Online

Solo creators spend days writing guides or recording hours of videos, but most social media scroll feeds have a sub-3 second attention threshold. If you throw a 1-hour academic lecture at them, they swipe away instantly.

To capture, teach, and retain students, we must slice content semantically:

{body_points}
            """,
            action_item_markdown=f"""
### 🛠️ Your 5-Minute Action Step

Take your last recorded video or article and use this exact structure to isolate **one** standalone educational takeaway. Write a 3-sentence summary and sketch out 3 slides. 

*Need a visual rendering assistant? EduClip can do this entire process in under 10 seconds. Try it out in your creator panel today!*
            """
        )
