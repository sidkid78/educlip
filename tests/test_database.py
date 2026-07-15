import pytest
from uuid import uuid4
from api.database import Organization, Project, Source, Asset, enforce_tenant

def test_database_multi_tenancy_isolation(db_session):
    """
    Verifies that rows are strictly separated logically per organization_id tenant.
    Ensures different tenants cannot read or leak each other's records.
    """
    # 1. Provision Tenant A and Tenant B
    org_a = Organization(
        id=uuid4(),
        name="Academy Alpha",
        slug="academy-alpha",
        ai_credits_remaining=10
    )
    org_b = Organization(
        id=uuid4(),
        name="Academy Beta",
        slug="academy-beta",
        ai_credits_remaining=5
    )
    db_session.add(org_a)
    db_session.add(org_b)
    db_session.commit()

    # 2. Add projects under Tenant A and Tenant B
    proj_a = Project(
        id=uuid4(),
        organization_id=org_a.id,
        name="SEO Playbook A",
        description="Tenant A marketing series"
    )
    proj_b = Project(
        id=uuid4(),
        organization_id=org_b.id,
        name="SEO Playbook B",
        description="Tenant B secret content"
    )
    db_session.add(proj_a)
    db_session.add(proj_b)
    db_session.commit()

    # 3. Add source records
    source_a = Source(
        id=uuid4(),
        organization_id=org_a.id,
        project_id=proj_a.id,
        type="video",
        s3_key="raw/tenant_a/webinar.mp4",
        vector_namespace=f"ns_{org_a.id}",
        status="pending"
    )
    source_b = Source(
        id=uuid4(),
        organization_id=org_b.id,
        project_id=proj_b.id,
        type="video",
        s3_key="raw/tenant_b/screencast.mp4",
        vector_namespace=f"ns_{org_b.id}",
        status="pending"
    )
    db_session.add(source_a)
    db_session.add(source_b)
    db_session.commit()

    # 4. Enforce Tenant Context A and run queries
    context_a = enforce_tenant(db_session, org_a.id)
    projects_a = context_a.query(Project).all()
    sources_a = context_a.query(Source).all()

    # Tenant A must only see Tenant A's objects
    assert len(projects_a) == 1
    assert projects_a[0].id == proj_a.id
    assert projects_a[0].name == "SEO Playbook A"

    assert len(sources_a) == 1
    assert sources_a[0].id == source_a.id
    assert sources_a[0].s3_key == "raw/tenant_a/webinar.mp4"

    # 5. Enforce Tenant Context B and run queries
    context_b = enforce_tenant(db_session, org_b.id)
    projects_b = context_b.query(Project).all()
    sources_b = context_b.query(Source).all()

    # Tenant B must only see Tenant B's objects
    assert len(projects_b) == 1
    assert projects_b[0].id == proj_b.id
    assert projects_b[0].name == "SEO Playbook B"

    assert len(sources_b) == 1
    assert sources_b[0].id == source_b.id
    assert sources_b[0].s3_key == "raw/tenant_b/screencast.mp4"
