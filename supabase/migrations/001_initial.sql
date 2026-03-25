-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  avatar TEXT,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived BOOLEAN DEFAULT FALSE
);

-- Grids table
CREATE TABLE IF NOT EXISTS grids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Mi Grid',
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Symbols table
CREATE TABLE IF NOT EXISTS symbols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grid_id UUID REFERENCES grids(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  emoji TEXT,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  pos_type TEXT NOT NULL DEFAULT 'noun' CHECK (pos_type IN ('pronoun','verb','noun','adj','adverb','other')),
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  color TEXT DEFAULT '#ffffff',
  hidden BOOLEAN DEFAULT FALSE,
  arasaac_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phrases table
CREATE TABLE IF NOT EXISTS phrases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  symbols_used JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_pinned BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 1
);

-- Voice configs table
CREATE TABLE IF NOT EXISTS voice_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  engine TEXT DEFAULT 'webspeech' CHECK (engine IN ('webspeech','elevenlabs')),
  system_voice_id TEXT,
  system_rate FLOAT DEFAULT 1.0,
  system_pitch FLOAT DEFAULT 1.0,
  elevenlabs_key_encrypted TEXT,
  elevenlabs_voice_id TEXT,
  elevenlabs_rate FLOAT DEFAULT 1.0,
  elevenlabs_stability FLOAT DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audio cache metadata
CREATE TABLE IF NOT EXISTS audio_cache_meta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text_hash TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  size_bytes INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, text_hash, voice_id)
);

-- Usage events table
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  symbol_id UUID REFERENCES symbols(id) ON DELETE SET NULL,
  phrase_id UUID REFERENCES phrases(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('symbol_tap','phrase_spoken','quick_phrase','scanner_select')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Access config table
CREATE TABLE IF NOT EXISTS access_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  kiosk_pin TEXT,
  show_grid_editor BOOLEAN DEFAULT TRUE,
  show_keyboard BOOLEAN DEFAULT TRUE,
  show_scanner BOOLEAN DEFAULT FALSE,
  scanner_pattern TEXT DEFAULT 'row' CHECK (scanner_pattern IN ('row','cell','quadrant')),
  scanner_speed FLOAT DEFAULT 2.0,
  scan_key TEXT DEFAULT 'Space',
  grid_cell_size TEXT DEFAULT 'medium' CHECK (grid_cell_size IN ('small','medium','large')),
  prediction_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE grids ENABLE ROW LEVEL SECURITY;
ALTER TABLE symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_cache_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all for authenticated users (admin manages everything)
CREATE POLICY "Allow all for authenticated" ON profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON grids FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON symbols FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON phrases FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON voice_configs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON audio_cache_meta FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON usage_events FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated" ON access_config FOR ALL USING (auth.role() = 'authenticated');

-- Allow anon read for the app (user device doesn't require login)
CREATE POLICY "Allow anon read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow anon read grids" ON grids FOR SELECT USING (true);
CREATE POLICY "Allow anon read symbols" ON symbols FOR SELECT USING (true);
CREATE POLICY "Allow anon read phrases" ON phrases FOR SELECT USING (true);
CREATE POLICY "Allow anon read voice_configs" ON voice_configs FOR SELECT USING (true);
CREATE POLICY "Allow anon insert phrases" ON phrases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert usage_events" ON usage_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update phrases" ON phrases FOR UPDATE USING (true);
CREATE POLICY "Allow anon read access_config" ON access_config FOR SELECT USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE symbols;
ALTER PUBLICATION supabase_realtime ADD TABLE phrases;
ALTER PUBLICATION supabase_realtime ADD TABLE grids;
ALTER PUBLICATION supabase_realtime ADD TABLE access_config;

-- Indexes for performance
CREATE INDEX idx_symbols_grid_id ON symbols(grid_id);
CREATE INDEX idx_phrases_profile_id ON phrases(profile_id);
CREATE INDEX idx_usage_events_profile_id ON usage_events(profile_id);
CREATE INDEX idx_usage_events_created_at ON usage_events(created_at);
CREATE INDEX idx_audio_cache_profile ON audio_cache_meta(profile_id);
