declare module 'nprogress' {
  const NProgress: {
    configure: (settings?: Record<string, unknown>) => void;

    start: () => void;
    done: () => void;
  };
  export default NProgress;
}

