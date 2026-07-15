from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
import stripe
from api.config import settings
from api.database import get_db_session, Organization
from api.auth_utils import get_current_tenant

router = APIRouter()

# Initialize stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

class CheckoutSessionPayload(BaseModel):
    price_id: str = Field(..., description="Stripe Product Price ID")
    success_url: str = Field(..., description="Redirect URL upon successful subscription")
    cancel_url: str = Field(..., description="Redirect URL upon cancellation")

class PortalSessionPayload(BaseModel):
    return_url: str = Field(..., description="Return URL after editing subscription details")

@router.post("/create-checkout-session")
def create_checkout_session(
    payload: CheckoutSessionPayload,
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant)
):
    """
    Creates a Stripe Checkout Session for subscription/credit top-up.
    Registers org_id in checkout metadata for synchronization upon payment.
    """
    org_id = tenant["org_id"]
    
    org = db.query(Organization).filter(Organization.id == UUID(org_id)).first()
    if not org:
        raise HTTPException(status_code=404, detail="Workspace organization not found")

    try:
        # Mocking check for test keys
        if settings.STRIPE_SECRET_KEY == "sk_test_mock_key":
            mock_url = f"https://checkout.stripe.com/c/pay/mock_session_{org_id}"
            return {"checkout_url": mock_url}

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{"price": payload.price_id, "quantity": 1}],
            mode="subscription",
            customer=org.stripe_customer_id,
            success_url=payload.success_url,
            cancel_url=payload.cancel_url,
            client_reference_id=org_id,
            metadata={"org_id": org_id}
        )
        return {"checkout_url": session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Stripe Session creation error: {str(e)}")

@router.post("/customer-portal")
def create_customer_portal(
    payload: PortalSessionPayload,
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant)
):
    """
    Generates a secure Stripe Billing Customer Portal link for subscription upgrades and billing history management.
    """
    org_id = tenant["org_id"]
    
    org = db.query(Organization).filter(Organization.id == UUID(org_id)).first()
    if not org or not org.stripe_customer_id:
        # For testing / simulation, if customer doesn't exist, register a mock
        if settings.STRIPE_SECRET_KEY == "sk_test_mock_key" or not org.stripe_customer_id:
            org.stripe_customer_id = f"cus_mock_{org_id[:8]}"
            db.commit()

    try:
        if settings.STRIPE_SECRET_KEY == "sk_test_mock_key":
            mock_portal_url = f"https://billing.stripe.com/p/session/mock_portal_{org_id}"
            return {"portal_url": mock_portal_url}

        session = stripe.billing_portal.Session.create(
            customer=org.stripe_customer_id,
            return_url=payload.return_url
        )
        return {"portal_url": session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Billing Portal error: {str(e)}")

@router.post("/stripe-webhook", status_code=status.HTTP_200_OK)
async def handle_stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None, alias="Stripe-Signature"),
    db: Session = Depends(get_db_session)
):
    """
    Receives events from Stripe webhook servers.
    Handles invoice payments, subscription changes, and updates tenant subscription tier & credit balances.
    """
    payload = await request.body()
    event = None

    # Verification
    if settings.STRIPE_SECRET_KEY == "sk_test_mock_key" or not stripe_signature:
        # Simulate processing for local/mock development
        try:
            import json
            parsed_payload = json.loads(payload)
            event_type = parsed_payload.get("type")
            event_data = parsed_payload.get("data", {}).get("object", {})
            event = stripe.Event.construct_from(parsed_payload, key=settings.STRIPE_SECRET_KEY)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Mock webhook parse error: {str(e)}")
    else:
        try:
            event = stripe.Webhook.construct_event(
                payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event.get("type")
    event_object = event.get("data", {}).get("object", {})

    if event_type == "checkout.session.completed":
        org_id_str = event_object.get("client_reference_id")
        stripe_customer_id = event_object.get("customer")
        
        if org_id_str:
            org = db.query(Organization).filter(Organization.id == UUID(org_id_str)).first()
            if org:
                org.stripe_customer_id = stripe_customer_id
                db.commit()

    elif event_type == "invoice.paid":
        stripe_customer_id = event_object.get("customer")
        
        # We also attempt to find based on customer ID
        org = db.query(Organization).filter(Organization.stripe_customer_id == stripe_customer_id).first()
        if org:
            # Plan Tier credit provisioning logic
            # Let's say user bought or subscribed: we check price metadata or product id.
            # Here we default credit recharge depending on subscription status
            org.subscription_status = "active"
            
            # Simple credit provisioning map
            tier_credits = {
                "pro": 100,
                "agency": 500,
                "free": 10
            }
            credits_to_grant = tier_credits.get(org.plan_tier, 50) # Fallback to 50
            org.ai_credits_remaining += credits_to_grant
            
            db.commit()

    elif event_type == "customer.subscription.updated":
        stripe_customer_id = event_object.get("customer")
        subscription_status = event_object.get("status")
        
        # Match subscription product tier
        # In real-world, we map Stripe Price ID -> internal Plan Tier
        org = db.query(Organization).filter(Organization.stripe_customer_id == stripe_customer_id).first()
        if org:
            org.subscription_status = subscription_status
            if subscription_status == "active":
                org.plan_tier = "pro" # Default tier update
            db.commit()

    elif event_type == "customer.subscription.deleted":
        stripe_customer_id = event_object.get("customer")
        org = db.query(Organization).filter(Organization.stripe_customer_id == stripe_customer_id).first()
        if org:
            org.subscription_status = "canceled"
            org.plan_tier = "free"
            db.commit()

    return {"status": "success", "event_processed": event_type}
