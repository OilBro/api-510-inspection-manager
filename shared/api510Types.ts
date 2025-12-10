// API 510 Inspection specific types

export interface ParsedVesselData {
  // Vessel identification
  vesselTagNumber?: string;
  vesselName?: string;
  manufacturer?: string;
  serialNumber?: string;
  yearBuilt?: string;
  nationalBoardNumber?: string;
  
  // Design parameters
  designPressure?: number;
  designTemperature?: number;
  mawp?: number;
  mdmt?: number;
  operatingPressure?: number;
  operatingTemperature?: number;
  
  // Material specifications
  materialSpec?: string;
  allowableStress?: number;
  jointEfficiency?: number;
  radiographyType?: string;
  
  // Vessel geometry
  insideDiameter?: number;
  shellLength?: number;
  nominalThickness?: number;
  corrosionAllowance?: number;
  
  // Vessel configuration
  vesselOrientation?: string;
  headType?: string;
  constructionCode?: string;
  vesselConfiguration?: string;
  insulationType?: string;
  
  // Service information
  productService?: string;
  specificGravity?: number;
  
  // Inspection details
  inspectionDate?: string;
  previousInspectionDate?: string;
  inspectorName?: string;
  clientName?: string;
  reportNumber?: string;
  
  // TML readings
  tmlReadings?: ParsedTmlReading[];
  
  // Nozzles
  nozzles?: ParsedNozzle[];
  
  // Findings and recommendations
  findings?: string[];
  recommendations?: string[];
}

export interface ParsedTmlReading {
  cmlNumber?: string;
  tmlId?: string;
  location?: string;
  componentType?: string;
  readingType?: string;
  nozzleSize?: string;
  angle?: string;
  tml1?: number;
  tml2?: number;
  tml3?: number;
  tml4?: number;
  nominalThickness?: number;
  previousThickness?: number;
  actualThickness?: number;
  minimumThickness?: number;
}

export interface ParsedNozzle {
  nozzleId?: string;
  cmlNumber?: string;
  serviceType?: string;
  size?: string;
  schedule?: string;
  materialSpec?: string;
  nominalThickness?: number;
  previousThickness?: number;
  actualThickness?: number;
}

export interface ComponentCalculationData {
  componentName: string;
  componentType: 'shell' | 'east_head' | 'west_head';
  designPressure: number;
  designTemperature: number;
  insideDiameter: number;
  materialSpec: string;
  allowableStress: number;
  jointEfficiency: number;
  nominalThickness: number;
  previousThickness: number;
  actualThickness: number;
  minimumThickness: number;
  calculatedMAWP: number;
  corrosionRate: number;
  corrosionRateLT: number;
  corrosionRateST: number;
  governingRate: 'LT' | 'ST';
  remainingLife: number;
  nextInspectionYears: number;
  timeSpan: number;
  isBelowMinimum: boolean;
  statusMessage: string;
}

export interface ValidationComparison {
  field: string;
  pdfValue: number | string;
  calculatedValue: number | string;
  discrepancy: number;
  status: 'match' | 'minor' | 'major';
}

export interface ValidationResult {
  componentName: string;
  componentType: string;
  comparisons: ValidationComparison[];
  overallStatus: 'pass' | 'warning' | 'fail';
}

export const COMPONENT_TYPES = ['shell', 'east_head', 'west_head', 'nozzle'] as const;
export type ComponentType = typeof COMPONENT_TYPES[number];

export const HEAD_TYPES = ['ellipsoidal', 'torispherical', 'hemispherical'] as const;
export type HeadType = typeof HEAD_TYPES[number];

export const RADIOGRAPHY_TYPES = ['RT-1', 'RT-2', 'RT-3', 'RT-4'] as const;
export type RadiographyType = typeof RADIOGRAPHY_TYPES[number];

export const JOINT_EFFICIENCY_MAP: Record<RadiographyType, number> = {
  'RT-1': 1.0,
  'RT-2': 0.85,
  'RT-3': 0.70,
  'RT-4': 0.60,
};

export const INSPECTION_STATUS = ['draft', 'in_progress', 'completed', 'archived'] as const;
export type InspectionStatus = typeof INSPECTION_STATUS[number];

export const FINDING_SEVERITY = ['critical', 'major', 'minor', 'observation'] as const;
export type FindingSeverity = typeof FINDING_SEVERITY[number];

export const RECOMMENDATION_PRIORITY = ['immediate', 'high', 'medium', 'low'] as const;
export type RecommendationPriority = typeof RECOMMENDATION_PRIORITY[number];

export const PHOTO_CATEGORIES = ['shell', 'heads', 'nozzles', 'foundation', 'general'] as const;
export type PhotoCategory = typeof PHOTO_CATEGORIES[number];

export const MATERIAL_CATEGORIES = [
  'carbon_steel',
  'stainless_steel',
  'chrome_moly',
  'low_temp',
  'pipe_forged',
] as const;
export type MaterialCategory = typeof MATERIAL_CATEGORIES[number];

// Nozzle service types for automatic detection
export const NOZZLE_SERVICE_TYPES = [
  'Manway',
  'Relief',
  'Vapor Out',
  'Vapor In',
  'Sight Gauge',
  'Reactor Feed',
  'Gauge',
  'Drain',
  'Inlet',
  'Outlet',
  'Vent',
  'Sample',
] as const;
export type NozzleServiceType = typeof NOZZLE_SERVICE_TYPES[number];
