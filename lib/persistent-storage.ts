import fs from 'fs';
import path from 'path';

// Controleer of we in een productieomgeving draaien
const isProduction = process.env.NODE_ENV === 'production';

// In-memory cache voor data in productieomgeving
const memoryCache: Record<string, any[]> = {};

/**
 * Leest data uit een persistente opslag (bestand of in-memory cache)
 * @param key De sleutel/naam van de data
 * @returns Array met data
 */
export async function readData<T>(key: string): Promise<T[]> {
  try {
    console.log(`Reading data for key: ${key}, isProduction: ${isProduction}`);
    
    // In productie, gebruik in-memory cache
    if (isProduction) {
      if (!memoryCache[key]) {
        // Initialiseer met default data als het nog niet bestaat
        console.log(`Initializing memory cache for ${key}`);
        
        // Probeer initiële data te lezen uit het bestand (als het bestaat)
        try {
          const initialDataPath = path.join(process.cwd(), 'data', `${key}.json`);
          if (fs.existsSync(initialDataPath)) {
            const fileContent = fs.readFileSync(initialDataPath, 'utf-8');
            memoryCache[key] = JSON.parse(fileContent);
            console.log(`Loaded initial data for ${key} from file`);
          } else {
            memoryCache[key] = [];
            console.log(`No initial data file found for ${key}, using empty array`);
          }
        } catch (error) {
          console.error(`Error loading initial data for ${key}:`, error);
          memoryCache[key] = [];
        }
      }
      
      console.log(`Returning ${memoryCache[key].length} items from memory cache for ${key}`);
      return [...memoryCache[key]] as T[];
    }
    
    // In development, gebruik bestandssysteem
    const dirPath = path.join(process.cwd(), 'data');
    const filePath = path.join(dirPath, `${key}.json`);
    
    // Controleer of de directory bestaat
    if (!fs.existsSync(dirPath)) {
      console.log(`Creating directory: ${dirPath}`);
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Controleer of het bestand bestaat
    if (!fs.existsSync(filePath)) {
      console.log(`Creating empty file: ${filePath}`);
      fs.writeFileSync(filePath, JSON.stringify([]), 'utf-8');
      return [] as T[];
    }
    
    // Lees het bestand
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent) as T[];
    console.log(`Read ${data.length} items from file for ${key}`);
    return data;
  } catch (error) {
    console.error(`Error reading data for ${key}:`, error);
    return [] as T[];
  }
}

/**
 * Schrijft data naar een persistente opslag (bestand of in-memory cache)
 * @param key De sleutel/naam van de data
 * @param data De data om op te slaan
 * @returns Boolean die aangeeft of het schrijven is gelukt
 */
export async function writeData<T>(key: string, data: T[]): Promise<boolean> {
  try {
    console.log(`Writing ${data.length} items for key: ${key}, isProduction: ${isProduction}`);
    
    // In productie, gebruik in-memory cache
    if (isProduction) {
      memoryCache[key] = [...data];
      console.log(`Stored ${data.length} items in memory cache for ${key}`);
      return true;
    }
    
    // In development, gebruik bestandssysteem
    const dirPath = path.join(process.cwd(), 'data');
    const filePath = path.join(dirPath, `${key}.json`);
    
    // Controleer of de directory bestaat
    if (!fs.existsSync(dirPath)) {
      console.log(`Creating directory: ${dirPath}`);
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Schrijf naar het bestand
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Wrote ${data.length} items to file for ${key}`);
    return true;
  } catch (error) {
    console.error(`Error writing data for ${key}:`, error);
    return false;
  }
}
