# Database Update Scripts

These scripts fix missing problem data in the DSA Battle database.

## Issues Fixed

1. **Missing Input/Output Format & Constraints**: Problems 1, 2, and 3 had NULL values for these fields
2. **Missing Sample Test Cases**: All problems were missing sample test cases (visible to users)
3. **Missing Hidden Test Cases**: Problems 2, 3, 4, and 5 were missing hidden test cases (for judging)

## Files

- `update-problems.js` - Node.js script using Sequelize (recommended)
- `update-problems.sql` - Pure SQL script

## How to Run

### Option 1: Using Node.js Script (Recommended)

```bash
cd backend
node scripts/update-problems.js
```

This will:
- Update problems 1, 2, 3 with proper input_format, output_format, and constraints
- Add sample test cases for all problems (1-5)
- Add hidden test cases for problems 2, 3, 4, 5
- Show progress and confirmation messages

### Option 2: Using SQL Script

If you prefer to run SQL directly:

```bash
cd backend
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < scripts/update-problems.sql
```

Or if using the MySQL shell:

```sql
source scripts/update-problems.sql
```

## What Gets Updated

### Problems Table

| Problem | Title | Fields Added |
|---------|-------|--------------|
| 1 | Two Sum | input_format, output_format, constraints |
| 2 | Valid Parentheses | input_format, output_format, constraints |
| 3 | Longest Substring | input_format, output_format, constraints |
| 4 | Two Sum (IO) | Already complete |
| 5 | Reverse Array | Already complete |

### Sample Test Cases (Visible to Users)

- **Problem 1**: 3 sample test cases
- **Problem 2**: 4 sample test cases  
- **Problem 3**: 3 sample test cases
- **Problem 4**: 2 sample test cases
- **Problem 5**: 2 sample test cases

### Hidden Test Cases (For Judging)

- **Problem 1**: Already has 2 test cases
- **Problem 2**: 5 new test cases
- **Problem 3**: 6 new test cases
- **Problem 4**: 3 new test cases
- **Problem 5**: 3 new test cases

## Verification

After running the script, you can verify the updates with this query:

```sql
SELECT 
  p.id, 
  p.title, 
  p.input_format IS NOT NULL as has_input, 
  p.output_format IS NOT NULL as has_output, 
  p.constraints IS NOT NULL as has_constraints,
  (SELECT COUNT(*) FROM sample_test_cases WHERE problem_id = p.id) as sample_cases,
  (SELECT COUNT(*) FROM test_cases WHERE problem_id = p.id) as hidden_cases
FROM problems p;
```

Expected output:
```
+----+-------------------------------------------+-----------+------------+---------------+-------------+-------------+
| id | title                                     | has_input | has_output | has_constraints| sample_cases| hidden_cases|
+----+-------------------------------------------+-----------+------------+---------------+-------------+-------------+
|  1 | Two Sum                                   |         1 |          1 |             1 |           3 |           2 |
|  2 | Valid Parentheses                         |         1 |          1 |             1 |           4 |           5 |
|  3 | Longest Substring Without Repeating...    |         1 |          1 |             1 |           3 |           6 |
|  4 | Two Sum                                   |         1 |          1 |             1 |           2 |           3 |
|  5 | Reverse Array                             |         1 |          1 |             1 |           2 |           3 |
+----+-------------------------------------------+-----------+------------+---------------+-------------+-------------+
```

## Notes

- The scripts are idempotent (safe to run multiple times)
- The Node.js script checks if data already exists before inserting
- If you encounter duplicate key errors in SQL, it means data already exists (safe to ignore)
