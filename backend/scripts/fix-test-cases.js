/**
 * Fix Test Cases Output Format
 * Updates test cases to use space-separated format instead of array format
 * 
 * Run: node backend/scripts/fix-test-cases.js
 */

const sequelize = require('../src/config/db');

async function fixTestCases() {
  console.log('🔄 Fixing test case output formats...\n');

  try {
    // ============================================================
    // FIX HIDDEN TEST CASES - Remove brackets from expected outputs
    // ============================================================
    console.log('🔒 Fixing hidden test cases...');

    // Problem 1: Two Sum - Update test cases to use space-separated format
    await sequelize.query(`
      UPDATE test_cases 
      SET expected_output = REPLACE(REPLACE(expected_output, '[', ''), ']', '')
      WHERE problem_id = 1 AND expected_output LIKE '%[%]%'
    `);
    console.log('✅ Problem 1 hidden test cases fixed');

    // Check current state
    const [hiddenCases] = await sequelize.query(`
      SELECT problem_id, input_data, expected_output 
      FROM test_cases 
      WHERE problem_id IN (1, 2, 3, 4, 5)
      ORDER BY problem_id, id
    `);

    console.log('\n📊 Current hidden test cases:');
    hiddenCases.forEach(tc => {
      console.log(`  Problem ${tc.problem_id}: Input="${tc.input_data}" -> Expected="${tc.expected_output}"`);
    });

    // ============================================================
    // FIX SAMPLE TEST CASES - Remove brackets from expected outputs
    // ============================================================
    console.log('\n🧪 Fixing sample test cases...');

    await sequelize.query(`
      UPDATE sample_test_cases 
      SET expected_output = REPLACE(REPLACE(expected_output, '[', ''), ']', '')
      WHERE expected_output LIKE '%[%]%'
    `);
    console.log('✅ All sample test cases fixed');

    // Check current state
    const [sampleCases] = await sequelize.query(`
      SELECT problem_id, input_data, expected_output, explanation
      FROM sample_test_cases 
      WHERE problem_id IN (1, 2, 3, 4, 5)
      ORDER BY problem_id, id
    `);

    console.log('\n📊 Current sample test cases:');
    sampleCases.forEach(tc => {
      console.log(`  Problem ${tc.problem_id}: Input="${tc.input_data}" -> Expected="${tc.expected_output}"`);
    });

    console.log('\n✨ Test cases fixed successfully!');
    console.log('\nAll expected outputs are now in space-separated format:');
    console.log('  - Before: [0,1]');
    console.log('  - After: 0 1');

  } catch (error) {
    console.error('\n❌ Error fixing test cases:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    console.log('\n👋 Database connection closed.');
  }
}

// Run the fix
fixTestCases();
