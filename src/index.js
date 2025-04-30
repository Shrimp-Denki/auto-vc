const { Client, Collection, Events, GatewayIntentBits, Partials  } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { table } = require('console');
require('dotenv').config();

// Create client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates, 
  ],
  partials: [ Partials.Channel ] 
});

// Add commands collection to client
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Prepare command data for table display
const commandsData = [];

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commandsData.push({
      Command: command.data.name,
      Description: command.data.description
    });
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Display commands table
console.log('\n=== COMMANDS LOADED ===');
if (commandsData.length > 0) {
  table(commandsData);
} else {
  console.log('No commands found.');
}

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

// Prepare event data for table display
const eventsData = [];

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
  
  eventsData.push({
    Event: event.name,
    Once: event.once ? 'Yes' : 'No'
  });
}

// Display events table
console.log('\n=== EVENTS LOADED ===');
if (eventsData.length > 0) {
  table(eventsData);
} else {
  console.log('No events found.');
}

// Login to Discord with your client's token
client.login(process.env.TOKEN)
  .then(() => {
    console.log('\n=== BOT ONLINE ===');
  })
  .catch(error => {
    console.error('Failed to login:', error);
  });
