import fs from 'fs';
import path from 'path';

// Functie om data te lezen uit een JSON-bestand
export async function readJsonData<T extends object = object>(fileName: string): Promise<T[]> {
  try {
    const dirPath = path.join(process.cwd(), 'data');
    const filePath = path.join(dirPath, `${fileName}.json`);
    
    // Log het pad voor debugging
    console.log(`Attempting to read from ${filePath}`);
    
    // Controleer of de directory bestaat
    if (!fs.existsSync(dirPath)) {
      console.log(`Directory ${dirPath} does not exist, creating it`);
      try {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
      } catch (dirError) {
        console.error(`Error creating directory ${dirPath}:`, dirError);
        return [];
      }
    }
    
    // Controleer of het bestand bestaat
    if (!fs.existsSync(filePath)) {
      console.log(`File ${filePath} does not exist, creating empty file`);
      try {
        fs.writeFileSync(filePath, JSON.stringify([]), 'utf-8');
        console.log(`Created empty file: ${filePath}`);
        return [];
      } catch (fileError) {
        console.error(`Error creating empty file ${filePath}:`, fileError);
        return [];
      }
    }
    
    // Lees het bestand
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const parsedData = JSON.parse(fileContent) as T[];
      console.log(`Successfully read ${parsedData.length} items from ${fileName}.json`);
      return Array.isArray(parsedData) ? parsedData : [];
    } catch (readError) {
      console.error(`Error reading or parsing ${filePath}:`, readError);
      return [];
    }
  } catch (error) {
    console.error(`Error in readJsonData for ${fileName}.json:`, error);
    return [];
  }
}

// Functie om data te schrijven naar een JSON-bestand
export async function writeJsonData<T extends object = object>(fileName: string, data: T[]): Promise<boolean> {
  try {
    const dirPath = path.join(process.cwd(), 'data');
    const filePath = path.join(dirPath, `${fileName}.json`);
    
    // Controleer of de directory bestaat, zo niet, maak deze aan
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
      } catch (dirError) {
        console.error(`Error creating directory ${dirPath}:`, dirError);
        return false;
      }
    }
    
    // Log de data die we gaan schrijven
    console.log(`Writing ${data.length} items to ${fileName}.json at path ${filePath}`);
    
    // Gebruik try-catch voor het schrijven naar het bestand
    try {
      // Gebruik writeFileSync in plaats van openSync/writeSync voor eenvoudiger code
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`Successfully wrote data to ${filePath}`);
      
      // Verifieer dat de data correct is geschreven
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const verificationData = JSON.parse(fileContent);
        console.log(`Verified ${verificationData.length} items in ${fileName}.json`);
        return true;
      } else {
        console.error(`File ${filePath} does not exist after write operation`);
        return false;
      }
    } catch (writeError) {
      console.error(`Error writing to file ${filePath}:`, writeError);
      return false;
    }
  } catch (error) {
    console.error(`Error writing JSON data to ${fileName}.json:`, error);
    return false;
  }
}

// Functie om een item toe te voegen aan een JSON-bestand
export async function addJsonItem<T extends { id: string }>(fileName: string, item: T): Promise<T | null> {
  try {
    // Lees bestaande data
    const data = await readJsonData<T>(fileName);
    // Voeg het nieuwe item toe
    data.push(item);
    // Schrijf de bijgewerkte data
    await writeJsonData<T>(fileName, data);
    return item;
  } catch (error) {
    console.error(`Error adding item to ${fileName}.json:`, error);
    return null;
  }
}

// Functie om een item te zoeken op ID
export async function findJsonItemById<T extends { id: string }>(
  fileName: string, 
  id: string
): Promise<T | null> {
  try {
    const data = await readJsonData<T>(fileName);
    return data.find(item => item.id === id) || null;
  } catch (error) {
    console.error(`Error finding item in ${fileName}.json:`, error);
    return null;
  }
}

// Functie om een item te verwijderen op ID
export async function deleteJsonItemById<T extends { id: string }>(
  fileName: string, 
  id: string
): Promise<boolean> {
  try {
    // Lees bestaande data
    const data = await readJsonData<T>(fileName);
    
    // Filter het item eruit
    const filteredData = data.filter(item => item.id !== id);
    
    // Als de lengtes gelijk zijn, is er niets verwijderd
    if (data.length === filteredData.length) {
      return false;
    }
    
    // Schrijf de bijgewerkte data
    await writeJsonData(fileName, filteredData);
    
    return true;
  } catch (error) {
    console.error(`Error deleting item from ${fileName}.json:`, error);
    return false;
  }
}

// Functie om een item te updaten
export async function updateJsonItemById<T extends { id: string }>(
  fileName: string, 
  id: string, 
  updates: Partial<T>
): Promise<T | null> {
  try {
    // Lees bestaande data
    const data = await readJsonData<T>(fileName);
    
    // Zoek het item
    const index = data.findIndex(item => item.id === id);
    
    // Als het item niet gevonden is
    if (index === -1) {
      return null;
    }
    
    // Update het item
    data[index] = { ...data[index], ...updates };
    
    // Schrijf de bijgewerkte data
    await writeJsonData(fileName, data);
    
    return data[index];
  } catch (error) {
    console.error(`Error updating item in ${fileName}.json:`, error);
    return null;
  }
}
