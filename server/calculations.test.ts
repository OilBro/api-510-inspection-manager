import { describe, expect, it } from "vitest";
import {
  calculateShellMinimumThickness,
  calculateEllipsoidalHeadMinimumThickness,
  calculateHemisphericalHeadMinimumThickness,
  calculateShellMAWP,
  calculateEllipsoidalHeadMAWP,
  calculateHemisphericalHeadMAWP,
  calculateShortTermCorrosionRate,
  calculateLongTermCorrosionRate,
  calculateRemainingLife,
  calculateNextInspectionInterval,
} from "./calculations";

describe("ASME Section VIII Calculations", () => {
  describe("calculateShellMinimumThickness", () => {
    it("calculates minimum thickness for cylindrical shell correctly", () => {
      // Example: 48" ID (24" radius), 150 psi, 20000 psi allowable stress, 0.85 joint efficiency
      // t = PR / (SE - 0.6P) = (150 * 24) / (20000 * 0.85 - 0.6 * 150)
      // t = 3600 / (17000 - 90) = 3600 / 16910 = 0.2129"
      const result = calculateShellMinimumThickness(150, 24, 20000, 0.85);
      expect(result).toBeCloseTo(0.2129, 3);
    });
    
    it("handles zero pressure", () => {
      const result = calculateShellMinimumThickness(0, 24, 20000, 0.85);
      expect(result).toBe(0);
    });
    
    it("returns Infinity when denominator is zero or negative", () => {
      // When SE <= 0.6P, denominator becomes zero or negative
      // P = 35000, S = 20000, E = 0.85 => SE = 17000, 0.6P = 21000
      const result = calculateShellMinimumThickness(35000, 24, 20000, 0.85);
      expect(result).toBe(Infinity);
    });
  });
  
  describe("calculateEllipsoidalHeadMinimumThickness", () => {
    it("calculates minimum thickness for 2:1 ellipsoidal head correctly", () => {
      // t = PD / (2SE - 0.2P)
      // t = (150 * 48) / (2 * 20000 * 0.85 - 0.2 * 150)
      // t = 7200 / (34000 - 30) = 7200 / 33970 = 0.2120"
      const result = calculateEllipsoidalHeadMinimumThickness(150, 48, 20000, 0.85);
      expect(result).toBeCloseTo(0.212, 2);
    });
  });
  
  describe("calculateHemisphericalHeadMinimumThickness", () => {
    it("calculates minimum thickness for hemispherical head correctly", () => {
      // t = PR / (2SE - 0.2P)
      // t = (150 * 24) / (2 * 20000 * 0.85 - 0.2 * 150)
      // t = 3600 / (34000 - 30) = 3600 / 33970 = 0.1060"
      const result = calculateHemisphericalHeadMinimumThickness(150, 24, 20000, 0.85);
      expect(result).toBeCloseTo(0.106, 2);
    });
  });
  
  describe("calculateShellMAWP", () => {
    it("calculates MAWP for cylindrical shell correctly", () => {
      // P = (SE × t) / (R + 0.6t)
      // P = (20000 * 0.85 * 0.25) / (24 + 0.6 * 0.25)
      // P = 4250 / 24.15 = 175.98 psi
      const result = calculateShellMAWP(0.25, 24, 20000, 0.85);
      expect(result).toBeCloseTo(176, 0);
    });
    
    it("returns 0 for zero thickness", () => {
      const result = calculateShellMAWP(0, 24, 20000, 0.85);
      expect(result).toBe(0);
    });
  });
  
  describe("calculateEllipsoidalHeadMAWP", () => {
    it("calculates MAWP for ellipsoidal head correctly", () => {
      // P = (2SE × t) / (D + 0.2t)
      // P = (2 * 20000 * 0.85 * 0.25) / (48 + 0.2 * 0.25)
      // P = 8500 / 48.05 = 176.90 psi
      const result = calculateEllipsoidalHeadMAWP(0.25, 48, 20000, 0.85);
      expect(result).toBeCloseTo(177, 0);
    });
  });
  
  describe("calculateHemisphericalHeadMAWP", () => {
    it("calculates MAWP for hemispherical head correctly", () => {
      // P = (2SE × t) / (R + 0.2t)
      // P = (2 * 20000 * 0.85 * 0.25) / (24 + 0.2 * 0.25)
      // P = 8500 / 24.05 = 353.43 psi
      const result = calculateHemisphericalHeadMAWP(0.25, 24, 20000, 0.85);
      expect(result).toBeCloseTo(353, 0);
    });
  });
  
  describe("calculateShortTermCorrosionRate", () => {
    it("calculates short-term corrosion rate correctly", () => {
      // CR = (previous - current) / years
      const result = calculateShortTermCorrosionRate(0.400, 0.375, 5);
      // CR = (0.400 - 0.375) / 5 = 0.025 / 5 = 0.005 ipy
      expect(result).toBeCloseTo(0.005, 4);
    });
    
    it("returns minimum nominal rate for zero time span", () => {
      const result = calculateShortTermCorrosionRate(0.400, 0.375, 0);
      expect(result).toBe(0.001); // MIN_NOMINAL_RATE
    });
    
    it("returns minimum nominal rate for negative corrosion (thickness increase)", () => {
      const result = calculateShortTermCorrosionRate(0.375, 0.400, 5);
      expect(result).toBe(0.001); // MIN_NOMINAL_RATE
    });
  });
  
  describe("calculateLongTermCorrosionRate", () => {
    it("calculates long-term corrosion rate correctly", () => {
      // CR = (initial - current) / years
      const result = calculateLongTermCorrosionRate(0.500, 0.375, 25);
      // CR = (0.500 - 0.375) / 25 = 0.125 / 25 = 0.005 ipy
      expect(result).toBeCloseTo(0.005, 4);
    });
    
    it("returns minimum nominal rate for zero time span", () => {
      const result = calculateLongTermCorrosionRate(0.500, 0.375, 0);
      expect(result).toBe(0.001); // MIN_NOMINAL_RATE
    });
  });
  
  describe("calculateRemainingLife", () => {
    it("calculates remaining life correctly", () => {
      // RL = (current - minimum) / corrosionRate
      const result = calculateRemainingLife(0.375, 0.200, 0.005);
      // RL = (0.375 - 0.200) / 0.005 = 0.175 / 0.005 = 35 years
      expect(result).toBeCloseTo(35, 1);
    });
    
    it("returns 999 (effectively infinite) for zero corrosion rate", () => {
      const result = calculateRemainingLife(0.375, 0.200, 0);
      expect(result).toBe(999);
    });
    
    it("returns 0 when current thickness is at or below minimum", () => {
      const result = calculateRemainingLife(0.200, 0.200, 0.005);
      expect(result).toBe(0);
    });
    
    it("returns 0 when below minimum", () => {
      const result = calculateRemainingLife(0.180, 0.200, 0.005);
      expect(result).toBe(0);
    });
  });
  
  describe("calculateNextInspectionInterval", () => {
    it("calculates next inspection interval as half of remaining life", () => {
      const result = calculateNextInspectionInterval(20);
      // Next interval = RL / 2 = 20 / 2 = 10 years
      expect(result).toBe(10);
    });
    
    it("caps maximum interval at 10 years per API 510", () => {
      const result = calculateNextInspectionInterval(50);
      // 50 / 2 = 25, but capped at 10
      expect(result).toBe(10);
    });
    
    it("returns half of remaining life for short remaining life", () => {
      const result = calculateNextInspectionInterval(1);
      // 1 / 2 = 0.5 years
      expect(result).toBe(0.5);
    });
    
    it("returns 0 for zero or negative remaining life", () => {
      const result = calculateNextInspectionInterval(0);
      expect(result).toBe(0);
    });
  });
});

describe("Edge Cases and Validation", () => {
  it("handles very high pressures correctly", () => {
    const result = calculateShellMinimumThickness(3000, 24, 20000, 1.0);
    // High pressure should result in thicker wall
    expect(result).toBeGreaterThan(2);
  });
  
  it("handles very large vessels correctly", () => {
    const result = calculateShellMinimumThickness(150, 120, 20000, 0.85);
    // Large vessel (240" ID = 120" radius) should have proportionally thicker wall
    expect(result).toBeGreaterThan(1);
  });
  
  it("validates that MAWP decreases as thickness decreases", () => {
    const mawp1 = calculateShellMAWP(0.500, 24, 20000, 0.85);
    const mawp2 = calculateShellMAWP(0.375, 24, 20000, 0.85);
    expect(mawp1).toBeGreaterThan(mawp2);
  });
  
  it("validates remaining life decreases with higher corrosion rate", () => {
    const rl1 = calculateRemainingLife(0.375, 0.200, 0.005);
    const rl2 = calculateRemainingLife(0.375, 0.200, 0.010);
    expect(rl1).toBeGreaterThan(rl2);
  });
  
  it("validates shell is thicker than hemispherical head for same conditions", () => {
    // Hemispherical heads are more efficient, so they need less thickness
    const shellT = calculateShellMinimumThickness(150, 24, 20000, 0.85);
    const hemiT = calculateHemisphericalHeadMinimumThickness(150, 24, 20000, 0.85);
    expect(shellT).toBeGreaterThan(hemiT);
  });
  
  it("validates ellipsoidal head MAWP is similar to shell MAWP", () => {
    // For same thickness and diameter, ellipsoidal head should have similar MAWP
    const shellMAWP = calculateShellMAWP(0.25, 24, 20000, 0.85);
    const headMAWP = calculateEllipsoidalHeadMAWP(0.25, 48, 20000, 0.85);
    // They should be within 10% of each other
    expect(Math.abs(shellMAWP - headMAWP) / shellMAWP).toBeLessThan(0.1);
  });
});
