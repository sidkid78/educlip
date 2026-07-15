-- DDL for EduClip PostgreSQL Database
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations (The Tenant)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stripe_customer_id TEXT UNIQUE, -- Linked to Stripe
    subscription_status TEXT DEFAULT 'trialing', -- trialing, active, past_due, canceled
    plan_tier TEXT DEFAULT 'free', -- free, pro, agency
    ai_credits_remaining INTEGER DEFAULT 10,
    brand_kit JSONB -- {primary_color, bg_color, font_family, creator_handle}
);

-- Users (Synced from Clerk)
CREATE TABLE users (
    id TEXT PRIMARY KEY, -- Clerk User ID
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspace Memberships (Join Table)
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- owner, admin, member
    UNIQUE(organization_id, user_id)
);

-- Projects (Workspaces for specific content series)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Sources (Linked to Tenant)
CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'video', 'ebook', 'webinar'
    s3_key TEXT NOT NULL,
    vector_namespace TEXT NOT NULL, -- For Pinecone isolation
    metadata_json JSONB,
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    word_count INTEGER DEFAULT 0,
    duration FLOAT DEFAULT 0.0,
    error_log TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated Assets
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    source_id UUID REFERENCES sources(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL, -- 'carousel', 'short_video', 'newsletter'
    content_data JSONB NOT NULL,
    status TEXT DEFAULT 'draft', -- draft, scheduled, published
    scheduled_at TIMESTAMP WITH TIME ZONE,
    external_platform_id TEXT, -- Social media post ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PostgreSQL Row Level Security (RLS) simulation for Logical Tenant Separation
-- To enable RLS on these tables in production, we run:
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Dynamic Policy: Ensure queries are bounded by current active tenant
-- CREATE POLICY tenant_isolation_policy ON assets
--     USING (organization_id = current_setting('app.current_org_id')::UUID);
