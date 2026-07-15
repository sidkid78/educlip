from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from uuid import UUID, uuid4
from sqlalchemy.orm import Session
from api.database import get_db_session, User, Organization, Membership
from api.auth_utils import get_current_tenant

router = APIRouter()

class ClerkWebhookPayload(BaseModel):
    data: Dict[str, Any]
    type: str # e.g. user.created, organization.created, organizationMembership.created

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    created_at: Any

    class Config:
        from_attributes = True

@router.post("/clerk-webhook", status_code=status.HTTP_200_OK)
def handle_clerk_webhook(
    payload: ClerkWebhookPayload,
    db: Session = Depends(get_db_session)
):
    """
    Handles Clerk identity management webhook integrations.
    Synchronizes users, organizations, and memberships with PostgreSQL.
    """
    event_type = payload.type
    event_data = payload.data

    if event_type == "user.created" or event_type == "user.updated":
        user_id = event_data.get("id")
        email_addresses = event_data.get("email_addresses", [])
        email = email_addresses[0].get("email_address") if email_addresses else f"{user_id}@mock-clerk.com"
        first_name = event_data.get("first_name", "")
        last_name = event_data.get("last_name", "")
        full_name = f"{first_name} {last_name}".strip() or "Solo Educator"
        avatar_url = event_data.get("image_url") or event_data.get("profile_image_url")

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            user = User(
                id=user_id,
                email=email,
                full_name=full_name,
                avatar_url=avatar_url
            )
            db.add(user)
        else:
            user.email = email
            user.full_name = full_name
            user.avatar_url = avatar_url
        
        db.commit()
        return {"status": "success", "message": f"User {user_id} synchronized."}

    elif event_type == "organization.created" or event_type == "organization.updated":
        org_id_str = event_data.get("id")
        org_name = event_data.get("name", "New Academy")
        org_slug = event_data.get("slug", f"academy-{org_id_str[:8]}")
        created_by = event_data.get("created_by")

        try:
            org_id = UUID(org_id_str)
        except ValueError:
            # Generate a consistent UUID from string if it isn't valid UUID format
            org_id = uuid4()

        org = db.query(Organization).filter(Organization.id == org_id).first()
        if not org:
            org = Organization(
                id=org_id,
                name=org_name,
                slug=org_slug,
                ai_credits_remaining=10, # 10 free trial credits
                plan_tier="free"
            )
            db.add(org)
        else:
            org.name = org_name
            org.slug = org_slug
        
        db.commit()

        # If created_by user exists, automatically set up owner membership
        if created_by:
            user_exists = db.query(User).filter(User.id == created_by).first()
            if user_exists:
                membership = db.query(Membership).filter(
                    Membership.organization_id == org_id,
                    Membership.user_id == created_by
                ).first()
                if not membership:
                    membership = Membership(
                        organization_id=org_id,
                        user_id=created_by,
                        role="owner"
                    )
                    db.add(membership)
                    db.commit()

        return {"status": "success", "message": f"Organization {org_id_str} synchronized."}

    elif event_type == "organizationMembership.created":
        org_id_str = event_data.get("organization", {}).get("id")
        user_id = event_data.get("public_user_data", {}).get("user_id")
        role = event_data.get("role", "member") # owner, admin, member

        try:
            org_id = UUID(org_id_str)
        except ValueError:
            return {"status": "ignored", "message": "Invalid organization UUID format"}

        # Verify user and org exist in our DB
        user_exists = db.query(User).filter(User.id == user_id).first()
        org_exists = db.query(Organization).filter(Organization.id == org_id).first()

        if user_exists and org_exists:
            membership = db.query(Membership).filter(
                Membership.organization_id == org_id,
                Membership.user_id == user_id
            ).first()
            if not membership:
                membership = Membership(
                    organization_id=org_id,
                    user_id=user_id,
                    role=role
                )
                db.add(membership)
                db.commit()
            return {"status": "success", "message": f"Membership between {user_id} and {org_id_str} recorded."}
        
        return {"status": "failed", "message": "User or organization record missing in DB"}

    return {"status": "ignored", "message": f"Event type {event_type} ignored"}

@router.get("/me", response_model=UserResponse)
def get_user_profile(
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant)
):
    """
    Retrieves the authenticated user profile.
    """
    user_id = tenant["user_id"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        # Create user on the fly if running mock authentication
        user = User(
            id=user_id,
            email=f"{user_id}@mock-clerk.com",
            full_name="Solo Educator"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user
