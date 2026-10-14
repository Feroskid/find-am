import { describe, it, expect } from "vitest";
import { displayTaskStatus } from "./task-status";
import { MIN_TASK_BUDGET } from "./fees";

describe("dispute outcome status", () => {
  it("full refund to poster shows cancelled", () => {
    expect(displayTaskStatus({ status: "disputed", dispute: { resolution: "refund_employer" } })).toBe("cancelled");
  });
  it("split shows completed", () => {
    expect(displayTaskStatus({ status: "disputed", resolution: "split" })).toBe("completed");
  });
  it("no dispute keeps status", () => {
    expect(displayTaskStatus({ status: "open" })).toBe("open");
  });
});

describe("minimum budget", () => {
  it("is 1000 naira", () => expect(MIN_TASK_BUDGET).toBe(1000));
});
