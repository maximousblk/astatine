import { config } from './index';

const token_allocation_function: () => string[] = () => [];

const config: config = {
  emission_period: 600000, // E
  time_interval: 300000, // I
  initial_emit_amount: 300, // A
  decay_const: 0.0025, // k
  token_contract_id: 'fE2OcfjlS-sHqG5K8QvxE8wHtcqKxS-YV0bDEgxo-eI',
  token_allocations: ['-zkZpuG7DiIsdFzRVgWdLQ3zxU2bDY-0r90Ri8lxL-A'],
};

export default config;
