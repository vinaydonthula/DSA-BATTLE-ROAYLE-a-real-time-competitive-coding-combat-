-- Add columns to contests table for Battle Royale
ALTER TABLE contests ADD COLUMN IF NOT EXISTS problem_id INT;
ALTER TABLE contests ADD COLUMN IF NOT EXISTS difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium';

-- Add columns to contest_participants for player state tracking
ALTER TABLE contest_participants ADD COLUMN IF NOT EXISTS health INT DEFAULT 100;
ALTER TABLE contest_participants ADD COLUMN IF NOT EXISTS solved TINYINT(1) DEFAULT 0;
ALTER TABLE contest_participants ADD COLUMN IF NOT EXISTS is_alive TINYINT(1) DEFAULT 1;
ALTER TABLE contest_participants ADD COLUMN IF NOT EXISTS solve_time TIMESTAMP NULL;
ALTER TABLE contest_participants ADD COLUMN IF NOT EXISTS test_cases_passed INT DEFAULT 0;
ALTER TABLE contest_participants ADD COLUMN IF NOT EXISTS rating_updated TINYINT(1) DEFAULT 0;
