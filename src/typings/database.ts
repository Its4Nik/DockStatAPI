interface backend_log_entries {
  timestamp: string;
  level: string;
  message: string;
  file: string;
  line: number;
}

interface config {
  polling_rate: number;
}

export type { backend_log_entries, config };
