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

export type { backend_log_entries, config };
