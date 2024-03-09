const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { PermissionFlagsBits } = require('discord-api-types/v10');
const { writeFileSync } = require('fs');
//file
const fichier = './data.json';
//functions
const { handleUndefined } = require('../functions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('robbery')
        .setDescription("Commandes pour les braquages")
        .addSubcommand(
            subcommand => subcommand
                .setName('create')
                .setDescription("Créer un braquage")
                .addStringOption( option => option.setName('entreprise').setDescription("Nom de l'entreprise/batiment").setRequired(true) )
                .addIntegerOption( option => option.setName('somme').setDescription("Gain lors du braquage").setRequired(true) )
                .addNumberOption( option => option.setName('temps').setDescription("Durée du braquage en minute").setRequired(true) )
                .addIntegerOption( option => option.setName('max_participant').setDescription("Nombre de participant maximum. Par défaut `4`").setRequired(false) )
        ),
    async execute(interaction, miami_rp, Robbery) {
        let subcommand = interaction.options.getSubcommand();

        let modoFilter = interaction.memberPermissions.has(PermissionFlagsBits.ViewAuditLog);

        if (modoFilter) {
            if (subcommand === 'create') {
                let entreprise = interaction.options.getString('entreprise');
                let somme = interaction.options.getInteger('somme');
                let temps = interaction.options.getNumber('temps');
                let max_participant = interaction.options.get('max_participant');
                let robbery_id = "";

                if (max_participant == undefined) {
                    max_participant = 4;
                }
                else {
                    max_participant = max_participant.value;
                }

                let robbery = new Robbery(entreprise, somme, temps, max_participant);

                let handleTemps = `${temps}`;

                let tempsToSecond = 0;

                if (handleTemps.includes('.')) {
                    let indexOfVirgule = handleTemps.indexOf('.');
                    handleTemps = handleTemps.substring(0, indexOfVirgule) + "m";
                    tempsToSecond += parseInt(handleTemps) * 60;
                    let seconds = handleTemps.substring(indexOfVirgule, handleTemps.length) + "s";
                    tempsToSecond += parseInt(seconds);
                    handleTemps += seconds;
                }
                else {
                    tempsToSecond += parseInt(handleTemps) * 60;
                    handleTemps += " m";
                }

                let robberyEmbed = {
                    title: `Braquage`,
                    color: 0x277EE7,
                    description: `Entreprise/commerce : \`${entreprise}\``,
                    fields: [
                        {
                            name: `Participants 0/${max_participant}`,
                            value: 'Aucuns'
                        },
                        {
                            name: 'Somme à emporter',
                            value: `${somme} $`
                        },
                        {
                            name: 'Temps pour le braquage',
                            value: `${handleTemps}`
                        }
                    ]
                }

                const buttons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder({
                            custom_id: 'participate',
                            label: 'Participer',
                            style: ButtonStyle.Success,
                            emoji: '<:Valid:991360426774384760>'
                        }),
                        new ButtonBuilder({
                            custom_id: 'nparticipate',
                            label: 'Ne plus participer',
                            style: ButtonStyle.Primary,
                            emoji: '<:Unvalid:991360425281204265>'
                        }),
                        new ButtonBuilder({
                            custom_id: 'launch',
                            label: 'Démarrer',
                            style: ButtonStyle.Primary,
                            emoji: '▶️'
                        }),
                        new ButtonBuilder({
                            custom_id: 'end',
                            label: 'Mettre fin au braquage',
                            style: ButtonStyle.Secondary,
                            emoji: '🚫'
                        })
                    );

                let isLaunched = false;

                const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button });

                collector.on('collect', async interaction => {
                    let customID = interaction.customId;

                    if (customID === 'participate') {
                        if ((robbery.participants.length + 1) > max_participant) {
                            await interaction.reply({ content: "Vous ne pouvez pas rejoindre un braquage qui n'a plus de places libres", ephemeral: true });
                        }
                        else {
                            let participants = "";

                            robbery.participants.push(interaction.user.id);

                            for (let i = 0; i < robbery.participants.length; i ++) {
                                let current_participant = robbery.participants[i];

                                if (i < robbery.participants.length - 1) {
                                    `<@${current_participant}>`
                                }
                                else {
                                    participants += `<@${current_participant}>, `
                                }
                            }

                            robberyEmbed = {
                                title: `Braquage`,
                                color: 0x277EE7,
                                description: `Entreprise/commerce : \`${entreprise}\``,
                                fields: [
                                    {
                                        name: `Participants ${robbery.participants.length}/${max_participant}`,
                                        value: participants
                                    },
                                    {
                                        name: 'Somme à emporter',
                                        value: `${somme} $`
                                    },
                                    {
                                        name: 'Temps pour le braquage',
                                        value: `${handleTemps}`
                                    }
                                ]
                            }

                            writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                            await interaction.update({ embeds: [robberyEmbed] });

                            await interaction.followUp({ content: "Vous participez maintenant à ce braquage", ephemeral: true });
                        }
                    }
                    else if (customID === 'nparticipate') {
                        let participants = "Aucuns";

                        let indexOfPlayer = robbery.participants.indexOf(interaction.user.id);

                        robbery.participants.splice(indexOfPlayer, 1);

                        if (robbery.participants > 0) {
                            participants = "";

                            for (let i = 0; i < robbery.participants.length; i ++) {
                                let current_participant = robbery.participants[i];

                                if (i < robbery.participants - 1) {
                                    participants += `<@${current_participant}>`
                                }
                                else {
                                    participants += `<@${current_participant}>, `
                                }
                            }
                        }

                        robberyEmbed = {
                            title: `Braquage`,
                            color: 0x277EE7,
                            description: `Entreprise/commerce : \`${entreprise}\``,
                            fields: [
                                {
                                    name: `Participants ${robbery.participants.length}/${max_participant}`,
                                    value: participants
                                },
                                {
                                    name: 'Somme à emporter',
                                    value: `${somme} $`
                                },
                                {
                                    name: 'Temps pour le braquage',
                                    value: `${handleTemps}`
                                }
                            ]
                        }

                        writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                        await interaction.update({ embeds: [robberyEmbed] });

                        await interaction.followUp({ content: "Vous ne participez plus à ce braquage", ephemeral: true });
                    }
                    else if (customID === 'launch') {
                        let modoFilter = interaction.memberPermissions.has(PermissionFlagsBits.ViewAuditLog);
                        let participantsObj = [];

                        for (let i = 0; i < robbery.participants.length; i ++) {
                            let current_participant = robbery.participants[i];

                            participantsObj.push({ "participant": current_participant, collected: false });
                        }
                        
                        if (modoFilter) {
                            if (!isLaunched) {
                                let participants = "Aucuns";

                                if (robbery.participants.length > 0) {
                                    participants = "";

                                    for (let i = 0; i < robbery.participants.length; i ++) {
                                        let current_participant = robbery.participants[i];

                                        if (i < robbery.participants - 1) {
                                            participants += `<@${current_participant}>`;
                                        }
                                        else {
                                            participants += `<@${current_participant}>, `;
                                        }
                                    }
                                }

                                let tempsMilliNotTimestamp = (tempsToSecond * 1000);

                                if (participants === "Aucuns") {
                                    await interaction.reply({ content: "Vous ne pouvez pas lancer un braquage sans partcipants", ephemeral: true });
                                }
                                else {
                                    const timeout = async () => {
                                        return new Promise(resolve => {
                                            setTimeout(async () => {
                                                robberyEmbed = {
                                                    title: `Braquage`,
                                                    color: 0xFFFFFF,
                                                    description: `Entreprise/commerce : \`${entreprise}\``,
                                                    fields: [
                                                        {
                                                            name: `Participants ${robbery.participants.length}/${max_participant}`,
                                                            value: participants
                                                        },
                                                        {
                                                            name: 'Somme à emporter',
                                                            value: `${somme} $`
                                                        },
                                                        {
                                                            name: 'Temps pour le braquage',
                                                            value: `${handleTemps}`
                                                        }
                                                    ]
                                                }
            
                                                const successButtons = new ActionRowBuilder()
                                                    .addComponents(
                                                        new ButtonBuilder({
                                                            custom_id: 'success',
                                                            label: "Le braquage à été un succès",
                                                            style: ButtonStyle.Success,
                                                            emoji: '<:Valid:991360426774384760>'
                                                        }),
                                                        new ButtonBuilder({
                                                            custom_id: 'defeat',
                                                            label: "Le braquage à été raté",
                                                            style: ButtonStyle.Danger,
                                                            emoji: '<:Unvalid:991360425281204265>'
                                                        })
                                                    );
            
                                                let newColletor = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button });
            
                                                newColletor.on('collect', async interaction => {
                                                    let customID = interaction.customId;

                                                    const successUpdatedButtons = new ActionRowBuilder()
                                                        .addComponents(
                                                            new ButtonBuilder({
                                                                custom_id: 'success',
                                                                label: "Le braquage à été un succès",
                                                                style: ButtonStyle.Success,
                                                                emoji: '<:Valid:991360426774384760>',
                                                                disabled: true
                                                            }),
                                                            new ButtonBuilder({
                                                                custom_id: 'defeat',
                                                                label: "Le braquage à été raté",
                                                                style: ButtonStyle.Danger,
                                                                emoji: '<:Unvalid:991360425281204265>',
                                                                disabled: true
                                                            })
                                                        );
            
                                                    if (customID === 'success') {
                                                        let adminFilter = interaction.user.id === '1046860341667172512' || interaction.user.id === '626841150749409321';

                                                        if (adminFilter) {
                                                            let robberyEndEmbed = {
                                                                title: `Braquage de ${entreprise} réussis`,
                                                                color: 0x30DF88,
                                                                description: "Cliquez sur le bouton pour récupérer l'argent"
                                                            }
                                            
                                                            const buttons = new ActionRowBuilder()
                                                                .addComponents(
                                                                    new ButtonBuilder({
                                                                        custom_id: 'collect',
                                                                        label: "Prendre l'argent",
                                                                        style: ButtonStyle.Success,
                                                                        emoji: '<:Valid:991360426774384760>'
                                                                    })
                                                                );

                                                            let successCollector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button });

                                                            successCollector.on('collect', async interaction => {
                                                                let customID = interaction.customId;

                                                                console.log(customID);

                                                                if (customID === 'collect') {
                                                                    let user = interaction.user.id;
                                                                    let current_participant = participantsObj.filter(p => p.participant === user)[0];
            
                                                                    current_participant = handleUndefined(current_participant);
                                                                        
                                                                    if (current_participant != undefined) {
                                                                        let participantIsPlayer = miami_rp.players.filter(p => p.userID === user)[0];
            
                                                                        participantIsPlayer = handleUndefined(participantIsPlayer);
            
                                                                        if (participantIsPlayer != undefined) {
                                                                            let somme = robbery.somme;
                                                    
                                                                            participantIsPlayer.argent += somme;
            
                                                                            if (participantsObj.length === 1) {
                                                                                let indexOfRobbery = miami_rp.robberies.indexOf(robbery_id);
                                                    
                                                                                miami_rp.robberies.splice(indexOfRobbery, 1);
            
                                                                                writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));
            
                                                                                collector.stop("Fin d'interaction");
            
                                                                                await interaction.update({ components: [successUpdatedButtons] });
                                                                            }
                                                                            else {
                                                                                writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));
            
                                                                                let indexOfParticipant = participantsObj.indexOf(user);
            
                                                                                participantsObj.splice(indexOfParticipant, 1);
            
                                                                                await interaction.followUp({ content: `Vous avez récuperer \`${somme}\``, ephemeral: true });
                                                                            }
                                                                        }
                                                                        else {
                                                                            await interaction.followUp({ content: "Désolé mais vous n'avez pas de personnage RP pour récupèrer l'argent", ephemeral: true });
                                                                        }
                                                                    }
                                                                    else {
                                                                        await interaction.followUp({ content: "Désolé, vous ne faites pas partis du braquage, vous ne pouvez par récuperer cet argent", ephemeral: true });
                                                                    }
                                                                }
                                                            });
            
                                                            await interaction.update({ components: [successUpdatedButtons] });
                                            
                                                            await interaction.followUp({ embeds: [robberyEndEmbed], components: [buttons] });

                                                            resolve();
                                                        }
                                                        else {
                                                            await interaction.reply({ content: "Vous n'avez pas les droits de faire ça", ephemeral: true });
                                                        }
                                                    }
                                                    else if (customID === 'defeat') {
                                                        let adminFilter = interaction.user.id === '1046860341667172512' || interaction.user.id === '626841150749409321';
                                                            
                                                        if (adminFilter) {
                                                            let robberyEndEmbed = {
                                                                title: `Braquage de ${entreprise} échoué`,
                                                                color: 0x30DF88,
                                                                description: "Désolé, vous avez échoué le braquage donc vous ne gagner pas d'argent"
                                                            }
                                    
                                                            let indexOfRobbery = miami_rp.robberies.indexOf(robbery_id);
                                    
                                                            miami_rp.robberies.splice(indexOfRobbery, 1);
                                    
                                                            writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));
                                    
                                                            collector.stop("Fin d'interaction");
            
                                                            await interaction.update({ components: [successUpdatedButtons] });
                                    
                                                            await interaction.followUp({ embeds: [robberyEndEmbed] });
                                                        }
                                                        else {
                                                            await interaction.followUp({ content: "Vous n'avez pas les droits de faire ça", ephemeral: true });
                                                        }
                                                    }
                                                });
            
                                                await interaction.followUp({ components: [successButtons] });
                                            }, tempsMilliNotTimestamp);
                                        });
                                    };

                                    let peopleToPing = participants;

                                    peopleToPing += "\n \nLe braquage viens de commencer !";

                                    const updatedButtons = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder({
                                                custom_id: 'participate',
                                                label: 'Participer',
                                                style: ButtonStyle.Success,
                                                emoji: '<:Valid:991360426774384760>',
                                                disabled: true
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'nparticipate',
                                                label: 'Ne plus participer',
                                                style: ButtonStyle.Primary,
                                                emoji: '<:Unvalid:991360425281204265>',
                                                disabled: true
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'launch',
                                                label: 'Démarrer',
                                                style: ButtonStyle.Primary,
                                                emoji: '▶️',
                                                disabled: true
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'end',
                                                label: 'Mettre fin au braquage',
                                                style: ButtonStyle.Secondary,
                                                emoji: '🚫',
                                                disabled: true
                                            })
                                        );

                                    await interaction.update({ embeds: [robberyEmbed], components: [updatedButtons] });

                                    await interaction.followUp({ content: peopleToPing });

                                    await timeout();
                                }
                            } 
                            else {
                                await interaction.reply({ content: "Le braquage est déjà lancé", ephemeral: true });
                            }
                        }
                        else {
                            await interaction.reply({ content: "Vous n'avez pas les droits de faire ça", ephemeral: true });
                        }
                    }
                    else if (customID === 'end') {
                        let modoFilter = interaction.memberPermissions.has(PermissionFlagsBits.ViewAuditLog);

                        if (modoFilter) {
                            const updatedButtons = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder({
                                        custom_id: 'participate',
                                        label: 'Participer',
                                        style: ButtonStyle.Success,
                                        emoji: '<:Valid:991360426774384760>',
                                        disabled: true
                                    }),
                                    new ButtonBuilder({
                                        custom_id: 'nparticipate',
                                        label: 'Ne plus participer',
                                        style: ButtonStyle.Primary,
                                        emoji: '<:Unvalid:991360425281204265>',
                                        disabled: true
                                    }),
                                    new ButtonBuilder({
                                        custom_id: 'launch',
                                        label: 'Démarrer',
                                        style: ButtonStyle.Primary,
                                        emoji: '▶️',
                                        disabled: true
                                    }),
                                    new ButtonBuilder({
                                        custom_id: 'end',
                                        label: 'Mettre fin au braquage',
                                        style: ButtonStyle.Secondary,
                                        emoji: '🚫',
                                        disabled: true
                                    })
                                );

                            let indexOfRobbery = miami_rp.robberies.indexOf(robbery_id);

                            miami_rp.robberies.splice(indexOfRobbery, 1);

                            writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                            collector.stop("Fin d'interaction");

                            await interaction.update({ components: [updatedButtons], ephemeral: true });
                        }
                        else {
                            await interaction.reply({ content: "Vous n'avez pas les droits de faire ça", ephemeral: true });
                        }
                    }
                });

                await interaction.reply({ embeds: [robberyEmbed], components: [buttons] });

                robbery_id = interaction.id;

                robbery.setRobberyID(robbery_id);

                miami_rp.robberies.push(robbery);

                writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));
            }
        }
        else {
            await interaction.reply("Désolé, vous n'avez pas les droits pour créer un braquage");
        }
    }
}