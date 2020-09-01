import fs from "fs";
import child_process from "child_process";
import os from "os";
import path from "path";
import tar from "tar";
import fetch from "node-fetch";

function yarnLockGitSha(cwd: string) {
  return child_process
    .execSync("git hash-object yarn.lock", {
      cwd,
      encoding: "ascii",
    })
    .trim();
}

function untarDependencyFiles(
  stream: NodeJS.ReadableStream,
  dir: string
): Promise<void> {
  const tarStream = stream.pipe(
    tar.extract({
      strip: 1,
      filter: (path) => path.includes("package.json") || path.includes("yarn"),
      cwd: dir,
    })
  );
  return new Promise((resolve, reject) => {
    tarStream.once("end", resolve);
    tarStream.once("error", reject);
  });
}

function yarnRelock(cwd: string): Promise<void> {
  const proc = child_process.exec("yarn relock", {
    cwd,
  });
  proc.stdout?.pipe(process.stdout);
  proc.stderr?.pipe(process.stderr);

  return new Promise((resolve, reject) => {
    proc.once("exit", (code, signal) => {
      code ? reject(code) : resolve();
      signal ? reject(signal) : resolve();
    });
  });
}

export async function updateYarnLock(owner: string, repo: string, ref: string) {
  const tmp = `${os.tmpdir()}${path.sep}${ref}`;
  await fs.promises.mkdir(tmp, { recursive: true });
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/tarball/${ref}`
  );
  await untarDependencyFiles(res.body, tmp);
  const sha = yarnLockGitSha(tmp);
  try {
    await yarnRelock(tmp);
  } catch (e) {
    console.error("yarn relock error:", e);
  }
  const newSha = yarnLockGitSha(tmp);

  return {
    sha,
    content:
      newSha === sha
        ? null // unchanged
        : fs.readFileSync(path.join(tmp, "yarn.lock")).toString("base64"),
  };
}
