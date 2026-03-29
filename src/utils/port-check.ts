import * as net from 'net';

export interface PortStatus {
  port: number;
  protocol: 'tcp' | 'udp';
  inUse: boolean;
  process?: string;
}

export async function checkPort(port: number, host: string = 'localhost'): Promise<boolean> {
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

export async function checkPorts(
  ports: { port: number; protocol: 'tcp' | 'udp' }[]
): Promise<PortStatus[]> {
  const results: PortStatus[] = [];
  for (const { port, protocol } of ports) {
    const inUse = protocol === 'tcp' ? await checkPort(port) : false;
    results.push({ port, protocol, inUse });
  }
  return results;
}

export async function findFreePort(start: number, end: number = 65535): Promise<number> {
  for (let port = start; port <= end; port++) {
    const inUse = await checkPort(port);
    if (!inUse) return port;
  }
  throw new Error(`No free port found between ${start} and ${end}`);
}

export async function checkDockerRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const { execSync } = require('child_process');
    try {
      execSync('docker info', { stdio: 'ignore' });
      resolve(true);
    } catch {
      resolve(false);
    }
  });
}

export async function checkDockerComposeV2(): Promise<boolean> {
  return new Promise((resolve) => {
    const { execSync } = require('child_process');
    try {
      const version = execSync('docker compose version', { stdio: 'pipe' }).toString();
      resolve(version.includes('v2') || version.includes('2.'));
    } catch {
      resolve(false);
    }
  });
}
