import probot, { Application } from 'probot'
const { Probot } = probot

Probot.run((app: Application) => {
  app.on('pull_request.opened', async (context) => {
    context.github.issues.createComment(context.issue({body: 'hello, all!'}))
    if (context.payload.pull_request.user.login === 'dependabot') {
      // get the code
      // run yarn install
      // commit the yarn.lock
      // const res = await context.github.repos.getArchiveLink({ owner: 'mozilla', repo: 'fxa', ref: context.payload.pull_request.head.ref, archive_format: 'tarball'})
      // const tarball = res.data;
    }
    // const issueComment = context.issue({ body: 'Thanks for opening this issue!' })
    // await context.github.issues.createComment(issueComment)
  })
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
})