import type { Config } from 'jest';
const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: { 
    '^(.*)\\.js$': '$1',
    '^ipaddr\\.js$': 'ipaddr.js'
  },
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true
    }]
  }
};
export default config;
