import fs from 'fs';
import path from 'path';

export interface ScenarioItem {
  id: string;
  countries: string[];
  headline: string;
  body: string;
}

export function parseCSVRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip LF
      }
      currentRow.push(currentCell);
      if (currentRow.some((c) => c.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (currentRow.some((c) => c.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export function parseCSV(csvContent: string): ScenarioItem[] {
  const lines = parseCSVRows(csvContent);
  if (lines.length <= 1) return [];

  const headers = lines[0].map((h) => h.trim().toLowerCase());
  const idIdx = headers.indexOf('id');
  const countriesIdx = headers.indexOf('countries');
  const headlineIdx = headers.indexOf('headline');
  const bodyIdx = headers.indexOf('body');

  const scenarios: ScenarioItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length < 4 || !row.some((cell) => cell.trim().length > 0)) continue;

    const id = (idIdx >= 0 && row[idIdx]) ? row[idIdx].trim() : `IE-${i.toString().padStart(3, '0')}`;
    const rawCountries = (countriesIdx >= 0 && row[countriesIdx]) ? row[countriesIdx] : '';
    const countries = rawCountries
      .split(';')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const headline = (headlineIdx >= 0 && row[headlineIdx]) ? row[headlineIdx].trim() : '';
    const body = (bodyIdx >= 0 && row[bodyIdx]) ? row[bodyIdx].trim() : '';

    scenarios.push({
      id,
      countries,
      headline,
      body,
    });
  }

  return scenarios;
}

export function getScenarioCSVPath(): string | null {
  const candidatePaths = [
    process.env.SCENARIO_CSV_PATH,
    path.resolve(process.cwd(), '../../Scenario library (the chosen ones)  - Sheet1.csv'),
    path.resolve(process.cwd(), '../Scenario library (the chosen ones)  - Sheet1.csv'),
    path.resolve(process.cwd(), './Scenario library (the chosen ones)  - Sheet1.csv'),
    path.resolve(process.cwd(), 'Scenario library (the chosen ones)  - Sheet1.csv'),
    '/home/dev/Desktop/imaginary-enemies-web/Scenario library (the chosen ones)  - Sheet1.csv',
  ].filter(Boolean) as string[];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

export async function getScenarios(): Promise<ScenarioItem[]> {
  const filePath = getScenarioCSVPath();
  if (!filePath) {
    console.error('Could not find Scenario library CSV file');
    return [];
  }

  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return parseCSV(content);
  } catch (error) {
    console.error('Error reading scenario CSV file:', error);
    return [];
  }
}

