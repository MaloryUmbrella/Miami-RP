const { Client, GatewayIntentBits, ActivityType, WebhookClient, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType, ComponentType, AttachmentBuilder, MessageActionRow, MessageButton, MessageSelectMenu, IntentsBitField, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes, PermissionFlagsBits } = require('discord-api-types/v10');
const { writeFileSync, readFileSync } = require('fs');
const { token } = require('./config.json');

//functions
let { lastShopID, lastItemID } = require('./functions.js');

const client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.MessageContent ] });

client.once('ready', () => {
	client.user.setPresence({
		activities: [{ 
			name: "Role playing",
			type: ActivityType.Playing,
		}],
        status: "online",
    });
    console.log('En ligne !');
});

client.login(token);

//commands
const id_card_commands = require('./commands/card.js');
const money_commands = require('./commands/money.js');
const salary_commands = require('./commands/salary.js');
const shop_commands = require('./commands/shop.js');
const company_commands = require('./commands/company.js');
const bill_commands = require('./commands/bill.js');
const pay_commands = require('./commands/pay.js');
const bank_commands = require('./commands/bank.js');
const loan_commands = require('./commands/loan.js');
const license_commands = require('./commands/license.js');
const registration_commands = require('./commands/registration.js');
const drug_commands = require('./commands/drug.js');
const collect_command = require('./commands/collect.js');
const launder_command = require('./commands/launder.js');
const inventory_command = require('./commands/inventory.js');
const robbery_commands = require('./commands/robbery.js');
const search_command = require('./commands/search.js');
const sell_command = require('./commands/sell.js');
const weaponLicence_command = require('./commands/weapon_license.js');

class SlashCommands {
    //classe de commandes slashs
	clientId;
	commands = [];
	rest;

	constructor() {
		this.clientID = '1147192849209765911';

		this.commands = [
			id_card_commands.data,
			money_commands.data,
			salary_commands.data,
			shop_commands.data,
			company_commands.data,
			bill_commands.data,
			pay_commands.data,
			bank_commands.data,
			loan_commands.data,
			license_commands.data,
			registration_commands.data,
			drug_commands.data,
			collect_command.data,
			launder_command.data,
			inventory_command.data,
			robbery_commands.data,
			search_command.data,
			sell_command.data,
			weaponLicence_command.data
		]
		.map(command => command.toJSON());

		this.rest = new REST({ version: '10' }).setToken(token);
	}

	build() {
		this.rest.put(Routes.applicationCommands(this.clientID), { body: this.commands })
			.then((data) => console.log(`${data.length} commandes enregistrées sur le bot.`))
			.catch(error => console.log(error.message));
	}

	getCommands() {
		return this.commands
	}
}

let slash_commands = new SlashCommands();

slash_commands.build();

class Bot {
	players = [];
	banks = [];
	shops = [];
	drugs = [];
	robberies = [];
	compagnies = [];

	constructor() {
		this.bank_account_start = 0;
	}
}

class Player {
	inventory = [];
	licenses = [];
	certificats = [];
	
	constructor(userID, nom, prenom, age, date_naiss, sexe, pays_naiss, url, argent=0) {
		this.userID = userID;
		this.name = nom;
		this.subname = prenom;
		this.age = age;
		this.birth_date = date_naiss;
		this.gender = sexe;
		this.birth_place = pays_naiss;
		this.url = url;
		this.argent = argent;
		this.argent_sale = 0;
	}
}

class Shop {
	items = [];

	constructor(nom, type, argent) {
		this.shopID = lastShopID(miami_rp.shops);
		this.name = nom;
		this.type = type;
		this.argent = argent;
	}
}

class Item {
	constructor(current_shop, nom, prix) {
		this.itemID = lastItemID(current_shop.items);
		this.name = nom;
		this.price = prix;
	}
}

class Company {
	employees = [];

	constructor(nom, type, memberID) {
		this.patron = memberID;
		this.name = nom;
		this.type = type;
		this.argent = 0;
		this.employees.push(memberID);
	}
}

class Bank {
	loans = [];
	history = [];

	constructor(memberID, start) {
		this.owner = memberID;
		this.argent = start;
	}
}

class Loan {
	constructor(amount, reason, loanID) {
		this.amount = amount;
		this.reason = reason;
		this.refund = 0;
		this.loanID = loanID;
	}
}

class License {
	constructor(type, nb_points=-1) {
		this.type = type;
		this.nb_points = nb_points;
		let datee = Date.now();
		let options = {day: "numeric", month: "numeric", year: "numeric"};
		let date_convert = new Intl.DateTimeFormat('default', options).format(datee);
		this.date = date_convert;
	}
}

class Drug {
	constructor(name, price, min, max) {
		this.name = name;
		this.price = price;
		this.min = min;
		this.max = max;
	}
}

class Robbery {
	constructor(entreprise, somme, time, max_participants) {
		this.entreprise = entreprise;
		this.somme = somme;
		this.time = time;
		this.max_participants = max_participants;
		this.participants = [];
	}

	setRobberyID(robbery_id) {
		this.id = robbery_id;
	}
}

const fichier = './data.json';

const file_content = readFileSync(fichier, 'utf8');

let miami_rp;

if (file_content == "{}" || file_content == "") {
	miami_rp = new Bot();
	writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));
}
else {
	miami_rp = JSON.parse(file_content);
}

//emojis
const emojis = {
	plus_icon: "<:plus_icon:1159126682440052847>",
	minus_icon: "<:minus_icon:1159126684939866173>"
};

client.cooldowns = new Collection();

client.on('interactionCreate', async interaction => {
	let commandName = interaction.commandName;

	const { cooldowns } = interaction.client;

	if (!cooldowns.has("collect")) {
		cooldowns.set("collect", new Collection());
	}

	if (!cooldowns.has("sell")) {
		cooldowns.set("sell", new Collection());
	}

	const now = Date.now();

	const collectTimestamp = cooldowns.get("collect");
	const sellTimestamp = cooldowns.get("sell");

	const collectCooldownAmount = (collect_command.cooldown) * 1000;
	const sellCooldownAmount = (sell_command.cooldown) * 1000;

	if (commandName === "id-card") {
		id_card_commands.execute(interaction, miami_rp, Player);
	}
	else if (commandName === "money") {
		money_commands.execute(interaction, miami_rp);
	}
	else if (commandName === "salary") {
		salary_commands.execute(interaction, miami_rp);
	}
	else if (commandName === "shop") {
		shop_commands.execute(interaction, miami_rp, Shop, Item);
	}
	else if (commandName === "company") {
		company_commands.execute(interaction, miami_rp, Company);
	}
	else if (commandName === "bill") {
		bill_commands.execute(interaction, miami_rp);
	}
	else if (commandName === "pay") {
		pay_commands.execute(interaction, miami_rp);
	}
	else if (commandName === "bank") {
		bank_commands.execute(interaction, miami_rp, Bank, emojis);
	}
	else if (commandName === "loan") {
		loan_commands.execute(interaction, miami_rp, Loan, emojis);
	}
	else if (commandName === "license") {
		license_commands.execute(interaction, miami_rp, License);
	}
	else if (commandName === "registration") {
		registration_commands.execute(interaction, miami_rp);
	}
	else if (commandName === "drug") {
		drug_commands.execute(interaction, miami_rp, Drug);
	}
	else if (commandName === "collect") {
		if (collectTimestamp.has(interaction.user.id)) {
			const expirationTime = collectTimestamp.get(interaction.user.id) + collectCooldownAmount;
			
			if (now < expirationTime) {
				const expiredTimestamp = Math.round(expirationTime / 1000);
				await interaction.reply({ content: `Vous ne pouvez pas collecter de la drogue maintenant. Essayez de nouveau <t:${expiredTimestamp}:R>`, ephemeral: true });
			}
		}
		else {
			collect_command.execute(interaction, miami_rp, collectTimestamp, now);

			setTimeout(() => collectTimestamp.delete(interaction.user.id), collectCooldownAmount);
		}
	}
	else if (commandName === "launder") {
		launder_command.execute(interaction, miami_rp);
	}
	else if (commandName === "inventory") {
		inventory_command.execute(interaction, miami_rp);
	}
	else if (commandName === "robbery") {
		robbery_commands.execute(interaction, miami_rp, Robbery);
	}
	else if (commandName === "search") {
		search_command.execute(interaction, miami_rp);
	}
	else if (commandName === "sell") {
		if (sellTimestamp.has(interaction.user.id)) {
			const expirationTime = sellTimestamp.get(interaction.user.id) + sellCooldownAmount;

			if (now < expirationTime) {
				const expiredTimestamp = Math.round(expirationTime / 1000);
				await interaction.reply({ content: `Vous ne pouvez pas blanchir de la drogue maintenant. Essayez de nouveau <t:${expiredTimestamp}:R>`, ephemeral: true });
			}
		}
		else {
			sell_command.execute(interaction, miami_rp, sellTimestamp, now);

			setTimeout(() => sellTimestamp.delete(interaction.user.id), sellCooldownAmount);
		}
	}
	else if (commandName === "weapon-license") {
		weaponLicence_command.execute(interaction, miami_rp);
	}
});