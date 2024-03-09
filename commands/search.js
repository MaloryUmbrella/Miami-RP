const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, PermissionFlagsBits } = require("discord.js");
const { writeFileSync } = require('fs');
//file
const fichier = './data.json';
//functions
const { handleUndefined } = require('../functions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription("Commande de fouille")
        .addUserOption( option => option.setName('player').setDescription("Personne que vous souhaitez fouiller").setRequired(true) ),
    async execute(interaction, miami_rp) {
        let player = interaction.options.getUser('player');

        let playerExist = miami_rp.players.filter(p => p.userID === player.id)[0];

        playerExist = handleUndefined(playerExist);

        if (playerExist != undefined) {
            let drugs = playerExist.inventory.filter(item => item.type === "drug");

            if (drugs.length === 0) {
                let searchEmbed = {
                    title: "Fouille terminée",
                    color: 0x2574D9,
                    description: "Aucunes drogues n'a été trouvée"
                };

                await interaction.reply({ embeds: [searchEmbed] });
            }
            else {
                let drugsFind = "";
                let drugPoses = [];

                for (let i = 0; i < drugs.length; i ++) {
                    let current_drug = drugs[i];
                    drugPoses.push(playerExist.inventory.indexOf(current_drug));

                    if (i < (drugs.length - 1)) {
                        drugsFind += `${current_drug.stock} g de ${current_drug.name}`;
                    }
                    else {
                        drugsFind += `${current_drug.stock} g de ${current_drug.name} \n`;
                    }
                }

                let searchEmbed = {
                    title: "Fouille terminée",
                    color: 0x2574D9,
                    description: `Drogue(s) trouvée(s) \n \n${drugsFind}`
                };

                for (let i = 0; i < drugPoses.length; i ++) {
                    let currentDrugPos = drugPoses[i];

                    playerExist.inventory.splice(currentDrugPos, 1);
                }

                writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                await interaction.reply({ embeds: [searchEmbed] });
            }
        }
        else {
            await interaction.reply("Désolé, cette personne n'a pas créer de personnage RP");
        }
    }        
}