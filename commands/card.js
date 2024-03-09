const { SlashCommandBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { PermissionFlagsBits } = require('discord-api-types/v10');
const { writeFileSync } = require('fs');
const Canvas = require('@napi-rs/canvas');
//file
const fichier = './data.json';
//functions
const { hasIDCard, dateFormatCorrect, handleUndefined } = require('../functions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('id-card')
        .setDescription("Commandes pour la carte d'identité")
        .addSubcommand( subcommand => subcommand
            .setName('create')
            .setDescription("Créer une carte d'identité")
            .addStringOption( option => option
                .setName('name')
                .setDescription("Nom du personnage")
                .setRequired(true)
            )
            .addStringOption( option => option
                .setName('subname')
                .setDescription("Prénom du personnage")
                .setRequired(true)   
            )
            .addIntegerOption( option => option 
                .setName('age')
                .setDescription("Âge du personnage")
                .setRequired(true)
            )
            .addStringOption( option => option
                .setName('birth-date')
                .setDescription("Date de naissance du personnage. Format : JJ/MM/AAAA")
                .setRequired(true)
            )
            .addStringOption( option => option 
                .setName('gender')
                .setDescription("Sexe du personnage")
                .setRequired(true)
            )
            .addStringOption( option => option
                .setName('birth-place')
                .setDescription("Pays de naissance du personnage")
                .setRequired(true)
            )
        )
        .addSubcommand( subcommand => subcommand
            .setName('info')
            .setDescription("Consulter votre carte d'identité")
        ),
    async execute(interaction, miami_rp, Player) {
        let subcommand = interaction.options.getSubcommand();

        if (subcommand === "create") {
            try {
                let player = {
                    name: String(interaction.options.getString('name')),
                    subname: String(interaction.options.getString('subname')),
                    age: parseInt(interaction.options.getInteger('age')),
                    birth_date: String(interaction.options.getString('birth-date')),
                    gender: String(interaction.options.getString('gender')),
                    birth_place: String(interaction.options.getString('birth-place')),
                    url: interaction.user.avatarURL({ extension: 'png' })
                }

                player = new Player(interaction.user.id, player.name, player.subname, player.age, player.birth_date, player.gender, player.birth_place, player.url.attachment);

                let dateCorrecte = dateFormatCorrect(player.birth_date);

                if (dateCorrecte) {
                    let hasCard = hasIDCard(interaction.user.id, miami_rp);

                    if (hasCard === -1) {
                        miami_rp.players.push(player);

                        writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                        const canvas = Canvas.createCanvas(450, 225);
                        const context = canvas.getContext('2d');

                        const background = await Canvas.loadImage('./cards/id_card.png');

                        context.drawImage(background, 0, 0, canvas.width, canvas.height);

                        context.font = '12px Comic Sans MS';

                        context.fillStyle = '#ffffff';

                        context.fillText(`Nom : ${player.name}`, 130, 80);
                        context.fillText(`Prénom : ${player.subname}`, 130, 100);
                        context.fillText(`Né.e le : ${player.birth_date}`, 130, 120);
                        context.fillText(`Âge : ${player.age}`, 260, 120);
                        context.fillText(`Sexe : ${player.gender}`, 130, 140);
                        context.fillText(`À : ${player.birth_place}`, 130, 160);

                        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'id-card.png' });

                        await interaction.reply({ files: [attachment] });
                    }
                    else {
                        await interaction.reply({ content: "Vous avez déjà une carte d'identité. Pour l'afficher, faites la commande `/id-card info`" });
                    }
                }
                else {
                    await interaction.reply({ content: "La date n'est pas conforme avec le format demander. Veuillez réessayer" });
                }
            }
            catch ( Error ) {
                console.log(Error.message);
                interaction.reply("Il semblerait qu'il y est une erreur.");
            }
        }
        else if (subcommand === "info") {
            try {
                let player = miami_rp.players.filter(p => p.userID === interaction.user.id)[0];

                player = handleUndefined(player);

                if (player != undefined) {
                    const canvas = Canvas.createCanvas(450, 225);
                    const context = canvas.getContext('2d');

                    const background = await Canvas.loadImage('./cards/id_card.png');

                    context.drawImage(background, 0, 0, canvas.width, canvas.height);

                    context.font = '12px Comic Sans MS';

                    // Select the style that will be used to fill the text in
                    context.fillStyle = '#ffffff';

                    // Actually fill the text with a solid color
                    context.fillText(`Nom : ${player.name}`, 130, 80);
                    context.fillText(`Prénom : ${player.subname}`, 130, 100);
                    context.fillText(`Né.e le : ${player.birth_date}`, 130, 120);
                    context.fillText(`Âge : ${player.age}`, 260, 120);
                    context.fillText(`Sexe : ${player.gender}`, 130, 140);
                    context.fillText(`À : ${player.birth_place}`, 130, 160);

                    const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'id-card.png' });

                    await interaction.reply({ files: [attachment] });
                }
                else {
                    await interaction.reply({ content: "Vous n'avez pas encore de carte d'identité. Pour créer votre carte; faites la commande `/id-card create`" });
                }
            }
            catch ( Error ) {
                console.log(Error.message);
                interaction.reply("Il semblerait qu'il y est une erreur.");
            }
        }
    }
}