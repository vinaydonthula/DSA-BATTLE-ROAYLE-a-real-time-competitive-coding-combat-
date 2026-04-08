const submissionService = require("../submission.service");

async function judgeSubmission({ code, language, testCases }) {
  // Use the submission service which supports all languages
  const result = await submissionService.runJudge({ code, language, testCases });
  return result;
}

module.exports = judgeSubmission;
