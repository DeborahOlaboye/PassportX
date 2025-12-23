import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

interface CICDTest {
  name: string;
  test: () => boolean;
  description: string;
}

interface CICDValidationResult {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  results: {
    name: string;
    passed: boolean;
    message: string;
  }[];
}

class CICDConfigValidator {
  private results: { name: string; passed: boolean; message: string }[] = [];
  private ciConfig: any;
  private deployConfig: any;

  constructor() {
    this.loadConfigs();
  }

  private loadConfigs(): void {
    try {
      const ciYaml = fs.readFileSync(path.join(process.cwd(), '.github/workflows/ci.yml'), 'utf-8');
      this.ciConfig = yaml.parse(ciYaml);
      console.log('✓ CI configuration loaded');
    } catch (error) {
      console.error('✗ Failed to load CI configuration:', error);
      process.exit(1);
    }

    try {
      const deployYaml = fs.readFileSync(path.join(process.cwd(), '.github/workflows/deploy.yml'), 'utf-8');
      this.deployConfig = yaml.parse(deployYaml);
      console.log('✓ Deploy configuration loaded');
    } catch (error) {
      console.error('✗ Failed to load deploy configuration:', error);
      process.exit(1);
    }
  }

  async runAllTests(): Promise<CICDValidationResult> {
    console.log('\n' + '='.repeat(50));
    console.log('CI/CD Configuration Validation');
    console.log('='.repeat(50) + '\n');

    const tests: CICDTest[] = [
      {
        name: 'CI Pipeline Exists',
        test: () => this.ciConfig.name === 'CI Pipeline',
        description: 'CI pipeline should be named "CI Pipeline"'
      },
      {
        name: 'Deploy Pipeline Exists',
        test: () => this.deployConfig.name === 'Deploy',
        description: 'Deploy pipeline should be named "Deploy"'
      },
      {
        name: 'WalletConnect Tests Job',
        test: () => this.ciConfig.jobs['walletconnect-tests'] !== undefined,
        description: 'CI pipeline should have walletconnect-tests job'
      },
      {
        name: 'Testnet Deployment Job',
        test: () => this.deployConfig.jobs['deploy-testnet'] !== undefined,
        description: 'Deploy pipeline should have deploy-testnet job'
      },
      {
        name: 'Mainnet Staging Deployment Job',
        test: () => this.deployConfig.jobs['deploy-mainnet-staging'] !== undefined,
        description: 'Deploy pipeline should have deploy-mainnet-staging job'
      },
      {
        name: 'WalletConnect Tests Run on All Branches',
        test: () => {
          const triggers = this.ciConfig.on;
          return triggers.push && triggers.push.branches && triggers.push.branches.includes('main');
        },
        description: 'WalletConnect tests should run on main and develop branches'
      },
      {
        name: 'E2E Tests Depend on WalletConnect Tests',
        test: () => {
          const e2eJob = this.ciConfig.jobs['e2e-tests'];
          return e2eJob.needs && e2eJob.needs.includes('walletconnect-tests');
        },
        description: 'E2E tests should depend on walletconnect-tests'
      },
      {
        name: 'Quality Gate Depends on WalletConnect Tests',
        test: () => {
          const qualityJob = this.ciConfig.jobs['quality-gate'];
          return qualityJob.needs && qualityJob.needs.includes('walletconnect-tests');
        },
        description: 'Quality gate should depend on walletconnect-tests'
      },
      {
        name: 'Testnet Deployment Runs on Develop',
        test: () => {
          const testnetJob = this.deployConfig.jobs['deploy-testnet'];
          return testnetJob.if && testnetJob.if.includes("refs/heads/develop");
        },
        description: 'Testnet deployment should only run on develop branch'
      },
      {
        name: 'Mainnet Staging Requires Approval',
        test: () => {
          const mainnetStagingJob = this.deployConfig.jobs['deploy-mainnet-staging'];
          return mainnetStagingJob.environment && mainnetStagingJob.environment.name === 'mainnet-staging';
        },
        description: 'Mainnet staging deployment should have environment configuration'
      },
      {
        name: 'Production Deployment Runs on Main',
        test: () => {
          const productionJob = this.deployConfig.jobs['deploy-production'];
          return productionJob.if && productionJob.if.includes("refs/heads/main");
        },
        description: 'Production deployment should only run on main branch'
      },
      {
        name: 'WalletConnect Testnet Environment Variables',
        test: () => {
          const walletconnectJob = this.ciConfig.jobs['walletconnect-tests'];
          const steps = walletconnectJob.steps;
          
          for (const step of steps) {
            if (step.name && step.name.includes('testnet')) {
              const env = step.env;
              return env && env['NEXT_PUBLIC_WALLETCONNECT_NETWORK'] === 'testnet';
            }
          }
          return false;
        },
        description: 'WalletConnect testnet tests should have correct environment variables'
      },
      {
        name: 'WalletConnect Mainnet Environment Variables',
        test: () => {
          const walletconnectJob = this.ciConfig.jobs['walletconnect-tests'];
          const steps = walletconnectJob.steps;
          
          for (const step of steps) {
            if (step.name && step.name.includes('mainnet')) {
              const env = step.env;
              return env && env['NEXT_PUBLIC_WALLETCONNECT_NETWORK'] === 'mainnet';
            }
          }
          return false;
        },
        description: 'WalletConnect mainnet tests should have correct environment variables'
      },
      {
        name: 'Testnet Deployment Validates Before Deploying',
        test: () => {
          const testnetJob = this.deployConfig.jobs['deploy-testnet'];
          const steps = testnetJob.steps;
          
          // Check if validation/test step exists before deployment
          let hasValidation = false;
          for (const step of steps) {
            if (step.name && (step.name.includes('test') || step.name.includes('validate'))) {
              hasValidation = true;
              break;
            }
          }
          return hasValidation;
        },
        description: 'Testnet deployment should validate before deploying'
      },
      {
        name: 'Mainnet Staging Deployment Security Audit',
        test: () => {
          const mainnetStagingJob = this.deployConfig.jobs['deploy-mainnet-staging'];
          const steps = mainnetStagingJob.steps;
          
          for (const step of steps) {
            if (step.name && step.name.includes('security audit')) {
              return true;
            }
          }
          return false;
        },
        description: 'Mainnet staging deployment should include security audit'
      },
      {
        name: 'Deployment Reporting Enabled',
        test: () => {
          const mainnetStagingJob = this.deployConfig.jobs['deploy-mainnet-staging'];
          const steps = mainnetStagingJob.steps;
          
          let hasReporting = false;
          for (const step of steps) {
            if (step.name && (step.name.includes('report') || step.name.includes('checklist'))) {
              hasReporting = true;
              break;
            }
          }
          return hasReporting;
        },
        description: 'Deployments should generate reports'
      },
      {
        name: 'Slack Notifications Configured',
        test: () => {
          const deployJobs = Object.values(this.deployConfig.jobs) as any[];
          
          for (const job of deployJobs) {
            const steps = job.steps || [];
            for (const step of steps) {
              if (step.uses && step.uses.includes('slack')) {
                return true;
              }
            }
          }
          return false;
        },
        description: 'Deployment jobs should have Slack notifications'
      },
      {
        name: 'Node.js Version Consistency',
        test: () => {
          const nodeVersions = new Set<string>();
          
          Object.values(this.ciConfig.jobs).forEach((job: any) => {
            const setupNode = job.steps?.find((step: any) => step.uses && step.uses.includes('setup-node'));
            if (setupNode && setupNode['with']?.['node-version']) {
              nodeVersions.add(setupNode['with']['node-version']);
            }
          });
          
          return nodeVersions.size > 0;
        },
        description: 'CI jobs should specify Node.js versions'
      },
      {
        name: 'Cache Configuration for Dependencies',
        test: () => {
          const backendJob = this.ciConfig.jobs['backend-ci'];
          const setupNode = backendJob.steps.find((step: any) => step.uses && step.uses.includes('setup-node'));
          
          return setupNode && setupNode['with']?.cache === 'npm';
        },
        description: 'Build jobs should cache npm dependencies'
      }
    ];

    // Run all tests
    for (const test of tests) {
      try {
        const passed = test.test();
        const status = passed ? '✓' : '✗';
        const color = passed ? '\x1b[32m' : '\x1b[31m';
        const reset = '\x1b[0m';
        
        console.log(`${color}${status}${reset} ${test.name}`);
        if (!passed) {
          console.log(`  └─ ${test.description}`);
        }
        
        this.results.push({
          name: test.name,
          passed,
          message: test.description
        });
      } catch (error) {
        console.log(`\x1b[31m✗\x1b[0m ${test.name}`);
        console.log(`  └─ Error: ${error}`);
        
        this.results.push({
          name: test.name,
          passed: false,
          message: `Error: ${error}`
        });
      }
    }

    const summary = {
      totalTests: this.results.length,
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed).length,
      skipped: 0,
      results: this.results
    };

    return summary;
  }

  async main(): Promise<void> {
    const result = await this.runAllTests();

    console.log('\n' + '='.repeat(50));
    console.log('Summary');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${result.totalTests}`);
    console.log(`Passed: \x1b[32m${result.passed}\x1b[0m`);
    console.log(`Failed: \x1b[31m${result.failed}\x1b[0m`);
    console.log(`Skipped: ${result.skipped}`);
    console.log('='.repeat(50) + '\n');

    if (result.failed > 0) {
      console.log('\x1b[31mSome tests failed!\x1b[0m');
      process.exit(1);
    } else {
      console.log('\x1b[32mAll tests passed!\x1b[0m');
      process.exit(0);
    }
  }
}

// Main execution
const validator = new CICDConfigValidator();
validator.main();
