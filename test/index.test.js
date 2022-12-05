const { main } = require("../index.js");
const github = require("@actions/github");
const core = require("@actions/core");
const fs = require("fs");
const process = require("process");

const DIFF_OUTPUT = "../diffBetweenCurrentAndParentBranch.txt";

jest.mock("@actions/github", () => ({
  __esModule: true,
  context: {
    payload: {
      pull_request: {
        base: {
          ref: "main",
          repo: {
            fork: false,
            git_url: "https://github.com/some-person/some-repo",
          },
        },
        head: {
          ref: "not-main",
          repo: {
            fork: false,
            git_url: "https://github.com/some-person/some-repo",
          },
        },
      },
    },
  },
}));

jest.mock("@octokit/action", () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    request: jest.fn().mockReturnValueOnce("one").mockReturnValueOnce("two"),
  })),
}));

jest.mock("child_process", () => {
  return {
    execSync: command => {
      console.log("running execSync: ", { command });
      return "TODO";
    },
  };
});

jest.spyOn(process, "exit").mockImplementation(number => {
  expect(number).toBe(undefined);
});

jest.spyOn(core, "setFailed").mockImplementation(message => {
  expect(message).toBeTruthy();
});

describe("Pull Request Scan Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws an exception when there is no pull_request", async () => {
    github.context = { ...github.context };
    expect(github.context.payload.pull_request).toBeTruthy();
    delete github.context.payload.pull_request;
    expect(github.context.payload.pull_request).toBe(undefined);
    // jest.spyOn(process, "exit").mockImplementation(number => {
    //   expect(number).toBe(undefined);
    // });
    // jest.spyOn(core, "setFailed").mockImplementation(message => {});

    main();

    expect(core.setFailed).toBeCalledWith(
      "This action is only applicable when invoked in the context of a pull request."
    );
    expect(process.exit).toHaveBeenCalledTimes(1);
  });

  it("runs action for a branch in the same repo", async () => {
    github.context = { ...github.context };
    expect(github.context.payload.pull_request.base.repo.git_url).toBe(
      github.context.payload.pull_request.head.repo.git_url
    );

    // expect(pullRequestScan).toBeTruthy();
    main();
  });

  it("runs action for a branch in a forked repo", () => {
    github.context = { ...github.context };
    github.context.payload.pull_request.head.repo.forked = true;
    github.context.payload.pull_request.head.repo.git_url =
      "https://github.com/some-different-person/some-forked-repo/";
    expect(github.context.payload.pull_request.base.repo.git_url).not.toBe(
      github.context.payload.pull_request.head.repo.git_url
    );

    main();

    let fsError;
    try {
      fs.readFileSync("../diffBetweenCurrentAndParentBranch.txt");
      throw new Error("error expected");
    } catch (error) {
      fsError = error;
    }
    expect(fsError.message).toBe(
      `ENOENT: no such file or directory, open '${DIFF_OUTPUT}'`
    );
  });
});
