const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { PermissionFlagsBits } = require('discord-api-types/v10');
const { writeFileSync } = require('fs');
//file
const fichier = './data.json';
//functions
const { handleUndefined, findPosByName } = require('../functions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('drug')
        .setDescription("Commandes pour la drogue")
        .addSubcommand(
            subcommand => subcommand
                .setName('create')
                .setDescription("Créer une nouvelle drogue")
                .addStringOption( option => option.setName('name').setDescription("Nom de la drogue").setRequired(true) )
                .addIntegerOption( option => option.setName('price').setDescription("Prix au gramme").setRequired(true) )
                .addIntegerOption( option => option.setName('min').setDescription("Minimum gramme de collecter").setRequired(true) )
                .addIntegerOption( option => option.setName('max').setDescription("Maximum de gramme de collecter").setRequired(true))
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('edit-price')
                .setDescription("Modifier le prix d'une drogue")
                .addStringOption( option => option.setName('name').setDescription("Nom de la drogue dont vous souhaitez modifier le prix").setRequired(true) )
                .addIntegerOption( option => option.setName('new_price').setDescription("Nouveau prix de la drogue").setRequired(true) )
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('delete')
                .setDescription("Supprimer une drogue")
                .addStringOption( option => option.setName('name').setDescription("Nom de la drogyue que vous souhaitez supprimer").setRequired(true) )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog),
    async execute(interaction, miami_rp, Drug) {
        let subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            let drug_name = interaction.options.getString('name');
            let drug_price = interaction.options.getInteger('price');
            let min = interaction.options.getInteger('min');
            let max = interaction.options.getInteger('max');

            let drugExist = miami_rp.drugs.filter(d => d.name === drug_name)[0];

            drugExist = handleUndefined(drugExist);

            if (drugExist) {
                let drugEmbed = {
                    color: 0x3B49DA,
                    title: 'Nouvelle drogue créée : `' + drug_name + '`',
                    description: `Prix : \`1g = ${drug_price} $\` \n \nMinimum de collecte : \`${min}\` \nMaximum de collecte : \`${max}\``
                }
    
                let drug = new Drug(drug_name, drug_price, min, max);
    
                miami_rp.drugs.push(drug);
    
                writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));
    
                await interaction.reply({ embeds: [drugEmbed] });
            }
            else {
                await interaction.reply("Vous ne pouvez pas créer une drogue qui possède le même nom");
            }
        }
        else if (subcommand === 'edit-price') {
            let drug_name = interaction.options.getString('name');
            let drug_price = interaction.options.getInteger('new_price');

            let drug = miami_rp.drugs.filter(d => d.name === drug_name)[0];

            drug = handleUndefined(drug);

            if (drug != undefined) {
                if (drug_price < 0) {
                    await interaction.reply("Vous ne pouvez pas mettre un prix inférieur à 0");
                }
                else {
                    let old_price = drug.price;
                    drug.price = drug_price;

                    writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                    let drugEmbed = {
                        color: 0x3B49DA,
                        title: 'Drogue modifiée : `' + drug_name + '`',
                        description: "Ancient prix : ~~" + old_price + "$~~ \n Nouveau prix : **" + drug_price + "$**"
                    }

                    await interaction.reply({ embeds: [drugEmbed] });
                }
            }
            else {
                await interaction.reply(`Aucunes drogues ne portent le nom \`${drug_name}\``);
            }
        }
        else if (subcommand === 'delete') {
            let drug_name = interaction.options.getString('name');

            let drug = miami_rp.drugs.filter(d => d.name === drug_name);

            drug = handleUndefined(drug);

            if (drug != undefined) {
                let drug_pos = findPosByName(miami_rp.drugs, drug_name);

                miami_rp.drugs.splice(drug_pos, 1);

                writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                await interaction.reply(`La drogue \`${drug_name}\` a bien été supprimée`);
            }
            else {
                await interaction.reply(`Aucunes drogues ne portent le nom \`${drug_name}\``);
            }
        }
    }
}