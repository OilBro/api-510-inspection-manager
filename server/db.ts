import { eq, and, desc, asc, sql, between, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  inspections, InsertInspection, Inspection,
  tmlReadings, InsertTmlReading, TmlReading,
  componentCalculations, InsertComponentCalculation, ComponentCalculation,
  nozzleEvaluations, InsertNozzleEvaluation, NozzleEvaluation,
  professionalReports, InsertProfessionalReport, ProfessionalReport,
  inspectionFindings, InsertInspectionFinding, InspectionFinding,
  recommendations, InsertRecommendation, Recommendation,
  photos, InsertPhoto, Photo,
  materialStressValues, InsertMaterialStressValue, MaterialStressValue,
  importedFiles, InsertImportedFile, ImportedFile,
  externalInspections, InsertExternalInspection, ExternalInspection,
  internalInspections, InsertInternalInspection, InternalInspection,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER HELPERS ============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ INSPECTION HELPERS ============
export async function createInspection(data: InsertInspection): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(inspections).values(data);
  return result[0].insertId;
}

export async function getInspectionById(id: number): Promise<Inspection | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(inspections).where(eq(inspections.id, id)).limit(1);
  return result[0];
}

export async function getInspectionsByUserId(userId: number): Promise<Inspection[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(inspections)
    .where(eq(inspections.userId, userId))
    .orderBy(desc(inspections.createdAt));
}

export async function getAllInspections(): Promise<Inspection[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(inspections).orderBy(desc(inspections.createdAt));
}

export async function updateInspection(id: number, data: Partial<InsertInspection>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(inspections).set(data).where(eq(inspections.id, id));
}

export async function deleteInspection(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(inspections).where(eq(inspections.id, id));
}

export async function getInspectionByVesselTag(vesselTagNumber: string): Promise<Inspection | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(inspections)
    .where(eq(inspections.vesselTagNumber, vesselTagNumber))
    .orderBy(desc(inspections.inspectionDate))
    .limit(1);
  return result[0];
}

// ============ TML READING HELPERS ============
export async function createTmlReading(data: InsertTmlReading): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(tmlReadings).values(data);
  return result[0].insertId;
}

export async function createTmlReadings(data: InsertTmlReading[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.length === 0) return;
  
  await db.insert(tmlReadings).values(data);
}

export async function getTmlReadingsByInspectionId(inspectionId: number): Promise<TmlReading[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(tmlReadings)
    .where(eq(tmlReadings.inspectionId, inspectionId))
    .orderBy(asc(tmlReadings.cmlNumber));
}

export async function getTmlReadingsByComponent(inspectionId: number, componentType: string): Promise<TmlReading[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(tmlReadings)
    .where(and(
      eq(tmlReadings.inspectionId, inspectionId),
      eq(tmlReadings.componentType, componentType)
    ))
    .orderBy(asc(tmlReadings.cmlNumber));
}

export async function updateTmlReading(id: number, data: Partial<InsertTmlReading>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(tmlReadings).set(data).where(eq(tmlReadings.id, id));
}

export async function deleteTmlReading(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(tmlReadings).where(eq(tmlReadings.id, id));
}

export async function deleteTmlReadingsByInspectionId(inspectionId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(tmlReadings).where(eq(tmlReadings.inspectionId, inspectionId));
}

// ============ COMPONENT CALCULATION HELPERS ============
export async function createComponentCalculation(data: InsertComponentCalculation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(componentCalculations).values(data);
  return result[0].insertId;
}

export async function getComponentCalculationsByReportId(reportId: number): Promise<ComponentCalculation[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(componentCalculations)
    .where(eq(componentCalculations.reportId, reportId))
    .orderBy(asc(componentCalculations.componentType));
}

export async function getComponentCalculationsByInspectionId(inspectionId: number): Promise<ComponentCalculation[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(componentCalculations)
    .where(eq(componentCalculations.inspectionId, inspectionId))
    .orderBy(asc(componentCalculations.componentType));
}

export async function updateComponentCalculation(id: number, data: Partial<InsertComponentCalculation>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(componentCalculations).set(data).where(eq(componentCalculations.id, id));
}

export async function deleteComponentCalculationsByReportId(reportId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(componentCalculations).where(eq(componentCalculations.reportId, reportId));
}

export async function deleteComponentCalculationsByInspectionId(inspectionId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(componentCalculations).where(eq(componentCalculations.inspectionId, inspectionId));
}

// ============ NOZZLE EVALUATION HELPERS ============
export async function createNozzleEvaluation(data: InsertNozzleEvaluation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(nozzleEvaluations).values(data);
  return result[0].insertId;
}

export async function getNozzlesByInspectionId(inspectionId: number): Promise<NozzleEvaluation[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(nozzleEvaluations)
    .where(eq(nozzleEvaluations.inspectionId, inspectionId))
    .orderBy(asc(nozzleEvaluations.cmlNumber));
}

export async function updateNozzleEvaluation(id: number, data: Partial<InsertNozzleEvaluation>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(nozzleEvaluations).set(data).where(eq(nozzleEvaluations.id, id));
}

export async function deleteNozzleEvaluation(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(nozzleEvaluations).where(eq(nozzleEvaluations.id, id));
}

export async function deleteNozzlesByInspectionId(inspectionId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(nozzleEvaluations).where(eq(nozzleEvaluations.inspectionId, inspectionId));
}

// ============ PROFESSIONAL REPORT HELPERS ============
export async function createProfessionalReport(data: InsertProfessionalReport): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(professionalReports).values(data);
  return result[0].insertId;
}

export async function getProfessionalReportByInspectionId(inspectionId: number): Promise<ProfessionalReport | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(professionalReports)
    .where(eq(professionalReports.inspectionId, inspectionId))
    .limit(1);
  return result[0];
}

export async function getProfessionalReportById(id: number): Promise<ProfessionalReport | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(professionalReports)
    .where(eq(professionalReports.id, id))
    .limit(1);
  return result[0];
}

export async function updateProfessionalReport(id: number, data: Partial<InsertProfessionalReport>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(professionalReports).set(data).where(eq(professionalReports.id, id));
}

export async function deleteProfessionalReport(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(professionalReports).where(eq(professionalReports.id, id));
}

// ============ INSPECTION FINDINGS HELPERS ============
export async function createInspectionFinding(data: InsertInspectionFinding): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(inspectionFindings).values(data);
  return result[0].insertId;
}

export async function getFindingsByInspectionId(inspectionId: number): Promise<InspectionFinding[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(inspectionFindings)
    .where(eq(inspectionFindings.inspectionId, inspectionId))
    .orderBy(asc(inspectionFindings.findingNumber));
}

export async function updateInspectionFinding(id: number, data: Partial<InsertInspectionFinding>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(inspectionFindings).set(data).where(eq(inspectionFindings.id, id));
}

export async function deleteInspectionFinding(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(inspectionFindings).where(eq(inspectionFindings.id, id));
}

export async function deleteFindingsByInspectionId(inspectionId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(inspectionFindings).where(eq(inspectionFindings.inspectionId, inspectionId));
}

// ============ RECOMMENDATIONS HELPERS ============
export async function createRecommendation(data: InsertRecommendation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(recommendations).values(data);
  return result[0].insertId;
}

export async function getRecommendationsByInspectionId(inspectionId: number): Promise<Recommendation[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(recommendations)
    .where(eq(recommendations.inspectionId, inspectionId))
    .orderBy(asc(recommendations.recommendationNumber));
}

export async function updateRecommendation(id: number, data: Partial<InsertRecommendation>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(recommendations).set(data).where(eq(recommendations.id, id));
}

export async function deleteRecommendation(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(recommendations).where(eq(recommendations.id, id));
}

export async function deleteRecommendationsByInspectionId(inspectionId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(recommendations).where(eq(recommendations.inspectionId, inspectionId));
}

// ============ PHOTO HELPERS ============
export async function createPhoto(data: InsertPhoto): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(photos).values(data);
  return result[0].insertId;
}

export async function getPhotosByInspectionId(inspectionId: number): Promise<Photo[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(photos)
    .where(eq(photos.inspectionId, inspectionId))
    .orderBy(asc(photos.sequence));
}

export async function getPhotosByCategory(inspectionId: number, category: string): Promise<Photo[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(photos)
    .where(and(
      eq(photos.inspectionId, inspectionId),
      eq(photos.category, category)
    ))
    .orderBy(asc(photos.sequence));
}

export async function updatePhoto(id: number, data: Partial<InsertPhoto>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(photos).set(data).where(eq(photos.id, id));
}

export async function deletePhoto(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(photos).where(eq(photos.id, id));
}

export async function deletePhotosByInspectionId(inspectionId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(photos).where(eq(photos.inspectionId, inspectionId));
}

// ============ MATERIAL STRESS VALUE HELPERS ============
export async function getMaterialStressValue(materialSpec: string, temperature: number): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Get the two closest temperature points for interpolation
  const lowerResult = await db.select().from(materialStressValues)
    .where(and(
      eq(materialStressValues.materialSpec, materialSpec),
      sql`${materialStressValues.temperature} <= ${temperature}`
    ))
    .orderBy(desc(materialStressValues.temperature))
    .limit(1);
  
  const upperResult = await db.select().from(materialStressValues)
    .where(and(
      eq(materialStressValues.materialSpec, materialSpec),
      sql`${materialStressValues.temperature} >= ${temperature}`
    ))
    .orderBy(asc(materialStressValues.temperature))
    .limit(1);
  
  if (lowerResult.length === 0 && upperResult.length === 0) {
    return null;
  }
  
  // Exact match or only one bound
  if (lowerResult.length === 0) return upperResult[0].allowableStress;
  if (upperResult.length === 0) return lowerResult[0].allowableStress;
  if (lowerResult[0].temperature === upperResult[0].temperature) {
    return lowerResult[0].allowableStress;
  }
  
  // Linear interpolation
  const t1 = lowerResult[0].temperature;
  const t2 = upperResult[0].temperature;
  const s1 = lowerResult[0].allowableStress;
  const s2 = upperResult[0].allowableStress;
  
  const interpolatedStress = s1 + ((temperature - t1) / (t2 - t1)) * (s2 - s1);
  return Math.round(interpolatedStress);
}

export async function getAllMaterials(): Promise<{ materialSpec: string; materialCategory: string | null; description: string | null }[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.selectDistinct({
    materialSpec: materialStressValues.materialSpec,
    materialCategory: materialStressValues.materialCategory,
    description: materialStressValues.description,
  }).from(materialStressValues)
    .orderBy(asc(materialStressValues.materialCategory), asc(materialStressValues.materialSpec));
  
  return result;
}

export async function getMaterialsByCategory(category: string): Promise<{ materialSpec: string; description: string | null }[]> {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.selectDistinct({
    materialSpec: materialStressValues.materialSpec,
    description: materialStressValues.description,
  }).from(materialStressValues)
    .where(eq(materialStressValues.materialCategory, category))
    .orderBy(asc(materialStressValues.materialSpec));
  
  return result;
}

export async function insertMaterialStressValues(data: InsertMaterialStressValue[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.length === 0) return;
  
  await db.insert(materialStressValues).values(data);
}

// ============ IMPORTED FILES HELPERS ============
export async function createImportedFile(data: InsertImportedFile): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(importedFiles).values(data);
  return result[0].insertId;
}

export async function getImportedFilesByInspectionId(inspectionId: number): Promise<ImportedFile[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(importedFiles)
    .where(eq(importedFiles.inspectionId, inspectionId))
    .orderBy(desc(importedFiles.createdAt));
}

export async function updateImportedFile(id: number, data: Partial<InsertImportedFile>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(importedFiles).set(data).where(eq(importedFiles.id, id));
}

export async function deleteImportedFile(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(importedFiles).where(eq(importedFiles.id, id));
}

// ============ EXTERNAL INSPECTION HELPERS ============
export async function createExternalInspection(data: InsertExternalInspection): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(externalInspections).values(data);
  return result[0].insertId;
}

export async function getExternalInspectionByInspectionId(inspectionId: number): Promise<ExternalInspection | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(externalInspections)
    .where(eq(externalInspections.inspectionId, inspectionId))
    .limit(1);
  return result[0];
}

export async function updateExternalInspection(id: number, data: Partial<InsertExternalInspection>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(externalInspections).set(data).where(eq(externalInspections.id, id));
}

// ============ INTERNAL INSPECTION HELPERS ============
export async function createInternalInspection(data: InsertInternalInspection): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(internalInspections).values(data);
  return result[0].insertId;
}

export async function getInternalInspectionByInspectionId(inspectionId: number): Promise<InternalInspection | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(internalInspections)
    .where(eq(internalInspections.inspectionId, inspectionId))
    .limit(1);
  return result[0];
}

export async function updateInternalInspection(id: number, data: Partial<InsertInternalInspection>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(internalInspections).set(data).where(eq(internalInspections.id, id));
}
