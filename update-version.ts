import { execSync } from 'child_process'
import { existsSync } from 'fs'
import * as fs from 'fs/promises'
import * as path from 'path'

async function main() {
  if (process.argv.length !== 3) {
    console.error('Expected one argument: <version>')
    process.exit(1)
  }

  const newVersion = process.argv[2]

  if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(newVersion)) {
    console.error('Version format should be X.Y.Z or X.Y.Z-prerelease')
    process.exit(1)
  }

  await updatePackageVersion(newVersion)
  await updateLockfileVersion(newVersion)
  await tagDocumentation(newVersion)
}

// package.json contains a UTF-8 BOM; strip it before parsing and don't
// write it back.
async function readJson(filePath: string): Promise<any> {
  const contents = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(contents.replace(/^\uFEFF/, ''))
}

async function writeJson(filePath: string, data: any) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n')
}

async function updatePackageVersion(newVersion: string) {
  const filePath = path.join(__dirname, 'package.json')
  const pkg = await readJson(filePath)
  pkg.version = newVersion
  await writeJson(filePath, pkg)
  console.log(`package.json updated to ${newVersion}`)
}

async function updateLockfileVersion(newVersion: string) {
  const filePath = path.join(__dirname, 'package-lock.json')
  if (!existsSync(filePath)) {
    console.log('package-lock.json not found, skipping')
    return
  }

  const lock = await readJson(filePath)
  lock.version = newVersion
  if (lock.packages && lock.packages['']) {
    lock.packages[''].version = newVersion
  }
  await writeJson(filePath, lock)
  console.log(`package-lock.json updated to ${newVersion}`)
}

async function tagDocumentation(version: string) {
  const websitePath = path.join(__dirname, 'website')

  // Skip docs versioning when the website dependencies are not installed
  // (docusaurus CLI is unavailable).
  if (!existsSync(path.join(websitePath, 'node_modules'))) {
    console.log('website/node_modules not found, skipping docs versioning')
    return
  }

  const versionedDocsPath = path.join(
    websitePath,
    'versioned_docs',
    `version-v${version}`,
  )

  if (existsSync(versionedDocsPath)) {
    console.log('Documentation already tagged')
    return
  }

  execSync(`npm run docusaurus docs:version v${version}`, {
    cwd: websitePath,
    stdio: 'inherit',
  })

  console.log('Documentation tagged')
}

main()
