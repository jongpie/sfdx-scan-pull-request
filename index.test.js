const pullRequestScan = require("./index.js");

jest.mock("@actions/github", () => ({
  __esModule: true,
  context: {
    payload: {
      pull_request: { base: { ref: "main" }, head: { ref: "not-main" } },
    },
  },
}));

jest.mock("child_process", () => {
  return {
    execSync: () => {
      console.log("zzzz");
      return "This is a test message";
    },
  };
});

describe("Pull Request Scan Tests", () => {
  it("validates pull request context?", () => {
    // console.log({ pullRequestScan });
    expect(pullRequestScan).toBeTruthy();
    // pullRequestScan.validatePullRequestContext();
  });
});
