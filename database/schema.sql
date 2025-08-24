-- Database schema for Blocket AI monitoring with SMS notifications
-- Run this in Neon PostgreSQL database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bevakningar table
CREATE TABLE IF NOT EXISTS bevakningar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bevakning_id VARCHAR(50) UNIQUE NOT NULL, -- Blocket bevakning ID
    name VARCHAR(255) NOT NULL,
    user_id VARCHAR(100) DEFAULT 'default_user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Listings table with AI analysis
CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bevakning_id VARCHAR(50) NOT NULL,
    ad_id VARCHAR(50) UNIQUE NOT NULL, -- Blocket ad ID
    title VARCHAR(500) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'kr',
    description TEXT,
    category VARCHAR(100),
    condition VARCHAR(100),
    location VARCHAR(100),
    seller_type VARCHAR(50),
    blocket_url TEXT,
    frontend_url TEXT,
    images JSONB DEFAULT '[]', -- Array of image URLs and metadata from Blocket
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- AI analysis fields
    ai_score INTEGER CHECK (ai_score >= 1 AND ai_score <= 5),
    ai_confidence DECIMAL(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
    ai_reasoning TEXT,
    ai_factors TEXT[], -- Array of factors
    ai_recommendation TEXT,
    ai_analyzed_at TIMESTAMP WITH TIME ZONE,
    ai_model VARCHAR(100),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS notifications table
CREATE TABLE IF NOT EXISTS sms_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, failed
    delivery_id VARCHAR(100), -- 46elk delivery ID
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) DEFAULT 'default_user',
    phone_number VARCHAR(20) NOT NULL,
    sms_enabled BOOLEAN DEFAULT true,
    min_score_threshold INTEGER DEFAULT 4, -- Minimum score for SMS (4 or 5)
    notification_frequency INTEGER DEFAULT 10, -- Minutes between checks
    max_sms_per_day INTEGER DEFAULT 20,
    category_filters TEXT[] DEFAULT ARRAY['all'], -- Categories to include in SMS (empty = all categories)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_bevakning_id ON listings(bevakning_id);
CREATE INDEX IF NOT EXISTS idx_listings_ad_id ON listings(ad_id);
CREATE INDEX IF NOT EXISTS idx_listings_images ON listings USING GIN (images);
CREATE INDEX IF NOT EXISTS idx_listings_ai_score ON listings(ai_score);
CREATE INDEX IF NOT EXISTS idx_listings_discovered_at ON listings(discovered_at);
CREATE INDEX IF NOT EXISTS idx_sms_notifications_status ON sms_notifications(status);
CREATE INDEX IF NOT EXISTS idx_sms_notifications_sent_at ON sms_notifications(sent_at);

-- Insert default user settings
INSERT INTO user_settings (user_id, phone_number, sms_enabled, min_score_threshold, notification_frequency, max_sms_per_day, category_filters)
VALUES ('default_user', '+46701234567', true, 4, 10, 20, ARRAY['all'])
ON CONFLICT (user_id) DO NOTHING;

-- Insert default bevakning (your existing one)
INSERT INTO bevakningar (bevakning_id, name, user_id)
VALUES ('11998349', 'Cyklar och tillbehör', 'default_user')
ON CONFLICT (bevakning_id) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_bevakningar_updated_at BEFORE UPDATE ON bevakningar
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
