/**
 * ASME Section VIII Calculation Engine
 * Implements all required formulas for pressure vessel inspection calculations
 */

export interface CalculationInput {
  designPressure: number; // psi
  designTemperature: number; // °F
  insideDiameter: number; // inches
  allowableStress: number; // psi
  jointEfficiency: number; // 0.60-1.00
  actualThickness: number; // inches
  previousThickness?: number; // inches
  nominalThickness?: number; // inches
  corrosionAllowance?: number; // inches
  timeSpan?: number; // years between inspections
  initialThickness?: number; // inches (for long-term rate)
  totalTimeSpan?: number; // years since initial (for long-term rate)
  componentType?: 'shell' | 'head' | 'nozzle';
  headType?: 'ellipsoidal' | 'torispherical' | 'hemispherical';
}

export interface CalculationResult {
  minimumThickness: number; // inches
  calculatedMAWP: number; // psi
  corrosionRate: number; // ipy (inches per year)
  corrosionRateLT: number; // long-term rate
  corrosionRateST: number; // short-term rate
  governingRate: 'LT' | 'ST';
  governingRateReason: string;
  remainingLife: number; // years
  nextInspectionYears: number; // years
  nextInspectionDate: Date;
  isBelowMinimum: boolean;
  statusMessage: string;
}

// Minimum nominal corrosion rate when no measurable corrosion (1 mpy = 0.001 ipy)
const MIN_NOMINAL_RATE = 0.001;

// Maximum inspection interval per API 510
const MAX_INSPECTION_INTERVAL = 10;

/**
 * Calculate shell minimum thickness using ASME Section VIII formula
 * t_min = PR / (SE - 0.6P)
 */
export function calculateShellMinimumThickness(
  pressure: number,
  radius: number,
  allowableStress: number,
  jointEfficiency: number
): number {
  const denominator = (allowableStress * jointEfficiency) - (0.6 * pressure);
  if (denominator <= 0) return Infinity;
  return (pressure * radius) / denominator;
}

/**
 * Calculate head minimum thickness for 2:1 ellipsoidal heads
 * t_min = PD / (2SE - 0.2P)
 */
export function calculateEllipsoidalHeadMinimumThickness(
  pressure: number,
  diameter: number,
  allowableStress: number,
  jointEfficiency: number
): number {
  const denominator = (2 * allowableStress * jointEfficiency) - (0.2 * pressure);
  if (denominator <= 0) return Infinity;
  return (pressure * diameter) / denominator;
}

/**
 * Calculate head minimum thickness for torispherical heads
 * t_min = PLM / (2SE - 0.2P)
 * where L = crown radius, M = stress intensification factor
 */
export function calculateTorisphericalHeadMinimumThickness(
  pressure: number,
  crownRadius: number,
  allowableStress: number,
  jointEfficiency: number,
  knuckleRadius?: number
): number {
  // Default knuckle radius is 6% of crown radius
  const r = knuckleRadius || crownRadius * 0.06;
  // M factor for torispherical heads
  const M = 0.25 * (3 + Math.sqrt(crownRadius / r));
  const denominator = (2 * allowableStress * jointEfficiency) - (0.2 * pressure);
  if (denominator <= 0) return Infinity;
  return (pressure * crownRadius * M) / denominator;
}

/**
 * Calculate hemispherical head minimum thickness
 * t_min = PR / (2SE - 0.2P)
 */
export function calculateHemisphericalHeadMinimumThickness(
  pressure: number,
  radius: number,
  allowableStress: number,
  jointEfficiency: number
): number {
  const denominator = (2 * allowableStress * jointEfficiency) - (0.2 * pressure);
  if (denominator <= 0) return Infinity;
  return (pressure * radius) / denominator;
}

/**
 * Calculate shell MAWP (Maximum Allowable Working Pressure)
 * P = (SE × t) / (R + 0.6t)
 */
export function calculateShellMAWP(
  thickness: number,
  radius: number,
  allowableStress: number,
  jointEfficiency: number
): number {
  const denominator = radius + (0.6 * thickness);
  if (denominator <= 0) return 0;
  return (allowableStress * jointEfficiency * thickness) / denominator;
}

/**
 * Calculate head MAWP for 2:1 ellipsoidal heads
 * P = (2SE × t) / (D + 0.2t)
 */
export function calculateEllipsoidalHeadMAWP(
  thickness: number,
  diameter: number,
  allowableStress: number,
  jointEfficiency: number
): number {
  const denominator = diameter + (0.2 * thickness);
  if (denominator <= 0) return 0;
  return (2 * allowableStress * jointEfficiency * thickness) / denominator;
}

/**
 * Calculate hemispherical head MAWP
 * P = (2SE × t) / (R + 0.2t)
 */
export function calculateHemisphericalHeadMAWP(
  thickness: number,
  radius: number,
  allowableStress: number,
  jointEfficiency: number
): number {
  const denominator = radius + (0.2 * thickness);
  if (denominator <= 0) return 0;
  return (2 * allowableStress * jointEfficiency * thickness) / denominator;
}

/**
 * Calculate short-term corrosion rate
 * CR_ST = (t_previous - t_actual) / ΔT_recent
 */
export function calculateShortTermCorrosionRate(
  previousThickness: number,
  actualThickness: number,
  timeSpan: number
): number {
  if (timeSpan <= 0) return MIN_NOMINAL_RATE;
  const rate = (previousThickness - actualThickness) / timeSpan;
  // Handle negative rates (metal growth) - flag as anomaly but use nominal rate
  if (rate < 0) return MIN_NOMINAL_RATE;
  // Handle zero rate
  if (rate === 0) return MIN_NOMINAL_RATE;
  return rate;
}

/**
 * Calculate long-term corrosion rate
 * CR_LT = (t_initial - t_actual) / ΔT_total
 */
export function calculateLongTermCorrosionRate(
  initialThickness: number,
  actualThickness: number,
  totalTimeSpan: number
): number {
  if (totalTimeSpan <= 0) return MIN_NOMINAL_RATE;
  const rate = (initialThickness - actualThickness) / totalTimeSpan;
  if (rate < 0) return MIN_NOMINAL_RATE;
  if (rate === 0) return MIN_NOMINAL_RATE;
  return rate;
}

/**
 * Calculate remaining life
 * RL = (t_actual - t_min) / CR
 */
export function calculateRemainingLife(
  actualThickness: number,
  minimumThickness: number,
  corrosionRate: number
): number {
  if (corrosionRate <= 0) return 999; // Effectively infinite
  const corrosionAllowance = actualThickness - minimumThickness;
  if (corrosionAllowance <= 0) return 0; // Already below minimum
  return corrosionAllowance / corrosionRate;
}

/**
 * Calculate next inspection interval
 * Per API 510: lesser of 10 years or 1/2 remaining life
 */
export function calculateNextInspectionInterval(remainingLife: number): number {
  if (remainingLife <= 0) return 0;
  const halfLife = remainingLife / 2;
  return Math.min(halfLife, MAX_INSPECTION_INTERVAL);
}

/**
 * Calculate time span in years between two dates
 */
export function calculateTimeSpanYears(startDate: Date, endDate: Date): number {
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
  return (endDate.getTime() - startDate.getTime()) / msPerYear;
}

/**
 * Detect anomalies in thickness readings
 * Flag if reading differs by >20% from previous
 */
export function detectAnomaly(
  currentThickness: number,
  previousThickness: number
): { isAnomaly: boolean; reason: string } {
  if (!previousThickness || previousThickness <= 0) {
    return { isAnomaly: false, reason: '' };
  }
  
  const percentChange = Math.abs((currentThickness - previousThickness) / previousThickness) * 100;
  
  if (currentThickness > previousThickness) {
    return {
      isAnomaly: true,
      reason: `Metal growth detected: ${percentChange.toFixed(1)}% increase from previous reading`
    };
  }
  
  if (percentChange > 20) {
    return {
      isAnomaly: true,
      reason: `Anomaly: ${percentChange.toFixed(1)}% change from previous reading - confirm measurement`
    };
  }
  
  return { isAnomaly: false, reason: '' };
}

/**
 * Calculate de-rated MAWP when below minimum thickness
 */
export function calculateDeratedMAWP(
  actualThickness: number,
  radius: number,
  allowableStress: number,
  jointEfficiency: number,
  componentType: 'shell' | 'head' = 'shell'
): number {
  if (componentType === 'shell') {
    return calculateShellMAWP(actualThickness, radius, allowableStress, jointEfficiency);
  } else {
    return calculateEllipsoidalHeadMAWP(actualThickness, radius * 2, allowableStress, jointEfficiency);
  }
}

/**
 * Main calculation function - performs all calculations for a component
 */
export function performComponentCalculations(input: CalculationInput): CalculationResult {
  const radius = input.insideDiameter / 2;
  const diameter = input.insideDiameter;
  
  // Calculate minimum thickness based on component type
  let minimumThickness: number;
  if (input.componentType === 'head') {
    if (input.headType === 'hemispherical') {
      minimumThickness = calculateHemisphericalHeadMinimumThickness(
        input.designPressure, radius, input.allowableStress, input.jointEfficiency
      );
    } else if (input.headType === 'torispherical') {
      minimumThickness = calculateTorisphericalHeadMinimumThickness(
        input.designPressure, diameter, input.allowableStress, input.jointEfficiency
      );
    } else {
      // Default to ellipsoidal (2:1)
      minimumThickness = calculateEllipsoidalHeadMinimumThickness(
        input.designPressure, diameter, input.allowableStress, input.jointEfficiency
      );
    }
  } else {
    // Shell or nozzle
    minimumThickness = calculateShellMinimumThickness(
      input.designPressure, radius, input.allowableStress, input.jointEfficiency
    );
  }
  
  // Calculate MAWP based on component type
  let calculatedMAWP: number;
  if (input.componentType === 'head') {
    if (input.headType === 'hemispherical') {
      calculatedMAWP = calculateHemisphericalHeadMAWP(
        input.actualThickness, radius, input.allowableStress, input.jointEfficiency
      );
    } else {
      calculatedMAWP = calculateEllipsoidalHeadMAWP(
        input.actualThickness, diameter, input.allowableStress, input.jointEfficiency
      );
    }
  } else {
    calculatedMAWP = calculateShellMAWP(
      input.actualThickness, radius, input.allowableStress, input.jointEfficiency
    );
  }
  
  // Calculate corrosion rates
  const timeSpan = input.timeSpan || 10;
  const totalTimeSpan = input.totalTimeSpan || timeSpan;
  const previousThickness = input.previousThickness || input.nominalThickness || input.actualThickness;
  const initialThickness = input.initialThickness || input.nominalThickness || previousThickness;
  
  const corrosionRateST = calculateShortTermCorrosionRate(
    previousThickness, input.actualThickness, timeSpan
  );
  
  const corrosionRateLT = calculateLongTermCorrosionRate(
    initialThickness, input.actualThickness, totalTimeSpan
  );
  
  // Determine governing rate (use the higher rate for conservative estimate)
  let governingRate: 'LT' | 'ST';
  let governingRateReason: string;
  let corrosionRate: number;
  
  if (corrosionRateLT >= corrosionRateST) {
    governingRate = 'LT';
    corrosionRate = corrosionRateLT;
    governingRateReason = 'Long-term rate is higher - indicates sustained corrosion';
  } else {
    governingRate = 'ST';
    corrosionRate = corrosionRateST;
    governingRateReason = 'Short-term rate is higher - indicates accelerated recent corrosion';
  }
  
  // Calculate remaining life
  const remainingLife = calculateRemainingLife(input.actualThickness, minimumThickness, corrosionRate);
  
  // Calculate next inspection interval
  const nextInspectionYears = calculateNextInspectionInterval(remainingLife);
  
  // Calculate next inspection date
  const nextInspectionDate = new Date();
  nextInspectionDate.setFullYear(nextInspectionDate.getFullYear() + Math.floor(nextInspectionYears));
  
  // Check if below minimum thickness
  const isBelowMinimum = input.actualThickness < minimumThickness;
  
  // Generate status message
  let statusMessage: string;
  if (isBelowMinimum) {
    statusMessage = 'UNSAFE - BELOW MINIMUM THICKNESS';
  } else if (remainingLife < 2) {
    statusMessage = 'CRITICAL - Less than 2 years remaining life';
  } else if (remainingLife < 5) {
    statusMessage = 'WARNING - Less than 5 years remaining life';
  } else {
    statusMessage = 'ACCEPTABLE';
  }
  
  return {
    minimumThickness: Math.round(minimumThickness * 1000) / 1000,
    calculatedMAWP: Math.round(calculatedMAWP * 10) / 10,
    corrosionRate: Math.round(corrosionRate * 10000) / 10000,
    corrosionRateLT: Math.round(corrosionRateLT * 10000) / 10000,
    corrosionRateST: Math.round(corrosionRateST * 10000) / 10000,
    governingRate,
    governingRateReason,
    remainingLife: Math.round(remainingLife * 10) / 10,
    nextInspectionYears: Math.round(nextInspectionYears * 10) / 10,
    nextInspectionDate,
    isBelowMinimum,
    statusMessage,
  };
}

/**
 * Calculate nozzle minimum thickness per ASME B31.3
 * Uses pipe schedule tables for standard sizes
 */
export function calculateNozzleMinimumThickness(
  pressure: number,
  nozzleSize: string, // e.g., "2", "3", "24"
  allowableStress: number,
  jointEfficiency: number = 1.0
): number {
  // Parse nozzle size (remove " if present)
  const sizeNum = parseFloat(nozzleSize.replace('"', ''));
  
  // Approximate OD based on nominal pipe size (NPS)
  const odTable: Record<number, number> = {
    0.5: 0.840, 0.75: 1.050, 1: 1.315, 1.25: 1.660, 1.5: 1.900,
    2: 2.375, 2.5: 2.875, 3: 3.500, 4: 4.500, 6: 6.625,
    8: 8.625, 10: 10.750, 12: 12.750, 14: 14.000, 16: 16.000,
    18: 18.000, 20: 20.000, 24: 24.000, 30: 30.000, 36: 36.000
  };
  
  const od = odTable[sizeNum] || sizeNum + 0.375; // Default approximation
  const radius = od / 2;
  
  // Use shell formula for nozzle
  return calculateShellMinimumThickness(pressure, radius, allowableStress, jointEfficiency);
}
