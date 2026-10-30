import { describe, expect, it } from "vitest";
import { hojeEmBoaVista } from "./data-boa-vista.js";

describe("hojeEmBoaVista", () => {
  it("ainda é o mesmo dia às 23h59 de Boa Vista, quando em UTC já é o dia seguinte", () => {
    expect(hojeEmBoaVista(new Date("2026-10-30T03:59:00Z")).toISOString()).toBe("2026-10-29T00:00:00.000Z");
  });

  it("vira o dia à meia-noite de Boa Vista (04h UTC)", () => {
    expect(hojeEmBoaVista(new Date("2026-10-30T04:00:00Z")).toISOString()).toBe("2026-10-30T00:00:00.000Z");
  });
});
