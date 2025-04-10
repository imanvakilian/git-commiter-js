// step 1: clone the project into ~/
// step 2: add this command to your .zshrc: alias fastCommit='node ~/git-commiter/main.js'
// step 3: then run this command < source .zshrc > or close and open your terminal

const prompts = require("prompts");
const { spawnSync } = require("child_process");

class Main {
    constructor() {
        this.codeRunner()
            .then((data) => console.log("Have a nice time :)"))
            .catch((err) => console.log("err => ", err));
    }

    async codeRunner() {
        const pullFromBranch = await this.getPullFromBranch();
        const currentBranch = this.getCurrentBranch();
        this.pullFromRemote(pullFromBranch, currentBranch);
        await this.commit();
        this.commandRunner("git", ["push"]);
    }

    commandRunner(command, options = []) {
        const result = spawnSync(command, options);

        if (result.status !== 0) {
            console.log("operation failed");
            throw "operation failed";
        }

        return result;
    }

    async promptsRunner(promptList = []) {
        const response = await prompts.prompt(promptList, {
            onCancel: this.onCancel,
        });
        // const response = await prompts.prompt(promptList);
        return response;
    }

    onCancel() {
        console.log("🚫 Operation cancelled by user.");
        process.exit(1);
    }

    async getPullFromBranch() {
        const { pullFrom } = await this.promptsRunner([
            {
                type: "text",
                name: "pullFrom",
                message: "Which branch do you want pull?",
                initial: "main",
            },
        ]);

        this.commandRunner("git", [
            "ls-remote",
            "--exit-code",
            "--heads",
            "origin",
            pullFrom,
        ]);

        return pullFrom;
    }

    getCurrentBranch() {
        const currentBranch = this.commandRunner("git", [
            "branch",
            "--show-current",
        ])
            .stdout.toString()
            .trim();

        return currentBranch;
    }

    pullFromRemote(remoteBranch, currentBranch) {
        this.commandRunner("git", ["add", "."]);
        console.log("stage all changes");

        this.commandRunner("git", ["stash"]);
        console.log("stash all changes");

        this.commandRunner("git", ["checkout", remoteBranch]);
        console.log("checkout to", remoteBranch);

        this.commandRunner("git", ["pull"]);
        console.log("pull from remote");

        this.commandRunner("git", ["checkout", currentBranch]);
        console.log("checkout to", currentBranch);

        this.commandRunner("git", ["merge", remoteBranch]);
        console.log(`merge ${remoteBranch} into ${currentBranch}`);

        this.commandRunner("git", ["stash", "pop"]);
        console.log("pop stash");

        this.commandRunner("git", ["add", "."]);
        console.log("stage all changes");
    }

    async commit() {
        const { commitType, commitScope, commitMessage } =
            await this.promptsRunner([
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

        const username = this.getGitUsername();

        const commitStructure = `(${username}) ${commitType} (${commitScope}): ${commitMessage}`;
        console.log(commitStructure);

        this.commandRunner("git", ["commit", "-m", commitStructure]);
    }

    getGitUsername() {
        const username = this.commandRunner("git", ["config", "user.name"])
            .stdout.toString()
            .trim();

        return username;
    }
}

new Main();
