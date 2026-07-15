import pytest
from api.ai_engine import EduClipAIEngine, ExtractedConcept

def test_ai_engine_semantic_chunking():
    """
    Tests semantic chunking and fallback word count chunking under mock API key.
    """
    engine = EduClipAIEngine()
    text = "Sentence one. Sentence two! Sentence three? Sentence four."
    
    # Under mock key, this falls back to simple chunking
    chunks = engine.semantic_chunking(text, max_words=3)
    assert len(chunks) > 0
    assert "Sentence" in chunks[0]

def test_ai_engine_concept_extraction():
    """
    Tests extraction of core educational takeaways from raw source transcripts.
    """
    engine = EduClipAIEngine()
    transcript = "This is a full training course on search engine optimization."
    
    concepts = engine.extract_concepts(transcript)
    assert len(concepts) > 0
    assert isinstance(concepts[0], ExtractedConcept)
    assert hasattr(concepts[0], "title")
    assert hasattr(concepts[0], "core_lesson")
    assert len(concepts[0].key_points) > 0

def test_ai_engine_asset_synthesis():
    """
    Tests that extracted concepts are accurately converted into multiple platform formats:
    1. LinkedIn Carousels (Satori/HTML schemas)
    2. TikTok/Reels Video Scripts (Hook, Body, CTA)
    3. Markdown-based newsletter lesson broadcasts
    """
    engine = EduClipAIEngine()
    concept = ExtractedConcept(
        title="SEO Data Scaling",
        core_lesson="Scale your organic search traffic using content hubs.",
        key_points=["Map your keyword list.", "Write high-density semantic structures."],
        complexity_level="Intermediate",
        vibe_check="Professional"
    )

    # A. Carousel
    carousel = engine.synthesize_carousel(concept)
    assert carousel.template_id == "modern_minimalist_01"
    assert len(carousel.slides) > 0
    assert carousel.slides[0].slide_type == "hook_slide"
    assert "Stop" in carousel.slides[0].headline

    # B. Video Script
    script = engine.synthesize_video_script(concept)
    assert script.estimated_duration == "45s"
    assert len(script.segments) == 3
    assert script.segments[0].role == "hook"
    assert script.segments[1].role == "body"
    assert script.segments[2].role == "cta"

    # C. Newsletter
    newsletter = engine.synthesize_newsletter(concept)
    assert "Guide" in newsletter.title
    assert len(newsletter.tl_dr) > 10
    assert "##" in newsletter.breakdown_markdown
    assert "Action" in newsletter.action_item_markdown or "🛠️" in newsletter.action_item_markdown
