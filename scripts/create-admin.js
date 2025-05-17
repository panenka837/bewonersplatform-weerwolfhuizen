// Script om een admin gebruiker aan te maken met JSON database





// Functie om data te lezen uit een JSON-bestand
async function readJsonData(fileName) {
  try {
    const filePath = path.join(process.cwd(), 'data', `${fileName}.json`);
    
    // Controleer of het bestand bestaat
    if (!fs.existsSync(filePath)) {
      console.log(`Bestand ${filePath} bestaat niet, lege array wordt geretourneerd`);
      return [];
    }
    
    // Lees het bestand
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Fout bij het lezen van JSON data uit ${fileName}.json:`, error);
    return [];
  }
}

// Functie om data te schrijven naar een JSON-bestand
async function writeJsonData(fileName, data) {
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
    console.error(`Fout bij het schrijven van JSON data naar ${fileName}.json:`, error);
    return false;
  }
}

async function main() {
  try {
    // Lees alle gebruikers
    const users = await readJsonData('users');
    
    // Controleer of gebruikers wachtwoorden hebben, zo niet, voeg ze toe
    let updated = false;
    for (const user of users) {
      if (!user.password) {
        // Standaard wachtwoord is het eerste deel van het e-mailadres
        const defaultPassword = user.email.split('@')[0];
        user.password = await bcrypt.hash(defaultPassword, 10);
        updated = true;
        console.log(`Wachtwoord toegevoegd voor gebruiker: ${user.email} (wachtwoord: ${defaultPassword})`);
      }
    }
    
    if (updated) {
      await writeJsonData('users', users);
      console.log('Gebruikers bijgewerkt met wachtwoorden');
    }
    
    // Controleer of er al een admin gebruiker bestaat
    const existingAdmin = users.find(user => user.role === 'ADMIN');

    if (existingAdmin) {
      console.log('Er bestaat al een admin gebruiker:', existingAdmin.email);
      return;
    }

    // Admin gegevens
    const adminEmail = 'admin@weerwolfhuizen.nl';
    const adminPassword = 'Admin123!'; // In productie zou je een sterker wachtwoord gebruiken
    const adminName = 'Beheerder';

    // Hash het wachtwoord
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Genereer timestamps
    const now = new Date().toISOString();

    // Maak de admin gebruiker aan
    const admin = {
      id: uuidv4(),
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: 'ADMIN',
      createdAt: now,
      updatedAt: now
    };

    // Voeg de admin toe aan de gebruikers en sla op
    users.push(admin);
    await writeJsonData('users', users);

    console.log('Admin gebruiker aangemaakt:', admin.email);
  } catch (error) {
    console.error('Fout bij het aanmaken van admin gebruiker:', error);
  }
}

main();
