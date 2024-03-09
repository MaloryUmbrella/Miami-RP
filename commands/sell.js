const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, PermissionFlagsBits } = require("discord.js");
const { writeFileSync } = require('fs');
//file
const fichier = './data.json';
//functions
const { handleUndefined, findPosByName, splitByNumber} = require('../functions.js');

module.exports = {
    cooldown: 180,
    data: new SlashCommandBuilder()
        .setName('sell')
        .setDescription("Commande de vente de drogue"),
    async execute(interaction, miami_rp, timestamps, now) {
        let player = miami_rp.players.filter(p => p.userID === interaction.user.id)[0];

        player = handleUndefined(player);

        if (player != undefined) {
            timestamps.set(interaction.user.id, now);

            let drugs = player.inventory.filter(item => item.type === "drug");

            if (drugs.length > 0) {
                let options = [];

                for (let i = 0; i < drugs.length; i ++) {
                    let current_drogue = drugs[i];
                    options.push({ label: `${current_drogue.name}`, value: `${current_drogue.name}` });
                }

                let select = new ActionRowBuilder()
                    .addComponents(new StringSelectMenuBuilder({
                        custom_id: 'select-item',
                        placeholder: 'Selectionnez une drogue à blanchir',
                        options: options
                }));

                let newSelect = new ActionRowBuilder()
                    .addComponents(new StringSelectMenuBuilder({
                        custom_id: 'select',
                        placeholder: 'Selectionnez une quantité à blanchir',
                        options: [{ label: '10', value: '10' }],
                        disabled: true
                }));

                let collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect });

                let author = interaction.member;

                let interacts = 0;
                let drug_pos = 0;
                let drug_selected = "";
                let drug_obj = 0;

                collector.on('collect', async interaction => {
                    if (author.id != interaction.member.id) {
                        await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                    }
                    else {
                        let choice = interaction.values[0];

                        interacts += 1;

                        if (interacts < 2) {
                            drug_pos = findPosByName(player.inventory, choice);
                            drug_selected = player.inventory[drug_pos];
                            drug_obj = miami_rp.drugs[findPosByName(miami_rp.drugs, choice)];

                            let howManyToLaunder = splitByNumber(drug_selected.stock);

                            options = [];

                            for (let i = 0; i < howManyToLaunder.length; i ++) {
                                let current_amount = howManyToLaunder[i];
                                options.push({ label: `${current_amount} g`, value: `${current_amount}` });
                            }

                            select = new ActionRowBuilder()
                                .addComponents(new StringSelectMenuBuilder({
                                    custom_id: 'select',
                                    placeholder: 'Selectionnez une drogue à blanchir',
                                    options: [{ label: '10', value: '10' }],
                                    disabled: true
                            }));

                            newSelect = new ActionRowBuilder()
                                .addComponents(new StringSelectMenuBuilder({
                                    custom_id: 'select-item',
                                    placeholder: 'Selectionnez une quantité à blanchir',
                                    options: options
                            }));

                            await interaction.update({ components: [select, newSelect] });
                        }
                        else {
                            choice = parseInt(interaction.values[0]);

                            if (choice < drug_selected.stock) {
                                drug_selected.stock -= choice;
                            } 
                            else {
                                player.inventory.splice(drug_pos, 1);
                            }

                            let amount_to_price = choice * drug_obj.price;

                            player.argent_sale += amount_to_price;

                            writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                            let updatedNewSelect = new ActionRowBuilder()
                                .addComponents(new StringSelectMenuBuilder({
                                    custom_id: 'patate',
                                    placeholder: 'Selectionnez une quantité à blanchir',
                                    options: [{ label: '10', value: '10' }],
                                    disabled: true
                                }));

                            collector.stop("Fin d'interaction");

                            await interaction.update({ components: [select, updatedNewSelect] });

                            await interaction.followUp(`Vous avez vendu \`${choice} g\` de \`${drug_selected.name}\` pour \`${amount_to_price} $\``);
                        }
                    }
                });

                await interaction.reply({ components: [select, newSelect] });
            }
            else {
                await interaction.reply("Vous n'avez aucunes drogues à vendre");
            }
        }
        else {
            await interaction.reply("Vous n'avez pas créer votre personnage RP, vous ne pouvez pas faire ça");
        }
    }
}