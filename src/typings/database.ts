interface backend_log_entries {
  timestamp: string;
  level: string;
  message: string;
  file: string;
  line: number;
}

interface config {
  polling_rate: number;
  keep_data_for: number;
  fetching_interval: number;
}
interface stacks_config {
  name: string;
  version: number;
  custom: boolean;
  source: string;
  container_count: number;
  stack_prefix: string;
  automatic_reboot_on_error: boolean;
  image_updates: boolean;
}

export type { backend_log_entries, config, stacks_config };
