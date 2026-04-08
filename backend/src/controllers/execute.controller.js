const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const questions = [
  {
    id: 1,
    title: "Two Sum",
    description: "Find two indices such that nums[i] + nums[j] = target\n\nINPUT:\nnums = [2,7,11,15]\ntarget = 9\n\nOUTPUT:\n0 1",
    inputFormat: "First line: space-separated integers for nums\nSecond line: integer for target",
    outputFormat: "Two space-separated integers representing the indices",
    sampleTestCases: [{ input: "2 7 11 15\n9", output: "0 1" }]
  },
  {
    id: 2,
    title: "Addition of Two Numbers",
    description: "Given two integers A and B, print their sum.\n\nCONSTRAINTS:\n-10^9 ≤ A, B ≤ 10^9\n\nEXAMPLES:\nInput:\n2 3\nOutput:\n5\n\nInput:\n10 20\nOutput:\n30\n\nInput:\n-5 5\nOutput:\n0",
    inputFormat: "Two integers A and B separated by space.",
    outputFormat: "Print a single integer (A + B)",
    sampleTestCases: [{ input: "2 3", output: "5" }]
  }
];

const questionTestCases = {
  1: [
    { input: "2 7 11 15\n9", output: "0 1" },
    { input: "3 2 4\n6", output: "1 2" },
    { input: "3 3\n6", output: "0 1" }
  ],
  2: [
    { input: "2 3", output: "5" },
    { input: "10 20", output: "30" },
    { input: "-5 5", output: "0" },
    { input: "100 200", output: "300" }
  ]
};

// Helper to normalize strings for comparison natively bounding spaces
const normalize = (str) =>
  str ? str.toString().trim().replace(/\r/g, "").replace(/\s+/g, " ") : "";

// /api/run
const runCommandWithInput = (cmd, input, timeout = 5000) => {
  return new Promise((resolve) => {
    const child = exec(cmd, { timeout }, (err, stdout, stderr) => {
      resolve({ err, stdout, stderr });
    });
    if (input !== undefined && input !== null) {
      child.stdin.write(String(input));
    }
    child.stdin.end();
  });
};

exports.runCode = async (req, res) => {
  const { code, language, input } = req.body;
  const fileId = Date.now() + "_" + Math.floor(Math.random() * 10000);
  const tempDir = os.tmpdir();

  try {
    if (language === "c") {
      const file = path.join(tempDir, `temp_${fileId}.c`);
      const exe = path.join(tempDir, `temp_${fileId}.exe`);
      fs.writeFileSync(file, code);

      exec(`gcc "${file}" -o "${exe}"`, { timeout: 10000 }, async (err, stdout, stderr) => {
        if (err) {
          try { fs.unlinkSync(file); } catch (e) {}
          return res.json({ success: false, output: stderr || err.message || "Compilation Error" });
        }
        const result = await runCommandWithInput(`"${exe}"`, input, 5000);
        try { fs.unlinkSync(file); fs.unlinkSync(exe); } catch (e) {}
        if (result.err) return res.json({ success: false, output: result.stderr || result.err.message || "Runtime Error" });
        return res.json({ success: true, output: String(result.stdout).trim() });
      });
    }

    else if (language === "cpp") {
      const file = path.join(tempDir, `temp_${fileId}.cpp`);
      const exe = path.join(tempDir, `temp_${fileId}.exe`);
      fs.writeFileSync(file, code);

      exec(`g++ -std=c++17 "${file}" -o "${exe}"`, { timeout: 10000 }, async (err, stdout, stderr) => {
        if (err) {
          try { fs.unlinkSync(file); } catch (e) {}
          return res.json({ success: false, output: stderr || err.message || "Compilation Error" });
        }
        const result = await runCommandWithInput(`"${exe}"`, input, 5000);
        try { fs.unlinkSync(file); fs.unlinkSync(exe); } catch (e) {}
        if (result.err) return res.json({ success: false, output: result.stderr || result.err.message || "Runtime Error" });
        return res.json({ success: true, output: String(result.stdout).trim() });
      });
    }

    else if (language === "python" || language === "python3") {
      const file = path.join(tempDir, `temp_${fileId}.py`);
      fs.writeFileSync(file, code);

      const result = await runCommandWithInput(`python "${file}"`, input, 5000);
      try { fs.unlinkSync(file); } catch (e) {}
      if (result.err) return res.json({ success: false, output: result.stderr || result.err.message || "Runtime Error" });
      return res.json({ success: true, output: String(result.stdout).trim() });
    }
    
    else if (language === "javascript" || language === "js") {
      const file = path.join(tempDir, `temp_${fileId}.js`);
      fs.writeFileSync(file, code);

      const result = await runCommandWithInput(`node "${file}"`, input, 5000);
      try { fs.unlinkSync(file); } catch (e) {}
      if (result.err) return res.json({ success: false, output: result.stderr || result.err.message || "Runtime Error" });
      return res.json({ success: true, output: String(result.stdout).trim() });
    }

    else if (language === "java") {
      const file = path.join(tempDir, `Main.java`);
      fs.writeFileSync(file, code);

      exec(`javac "${file}"`, { timeout: 10000 }, async (err, stdout, stderr) => {
        if (err) {
          try { fs.unlinkSync(file); } catch (e) {}
          return res.json({ success: false, output: stderr || err.message || "Compilation Error" });
        }
        const result = await runCommandWithInput(`java -cp "${tempDir}" Main`, input, 7000);
        try { fs.unlinkSync(file); fs.unlinkSync(path.join(tempDir, "Main.class")); } catch (e) {}
        if (result.err) return res.json({ success: false, output: result.stderr || result.err.message || "Runtime Error" });
        return res.json({ success: true, output: String(result.stdout).trim() });
      });
    }
    
    else {
      return res.json({ success: false, output: `Unsupported language: ${language}` });
    }
  } catch (error) {
    console.error("Execute Run Error:", error);
    return res.json({ success: false, output: "Execution Failed" });
  }
};

// /api/submit
exports.submitCode = async (req, res) => {
  const { code, language, problemId } = req.body;
  const fileId = Date.now() + "_" + Math.floor(Math.random() * 10000);
  const tempDir = os.tmpdir();

  const testCases = questionTestCases[problemId || 1] || questionTestCases[1];
  let passedCount = 0;
  const testResults = [];

  try {
    if (language === "c") {
      const file = path.join(tempDir, `temp_${fileId}.c`);
      const exe = path.join(tempDir, `temp_${fileId}.exe`);
      fs.writeFileSync(file, code);

      exec(`gcc "${file}" -o "${exe}"`, { timeout: 10000 }, async (err, stdout, stderr) => {
        if (err) {
          try { fs.unlinkSync(file); } catch(e){}
          return res.json({ success: true, correct: false, passed: 0, total: testCases.length, error: stderr || err.message, testCases: testResults });
        }

        for (let i = 0; i < testCases.length; i++) {
          const tc = testCases[i];
          try {
            const result = await runCommandWithInput(`"${exe}"`, tc.input, 5000);
            if (result.err) result.output = result.stderr || result.err.message;
            else result.output = result.stdout;
            console.log("Expected:", tc.output);
            console.log("Got:", result.output);

            const isPassed = result.output && normalize(result.output) === normalize(tc.output);
            if (isPassed) passedCount++;
            
            testResults.push({
              input: tc.input,
              output: String(result.output || "").trim() || "No Output",
              expected: tc.output,
              passed: !!isPassed
            });
          } catch(e){}
        }

        try { fs.unlinkSync(file); } catch(e){}
        try { fs.unlinkSync(exe); } catch(e){}

        return res.json({ success: true, correct: passedCount === testCases.length, passed: passedCount, total: testCases.length, testCases: testResults });
      });
    }

    else if (language === "cpp") {
      const file = path.join(tempDir, `temp_${fileId}.cpp`);
      const exe = path.join(tempDir, `temp_${fileId}.exe`);
      fs.writeFileSync(file, code);

      exec(`g++ -std=c++17 "${file}" -o "${exe}"`, { timeout: 10000 }, async (err, stdout, stderr) => {
        if (err) {
          try { fs.unlinkSync(file); } catch(e){}
          return res.json({ success: true, correct: false, passed: 0, total: testCases.length, error: stderr || err.message, testCases: testResults });
        }

        for (let i = 0; i < testCases.length; i++) {
          const tc = testCases[i];
          try {
            const result = await runCommandWithInput(`"${exe}"`, tc.input, 5000);
            if (result.err) result.output = result.stderr || result.err.message;
            else result.output = result.stdout;
            console.log("Expected:", tc.output);
            console.log("Got:", result.output);

            const isPassed = result.output && normalize(result.output) === normalize(tc.output);
            if (isPassed) passedCount++;
            
            testResults.push({
              input: tc.input,
              output: String(result.output || "").trim() || "No Output",
              expected: tc.output,
              passed: !!isPassed
            });
          } catch(e){}
        }

        try { fs.unlinkSync(file); } catch(e){}
        try { fs.unlinkSync(exe); } catch(e){}

        return res.json({ success: true, correct: passedCount === testCases.length, passed: passedCount, total: testCases.length, testCases: testResults });
      });
    } 
    
    else if (language === "python" || language === "python3") {
      const file = path.join(tempDir, `temp_${fileId}.py`);
      fs.writeFileSync(file, code);

      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        try {
          const result = await runCommandWithInput(`python "${file}"`, tc.input, 5000);
          if (result.err) result.output = result.stderr || result.err.message;
          else result.output = result.stdout;
          console.log("Expected:", tc.output);
          console.log("Got:", result.output);

          const isPassed = result.output && normalize(result.output) === normalize(tc.output);
          if (isPassed) passedCount++;
          
          testResults.push({
            input: tc.input,
            output: String(result.output || "").trim() || "No Output",
            expected: tc.output,
            passed: !!isPassed
          });
        } catch(e){}
      }

      try { fs.unlinkSync(file); } catch(e){}
      return res.json({ success: true, correct: passedCount === testCases.length, passed: passedCount, total: testCases.length, testCases: testResults });
    }

    else if (language === "javascript" || language === "js") {
      const file = path.join(tempDir, `temp_${fileId}.js`);
      fs.writeFileSync(file, code);

      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        try {
          const result = await runCommandWithInput(`node "${file}"`, tc.input, 5000);
          if (result.err) result.output = result.stderr || result.err.message;
          else result.output = result.stdout;
          console.log("Expected:", tc.output);
          console.log("Got:", result.output);

          const isPassed = result.output && normalize(result.output) === normalize(tc.output);
          if (isPassed) passedCount++;
          
          testResults.push({
            input: tc.input,
            output: String(result.output || "").trim() || "No Output",
            expected: tc.output,
            passed: !!isPassed
          });
        } catch(e){}
      }

      try { fs.unlinkSync(file); } catch(e){}
      return res.json({ success: true, correct: passedCount === testCases.length, passed: passedCount, total: testCases.length, testCases: testResults });
    }

    else if (language === "java") {
      const uniqueDir = path.join(tempDir, `java_${fileId}`);
      fs.mkdirSync(uniqueDir, { recursive: true });
      const file = path.join(uniqueDir, `Main.java`);
      fs.writeFileSync(file, code.replace(/public\s+class\s+\w+/g, `public class Main`));

      exec(`javac "${file}"`, { timeout: 10000 }, async (err, stdout, stderr) => {
        if (err) {
          try { fs.rmSync(uniqueDir, { recursive: true, force: true }); } catch(e){}
          return res.json({ success: true, correct: false, passed: 0, total: testCases.length, error: stderr || err.message, testCases: testResults });
        }

        for (let i = 0; i < testCases.length; i++) {
          const tc = testCases[i];
          try {
            const result = await runCommandWithInput(`java -cp "${uniqueDir}" Main`, tc.input, 5000);
            if (result.err) result.output = result.stderr || result.err.message;
            else result.output = result.stdout;
            console.log("Expected:", tc.output);
            console.log("Got:", result.output);

            const isPassed = result.output && normalize(result.output) === normalize(tc.output);
            if (isPassed) passedCount++;
            
            testResults.push({
              input: tc.input,
              output: String(result.output || "").trim() || "No Output",
              expected: tc.output,
              passed: !!isPassed
            });
          } catch(e){}
        }

        try { fs.rmSync(uniqueDir, { recursive: true, force: true }); } catch(e){}
        return res.json({ success: true, correct: passedCount === testCases.length, passed: passedCount, total: testCases.length, testCases: testResults });
      });
    }
    
    else {
      return res.json({ success: true, correct: false, passed: 0, total: testCases.length, error: `Unsupported language: ${language}`, testCases: [] });
    }
  } catch (err) {
    console.error("Execute Submit Error:", err);
    return res.json({ success: true, correct: false, passed: 0, total: testCases.length, testCases: [] });
  }
};
