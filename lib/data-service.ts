import { readData, writeData } from './persistent-storage';

/**
 * Leest data uit de persistente opslag
 * @param collectionName Naam van de collectie/bestand
 * @returns Array met data
 */
export async function readJsonData<T extends object = object>(collectionName: string): Promise<T[]> {
  console.log(`Reading data from collection: ${collectionName}`);
  return await readData<T>(collectionName);
}

/**
 * Schrijft data naar de persistente opslag
 * @param collectionName Naam van de collectie/bestand
 * @param data De data om op te slaan
 * @returns Boolean die aangeeft of het schrijven is gelukt
 */
export async function writeJsonData<T extends object = object>(collectionName: string, data: T[]): Promise<boolean> {
  console.log(`Writing data to collection: ${collectionName}`);
  return await writeData<T>(collectionName, data);
}
