const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { PermissionFlagsBits } = require('discord-api-types/v10');
const { writeFileSync } = require('fs');
//file
const fichier = './data.json';
//functions
const { handleUndefined } = require('../functions.js');

module.exports = {
    cooldown: 180,
    data: new SlashCommandBuilder()
        .setName('collect')
        .setDescription("Collecter de la drogue"),
    async execute(interaction, miami_rp, timestamps, now) {
        try {
            if (interaction.channel.id != "1135279274123870208") {
                await interaction.reply("Il n'y a rien à collecter ici");
            }
            else {
                let player = miami_rp.players.filter(p => p.userID === interaction.user.id)[0];
    
                player = handleUndefined(player);
    
                if (player != undefined) {
                    timestamps.set(interaction.user.id, now);
    
                    let options = [];
                    let drugs = miami_rp.drugs;
                                
                    for (let i = 0; i < drugs.length; i ++) {
                        let current_drogue = drugs[i];
                        options.push({ label: `${current_drogue.name}`, value: `${current_drogue.name}` });
                    }
    
                    let select = new ActionRowBuilder()
                        .addComponents(new StringSelectMenuBuilder({
                            custom_id: 'select-item',
                            placeholder: 'Selectionnez une drogue à récolter',
                            options: options
                    }));
    
                    let collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect });
    
                    let author = interaction.member;
    
                    collector.on('collect', async interaction => {
                        if (author.id != interaction.member.id) {
                            await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                        }
                        else {
                            let choice = interaction.values[0];
    
                            let updatedSelect = new ActionRowBuilder()
                                .addComponents(new StringSelectMenuBuilder({
                                    custom_id: 'select-item',
                                    placeholder: 'Selectionnez une drogue à récolter',
                                    options: options,
                                    disabled: true,
                                }));
    
                            let drug = player.inventory.filter(item => item.name === choice)[0];
                            let drugAmount = miami_rp.drugs.filter(drug => drug.name === choice)[0];
    
                            let random_quantity = Math.round(Math.random() * drugAmount.max) + drugAmount.min;
    
                            drug = handleUndefined(drug);
    
                            if (drug != undefined) {
                                drug.stock += random_quantity;
                            }
                            else {
                                player.inventory.push({ "name": choice, "stock": random_quantity, "type": "drug" });
                            }
    
                            writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));
    
                            collector.stop("Fin d'interaction");
    
                            await interaction.update({ components: [updatedSelect] });
    
                            await interaction.followUp(`Vous avez collecté.e \`${random_quantity} g\` de \`${choice}\``);
                        }
                    });
    
                    await interaction.reply({ components: [select] });
                }
                else {
                    await interaction.reply("Vous ne pouvez pas faire ça, vous n'ayez pas encore créer votre personnage RP.");
                }
            }
        }
        catch (Error) {
            console.log(Error.message);

            await interaction.reply("Une erreur est survenue");
        }
    }
}