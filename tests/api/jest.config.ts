import type { Config } from "jest";
import baseConfig from "../../apps/api/jest.config";

const config: Config = {
  ...baseConfig,
  roots: ["<rootDir>/../../apps/api/tests"],
};

export default config;
