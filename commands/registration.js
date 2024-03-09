const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { PermissionFlagsBits } = require('discord-api-types/v10');
const { writeFileSync } = require('fs');
const Canvas = require('@napi-rs/canvas');
//file
const fichier = './data.json';
//functions
const { handleUndefined } = require('../functions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('registration')
        .setDescription("Commandes pour les immatriculations")
        .addSubcommand(
            subcommand => subcommand
                .setName('plate-create')
                .setDescription("Créer une certification d'immatriculation")
                .addUserOption( option => option.setName('player').setDescription("Personne à qui est déstiné le certificat").setRequired(true) )
                .addStringOption( option => option.setName('vehicule').setDescription("Référence du véhicule").setRequired(true) )
                .addStringOption( option => option.setName('plaque').setDescription("Plaque d'immatriculation").setRequired(true) )
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('info')
                .setDescription("Consultez vos certificats d'immatriculation")
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('plate-delete')
                .setDescription("Supprimer une certification d'immatriculation")
                .addUserOption( option => option.setName('player').setDescription("Personne qui possède la certification à supprimer").setRequired(true) )
                .addStringOption( option => option.setName('vehicule').setDescription("Référence du véhicule").setRequired(true) )
                .addStringOption( option => option.setName('plaque').setDescription("Plague d'immatriculation").setRequired(false) )
        ),
    async execute(interaction, miami_rp) {
        let subcommand = interaction.options.getSubcommand();

        if (subcommand === 'plate-create') {
            if (interaction.memberPermissions.has(PermissionFlagsBits.ViewAuditLog) || interaction.member.roles.cache.some(role => role.id === "1135234369963962438")) {
                let player = interaction.options.getUser('player');
                let vehicule_ref = interaction.options.getString('vehicule');
                let plaque = interaction.options.getString('plaque');

                player = miami_rp.players.filter(p => p.userID === player.id)[0];

                player = handleUndefined(player);

                if (player != undefined) {
                    const canvas = Canvas.createCanvas(380, 210);
                    const context = canvas.getContext('2d');

                    const background = await Canvas.loadImage('./cards/registration_card.png');

                    context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);

                    context.font = '17px Comic Sans MS';

                    context.fillStyle = '#ffffff';

                    if (player != undefined && player != null && player != "") {
                        context.fillText(`${player.subname} ${player.name}`, 90, 103.5);
                    }
                    else {
                        context.fillText(`${interaction.member.displayName}`, 90, 103.5);
                    }

                    context.fillText(`${vehicule_ref}`, 90, 172.5);

                    context.fillText(`${plaque}`, 90, 200);

                    player.certificats.push({ "vehicule_ref": vehicule_ref, "plaque": plaque });

                    writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                    const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'registration-card.png' });

                    await interaction.reply({ files: [attachment] });
                }
                else {
                    await interaction.reply("Cette personne n'a pas créer son personnage RP, elle ne peut pas avoir de certificat d'immatriculation");
                }
            }
            else {
                await interaction.reply("Vous ne pouvez pas créer de certification d'immatriculation");
            }
        }
        else if (subcommand === 'info') {
            let player = miami_rp.players.filter(p => p.userID === interaction.user.id)[0];

            player = handleUndefined(player);

            if (player != undefined) {
                if (player.certificats != undefined) {
                    if (player.certificats.length === 1) {
                        const canvas = Canvas.createCanvas(380, 210);
                        const context = canvas.getContext('2d');

                        const background = await Canvas.loadImage('./cards/registration_card.png');

                        context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);

                        context.font = '17px Comic Sans MS';

                        context.fillStyle = '#ffffff';

                        if (player != undefined && player != null && player != "") {
                            context.fillText(`${player.subname} ${player.name}`, 90, 103.5);
                        }
                        else {
                            context.fillText(`${interaction.member.displayName}`, 90, 103.5);
                        }

                        current_certificat = player.certificats[0];

                        context.fillText(`${current_certificat.vehicule_ref}`, 90, 172.5);

                        context.fillText(`${current_certificat.plaque}`, 90, 200);

                        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'registration-card.png' });

                        await interaction.reply({ files: [attachment] });
                    }
                    else if (player.certificats.length === 2) {
                        const canvas = Canvas.createCanvas(380, 210);
                        const context = canvas.getContext('2d');

                        const background = await Canvas.loadImage('./cards/registration_card.png');

                        context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);

                        context.font = '17px Comic Sans MS';

                        context.fillStyle = '#ffffff';

                        if (player != undefined && player != null && player != "") {
                            context.fillText(`${player.subname} ${player.name}`, 90, 103.5);
                        }
                        else {
                            context.fillText(`${interaction.member.displayName}`, 90, 103.5);
                        }

                        current_certificat = player.certificats[0];

                        context.fillText(`${current_certificat.vehicule_ref}`, 90, 172.5);

                        context.fillText(`${current_certificat.plaque}`, 90, 200);

                        const buttons = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder({
                                    custom_id: 'previous',
                                    label: 'Page précédente',
                                    style: ButtonStyle.Primary,
                                    emoji: '◀️'
                                }),
                                new ButtonBuilder({
                                    custom_id: 'next',
                                    label: 'Page suivante',
                                    style: ButtonStyle.Primary,
                                    emoji: '▶️'
                                }),
                                new ButtonBuilder({
                                    custom_id: 'stop',
                                    label: 'Consultation terminée',
                                    style: ButtonStyle.Danger,
                                    emoji: '<:Valid:991360426774384760>'
                                })
                            );

                        let collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button });

                        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'registration-card.png' });

                        let i = 0;
                        let lastAttachment = attachment;

                        collector.on('collect', async interaction => {
                            let customID = interaction.customId;

                            if (customID === 'previous') {
                                i -= 1;
                                if (i < 0) {
                                    i = 1;
                                }

                                const canvas = Canvas.createCanvas(380, 210);
                                const context = canvas.getContext('2d');

                                const background = await Canvas.loadImage('./cards/registration_card.png');

                                context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);

                                context.font = '17px Comic Sans MS';

                                context.fillStyle = '#ffffff';

                                if (player != undefined && player != null && player != "") {
                                    context.fillText(`${player.subname} ${player.name}`, 90, 103.5);
                                }
                                else {
                                    context.fillText(`${interaction.member.displayName}`, 90, 103.5);
                                }

                                current_certificat = player.certificats[i];

                                context.fillText(`${current_certificat.vehicule_ref}`, 90, 172.5);

                                context.fillText(`${current_certificat.plaque}`, 90, 200);

                                const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'registration-card.png' });

                                lastAttachment = attachment;

                                await interaction.update({ files: [attachment] });
                            }
                            else if (customID === 'next') {
                                i += 1;
                                if (i > 1) {
                                    i = 0;
                                }

                                const canvas = Canvas.createCanvas(380, 210);
                                const context = canvas.getContext('2d');

                                const background = await Canvas.loadImage('./cards/registration_card.png');

                                context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);

                                context.font = '17px Comic Sans MS';

                                context.fillStyle = '#ffffff';

                                if (player != undefined && player != null && player != "") {
                                    context.fillText(`${player.subname} ${player.name}`, 90, 103.5);
                                }
                                else {
                                    context.fillText(`${interaction.member.displayName}`, 90, 103.5);
                                }

                                current_certificat = player.certificats[i];

                                context.fillText(`${current_certificat.vehicule_ref}`, 90, 172.5);

                                context.fillText(`${current_certificat.plaque}`, 90, 200);

                                const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'registration-card.png' });

                                lastAttachment = attachment;

                                await interaction.update({ files: [attachment] });
                            }
                            else if (customID === 'stop') {
                                const updatedButtons = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder({
                                            custom_id: 'previous',
                                            label: 'Page précédente',
                                            style: ButtonStyle.Primary,
                                            emoji: '◀️',
                                            disabled: true
                                        }),
                                        new ButtonBuilder({
                                            custom_id: 'next',
                                            label: 'Page suivante',
                                            style: ButtonStyle.Primary,
                                            emoji: '▶️',
                                            disabled: true
                                        }),
                                        new ButtonBuilder({
                                            custom_id: 'stop',
                                            label: 'Consultation terminée',
                                            style: ButtonStyle.Danger,
                                            emoji: '<:Unvalid:991360425281204265>',
                                            disabled: true
                                        })
                                    );
                                
                                collector.stop("Fin d'interaction");

                                await interaction.update({ files: [lastAttachment], components: [updatedButtons] });
                            }
                        });

                        await interaction.reply({ files: [attachment], components: [buttons] });
                    }
                    else {
                        await interaction.reply("Vous n'avez aucuns certificats d'immatriculation");
                    }
                }
                else {
                    await interaction.reply("Vous n'avez aucuns certificats d'immatriculation");
                }
            }
            else {
                await interaction.reply("Vous n'avez pas créer votre personnage RP, vous ne pouvez pas faire ça");
            }
        }
        else if (subcommand === "plate-delete") {
            let player = interaction.options.getUser('player');
            let vehicule_ref = interaction.options.getString('vehicule');
            let plaque = interaction.options.getString('plaque');

            player = miami_rp.players.filter(p => p.userID === player.id)[0];

            player = handleUndefined(player);
            plaque = handleUndefined(plaque);

            if (plaque == undefined) {
                if (player != undefined) {
                    if (player.certificats != undefined) {
                        let vehicule = player.certificats.filter(c => c.vehicule_ref === vehicule_ref)[0];
                        vehicule = handleUndefined(vehicule);

                        if (vehicule == undefined) {
                            let unfoundVehiculeEmbed = {
                                title: "Aucuns véhicules trouvés",
                                description: `Il semblerait qu'aucuns véhicules porte ce nom. Voici les certifications d'immatriculation de <@${player.userID}>`,
                                color: 0xEA951A
                            };

                            if (player.certificats.length === 1) {
                                const canvas = Canvas.createCanvas(380, 210);
                                const context = canvas.getContext('2d');
        
                                const background = await Canvas.loadImage('./cards/registration_card.png');
        
                                context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
        
                                context.font = '17px Comic Sans MS';
        
                                context.fillStyle = '#ffffff';
        
                                if (player != undefined && player != null && player != "") {
                                    context.fillText(`${player.subname} ${player.name}`, 90, 103.5);
                                }
                                else {
                                    context.fillText(`${interaction.member.displayName}`, 90, 103.5);
                                }
        
                                current_certificat = player.certificats[0];
        
                                context.fillText(`${current_certificat.vehicule_ref}`, 90, 172.5);
        
                                context.fillText(`${current_certificat.plaque}`, 90, 200);
        
                                const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'registration-card.png' });
        
                                await interaction.reply({ embeds: [unfoundVehiculeEmbed], files: [attachment] });
                            }
                            else if (player.certificats.length === 2) {
                                const canvas = Canvas.createCanvas(380, 210);
                                const context = canvas.getContext('2d');
        
                                const background = await Canvas.loadImage('./cards/registration_card.png');
        
                                context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
        
                                context.font = '17px Comic Sans MS';
        
                                context.fillStyle = '#ffffff';
        
                                if (player != undefined && player != null && player != "") {
                                    context.fillText(`${player.subname} ${player.name}`, 90, 103.5);
                                }
                                else {
                                    context.fillText(`${interaction.member.displayName}`, 90, 103.5);
                                }
        
                                current_certificat = player.certificats[0];
        
                                context.fillText(`${current_certificat.vehicule_ref}`, 90, 172.5);
        
                                context.fillText(`${current_certificat.plaque}`, 90, 200);
        
                                const buttons = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder({
                                            custom_id: 'previous',
                                            label: 'Page précédente',
                                            style: ButtonStyle.Primary,
                                            emoji: '◀️'
                                        }),
                                        new ButtonBuilder({
                                            custom_id: 'next',
                                            label: 'Page suivante',
                                            style: ButtonStyle.Primary,
                                            emoji: '▶️'
                                        }),
                                        new ButtonBuilder({
                                            custom_id: 'stop',
                                            label: 'Consultation terminée',
                                            style: ButtonStyle.Danger,
                                            emoji: '<:Valid:991360426774384760>'
                                        })
                                    );
        
                                let collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button });
        
                                const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'registration-card.png' });
        
                                let i = 0;
                                let lastAttachment = attachment;
        
                                collector.on('collect', async interaction => {
                                    let customID = interaction.customId;
        
                                    if (customID === 'previous') {
                                        i -= 1;
                                        if (i < 0) {
                                            i = 1;
                                        }
        
                                        const canvas = Canvas.createCanvas(380, 210);
                                        const context = canvas.getContext('2d');
        
                                        const background = await Canvas.loadImage('./cards/registration_card.png');
        
                                        context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
        
                                        context.font = '17px Comic Sans MS';
        
                                        context.fillStyle = '#ffffff';
        
                                        if (player != undefined && player != null && player != "") {
                                            context.fillText(`${player.subname} ${player.name}`, 90, 103.5);
                                        }
                                        else {
                                            context.fillText(`${interaction.member.displayName}`, 90, 103.5);
                                        }
        
                                        current_certificat = player.certificats[i];
        
                                        context.fillText(`${current_certificat.vehicule_ref}`, 90, 172.5);
        
                                        context.fillText(`${current_certificat.plaque}`, 90, 200);
        
                                        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'registration-card.png' });
        
                                        lastAttachment = attachment;
        
                                        await interaction.update({ files: [attachment] });
                                    }
                                    else if (customID === 'next') {
                                        i += 1;
                                        if (i > 1) {
                                            i = 0;
                                        }
        
                                        const canvas = Canvas.createCanvas(380, 210);
                                        const context = canvas.getContext('2d');
        
                                        const background = await Canvas.loadImage('./cards/registration_card.png');
        
                                        context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
        
                                        context.font = '17px Comic Sans MS';
        
                                        context.fillStyle = '#ffffff';
        
                                        if (player != undefined && player != null && player != "") {
                                            context.fillText(`${player.subname} ${player.name}`, 90, 103.5);
                                        }
                                        else {
                                            context.fillText(`${interaction.member.displayName}`, 90, 103.5);
                                        }
        
                                        current_certificat = player.certificats[i];
        
                                        context.fillText(`${current_certificat.vehicule_ref}`, 90, 172.5);
        
                                        context.fillText(`${current_certificat.plaque}`, 90, 200);
        
                                        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'registration-card.png' });
        
                                        lastAttachment = attachment;
        
                                        await interaction.update({ files: [attachment] });
                                    }
                                    else if (customID === 'stop') {
                                        const updatedButtons = new ActionRowBuilder()
                                            .addComponents(
                                                new ButtonBuilder({
                                                    custom_id: 'previous',
                                                    label: 'Page précédente',
                                                    style: ButtonStyle.Primary,
                                                    emoji: '◀️',
                                                    disabled: true
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'next',
                                                    label: 'Page suivante',
                                                    style: ButtonStyle.Primary,
                                                    emoji: '▶️',
                                                    disabled: true
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'stop',
                                                    label: 'Consultation terminée',
                                                    style: ButtonStyle.Danger,
                                                    emoji: '<:Unvalid:991360425281204265>',
                                                    disabled: true
                                                })
                                            );
                                        
                                        collector.stop("Fin d'interaction");
        
                                        await interaction.update({ files: [lastAttachment], components: [updatedButtons] });
                                    }
                                });
        
                                await interaction.reply({ embeds:[unfoundVehiculeEmbed], files: [attachment], components: [buttons] });
                            }
                            else {
                                await interaction.reply("Cette personne n'a aucuns certificats d'immatriculation");
                            }
                        }
                        else {
                            let immatPos = player.certificats.indexOf(vehicule);

                            let currentCertificat = player.certificats[immatPos];

                            let certificat = {
                                'vehicule_ref': currentCertificat.vehicule_ref,
                                'plaque': currentCertificat.plaque
                            };

                            player.certificats.splice(immatPos, 1);

                            writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                            let certificatDeletedEmbed = {
                                title: "Immatriculation supprimée",
                                description: `La certification d'immatriculation de <@${player.userID}> pour le véhicule \`${certificat.vehicule_ref}\` a bien été supprimée. \nPlaque : \`${certificat.plaque}\``,
                                color: 0x69ED67
                            };

                            await interaction.reply({ embeds: [certificatDeletedEmbed] });
                        }
                    }
                    else {
                        await interaction.reply("Cette personne n'a aucuns certificats d'immatriculation");
                    }
                }
                else {
                    await interaction.reply("Cette personne n'a pas créer votre personnage RP, elle n'a donc aucunes certifications d'immatriculation");
                }
            }
            else {
                if (player != undefined) {
                    if (player.certificats != undefined) {
                        let vehicule = player.certificats.filter(c => c.vehicule_ref === vehicule_ref && c.plaque === plaque)[0];
                        vehicule = handleUndefined(vehicule);

                        if (vehicule == undefined) {
                            let unfoundVehiculeEmbed = {
                                title: "Aucuns véhicules trouvés",
                                description: `Il semblerait qu'aucuns véhicules porte ce nom. Voici les certifications d'immatriculation de <@${player.userID}>`,
                                color: 0xEA951A
                            };

                            if (player.certificats.length === 1) {
                                const canvas = Canvas.createCanvas(380, 210);
                                const context = canvas.getContext('2d');
        
                                const background = await Canvas.loadImage('./cards/registration_card.png');
        
                                context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
        
                                context.font = '17px Comic Sans MS';
        
                                context.fillStyle = '#ffffff';
        
                                if (player != undefined && player != null && player != "") {
                                    context.fillText(`${player.subname} ${player.name}`, 90, 103.5);
                                }
                                else {
                                    context.fillText(`${interaction.member.displayName}`, 90, 103.5);
                                }
        
                                current_certificat = player.certificats[0];
        
                                context.fillText(`${current_certificat.vehicule_ref}`, 90, 172.5);
        
                                context.fillText(`${current_certificat.plaque}`, 90, 200);
        
                                const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'registration-card.png' });
        
                                await interaction.reply({ embeds: [unfoundVehiculeEmbed], files: [attachment] });
                            }
                            else if (player.certificats.length === 2) {
                                const canvas = Canvas.createCanvas(380, 210);
                                const context = canvas.getContext('2d');
        
                                const background = await Canvas.loadImage('./cards/registration_card.png');
        
                                context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
        
                                context.font = '17px Comic Sans MS';
        
                                context.fillStyle = '#ffffff';
        
                                if (player != undefined && player != null && player != "") {
                                    context.fillText(`${player.subname} ${player.name}`, 90, 103.5);
                                }
                                else {
                                    context.fillText(`${interaction.member.displayName}`, 90, 103.5);
                                }
        
                                current_certificat = player.certificats[0];
        
                                context.fillText(`${current_certificat.vehicule_ref}`, 90, 172.5);
        
                                context.fillText(`${current_certificat.plaque}`, 90, 200);
        
                                const buttons = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder({
                                            custom_id: 'previous',
                                            label: 'Page précédente',
                                            style: ButtonStyle.Primary,
                                            emoji: '◀️'
                                        }),
                                        new ButtonBuilder({
                                            custom_id: 'next',
                                            label: 'Page suivante',
                                            style: ButtonStyle.Primary,
                                            emoji: '▶️'
                                        }),
                                        new ButtonBuilder({
                                            custom_id: 'stop',
                                            label: 'Consultation terminée',
                                            style: ButtonStyle.Danger,
                                            emoji: '<:Valid:991360426774384760>'
                                        })
                                    );
        
                                let collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button });
        
                                const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'registration-card.png' });
        
                                let i = 0;
                                let lastAttachment = attachment;
        
                                collector.on('collect', async interaction => {
                                    let customID = interaction.customId;
        
                                    if (customID === 'previous') {
                                        i -= 1;
                                        if (i < 0) {
                                            i = 1;
                                        }
        
                                        const canvas = Canvas.createCanvas(380, 210);
                                        const context = canvas.getContext('2d');
        
                                        const background = await Canvas.loadImage('./cards/registration_card.png');
        
                                        context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
        
                                        context.font = '17px Comic Sans MS';
        
                                        context.fillStyle = '#ffffff';
        
                                        if (player != undefined && player != null && player != "") {
                                            context.fillText(`${player.subname} ${player.name}`, 90, 103.5);
                                        }
                                        else {
                                            context.fillText(`${interaction.member.displayName}`, 90, 103.5);
                                        }
        
                                        current_certificat = player.certificats[i];
        
                                        context.fillText(`${current_certificat.vehicule_ref}`, 90, 172.5);
        
                                        context.fillText(`${current_certificat.plaque}`, 90, 200);
        
                                        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'registration-card.png' });
        
                                        lastAttachment = attachment;
        
                                        await interaction.update({ files: [attachment] });
                                    }
                                    else if (customID === 'next') {
                                        i += 1;
                                        if (i > 1) {
                                            i = 0;
                                        }
        
                                        const canvas = Canvas.createCanvas(380, 210);
                                        const context = canvas.getContext('2d');
        
                                        const background = await Canvas.loadImage('./cards/registration_card.png');
        
                                        context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
        
                                        context.font = '17px Comic Sans MS';
        
                                        context.fillStyle = '#ffffff';
        
                                        if (player != undefined && player != null && player != "") {
                                            context.fillText(`${player.subname} ${player.name}`, 90, 103.5);
                                        }
                                        else {
                                            context.fillText(`${interaction.member.displayName}`, 90, 103.5);
                                        }
        
                                        current_certificat = player.certificats[i];
        
                                        context.fillText(`${current_certificat.vehicule_ref}`, 90, 172.5);
        
                                        context.fillText(`${current_certificat.plaque}`, 90, 200);
        
                                        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'registration-card.png' });
        
                                        lastAttachment = attachment;
        
                                        await interaction.update({ files: [attachment] });
                                    }
                                    else if (customID === 'stop') {
                                        const updatedButtons = new ActionRowBuilder()
                                            .addComponents(
                                                new ButtonBuilder({
                                                    custom_id: 'previous',
                                                    label: 'Page précédente',
                                                    style: ButtonStyle.Primary,
                                                    emoji: '◀️',
                                                    disabled: true
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'next',
                                                    label: 'Page suivante',
                                                    style: ButtonStyle.Primary,
                                                    emoji: '▶️',
                                                    disabled: true
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'stop',
                                                    label: 'Consultation terminée',
                                                    style: ButtonStyle.Danger,
                                                    emoji: '<:Unvalid:991360425281204265>',
                                                    disabled: true
                                                })
                                            );
                                        
                                        collector.stop("Fin d'interaction");
        
                                        await interaction.update({ files: [lastAttachment], components: [updatedButtons] });
                                    }
                                });
        
                                await interaction.reply({ embeds:[unfoundVehiculeEmbed], files: [attachment], components: [buttons] });
                            }
                            else {
                                await interaction.reply("Cette personne n'a aucuns certificats d'immatriculation");
                            }
                        }
                        else {
                            let immatPos = player.certificats.indexOf(vehicule);

                            let currentCertificat = player.certificats[immatPos];

                            let certificat = {
                                'vehicule_ref': currentCertificat.vehicule_ref,
                                'plaque': currentCertificat.plaque
                            };

                            player.certificats.splice(immatPos, 1);

                            writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                            let certificatDeletedEmbed = {
                                title: "Immatriculation supprimée",
                                description: `La certification d'immatriculation de <@${player.userID}> pour le véhicule \`${certificat.vehicule_ref}\` a bien été supprimée. \nPlaque : \`${certificat.plaque}\``,
                                color: 0x69ED67
                            };

                            await interaction.reply({ embeds: [certificatDeletedEmbed] });
                        }
                    }
                    else {
                        await interaction.reply("Cette personne n'a aucuns certificats d'immatriculation");
                    }
                }
                else {
                    await interaction.reply("Cette personne n'a pas créer votre personnage RP, elle n'a donc aucunes certifications d'immatriculation");
                }
            }
        }
    }
}