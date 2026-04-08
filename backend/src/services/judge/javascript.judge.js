
module.exports.runJavaScript = async (code, testCases) => {
  let passed = 0;
  const start = Date.now();

  try {
    const userFunction = eval(`(${code})`);

    for (const tc of testCases) {
      const input = eval(`[${tc.input_data}]`);
      const expected = eval(tc.expected_output);

      const result = userFunction(...input);

      if (JSON.stringify(result) === JSON.stringify(expected)) {
        passed++;
      }
    }

    const executionTime = Date.now() - start;

    return {
      verdict: passed === testCases.length ? "AC" : "WA",
      passed,
      total: testCases.length,
      executionTime,
    };
  } catch (err) {
    console.error("Judge error:", err.message);
    return {
      verdict: "RTE",
      passed,
      total: testCases.length,
      executionTime: Date.now() - start,
    };
  }
};

