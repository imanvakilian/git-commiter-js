const prompts = require("prompts");
const { spawnSync } = require("child_process");

const onCancel = () => {
    console.log("🚫 Operation cancelled by user.");
    process.exit(1);
};

async function pullFromFunc() {
    const response = await prompts.prompt(
        [
            {
                type: "text",
                name: "pullFrom",
                message: "Which branch do you want pull?",
                initial: "main",
            },
        ]
        // { oncancel: oncancel }
    );

    const checkExistsPullFromBranch = spawnSync("git", [
        "ls-remote",
        "--exit-code",
        "--heads",
        "origin",
        response.pullFrom,
    ]);

    if (checkExistsPullFromBranch.status != 0) {
        throw `${response.pullFrom} branch doesn't exist to pull from`;
    }

    return response.pullFrom;
}

function getCurrentBranch() {
    const currentBranch = spawnSync("git", ["branch", "--show-current"])
        .stdout.toString()
        .trim();
    console.log("currentBranch: ", currentBranch);
    return currentBranch;
}

function pullFromRemote(remoteBranch, currentBranch) {
    spawnSync("git", ["add", "."]);
    console.log("stage all changes");

    spawnSync("git", ["stash"]);
    console.log("stash all changes");

    spawnSync("git", ["checkout", remoteBranch]);
    console.log("checkout to", remoteBranch);

    spawnSync("git", ["pull"]);
    console.log("pull from remote");

    spawnSync("git", ["checkout", currentBranch]);
    console.log("checkout to", currentBranch);

    spawnSync("git", ["merge", remoteBranch]);
    console.log(`merge ${remoteBranch} into ${currentBranch}`);

    spawnSync("git", ["stash", "apply"]);
    console.log("apply stash");

    spawnSync("git", ["add", "."]);
    console.log("stage all changes");
}

async function commit() {
    const response = await prompts.prompt([
        {
            type: "select",
            name: "commitType",
            message: "Select your commit type:",
            choices: [
                { title: "Feat", value: "feat" },
                { title: "Ref", value: "ref" },
                { title: "Fix", value: "fix" },
                { title: "Chore", value: "chore" },
                { title: "Docs", value: "docs" },
                { title: "Style", value: "style" },
            ],
        },
        {
            type: "text",
            name: "commitScope",
            message: "Write changes scope: ",
        },
        {
            type: "text",
            name: "commitMessage",
            message: "Write commit message: ",
        },
    ]);

    const { commitType, commitScope, commitMessage } = response;

    const username = spawnSync("git", ["config", "user.name"])
        .stdout.toString()
        .trim();

    commitStructure = `(${username}) ${commitType} (${commitScope}): ${commitMessage}`;
    console.log(commitStructure);

    spawnSync("git", ["commit", "-m", commitStructure]);
}

(async () => {
    try {
        const pullFrom = await pullFromFunc();
        const currentBranch = getCurrentBranch();
        pullFromRemote(pullFrom, currentBranch);
        await commit();
        spawnSync("git", ["push"]);
    } catch (error) {
        console.log(error);
    }
})();
