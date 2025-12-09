# API 510 Inspection App - TODO

## Database Schema
- [x] Inspections table with comprehensive vessel data
- [x] TML readings table with multi-angle measurements
- [x] Component calculations table
- [x] Nozzle evaluations table
- [x] Professional reports table
- [x] Photos table with annotations
- [x] Material stress values table (187+ materials)
- [x] Inspection findings table
- [x] Recommendations table
- [x] Imported files table

## Server-Side Features
- [x] Inspection CRUD operations
- [x] ASME Section VIII calculation engine (t_min, MAWP, corrosion rates, remaining life)
- [x] Dual corrosion rate system (long-term and short-term)
- [x] TML reading management with CML organization
- [x] Nozzle evaluation system with ASME B31.3 calculations
- [x] Material stress lookup with temperature interpolation
- [ ] Professional PDF report generation
- [x] AI-powered PDF/Excel import with LLM
- [x] CSV export functionality
- [x] Photo upload and S3 storage
- [x] Critical condition notifications

## Client-Side Features
- [x] Dashboard/home page
- [x] Inspection list view
- [x] Inspection detail view with tabs
- [x] New inspection form with all vessel data fields
- [x] Vessel data tab
- [x] Calculations tab with ASME formulas
- [x] TML readings tab with component hierarchy
- [x] Nozzle evaluation section
- [x] Professional report tab
- [x] Photos section with annotations
- [x] Findings and recommendations sections
- [x] Data import interface with parser selection
- [x] Validation dashboard with discrepancy indicators
- [x] CSV export UI

## Calculations Engine
- [x] Shell minimum thickness: t_min = PR/(SE - 0.6P)
- [x] Head minimum thickness: t_min = PD/(2SE - 0.2P)
- [x] Shell MAWP: P = (SE × t)/(R + 0.6t)
- [x] Head MAWP: P = (2SE × t)/(D + 0.2t)
- [x] Long-term corrosion rate: CR_LT = (t_initial - t_actual) / ΔT_total
- [x] Short-term corrosion rate: CR_ST = (t_previous - t_actual) / ΔT_recent
- [x] Governing rate selection (max of LT/ST)
- [x] Remaining life: RL = (t_actual - t_min) / CR
- [x] Next inspection interval (lesser of 10 years or 1/2 remaining life)

## Material Database
- [x] Carbon steel materials (SA-515, SA-516, SA-285)
- [x] Stainless steel materials (SA-240 304, 316, 321, 347)
- [x] Chrome-moly alloys (SA-387, SA-335)
- [x] Low-temperature materials (SA-333, SA-203)
- [x] Pipe and forged materials (SA-106, SA-105, SA-182)
- [x] Temperature-based stress lookup with interpolation

## PDF Generation
- [ ] Executive summary with TABLE A
- [ ] Shell evaluation section
- [ ] Head evaluation section
- [ ] Nozzle evaluation table
- [ ] Thickness measurements table
- [ ] Findings section
- [ ] Recommendations section
- [ ] Photo appendix

## AI Import System
- [ ] LLM-powered PDF text extraction
- [ ] Vision LLM for scanned PDFs
- [ ] Field mapping with confidence scores
- [ ] Auto-population of vessel data
- [ ] TML readings extraction
- [ ] Nozzle data extraction

## Testing
- [x] ASME calculation formula tests
- [ ] Material stress lookup tests
- [ ] PDF generation tests
- [ ] Import parser tests
