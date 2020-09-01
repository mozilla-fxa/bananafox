import type Webhooks from "@octokit/webhooks";
import probot, { Application } from "probot";
const { Probot } = probot;
import { updateYarnLock } from "./yarn.js";

export const bot = (app: Application) => {
  const prHook = async (
    context: probot.Context<Webhooks.WebhookPayloadPullRequest>
  ) => {
    if (context.payload.sender.login === 'fxa-bananafox[bot]') {
      return
    }
    const pr = context.payload.pull_request;
    const owner = pr.head.repo.owner.login;
    const repo = pr.head.repo.name;

    const { sha, content } = await updateYarnLock(owner, repo, pr.head.sha);
    if (content) {
      const updateInfo = {
        owner,
        repo,
        path: "yarn.lock",
        message: "chore(deps): updated yarn.lock",
        content,
        sha,
        branch: pr.head.ref,
      };
      app.log({
        ...updateInfo,
        content: updateInfo.content.length,
        message: undefined,
      });
      await context.github.repos.createOrUpdateFile(updateInfo);
      context.github.issues.createComment(
        context.issue({
          body: `I got u ${context.payload.sender.login}. 💯`,
        })
      );
    } else if (pr.user.login.includes("dependabot")) {
      context.github.issues.createComment(
        context.issue({
          body: `I couldn't update the \`yarn.lock\`. 🍌`,
        })
      );
    }
  };
  app.on("pull_request.opened", prHook);
  app.on("pull_request.synchronize", prHook);
};

if (import.meta.url.includes(process.argv[1])) {
  Probot.run(bot);
}
