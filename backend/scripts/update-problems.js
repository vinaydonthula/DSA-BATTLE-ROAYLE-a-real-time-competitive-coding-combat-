/**
 * Database Update Script for DSA Battle
 * This script updates problems with missing fields and adds test cases
 * 
 * Run: node backend/scripts/update-problems.js
 */

require('dotenv').config({ path: '../.env' });
const sequelize = require('../src/config/db');

async function updateDatabase() {
  console.log('🔄 Starting database updates...\n');

  try {
    // ============================================================
    // UPDATE PROBLEMS 1, 2, 3 WITH MISSING FIELDS
    // ============================================================
    console.log('📋 Updating problems with missing fields...');

    // Problem 1: Two Sum (JavaScript version)
    await sequelize.query(`
      UPDATE problems 
      SET 
        input_format = 'The first line contains an integer n (2 <= n <= 10^4) - the size of the array.\nThe second line contains n integers separated by spaces - the array elements.\nThe third line contains an integer target - the target sum.',
        output_format = 'Print two integers separated by space - the indices of the two numbers that add up to target.',
        constraints = '- 2 <= nums.length <= 10^4\n- -10^9 <= nums[i] <= 10^9\n- -10^9 <= target <= 10^9\n- Only one valid answer exists.'
      WHERE id = 1
    `);
    console.log('✅ Problem 1 (Two Sum) updated');

    // Problem 2: Valid Parentheses
    await sequelize.query(`
      UPDATE problems 
      SET 
        input_format = 'A single line containing a string s consisting of parentheses characters ''('', '')'', ''{'', ''}'', ''['', and '']''.',
        output_format = 'Print "true" if the string is valid, otherwise print "false".',
        constraints = '- 1 <= s.length <= 10^4\n- s consists of parentheses only ''()[]{}'''  
      WHERE id = 2
    `);
    console.log('✅ Problem 2 (Valid Parentheses) updated');

    // Problem 3: Longest Substring Without Repeating Characters
    await sequelize.query(`
      UPDATE problems 
      SET 
        input_format = 'A single line containing a string s.',
        output_format = 'Print a single integer - the length of the longest substring without repeating characters.',
        constraints = '- 0 <= s.length <= 5 * 10^4\n- s consists of English letters, digits, symbols and spaces.'
      WHERE id = 3
    `);
    console.log('✅ Problem 3 (Longest Substring) updated');

    // ============================================================
    // ADD SAMPLE TEST CASES
    // ============================================================
    console.log('\n🧪 Adding sample test cases...');

    // Check if sample test cases already exist
    const [existingSamples] = await sequelize.query('SELECT COUNT(*) as count FROM sample_test_cases');
    
    if (existingSamples[0].count > 0) {
      console.log('⚠️  Sample test cases already exist, skipping...');
    } else {
      // Problem 1: Two Sum - Sample Test Cases
      await sequelize.query(`
        INSERT INTO sample_test_cases (problem_id, input_data, expected_output, explanation) 
        VALUES 
        (1, '4\n2 7 11 15\n9', '0 1', 'Because nums[0] + nums[1] = 2 + 7 = 9, we return [0, 1].'),
        (1, '3\n3 2 4\n6', '1 2', 'Because nums[1] + nums[2] = 2 + 4 = 6, we return [1, 2].'),
        (1, '2\n3 3\n6', '0 1', 'Because nums[0] + nums[1] = 3 + 3 = 6, we return [0, 1].')
      `);
      console.log('✅ Problem 1 sample test cases added');

      // Problem 2: Valid Parentheses - Sample Test Cases
      await sequelize.query(`
        INSERT INTO sample_test_cases (problem_id, input_data, expected_output, explanation) 
        VALUES 
        (2, '()', 'true', 'Open bracket ''('' is closed by matching '')''.'),
        (2, '()[]{}', 'true', 'All open brackets are closed by matching brackets in correct order.'),
        (2, '(]', 'false', 'Open bracket ''('' is not closed by matching '')''.'),
        (2, '([)]', 'false', 'Open brackets are not closed in the correct order.')
      `);
      console.log('✅ Problem 2 sample test cases added');

      // Problem 3: Longest Substring - Sample Test Cases
      await sequelize.query(`
        INSERT INTO sample_test_cases (problem_id, input_data, expected_output, explanation) 
        VALUES 
        (3, 'abcabcbb', '3', 'The answer is "abc", with the length of 3.'),
        (3, 'bbbbb', '1', 'The answer is "b", with the length of 1.'),
        (3, 'pwwkew', '3', 'The answer is "wke", with the length of 3. Note that "pwke" is a subsequence, not a substring.')
      `);
      console.log('✅ Problem 3 sample test cases added');

      // Problem 4: Two Sum (IO version) - Sample Test Cases
      await sequelize.query(`
        INSERT INTO sample_test_cases (problem_id, input_data, expected_output, explanation) 
        VALUES 
        (4, '4\n2 7 11 15\n9', '0 1', 'Because nums[0] + nums[1] = 2 + 7 = 9.'),
        (4, '3\n3 2 4\n6', '1 2', 'Because nums[1] + nums[2] = 2 + 4 = 6.')
      `);
      console.log('✅ Problem 4 sample test cases added');

      // Problem 5: Reverse Array - Sample Test Cases
      await sequelize.query(`
        INSERT INTO sample_test_cases (problem_id, input_data, expected_output, explanation) 
        VALUES 
        (5, '5\n1 2 3 4 5', '5 4 3 2 1', 'The reversed array of [1,2,3,4,5] is [5,4,3,2,1].'),
        (5, '3\n7 8 9', '9 8 7', 'The reversed array of [7,8,9] is [9,8,7].')
      `);
      console.log('✅ Problem 5 sample test cases added');
    }

    // ============================================================
    // ADD HIDDEN TEST CASES FOR PROBLEMS 2, 3, 4, 5
    // ============================================================
    console.log('\n🔒 Adding hidden test cases...');

    // Check existing hidden test cases
    const [existingHidden] = await sequelize.query('SELECT problem_id, COUNT(*) as count FROM test_cases GROUP BY problem_id');
    const hiddenCounts = {};
    existingHidden.forEach(row => {
      hiddenCounts[row.problem_id] = row.count;
    });

    // Problem 2: Valid Parentheses - Hidden Test Cases
    if (!hiddenCounts[2]) {
      await sequelize.query(`
        INSERT INTO test_cases (problem_id, input_data, expected_output) 
        VALUES 
        (2, '{[]}', 'true'),
        (2, '(((', 'false'),
        (2, '))', 'false'),
        (2, '{[()]}', 'true'),
        (2, '{[(])}', 'false')
      `);
      console.log('✅ Problem 2 hidden test cases added');
    } else {
      console.log('⚠️  Problem 2 hidden test cases already exist');
    }

    // Problem 3: Longest Substring - Hidden Test Cases
    if (!hiddenCounts[3]) {
      await sequelize.query(`
        INSERT INTO test_cases (problem_id, input_data, expected_output) 
        VALUES 
        (3, '', '0'),
        (3, ' ', '1'),
        (3, 'au', '2'),
        (3, 'dvdf', '3'),
        (3, 'anviaj', '5'),
        (3, 'abcdefghijklmnopqrstuvwxyz', '26')
      `);
      console.log('✅ Problem 3 hidden test cases added');
    } else {
      console.log('⚠️  Problem 3 hidden test cases already exist');
    }

    // Problem 4: Two Sum (IO version) - Hidden Test Cases
    if (!hiddenCounts[4]) {
      await sequelize.query(`
        INSERT INTO test_cases (problem_id, input_data, expected_output) 
        VALUES 
        (4, '2\n3 3\n6', '0 1'),
        (4, '4\n-1 -2 -3 -4\n-6', '1 3'),
        (4, '3\n0 4 3\n7', '1 2')
      `);
      console.log('✅ Problem 4 hidden test cases added');
    } else {
      console.log('⚠️  Problem 4 hidden test cases already exist');
    }

    // Problem 5: Reverse Array - Hidden Test Cases
    if (!hiddenCounts[5]) {
      await sequelize.query(`
        INSERT INTO test_cases (problem_id, input_data, expected_output) 
        VALUES 
        (5, '1\n42', '42'),
        (5, '4\n-1 -2 -3 -4', '-4 -3 -2 -1'),
        (5, '6\n1 2 3 3 2 1', '1 2 3 3 2 1')
      `);
      console.log('✅ Problem 5 hidden test cases added');
    } else {
      console.log('⚠️  Problem 5 hidden test cases already exist');
    }

    console.log('\n✨ Database update completed successfully!');
    console.log('\nSummary:');
    console.log('- Updated problems 1, 2, 3 with input_format, output_format, and constraints');
    console.log('- Added sample test cases for all problems (1-5)');
    console.log('- Added hidden test cases for problems 2, 3, 4, 5');

  } catch (error) {
    console.error('\n❌ Error updating database:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    console.log('\n👋 Database connection closed.');
  }
}

// Run the update
updateDatabase();
