const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { PermissionFlagsBits } = require('discord-api-types/v10');
const { writeFileSync } = require('fs');
//file
const fichier = './data.json';
//functions
const { handleUndefined, findPosByName, splitByNumber} = require('../functions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('launder')
        .setDescription("Blanchir la drogue dans votre inventaire")
        .addUserOption(option => option.setName('player').setDescription("Joueur à qui vous souhaitez blanchir l'argent sale").setRequired(true) )
        .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog),
    async execute(interaction, miami_rp) {
        let player = interaction.options.getUser('player');

        let playerExist = miami_rp.players.filter(p => p.userID === player.id)[0];

        playerExist = handleUndefined(playerExist);

        if (playerExist) {
            if (playerExist.argent_sale > 0) {
                let amount = playerExist.argent_sale;

                playerExist.argent += playerExist.argent_sale;
                playerExist.argent_sale = 0;

                writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                await interaction.reply(`Vous avez blanchis \`${amount} $\``);
            }
            else {
                await interaction.reply("Désolé, cette personne n'a pas d'argent sale à blanchir");
            }
        }
        else {
            await interaction.reply("Désolé, cette personne n'a pas créer de personnage RP");
        }
    }
}