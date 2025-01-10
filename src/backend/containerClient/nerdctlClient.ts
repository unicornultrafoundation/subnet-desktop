import { Log } from "@utils/logging";
import { ContainerBasicOptions, ContainerComposeExecOptions, ContainerComposeOptions, ContainerComposePortOptions, ContainerEngineClient, ContainerRunClientOptions, ContainerRunOptions, ContainerStopOptions, ReadableProcess } from "./types";
import { VMExecutor } from "../backend";
import { executable } from '../../utils/resources';
import util from 'util';


/**
 * NerdctlClient manages nerdctl/containerd.
 */
export class NerdctlClient implements ContainerEngineClient {

    /** The VM backing subnet Desktop */
    readonly vm: VMExecutor;
    readonly executable = executable('nerdctl');

    constructor(vm: VMExecutor) {
        this.vm = vm;
    }

    async waitForReady(): Promise<void> {
        // We need to check two things: containerd, and buildkitd.
        const commandsToCheck = [
            ['/usr/local/bin/nerdctl', 'system', 'info'],
        ];

        for (const cmd of commandsToCheck) {
            while (true) {
                try {
                    await this.vm.execCommand({ expectFailure: true, root: true }, ...cmd);
                    break;
                } catch (ex) {
                    // Ignore the error, try again
                    await util.promisify(setTimeout)(1_000);
                }
            }
        }
    }

    readFile(imageID: string, filePath: string): Promise<string>;
    readFile(imageID: string, filePath: string, options: { encoding?: BufferEncoding; namespace?: string; }): Promise<string>;
    readFile(_imageID: unknown, _filePath: unknown, _options?: unknown): Promise<string> {
        throw new Error("Method not implemented.");
    }
    copyFile(imageID: string, sourcePath: string, destinationDir: string): Promise<void>;
    copyFile(imageID: string, sourcePath: string, destinationDir: string, options: { namespace?: string; }): Promise<void>;
    copyFile(_imageID: unknown, _sourcePath: unknown, _destinationDir: unknown, _options?: unknown): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getTags(_imageName: string, _options?: ContainerBasicOptions): Promise<Set<string>> {
        throw new Error("Method not implemented.");
    }
    run(_imageID: string, _options?: ContainerRunOptions): Promise<string> {
        throw new Error("Method not implemented.");
    }
    stop(_container: string, _options?: ContainerStopOptions): Promise<void> {
        throw new Error("Method not implemented.");
    }
    composeUp(_options: ContainerComposeOptions): Promise<void> {
        throw new Error("Method not implemented.");
    }
    composeDown(_options?: ContainerComposeOptions): Promise<void> {
        throw new Error("Method not implemented.");
    }
    composeExec(_options: ContainerComposeExecOptions): Promise<ReadableProcess> {
        throw new Error("Method not implemented.");
    }
    composePort(_options: ContainerComposePortOptions): Promise<string> {
        throw new Error("Method not implemented.");
    }
    runClient(args: string[], stdio?: "ignore", options?: ContainerRunClientOptions): Promise<Record<string, never>>;
    runClient(args: string[], stdio: Log, options?: ContainerRunClientOptions): Promise<Record<string, never>>;
    runClient(args: string[], stdio: "pipe", options?: ContainerRunClientOptions): Promise<{ stdout: string; stderr: string; }>;
    runClient(args: string[], stdio: "stream", options?: ContainerRunClientOptions): ReadableProcess;
    runClient(_args: unknown, _stdio?: unknown, _options?: unknown): Promise<Record<string, never>> | import("./types").ReadableProcess | Promise<{ stdout: string; stderr: string; }> {
        throw new Error("Method not implemented.");
    }

}