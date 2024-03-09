const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { PermissionFlagsBits } = require('discord-api-types/v10');
const { writeFileSync } = require('fs');
//file
const fichier = './data.json';
//functions
const { findCompanyName, firstLetterToUpperCase, findElementPos, handleUndefined } = require('../functions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('company')
        .setDescription("Commandes pour les entreprises")
        .addSubcommand(
            subcommand => subcommand
                .setName('create')
                .setDescription("Créer une nouvelle entreprise")
                .addStringOption( option => option.setName('name').setDescription("Nom de l'entreprise").setRequired(true) )
                .addStringOption( option => option.setName('type').setDescription("Type de l'entreprise").addChoices({ name: 'private', value: 'private' }, { name: 'public', value: 'public' }, { name: 'organization', value: 'organization' }).setRequired(true) )
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('add-employee')
                .setDescription("Ajouter un.e employé.e dans une entreprise")
                .addStringOption( option => option.setName('company_name').setDescription("Nom de l'entreprise ou vous souhaitez ajouter l'employé.e").setRequired(true) )
                .addUserOption( option => option.setName('employee').setDescription("Selectionnez la personne que vous souhaitez ajouter dans l'entreprise").setRequired(true) )
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('remove-employee')
                .setDescription("Retirer un.e employé.e dans une entreprise")
                .addStringOption( option => option.setName('company_name').setDescription("Nom de l'entreprise ou vous souhaitez retirer l'employé.e").setRequired(true) )
                .addUserOption( option => option.setName('employee').setDescription("Selectionnez la personne que vous souhaitez retirer dans l'entreprise").setRequired(true) )
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('withdraw')
                .setDescription("Retirer de l'argent d'une entreprise")
                .addStringOption( option => option.setName('company_name').setDescription("Nom de l'entreprise ou vous souhaitez retirer de l'argent").setRequired(true) )
                .addIntegerOption( option => option.setName('amount').setDescription("Somme d'argent à retirer").setRequired(true) )
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('deposit')
                .setDescription("Déposer de l'argent d'une entreprise")
                .addStringOption( option => option.setName('compagny_name').setDescription("Nom de l'entreprise ou vous souhaitez déposer de l'argent").setRequired(true) )
                .addIntegerOption( option => option.setName('amount').setDescription("Somme d'argent à déposer").setRequired(true) )
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('info')
                .setDescription("Afficher les informations d'une entreprise")
                .addStringOption( option => option.setName('compagny_name').setDescription("Nom de l'entreprise").setRequired(true) )
        ),
    async execute(interaction, miami_rp, Company) {
        let subcommand = interaction.options.getSubcommand();

        if (subcommand === "create") {
            let company_name = interaction.options.getString('name');
            let company_type = interaction.options.getString('type');

            let company = new Company(company_name, company_type, interaction.member.id);

            if (findCompanyName(miami_rp.compagnies, company_name)) {
                await interaction.reply(`Une entreprise porte déjà le nom \`${company_name}\`; vous ne pouvez pas créer une entreprise qui porte le même nom`);
            }
            else {
                miami_rp.compagnies.push(company);

                writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                await interaction.reply(`L'entreprise \`${company_name}\` a bien été crée`);
            }
        }
        else if (subcommand === "add-employee") {
            let company_name = interaction.options.getString('company_name');
            let employee = interaction.options.getUser('employee');

            let company = miami_rp.compagnies.filter(c => c.name === company_name)[0];

            let replied = false;

            if (company == undefined || company == null || company == "") {
                replied = true;

                await interaction.reply(`Aucunes entreprises ne porte le nom \`${company_name}\``);
            }

            if (company.patron != interaction.member.id) {
                if (!replied) {
                    replied = true;

                    await interaction.reply("Vous n'êtes pas patron de cette entreprise, vous ne pouvez alors ajouter aucun.e.s employé.e.s");
                }
            }

            if (employee.bot) {
                if (!replied) {
                    replied = true;

                    await interaction.reply("Vous ne pouvez pas ajouter un bot en tant qu'employé dans votre entreprise");
                }
            }

            if (company.employees.includes(employee.id)) {
                if (!replied) {
                    replied = true;

                    await interaction.reply("Cette personne est déjà employée dans votre entreprise, vous ne pouvez alors pas l'ajouter");
                }
            }

            if (!replied) {
                company.employees.push(employee.id);

                writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                let displayName = "";

                if (employee.displayName != employee.username) {
                    displayName = employee.displayName;
                }
                else {
                    displayName = employee.username;
                }

                displayName = firstLetterToUpperCase(displayName);

                await interaction.reply(`\`${displayName}\` a bien été ajouté dans votre entreprise`);
            }
        }
        else if (subcommand === "remove-employee") {
            let company_name = interaction.options.getString('company_name');
            let employee = interaction.options.getUser('employee');

            let company = miami_rp.compagnies.filter(c => c.name === company_name)[0];

            let replied = false;

            if (company == undefined || company == null || company == "") {
                replied = true;

                await interaction.reply(`Aucunes entreprises ne porte le nom \`${company_name}\``);
            }

            if (company.patron != interaction.member.id) {
                if (!replied) {
                    replied = true;

                    await interaction.reply("Vous n'êtes pas patron de cette entreprise, vous ne pouvez alors retirer aucun.e.s employé.e.s");
                }
            }

            if (!company.employees.includes(employee.id)) {
                if (!replied) {
                    replied = true;

                    await interaction.reply("Cette personne n'est pas employée dans votre entreprise, vous ne pouvez alors pas la retirer");
                }
            }

            if (!replied) {
                let employee_pos = findElementPos(company.employees, employee.id);

                company.employees.splice(employee_pos, 1);

                writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                let displayName = "";

                if (employee.displayName != employee.username) {
                    displayName = employee.displayName;
                }
                else {
                    displayName = employee.username;
                }

                displayName = firstLetterToUpperCase(displayName);

                await interaction.reply(`\`${displayName}\` a bien été retirer de votre entreprise`);
            }
        }
        else if (subcommand === "withdraw") {
            let company_name = interaction.options.getString('company_name');
            let amount = interaction.options.getInteger('amount');

            let company = miami_rp.compagnies.filter(c => c.name === company_name)[0];

            company = handleUndefined(company);

            if (company != undefined) {
                let player = miami_rp.players.filter(p => p.userID === interaction.member.id)[0];

                let replied = false;

                if (player == undefined || player == null || player == "") {
                    replied = true;

                    await interaction.reply("Il semblerait que vous n'ayez pas encore créer votre personnage RP, vous pouvez pas faire ça. Faites la commande `/id-card create` pour créer votre personnage");
                }

                if (interaction.member.id != company.patron) {
                    if (!replied) {
                        replied = true;

                        await interaction.reply("Vous n'êtes pas patron de l'entreprise, vous ne pouvez pas retirer de l'argent de cette entreprise");
                    }
                }

                if ((player.argent - amount) < 0) {
                    if (!replied) {
                        replied = true;

                        await interaction.reply(`Vous n'avez pas assez d'argent pour déposer \`${amount} $\`, il vous manque \`${(amount - player.argent)} $\``);
                    }
                }

                if (!replied) {
                    company.argent -= amount;

                    player.argent += amount;

                    writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                    await interaction.reply(`\`${amount} $\` a été retirée de l'entreprise \`${company_name}\``);
                }
            }
            else {
                await interaction.reply(`Aucunes entreprises ne porte le nom \`${company_name}\``);
            }
        }
        else if (subcommand === "deposit") {
            let company_name = interaction.options.getString('company_name');
            let amount = interaction.options.getInteger('amount');

            let company = miami_rp.compagnies.filter(c => c.name === company_name)[0];

            company = handleUndefined(company);

            if (company != undefined) {
                let player = miami_rp.players.filter(p => p.userID === interaction.member.id)[0];

                let replied = false;

                if (player == undefined || player == null || player == "") {
                    replied = true;

                    await interaction.reply("Il semblerait que vous n'ayez pas encore créer votre personnage RP, vous pouvez pas faire ça. Faites la commande `/id-card create` pour créer votre personnage");
                }

                if (!replied) {
                    company.argent += amount;

                    player.argent -= amount;

                    writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                    await interaction.reply(`\`${amount} $\` a été ajouter à l'entreprise \`${company_name}\``);
                }
            }
            else {
                await interaction.reply(`Aucunes entreprises ne porte le nom \`${company_name}\``);
            }
        }
        else if (subcommand === "info") {
            let compagny_name = interaction.options.getString('compagny_name');

            let compagny = miami_rp.compagnies.filter(c => c.name === compagny_name)[0];

            compagny = handleUndefined(compagny);

            if (compagny != undefined) {
                let lesFields = [];
                let values = "";
    
                if (compagny.employees.length === 1) {
                    lesFields.push({ name: 'Employé', value: `<@${compagny.employees[0]}>` });
                }
                else if (compagny.employees.length > 1) {
                    for (let i = 0; i < compagny.employees.length; i ++) {
                        let current_employee = compagny.employees[i];

                        if (i < (compagny.employees.length - 1)) {
                            values += `<@${current_employee}>, `;
                        }
                        else {
                            values += `<@${current_employee}>`;
                        }
                    }

                    lesFields.push({ name: 'Employé.e.s', value: values });
                }
                else {
                    lesFields.push({ name: 'Employé', value: 'Aucun employé pour le moment dans cette entreprise' });
                }

                let compagnyEmbed = {};

                if (lesFields.length === 0) {
                    compagnyEmbed = {
                        title: `${compagny.name}`,
                        color: 0xEBEBEB,
                        description: `Entreprise de type ${compagny.type}\n Gèrer par : <@${compagny.patron}> \n \n Argent de l'entreprise : \`${compagny.argent} $\``
                    }
                }
                else {
                    compagnyEmbed = {
                        title: `${compagny.name}`,
                        color: 0xEBEBEB,
                        description: `Entreprise de type ${compagny.type}\n Gèrer par : <@${compagny.patron}> \n \n Argent de l'entreprise : \`${compagny.argent} $\``,
                        fields: lesFields
                    }
                }

                await interaction.reply({ embeds: [compagnyEmbed] });
            }
            else {
                await interaction.reply(`Aucunes entreprises ne porte le nom \`${compagny_name}\``);
            }
        }
    }
}