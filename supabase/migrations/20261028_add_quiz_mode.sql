-- ============================================
-- Migration: Add Quiz Learning Mode Support to assignments
-- ============================================

-- Add type column ('ASSIGNMENT' | 'QUIZ') with default 'ASSIGNMENT'
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'ASSIGNMENT';

-- Add quiz_config jsonb column for storing Quiz-specific parameters
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS quiz_config jsonb;

-- Optional index for faster filtering by type
CREATE INDEX IF NOT EXISTS idx_assignments_type ON assignments(type);
