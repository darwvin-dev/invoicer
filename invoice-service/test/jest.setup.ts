import { jest } from "@jest/globals";

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

jest.mock("@/config/rabbit", () => ({
  publishJson: jest.fn(async () => undefined),
}));
