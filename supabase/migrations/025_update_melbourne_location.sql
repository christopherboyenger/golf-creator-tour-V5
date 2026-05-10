-- Migration: 025_update_melbourne_location.sql
-- Update Amy Grimmond and Elizabeth Pang location to Melbourne, Australia

UPDATE creators
SET country = 'AU',
    state   = 'Melbourne',
    city    = 'Melbourne'
WHERE name IN ('Amy Grimmond', 'Elizabeth Pang');
