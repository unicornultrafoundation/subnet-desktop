
import * as childProcess from '../utils/childProcess';
import stream from 'stream';

export type BackendProgress = {
    /** The current progress; valid values are 0 to max. */
    current: number,
    /** Maximum progress possible; if less than zero, the progress is indeterminate. */
    max: number,
    /** Details on the current action. */
    description?: string,
    /** When we entered this progress state. */
    transitionTime?: Date,
};

export class BackendError extends Error {
    constructor(name: string, message: string, fatal = false) {
        super(message);
        this.name = name;
        this.fatal = fatal;
    }

    readonly fatal: boolean;
}

export type Architecture = 'x86_64' | 'aarch64';

export type FailureDetails = {
    /** The last lima/wsl command run: */
    lastCommand?: string,
    lastCommandComment: string,
    lastLogLines: Array<string>,
};

export enum State {
    STOPPED = 'STOPPED', // The engine is not running.
    STARTING = 'STARTING', // The engine is attempting to start.
    STARTED = 'STARTED', // The engine is started; the dashboard is not yet ready.
    STOPPING = 'STOPPING', // The engine is attempting to stop.
    ERROR = 'ERROR', // There is an error and we cannot recover automatically.
    DISABLED = 'DISABLED', // The container backend is ready but the Kubernetes engine is disabled.
}

/**
 * KubernetesBackendEvents describes the events that may be emitted by a
 * Kubernetes backend (as an EventEmitter).  Each property name is the name of
 * an event, and the property type is the type of the callback function expected
 * for the given event.
 */
export interface BackendEvents {
    /**
     * Emitted when there has been a change in the progress in the current action.
     * The progress can be read off the `progress` member on the backend.
     */
    'progress'(): void;
  
    /**
     * Emitted when the state of the backend has changed.
     */
    'state-changed'(state: State): void;
  
    /**
     * Show a notification to the user.
     */
    'show-notification'(options: Electron.NotificationConstructorOptions): void;
}
  
/**
 * execOptions is options for VMExecutor.
 */
export type execOptions = childProcess.CommonOptions & {
    /** Expect the command to fail; do not log on error.  Exceptions are still thrown. */
    expectFailure?: boolean;
    /** A custom log stream to write to; must have a file descriptor. */
    logStream?: stream.Writable;
    /**
     * If set, ensure that the command is run as the privileged user.
     * @note The command is always run as root on WSL.
     */
    root?: boolean;
  };