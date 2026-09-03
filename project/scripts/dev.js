// Runs the API server and the Vite dev server together with one command.
import { spawn } from 'node:child_process'

const targets = [
  { name: 'api', command: 'npm', args: ['run', 'server'] },
  { name: 'web', command: 'npm', args: ['run', 'dev'] },
]

const children = targets.map(({ name, command, args }) => {
  const child = spawn(command, args, { stdio: ['inherit', 'pipe', 'pipe'], shell: true })
  const prefix = (buf) =>
    buf
      .toString()
      .split('\n')
      .filter(Boolean)
      .map((line) => `[${name}] ${line}`)
      .join('\n')
  child.stdout.on('data', (d) => console.log(prefix(d)))
  child.stderr.on('data', (d) => console.error(prefix(d)))
  child.on('exit', (code) => {
    console.log(`[${name}] exited (${code})`)
    shutdown()
  })
  return child
})

let shuttingDown = false
function shutdown() {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of children) {
    if (!child.killed) child.kill()
  }
  process.exit()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
