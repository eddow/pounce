/**
 * Test script to verify JSX types are properly configured
 * This validates that TypeScript can resolve JSX types from @pounce/core
 */

import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const rootDir = resolve(__dirname, '../..')

interface TestResult {
  package: string
  success: boolean
  errors: string[]
}

/**
 * Run TypeScript check on a package and capture JSX-related errors
 */
function testPackage(packageName: string): TestResult {
  const packagePath = resolve(rootDir, 'packages', packageName)
  const result: TestResult = { package: packageName, success: true, errors: [] }

  try {
    // Run TypeScript with noEmit to check for type errors
    const output = execSync('npx tsc --noEmit 2>&1', {
      cwd: packagePath,
      encoding: 'utf-8',
      stdio: 'pipe'
    })
    
    // If we get here, no errors (exit code 0)
    console.log(`✅ ${packageName}: No TypeScript errors`)
  } catch (error: any) {
    // TypeScript returned errors
    const output = error.stdout || error.message || ''
    
    // Filter for JSX-related errors
    const jsxErrors = output
      .split('\n')
      .filter((line: string) => {
        const lower = line.toLowerCase()
        return lower.includes('jsx') || 
               lower.includes('react') ||
               lower.includes('intrinsicelements') ||
               lower.includes('h\"') ||
               lower.includes('fragment')
      })
      .filter((line: string) => line.trim())
    
    if (jsxErrors.length > 0) {
      result.success = false
      result.errors = jsxErrors
      console.log(`❌ ${packageName}: Found ${jsxErrors.length} JSX-related error(s)`)
    } else {
      console.log(`✅ ${packageName}: No JSX errors (has other TypeScript errors)`)
    }
  }

  return result
}

/**
 * Main test runner
 */
function main() {
  console.log('Testing JSX types resolution in Pounce packages...\n')
  
  const packages = ['core', 'ui', 'kit', 'board']
  const results: TestResult[] = []
  
  for (const pkg of packages) {
    results.push(testPackage(pkg))
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('Summary:')
  console.log('='.repeat(50))
  
  const failures = results.filter(r => !r.success)
  
  if (failures.length === 0) {
    console.log('✅ All packages have working JSX types!')
    process.exit(0)
  } else {
    console.log(`❌ ${failures.length} package(s) have JSX type issues:`)
    for (const failure of failures) {
      console.log(`\n${failure.package}:`)
      failure.errors.forEach(err => console.log(`  ${err}`))
    }
    process.exit(1)
  }
}

main()
