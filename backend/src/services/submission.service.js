const sequelize = require("../config/db");
const { exec } = require("child_process");
const { promisify } = require("util");
const fs = require("fs").promises;
const path = require("path");
const os = require("os");

const execAsync = promisify(exec);

/**
 * Runs JavaScript code
 */
async function runJavaScript(code, testCases) {
  let passed = 0;
  const passedIndexes = [];
  const total = testCases.length;
  const start = Date.now();
  let output = "";

  // Helper function to normalize values for comparison and display
  const normalizeValue = (val) => {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (Array.isArray(val)) {
      // Sort arrays for consistent comparison
      return JSON.stringify([...val].sort((a, b) => {
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        return String(a).localeCompare(String(b));
      }));
    }
    if (typeof val === 'object') {
      return JSON.stringify(val);
    }
    return String(val);
  };

  try {
    const userFunction = eval(`(${code})`);

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];

      const args = eval(`[${tc.input}]`);
      const expected = eval(tc.output);

      const result = userFunction(...args);

      const normResult = normalizeValue(result);
      const normExpected = normalizeValue(expected);

      if (normResult === normExpected) {
        passed++;
        passedIndexes.push(i);
        output += `Test ${i + 1}: ✓ Passed\n`;
      } else {
        output += `Test ${i + 1}: ✗ Failed\n  Expected: ${normExpected}\n  Got: ${normResult}\n`;
      }
    }

    const verdict = passed === total ? "AC" : passed > 0 ? "PARTIAL" : "WA";

    return {
      verdict,
      passed,
      total,
      passedIndexes,
      executionTime: Date.now() - start,
      output,
    };
  } catch (err) {
    console.error("JavaScript runtime error:", err.message);

    return {
      verdict: "RTE",
      passed: 0,
      total,
      passedIndexes: [],
      executionTime: Date.now() - start,
      errorMessage: err.message,
      output: `Runtime Error: ${err.message}`,
    };
  }
}

/**
 * Runs Python code
 */
async function runPython(code, testCases) {
  let passed = 0;
  const passedIndexes = [];
  const total = testCases.length;
  const start = Date.now();
  let output = "";

  const tempDir = os.tmpdir();
  const tempFile = path.join(tempDir, `solution_${Date.now()}.py`);

  try {
    // Write code to temp file
    await fs.writeFile(tempFile, code);

    // Run code for each test case
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      
      try {
        // Write input to temp file for Windows compatibility
        const inputFile = path.join(tempDir, `input_${Date.now()}_${i}.txt`);
        await fs.writeFile(inputFile, tc.input);
        
        const { stdout, stderr } = await execAsync(
          `python "${tempFile}" < "${inputFile}"`,
          { timeout: 5000 }
        );
        
        await fs.unlink(inputFile).catch(() => {});

        const result = stdout.trim();
        const expected = String(tc.output).trim();

        if (result === expected) {
          passed++;
          passedIndexes.push(i);
          output += `Test ${i + 1}: ✓ Passed\n`;
        } else {
          output += `Test ${i + 1}: ✗ Failed\n  Expected: ${expected}\n  Got: ${result}\n`;
        }

        if (stderr) {
          output += `  Warning: ${stderr}\n`;
        }
      } catch (execErr) {
        output += `Test ${i + 1}: ✗ Error\n  ${execErr.message}\n`;
      }
    }

    // Cleanup
    await fs.unlink(tempFile).catch(() => {});

    const verdict = passed === total ? "AC" : passed > 0 ? "PARTIAL" : "WA";

    return {
      verdict,
      passed,
      total,
      passedIndexes,
      executionTime: Date.now() - start,
      output,
    };
  } catch (err) {
    await fs.unlink(tempFile).catch(() => {});
    console.error("Python runtime error:", err.message);

    return {
      verdict: "RTE",
      passed: 0,
      total,
      passedIndexes: [],
      executionTime: Date.now() - start,
      errorMessage: err.message,
      output: `Runtime Error: ${err.message}`,
    };
  }
}

/**
 * Runs C++ code (requires g++ compiler)
 */
async function runCpp(code, testCases) {
  let passed = 0;
  const passedIndexes = [];
  const total = testCases.length;
  const start = Date.now();
  let output = "";

  const tempDir = os.tmpdir();
  const sourceFile = path.join(tempDir, `solution_${Date.now()}.cpp`);
  const exeFile = path.join(tempDir, `solution_${Date.now()}.exe`);

  try {
    // Write user code directly to file (no template)
    await fs.writeFile(sourceFile, code);

    // Compile
    try {
      await execAsync(`g++ "${sourceFile}" -o "${exeFile}"`, { timeout: 10000 });
    } catch (compileErr) {
      await fs.unlink(sourceFile).catch(() => {});
      return {
        verdict: "RTE",
        passed: 0,
        total,
        passedIndexes: [],
        executionTime: Date.now() - start,
        errorMessage: `Compilation Error: ${compileErr.message}`,
        output: `Compilation Error: ${compileErr.message}`,
      };
    }

    // Run for each test case
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      
      try {
        // Write input to temp file for Windows compatibility
        const inputFile = path.join(tempDir, `input_${Date.now()}_${i}.txt`);
        await fs.writeFile(inputFile, tc.input);
        
        const { stdout, stderr } = await execAsync(
          `"${exeFile}" < "${inputFile}"`,
          { timeout: 5000 }
        );
        
        await fs.unlink(inputFile).catch(() => {});

        const result = stdout.trim();
        const expected = String(tc.output).trim();

        if (result === expected) {
          passed++;
          passedIndexes.push(i);
          output += `Test ${i + 1}: ✓ Passed\n`;
        } else {
          output += `Test ${i + 1}: ✗ Failed\n  Expected: ${expected}\n  Got: ${result}\n`;
        }

        if (stderr) {
          output += `  Warning: ${stderr}\n`;
        }
      } catch (execErr) {
        output += `Test ${i + 1}: ✗ Error\n  ${execErr.message}\n`;
      }
    }

    // Cleanup
    await fs.unlink(sourceFile).catch(() => {});
    await fs.unlink(exeFile).catch(() => {});

    const verdict = passed === total ? "AC" : passed > 0 ? "PARTIAL" : "WA";

    return {
      verdict,
      passed,
      total,
      passedIndexes,
      executionTime: Date.now() - start,
      output,
    };
  } catch (err) {
    await fs.unlink(sourceFile).catch(() => {});
    await fs.unlink(exeFile).catch(() => {});
    console.error("C++ runtime error:", err.message);

    return {
      verdict: "RTE",
      passed: 0,
      total,
      passedIndexes: [],
      executionTime: Date.now() - start,
      errorMessage: err.message,
      output: `Runtime Error: ${err.message}`,
    };
  }
}

/**
 * Runs Java code
 */
async function runJava(code, testCases) {
  let passed = 0;
  const passedIndexes = [];
  const total = testCases.length;
  const start = Date.now();
  let output = "";

  const tempDir = os.tmpdir();
  const classMatch = code.match(/public\s+class\s+(\w+)/);
  const className = classMatch ? classMatch[1] : "Solution";
  const sourceFile = path.join(tempDir, `${className}.java`);

  try {
    // Write code to temp file
    await fs.writeFile(sourceFile, code);

    // Compile
    try {
      await execAsync(`javac "${sourceFile}"`, { timeout: 10000 });
    } catch (compileErr) {
      await fs.unlink(sourceFile).catch(() => {});
      return {
        verdict: "RTE",
        passed: 0,
        total,
        passedIndexes: [],
        executionTime: Date.now() - start,
        errorMessage: `Compilation Error: ${compileErr.message}`,
        output: `Compilation Error: ${compileErr.message}`,
      };
    }

    // Run for each test case
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      
      try {
        // Write input to temp file for Windows compatibility
        const inputFile = path.join(tempDir, `input_${Date.now()}_${i}.txt`);
        await fs.writeFile(inputFile, tc.input);
        
        const { stdout, stderr } = await execAsync(
          `cd "${tempDir}" && java ${className} < "${inputFile}"`,
          { timeout: 5000 }
        );
        
        await fs.unlink(inputFile).catch(() => {});

        const result = stdout.trim();
        const expected = String(tc.output).trim();

        if (result === expected) {
          passed++;
          passedIndexes.push(i);
          output += `Test ${i + 1}: ✓ Passed\n`;
        } else {
          output += `Test ${i + 1}: ✗ Failed\n  Expected: ${expected}\n  Got: ${result}\n`;
        }

        if (stderr) {
          output += `  Warning: ${stderr}\n`;
        }
      } catch (execErr) {
        output += `Test ${i + 1}: ✗ Error\n  ${execErr.message}\n`;
      }
    }

    // Cleanup
    await fs.unlink(sourceFile).catch(() => {});
    await fs.unlink(path.join(tempDir, `${className}.class`)).catch(() => {});

    const verdict = passed === total ? "AC" : passed > 0 ? "PARTIAL" : "WA";

    return {
      verdict,
      passed,
      total,
      passedIndexes,
      executionTime: Date.now() - start,
      output,
    };
  } catch (err) {
    await fs.unlink(sourceFile).catch(() => {});
    await fs.unlink(path.join(tempDir, `${className}.class`)).catch(() => {});
    console.error("Java runtime error:", err.message);

    return {
      verdict: "RTE",
      passed: 0,
      total,
      passedIndexes: [],
      executionTime: Date.now() - start,
      errorMessage: err.message,
      output: `Runtime Error: ${err.message}`,
    };
  }
}

/**
 * Runs C code (requires gcc compiler)
 */
async function runC(code, testCases) {
  let passed = 0;
  const passedIndexes = [];
  const total = testCases.length;
  const start = Date.now();
  let output = "";

  const tempDir = os.tmpdir();
  const sourceFile = path.join(tempDir, `solution_${Date.now()}.c`);
  const exeFile = path.join(tempDir, `solution_${Date.now()}.exe`);

  try {
    // Write code to temp file
    await fs.writeFile(sourceFile, code);

    // Compile
    try {
      await execAsync(`gcc "${sourceFile}" -o "${exeFile}"`, { timeout: 10000 });
    } catch (compileErr) {
      await fs.unlink(sourceFile).catch(() => {});
      return {
        verdict: "RTE",
        passed: 0,
        total,
        passedIndexes: [],
        executionTime: Date.now() - start,
        errorMessage: `Compilation Error: ${compileErr.message}`,
        output: `Compilation Error: ${compileErr.message}`,
      };
    }

    // Run for each test case
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      
      try {
        // Write input to temp file for Windows compatibility
        const inputFile = path.join(tempDir, `input_${Date.now()}_${i}.txt`);
        await fs.writeFile(inputFile, tc.input);
        
        const { stdout, stderr } = await execAsync(
          `"${exeFile}" < "${inputFile}"`,
          { timeout: 5000 }
        );
        
        await fs.unlink(inputFile).catch(() => {});

        const result = stdout.trim();
        const expected = String(tc.output).trim();

        if (result === expected) {
          passed++;
          passedIndexes.push(i);
          output += `Test ${i + 1}: ✓ Passed\n`;
        } else {
          output += `Test ${i + 1}: ✗ Failed\n  Expected: ${expected}\n  Got: ${result}\n`;
        }

        if (stderr) {
          output += `  Warning: ${stderr}\n`;
        }
      } catch (execErr) {
        output += `Test ${i + 1}: ✗ Error\n  ${execErr.message}\n`;
      }
    }

    // Cleanup
    await fs.unlink(sourceFile).catch(() => {});
    await fs.unlink(exeFile).catch(() => {});

    const verdict = passed === total ? "AC" : passed > 0 ? "PARTIAL" : "WA";

    return {
      verdict,
      passed,
      total,
      passedIndexes,
      executionTime: Date.now() - start,
      output,
    };
  } catch (err) {
    await fs.unlink(sourceFile).catch(() => {});
    await fs.unlink(exeFile).catch(() => {});
    console.error("C runtime error:", err.message);

    return {
      verdict: "RTE",
      passed: 0,
      total,
      passedIndexes: [],
      executionTime: Date.now() - start,
      errorMessage: err.message,
      output: `Runtime Error: ${err.message}`,
    };
  }
}

/**
 * Routes to appropriate language runner
 */
async function runJudge({ code, language, testCases }) {
  switch (language) {
    case "javascript":
      return runJavaScript(code, testCases);
    case "python":
      return runPython(code, testCases);
    case "cpp":
      return runCpp(code, testCases);
    case "c":
      return runC(code, testCases);
    case "java":
      return runJava(code, testCases);
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

/**
 * Handles submission
 */
async function handleSubmission({ userId, matchId, code, language }) {
  const [[match]] = await sequelize.query(
    `SELECT * FROM matches WHERE id = ? AND status = 'active'`,
    { replacements: [matchId] }
  );
  if (!match) throw new Error("Match not active");

  if (!match.problem_id) throw new Error("No problem assigned to match");

  const [[problem]] = await sequelize.query(
    `SELECT * FROM problems WHERE id = ?`,
    { replacements: [match.problem_id] }
  );
  if (!problem) throw new Error("Problem not found");

  const [testCases] = await sequelize.query(
    `SELECT input_data AS input, expected_output AS output
     FROM test_cases WHERE problem_id = ?`,
    { replacements: [problem.id] }
  );

  // Run judge with language support
  const result = await runJudge({ code, language, testCases });

  console.log(`🧪 JUDGE RESULT [${language}]:`, result);

  await sequelize.query(
    `INSERT INTO submissions
     (user_id, problem_id, match_id, code, language, verdict, execution_time_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    {
      replacements: [
        userId,
        problem.id,
        matchId,
        code,
        language,
        result.verdict,
        result.executionTime,
      ],
    }
  );

  return result;
}

module.exports = { handleSubmission, runJudge };
