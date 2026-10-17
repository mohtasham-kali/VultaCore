declare module 'nprogress' {
  interface NProgressOptions {
    minimum?: number;
    template?: string;
    easing?: string;
    speed?: number;
    trickle?: boolean;
    trickleSpeed?: number;
    showSpinner?: boolean;
    parent?: string;
  }

  interface NProgress {
    configure(options?: Partial<NProgressOptions>): NProgress;
    start(): NProgress;
    done(force?: boolean): NProgress;
    set(n: number): NProgress;
    inc(amount?: number): NProgress;
    remove(): void;
    status: number | null;
    isStarted(): boolean;
  }

  const NProgress: NProgress;
  export default NProgress;
}
