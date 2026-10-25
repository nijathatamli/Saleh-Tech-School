/** "845 KB", "3.2 MB": for file lists in the dashboards (pure, usable in client code). */
export const formatSize = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
