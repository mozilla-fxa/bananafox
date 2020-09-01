// import child_process from 'child_process';
import probot, { Application } from 'probot'
const { Probot } = probot
import { updateYarnLock } from './yarn.js'

export const bot = (app: Application) => {
  app.on('pull_request.opened', async (context) => {
    const pr = context.payload.pull_request
    const owner = pr.head.repo.owner.login
    const repo = pr.head.repo.name
    context.github.issues.createComment(context.issue({body: 'hello, all!'}))
    // if (pr.user.login === 'dependabot') {
    const { sha, content } = await updateYarnLock(owner, repo, pr.head.sha)
    const updateInfo = {
      owner,
      repo,
      path: 'yarn.lock',
      message: 'chore(deps): updated yarn.lock',
      content,
      sha,
      branch: pr.head.ref
    }
    app.log({...updateInfo, content: updateInfo.content.length})
    await context.github.repos.createOrUpdateFile(updateInfo)
  })
}

if (import.meta.url.includes(process.argv[1])) {
  Probot.run(bot)
}