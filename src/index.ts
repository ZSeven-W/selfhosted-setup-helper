#!/usr/bin/env node
import { Command } from 'commander';
import pc from 'picocolors';
import { runWizard } from './wizard';
import { SERVICES, BUNDLES } from './services';
import { checkPorts, checkDockerRunning, checkDockerComposeV2 } from './utils/port-check';
import { writeOutput } from './utils/config-gen';

const program = new Command();

program
  .name('selfhosted')
  .description('Selfhosted Setup Helper — one-click Docker deployment wizard')
  .version('1.0.0');

program
  .command('wizard')
  .description('Launch interactive setup wizard')
  .action(async () => {
    try {
      await runWizard();
    } catch (err) {
      console.error(pc.red(`Error: ${err}`));
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all available services')
  .action(() => {
    console.log(pc.bold('\n📦 Available Services:\n'));
    for (const [key, svc] of Object.entries(SERVICES)) {
      const ports = svc.ports.map((p) => pc.cyan(`:${p.host}`)).join(pc.dim(', '));
      console.log(`  ${pc.green('●')} ${pc.bold(svc.name)} ${pc.dim('—')} ${svc.description}`);
      console.log(`    ${pc.dim('ports:')} ${ports}  ${pc.dim('category:')} ${svc.category}`);
      console.log();
    }

    console.log(pc.bold('\n🎯 Bundles:\n'));
    for (const [key, bundle] of Object.entries(BUNDLES)) {
      console.log(`  ${pc.green('■')} ${pc.bold(bundle.name)}`);
      console.log(`    ${pc.dim(bundle.description)}`);
      console.log(`    ${pc.dim('services:')} ${bundle.services.join(', ')}`);
      console.log();
    }
  });

program
  .command('check')
  .description('Check Docker & port availability')
  .action(async () => {
    console.log(pc.bold('\n🔍 Pre-flight Checks\n'));

    const docker = await checkDockerRunning();
    console.log(docker ? `  ${pc.green('✓')} Docker is running` : `  ${pc.red('✗')} Docker is not running`);

    const compose = await checkDockerComposeV2();
    console.log(compose ? `  ${pc.green('✓')} Docker Compose V2 is available` : `  ${pc.yellow('⚠')} Docker Compose V2 not found`);

    console.log(pc.bold('\n📡 Port Status:\n'));
    for (const [, svc] of Object.entries(SERVICES)) {
      for (const port of svc.ports.slice(0, 1)) {
        const statuses = await checkPorts([{ port: port.host, protocol: port.protocol || 'tcp' }]);
        const isFree = !statuses[0]?.inUse;
        const icon = isFree ? pc.green('✓') : pc.red('✗');
        console.log(`  ${icon} ${svc.name.padEnd(24)} :${port.host} ${isFree ? pc.green('FREE') : pc.red('IN USE')}`);
      }
    }
  });

program
  .command('quick <bundle-or-services...>')
  .description('Quick generate config for bundle or comma-separated services')
  .action(async (args: string[]) => {
    const input = args.join(',').toLowerCase();
    let selected: string[] = [];

    if (BUNDLES[input]) {
      selected = BUNDLES[input].services;
    } else {
      selected = args.map((a) => a.toLowerCase()).filter((a) => SERVICES[a]);
    }

    if (selected.length === 0) {
      console.log(pc.red('No valid services or bundles found. Use: selfhosted list'));
      process.exit(1);
    }

    console.log(pc.bold(`\n⚡ Quick Generate: ${selected.join(', ')}\n`));
    const { compose, backup, env } = writeOutput('./selfhosted-output', selected, {});
    console.log(`  ${pc.green('✓')} ${compose}`);
    console.log(`  ${pc.green('✓')} ${backup}`);
    console.log(`  ${pc.green('✓')} ${env}`);
    console.log(pc.dim('\n  Run: cd selfhosted-output && docker compose up -d'));
  });

program.parse(process.argv);

// Default: show banner and wizard prompt
if (process.argv.length <= 2) {
  program.version('1.0.0');
  console.log(`
${pc.cyan('╔═══════════════════════════════════════════════════╗')}
${pc.cyan('║')}  ${pc.bold(pc.white('Selfhosted Setup Helper v1.0.0'))}            ${pc.cyan('║')}
${pc.cyan('║')}  ${pc.dim('One-click Docker deployment wizard')}            ${pc.cyan('║')}
${pc.cyan('╚═══════════════════════════════════════════════════╝')}
`);
  console.log(`  ${pc.green('selfhosted wizard')}     Launch interactive setup wizard`);
  console.log(`  ${pc.green('selfhosted list')}        List all services & bundles`);
  console.log(`  ${pc.green('selfhosted check')}       Check Docker & ports`);
  console.log(`  ${pc.green('selfhosted quick media-stack')}  Quick generate a bundle`);
  console.log(`  ${pc.green('selfhosted quick jellyfin,gitea')}  Quick generate specific services`);
  console.log(`  ${pc.green('selfhosted --help')}      Show all options\n`);
}
