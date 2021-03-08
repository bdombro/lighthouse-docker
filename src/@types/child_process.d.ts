// spawn error types are incomplete. This is the full type
export interface SpawnError extends Error {
  "errno": number // ex -2
  "code": string // ex "ENOENT"
  "syscall": string // ex "spawn kill"
  "path": string // ex "kill"
  "spawnargs": string[] // i.e. ["27"] where 27 is PID for kill command
}