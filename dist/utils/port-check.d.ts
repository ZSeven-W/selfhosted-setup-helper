export interface PortStatus {
    port: number;
    protocol: 'tcp' | 'udp';
    inUse: boolean;
    process?: string;
}
export declare function checkPort(port: number, host?: string): Promise<boolean>;
export declare function checkPorts(ports: {
    port: number;
    protocol: 'tcp' | 'udp';
}[]): Promise<PortStatus[]>;
export declare function findFreePort(start: number, end?: number): Promise<number>;
export declare function checkDockerRunning(): Promise<boolean>;
export declare function checkDockerComposeV2(): Promise<boolean>;
//# sourceMappingURL=port-check.d.ts.map