import pytest
from uuid import uuid4, UUID
from api.database import Organization, Source, Asset, User

# 1. Test Ingestion API routes

def test_get_upload_url_enforces_type(client):
    """
    Asserts S3 Presigned upload URL generation restricts disallowed formats.
    """
    # Allowed format
    res = client.get("/v1/ingest/upload-url?file_name=lecture.mp4&content_type=video/mp4")
    assert res.status_code == 200
    data = res.json()
    assert "upload_url" in data
    assert "file_key" in data
    assert "raw/" in data["file_key"]

    # Disallowed format (should reject as HTTP 400)
    res_bad = client.get("/v1/ingest/upload-url?file_name=malware.exe&content_type=application/octet-stream")
    assert res_bad.status_code == 400

def test_confirm_upload_meters_credits(client, db_session):
    """
    Confirms that uploading decrements tenant AI credits.
    """
    # Pre-populate organization
    org_id = uuid4()
    org = Organization(
        id=org_id,
        name="Credit Test Academy",
        slug="credit-academy",
        ai_credits_remaining=5
    )
    db_session.add(org)
    db_session.commit()

    # Call confirmation endpoint with organization auth header simulation
    headers = {"Authorization": f"Bearer 123_{org_id}"} # token suffix splits to user/org
    payload = {
        "file_key": f"raw/{org_id}/video.mp4",
        "file_type": "video",
        "metadata": {"original_name": "how_to_scale.mp4"}
    }
    
    res = client.post("/v1/ingest/confirm", json=payload, headers=headers)
    assert res.status_code == 202
    data = res.json()
    assert data["credits_remaining"] == 4

    # Assert Source is added to Postgres
    source = db_session.query(Source).filter(Source.id == UUID(data["source_id"])).first()
    assert source is not None
    assert source.organization_id == org_id
    assert source.status == "pending"


# 2. Test Assets API and logical multi-tenancy separation

def test_assets_api_tenancy_security(client, db_session):
    """
    Ensures different tenants cannot view or manipulate each other's assets.
    """
    org1_id = uuid4()
    org2_id = uuid4()

    # Pre-populate organizations
    org1 = Organization(id=org1_id, name="Org 1", slug="org1", ai_credits_remaining=10)
    org2 = Organization(id=org2_id, name="Org 2", slug="org2", ai_credits_remaining=10)
    db_session.add_all([org1, org2])
    db_session.commit()

    # Add asset belonging to Org 1
    asset_id = uuid4()
    asset = Asset(
        id=asset_id,
        organization_id=org1_id,
        asset_type="carousel",
        content_data={"slides": [{"headline": "Slide of Org 1"}]},
        status="draft"
    )
    db_session.add(asset)
    db_session.commit()

    # Tenant 1 (Authorized to Org 1) requests asset list
    headers_1 = {"Authorization": f"Bearer user1_{org1_id}"}
    res_1 = client.get("/v1/assets", headers=headers_1)
    assert res_1.status_code == 200
    assert len(res_1.json()) == 1
    assert res_1.json()[0]["id"] == str(asset_id)

    # Tenant 2 (Authorized to Org 2) requests asset list (must be empty, isolated)
    headers_2 = {"Authorization": f"Bearer user2_{org2_id}"}
    res_2 = client.get("/v1/assets", headers=headers_2)
    assert res_2.status_code == 200
    assert len(res_2.json()) == 0

    # Tenant 2 attempts to fetch Tenant 1's asset details directly (should return HTTP 404 Not Found)
    res_direct_bad = client.get(f"/v1/assets/{asset_id}", headers=headers_2)
    assert res_direct_bad.status_code == 404

    # Tenant 2 attempts to edit Tenant 1's asset (should return HTTP 404)
    res_patch_bad = client.patch(
        f"/v1/assets/{asset_id}",
        json={"status": "scheduled"},
        headers=headers_2
    )
    assert res_patch_bad.status_code == 404


# 3. Test Auth webhook synchronization

def test_clerk_webhook_sync(client, db_session):
    """
    Tests that Clerk webhooks correctly synchronize user, organization, and memberships in DB.
    """
    user_id = "user_clerk_9999"
    org_id = uuid4()

    # Webhook user created event
    user_payload = {
        "type": "user.created",
        "data": {
            "id": user_id,
            "email_addresses": [{"email_address": "unleashed@gmail.com"}],
            "first_name": "John",
            "last_name": "Instructor"
        }
    }
    res_user = client.post("/v1/auth/clerk-webhook", json=user_payload)
    assert res_user.status_code == 200
    
    # Assert User recorded in Postgres
    user = db_session.query(User).filter(User.id == user_id).first()
    assert user is not None
    assert user.email == "unleashed@gmail.com"
    assert user.full_name == "John Instructor"

    # Webhook organization created event
    org_payload = {
        "type": "organization.created",
        "data": {
            "id": str(org_id),
            "name": "Scale Academy LLC",
            "slug": "scale-academy",
            "created_by": user_id
        }
    }
    res_org = client.post("/v1/auth/clerk-webhook", json=org_payload)
    assert res_org.status_code == 200

    # Assert Organization and Membership recorded
    org = db_session.query(Organization).filter(Organization.id == org_id).first()
    assert org is not None
    assert org.name == "Scale Academy LLC"
    assert org.plan_tier == "free"


# 4. Test Billing stripe webhook integration

def test_stripe_billing_webhook(client, db_session):
    """
    Verifies stripe invoice.paid top-up updates credits.
    """
    org_id = uuid4()
    org = Organization(
        id=org_id,
        name="Stripe Scale LLC",
        slug="stripe-scale",
        stripe_customer_id="cus_test_stripe_123",
        ai_credits_remaining=10,
        plan_tier="pro"
    )
    db_session.add(org)
    db_session.commit()

    # Stripe mock webhook invoice paid event payload
    stripe_payload = {
        "type": "invoice.paid",
        "data": {
            "object": {
                "customer": "cus_test_stripe_123"
            }
        }
    }

    res = client.post("/v1/billing/stripe-webhook", json=stripe_payload)
    assert res.status_code == 200
    assert res.json()["event_processed"] == "invoice.paid"

    # Assert credit recharge was applied (Pro tier grant of 100 credits)
    db_session.refresh(org)
    assert org.subscription_status == "active"
    assert org.ai_credits_remaining == 110
