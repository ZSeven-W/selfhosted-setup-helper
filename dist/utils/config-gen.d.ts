export declare function generateCompose(selectedServices: string[], globalVars?: Record<string, string>): string;
export declare function generateBackupScript(selectedServices: string[], globalVars?: Record<string, string>): string;
export declare function generateEnvFile(selectedServices: string[], vars?: Record<string, string>): string;
export declare function writeOutput(outputDir: string, selectedServices: string[], globalVars: Record<string, string>): {
    compose: string;
    backup: string;
    env: string;
};
//# sourceMappingURL=config-gen.d.ts.map