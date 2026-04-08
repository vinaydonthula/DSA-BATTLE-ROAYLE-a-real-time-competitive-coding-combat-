const sequelize = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { ADMIN_JWT_SECRET, EXPIRES_IN } = require("../config/jwt");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [[admin]] = await sequelize.query(
      `SELECT * FROM admins WHERE email = ?`,
      { replacements: [email] }
    );

    console.log(admin);

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        role: admin.role,
        email: admin.email,
      },
      ADMIN_JWT_SECRET,
      { expiresIn: EXPIRES_IN }
    );

    res.json({
      token,
      role: admin.role,
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getProblems = async (req, res) => {
  try {
    const [problems] = await sequelize.query(`
      SELECT 
        p.id,
        p.title,
        p.description,
        p.input_format AS inputFormat,
        p.output_format AS outputFormat,
        p.constraints,
        p.difficulty,
        p.time_limit_ms AS timeLimitMs,
        p.memory_limit_mb AS memoryLimitMb,
        p.created_at
      FROM problems p
      ORDER BY p.created_at DESC
    `);

    for (const problem of problems) {
      const [sampleTestCases] = await sequelize.query(
        `SELECT input_data AS input, expected_output AS output, explanation
         FROM sample_test_cases WHERE problem_id = ?`,
        { replacements: [problem.id] }
      );
      problem.sampleTestCases = sampleTestCases;

      const [testCases] = await sequelize.query(
        `SELECT input_data AS input, expected_output AS output
         FROM test_cases WHERE problem_id = ?`,
        { replacements: [problem.id] }
      );
      problem.testCases = testCases;
    }

    res.json(problems);
  } catch (err) {
    console.error("Get problems error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createProblem = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      title,
      description,
      inputFormat,
      outputFormat,
      constraints,
      difficulty,
      timeLimitMs,
      memoryLimitMb,
      sampleTestCases,
      testCases,
    } = req.body;

    const [result] = await sequelize.query(
      `INSERT INTO problems 
        (title, description, input_format, output_format, constraints, difficulty, time_limit_ms, memory_limit_mb, created_by_admin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          title,
          description,
          inputFormat || null,
          outputFormat || null,
          constraints || null,
          difficulty,
          timeLimitMs || 1000,
          memoryLimitMb || 256,
          req.admin.id,
        ],
        transaction: t,
      }
    );

    const problemId = result.insertId;

    if (sampleTestCases && sampleTestCases.length > 0) {
      for (const tc of sampleTestCases) {
        await sequelize.query(
          `INSERT INTO sample_test_cases (problem_id, input_data, expected_output, explanation)
           VALUES (?, ?, ?, ?)`,
          {
            replacements: [problemId, tc.input, tc.output, tc.explanation || null],
            transaction: t,
          }
        );
      }
    }

    if (testCases && testCases.length > 0) {
      for (const tc of testCases) {
        await sequelize.query(
          `INSERT INTO test_cases (problem_id, input_data, expected_output)
           VALUES (?, ?, ?)`,
          {
            replacements: [problemId, tc.input, tc.output],
            transaction: t,
          }
        );
      }
    }

    await t.commit();
    res.json({ id: problemId, message: "Problem created successfully" });
  } catch (err) {
    await t.rollback();
    console.error("Create problem error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateProblem = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      title,
      description,
      inputFormat,
      outputFormat,
      constraints,
      difficulty,
      timeLimitMs,
      memoryLimitMb,
      sampleTestCases,
      testCases,
    } = req.body;

    await sequelize.query(
      `UPDATE problems SET 
        title = ?, description = ?, input_format = ?, output_format = ?, 
        constraints = ?, difficulty = ?, time_limit_ms = ?, memory_limit_mb = ?
       WHERE id = ?`,
      {
        replacements: [
          title,
          description,
          inputFormat || null,
          outputFormat || null,
          constraints || null,
          difficulty,
          timeLimitMs || 1000,
          memoryLimitMb || 256,
          id,
        ],
        transaction: t,
      }
    );

    await sequelize.query(`DELETE FROM sample_test_cases WHERE problem_id = ?`, {
      replacements: [id],
      transaction: t,
    });

    await sequelize.query(`DELETE FROM test_cases WHERE problem_id = ?`, {
      replacements: [id],
      transaction: t,
    });

    if (sampleTestCases && sampleTestCases.length > 0) {
      for (const tc of sampleTestCases) {
        await sequelize.query(
          `INSERT INTO sample_test_cases (problem_id, input_data, expected_output, explanation)
           VALUES (?, ?, ?, ?)`,
          {
            replacements: [id, tc.input, tc.output, tc.explanation || null],
            transaction: t,
          }
        );
      }
    }

    if (testCases && testCases.length > 0) {
      for (const tc of testCases) {
        await sequelize.query(
          `INSERT INTO test_cases (problem_id, input_data, expected_output)
           VALUES (?, ?, ?)`,
          {
            replacements: [id, tc.input, tc.output],
            transaction: t,
          }
        );
      }
    }

    await t.commit();
    res.json({ message: "Problem updated successfully" });
  } catch (err) {
    await t.rollback();
    console.error("Update problem error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteProblem = async (req, res) => {
  try {
    const { id } = req.params;

    await sequelize.query(`DELETE FROM problems WHERE id = ?`, {
      replacements: [id],
    });

    res.json({ message: "Problem deleted successfully" });
  } catch (err) {
    console.error("Delete problem error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
