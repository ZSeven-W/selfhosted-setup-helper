import * as inquirer from 'inquirer';
import pc from 'picocolors';
import { SERVICES, BUNDLES, CATEGORIES } from './services';
import { checkPorts, checkDockerRunning, checkDockerComposeV2, findFreePort } from './utils/port-check';
import { writeOutput } from './utils/config-gen';

const ASCII_LOGO = `
${pc.cyan('╔═══════════════════════════════════════════════════╗')}
${pc.cyan('║')}  ${pc.bold(pc.white('Selfhosted Setup Helper'))} ${pc.cyan('                         ║')}
${pc.cyan('║')}  ${pc.dim('One-click Docker deployment wizard')}            ${pc.cyan('║')}
${pc.cyan('╚═══════════════════════════════════════════════════╝')}
`;

function printBanner(text: string) {
  console.log(pc.bold(pc.cyan(`\n▶ ${text}`)));
}

function printSuccess(text: string) {
  console.log(pc.green(`  ✓ ${text}`));
}

function printWarning(text: string) {
  console.log(pc.yellow(`  ⚠ ${text}`));
}

function printError(text: string) {
  console.log(pc.red(`  ✗ ${text}`));
}

export async function runWizard(): Promise<void> {
  console.log(ASCII_LOGO);

  // Pre-flight checks
  printBanner('Pre-flight Checks');
  const dockerRunning = await checkDockerRunning();
  if (!dockerRunning) {
    printError('Docker is not running. Please start Docker and try again.');
    console.log(pc.dim('  Install: https://docs.docker.com/get-docker/'));
    process.exit(1);
  }
  printSuccess('Docker is running');

  const hasComposeV2 = await checkDockerComposeV2();
  if (!hasComposeV2) {
    printWarning('Docker Compose V2 not detected. Some features may not work.');
  } else {
    printSuccess('Docker Compose V2 is available');
  }

  // ─── Step 1: Choose Mode ───
  printBanner('Step 1 — Choose Setup Mode');
  const prompt = (inquirer as any).createPromptModule();
  const { mode } = await prompt([
    {
      type: 'list',
      name: 'mode',
      message: 'How would you like to set up services?',
      choices: [
        { name: '🎯 Quick Bundle — pick a pre-configured stack', value: 'bundle' },
        { name: '🔧 Custom — choose individual services', value: 'custom' },
        { name: '🧩 Hybrid — bundle + add more services', value: 'hybrid' },
      ],
      default: 'custom',
    },
  ]);

  let selectedServices: string[] = [];

  if (mode === 'bundle') {
    printBanner('Step 2 — Select a Bundle');
    const { bundleKey } = await prompt([
      {
        type: 'list',
        name: 'bundleKey',
        message: 'Choose a pre-configured bundle:',
        choices: Object.entries(BUNDLES).map(([key, b]) => ({
          name: `${b.name} — ${b.description}`,
          value: key,
        })),
      },
    ]);
    selectedServices = BUNDLES[bundleKey].services;
  } else if (mode === 'custom') {
    printBanner('Step 2 — Select Services');
    const { category } = await prompt([
      {
        type: 'list',
        name: 'category',
        message: 'Filter by category:',
        choices: CATEGORIES.map((c) => ({ name: `${c.emoji} ${c.label}`, value: c.key })),
        default: 'all',
      },
    ]);

    const filteredServices = category === 'all'
      ? Object.entries(SERVICES)
      : Object.entries(SERVICES).filter(([, s]) => s.category === category);

    const choices = filteredServices.map(([key, s]) => ({
      name: `${s.name} (${s.description}) — ports: ${s.ports.map((p) => p.host).join(', ')}`,
      value: key,
      checked: false,
    }));

    const { services } = await prompt([
      {
        type: 'checkbox',
        name: 'services',
        message: `Select services to install (${filteredServices.length} available):`,
        choices,
        validate: (ans: string[]) => ans.length > 0 || 'Please select at least one service',
      },
    ]);
    selectedServices = services;
  } else {
    // hybrid
    const { bundleKey } = await prompt([
      {
        type: 'list',
        name: 'bundleKey',
        message: 'Choose a base bundle:',
        choices: Object.entries(BUNDLES).map(([key, b]) => ({
          name: `${b.name} — ${b.description}`,
          value: key,
        })),
      },
    ]);
    selectedServices = [...BUNDLES[bundleKey].services];

    printBanner('Step 2b — Add More Services');
    const { addServices } = await prompt([
      {
        type: 'checkbox',
        name: 'addServices',
        message: 'Add additional services:',
        choices: Object.entries(SERVICES)
          .filter(([key]) => !selectedServices.includes(key))
          .map(([key, s]) => ({
            name: `${s.name} — ${s.description}`,
            value: key,
          })),
      },
    ]);
    selectedServices.push(...addServices);
  }

  console.log(pc.dim(`\n  Selected: ${selectedServices.join(', ')}`));

  // ─── Step 2: Configure Services ───
  printBanner('Step 3 — Configure Services');
  const globalVars: Record<string, string> = {};

  // Check port availability
  const allPorts = selectedServices.flatMap((key) =>
    (SERVICES[key]?.ports || []).map((p) => ({ port: p.host, protocol: p.protocol || 'tcp' }))
  );

  printBanner('Checking Port Availability');
  const portStatuses = await checkPorts(allPorts);

  for (const status of portStatuses) {
    if (status.inUse) {
      printWarning(`Port ${status.port}/${status.protocol} is in use — will try to find free port`);
      try {
        const freePort = await findFreePort(status.port + 1);
        globalVars[`PORT_override_${status.port}`] = String(freePort);
        printSuccess(`Assigned free port ${freePort} instead of ${status.port}`);
      } catch {
        printError(`Could not find free port near ${status.port}`);
      }
    } else {
      printSuccess(`Port ${status.port}/${status.protocol} is free`);
    }
  }

  // Environment variables
  const envQuestions: any[] = [];
  const seenKeys = new Set<string>();

  for (const serviceKey of selectedServices) {
    const service = SERVICES[serviceKey];
    if (!service) continue;

    for (const env of service.envVars || []) {
      const fullKey = `${serviceKey}_${env.key}`;
      if (seenKeys.has(fullKey)) continue;
      seenKeys.add(fullKey);

      envQuestions.push({
        type: env.key.includes('PASSWORD') || env.key.includes('TOKEN') ? 'password' : 'input',
        name: fullKey,
        message: `[${service.name}] ${env.description} (${env.key})`,
        default: env.default,
        validate: (val: string) => {
          if (env.required && !val) return `${env.description} is required`;
          return true;
        },
      });
    }
  }

  if (envQuestions.length > 0) {
    printBanner('Service Configuration');
    const answers = await prompt(envQuestions);
    Object.assign(globalVars, answers);
  }

  // ─── Step 3: Output Directory ───
  printBanner('Step 4 — Output Location');
  const { outputDir } = await prompt([
    {
      type: 'input',
      name: 'outputDir',
      message: 'Output directory for generated files:',
      default: './selfhosted-output',
      validate: (val: string) => val.length > 0,
    },
  ]);

  // ─── Step 4: Generate ───
  printBanner('Generating Configuration');
  try {
    const { compose, backup, env } = writeOutput(outputDir, selectedServices, globalVars);
    printSuccess(`docker-compose.yml → ${compose}`);
    printSuccess(`backup.sh         → ${backup}`);
    printSuccess(`.env              → ${env}`);
  } catch (err) {
    printError(`Failed to write files: ${err}`);
    process.exit(1);
  }

  // ─── Step 5: Validate ───
  printBanner('Validation');
  try {
    const { execSync } = require('child_process');
    execSync(`cd "${outputDir}" && docker compose config --dry-run`, { stdio: 'pipe' });
    printSuccess('docker-compose.yml is valid');
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    printWarning(`Could not validate (docker compose check failed): ${errorMsg.split('\n')[0]}`);
  }

  // ─── Summary ───
  console.log(pc.cyan('\n╔═══════════════════════════════════════════════════╗'));
  console.log(pc.cyan('║') + pc.bold(pc.white(' Setup Complete! ')) + pc.cyan('                              ║'));
  console.log(pc.cyan('╚═══════════════════════════════════════════════════╝'));
  console.log();
  console.log(pc.bold('Next steps:'));
  console.log(`  ${pc.green('cd ' + outputDir)}`);
  console.log(`  ${pc.green('docker compose up -d')}         # Start all services`);
  console.log(`  ${pc.green('docker compose ps')}            # Check status`);
  console.log(`  ${pc.green('bash backup.sh')}               # Run backup`);
  console.log();
  console.log(pc.dim('  Tip: Edit .env to change passwords before running docker compose up -d'));
  console.log();
}
