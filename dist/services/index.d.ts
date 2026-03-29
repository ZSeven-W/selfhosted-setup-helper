export interface ServiceConfig {
    name: string;
    version: string;
    ports: {
        host: number;
        container: number;
        protocol?: 'tcp' | 'udp';
    }[];
    volumes: {
        host: string;
        container: string;
    }[];
    envVars?: {
        key: string;
        description: string;
        default?: string;
        required?: boolean;
    }[];
    healthCheck?: string;
    dependsOn?: string[];
    description: string;
    category: 'media' | 'dev' | 'network' | 'storage' | 'security';
    composeTemplate: (vars: Record<string, string>) => string;
    backupScript: (vars: Record<string, string>) => string;
}
export declare const SERVICES: Record<string, ServiceConfig>;
export declare const BUNDLES: Record<string, {
    name: string;
    description: string;
    services: string[];
}>;
export declare const CATEGORIES: readonly [{
    readonly key: "all";
    readonly label: "All Services";
    readonly emoji: "🌐";
}, {
    readonly key: "media";
    readonly label: "Media";
    readonly emoji: "🎬";
}, {
    readonly key: "dev";
    readonly label: "Development";
    readonly emoji: "💻";
}, {
    readonly key: "network";
    readonly label: "Network";
    readonly emoji: "🔗";
}, {
    readonly key: "storage";
    readonly label: "Storage";
    readonly emoji: "💾";
}, {
    readonly key: "security";
    readonly label: "Security";
    readonly emoji: "🔒";
}];
//# sourceMappingURL=index.d.ts.map