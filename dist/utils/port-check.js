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
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPort = checkPort;
exports.checkPorts = checkPorts;
exports.findFreePort = findFreePort;
exports.checkDockerRunning = checkDockerRunning;
exports.checkDockerComposeV2 = checkDockerComposeV2;
const net = __importStar(require("net"));
async function checkPort(port, host = 'localhost') {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(1500);
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        socket.on('error', () => {
            resolve(false);
        });
        socket.connect(port, host);
    });
}
async function checkPorts(ports) {
    const results = [];
    for (const { port, protocol } of ports) {
        const inUse = protocol === 'tcp' ? await checkPort(port) : false;
        results.push({ port, protocol, inUse });
    }
    return results;
}
async function findFreePort(start, end = 65535) {
    for (let port = start; port <= end; port++) {
        const inUse = await checkPort(port);
        if (!inUse)
            return port;
    }
    throw new Error(`No free port found between ${start} and ${end}`);
}
async function checkDockerRunning() {
    return new Promise((resolve) => {
        const { execSync } = require('child_process');
        try {
            execSync('docker info', { stdio: 'ignore' });
            resolve(true);
        }
        catch {
            resolve(false);
        }
    });
}
async function checkDockerComposeV2() {
    return new Promise((resolve) => {
        const { execSync } = require('child_process');
        try {
            const version = execSync('docker compose version', { stdio: 'pipe' }).toString();
            resolve(version.includes('v2') || version.includes('2.'));
        }
        catch {
            resolve(false);
        }
    });
}
//# sourceMappingURL=port-check.js.map