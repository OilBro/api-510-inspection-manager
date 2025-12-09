import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { performComponentCalculations, calculateTimeSpanYears, calculateNozzleMinimumThickness } from "./calculations";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { nanoid } from "nanoid";

// ============ INSPECTION ROUTER ============
const inspectionRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getInspectionsByUserId(ctx.user.id);
  }),
  
  listAll: protectedProcedure.query(async () => {
    return db.getAllInspections();
  }),
  
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getInspectionById(input.id);
    }),
  
  create: protectedProcedure
    .input(z.object({
      vesselTagNumber: z.string().optional(),
      vesselName: z.string().optional(),
      manufacturer: z.string().optional(),
      serialNumber: z.string().optional(),
      yearBuilt: z.string().optional(),
      nationalBoardNumber: z.string().optional(),
      designPressure: z.number().optional(),
      designTemperature: z.number().optional(),
      mawp: z.number().optional(),
      mdmt: z.number().optional(),
      operatingPressure: z.number().optional(),
      operatingTemperature: z.number().optional(),
      materialSpec: z.string().optional(),
      allowableStress: z.number().optional(),
      jointEfficiency: z.string().optional(),
      radiographyType: z.string().optional(),
      insideDiameter: z.string().optional(),
      shellLength: z.string().optional(),
      nominalThickness: z.string().optional(),
      corrosionAllowance: z.string().optional(),
      vesselOrientation: z.string().optional(),
      headType: z.string().optional(),
      constructionCode: z.string().optional(),
      vesselConfiguration: z.string().optional(),
      insulationType: z.string().optional(),
      productService: z.string().optional(),
      specificGravity: z.string().optional(),
      inspectionDate: z.string().optional(),
      previousInspectionDate: z.string().optional(),
      inspectorName: z.string().optional(),
      clientName: z.string().optional(),
      reportNumber: z.string().optional(),
      status: z.enum(["draft", "in_progress", "completed", "archived"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.createInspection({
        userId: ctx.user.id,
        ...input,
        inspectionDate: input.inspectionDate ? new Date(input.inspectionDate) : undefined,
        previousInspectionDate: input.previousInspectionDate ? new Date(input.previousInspectionDate) : undefined,
      });
      return { id };
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      vesselTagNumber: z.string().optional(),
      vesselName: z.string().optional(),
      manufacturer: z.string().optional(),
      serialNumber: z.string().optional(),
      yearBuilt: z.string().optional(),
      nationalBoardNumber: z.string().optional(),
      designPressure: z.number().optional(),
      designTemperature: z.number().optional(),
      mawp: z.number().optional(),
      mdmt: z.number().optional(),
      operatingPressure: z.number().optional(),
      operatingTemperature: z.number().optional(),
      materialSpec: z.string().optional(),
      allowableStress: z.number().optional(),
      jointEfficiency: z.string().optional(),
      radiographyType: z.string().optional(),
      insideDiameter: z.string().optional(),
      shellLength: z.string().optional(),
      nominalThickness: z.string().optional(),
      corrosionAllowance: z.string().optional(),
      vesselOrientation: z.string().optional(),
      headType: z.string().optional(),
      constructionCode: z.string().optional(),
      vesselConfiguration: z.string().optional(),
      insulationType: z.string().optional(),
      productService: z.string().optional(),
      specificGravity: z.string().optional(),
      inspectionDate: z.string().optional(),
      previousInspectionDate: z.string().optional(),
      inspectorName: z.string().optional(),
      clientName: z.string().optional(),
      reportNumber: z.string().optional(),
      status: z.enum(["draft", "in_progress", "completed", "archived"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateInspection(id, {
        ...data,
        inspectionDate: data.inspectionDate ? new Date(data.inspectionDate) : undefined,
        previousInspectionDate: data.previousInspectionDate ? new Date(data.previousInspectionDate) : undefined,
      });
      return { success: true };
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      // Delete related data first
      await db.deleteTmlReadingsByInspectionId(input.id);
      await db.deleteNozzlesByInspectionId(input.id);
      await db.deleteFindingsByInspectionId(input.id);
      await db.deleteRecommendationsByInspectionId(input.id);
      await db.deletePhotosByInspectionId(input.id);
      await db.deleteComponentCalculationsByInspectionId(input.id);
      await db.deleteInspection(input.id);
      return { success: true };
    }),
});

// ============ TML READING ROUTER ============
const tmlRouter = router({
  getByInspection: protectedProcedure
    .input(z.object({ inspectionId: z.number() }))
    .query(async ({ input }) => {
      return db.getTmlReadingsByInspectionId(input.inspectionId);
    }),
  
  getByComponent: protectedProcedure
    .input(z.object({ inspectionId: z.number(), componentType: z.string() }))
    .query(async ({ input }) => {
      return db.getTmlReadingsByComponent(input.inspectionId, input.componentType);
    }),
  
  create: protectedProcedure
    .input(z.object({
      inspectionId: z.number(),
      cmlNumber: z.string().optional(),
      tmlId: z.string().optional(),
      location: z.string().optional(),
      componentType: z.string().optional(),
      readingType: z.string().optional(),
      nozzleSize: z.string().optional(),
      angle: z.string().optional(),
      tml1: z.string().optional(),
      tml2: z.string().optional(),
      tml3: z.string().optional(),
      tml4: z.string().optional(),
      nominalThickness: z.string().optional(),
      previousThickness: z.string().optional(),
      actualThickness: z.string().optional(),
      minimumThickness: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = await db.createTmlReading(input);
      return { id };
    }),
  
  createBulk: protectedProcedure
    .input(z.object({
      inspectionId: z.number(),
      readings: z.array(z.object({
        cmlNumber: z.string().optional(),
        tmlId: z.string().optional(),
        location: z.string().optional(),
        componentType: z.string().optional(),
        readingType: z.string().optional(),
        nozzleSize: z.string().optional(),
        angle: z.string().optional(),
        tml1: z.string().optional(),
        tml2: z.string().optional(),
        tml3: z.string().optional(),
        tml4: z.string().optional(),
        nominalThickness: z.string().optional(),
        previousThickness: z.string().optional(),
        actualThickness: z.string().optional(),
        minimumThickness: z.string().optional(),
        notes: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const readings = input.readings.map(r => ({
        ...r,
        inspectionId: input.inspectionId,
      }));
      await db.createTmlReadings(readings);
      return { success: true };
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      cmlNumber: z.string().optional(),
      tmlId: z.string().optional(),
      location: z.string().optional(),
      componentType: z.string().optional(),
      readingType: z.string().optional(),
      nozzleSize: z.string().optional(),
      angle: z.string().optional(),
      tml1: z.string().optional(),
      tml2: z.string().optional(),
      tml3: z.string().optional(),
      tml4: z.string().optional(),
      nominalThickness: z.string().optional(),
      previousThickness: z.string().optional(),
      actualThickness: z.string().optional(),
      minimumThickness: z.string().optional(),
      isAnomaly: z.boolean().optional(),
      anomalyReason: z.string().optional(),
      excludeFromCalculation: z.boolean().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateTmlReading(id, data);
      return { success: true };
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteTmlReading(input.id);
      return { success: true };
    }),
});

// ============ COMPONENT CALCULATION ROUTER ============
const calculationRouter = router({
  getByReport: protectedProcedure
    .input(z.object({ reportId: z.number() }))
    .query(async ({ input }) => {
      return db.getComponentCalculationsByReportId(input.reportId);
    }),
  
  getByInspection: protectedProcedure
    .input(z.object({ inspectionId: z.number() }))
    .query(async ({ input }) => {
      return db.getComponentCalculationsByInspectionId(input.inspectionId);
    }),
  
  recalculate: protectedProcedure
    .input(z.object({ inspectionId: z.number() }))
    .mutation(async ({ input }) => {
      const inspection = await db.getInspectionById(input.inspectionId);
      if (!inspection) throw new Error("Inspection not found");
      
      const report = await db.getProfessionalReportByInspectionId(input.inspectionId);
      if (!report) throw new Error("Professional report not found");
      
      // Delete existing calculations
      await db.deleteComponentCalculationsByReportId(report.id);
      
      // Get TML readings
      const tmlReadings = await db.getTmlReadingsByInspectionId(input.inspectionId);
      
      // Calculate time span
      let timeSpan = 10;
      if (inspection.inspectionDate && inspection.previousInspectionDate) {
        timeSpan = calculateTimeSpanYears(
          new Date(inspection.previousInspectionDate),
          new Date(inspection.inspectionDate)
        );
      }
      
      // Group readings by component type
      const componentGroups: Record<string, typeof tmlReadings> = {};
      for (const reading of tmlReadings) {
        const type = reading.componentType || 'shell';
        if (!componentGroups[type]) componentGroups[type] = [];
        componentGroups[type].push(reading);
      }
      
      // Calculate for each component
      const components = ['shell', 'east_head', 'west_head'];
      const criticalComponents: string[] = [];
      
      for (const componentType of components) {
        const readings = componentGroups[componentType] || [];
        
        // Get minimum actual thickness from readings
        let actualThickness = parseFloat(inspection.nominalThickness || '0.5');
        let previousThickness = actualThickness;
        
        if (readings.length > 0) {
          const thicknesses = readings
            .map(r => parseFloat(r.actualThickness || r.tml1 || '0'))
            .filter(t => t > 0);
          if (thicknesses.length > 0) {
            actualThickness = Math.min(...thicknesses);
          }
          
          const prevThicknesses = readings
            .map(r => parseFloat(r.previousThickness || '0'))
            .filter(t => t > 0);
          if (prevThicknesses.length > 0) {
            previousThickness = Math.min(...prevThicknesses);
          }
        }
        
        const isHead = componentType.includes('head');
        const calcResult = performComponentCalculations({
          designPressure: inspection.designPressure || 250,
          designTemperature: inspection.designTemperature || 200,
          insideDiameter: parseFloat(inspection.insideDiameter || '72'),
          allowableStress: inspection.allowableStress || 20000,
          jointEfficiency: parseFloat(inspection.jointEfficiency || '0.85'),
          actualThickness,
          previousThickness,
          nominalThickness: parseFloat(inspection.nominalThickness || '0.5'),
          timeSpan,
          componentType: isHead ? 'head' : 'shell',
          headType: (inspection.headType as 'ellipsoidal' | 'torispherical' | 'hemispherical') || 'ellipsoidal',
        });
        
        // Check for critical conditions
        if (calcResult.isBelowMinimum || calcResult.remainingLife < 2) {
          criticalComponents.push(componentType);
        }
        
        await db.createComponentCalculation({
          reportId: report.id,
          inspectionId: input.inspectionId,
          componentName: componentType === 'shell' ? 'Vessel Shell' : 
                        componentType === 'east_head' ? 'East Head' : 'West Head',
          componentType,
          designPressure: inspection.designPressure,
          designTemperature: inspection.designTemperature,
          insideDiameter: inspection.insideDiameter,
          materialSpec: inspection.materialSpec,
          allowableStress: inspection.allowableStress,
          jointEfficiency: inspection.jointEfficiency,
          nominalThickness: inspection.nominalThickness,
          previousThickness: previousThickness.toString(),
          actualThickness: actualThickness.toString(),
          minimumThickness: calcResult.minimumThickness.toString(),
          calculatedMAWP: Math.round(calcResult.calculatedMAWP),
          corrosionRate: calcResult.corrosionRate.toString(),
          corrosionRateLT: calcResult.corrosionRateLT.toString(),
          corrosionRateST: calcResult.corrosionRateST.toString(),
          governingRate: calcResult.governingRate,
          governingRateReason: calcResult.governingRateReason,
          remainingLife: calcResult.remainingLife.toString(),
          nextInspectionYears: calcResult.nextInspectionYears.toString(),
          nextInspectionDate: calcResult.nextInspectionDate,
          timeSpan: timeSpan.toString(),
          isBelowMinimum: calcResult.isBelowMinimum,
          statusMessage: calcResult.statusMessage,
        });
      }
      
      // Send notification for critical conditions
      if (criticalComponents.length > 0) {
        await notifyOwner({
          title: `CRITICAL: Vessel ${inspection.vesselTagNumber || 'Unknown'} requires attention`,
          content: `Components with critical conditions: ${criticalComponents.join(', ')}. ` +
                   `Status: Below minimum thickness or remaining life < 2 years.`,
        });
      }
      
      return { success: true };
    }),
});

// ============ NOZZLE ROUTER ============
const nozzleRouter = router({
  getByInspection: protectedProcedure
    .input(z.object({ inspectionId: z.number() }))
    .query(async ({ input }) => {
      return db.getNozzlesByInspectionId(input.inspectionId);
    }),
  
  create: protectedProcedure
    .input(z.object({
      inspectionId: z.number(),
      nozzleId: z.string().optional(),
      cmlNumber: z.string().optional(),
      serviceType: z.string().optional(),
      size: z.string().optional(),
      schedule: z.string().optional(),
      materialSpec: z.string().optional(),
      nominalThickness: z.string().optional(),
      previousThickness: z.string().optional(),
      actualThickness: z.string().optional(),
      minimumThickness: z.string().optional(),
      corrosionAllowance: z.string().optional(),
      corrosionRate: z.string().optional(),
      remainingLife: z.string().optional(),
      age: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Calculate minimum thickness if not provided
      let minThickness = input.minimumThickness;
      if (!minThickness && input.size) {
        const inspection = await db.getInspectionById(input.inspectionId);
        if (inspection) {
          const tMin = calculateNozzleMinimumThickness(
            inspection.designPressure || 250,
            input.size,
            inspection.allowableStress || 20000,
            parseFloat(inspection.jointEfficiency || '1.0')
          );
          minThickness = tMin.toFixed(3);
        }
      }
      
      const id = await db.createNozzleEvaluation({
        ...input,
        minimumThickness: minThickness,
      });
      return { id };
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      nozzleId: z.string().optional(),
      cmlNumber: z.string().optional(),
      serviceType: z.string().optional(),
      size: z.string().optional(),
      schedule: z.string().optional(),
      materialSpec: z.string().optional(),
      nominalThickness: z.string().optional(),
      previousThickness: z.string().optional(),
      actualThickness: z.string().optional(),
      minimumThickness: z.string().optional(),
      corrosionAllowance: z.string().optional(),
      corrosionRate: z.string().optional(),
      remainingLife: z.string().optional(),
      age: z.string().optional(),
      status: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateNozzleEvaluation(id, data);
      return { success: true };
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteNozzleEvaluation(input.id);
      return { success: true };
    }),
});

// ============ PROFESSIONAL REPORT ROUTER ============
const reportRouter = router({
  getByInspection: protectedProcedure
    .input(z.object({ inspectionId: z.number() }))
    .query(async ({ input }) => {
      const report = await db.getProfessionalReportByInspectionId(input.inspectionId);
      const reports = report ? [report] : [];
      return reports;
    }),
  
  generate: protectedProcedure
    .input(z.object({ inspectionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Get inspection data
      const inspection = await db.getInspectionById(input.inspectionId);
      if (!inspection) throw new Error("Inspection not found");
      
      // Get all related data
      const calculations = await db.getComponentCalculationsByInspectionId(input.inspectionId);
      const tmlReadings = await db.getTmlReadingsByInspectionId(input.inspectionId);
      const nozzles = await db.getNozzlesByInspectionId(input.inspectionId);
      const findings = await db.getFindingsByInspectionId(input.inspectionId);
      const recommendations = await db.getRecommendationsByInspectionId(input.inspectionId);
      
      // Generate report content using LLM
      const reportContent = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a professional API 510 inspection report writer. Generate a comprehensive executive summary for the following inspection data. Be technical, precise, and follow ASME standards terminology.`
          },
          {
            role: "user",
            content: `Generate an executive summary for this vessel inspection:

Vessel: ${inspection.vesselTagNumber || 'Unknown'} - ${inspection.vesselName || 'No name'}
Manufacturer: ${inspection.manufacturer || 'Unknown'}
Design Pressure: ${inspection.designPressure || 'N/A'} psi
Design Temperature: ${inspection.designTemperature || 'N/A'}°F
Material: ${inspection.materialSpec || 'Unknown'}

Calculations Summary:
${calculations.map(c => `- ${c.componentName}: Actual ${c.actualThickness}", Min ${c.minimumThickness}", MAWP ${c.calculatedMAWP} psi, RL ${c.remainingLife} yrs`).join('\n')}

Findings: ${findings.length} total
${findings.map(f => `- ${f.severity}: ${f.description}`).join('\n')}

Recommendations: ${recommendations.length} total`
          }
        ]
      });
      
      const messageContent = reportContent.choices?.[0]?.message?.content;
      const executiveSummary = typeof messageContent === 'string' ? messageContent : 'Report generated successfully.';
      
      // Create report record
      const reportNumber = `RPT-${inspection.vesselTagNumber || 'VESSEL'}-${Date.now()}`;
      const filename = `${reportNumber}.pdf`;
      
      // Generate simple HTML report
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>API 510 Inspection Report - ${inspection.vesselTagNumber || 'Vessel'}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 10px; }
    h2 { color: #2c5282; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f7fafc; }
    .critical { color: #c53030; font-weight: bold; }
    .warning { color: #dd6b20; }
    .ok { color: #38a169; }
  </style>
</head>
<body>
  <h1>API 510 Pressure Vessel Inspection Report</h1>
  <p><strong>Report Number:</strong> ${reportNumber}</p>
  <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
  
  <h2>Vessel Information</h2>
  <table>
    <tr><th>Tag Number</th><td>${inspection.vesselTagNumber || 'N/A'}</td></tr>
    <tr><th>Vessel Name</th><td>${inspection.vesselName || 'N/A'}</td></tr>
    <tr><th>Manufacturer</th><td>${inspection.manufacturer || 'N/A'}</td></tr>
    <tr><th>Design Pressure</th><td>${inspection.designPressure || 'N/A'} psi</td></tr>
    <tr><th>Design Temperature</th><td>${inspection.designTemperature || 'N/A'}°F</td></tr>
    <tr><th>Material</th><td>${inspection.materialSpec || 'N/A'}</td></tr>
  </table>
  
  <h2>Executive Summary</h2>
  <p>${executiveSummary}</p>
  
  <h2>Component Calculations</h2>
  <table>
    <tr>
      <th>Component</th>
      <th>Actual (in)</th>
      <th>Minimum (in)</th>
      <th>MAWP (psi)</th>
      <th>CR (ipy)</th>
      <th>RL (years)</th>
      <th>Status</th>
    </tr>
    ${calculations.map(c => `
    <tr>
      <td>${c.componentName}</td>
      <td>${c.actualThickness}</td>
      <td>${c.minimumThickness}</td>
      <td>${c.calculatedMAWP}</td>
      <td>${c.corrosionRate}</td>
      <td>${c.remainingLife}</td>
      <td class="${c.isBelowMinimum ? 'critical' : parseFloat(c.remainingLife || '999') < 5 ? 'warning' : 'ok'}">
        ${c.isBelowMinimum ? 'BELOW MIN' : parseFloat(c.remainingLife || '999') < 5 ? 'WARNING' : 'OK'}
      </td>
    </tr>`).join('')}
  </table>
  
  <h2>Findings</h2>
  ${findings.length > 0 ? findings.map(f => `
  <div style="margin: 10px 0; padding: 10px; border-left: 4px solid ${f.severity === 'critical' ? '#c53030' : f.severity === 'major' ? '#dd6b20' : '#718096'};">
    <strong>#${f.findingNumber} - ${f.severity?.toUpperCase()}</strong><br/>
    ${f.description}<br/>
    <small>Location: ${f.location || 'N/A'}</small>
  </div>`).join('') : '<p>No findings recorded.</p>'}
  
  <h2>Recommendations</h2>
  ${recommendations.length > 0 ? recommendations.map(r => `
  <div style="margin: 10px 0; padding: 10px; border-left: 4px solid ${r.priority === 'immediate' ? '#c53030' : r.priority === 'high' ? '#dd6b20' : '#718096'};">
    <strong>#${r.recommendationNumber} - ${r.priority?.toUpperCase()}</strong><br/>
    ${r.description}<br/>
    ${r.dueDate ? `<small>Due: ${new Date(r.dueDate).toLocaleDateString()}</small>` : ''}
  </div>`).join('') : '<p>No recommendations recorded.</p>'}
  
  <hr/>
  <p style="text-align: center; color: #718096;">Generated by API 510 Inspection App</p>
</body>
</html>`;
      
      // Upload HTML as the report (could be converted to PDF in production)
      const fileKey = `reports/${ctx.user.id}/${nanoid()}-${filename.replace('.pdf', '.html')}`;
      const { url } = await storagePut(fileKey, htmlContent, 'text/html');
      
      // Create report record
      const reportId = await db.createProfessionalReport({
        inspectionId: input.inspectionId,
        userId: ctx.user.id,
        reportNumber,
        reportDate: new Date(),
        executiveSummary,
        filename: filename.replace('.pdf', '.html'),
        fileKey,
        url,
        status: 'generated',
      });
      
      return { id: reportId, url, filename };
    }),
  
  create: protectedProcedure
    .input(z.object({
      inspectionId: z.number(),
      reportNumber: z.string().optional(),
      executiveSummary: z.string().optional(),
      inspectionScope: z.string().optional(),
      inspectionResults: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.createProfessionalReport({
        ...input,
        userId: ctx.user.id,
        reportDate: new Date(),
      });
      return { id };
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      reportNumber: z.string().optional(),
      executiveSummary: z.string().optional(),
      inspectionScope: z.string().optional(),
      inspectionResults: z.string().optional(),
      status: z.enum(["draft", "generated", "approved", "archived"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateProfessionalReport(id, data);
      return { success: true };
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteComponentCalculationsByReportId(input.id);
      await db.deleteProfessionalReport(input.id);
      return { success: true };
    }),
});

// ============ FINDINGS ROUTER ============
const findingsRouter = router({
  getByInspection: protectedProcedure
    .input(z.object({ inspectionId: z.number() }))
    .query(async ({ input }) => {
      return db.getFindingsByInspectionId(input.inspectionId);
    }),
  
  create: protectedProcedure
    .input(z.object({
      inspectionId: z.number(),
      reportId: z.number().optional(),
      findingNumber: z.number().optional(),
      category: z.string().optional(),
      severity: z.enum(["critical", "major", "minor", "observation"]).optional(),
      description: z.string().optional(),
      location: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = await db.createInspectionFinding(input);
      return { id };
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      findingNumber: z.number().optional(),
      category: z.string().optional(),
      severity: z.enum(["critical", "major", "minor", "observation"]).optional(),
      description: z.string().optional(),
      location: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateInspectionFinding(id, data);
      return { success: true };
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteInspectionFinding(input.id);
      return { success: true };
    }),
});

// ============ RECOMMENDATIONS ROUTER ============
const recommendationsRouter = router({
  getByInspection: protectedProcedure
    .input(z.object({ inspectionId: z.number() }))
    .query(async ({ input }) => {
      return db.getRecommendationsByInspectionId(input.inspectionId);
    }),
  
  create: protectedProcedure
    .input(z.object({
      inspectionId: z.number(),
      reportId: z.number().optional(),
      recommendationNumber: z.number().optional(),
      priority: z.enum(["immediate", "high", "medium", "low"]).optional(),
      description: z.string().optional(),
      dueDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = await db.createRecommendation({
        ...input,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      });
      return { id };
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      recommendationNumber: z.number().optional(),
      priority: z.enum(["immediate", "high", "medium", "low"]).optional(),
      description: z.string().optional(),
      dueDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateRecommendation(id, {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      });
      return { success: true };
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteRecommendation(input.id);
      return { success: true };
    }),
});

// ============ PHOTO ROUTER ============
const photoRouter = router({
  getByInspection: protectedProcedure
    .input(z.object({ inspectionId: z.number() }))
    .query(async ({ input }) => {
      return db.getPhotosByInspectionId(input.inspectionId);
    }),
  
  getByCategory: protectedProcedure
    .input(z.object({ inspectionId: z.number(), category: z.string() }))
    .query(async ({ input }) => {
      return db.getPhotosByCategory(input.inspectionId, input.category);
    }),
  
  upload: protectedProcedure
    .input(z.object({
      inspectionId: z.number(),
      filename: z.string(),
      contentType: z.string(),
      base64Data: z.string(),
      category: z.string().optional(),
      caption: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.base64Data, 'base64');
      const fileKey = `inspections/${input.inspectionId}/photos/${nanoid()}-${input.filename}`;
      
      const { url } = await storagePut(fileKey, buffer, input.contentType);
      
      const id = await db.createPhoto({
        inspectionId: input.inspectionId,
        filename: input.filename,
        url,
        fileKey,
        category: input.category,
        caption: input.caption,
      });
      
      return { id, url };
    }),
  
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      category: z.string().optional(),
      caption: z.string().optional(),
      annotations: z.string().optional(),
      sequence: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updatePhoto(id, data);
      return { success: true };
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deletePhoto(input.id);
      return { success: true };
    }),
});

// ============ MATERIAL ROUTER ============
const materialRouter = router({
  getAll: publicProcedure.query(async () => {
    return db.getAllMaterials();
  }),
  
  getByCategory: publicProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      return db.getMaterialsByCategory(input.category);
    }),
  
  getStressValue: publicProcedure
    .input(z.object({ materialSpec: z.string(), temperature: z.number() }))
    .query(async ({ input }) => {
      const stress = await db.getMaterialStressValue(input.materialSpec, input.temperature);
      return { allowableStress: stress };
    }),
});

// ============ IMPORT ROUTER ============
const importRouter = router({
  getByInspection: protectedProcedure
    .input(z.object({ inspectionId: z.number() }))
    .query(async ({ input }) => {
      return db.getImportedFilesByInspectionId(input.inspectionId);
    }),
  
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteImportedFile(input.id);
      return { success: true };
    }),
  
  parseDocument: protectedProcedure
    .input(z.object({
      inspectionId: z.number(),
      filename: z.string(),
      contentType: z.string(),
      base64Data: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Upload file to S3
      const fileKey = `imports/${ctx.user.id}/${nanoid()}-${input.filename}`;
      const buffer = Buffer.from(input.base64Data, 'base64');
      const { url } = await storagePut(fileKey, buffer, input.contentType);
      
      // Use LLM to parse the document
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert at extracting data from pressure vessel inspection reports.
Extract all relevant data from the provided document and return it as JSON.
Include: vessel tag number, manufacturer, design pressure, temperature, material spec, 
allowable stress, joint efficiency, thickness measurements, nozzle data, findings, and recommendations.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all inspection data from this document:" },
              { type: "file_url", file_url: { url, mime_type: input.contentType as "application/pdf" } }
            ]
          }
        ],
      });
      
      const messageContent = response.choices?.[0]?.message?.content;
      const parseResult = typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent);
      
      // Save imported file record
      await db.createImportedFile({
        inspectionId: input.inspectionId,
        originalFilename: input.filename,
        filename: input.filename,
        fileType: input.contentType.includes('pdf') ? 'pdf' : 'excel',
        fileUrl: url,
        parserUsed: 'manus_llm',
        parseStatus: 'completed',
        parseResult,
        fieldsExtracted: 0,
        status: 'completed',
      });
      
      return { success: true, url };
    }),
  
  parseWithLLM: protectedProcedure
    .input(z.object({
      inspectionId: z.number(),
      fileUrl: z.string(),
      filename: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Use LLM to parse the PDF
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert at extracting data from pressure vessel inspection reports.
Extract all relevant data from the provided PDF and return it as JSON.
Include: vessel tag number, manufacturer, design pressure, temperature, material spec, 
allowable stress, joint efficiency, thickness measurements (CML numbers, locations, readings),
nozzle data, findings, and recommendations.
Return a JSON object with these fields:
{
  "vesselTagNumber": string,
  "vesselName": string,
  "manufacturer": string,
  "serialNumber": string,
  "yearBuilt": string,
  "designPressure": number,
  "designTemperature": number,
  "mawp": number,
  "materialSpec": string,
  "allowableStress": number,
  "jointEfficiency": number,
  "radiographyType": string,
  "insideDiameter": number,
  "nominalThickness": number,
  "headType": string,
  "inspectionDate": string,
  "previousInspectionDate": string,
  "inspectorName": string,
  "clientName": string,
  "reportNumber": string,
  "tmlReadings": [{ "cmlNumber": string, "location": string, "componentType": string, "tml1": number, "tml2": number, "tml3": number, "tml4": number, "previousThickness": number, "actualThickness": number }],
  "nozzles": [{ "nozzleId": string, "serviceType": string, "size": string, "actualThickness": number }],
  "findings": [string],
  "recommendations": [string]
}`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all inspection data from this PDF:" },
              { type: "file_url", file_url: { url: input.fileUrl, mime_type: "application/pdf" } }
            ]
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "vessel_data",
            strict: false,
            schema: {
              type: "object",
              properties: {
                vesselTagNumber: { type: "string" },
                vesselName: { type: "string" },
                manufacturer: { type: "string" },
                serialNumber: { type: "string" },
                yearBuilt: { type: "string" },
                designPressure: { type: "number" },
                designTemperature: { type: "number" },
                mawp: { type: "number" },
                materialSpec: { type: "string" },
                allowableStress: { type: "number" },
                jointEfficiency: { type: "number" },
                radiographyType: { type: "string" },
                insideDiameter: { type: "number" },
                nominalThickness: { type: "number" },
                headType: { type: "string" },
                inspectionDate: { type: "string" },
                previousInspectionDate: { type: "string" },
                inspectorName: { type: "string" },
                clientName: { type: "string" },
                reportNumber: { type: "string" },
                tmlReadings: { type: "array", items: { type: "object" } },
                nozzles: { type: "array", items: { type: "object" } },
                findings: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      });
      
      const messageContent = response.choices[0]?.message?.content;
      if (!messageContent) throw new Error("Failed to parse PDF");
      
      const content = typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent);
      const parsedData = JSON.parse(content);
      
      // Save imported file record
      await db.createImportedFile({
        inspectionId: input.inspectionId,
        filename: input.filename,
        fileType: 'pdf',
        fileUrl: input.fileUrl,
        parserUsed: 'manus',
        parseStatus: 'completed',
        parseResult: typeof content === 'string' ? content : JSON.stringify(content),
      });
      
      return parsedData;
    }),
  
  saveExtractedData: protectedProcedure
    .input(z.object({
      inspectionId: z.number(),
      data: z.object({
        vesselTagNumber: z.string().optional(),
        vesselName: z.string().optional(),
        manufacturer: z.string().optional(),
        serialNumber: z.string().optional(),
        yearBuilt: z.string().optional(),
        designPressure: z.number().optional(),
        designTemperature: z.number().optional(),
        mawp: z.number().optional(),
        materialSpec: z.string().optional(),
        allowableStress: z.number().optional(),
        jointEfficiency: z.number().optional(),
        radiographyType: z.string().optional(),
        insideDiameter: z.number().optional(),
        nominalThickness: z.number().optional(),
        headType: z.string().optional(),
        inspectionDate: z.string().optional(),
        previousInspectionDate: z.string().optional(),
        inspectorName: z.string().optional(),
        clientName: z.string().optional(),
        reportNumber: z.string().optional(),
        tmlReadings: z.array(z.any()).optional(),
        nozzles: z.array(z.any()).optional(),
        findings: z.array(z.string()).optional(),
        recommendations: z.array(z.string()).optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const { inspectionId, data } = input;
      
      // Update inspection with extracted data
      await db.updateInspection(inspectionId, {
        vesselTagNumber: data.vesselTagNumber,
        vesselName: data.vesselName,
        manufacturer: data.manufacturer,
        serialNumber: data.serialNumber,
        yearBuilt: data.yearBuilt,
        designPressure: data.designPressure,
        designTemperature: data.designTemperature,
        mawp: data.mawp,
        materialSpec: data.materialSpec,
        allowableStress: data.allowableStress,
        jointEfficiency: data.jointEfficiency?.toString(),
        radiographyType: data.radiographyType,
        insideDiameter: data.insideDiameter?.toString(),
        nominalThickness: data.nominalThickness?.toString(),
        headType: data.headType,
        inspectionDate: data.inspectionDate ? new Date(data.inspectionDate) : undefined,
        previousInspectionDate: data.previousInspectionDate ? new Date(data.previousInspectionDate) : undefined,
        inspectorName: data.inspectorName,
        clientName: data.clientName,
        reportNumber: data.reportNumber,
      });
      
      // Clear existing TML readings and add new ones
      await db.deleteTmlReadingsByInspectionId(inspectionId);
      if (data.tmlReadings && data.tmlReadings.length > 0) {
        const readings = data.tmlReadings.map((r: any) => ({
          inspectionId,
          cmlNumber: r.cmlNumber?.toString().substring(0, 32),
          tmlId: r.tmlId?.substring(0, 64),
          location: r.location?.substring(0, 255),
          componentType: r.componentType?.substring(0, 64),
          readingType: r.readingType?.substring(0, 32),
          nozzleSize: r.nozzleSize?.substring(0, 16),
          angle: r.angle?.substring(0, 16),
          tml1: r.tml1?.toString().substring(0, 16),
          tml2: r.tml2?.toString().substring(0, 16),
          tml3: r.tml3?.toString().substring(0, 16),
          tml4: r.tml4?.toString().substring(0, 16),
          nominalThickness: r.nominalThickness?.toString().substring(0, 16),
          previousThickness: r.previousThickness?.toString().substring(0, 16),
          actualThickness: r.actualThickness?.toString().substring(0, 16),
          minimumThickness: r.minimumThickness?.toString().substring(0, 16),
          status: 'good',
        }));
        await db.createTmlReadings(readings);
      }
      
      // Clear existing nozzles and add new ones
      await db.deleteNozzlesByInspectionId(inspectionId);
      if (data.nozzles && data.nozzles.length > 0) {
        for (const n of data.nozzles) {
          await db.createNozzleEvaluation({
            inspectionId,
            nozzleId: n.nozzleId?.substring(0, 64),
            cmlNumber: n.cmlNumber?.toString().substring(0, 32),
            serviceType: n.serviceType?.substring(0, 64),
            size: n.size?.substring(0, 16),
            schedule: n.schedule?.substring(0, 16),
            materialSpec: n.materialSpec?.substring(0, 128),
            nominalThickness: n.nominalThickness?.toString().substring(0, 16),
            previousThickness: n.previousThickness?.toString().substring(0, 16),
            actualThickness: n.actualThickness?.toString().substring(0, 16),
          });
        }
      }
      
      // Add findings
      await db.deleteFindingsByInspectionId(inspectionId);
      if (data.findings && data.findings.length > 0) {
        for (let i = 0; i < data.findings.length; i++) {
          await db.createInspectionFinding({
            inspectionId,
            findingNumber: i + 1,
            description: data.findings[i],
            severity: 'observation',
          });
        }
      }
      
      // Add recommendations
      await db.deleteRecommendationsByInspectionId(inspectionId);
      if (data.recommendations && data.recommendations.length > 0) {
        for (let i = 0; i < data.recommendations.length; i++) {
          await db.createRecommendation({
            inspectionId,
            recommendationNumber: i + 1,
            description: data.recommendations[i],
            priority: 'medium',
          });
        }
      }
      
      return { success: true };
    }),
});

// ============ CSV EXPORT ROUTER ============
const exportRouter = router({
  generateCSV: protectedProcedure
    .input(z.object({ inspectionId: z.number() }))
    .mutation(async ({ input }) => {
      const inspection = await db.getInspectionById(input.inspectionId);
      if (!inspection) throw new Error("Inspection not found");
      
      const tmlReadings = await db.getTmlReadingsByInspectionId(input.inspectionId);
      const calculations = await db.getComponentCalculationsByInspectionId(input.inspectionId);
      const nozzles = await db.getNozzlesByInspectionId(input.inspectionId);
      
      // Helper to escape CSV values
      const escapeCSV = (val: any): string => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      
      let csv = '';
      
      // Inspection metadata header
      csv += 'INSPECTION METADATA\n';
      csv += `Vessel Tag,${escapeCSV(inspection.vesselTagNumber)}\n`;
      csv += `Vessel Name,${escapeCSV(inspection.vesselName)}\n`;
      csv += `Manufacturer,${escapeCSV(inspection.manufacturer)}\n`;
      csv += `Design Pressure (psi),${escapeCSV(inspection.designPressure)}\n`;
      csv += `Design Temperature (°F),${escapeCSV(inspection.designTemperature)}\n`;
      csv += `Material Spec,${escapeCSV(inspection.materialSpec)}\n`;
      csv += `Allowable Stress (psi),${escapeCSV(inspection.allowableStress)}\n`;
      csv += `Joint Efficiency,${escapeCSV(inspection.jointEfficiency)}\n`;
      csv += `Inside Diameter (in),${escapeCSV(inspection.insideDiameter)}\n`;
      csv += `Nominal Thickness (in),${escapeCSV(inspection.nominalThickness)}\n`;
      csv += `Inspection Date,${escapeCSV(inspection.inspectionDate)}\n`;
      csv += `Inspector,${escapeCSV(inspection.inspectorName)}\n`;
      csv += '\n';
      
      // Component calculations
      csv += 'COMPONENT CALCULATIONS\n';
      csv += 'Component,Type,Actual Thickness,Min Thickness,MAWP,Corrosion Rate,Remaining Life,Status\n';
      for (const calc of calculations) {
        csv += `${escapeCSV(calc.componentName)},${escapeCSV(calc.componentType)},`;
        csv += `${escapeCSV(calc.actualThickness)},${escapeCSV(calc.minimumThickness)},`;
        csv += `${escapeCSV(calc.calculatedMAWP)},${escapeCSV(calc.corrosionRate)},`;
        csv += `${escapeCSV(calc.remainingLife)},${escapeCSV(calc.statusMessage)}\n`;
      }
      csv += '\n';
      
      // TML readings
      csv += 'TML READINGS\n';
      csv += 'CML,Location,Component,TML1,TML2,TML3,TML4,Previous,Actual,Minimum\n';
      for (const tml of tmlReadings) {
        csv += `${escapeCSV(tml.cmlNumber)},${escapeCSV(tml.location)},`;
        csv += `${escapeCSV(tml.componentType)},${escapeCSV(tml.tml1)},`;
        csv += `${escapeCSV(tml.tml2)},${escapeCSV(tml.tml3)},${escapeCSV(tml.tml4)},`;
        csv += `${escapeCSV(tml.previousThickness)},${escapeCSV(tml.actualThickness)},`;
        csv += `${escapeCSV(tml.minimumThickness)}\n`;
      }
      csv += '\n';
      
      // Nozzle evaluations
      csv += 'NOZZLE EVALUATIONS\n';
      csv += 'Nozzle ID,Service Type,Size,Actual Thickness,Min Thickness,Corrosion Rate,Remaining Life\n';
      for (const nozzle of nozzles) {
        csv += `${escapeCSV(nozzle.nozzleId)},${escapeCSV(nozzle.serviceType)},`;
        csv += `${escapeCSV(nozzle.size)},${escapeCSV(nozzle.actualThickness)},`;
        csv += `${escapeCSV(nozzle.minimumThickness)},${escapeCSV(nozzle.corrosionRate)},`;
        csv += `${escapeCSV(nozzle.remainingLife)}\n`;
      }
      
      // Upload CSV to storage
      const filename = `${inspection.vesselTagNumber || 'inspection'}-${new Date().toISOString().split('T')[0]}.csv`;
      const fileKey = `exports/${input.inspectionId}/${filename}`;
      const { url } = await storagePut(fileKey, Buffer.from(csv, 'utf-8'), 'text/csv');
      
      return { url, filename };
    }),
});

// ============ MAIN APP ROUTER ============
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  
  inspection: inspectionRouter,
  tml: tmlRouter,
  calculation: calculationRouter,
  nozzle: nozzleRouter,
  report: reportRouter,
  findings: findingsRouter,
  recommendations: recommendationsRouter,
  photo: photoRouter,
  material: materialRouter,
  import: importRouter,
  export: exportRouter,
});

export type AppRouter = typeof appRouter;
