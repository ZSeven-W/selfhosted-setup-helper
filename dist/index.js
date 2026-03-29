#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const picocolors_1 = __importDefault(require("picocolors"));
const wizard_1 = require("./wizard");
const services_1 = require("./services");
const port_check_1 = require("./utils/port-check");
const config_gen_1 = require("./utils/config-gen");
const program = new commander_1.Command();
program
    .name('selfhosted')
    .description('Selfhosted Setup Helper — one-click Docker deployment wizard')
    .version('1.0.0');
program
    .command('wizard')
    .description('Launch interactive setup wizard')
    .action(async () => {
    try {
        await (0, wizard_1.runWizard)();
    }
    catch (err) {
        console.error(picocolors_1.default.red(`Error: ${err}`));
        process.exit(1);
    }
});
program
    .command('list')
    .description('List all available services')
    .action(() => {
    console.log(picocolors_1.default.bold('\n📦 Available Services:\n'));
    for (const [key, svc] of Object.entries(services_1.SERVICES)) {
        const ports = svc.ports.map((p) => picocolors_1.default.cyan(`:${p.host}`)).join(picocolors_1.default.dim(', '));
        console.log(`  ${picocolors_1.default.green('●')} ${picocolors_1.default.bold(svc.name)} ${picocolors_1.default.dim('—')} ${svc.description}`);
        console.log(`    ${picocolors_1.default.dim('ports:')} ${ports}  ${picocolors_1.default.dim('category:')} ${svc.category}`);
        console.log();
    }
    console.log(picocolors_1.default.bold('\n🎯 Bundles:\n'));
    for (const [key, bundle] of Object.entries(services_1.BUNDLES)) {
        console.log(`  ${picocolors_1.default.green('■')} ${picocolors_1.default.bold(bundle.name)}`);
        console.log(`    ${picocolors_1.default.dim(bundle.description)}`);
        console.log(`    ${picocolors_1.default.dim('services:')} ${bundle.services.join(', ')}`);
        console.log();
    }
});
program
    .command('check')
    .description('Check Docker & port availability')
    .action(async () => {
    console.log(picocolors_1.default.bold('\n🔍 Pre-flight Checks\n'));
    const docker = await (0, port_check_1.checkDockerRunning)();
    console.log(docker ? `  ${picocolors_1.default.green('✓')} Docker is running` : `  ${picocolors_1.default.red('✗')} Docker is not running`);
    const compose = await (0, port_check_1.checkDockerComposeV2)();
    console.log(compose ? `  ${picocolors_1.default.green('✓')} Docker Compose V2 is available` : `  ${picocolors_1.default.yellow('⚠')} Docker Compose V2 not found`);
    console.log(picocolors_1.default.bold('\n📡 Port Status:\n'));
    for (const [, svc] of Object.entries(services_1.SERVICES)) {
        for (const port of svc.ports.slice(0, 1)) {
            const statuses = await (0, port_check_1.checkPorts)([{ port: port.host, protocol: port.protocol || 'tcp' }]);
            const isFree = !statuses[0]?.inUse;
            const icon = isFree ? picocolors_1.default.green('✓') : picocolors_1.default.red('✗');
            console.log(`  ${icon} ${svc.name.padEnd(24)} :${port.host} ${isFree ? picocolors_1.default.green('FREE') : picocolors_1.default.red('IN USE')}`);
        }
    }
});
program
    .command('quick <bundle-or-services...>')
    .description('Quick generate config for bundle or comma-separated services')
    .action(async (args) => {
    const input = args.join(',').toLowerCase();
    let selected = [];
    if (services_1.BUNDLES[input]) {
        selected = services_1.BUNDLES[input].services;
    }
    else {
        selected = args.map((a) => a.toLowerCase()).filter((a) => services_1.SERVICES[a]);
    }
    if (selected.length === 0) {
        console.log(picocolors_1.default.red('No valid services or bundles found. Use: selfhosted list'));
        process.exit(1);
    }
    console.log(picocolors_1.default.bold(`\n⚡ Quick Generate: ${selected.join(', ')}\n`));
    const { compose, backup, env } = (0, config_gen_1.writeOutput)('./selfhosted-output', selected, {});
    console.log(`  ${picocolors_1.default.green('✓')} ${compose}`);
    console.log(`  ${picocolors_1.default.green('✓')} ${backup}`);
    console.log(`  ${picocolors_1.default.green('✓')} ${env}`);
    console.log(picocolors_1.default.dim('\n  Run: cd selfhosted-output && docker compose up -d'));
});
program.parse(process.argv);
// Default: show banner and wizard prompt
if (process.argv.length <= 2) {
    program.version('1.0.0');
    console.log(`
${picocolors_1.default.cyan('╔═══════════════════════════════════════════════════╗')}
${picocolors_1.default.cyan('║')}  ${picocolors_1.default.bold(picocolors_1.default.white('Selfhosted Setup Helper v1.0.0'))}            ${picocolors_1.default.cyan('║')}
${picocolors_1.default.cyan('║')}  ${picocolors_1.default.dim('One-click Docker deployment wizard')}            ${picocolors_1.default.cyan('║')}
${picocolors_1.default.cyan('╚═══════════════════════════════════════════════════╝')}
`);
    console.log(`  ${picocolors_1.default.green('selfhosted wizard')}     Launch interactive setup wizard`);
    console.log(`  ${picocolors_1.default.green('selfhosted list')}        List all services & bundles`);
    console.log(`  ${picocolors_1.default.green('selfhosted check')}       Check Docker & ports`);
    console.log(`  ${picocolors_1.default.green('selfhosted quick media-stack')}  Quick generate a bundle`);
    console.log(`  ${picocolors_1.default.green('selfhosted quick jellyfin,gitea')}  Quick generate specific services`);
    console.log(`  ${picocolors_1.default.green('selfhosted --help')}      Show all options\n`);
}
//# sourceMappingURL=index.js.map