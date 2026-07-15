"""
Distribution layer: a single IPublisher abstraction over every social/newsletter
platform, so the scheduler never branches on platform (spec §8).

These are mock implementations — they simulate the multi-step upload/publish
handshake and return a synthetic post id. Swapping in real Graph/OAuth API calls
means implementing the same interface; nothing in the scheduler or router changes.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, List, Any
import uuid


# Platform capability matrix (mirrors the design's distribution table).
PLATFORMS: Dict[str, Dict[str, Any]] = {
    "linkedin": {"name": "LinkedIn", "asset_types": ["carousel", "newsletter"], "caption_limit": 3000},
    "instagram": {"name": "Instagram", "asset_types": ["carousel", "short_video"], "caption_limit": 2200},
    "tiktok": {"name": "TikTok", "asset_types": ["short_video"], "caption_limit": 2200},
    "twitter": {"name": "Twitter/X", "asset_types": ["carousel", "short_video", "newsletter"], "caption_limit": 280},
    "beehiiv": {"name": "Beehiiv", "asset_types": ["newsletter"], "caption_limit": None},
}


class PublishError(ValueError):
    """Raised when an asset can't be published to a platform (validation failure)."""


@dataclass
class PublishResult:
    external_post_id: str
    url: str


def _caption_for(asset_type: str, content_data: Dict[str, Any]) -> str:
    """Derive a platform caption from an asset's content_data."""
    if asset_type == "newsletter":
        return content_data.get("tagline") or content_data.get("title") or ""
    if asset_type == "carousel":
        slides = content_data.get("slides") or []
        return (slides[0].get("headline") if slides else "") or ""
    if asset_type == "short_video":
        segments = content_data.get("segments") or []
        return (segments[0].get("text") if segments else "") or ""
    return ""


class IPublisher(ABC):
    """Unified publishing contract every platform implements."""

    platform: str

    def validate_asset(self, asset_type: str, content_data: Dict[str, Any]) -> None:
        """Raise PublishError if this asset can't go to this platform."""
        spec = PLATFORMS[self.platform]
        if asset_type not in spec["asset_types"]:
            raise PublishError(
                f"{spec['name']} does not accept '{asset_type}' assets "
                f"(supports: {', '.join(spec['asset_types'])})."
            )
        limit = spec["caption_limit"]
        caption = _caption_for(asset_type, content_data)
        if limit is not None and len(caption) > limit:
            raise PublishError(f"{spec['name']} caption exceeds {limit} characters ({len(caption)}).")

    @abstractmethod
    def upload_media(self, asset_type: str, content_data: Dict[str, Any]) -> List[str]:
        """Register/upload media binaries, returning platform media ids."""

    @abstractmethod
    def publish(self, asset_type: str, content_data: Dict[str, Any], media_ids: List[str]) -> PublishResult:
        """Create the post and return its external id + url."""

    def get_analytics(self, external_post_id: str) -> Dict[str, Any]:
        """Fetch basic engagement metrics for a published post."""
        return {"post_id": external_post_id, "likes": 0, "comments": 0, "impressions": 0}


class MockPublisher(IPublisher):
    """Simulates a platform's upload→publish handshake without real network calls."""

    def __init__(self, platform: str):
        self.platform = platform

    def upload_media(self, asset_type: str, content_data: Dict[str, Any]) -> List[str]:
        # A real impl would register + upload binaries; we mint a media id per slide/segment.
        count = len(content_data.get("slides") or content_data.get("segments") or [1])
        return [f"{self.platform}_media_{uuid.uuid4().hex[:10]}" for _ in range(count)]

    def publish(self, asset_type: str, content_data: Dict[str, Any], media_ids: List[str]) -> PublishResult:
        post_id = f"{self.platform}_{uuid.uuid4().hex[:12]}"
        return PublishResult(external_post_id=post_id, url=f"https://{self.platform}.example/p/{post_id}")


def get_publisher(platform: str) -> IPublisher:
    if platform not in PLATFORMS:
        raise PublishError(f"Unsupported platform '{platform}'. Supported: {', '.join(PLATFORMS)}.")
    return MockPublisher(platform)
