-- Migration: 028_remove_fake_activity_data.sql
-- Purpose: Remove fake/seed activity_feed entries that were inserted as test data.
-- These entries are identified by:
--   1. points = 0 (no legitimate event awards 0 points)
--   2. title matching old ad-hoc format (e.g. "Chris Boyenger earned 50 pts")
--      i.e. titles that are NOT one of the standard labels produced by the trigger.

DELETE FROM activity_feed
WHERE points = 0
   OR title NOT IN (
     'Content approved',
     'Social milestone',
     'Social connection',
     'Streak bonus',
     'Referral bonus',
     'Points earned'
   );
