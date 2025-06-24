# Database Testing Strategy for Stylisto

## Overview

This document outlines the comprehensive testing strategy for the Stylisto database schema, covering table correctness, RLS policies, data integrity, and performance validation.

## Test Categories

### 1. Schema Validation Tests

#### Table Structure Tests
```sql
-- Test: Verify all required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'users', 'clothing_items', 'saved_outfits', 'outfit_items',
  'user_preferences', 'ai_feedback', 'user_sessions', 
  'item_interactions', 'outfit_analytics'
);

-- Test: Verify column definitions
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'clothing_items'
ORDER BY ordinal_position;

-- Test: Verify enum types exist
SELECT typname FROM pg_type 
WHERE typname IN (
  'clothing_category', 'season_type', 'occasion_type', 'feedback_type'
);
```

#### Constraint Validation Tests
```sql
-- Test: Verify foreign key constraints
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public';

-- Test: Verify check constraints
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public';

-- Test: Verify unique constraints
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE constraint_type = 'UNIQUE'
AND table_schema = 'public';
```

#### Index Validation Tests
```sql
-- Test: Verify critical indexes exist
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('clothing_items', 'saved_outfits', 'outfit_items')
ORDER BY tablename, indexname;

-- Test: Verify GIN indexes for array fields
SELECT indexname, indexdef
FROM pg_indexes
WHERE indexdef LIKE '%GIN%'
AND schemaname = 'public';
```

### 2. Row Level Security (RLS) Tests

#### Authentication Tests
```sql
-- Test: Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Test: Verify policies exist for each table
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

#### Access Control Tests
```sql
-- Test: User isolation (requires test users)
-- Create test scenario with two users
BEGIN;

-- Simulate User A session
SET LOCAL "request.jwt.claims" TO '{"sub": "user-a-uuid"}';

-- Insert test data for User A
INSERT INTO clothing_items (user_id, name, category, color, image_url)
VALUES ('user-a-uuid', 'Test Shirt A', 'tops', 'blue', 'http://example.com/image.jpg');

-- Simulate User B session
SET LOCAL "request.jwt.claims" TO '{"sub": "user-b-uuid"}';

-- User B should not see User A's items
SELECT COUNT(*) FROM clothing_items; -- Should return 0

-- User B inserts their own item
INSERT INTO clothing_items (user_id, name, category, color, image_url)
VALUES ('user-b-uuid', 'Test Shirt B', 'tops', 'red', 'http://example.com/image.jpg');

-- User B should only see their own item
SELECT COUNT(*) FROM clothing_items; -- Should return 1

ROLLBACK;
```

#### Policy Coverage Tests
```sql
-- Test: Verify all CRUD operations are covered by policies
SELECT 
  tablename,
  cmd,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, cmd
ORDER BY tablename, cmd;

-- Test: Verify no tables allow unrestricted access
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN (
  SELECT DISTINCT tablename
  FROM pg_policies
  WHERE schemaname = 'public'
);
```

### 3. Data Integrity Tests

#### Foreign Key Enforcement Tests
```sql
-- Test: Attempt to insert invalid foreign key
BEGIN;
INSERT INTO clothing_items (user_id, name, category, color, image_url)
VALUES ('invalid-uuid', 'Test Item', 'tops', 'blue', 'http://example.com/image.jpg');
-- Should fail with foreign key violation
ROLLBACK;

-- Test: Cascade delete behavior
BEGIN;
-- Create test user and item
INSERT INTO users (id, email) VALUES ('test-user-uuid', 'test@example.com');
INSERT INTO clothing_items (user_id, name, category, color, image_url)
VALUES ('test-user-uuid', 'Test Item', 'tops', 'blue', 'http://example.com/image.jpg');

-- Delete user should cascade to clothing items
DELETE FROM users WHERE id = 'test-user-uuid';
SELECT COUNT(*) FROM clothing_items WHERE user_id = 'test-user-uuid'; -- Should return 0
ROLLBACK;
```

#### Check Constraint Tests
```sql
-- Test: Negative times_worn should fail
BEGIN;
INSERT INTO clothing_items (user_id, name, category, color, image_url, times_worn)
VALUES ('test-uuid', 'Test Item', 'tops', 'blue', 'http://example.com/image.jpg', -1);
-- Should fail with check constraint violation
ROLLBACK;

-- Test: Invalid user_rating should fail
BEGIN;
INSERT INTO ai_feedback (user_id, feedback_type, user_rating)
VALUES ('test-uuid', 'outfit_suggestion', 6);
-- Should fail with check constraint violation
ROLLBACK;

-- Test: Negative price should fail
BEGIN;
INSERT INTO clothing_items (user_id, name, category, color, image_url, price)
VALUES ('test-uuid', 'Test Item', 'tops', 'blue', 'http://example.com/image.jpg', -10.00);
-- Should fail with check constraint violation
ROLLBACK;
```

#### Unique Constraint Tests
```sql
-- Test: Duplicate email should fail
BEGIN;
INSERT INTO users (id, email) VALUES ('user1', 'test@example.com');
INSERT INTO users (id, email) VALUES ('user2', 'test@example.com');
-- Should fail with unique constraint violation
ROLLBACK;

-- Test: Duplicate outfit-item combination should fail
BEGIN;
-- Setup test data
INSERT INTO users (id, email) VALUES ('test-user', 'test@example.com');
INSERT INTO saved_outfits (id, user_id, name) VALUES ('test-outfit', 'test-user', 'Test Outfit');
INSERT INTO clothing_items (id, user_id, name, category, color, image_url) 
VALUES ('test-item', 'test-user', 'Test Item', 'tops', 'blue', 'http://example.com/image.jpg');

-- First insert should succeed
INSERT INTO outfit_items (outfit_id, clothing_item_id) VALUES ('test-outfit', 'test-item');

-- Duplicate should fail
INSERT INTO outfit_items (outfit_id, clothing_item_id) VALUES ('test-outfit', 'test-item');
-- Should fail with unique constraint violation
ROLLBACK;
```

### 4. Soft Delete Tests

#### Soft Delete Functionality Tests
```sql
-- Test: Soft delete function
BEGIN;
-- Setup test data
INSERT INTO users (id, email) VALUES ('test-user', 'test@example.com');
INSERT INTO clothing_items (id, user_id, name, category, color, image_url) 
VALUES ('test-item', 'test-user', 'Test Item', 'tops', 'blue', 'http://example.com/image.jpg');

-- Soft delete the item
SELECT soft_delete_clothing_item('test-item');

-- Item should still exist but with deleted_at timestamp
SELECT id, deleted_at IS NOT NULL as is_deleted 
FROM clothing_items WHERE id = 'test-item';

-- Item should not appear in normal queries (due to RLS policies)
SET LOCAL "request.jwt.claims" TO '{"sub": "test-user"}';
SELECT COUNT(*) FROM clothing_items WHERE id = 'test-item'; -- Should return 0
ROLLBACK;
```

#### Soft Delete Query Filtering Tests
```sql
-- Test: Verify deleted items are filtered from views
BEGIN;
-- Setup test data with some deleted items
INSERT INTO users (id, email) VALUES ('test-user', 'test@example.com');
INSERT INTO clothing_items (id, user_id, name, category, color, image_url) 
VALUES 
  ('item1', 'test-user', 'Active Item', 'tops', 'blue', 'http://example.com/image.jpg'),
  ('item2', 'test-user', 'Deleted Item', 'tops', 'red', 'http://example.com/image.jpg');

-- Soft delete one item
UPDATE clothing_items SET deleted_at = now() WHERE id = 'item2';

-- Views should only show active items
SELECT COUNT(*) FROM user_wardrobe_summary WHERE user_id = 'test-user';
SELECT COUNT(*) FROM popular_items WHERE user_id = 'test-user';
ROLLBACK;
```

### 5. Function and Trigger Tests

#### Database Function Tests
```sql
-- Test: get_wardrobe_stats function
BEGIN;
-- Setup test data
INSERT INTO users (id, email, full_name) VALUES ('test-user', 'test@example.com', 'Test User');
INSERT INTO clothing_items (user_id, name, category, color, image_url, price, is_favorite, times_worn) 
VALUES 
  ('test-user', 'Shirt 1', 'tops', 'blue', 'http://example.com/1.jpg', 25.00, true, 5),
  ('test-user', 'Pants 1', 'bottoms', 'black', 'http://example.com/2.jpg', 50.00, false, 3);

-- Test function returns expected structure
SET LOCAL "request.jwt.claims" TO '{"sub": "test-user"}';
SELECT get_wardrobe_stats('test-user');
ROLLBACK;

-- Test: record_item_interaction function
BEGIN;
-- Setup test data
INSERT INTO users (id, email) VALUES ('test-user', 'test@example.com');
INSERT INTO clothing_items (id, user_id, name, category, color, image_url, times_worn) 
VALUES ('test-item', 'test-user', 'Test Item', 'tops', 'blue', 'http://example.com/image.jpg', 0);

-- Record interaction
SET LOCAL "request.jwt.claims" TO '{"sub": "test-user"}';
SELECT record_item_interaction('test-item', 'worn', '{"weather": "sunny"}');

-- Verify interaction was recorded and times_worn updated
SELECT times_worn FROM clothing_items WHERE id = 'test-item'; -- Should be 1
SELECT COUNT(*) FROM item_interactions WHERE clothing_item_id = 'test-item'; -- Should be 1
ROLLBACK;
```

#### Trigger Tests
```sql
-- Test: updated_at trigger
BEGIN;
INSERT INTO users (id, email) VALUES ('test-user', 'test@example.com');
INSERT INTO clothing_items (id, user_id, name, category, color, image_url) 
VALUES ('test-item', 'test-user', 'Test Item', 'tops', 'blue', 'http://example.com/image.jpg');

-- Get initial timestamps
SELECT created_at, updated_at FROM clothing_items WHERE id = 'test-item';

-- Wait a moment and update
SELECT pg_sleep(1);
UPDATE clothing_items SET name = 'Updated Item' WHERE id = 'test-item';

-- Verify updated_at changed
SELECT 
  created_at,
  updated_at,
  updated_at > created_at as timestamp_updated
FROM clothing_items WHERE id = 'test-item';
ROLLBACK;
```

### 6. Performance Tests

#### Query Performance Tests
```sql
-- Test: Index usage for common queries
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM clothing_items 
WHERE user_id = 'test-user-uuid' 
AND deleted_at IS NULL 
ORDER BY created_at DESC;

-- Test: Array field query performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM clothing_items 
WHERE 'summer' = ANY(seasons) 
AND deleted_at IS NULL;

-- Test: Join performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT ci.name, so.name as outfit_name
FROM clothing_items ci
JOIN outfit_items oi ON ci.id = oi.clothing_item_id
JOIN saved_outfits so ON oi.outfit_id = so.id
WHERE ci.user_id = 'test-user-uuid'
AND ci.deleted_at IS NULL
AND so.deleted_at IS NULL;
```

#### Concurrent Access Tests
```sql
-- Test: Concurrent inserts (requires multiple connections)
-- Connection 1:
BEGIN;
INSERT INTO clothing_items (user_id, name, category, color, image_url) 
VALUES ('user1', 'Item 1', 'tops', 'blue', 'http://example.com/1.jpg');

-- Connection 2 (should not block):
BEGIN;
INSERT INTO clothing_items (user_id, name, category, color, image_url) 
VALUES ('user2', 'Item 2', 'tops', 'red', 'http://example.com/2.jpg');

-- Both should commit successfully
COMMIT; -- On both connections
```

### 7. View Tests

#### View Data Accuracy Tests
```sql
-- Test: user_wardrobe_summary view
BEGIN;
-- Setup test data
INSERT INTO users (id, email, full_name) VALUES ('test-user', 'test@example.com', 'Test User');
INSERT INTO clothing_items (user_id, name, category, color, image_url, price, is_favorite) 
VALUES 
  ('test-user', 'Item 1', 'tops', 'blue', 'http://example.com/1.jpg', 25.00, true),
  ('test-user', 'Item 2', 'bottoms', 'black', 'http://example.com/2.jpg', 50.00, false);
INSERT INTO saved_outfits (user_id, name) VALUES ('test-user', 'Outfit 1');

-- Test view calculations
SELECT 
  total_items,
  favorite_items,
  total_outfits,
  total_wardrobe_value
FROM user_wardrobe_summary 
WHERE user_id = 'test-user';
-- Should return: 2, 1, 1, 75.00
ROLLBACK;
```

#### View Security Tests
```sql
-- Test: Views respect RLS policies
BEGIN;
-- Setup data for two users
INSERT INTO users (id, email) VALUES 
  ('user1', 'user1@example.com'),
  ('user2', 'user2@example.com');
INSERT INTO clothing_items (user_id, name, category, color, image_url) 
VALUES 
  ('user1', 'User 1 Item', 'tops', 'blue', 'http://example.com/1.jpg'),
  ('user2', 'User 2 Item', 'tops', 'red', 'http://example.com/2.jpg');

-- User 1 should only see their data in views
SET LOCAL "request.jwt.claims" TO '{"sub": "user1"}';
SELECT COUNT(*) FROM popular_items; -- Should only show user1's items
ROLLBACK;
```

## Test Execution Framework

### Automated Test Suite
```sql
-- Create test framework functions
CREATE OR REPLACE FUNCTION run_schema_tests()
RETURNS TABLE(test_name text, status text, message text)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Table existence tests
  RETURN QUERY
  SELECT 
    'table_existence'::text,
    CASE WHEN COUNT(*) = 9 THEN 'PASS' ELSE 'FAIL' END::text,
    'Expected 9 tables, found ' || COUNT(*)::text
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN (
    'users', 'clothing_items', 'saved_outfits', 'outfit_items',
    'user_preferences', 'ai_feedback', 'user_sessions', 
    'item_interactions', 'outfit_analytics'
  );

  -- RLS enabled tests
  RETURN QUERY
  SELECT 
    'rls_enabled'::text,
    CASE WHEN COUNT(*) = 9 THEN 'PASS' ELSE 'FAIL' END::text,
    'Expected 9 tables with RLS, found ' || COUNT(*)::text
  FROM pg_tables
  WHERE schemaname = 'public'
  AND rowsecurity = true;

  -- Add more tests...
END;
$$;

-- Execute test suite
SELECT * FROM run_schema_tests();
```

### Performance Benchmarking
```sql
-- Create performance test data
CREATE OR REPLACE FUNCTION create_test_data(user_count int, items_per_user int)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  i int;
  j int;
  user_uuid uuid;
BEGIN
  FOR i IN 1..user_count LOOP
    user_uuid := gen_random_uuid();
    INSERT INTO users (id, email, full_name) 
    VALUES (user_uuid, 'user' || i || '@test.com', 'Test User ' || i);
    
    FOR j IN 1..items_per_user LOOP
      INSERT INTO clothing_items (user_id, name, category, color, image_url, times_worn)
      VALUES (
        user_uuid, 
        'Item ' || j, 
        (ARRAY['tops', 'bottoms', 'dresses'])[1 + (j % 3)], 
        (ARRAY['red', 'blue', 'green'])[1 + (j % 3)],
        'http://example.com/' || j || '.jpg',
        j % 10
      );
    END LOOP;
  END LOOP;
END;
$$;

-- Run performance tests
SELECT create_test_data(100, 50); -- 100 users, 50 items each
\timing on
SELECT COUNT(*) FROM clothing_items WHERE times_worn > 5;
SELECT * FROM user_wardrobe_summary LIMIT 10;
\timing off
```

## Continuous Testing

### CI/CD Integration
```yaml
# Example GitHub Actions workflow
name: Database Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v2
      - name: Run migrations
        run: |
          for file in supabase/migrations/*.sql; do
            psql -h localhost -U postgres -d postgres -f "$file"
          done
      - name: Run tests
        run: |
          psql -h localhost -U postgres -d postgres -f tests/schema_tests.sql
```

### Monitoring and Alerts
- Set up monitoring for test execution
- Alert on test failures
- Track performance regression
- Monitor RLS policy effectiveness

This comprehensive testing strategy ensures the Stylisto database schema maintains integrity, security, and performance as the application evolves.