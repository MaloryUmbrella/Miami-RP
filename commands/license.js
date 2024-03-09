const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { PermissionFlagsBits } = require('discord-api-types/v10');
const { writeFileSync } = require('fs');
const Canvas = require('@napi-rs/canvas');
//file
const fichier = './data.json';
//functions
const { countLicenses, handleUndefined, firstLetterToUpperCase } = require('../functions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('license')
        .setDescription("Commandes pour les permis")
        .addSubcommand(
            subcommand => subcommand
                .setName('create')
                .setDescription("Créer un nouveau permis")
                .addStringOption( option => option.setName('type').setDescription("Type du permis").addChoices({ name: "car", value: "car" }, { name: "truck", value: "truck" }, { name: "helicopter", value: "helicopter" }, { name: "plane", value: "plane" }).setRequired(true))
                .addUserOption( option => option.setName('player').setDescription("Personne à qui est désigné le permis").setRequired(true) )
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('info')
                .setDescription("Afficher vos permis")
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('points-remove')
                .setDescription("Retirer des points à un permis")
                .addIntegerOption( option => option.setName('points').setDescription("Nombre de points à retirer").setRequired(true) )
                .addUserOption( option => option.setName('player').setDescription("Personne a qui appartient le permis").setRequired(true) )
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('points-add')
                .setDescription("Ajouter des points à un permis")
                .addIntegerOption( option => option.setName('points').setDescription("Nombre de points à ajouter").setRequired(true) )
                .addUserOption( option => option.setName('player').setDescription("Personne a qui appartient le permis").setRequired(true) )
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('delete')
                .setDescription("Supprimer un permis")
                .addStringOption( option => option.setName('type').setDescription("Type du permis").addChoices({ name: "car", value: "car" }, { name: "truck", value: "truck" }, { name: "helicopter", value: "helicopter" }, { name: "plane", value: "plane" }).setRequired(true) )
                .addUserOption( option => option.setName('player').setDescription("Personne à qui est désigné le permis").setRequired(true) )
        ),
    async execute(interaction, miami_rp, License) {
        let subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'create') {
            if (interaction.memberPermissions.has(PermissionFlagsBits.ViewAuditLog) || interaction.member.roles.cache.some(role => role.id === "1135304827279265884")) {
                let license_type = interaction.options.getString('type');
                let player = interaction.options.getUser('player');

                let RPplayer = miami_rp.players.filter(p => p.userID === player.id)[0];
                let license;

                RPplayer = handleUndefined(RPplayer);

                if (RPplayer != undefined) {
                    let playerLicenseTypes = countLicenses(RPplayer.licenses, license_type);

                    if (!playerLicenseTypes) {
                        if (license_type === "car" || license_type == "truck") {
                            if (license_type === "car") {
                                license_type = "Voiture";
                            }
                            else {
                                license_type = "Camion";
                            }

                            license = new License(license_type, 12);

                            RPplayer.inventory.push({ 
                                "name": "Permis de conduire",
                                "stock": 1,
                                "type": license_type
                            });
                        }
                        else {
                            if (license_type === "helicopter") {
                                license_type = "Hélicoptère";

                                RPplayer.inventory.push({ 
                                    "name": "Permis hélicoptère",
                                    "stock": 1,
                                });
                            }
                            else {
                                license_type = "Avion";

                                RPplayer.inventory.push({ 
                                    "name": "Permis avion",
                                    "stock": 1,
                                });
                            }

                            license = new License(license_type);
                        }
    
                        RPplayer.licenses.push(license);
        
                        writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));
        
                        const canvas = Canvas.createCanvas(380, 210);
                        const context = canvas.getContext('2d');
        
                        const background = await Canvas.loadImage('./cards/license_card.png');
        
                        context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
        
                        context.font = '20px Comic Sans MS';
        
                        context.fillStyle = '#4D85D5';
        
                        context.fillText(`${license.type}`, 250, 72.5);
                        context.fillText(`${license.nb_points} points`, 245, 122.5);
                        context.fillText(`${license.date}`, 237.5, 170);
        
                        const avatar = await Canvas.loadImage(interaction.member.displayAvatarURL());
        
                        context.drawImage(avatar, 25, 80, 80, 70);
        
                        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'license-card.png' });
        
                        await interaction.reply({ files: [attachment] });
                    }
                    else {
                        await interaction.reply("Cette personne possède déjà le type de permis choisis");
                    }
                }
                else {
                    await interaction.reply("Cette personne n'a pas créer de joueur; impossible de lui créer un permis");
                }
            }
            else {
                await interaction.reply("Vous n'avez pas la permission de créer un permis : vous n'avez pas le rôle suffisant pour le faire");
            }
        }
        else if (subcommand === 'info') {
            let player = miami_rp.players.filter(p => p.userID === interaction.member.id)[0];

            player = handleUndefined(player);

            if (player != undefined) {
                let licenses = player.licenses;
                let firstLicense = licenses[0];

                if (licenses.length > 1) {
                    const canvas = Canvas.createCanvas(380, 210);
                    const context = canvas.getContext('2d');
        
                    const background = await Canvas.loadImage('./cards/license_card.png');
        
                    context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
        
                    context.font = '20px Comic Sans MS';
        
                    context.fillStyle = '#4D85D5';
        
                    context.fillText(`${firstLicense.type}`, 250, 72.5);

                    if (firstLicense.nb_points != -1) {
                        context.fillText(`${firstLicense.nb_points} points`, 245, 122.5);
                    }

                    context.fillText(`${firstLicense.date}`, 237.5, 170);
        
                    const avatar = await Canvas.loadImage(interaction.member.displayAvatarURL());
        
                    context.drawImage(avatar, 25, 80, 80, 70);
        
                    const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'license-card.png' });

                    const buttons = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder({
                                custom_id: 'previous',
                                label: 'Permis précédent',
                                style: ButtonStyle.Primary,
                                emoji: '◀️'
                            }),
                            new ButtonBuilder({
                                custom_id: 'next',
                                label: 'Permis suivant',
                                style: ButtonStyle.Primary,
                                emoji: '▶️'
                            }),
                            new ButtonBuilder({
                                custom_id: 'stop',
                                label: 'Consultation terminée',
                                style: ButtonStyle.Danger,
                                emoji: '<:Unvalid:991360425281204265>'
                            })
                        );

                    const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button });

                    let author = interaction.member.id;
                    let i = 0;
                    let max = licenses.length - 1;

                    let lastAttachment = attachment;

                    collector.on('collect', async interaction => {
                        if (author.id != interaction.member.id) {
                            await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                        }
                        else {
                            let customID = interaction.customId;

                            if (customID === 'previous') {
                                i -= 1;
                                if (i < 0) {
                                    i = max;
                                }

                                let current_license = licenses[i];

                                const canvas = Canvas.createCanvas(380, 210);
                                const context = canvas.getContext('2d');
                    
                                const background = await Canvas.loadImage('./cards/license_card.png');
                    
                                context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
                    
                                context.font = '20px Comic Sans MS';
                    
                                context.fillStyle = '#4D85D5';
                    
                                context.fillText(`${current_license.type}`, 270, 72.5);

                                if (current_license.nb_points != -1) {
                                    context.fillText(`${current_license.nb_points} points`, 245, 122.5);
                                }

                                context.fillText(`${current_license.date}`, 237.5, 170);
                    
                                const avatar = await Canvas.loadImage(interaction.member.displayAvatarURL());
                    
                                context.drawImage(avatar, 25, 80, 80, 70);
                    
                                const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'license-card.png' });

                                lastAttachment = attachment;

                                await interaction.update({ files: [attachment] });
                            }
                            else if (customID === 'next') {
                                i += 1;
                                if (i > max) {
                                    i = 0;
                                }

                                let current_license = licenses[i];

                                const canvas = Canvas.createCanvas(380, 210);
                                const context = canvas.getContext('2d');
                    
                                const background = await Canvas.loadImage('./cards/license_card.png');
                    
                                context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
                    
                                context.font = '20px Comic Sans MS';
                    
                                context.fillStyle = '#4D85D5';
                    
                                context.fillText(`${current_license.type}`, 270, 72.5);

                                if (current_license.nb_points != -1) {
                                    context.fillText(`${current_license.nb_points} points`, 245, 122.5);
                                }

                                context.fillText(`${current_license.date}`, 237.5, 170);
                    
                                const avatar = await Canvas.loadImage(interaction.member.displayAvatarURL());
                    
                                context.drawImage(avatar, 25, 80, 80, 70);
                    
                                const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'license-card.png' });

                                lastAttachment = attachment;

                                await interaction.update({ files: [attachment] });
                            }
                            else if (customID === 'stop') {
                                const updatedButtons = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder({
                                            custom_id: 'previous',
                                            label: 'Permis précédent',
                                            style: ButtonStyle.Primary,
                                            emoji: '◀️',
                                            disabled: true
                                        }),
                                        new ButtonBuilder({
                                            custom_id: 'next',
                                            label: 'Permis suivant',
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
                        }
                    });

                    await interaction.reply({ files: [attachment], components: [buttons] });
                }
                else {
                    const canvas = Canvas.createCanvas(380, 210);
                    const context = canvas.getContext('2d');
        
                    const background = await Canvas.loadImage('./cards/license_card.png');
        
                    context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
        
                    context.font = '20px Comic Sans MS';
        
                    context.fillStyle = '#4D85D5';
        
                    context.fillText(`${firstLicense.type}`, 270, 72.5);

                    if (firstLicense.nb_points != -1) {
                        context.fillText(`${firstLicense.nb_points} points`, 245, 122.5);
                    }

                    context.fillText(`${firstLicense.date}`, 237.5, 170);
        
                    const avatar = await Canvas.loadImage(interaction.member.displayAvatarURL());
        
                    context.drawImage(avatar, 25, 80, 80, 70);
        
                    const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'license-card.png' });

                    await interaction.reply({ files: [attachment] });
                }
            }
            else {
                await interaction.reply("Vous n'avez pas créer de joueur; impossible de consulter vos permis");
            }
        }
        else if (subcommand === 'points-remove') {
            let points = interaction.options.getInteger('points');
            let player = interaction.options.getUser('player');

            player = miami_rp.players.filter(p => p.userID === player.id)[0];

            player = handleUndefined(player);

            let hasPermissions = interaction.memberPermissions.has(PermissionFlagsBits.ViewAuditLog) || interaction.member.roles.cache.some(r => r.id === '1134972347472949259' || r.id === '1135141902581243944' || r.id === '1135141478432260117' || r.id === '1135141375998955560' || r.id === '1135141011501350933' || r.id === '1135140891045150821' || r.id === '1135140486714245141' || r.id === '1135140215586050118');

            if (hasPermissions) {
                if (player != undefined) {
                    let license_car = player.licenses.filter(l => l.type === "Voiture")[0];
                    let license_truck = player.licenses.filter(l => l.type === "Camion")[0];

                    license_car = handleUndefined(license_car);
                    license_truck = handleUndefined(license_truck);

                    if (license_car != undefined) {
                        if (license_truck != undefined) {
                            const canvas = Canvas.createCanvas(380, 210);
                            const context = canvas.getContext('2d');
                
                            const background = await Canvas.loadImage('./cards/license_card.png');
                
                            context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
                
                            context.font = '20px Comic Sans MS';
                
                            context.fillStyle = '#4D85D5';
                
                            context.fillText(`${license_car.type}`, 250, 72.5);

                            context.fillText(`${license_car.nb_points} points`, 245, 122.5);

                            context.fillText(`${license_car.date}`, 237.5, 170);
                
                            const avatar = await Canvas.loadImage(interaction.member.displayAvatarURL());
                
                            context.drawImage(avatar, 25, 80, 80, 70);
                
                            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'license-card.png' });

                            const buttons = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder({
                                        custom_id: 'previous',
                                        label: 'Permis précédent',
                                        style: ButtonStyle.Primary,
                                        emoji: '◀️'
                                    }),
                                    new ButtonBuilder({
                                        custom_id: 'next',
                                        label: 'Permis suivant',
                                        style: ButtonStyle.Primary,
                                        emoji: '▶️'
                                    }),
                                    new ButtonBuilder({
                                        custom_id: 'remove',
                                        label: 'Retirer les points',
                                        style: ButtonStyle.Success,
                                        emoji: '<:Valid:991360426774384760>'
                                    }),
                                    new ButtonBuilder({
                                        custom_id: 'cancel',
                                        label: 'Annuler',
                                        style: ButtonStyle.Secondary,
                                        emoji: '<:Unvalid:991360425281204265>'
                                    })
                                );

                            const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button });

                            let author = interaction.member;

                            let i = 0;

                            let lastAttachment = attachment;

                            collector.on('collect', async interaction => {
                                if (author.id != interaction.member.id) {
                                    await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                                }
                                else {
                                    let customID = interaction.customId;

                                    if (customID === 'previous') {
                                        i -= 1;
                                        if (i < 0) {
                                            i = 1;
                                        }

                                        if (i === 0) {
                                            const canvas = Canvas.createCanvas(380, 210);
                                            const context = canvas.getContext('2d');
                                
                                            const background = await Canvas.loadImage('./cards/license_card.png');
                                
                                            context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
                                
                                            context.font = '20px Comic Sans MS';
                                
                                            context.fillStyle = '#4D85D5';
                                
                                            context.fillText(`${license_car.type}`, 250, 72.5);

                                            context.fillText(`${license_car.nb_points} points`, 245, 122.5);

                                            context.fillText(`${license_car.date}`, 237.5, 170);
                                
                                            const avatar = await Canvas.loadImage(interaction.member.displayAvatarURL());
                                
                                            context.drawImage(avatar, 25, 80, 80, 70);
                                
                                            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'license-card.png' });

                                            lastAttachment = attachment;

                                            await interaction.update({ files: [attachment] });
                                        }
                                        else {
                                            const canvas = Canvas.createCanvas(380, 210);
                                            const context = canvas.getContext('2d');
                                
                                            const background = await Canvas.loadImage('./cards/license_card.png');
                                
                                            context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
                                
                                            context.font = '20px Comic Sans MS';
                                
                                            context.fillStyle = '#4D85D5';
                                
                                            context.fillText(`${license_truck.type}`, 250, 72.5);

                                            context.fillText(`${license_truck.nb_points} points`, 245, 122.5);

                                            context.fillText(`${license_truck.date}`, 237.5, 170);
                                
                                            const avatar = await Canvas.loadImage(interaction.member.displayAvatarURL());
                                
                                            context.drawImage(avatar, 25, 80, 80, 70);
                                
                                            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'license-card.png' });

                                            lastAttachment = attachment;

                                            await interaction.update({ files: [attachment] });
                                        }
                                    }
                                    else if (customID === 'next') {
                                        i += 1;
                                        if (i > 1) {
                                            i = 0;
                                        }

                                        if (i === 0) {
                                            const canvas = Canvas.createCanvas(380, 210);
                                            const context = canvas.getContext('2d');
                                
                                            const background = await Canvas.loadImage('./cards/license_card.png');
                                
                                            context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
                                
                                            context.font = '20px Comic Sans MS';
                                
                                            context.fillStyle = '#4D85D5';
                                
                                            context.fillText(`${license_car.type}`, 250, 72.5);

                                            context.fillText(`${license_car.nb_points} points`, 245, 122.5);

                                            context.fillText(`${license_car.date}`, 237.5, 170);
                                
                                            const avatar = await Canvas.loadImage(interaction.member.displayAvatarURL());
                                
                                            context.drawImage(avatar, 25, 80, 80, 70);
                                
                                            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'license-card.png' });

                                            lastAttachment = attachment;

                                            await interaction.update({ files: [attachment] });
                                        }
                                        else {
                                            const canvas = Canvas.createCanvas(380, 210);
                                            const context = canvas.getContext('2d');
                                
                                            const background = await Canvas.loadImage('./cards/license_card.png');
                                
                                            context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
                                
                                            context.font = '20px Comic Sans MS';
                                
                                            context.fillStyle = '#4D85D5';
                                
                                            context.fillText(`${license_truck.type}`, 250, 72.5);

                                            context.fillText(`${license_truck.nb_points} points`, 245, 122.5);

                                            context.fillText(`${license_truck.date}`, 237.5, 170);
                                
                                            const avatar = await Canvas.loadImage(interaction.member.displayAvatarURL());
                                
                                            context.drawImage(avatar, 25, 80, 80, 70);
                                
                                            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'license-card.png' });

                                            lastAttachment = attachment;

                                            await interaction.update({ files: [attachment] });
                                        }
                                    }
                                    else if (customID === 'remove') {
                                        const canvas = Canvas.createCanvas(380, 210);
                                        const context = canvas.getContext('2d');
                                
                                        const background = await Canvas.loadImage('./cards/license_card.png');
                                
                                        context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
                                
                                        context.font = '20px Comic Sans MS';
                                
                                        context.fillStyle = '#4D85D5';

                                        if (i === 0) {
                                            if (license_car.nb_points - points < 0) {
                                                license_car.nb_points = 0;
                                            }
                                            else {
                                                license_car.nb_points -= points;
                                            }
                                
                                            context.fillText(`${license_car.type}`, 250, 72.5);

                                            context.fillText(`${license_car.nb_points} points`, 245, 122.5);

                                            context.fillText(`${license_car.date}`, 237.5, 170);
                                        }
                                        else {
                                            if (license_truck.nb_points - points < 0) {
                                                license_truck.nb_points = 0;
                                            }
                                            else {
                                                license_truck.nb_points -= points;
                                            }

                                            context.fillText(`${license_truck.type}`, 250, 72.5);

                                            context.fillText(`${license_truck.nb_points} points`, 245, 122.5);

                                            context.fillText(`${license_truck.date}`, 237.5, 170);
                                        }
                
                                        writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));
                
                                        let pointRemoveEmbed = {
                                            color: 0x30DF88,
                                            description: `✅ Vous avez bien retiré ${points} points sur le permis de conduire de <@${player.userID}> \n**Nouveau capital :** ${license_car.nb_points}/12`
                                        };

                                        const updatedButtons = new ActionRowBuilder()
                                            .addComponents(
                                                new ButtonBuilder({
                                                    custom_id: 'previous',
                                                    label: 'Permis précédent',
                                                    style: ButtonStyle.Primary,
                                                    emoji: '◀️',
                                                    disabled: true
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'next',
                                                    label: 'Permis suivant',
                                                    style: ButtonStyle.Primary,
                                                    emoji: '▶️',
                                                    disabled: true
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'remove',
                                                    label: 'Retirer les points',
                                                    style: ButtonStyle.Success,
                                                    emoji: '<:Valid:991360426774384760>',
                                                    disabled: true
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'cancel',
                                                    label: 'Annuler',
                                                    style: ButtonStyle.Secondary,
                                                    emoji: '<:Unvalid:991360425281204265>',
                                                    disabled: true
                                                })
                                            );

                                        const avatar = await Canvas.loadImage(interaction.member.displayAvatarURL());
                                
                                        context.drawImage(avatar, 25, 80, 80, 70);
                                
                                        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'license-card.png' });

                                        collector.stop("Fin d'interaction");

                                        await interaction.update({ files: [attachment], components: [updatedButtons] });
                                        await interaction.followUp({ embeds: [pointRemoveEmbed] });
                                    }
                                    else if (customID === 'cancel') {
                                        const updatedButtons = new ActionRowBuilder()
                                            .addComponents(
                                                new ButtonBuilder({
                                                    custom_id: 'previous',
                                                    label: 'Permis précédent',
                                                    style: ButtonStyle.Primary,
                                                    emoji: '◀️',
                                                    disabled: true
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'next',
                                                    label: 'Permis suivant',
                                                    style: ButtonStyle.Primary,
                                                    emoji: '▶️',
                                                    disabled: true
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'remove',
                                                    label: 'Retirer les points',
                                                    style: ButtonStyle.Success,
                                                    emoji: '<:Valid:991360426774384760>',
                                                    disabled: true
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'cancel',
                                                    label: 'Annuler',
                                                    style: ButtonStyle.Secondary,
                                                    emoji: '<:Unvalid:991360425281204265>',
                                                    disabled: true
                                                })
                                            );

                                        collector.stop("Fin d'interaction");

                                        await interaction.update({ files: [lastAttachment], components: [updatedButtons] });
                                    }
                                }
                            });

                            await interaction.reply({ files: [attachment], components: [buttons] });
                        }
                        else {
                            if (license_car.nb_points - points < 0) {
                                license_car.nb_points = 0;
                            }
                            else {
                                license_car.nb_points -= points;
                            }
    
                            writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));
    
                            let pointRemoveEmbed = {
                                color: 0x30DF88,
                                description: `✅ Vous avez bien retiré ${points} points sur le permis de conduire de <@${player.userID}> \n**Nouveau capital :** ${license_car.nb_points}/12`
                            };
    
                            await interaction.reply({ embeds: [pointRemoveEmbed] });
                        }
                    }
                    else {
                        if (license_truck != undefined) {

                        }
                        else {
                            await interaction.reply("Il semblerait qu'aucunes des licences de cette personne ne possèdent un système de points ou alors ne possède aucuns permis");
                        }
                    }
                }
                else {
                    await interaction.reply("Cette personne n'a pas créée de personnage RP");
                }
            }
            else {
                await interaction.reply("Vous n'avez pas la permission de retirer des points sur un permis");
            }
        }
        else if (subcommand === 'points-add') {
            let points = interaction.options.getInteger('points');
            let player = interaction.options.getUser('player');

            player = miami_rp.players.filter(p => p.userID === player.id)[0];

            player = handleUndefined(player);

            let hasPermissions = interaction.memberPermissions.has(PermissionFlagsBits.ViewAuditLog) || interaction.member.roles.cache.some(r => r.id === '1134972347472949259' || r.id === '1135141902581243944' || r.id === '1135141478432260117' || r.id === '1135141375998955560' || r.id === '1135141011501350933' || r.id === '1135140891045150821' || r.id === '1135140486714245141' || r.id === '1135140215586050118');

            if (hasPermissions) {
                if (player != undefined) {
                    let license_car = player.licenses.filter(l => l.type === "Voiture")[0];
                    let license_truck = player.licenses.filter(l => l.type === "Camion")[0];

                    license_car = handleUndefined(license_car);
                    license_truck = handleUndefined(license_truck);

                    if (license_car != undefined) {
                        if (license_truck != undefined) {
                            const canvas = Canvas.createCanvas(380, 210);
                            const context = canvas.getContext('2d');
                
                            const background = await Canvas.loadImage('./cards/license_card.png');
                
                            context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
                
                            context.font = '20px Comic Sans MS';
                
                            context.fillStyle = '#4D85D5';
                
                            context.fillText(`${license_car.type}`, 250, 72.5);

                            context.fillText(`${license_car.nb_points} points`, 245, 122.5);

                            context.fillText(`${license_car.date}`, 237.5, 170);
                
                            const avatar = await Canvas.loadImage(interaction.member.displayAvatarURL());
                
                            context.drawImage(avatar, 25, 80, 80, 70);
                
                            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'license-card.png' });

                            const buttons = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder({
                                        custom_id: 'previous',
                                        label: 'Permis précédent',
                                        style: ButtonStyle.Primary,
                                        emoji: '◀️'
                                    }),
                                    new ButtonBuilder({
                                        custom_id: 'next',
                                        label: 'Permis suivant',
                                        style: ButtonStyle.Primary,
                                        emoji: '▶️'
                                    }),
                                    new ButtonBuilder({
                                        custom_id: 'add',
                                        label: 'Ajouter les points',
                                        style: ButtonStyle.Success,
                                        emoji: '<:Valid:991360426774384760>'
                                    }),
                                    new ButtonBuilder({
                                        custom_id: 'cancel',
                                        label: 'Annuler',
                                        style: ButtonStyle.Secondary,
                                        emoji: '<:Unvalid:991360425281204265>'
                                    })
                                );

                            const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button });

                            let author = interaction.member;

                            let i = 0;

                            let lastAttachment = attachment;

                            collector.on('collect', async interaction => {
                                if (author.id != interaction.member.id) {
                                    await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                                }
                                else {
                                    let customID = interaction.customId;

                                    if (customID === 'previous') {
                                        i -= 1;
                                        if (i < 0) {
                                            i = 1;
                                        }

                                        if (i === 0) {
                                            const canvas = Canvas.createCanvas(380, 210);
                                            const context = canvas.getContext('2d');
                                
                                            const background = await Canvas.loadImage('./cards/license_card.png');
                                
                                            context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
                                
                                            context.font = '20px Comic Sans MS';
                                
                                            context.fillStyle = '#4D85D5';
                                
                                            context.fillText(`${license_car.type}`, 250, 72.5);

                                            context.fillText(`${license_car.nb_points} points`, 245, 122.5);

                                            context.fillText(`${license_car.date}`, 237.5, 170);
                                
                                            const avatar = await Canvas.loadImage(interaction.member.displayAvatarURL());
                                
                                            context.drawImage(avatar, 25, 80, 80, 70);
                                
                                            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'license-card.png' });

                                            lastAttachment = attachment;

                                            await interaction.update({ files: [attachment] });
                                        }
                                        else {
                                            const canvas = Canvas.createCanvas(380, 210);
                                            const context = canvas.getContext('2d');
                                
                                            const background = await Canvas.loadImage('./cards/license_card.png');
                                
                                            context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
                                
                                            context.font = '20px Comic Sans MS';
                                
                                            context.fillStyle = '#4D85D5';
                                
                                            context.fillText(`${license_truck.type}`, 250, 72.5);

                                            context.fillText(`${license_truck.nb_points} points`, 245, 122.5);

                                            context.fillText(`${license_truck.date}`, 237.5, 170);
                                
                                            const avatar = await Canvas.loadImage(interaction.member.displayAvatarURL());
                                
                                            context.drawImage(avatar, 25, 80, 80, 70);
                                
                                            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'license-card.png' });

                                            lastAttachment = attachment;

                                            await interaction.update({ files: [attachment] });
                                        }
                                    }
                                    else if (customID === 'next') {
                                        i += 1;
                                        if (i > 1) {
                                            i = 0;
                                        }

                                        if (i === 0) {
                                            const canvas = Canvas.createCanvas(380, 210);
                                            const context = canvas.getContext('2d');
                                
                                            const background = await Canvas.loadImage('./cards/license_card.png');
                                
                                            context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
                                
                                            context.font = '20px Comic Sans MS';
                                
                                            context.fillStyle = '#4D85D5';
                                
                                            context.fillText(`${license_car.type}`, 250, 72.5);

                                            context.fillText(`${license_car.nb_points} points`, 245, 122.5);

                                            context.fillText(`${license_car.date}`, 237.5, 170);
                                
                                            const avatar = await Canvas.loadImage(interaction.member.displayAvatarURL());
                                
                                            context.drawImage(avatar, 25, 80, 80, 70);
                                
                                            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'license-card.png' });

                                            lastAttachment = attachment;

                                            await interaction.update({ files: [attachment] });
                                        }
                                        else {
                                            const canvas = Canvas.createCanvas(380, 210);
                                            const context = canvas.getContext('2d');
                                
                                            const background = await Canvas.loadImage('./cards/license_card.png');
                                
                                            context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
                                
                                            context.font = '20px Comic Sans MS';
                                
                                            context.fillStyle = '#4D85D5';
                                
                                            context.fillText(`${license_truck.type}`, 250, 72.5);

                                            context.fillText(`${license_truck.nb_points} points`, 245, 122.5);

                                            context.fillText(`${license_truck.date}`, 237.5, 170);
                                
                                            const avatar = await Canvas.loadImage(interaction.member.displayAvatarURL());
                                
                                            context.drawImage(avatar, 25, 80, 80, 70);
                                
                                            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'license-card.png' });

                                            lastAttachment = attachment;

                                            await interaction.update({ files: [attachment] });
                                        }
                                    }
                                    else if (customID === 'add') {
                                        const canvas = Canvas.createCanvas(380, 210);
                                        const context = canvas.getContext('2d');
                                
                                        const background = await Canvas.loadImage('./cards/license_card.png');
                                
                                        context.drawImage(background, 0, 0, canvas.width + 20, canvas.height + 20);
                                
                                        context.font = '20px Comic Sans MS';
                                
                                        context.fillStyle = '#4D85D5';

                                        if (i === 0) {
                                            if (license_car.nb_points + points > 12) {
                                                license_car.nb_points = 12;
                                            }
                                            else {
                                                license_car.nb_points += points;
                                            }
                                
                                            context.fillText(`${license_car.type}`, 250, 72.5);

                                            context.fillText(`${license_car.nb_points} points`, 245, 122.5);

                                            context.fillText(`${license_car.date}`, 237.5, 170);
                                        }
                                        else {
                                            if (license_truck.nb_points + points > 12) {
                                                license_truck.nb_points = 12;
                                            }
                                            else {
                                                license_truck.nb_points += points;
                                            }

                                            context.fillText(`${license_truck.type}`, 250, 72.5);

                                            context.fillText(`${license_truck.nb_points} points`, 245, 122.5);

                                            context.fillText(`${license_truck.date}`, 237.5, 170);
                                        }
                
                                        writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));
                
                                        let pointRemoveEmbed = {
                                            color: 0x30DF88,
                                            description: `✅ Vous avez bien ajouté ${points} points sur le permis de conduire de <@${player.userID}> \n**Nouveau capital :** ${license_car.nb_points}/12`
                                        };

                                        const updatedButtons = new ActionRowBuilder()
                                            .addComponents(
                                                new ButtonBuilder({
                                                    custom_id: 'previous',
                                                    label: 'Permis précédent',
                                                    style: ButtonStyle.Primary,
                                                    emoji: '◀️',
                                                    disabled: true
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'next',
                                                    label: 'Permis suivant',
                                                    style: ButtonStyle.Primary,
                                                    emoji: '▶️',
                                                    disabled: true
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'add',
                                                    label: 'Ajouter les points',
                                                    style: ButtonStyle.Success,
                                                    emoji: '<:Valid:991360426774384760>',
                                                    disabled: true
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'cancel',
                                                    label: 'Annuler',
                                                    style: ButtonStyle.Secondary,
                                                    emoji: '<:Unvalid:991360425281204265>',
                                                    disabled: true
                                                })
                                            );

                                        const avatar = await Canvas.loadImage(interaction.member.displayAvatarURL());
                                
                                        context.drawImage(avatar, 25, 80, 80, 70);
                                
                                        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'license-card.png' });

                                        collector.stop("Fin d'interaction");

                                        await interaction.update({ files: [attachment], components: [updatedButtons] });
                                        await interaction.followUp({ embeds: [pointRemoveEmbed] });
                                    }
                                    else if (customID === 'cancel') {
                                        const updatedButtons = new ActionRowBuilder()
                                            .addComponents(
                                                new ButtonBuilder({
                                                    custom_id: 'previous',
                                                    label: 'Permis précédent',
                                                    style: ButtonStyle.Primary,
                                                    emoji: '◀️',
                                                    disabled: true
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'next',
                                                    label: 'Permis suivant',
                                                    style: ButtonStyle.Primary,
                                                    emoji: '▶️',
                                                    disabled: true
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'remove',
                                                    label: 'Retirer les points',
                                                    style: ButtonStyle.Success,
                                                    emoji: '<:Valid:991360426774384760>',
                                                    disabled: true
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'cancel',
                                                    label: 'Annuler',
                                                    style: ButtonStyle.Secondary,
                                                    emoji: '<:Unvalid:991360425281204265>',
                                                    disabled: true
                                                })
                                            );

                                        collector.stop("Fin d'interaction");

                                        await interaction.update({ files: [lastAttachment], components: [updatedButtons] });
                                    }
                                }
                            });

                            await interaction.reply({ files: [attachment], components: [buttons] });
                        }
                        else {
                            if (license_car.nb_points + points > 12) {
                                license_car.nb_points = 12;
                            }
                            else {
                                license_car.nb_points += points;
                            }
    
                            writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));
    
                            let pointRemoveEmbed = {
                                color: 0x30DF88,
                                description: `✅ Vous avez bien retiré ${points} points sur le permis de conduire de <@${player.userID}> \n**Nouveau capital :** ${license_car.nb_points}/12`
                            };
    
                            await interaction.reply({ embeds: [pointRemoveEmbed] });
                        }
                    }
                    else {
                        if (license_truck != undefined) {

                        }
                        else {
                            await interaction.reply("Il semblerait qu'aucunes des licences de cette personne ne possèdent un système de points ou alors ne possède aucuns permis");
                        }
                    }
                }
                else {
                    await interaction.reply("Cette personne n'a pas créée de personnage RP");
                }
            }
            else {
                await interaction.reply("Vous n'avez pas la permission de retirer des points sur un permis");
            }
        }
        else if (subcommand === "delete") {
            if (interaction.memberPermissions.has(PermissionFlagsBits.ViewAuditLog) || interaction.member.roles.cache.some(role => role.id === "1135304827279265884")) {
                let license_type = interaction.options.getString('type');
                let player = interaction.options.getUser('player');

                let RPplayer = miami_rp.players.filter(p => p.userID === player.id)[0];

                RPplayer = handleUndefined(RPplayer);

                if (RPplayer != undefined) {
                    if (license_type === "car") {
                        license_type = "Voiture";
                    }
                    else if (license_type === "truck") {
                        license_type = "Camion";
                    }
                    else if (license_type === "helicopter") {
                        license_type = "Hélicoptère";
                    }
                    else {
                        //license_type === "Plane"
                        license_type = "Avion";
                    }

                    let licence = RPplayer.licenses.filter(l => l.type === license_type)[0];

                    licence = handleUndefined(licence);

                    if (licence != undefined) {
                        let current_license = licence;

                        let licensePos = RPplayer.licenses.indexOf(current_license);

                        let item = RPplayer.inventory.filter(item => item.name === "Permis de conduire" && item.type === license_type)[0];

                        let licenseItemPos = RPplayer.licenses.indexOf(item);

                        RPplayer.licenses.splice(licensePos, 1);

                        RPplayer.inventory.splice(licenseItemPos, 1);

                        writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                        let licenceEmbed = {
                            title: "Le permis a bien été supprimé",
                            description: `Voici les informations du permis que vous avez supprimé`,
                            fields: [
                                {
                                    'name': `Permis ${current_license.type}`,
                                    'value': `Nb points : \`${current_license.nb_points} points\` \nDate d'obtention : \`${current_license.date}\``
                                }
                            ],
                            color: 0x444AC8
                        }

                        await interaction.reply({ embeds: [licenceEmbed] });
                    }
                    else {
                        let nbLicences = RPplayer.licenses.length;
                        let licences = RPplayer.licenses;

                        if (nbLicences == 1) {
                            let current_license = licences[0];

                            let licenceEmbed = {
                                title: "Le permis n'a pas été trouvé",
                                description: `${player.globalName} ne possède pas de permis pour ${license_type} \nVoici le permis que possède cette personne`,
                                fields: [
                                    {
                                        name: `Permis ${current_license.type}`,
                                        value: `Nb points : \`${current_license.nb_points} points\` \nDate d'obtention : \`${current_license.date}\``
                                    }
                                ],
                                color: 0x444AC8
                            }

                            await interaction.reply({ embeds: [licenceEmbed] });
                        }
                        else if (nbLicences >= 2) {
                            let licencesFields = [];

                            for (let i = 0; i < nbLicences; i ++) {
                                let currentLicence = licences[i];

                                licencesFields.push({ name: `Permis ${currentLicence.type}`, value: `Nb points : \`${currentLicence.nb_points} points\` \nDate d'obtention : \`${currentLicence.date}\`` });
                            }

                            let licenceEmbed = {
                                title: "Le permis n'a pas été trouvé",
                                description: `${player.globalName} ne possède pas de permis pour ${license_type} \nVoici le permis que possède cette personne`,
                                fields: licencesFields,
                                color: 0x444AC8
                            }

                            await interaction.reply({ embeds: [licenceEmbed] });
                        }
                        else {
                            await interaction.reply("Cette personne n'a aucuns permis");
                        }
                    }
                }
                else {
                    await interaction.reply("Cette personne n'a pas créée de personnage RP");
                }
            }
            else {
                await interaction.reply("Vous n'avez pas la permission de supprimer un permis");
            }
        }
    }
}