import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

// Core user table backing auth flow
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Main inspections table with comprehensive vessel data
export const inspections = mysqlTable("inspections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Vessel identification
  vesselTagNumber: varchar("vesselTagNumber", { length: 64 }),
  vesselName: varchar("vesselName", { length: 255 }),
  manufacturer: varchar("manufacturer", { length: 255 }),
  serialNumber: varchar("serialNumber", { length: 128 }),
  yearBuilt: varchar("yearBuilt", { length: 10 }),
  nationalBoardNumber: varchar("nationalBoardNumber", { length: 64 }),
  
  // Design parameters
  designPressure: int("designPressure"), // psi
  designTemperature: int("designTemperature"), // °F
  mawp: int("mawp"), // psi - Maximum Allowable Working Pressure
  mdmt: int("mdmt"), // °F - Minimum Design Metal Temperature
  operatingPressure: int("operatingPressure"), // psi
  operatingTemperature: int("operatingTemperature"), // °F
  
  // Material specifications
  materialSpec: varchar("materialSpec", { length: 128 }),
  allowableStress: int("allowableStress"), // psi
  jointEfficiency: varchar("jointEfficiency", { length: 10 }), // 0.60-1.00
  radiographyType: varchar("radiographyType", { length: 10 }), // RT-1, RT-2, RT-3, RT-4
  
  // Vessel geometry
  insideDiameter: varchar("insideDiameter", { length: 32 }), // inches
  shellLength: varchar("shellLength", { length: 32 }), // inches
  nominalThickness: varchar("nominalThickness", { length: 32 }), // inches
  corrosionAllowance: varchar("corrosionAllowance", { length: 32 }), // inches
  
  // Vessel configuration
  vesselOrientation: varchar("vesselOrientation", { length: 32 }), // horizontal, vertical
  headType: varchar("headType", { length: 64 }), // ellipsoidal, torispherical, hemispherical
  constructionCode: varchar("constructionCode", { length: 64 }),
  vesselConfiguration: varchar("vesselConfiguration", { length: 64 }),
  insulationType: varchar("insulationType", { length: 64 }),
  
  // Service information
  productService: varchar("productService", { length: 128 }),
  specificGravity: varchar("specificGravity", { length: 16 }),
  
  // Inspection details
  inspectionDate: timestamp("inspectionDate"),
  previousInspectionDate: timestamp("previousInspectionDate"),
  nextInspectionDate: timestamp("nextInspectionDate"),
  inspectorName: varchar("inspectorName", { length: 128 }),
  clientName: varchar("clientName", { length: 255 }),
  reportNumber: varchar("reportNumber", { length: 64 }),
  
  // Status
  status: mysqlEnum("status", ["draft", "in_progress", "completed", "archived"]).default("draft").notNull(),
  
  // Linking for inspection history
  previousInspectionId: int("previousInspectionId"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = typeof inspections.$inferInsert;

// TML (Thickness Measurement Location) readings
export const tmlReadings = mysqlTable("tmlReadings", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspectionId").notNull(),
  
  // CML identification
  cmlNumber: varchar("cmlNumber", { length: 32 }),
  tmlId: varchar("tmlId", { length: 64 }),
  location: varchar("location", { length: 255 }),
  componentType: varchar("componentType", { length: 64 }), // shell, east_head, west_head, nozzle
  
  // Reading type and classification
  readingType: varchar("readingType", { length: 32 }), // nozzle, seam, spot, general
  nozzleSize: varchar("nozzleSize", { length: 16 }), // 24", 3", 2", 1"
  angle: varchar("angle", { length: 16 }), // 0°, 90°, 180°, 270°
  
  // Multi-angle thickness measurements (inches)
  tml1: varchar("tml1", { length: 16 }),
  tml2: varchar("tml2", { length: 16 }),
  tml3: varchar("tml3", { length: 16 }),
  tml4: varchar("tml4", { length: 16 }),
  
  // Calculated/derived values
  nominalThickness: varchar("nominalThickness", { length: 16 }),
  previousThickness: varchar("previousThickness", { length: 16 }),
  actualThickness: varchar("actualThickness", { length: 16 }), // minimum of tml1-4
  minimumThickness: varchar("minimumThickness", { length: 16 }),
  
  // Data quality flags
  isAnomaly: boolean("isAnomaly").default(false),
  anomalyReason: varchar("anomalyReason", { length: 255 }),
  excludeFromCalculation: boolean("excludeFromCalculation").default(false),
  
  status: varchar("status", { length: 32 }).default("good"),
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TmlReading = typeof tmlReadings.$inferSelect;
export type InsertTmlReading = typeof tmlReadings.$inferInsert;

// Component calculations for shell, heads, etc.
export const componentCalculations = mysqlTable("componentCalculations", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("reportId").notNull(),
  inspectionId: int("inspectionId").notNull(),
  
  // Component identification
  componentName: varchar("componentName", { length: 128 }),
  componentType: varchar("componentType", { length: 64 }), // shell, east_head, west_head
  
  // Hierarchy for component tree
  parentComponentId: int("parentComponentId"),
  componentPath: varchar("componentPath", { length: 255 }),
  hierarchyLevel: int("hierarchyLevel").default(0),
  
  // Input parameters
  designPressure: int("designPressure"),
  designTemperature: int("designTemperature"),
  insideDiameter: varchar("insideDiameter", { length: 32 }),
  materialSpec: varchar("materialSpec", { length: 128 }),
  allowableStress: int("allowableStress"),
  jointEfficiency: varchar("jointEfficiency", { length: 10 }),
  
  // Thickness values
  nominalThickness: varchar("nominalThickness", { length: 16 }),
  previousThickness: varchar("previousThickness", { length: 16 }),
  actualThickness: varchar("actualThickness", { length: 16 }),
  minimumThickness: varchar("minimumThickness", { length: 16 }),
  
  // Calculated values
  calculatedMAWP: int("calculatedMAWP"),
  designMAWP: int("designMAWP"),
  
  // Dual corrosion rate system
  corrosionRate: varchar("corrosionRate", { length: 16 }), // governing rate
  corrosionRateLT: varchar("corrosionRateLT", { length: 16 }), // long-term
  corrosionRateST: varchar("corrosionRateST", { length: 16 }), // short-term
  governingRate: varchar("governingRate", { length: 16 }), // LT or ST
  governingRateReason: varchar("governingRateReason", { length: 255 }),
  
  // Life predictions
  remainingLife: varchar("remainingLife", { length: 16 }), // years
  nextInspectionYears: varchar("nextInspectionYears", { length: 16 }),
  nextInspectionDate: timestamp("nextInspectionDate"),
  
  // Time span for calculations
  timeSpan: varchar("timeSpan", { length: 16 }), // years between inspections
  
  // PDF original values for validation
  pdfOriginalActualThickness: varchar("pdfOriginalActualThickness", { length: 16 }),
  pdfOriginalMinThickness: varchar("pdfOriginalMinThickness", { length: 16 }),
  pdfOriginalMAWP: varchar("pdfOriginalMAWP", { length: 16 }),
  pdfOriginalCorrosionRate: varchar("pdfOriginalCorrosionRate", { length: 16 }),
  pdfOriginalRemainingLife: varchar("pdfOriginalRemainingLife", { length: 16 }),
  
  // Status flags
  isBelowMinimum: boolean("isBelowMinimum").default(false),
  statusMessage: varchar("statusMessage", { length: 255 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ComponentCalculation = typeof componentCalculations.$inferSelect;
export type InsertComponentCalculation = typeof componentCalculations.$inferInsert;

// Nozzle evaluations
export const nozzleEvaluations = mysqlTable("nozzleEvaluations", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspectionId").notNull(),
  
  // Nozzle identification
  nozzleId: varchar("nozzleId", { length: 64 }),
  cmlNumber: varchar("cmlNumber", { length: 32 }),
  serviceType: varchar("serviceType", { length: 64 }), // Manway, Relief, Vapor Out, etc.
  size: varchar("size", { length: 16 }), // 24", 3", 2", 1"
  schedule: varchar("schedule", { length: 16 }),
  
  // Material
  materialSpec: varchar("materialSpec", { length: 128 }),
  
  // Thickness values
  nominalThickness: varchar("nominalThickness", { length: 16 }),
  previousThickness: varchar("previousThickness", { length: 16 }),
  actualThickness: varchar("actualThickness", { length: 16 }),
  minimumThickness: varchar("minimumThickness", { length: 16 }),
  
  // Calculated values
  corrosionAllowance: varchar("corrosionAllowance", { length: 16 }),
  corrosionRate: varchar("corrosionRate", { length: 16 }),
  remainingLife: varchar("remainingLife", { length: 16 }),
  
  // Age tracking
  age: varchar("age", { length: 16 }), // years
  
  status: varchar("status", { length: 32 }).default("acceptable"),
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NozzleEvaluation = typeof nozzleEvaluations.$inferSelect;
export type InsertNozzleEvaluation = typeof nozzleEvaluations.$inferInsert;

// Professional reports
export const professionalReports = mysqlTable("professionalReports", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspectionId").notNull(),
  userId: int("userId").notNull(),
  
  reportNumber: varchar("reportNumber", { length: 64 }),
  reportDate: timestamp("reportDate"),
  
  // Executive summary
  executiveSummary: text("executiveSummary"),
  
  // Report content sections
  inspectionScope: text("inspectionScope"),
  inspectionResults: text("inspectionResults"),
  
  // Generated PDF URL
  pdfUrl: varchar("pdfUrl", { length: 512 }),
  filename: varchar("filename", { length: 255 }),
  fileKey: varchar("fileKey", { length: 512 }),
  url: varchar("url", { length: 512 }),
  
  status: mysqlEnum("status", ["draft", "generated", "approved", "archived"]).default("draft").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProfessionalReport = typeof professionalReports.$inferSelect;
export type InsertProfessionalReport = typeof professionalReports.$inferInsert;

// Inspection findings
export const inspectionFindings = mysqlTable("inspectionFindings", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspectionId").notNull(),
  reportId: int("reportId"),
  
  findingNumber: int("findingNumber"),
  category: varchar("category", { length: 64 }), // foundation, shell, heads, appurtenances
  severity: mysqlEnum("severity", ["critical", "major", "minor", "observation"]).default("observation"),
  description: text("description"),
  location: varchar("location", { length: 255 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InspectionFinding = typeof inspectionFindings.$inferSelect;
export type InsertInspectionFinding = typeof inspectionFindings.$inferInsert;

// Recommendations
export const recommendations = mysqlTable("recommendations", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspectionId").notNull(),
  reportId: int("reportId"),
  
  recommendationNumber: int("recommendationNumber"),
  priority: mysqlEnum("priority", ["immediate", "high", "medium", "low"]).default("medium"),
  description: text("description"),
  dueDate: timestamp("dueDate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = typeof recommendations.$inferInsert;

// Photos with annotations
export const photos = mysqlTable("photos", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspectionId").notNull(),
  
  filename: varchar("filename", { length: 255 }),
  url: varchar("url", { length: 512 }),
  fileKey: varchar("fileKey", { length: 255 }),
  
  category: varchar("category", { length: 64 }), // shell, heads, nozzles, foundation, general
  caption: text("caption"),
  annotations: text("annotations"), // JSON string for annotation data
  
  sequence: int("sequence").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = typeof photos.$inferInsert;

// Material stress values database (187+ materials)
export const materialStressValues = mysqlTable("materialStressValues", {
  id: int("id").autoincrement().primaryKey(),
  
  materialSpec: varchar("materialSpec", { length: 128 }).notNull(),
  materialCategory: varchar("materialCategory", { length: 64 }), // carbon_steel, stainless_steel, chrome_moly, low_temp, pipe_forged
  description: text("description"),
  
  temperature: int("temperature").notNull(), // °F
  allowableStress: int("allowableStress").notNull(), // psi
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MaterialStressValue = typeof materialStressValues.$inferSelect;
export type InsertMaterialStressValue = typeof materialStressValues.$inferInsert;

// Imported files tracking
export const importedFiles = mysqlTable("importedFiles", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspectionId").notNull(),
  
  filename: varchar("filename", { length: 255 }),
  originalFilename: varchar("originalFilename", { length: 255 }),
  fileType: varchar("fileType", { length: 32 }), // pdf, excel
  fileUrl: varchar("fileUrl", { length: 512 }),
  fileKey: varchar("fileKey", { length: 255 }),
  
  parserUsed: varchar("parserUsed", { length: 32 }), // manus, vision
  parseStatus: varchar("parseStatus", { length: 32 }).default("pending"),
  parseResult: text("parseResult"), // JSON string of parsed data
  status: varchar("status", { length: 32 }).default("pending"),
  fieldsExtracted: int("fieldsExtracted").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ImportedFile = typeof importedFiles.$inferSelect;
export type InsertImportedFile = typeof importedFiles.$inferInsert;

// External inspections
export const externalInspections = mysqlTable("externalInspections", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspectionId").notNull(),
  
  foundationCondition: varchar("foundationCondition", { length: 64 }),
  foundationNotes: text("foundationNotes"),
  shellCondition: varchar("shellCondition", { length: 64 }),
  shellNotes: text("shellNotes"),
  headsCondition: varchar("headsCondition", { length: 64 }),
  headsNotes: text("headsNotes"),
  nozzlesCondition: varchar("nozzlesCondition", { length: 64 }),
  nozzlesNotes: text("nozzlesNotes"),
  insulationCondition: varchar("insulationCondition", { length: 64 }),
  insulationNotes: text("insulationNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExternalInspection = typeof externalInspections.$inferSelect;
export type InsertExternalInspection = typeof externalInspections.$inferInsert;

// Internal inspections
export const internalInspections = mysqlTable("internalInspections", {
  id: int("id").autoincrement().primaryKey(),
  inspectionId: int("inspectionId").notNull(),
  
  shellCondition: varchar("shellCondition", { length: 64 }),
  shellNotes: text("shellNotes"),
  headsCondition: varchar("headsCondition", { length: 64 }),
  headsNotes: text("headsNotes"),
  internalsCondition: varchar("internalsCondition", { length: 64 }),
  internalsNotes: text("internalsNotes"),
  weldCondition: varchar("weldCondition", { length: 64 }),
  weldNotes: text("weldNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InternalInspection = typeof internalInspections.$inferSelect;
export type InsertInternalInspection = typeof internalInspections.$inferInsert;
