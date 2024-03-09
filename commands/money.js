const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { PermissionFlagsBits } = require('discord-api-types/v10');
const { writeFileSync } = require('fs');
//file
const fichier = './data.json';

const { handleUndefined } = require('../functions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('money')
        .setDescription("Commande pour l'argent")
        .addSubcommand(
            subcommand => subcommand
                .setName('add')
                .setDescription("Ajouter de l'argent à un utilisateur")
                .addUserOption( option => option.setName('user').setDescription("Mentionner la personne à qui vous souhaitez ajouter de l'argent").setRequired(true) )
                .addIntegerOption( option => option.setName('amount').setDescription("Montant de l'argent à ajouter").setRequired(true) )
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('remove')
                .setDescription("Retirer de l'argent à un utilisateur")
                .addUserOption( option => option.setName('user').setDescription("Mentionner la personne à qui vous souhaitez retirer de l'argent").setRequired(true) )
                .addIntegerOption( option => option.setName('amount').setDescription("Montant de l'argent à retirer").setRequired(true) )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog),
    async execute (interaction, miami_rp) {
        let subcommand = interaction.options.getSubcommand();

        if (subcommand === "add") {
            let user = interaction.options.getUser('user');
            let amount = interaction.options.getInteger('amount');

            let player = miami_rp.players.filter(p => p.userID === user.id)[0];

            player = handleUndefined(player);

            if (player != undefined) {
                if (amount < 0 || amount === 0) {
                    await interaction.reply({ content: "Vous ne pouvez pas ajouter 0 ou de l'argent négatif. Si vous souhaitez retirer de l'argent, faite la commande `/money remove`" });
                }
                else {
                    player.argent += amount;
    
                    writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));
    
                    await interaction.reply({ content: `Vous avez bien ajouter ${amount} $ à ${player.name} ${player.subname}` });
                }
            }
            else {
                await interaction.reply("Cette personne n'a pas créer de joueur, vous ne pouvez pas faire ça");
            }
        }
        else if (subcommand === "remove") {
            let user = interaction.options.getUser('user');
            let amount = interaction.options.getInteger('amount');

            let player = miami_rp.players.filter(p => p.userID === user.id)[0];

            player = handleUndefined(player);

            if (player != undefined) {
                if (amount < 0) {
                    amount = -amount;
                }
                
                player.argent -= amount;

                writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                await interaction.reply({ content: `Vous avez bien retirer ${amount} $ à ${player.name} ${player.subname}` });
            }
            else {
                await interaction.reply("Cette personne n'a pas créer de joueur, vous ne pouvez pas faire ça");
            }
        }
    }
}