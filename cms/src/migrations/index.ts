import * as migration_20261009_074209_initial from './20261009_074209_initial';

export const migrations = [
  {
    up: migration_20261009_074209_initial.up,
    down: migration_20261009_074209_initial.down,
    name: '20261009_074209_initial'
  },
];
