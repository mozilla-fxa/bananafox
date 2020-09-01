import fs from 'fs'
import child_process from 'child_process'
import crypto from 'crypto'
import os from 'os'
import path from 'path'
import { Writable, pipeline } from 'stream';
import { promisify } from 'util'
import tar from 'tar';
import fetch from 'node-fetch'

const asyncPipeline = promisify(pipeline)

export async function updateYarnLock(owner: string, repo: string, ref: string) {
  const tmp = `${os.tmpdir()}${path.sep}${ref}`
  await fs.promises.mkdir(tmp, { recursive: true })
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/tarball/${ref}`)
  const tarStream = res.body.pipe(
    tar.extract({
      strip: 1,
      filter: (path) => (path.includes('package.json') || path.includes('yarn')),
      cwd: tmp
  }))
  await new Promise((resolve, reject) => {
    tarStream.once('end', resolve)
    tarStream.once('error', reject)
  })

  const sha = child_process.execSync('git hash-object yarn.lock', {
    cwd: tmp,
    encoding: 'ascii'
  })
  // TODO use the yarn api? and not download the world
  const proc = child_process.exec('yarn install --silent', {
    cwd: tmp
  })

  // proc.stderr?.pipe(process.stderr)

  await new Promise((resolve, reject) => {
    // actually, we expect it to fail for now
    // proc.once('exit', (code) => code ? reject(code) : resolve())
    proc.once('exit', (code) => {
      console.log('exit', code)
      resolve()
    })
  })
  const newLock = fs.readFileSync(path.join(tmp, 'yarn.lock'))

  return {
    sha,
    // content: ''
    content: newLock.toString('base64')
  }
}