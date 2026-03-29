"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWizard = runWizard;
const inquirer = __importStar(require("inquirer"));
const picocolors_1 = __importDefault(require("picocolors"));
const services_1 = require("./services");
const port_check_1 = require("./utils/port-check");
const config_gen_1 = require("./utils/config-gen");
const ASCII_LOGO = `
${picocolors_1.default.cyan('╔═══════════════════════════════════════════════════╗')}
${picocolors_1.default.cyan('║')}  ${picocolors_1.default.bold(picocolors_1.default.white('Selfhosted Setup Helper'))} ${picocolors_1.default.cyan('                         ║')}
${picocolors_1.default.cyan('║')}  ${picocolors_1.default.dim('One-click Docker deployment wizard')}            ${picocolors_1.default.cyan('║')}
${picocolors_1.default.cyan('╚═══════════════════════════════════════════════════╝')}
`;
function printBanner(text) {
    console.log(picocolors_1.default.bold(picocolors_1.default.cyan(`\n▶ ${text}`)));
}
function printSuccess(text) {
    console.log(picocolors_1.default.green(`  ✓ ${text}`));
}
function printWarning(text) {
    console.log(picocolors_1.default.yellow(`  ⚠ ${text}`));
}
function printError(text) {
    console.log(picocolors_1.default.red(`  ✗ ${text}`));
}
async function runWizard() {
    console.log(ASCII_LOGO);
    // Pre-flight checks
    printBanner('Pre-flight Checks');
    const dockerRunning = await (0, port_check_1.checkDockerRunning)();
    if (!dockerRunning) {
        printError('Docker is not running. Please start Docker and try again.');
        console.log(picocolors_1.default.dim('  Install: https://docs.docker.com/get-docker/'));
        process.exit(1);
    }
    printSuccess('Docker is running');
    const hasComposeV2 = await (0, port_check_1.checkDockerComposeV2)();
    if (!hasComposeV2) {
        printWarning('Docker Compose V2 not detected. Some features may not work.');
    }
    else {
        printSuccess('Docker Compose V2 is available');
    }
    // ─── Step 1: Choose Mode ───
    printBanner('Step 1 — Choose Setup Mode');
    const prompt = inquirer.createPromptModule();
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
    let selectedServices = [];
    if (mode === 'bundle') {
        printBanner('Step 2 — Select a Bundle');
        const { bundleKey } = await prompt([
            {
                type: 'list',
                name: 'bundleKey',
                message: 'Choose a pre-configured bundle:',
                choices: Object.entries(services_1.BUNDLES).map(([key, b]) => ({
                    name: `${b.name} — ${b.description}`,
                    value: key,
                })),
            },
        ]);
        selectedServices = services_1.BUNDLES[bundleKey].services;
    }
    else if (mode === 'custom') {
        printBanner('Step 2 — Select Services');
        const { category } = await prompt([
            {
                type: 'list',
                name: 'category',
                message: 'Filter by category:',
                choices: services_1.CATEGORIES.map((c) => ({ name: `${c.emoji} ${c.label}`, value: c.key })),
                default: 'all',
            },
        ]);
        const filteredServices = category === 'all'
            ? Object.entries(services_1.SERVICES)
            : Object.entries(services_1.SERVICES).filter(([, s]) => s.category === category);
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
                validate: (ans) => ans.length > 0 || 'Please select at least one service',
            },
        ]);
        selectedServices = services;
    }
    else {
        // hybrid
        const { bundleKey } = await prompt([
            {
                type: 'list',
                name: 'bundleKey',
                message: 'Choose a base bundle:',
                choices: Object.entries(services_1.BUNDLES).map(([key, b]) => ({
                    name: `${b.name} — ${b.description}`,
                    value: key,
                })),
            },
        ]);
        selectedServices = [...services_1.BUNDLES[bundleKey].services];
        printBanner('Step 2b — Add More Services');
        const { addServices } = await prompt([
            {
                type: 'checkbox',
                name: 'addServices',
                message: 'Add additional services:',
                choices: Object.entries(services_1.SERVICES)
                    .filter(([key]) => !selectedServices.includes(key))
                    .map(([key, s]) => ({
                    name: `${s.name} — ${s.description}`,
                    value: key,
                })),
            },
        ]);
        selectedServices.push(...addServices);
    }
    console.log(picocolors_1.default.dim(`\n  Selected: ${selectedServices.join(', ')}`));
    // ─── Step 2: Configure Services ───
    printBanner('Step 3 — Configure Services');
    const globalVars = {};
    // Check port availability
    const allPorts = selectedServices.flatMap((key) => (services_1.SERVICES[key]?.ports || []).map((p) => ({ port: p.host, protocol: p.protocol || 'tcp' })));
    printBanner('Checking Port Availability');
    const portStatuses = await (0, port_check_1.checkPorts)(allPorts);
    for (const status of portStatuses) {
        if (status.inUse) {
            printWarning(`Port ${status.port}/${status.protocol} is in use — will try to find free port`);
            try {
                const freePort = await (0, port_check_1.findFreePort)(status.port + 1);
                globalVars[`PORT_override_${status.port}`] = String(freePort);
                printSuccess(`Assigned free port ${freePort} instead of ${status.port}`);
            }
            catch {
                printError(`Could not find free port near ${status.port}`);
            }
        }
        else {
            printSuccess(`Port ${status.port}/${status.protocol} is free`);
        }
    }
    // Environment variables
    const envQuestions = [];
    const seenKeys = new Set();
    for (const serviceKey of selectedServices) {
        const service = services_1.SERVICES[serviceKey];
        if (!service)
            continue;
        for (const env of service.envVars || []) {
            const fullKey = `${serviceKey}_${env.key}`;
            if (seenKeys.has(fullKey))
                continue;
            seenKeys.add(fullKey);
            envQuestions.push({
                type: env.key.includes('PASSWORD') || env.key.includes('TOKEN') ? 'password' : 'input',
                name: fullKey,
                message: `[${service.name}] ${env.description} (${env.key})`,
                default: env.default,
                validate: (val) => {
                    if (env.required && !val)
                        return `${env.description} is required`;
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
            validate: (val) => val.length > 0,
        },
    ]);
    // ─── Step 4: Generate ───
    printBanner('Generating Configuration');
    try {
        const { compose, backup, env } = (0, config_gen_1.writeOutput)(outputDir, selectedServices, globalVars);
        printSuccess(`docker-compose.yml → ${compose}`);
        printSuccess(`backup.sh         → ${backup}`);
        printSuccess(`.env              → ${env}`);
    }
    catch (err) {
        printError(`Failed to write files: ${err}`);
        process.exit(1);
    }
    // ─── Step 5: Validate ───
    printBanner('Validation');
    try {
        const { execSync } = require('child_process');
        execSync(`cd "${outputDir}" && docker compose config --dry-run`, { stdio: 'pipe' });
        printSuccess('docker-compose.yml is valid');
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        printWarning(`Could not validate (docker compose check failed): ${errorMsg.split('\n')[0]}`);
    }
    // ─── Summary ───
    console.log(picocolors_1.default.cyan('\n╔═══════════════════════════════════════════════════╗'));
    console.log(picocolors_1.default.cyan('║') + picocolors_1.default.bold(picocolors_1.default.white(' Setup Complete! ')) + picocolors_1.default.cyan('                              ║'));
    console.log(picocolors_1.default.cyan('╚═══════════════════════════════════════════════════╝'));
    console.log();
    console.log(picocolors_1.default.bold('Next steps:'));
    console.log(`  ${picocolors_1.default.green('cd ' + outputDir)}`);
    console.log(`  ${picocolors_1.default.green('docker compose up -d')}         # Start all services`);
    console.log(`  ${picocolors_1.default.green('docker compose ps')}            # Check status`);
    console.log(`  ${picocolors_1.default.green('bash backup.sh')}               # Run backup`);
    console.log();
    console.log(picocolors_1.default.dim('  Tip: Edit .env to change passwords before running docker compose up -d'));
    console.log();
}
//# sourceMappingURL=wizard.js.map