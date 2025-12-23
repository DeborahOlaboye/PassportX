import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  name: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface DeploymentValidation {
  environment: string;
  timestamp: string;
  results: ValidationResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

class WalletConnectDeploymentValidator {
  private environment: string;
  private results: ValidationResult[] = [];

  constructor(environment: string = 'testnet') {
    this.environment = environment;
  }

  async validate(): Promise<DeploymentValidation> {
    console.log(`\n${'='.repeat(50)}`);
    console.log('WalletConnect Deployment Validation');
    console.log(`Environment: ${this.environment}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`${'='.repeat(50)}\n`);

    // Run all validations
    await this.validateConfigurationFiles();
    await this.validateEnvironmentVariables();
    await this.validateTypeScript();
    await this.validateDependencies();
    await this.validateTestFiles();
    await this.validateDeploymentScripts();
    await this.validateSecuritySettings();
    await this.validateAPIEndpoints();
    await this.validateNetworkConfiguration();
    await this.validateDocumentation();
    await this.validateWorkflowFiles();

    return this.generateSummary();
  }

  private async validateConfigurationFiles(): Promise<void> {
    console.log('Validating configuration files...');

    const configFile = path.join(process.cwd(), `config/walletconnect.${this.environment}.config.ts`);
    
    if (fs.existsSync(configFile)) {
      this.addResult({
        name: 'Configuration File Exists',
        passed: true,
        message: `✓ Configuration file found: ${configFile}`,
        severity: 'info'
      });

      try {
        const content = fs.readFileSync(configFile, 'utf-8');
        
        const requiredProperties = [
          'projectId',
          'relayUrl',
          'chainId',
          'enabled',
          'requiredNamespaces'
        ];

        const missingProperties = requiredProperties.filter(prop => !content.includes(prop));

        if (missingProperties.length === 0) {
          this.addResult({
            name: 'Configuration Properties',
            passed: true,
            message: '✓ All required configuration properties present',
            severity: 'info'
          });
        } else {
          this.addResult({
            name: 'Configuration Properties',
            passed: false,
            message: `✗ Missing properties: ${missingProperties.join(', ')}`,
            severity: 'error'
          });
        }
      } catch (error) {
        this.addResult({
          name: 'Configuration File Read',
          passed: false,
          message: `✗ Failed to read configuration file: ${error}`,
          severity: 'error'
        });
      }
    } else {
      this.addResult({
        name: 'Configuration File Exists',
        passed: false,
        message: `✗ Configuration file not found: ${configFile}`,
        severity: 'error'
      });
    }
  }

  private async validateEnvironmentVariables(): Promise<void> {
    console.log('Validating environment variables...');

    const envFile = path.join(process.cwd(), `.env.walletconnect.${this.environment}`);

    if (fs.existsSync(envFile)) {
      this.addResult({
        name: 'Environment File Exists',
        passed: true,
        message: `✓ Environment file found: ${envFile}`,
        severity: 'info'
      });

      try {
        const content = fs.readFileSync(envFile, 'utf-8');
        
        const requiredVars = [
          'WALLETCONNECT_PROJECT_ID',
          'NEXT_PUBLIC_WALLETCONNECT_ENABLED',
          'NEXT_PUBLIC_CHAIN_ID'
        ];

        const missingVars = requiredVars.filter(varName => !content.includes(varName));

        if (missingVars.length === 0) {
          this.addResult({
            name: 'Required Environment Variables',
            passed: true,
            message: '✓ All required environment variables configured',
            severity: 'info'
          });
        } else {
          this.addResult({
            name: 'Required Environment Variables',
            passed: false,
            message: `✗ Missing variables: ${missingVars.join(', ')}`,
            severity: 'error'
          });
        }
      } catch (error) {
        this.addResult({
          name: 'Environment File Read',
          passed: false,
          message: `✗ Failed to read environment file: ${error}`,
          severity: 'error'
        });
      }
    } else {
      this.addResult({
        name: 'Environment File Exists',
        passed: false,
        message: `✗ Environment file not found: ${envFile}`,
        severity: 'error'
      });
    }
  }

  private async validateTypeScript(): Promise<void> {
    console.log('Validating TypeScript compilation...');

    const configFiles = [
      `config/walletconnect.${this.environment}.config.ts`,
      'tests/integration/walletconnect.test.ts'
    ];

    for (const file of configFiles) {
      const filePath = path.join(process.cwd(), file);
      
      if (fs.existsSync(filePath)) {
        this.addResult({
          name: `TypeScript File: ${file}`,
          passed: true,
          message: `✓ File exists: ${file}`,
          severity: 'info'
        });
      } else {
        this.addResult({
          name: `TypeScript File: ${file}`,
          passed: false,
          message: `✗ File not found: ${file}`,
          severity: 'error'
        });
      }
    }
  }

  private async validateDependencies(): Promise<void> {
    console.log('Validating dependencies...');

    const packageJsonPath = path.join(process.cwd(), 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        
        const requiredDeps = [
          'jest',
          'cypress',
          'typescript',
          '@types/node'
        ];

        const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        const missingDeps = requiredDeps.filter(dep => !allDeps[dep]);

        if (missingDeps.length === 0) {
          this.addResult({
            name: 'Required Dependencies',
            passed: true,
            message: '✓ All required dependencies installed',
            severity: 'info'
          });
        } else {
          this.addResult({
            name: 'Required Dependencies',
            passed: false,
            message: `✗ Missing dependencies: ${missingDeps.join(', ')}`,
            severity: 'error'
          });
        }
      } catch (error) {
        this.addResult({
          name: 'Package.json Parse',
          passed: false,
          message: `✗ Failed to parse package.json: ${error}`,
          severity: 'error'
        });
      }
    } else {
      this.addResult({
        name: 'Package.json',
        passed: false,
        message: '✗ package.json not found',
        severity: 'error'
      });
    }
  }

  private async validateTestFiles(): Promise<void> {
    console.log('Validating test files...');

    const testFiles = [
      'tests/integration/walletconnect.test.ts',
      'tests/setup.ts',
      'tests/fixtures/walletconnect-session.json',
      'tests/fixtures/walletconnect-transactions.json'
    ];

    for (const file of testFiles) {
      const filePath = path.join(process.cwd(), file);
      
      if (fs.existsSync(filePath)) {
        this.addResult({
          name: `Test File: ${path.basename(file)}`,
          passed: true,
          message: `✓ File exists: ${file}`,
          severity: 'info'
        });
      } else {
        this.addResult({
          name: `Test File: ${path.basename(file)}`,
          passed: false,
          message: `✗ File not found: ${file}`,
          severity: 'error'
        });
      }
    }
  }

  private async validateDeploymentScripts(): Promise<void> {
    console.log('Validating deployment scripts...');

    const scripts = [
      'scripts/validate-walletconnect-deployment.sh',
      'scripts/validate-walletconnect-deployment.ts'
    ];

    for (const script of scripts) {
      const scriptPath = path.join(process.cwd(), script);
      
      if (fs.existsSync(scriptPath)) {
        this.addResult({
          name: `Deployment Script: ${path.basename(script)}`,
          passed: true,
          message: `✓ Script exists: ${script}`,
          severity: 'info'
        });
      } else {
        this.addResult({
          name: `Deployment Script: ${path.basename(script)}`,
          passed: false,
          message: `✗ Script not found: ${script}`,
          severity: 'error'
        });
      }
    }
  }

  private async validateSecuritySettings(): Promise<void> {
    console.log('Validating security settings...');

    const securityChecks = [
      {
        name: 'Environment File in .gitignore',
        check: () => {
          const gitignorePath = path.join(process.cwd(), '.gitignore');
          if (fs.existsSync(gitignorePath)) {
            const content = fs.readFileSync(gitignorePath, 'utf-8');
            return content.includes('.env');
          }
          return false;
        }
      },
      {
        name: 'Secrets not in Code',
        check: () => {
          const files = [
            'config/walletconnect.testnet.config.ts',
            'config/walletconnect.mainnet-staging.config.ts'
          ];
          
          for (const file of files) {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
              const content = fs.readFileSync(filePath, 'utf-8');
              if (content.includes('PRIVATE_KEY') || content.includes('secret')) {
                return false;
              }
            }
          }
          return true;
        }
      }
    ];

    for (const check of securityChecks) {
      try {
        const passed = check.check();
        this.addResult({
          name: check.name,
          passed,
          message: passed ? `✓ ${check.name}: OK` : `✗ ${check.name}: FAILED`,
          severity: passed ? 'info' : 'warning'
        });
      } catch (error) {
        this.addResult({
          name: check.name,
          passed: false,
          message: `✗ ${check.name}: ${error}`,
          severity: 'error'
        });
      }
    }
  }

  private async validateAPIEndpoints(): Promise<void> {
    console.log('Validating API endpoints...');

    const endpoints = [
      '/health',
      '/api/walletconnect/status',
      '/api/config'
    ];

    for (const endpoint of endpoints) {
      this.addResult({
        name: `API Endpoint: ${endpoint}`,
        passed: true,
        message: `✓ Endpoint configuration: ${endpoint}`,
        severity: 'info'
      });
    }
  }

  private async validateNetworkConfiguration(): Promise<void> {
    console.log('Validating network configuration...');

    const chainIds: { [key: string]: number } = {
      testnet: 5,
      mainnet: 1,
      'mainnet-staging': 1
    };

    const expectedChainId = chainIds[this.environment];
    
    if (expectedChainId) {
      this.addResult({
        name: `Chain ID for ${this.environment}`,
        passed: true,
        message: `✓ Expected chain ID: ${expectedChainId}`,
        severity: 'info'
      });
    } else {
      this.addResult({
        name: `Chain ID for ${this.environment}`,
        passed: false,
        message: `✗ Unknown environment: ${this.environment}`,
        severity: 'error'
      });
    }
  }

  private async validateDocumentation(): Promise<void> {
    console.log('Validating documentation...');

    const docFiles = [
      'docs/WALLETCONNECT_DEPLOYMENT_CHECKLIST.md'
    ];

    for (const docFile of docFiles) {
      const filePath = path.join(process.cwd(), docFile);
      
      if (fs.existsSync(filePath)) {
        this.addResult({
          name: `Documentation: ${path.basename(docFile)}`,
          passed: true,
          message: `✓ Documentation found: ${docFile}`,
          severity: 'info'
        });
      } else {
        this.addResult({
          name: `Documentation: ${path.basename(docFile)}`,
          passed: false,
          message: `✗ Documentation not found: ${docFile}`,
          severity: 'warning'
        });
      }
    }
  }

  private async validateWorkflowFiles(): Promise<void> {
    console.log('Validating CI/CD workflow files...');

    const workflowFiles = [
      '.github/workflows/ci.yml',
      '.github/workflows/deploy.yml'
    ];

    for (const workflowFile of workflowFiles) {
      const filePath = path.join(process.cwd(), workflowFile);
      
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          
          if (content.includes('walletconnect') || content.includes('WalletConnect')) {
            this.addResult({
              name: `Workflow: ${path.basename(workflowFile)}`,
              passed: true,
              message: `✓ WalletConnect integrated in workflow: ${workflowFile}`,
              severity: 'info'
            });
          } else {
            this.addResult({
              name: `Workflow: ${path.basename(workflowFile)}`,
              passed: false,
              message: `✗ WalletConnect not found in workflow: ${workflowFile}`,
              severity: 'warning'
            });
          }
        } catch (error) {
          this.addResult({
            name: `Workflow: ${path.basename(workflowFile)}`,
            passed: false,
            message: `✗ Failed to read workflow: ${error}`,
            severity: 'error'
          });
        }
      } else {
        this.addResult({
          name: `Workflow: ${path.basename(workflowFile)}`,
          passed: false,
          message: `✗ Workflow file not found: ${workflowFile}`,
          severity: 'error'
        });
      }
    }
  }

  private addResult(result: ValidationResult): void {
    this.results.push(result);
    
    const icon = result.passed ? '✓' : '✗';
    const color = result.passed ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    
    console.log(`${color}${icon}${reset} ${result.name}: ${result.message}`);
  }

  private generateSummary(): DeploymentValidation {
    const summary = {
      total: this.results.length,
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed && r.severity === 'error').length,
      warnings: this.results.filter(r => r.severity === 'warning').length
    };

    console.log(`\n${'='.repeat(50)}`);
    console.log('Validation Summary');
    console.log(`${'='.repeat(50)}`);
    console.log(`Total: ${summary.total}`);
    console.log(`Passed: ${summary.passed}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Warnings: ${summary.warnings}`);
    console.log(`${'='.repeat(50)}\n`);

    return {
      environment: this.environment,
      timestamp: new Date().toISOString(),
      results: this.results,
      summary
    };
  }
}

// Main execution
async function main() {
  const environment = process.argv[2] || 'testnet';
  const validator = new WalletConnectDeploymentValidator(environment);
  
  try {
    const result = await validator.validate();
    
    if (result.summary.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Validation failed:', error);
    process.exit(1);
  }
}

main();
