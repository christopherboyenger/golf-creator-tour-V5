-- Migration: 027_set_cannon_exempt_rank.sql
-- Purpose: Complete the podium exempt_rank setup by setting Cannon's rank to 3.
-- Fixed order: 1 = Keaton_v, 2 = josepelayogolf, 3 = cannonclaycomb

UPDATE creators SET exempt_rank = 3 WHERE handle = 'cannonclaycomb';
