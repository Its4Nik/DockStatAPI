import type Docker from "dockerode";

const calculateCpuPercent = (stats: Docker.ContainerStats): number => {
  const cpuDelta =
    stats.cpu_stats.cpu_usage.total_usage -
    stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta =
    stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  return (cpuDelta / systemDelta) * 100;
};

const calculateMemoryUsage = (stats: Docker.ContainerStats): number => {
  return (stats.memory_stats.usage / stats.memory_stats.limit) * 100;
};

export { calculateCpuPercent, calculateMemoryUsage };
