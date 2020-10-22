import { config } from './index';

const token_allocation_function: () => string[] = () => [];

const config: config = {
  emission_period: 0, // E
  time_interval: 0, // I
  initial_emit_amount: 0, // A
  decay_const: 0, // k
  token_contract_id: '',
  token_allocations: token_allocation_function(),
};

export default config;
