-- ============================================================
-- DSA Battle Database Update Script
-- Run this SQL script to fix missing problem data
-- 
-- Usage: mysql -h <host> -u <user> -p dsabattle < backend/scripts/update-problems.sql
-- ============================================================

-- ============================================================
-- UPDATE PROBLEMS WITH MISSING FIELDS
-- ============================================================

-- Problem 1: Two Sum (JavaScript version)
UPDATE problems 
SET 
  input_format = 'The first line contains an integer n (2 <= n <= 10^4) - the size of the array.
The second line contains n integers separated by spaces - the array elements.
The third line contains an integer target - the target sum.',
  output_format = 'Print two integers separated by space - the indices of the two numbers that add up to target.',
  constraints = '- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- Only one valid answer exists.'
WHERE id = 1;

-- Problem 2: Valid Parentheses
UPDATE problems 
SET 
  input_format = 'A single line containing a string s consisting of parentheses characters ''('', '')'', ''{'', ''}'', ''['', and '']''.',
  output_format = 'Print "true" if the string is valid, otherwise print "false".',
  constraints = '- 1 <= s.length <= 10^4
- s consists of parentheses only ''()[]{}'''  
WHERE id = 2;

-- Problem 3: Longest Substring Without Repeating Characters
UPDATE problems 
SET 
  input_format = 'A single line containing a string s.',
  output_format = 'Print a single integer - the length of the longest substring without repeating characters.',
  constraints = '- 0 <= s.length <= 5 * 10^4
- s consists of English letters, digits, symbols and spaces.'
WHERE id = 3;

-- ============================================================
-- ADD SAMPLE TEST CASES
-- ============================================================

-- Problem 1: Two Sum - Sample Test Cases
INSERT INTO sample_test_cases (problem_id, input_data, expected_output, explanation) 
VALUES 
  (1, '4\n2 7 11 15\n9', '0 1', 'Because nums[0] + nums[1] = 2 + 7 = 9, we return [0, 1].'),
  (1, '3\n3 2 4\n6', '1 2', 'Because nums[1] + nums[2] = 2 + 4 = 6, we return [1, 2].'),
  (1, '2\n3 3\n6', '0 1', 'Because nums[0] + nums[1] = 3 + 3 = 6, we return [0, 1].');

-- Problem 2: Valid Parentheses - Sample Test Cases
INSERT INTO sample_test_cases (problem_id, input_data, expected_output, explanation) 
VALUES 
  (2, '()', 'true', 'Open bracket ''('' is closed by matching '')''.'),
  (2, '()[]{}', 'true', 'All open brackets are closed by matching brackets in correct order.'),
  (2, '(]', 'false', 'Open bracket ''('' is not closed by matching '')''.'),
  (2, '([)]', 'false', 'Open brackets are not closed in the correct order.');

-- Problem 3: Longest Substring - Sample Test Cases
INSERT INTO sample_test_cases (problem_id, input_data, expected_output, explanation) 
VALUES 
  (3, 'abcabcbb', '3', 'The answer is "abc", with the length of 3.'),
  (3, 'bbbbb', '1', 'The answer is "b", with the length of 1.'),
  (3, 'pwwkew', '3', 'The answer is "wke", with the length of 3. Note that "pwke" is a subsequence, not a substring.');

-- Problem 4: Two Sum (IO version) - Sample Test Cases
INSERT INTO sample_test_cases (problem_id, input_data, expected_output, explanation) 
VALUES 
  (4, '4\n2 7 11 15\n9', '0 1', 'Because nums[0] + nums[1] = 2 + 7 = 9.'),
  (4, '3\n3 2 4\n6', '1 2', 'Because nums[1] + nums[2] = 2 + 4 = 6.');

-- Problem 5: Reverse Array - Sample Test Cases
INSERT INTO sample_test_cases (problem_id, input_data, expected_output, explanation) 
VALUES 
  (5, '5\n1 2 3 4 5', '5 4 3 2 1', 'The reversed array of [1,2,3,4,5] is [5,4,3,2,1].'),
  (5, '3\n7 8 9', '9 8 7', 'The reversed array of [7,8,9] is [9,8,7].');

-- ============================================================
-- ADD HIDDEN TEST CASES
-- ============================================================

-- Problem 2: Valid Parentheses - Hidden Test Cases
INSERT INTO test_cases (problem_id, input_data, expected_output) 
VALUES 
  (2, '{[]}', 'true'),
  (2, '(((', 'false'),
  (2, '))', 'false'),
  (2, '{[()]}', 'true'),
  (2, '{[(])}', 'false');

-- Problem 3: Longest Substring - Hidden Test Cases
INSERT INTO test_cases (problem_id, input_data, expected_output) 
VALUES 
  (3, '', '0'),
  (3, ' ', '1'),
  (3, 'au', '2'),
  (3, 'dvdf', '3'),
  (3, 'anviaj', '5'),
  (3, 'abcdefghijklmnopqrstuvwxyz', '26');

-- Problem 4: Two Sum (IO version) - Hidden Test Cases
INSERT INTO test_cases (problem_id, input_data, expected_output) 
VALUES 
  (4, '2\n3 3\n6', '0 1'),
  (4, '4\n-1 -2 -3 -4\n-6', '1 3'),
  (4, '3\n0 4 3\n7', '1 2');

-- Problem 5: Reverse Array - Hidden Test Cases
INSERT INTO test_cases (problem_id, input_data, expected_output) 
VALUES 
  (5, '1\n42', '42'),
  (5, '4\n-1 -2 -3 -4', '-4 -3 -2 -1'),
  (5, '6\n1 2 3 3 2 1', '1 2 3 3 2 1');

-- ============================================================
-- Verification Query (Optional - run manually to check)
-- ============================================================
-- SELECT p.id, p.title, p.input_format IS NOT NULL as has_input, 
--        p.output_format IS NOT NULL as has_output, 
--        p.constraints IS NOT NULL as has_constraints,
--        (SELECT COUNT(*) FROM sample_test_cases WHERE problem_id = p.id) as sample_cases,
--        (SELECT COUNT(*) FROM test_cases WHERE problem_id = p.id) as hidden_cases
-- FROM problems p;
