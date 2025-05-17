// Script om bestaande berichten bij te werken met het type veld



// Functie om data te lezen uit een JSON-bestand
function readJsonData(fileName) {
  try {
    const filePath = path.join(process.cwd(), 'data', `${fileName}.json`);
    
    // Controleer of het bestand bestaat
    if (!fs.existsSync(filePath)) {
      console.log(`File ${filePath} does not exist, returning empty array`);
      return [];
    }
    
    // Lees het bestand
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading JSON data from ${fileName}.json:`, error);
    return [];
  }
}

// Functie om data te schrijven naar een JSON-bestand
function writeJsonData(fileName, data) {
  try {
    const dirPath = path.join(process.cwd(), 'data');
    const filePath = path.join(dirPath, `${fileName}.json`);
    
    // Controleer of de directory bestaat, zo niet, maak deze aan
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Schrijf naar het bestand
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing JSON data to ${fileName}.json:`, error);
    return false;
  }
}

// Hoofdfunctie om berichten bij te werken
async function updateMessages() {
  try {
    console.log('Updating messages with type field...');
    
    // Lees berichten uit JSON bestand
    const messages = readJsonData('messages');
    console.log(`Found ${messages.length} messages`);
    
    // Bijwerken van berichten
    let updatedCount = 0;
    
    for (const message of messages) {
      // Als het bericht al een type heeft, sla het over
      if (message.type) {
        console.log(`Message ${message.id} already has type: ${message.type}`);
        continue;
      }
      
      // Bepaal het type op basis van recipientId
      // Als recipientId null is, is het een groepsbericht
      // Anders is het een privébericht
      message.type = message.recipientId === null ? 'group' : 'private';
      updatedCount++;
      
      console.log(`Updated message ${message.id} with type: ${message.type}`);
    }
    
    // Sla de bijgewerkte berichten op
    if (updatedCount > 0) {
      writeJsonData('messages', messages);
      console.log(`Successfully updated ${updatedCount} messages`);
    } else {
      console.log('No messages needed updating');
    }
  } catch (error) {
    console.error('Error updating messages:', error);
  }
}

// Voer de functie uit
updateMessages();
