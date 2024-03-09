const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { PermissionFlagsBits } = require('discord-api-types/v10');
const { writeFileSync } = require('fs');
//file
const fichier = './data.json';
//functions
const { handleUndefined } = require('../functions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pay')
        .setDescription("Payer ou donner de l'argent à quelqu'un")
        .addIntegerOption( option => option.setName('amount').setDescription("Somme à payer/donner").setRequired(true) )
        .addUserOption( option => option.setName('player').setDescription("Personne à qui est destiné l'argent").setRequired(true) ),
    async execute(interaction, miami_rp) {
        let amount = interaction.options.getInteger('amount');
        let player = interaction.options.getUser('player');

        player = miami_rp.players.filter(p => p.userID === player.id)[0];

        player = handleUndefined(player);

        if (player != undefined) {
            let sender = miami_rp.players.filter(p => p.userID === interaction.member.id)[0];

            let replied = false;

            if (sender == undefined || sender == nul || sender == "") {
                replied = true;

                await interaction.reply("Vous n'avez pas créer de joueur dans le roleplay, vous ne pouvez pas faire cela");
            }

            if (sender.argent - amount < 0) {
                if (!replied) {
                    replied = true;

                    await interaction.reply(`Vous n'avez pas assez d'argent pour faire ça, il vous manque \`${(amount - sender.argent)} $\``);
                }
            }

            if (!replied) {
                sender.argent -= amount;

                player.argent += amount;

                writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                await interaction.reply(`Vous venez d'envoyer \`${amount} $\` à \`${player.subname} ${player.name}\``);
            }
        }
        else {
            await interaction.reply("Cette personne n'a pas créer de joueur dans le roleplay, il ne peut pas recevoir l'argent");
        }
    }
}