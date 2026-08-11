import { copyFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'prisma', 'schema.prisma')

for (const target of ['client/prisma', 'server/prisma']) {
  const dir = join(root, target)
  mkdirSync(dir, { recursive: true })
  copyFileSync(source, join(dir, 'schema.prisma'))
  console.log(`Synced Prisma schema -> ${target}/schema.prisma`)
}
