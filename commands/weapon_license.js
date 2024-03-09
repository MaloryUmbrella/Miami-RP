const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { PermissionFlagsBits } = require('discord-api-types/v10');
const { writeFileSync } = require('fs');
//file
const fichier = './data.json';
//functions
const { handleUndefined, findElementPos } = require('../functions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weapon-license')
        .setDescription("Commandes pour les permis de port d'armes")
        .addSubcommand(
            subcommand => subcommand
                .setName('create')
                .setDescription("Créer un permis de port d'arme")
                .addStringOption( option => option.setName('type').setDescription("Type de permis de port d'arme").addChoices({ name: 'arme blanche', value: 'ab' }, { name: 'arme légère', value: 'ale' }, { name: 'arme lourde', value: 'alo' }).setRequired(true) )
                .addUserOption( option => option.setName('player').setDescription("Personne a qui est désigné le permis").setRequired(true) )
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('info')
                .setDescription("Récupèrer les informations sur vos permis de port d'arme")
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('delete')
                .setDescription("Supprimer un permis de port d'arme")
                .addStringOption( option => option.setName('type').setDescription("Type de permis de port d'arme").addChoices({ name: 'arme blanche', value: 'ab' }, { name: 'arme légère', value: 'ale' }, { name: 'arme lourde', value: 'alo' }).setRequired(true) )
                .addUserOption( option => option.setName('player').setDescription("Personne a qui est désigné le permis").setRequired(true) )
        ),
    async execute(interaction, miami_rp) {
        let subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            if (interaction.memberPermissions.has(PermissionFlagsBits.ViewAuditLog) || interaction.member.roles.cache.some(role => role.id === "1135139815428456510")) {
                let license_type = interaction.options.getString('type');
                let player = interaction.options.getUser('player');

                let RPplayer = miami_rp.players.filter(p => p.userID === player.id)[0];

                RPplayer = handleUndefined(RPplayer);

                if (RPplayer != undefined) {
                    let licence = RPplayer.inventory.filter(item => item.type === license_type && item.name === "Permis de port d'arme")[0];

                    licence = handleUndefined(licence);

                    if (licence == undefined) {
                        licence = {
                            "name": "Permis de port d'arme",
                            "stock": 1,
                            "type": license_type
                        };

                        RPplayer.inventory.push(licence);

                        writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                        if (license_type === "ab") {
                            license_type = "arme blanche";
                        }
                        else if (license_type === "ale") {
                            license_type = "arme légère";
                        }
                        else {
                            //licence_type === "alo"

                            license_type = "arme lourde";
                        }

                        let licenceEmbed = {
                            title: "Permis créer",
                            description: `Le permis de port d'arme pour ${license_type} a bien été créer`,
                            color: 0x84E8DE
                        }

                        await interaction.reply({ embeds: [licenceEmbed] });
                    }
                    else {
                        if (license_type === "ab") {
                            license_type = "arme blanche";
                        }
                        else if (license_type === "ale") {
                            license_type = "arme légère";
                        }
                        else {
                            //licence_type === "alo"

                            license_type = "arme lourde";
                        }

                        await interaction.reply(`Cette personne possède déjà un permis de port d'arme pour ${license_type}`);
                    }
                }
                else {
                    await interaction.reply("Cette personne n'a pas créer de personnage RP, il est impossible de lui créer un permis de port d'armes");
                }
            }
            else {
                await interaction.reply("Vous n'avez pas la permission de créer un permis de port d'arme");
            }
        }
        else if (subcommand === 'info') {
            let player = miami_rp.players.filter(p => p.userID === interaction.user.id)[0];

            player = handleUndefined(player);

            if (player != undefined) {
                let licences = player.inventory.filter(item => item.name === "Permis de port d'arme");

                if (licences.length === 1) {
                    let current_licence = licences[0];
                    let license_type = current_licence.type;

                    if (license_type === "ab") {
                        license_type = "arme blanche";
                    }
                    else if (license_type === "ale") {
                        license_type = "arme légère";
                    }
                    else {
                        //licence_type === "alo"

                        license_type = "arme lourde";
                    }

                    let licenceEmbed = {
                        title: "Permis de port d'arme",
                        description: `Permis de port d'${license_type}`,
                        color: 0x84E8DE
                    };

                    await interaction.reply({ embeds: [licenceEmbed] });
                }
                else if (licences.length > 1) {
                    let licenceFields = [];

                    for (let i = 0; i < licences.length; i ++) {
                        let current_licence = licences[i];
                        let license_type = current_licence.type;

                        if (license_type === "ab") {
                            license_type = "arme blanche";
                        }
                        else if (license_type === "ale") {
                            license_type = "arme légère";
                        }
                        else {
                            //licence_type === "alo"
    
                            license_type = "arme lourde";
                        }

                        licenceFields.push({ 'name': "Permis de port d'arme", 'value': `${license_type}` });
                    }

                    let licencesEmbed = {
                        title: "Permis de port d'arme",
                        description: "Voici vos permis de port d'armes",
                        color: 0x84E8DE,
                        fields: licenceFields
                    };

                    await interaction.reply({ embeds: [licencesEmbed] });
                }
                else {
                    await interaction.reply("Vous n'avez aucuns permis de port d'armes");
                }
            }
            else {
                await interaction.reply("Vous n'avez pas créer de personnage RP, vous ne pouvez pas faire ça");
            }
        }
        else if (subcommand === 'delete') {
            if (interaction.memberPermissions.has(PermissionFlagsBits.ViewAuditLog) || interaction.member.roles.cache.some(role => role.id === "1135139815428456510")) {
                let license_type = interaction.options.getString('type');
                let player = interaction.options.getUser('player');

                let RPplayer = miami_rp.players.filter(p => p.userID === player.id)[0];

                RPplayer = handleUndefined(RPplayer);

                if (RPplayer != undefined) {
                    let licence = RPplayer.inventory.filter(item => item.name === "Permis de port d'arme" && item.type === license_type)[0];

                    licence = handleUndefined(licence);

                    if (licence != undefined) {
                        let licence_type = licence.type;

                        let licence_pos = findElementPos(RPplayer.inventory, licence);

                        RPplayer.inventory.splice(licence_pos, 1);

                        writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                        if (license_type === "ab") {
                            license_typeP = "arme blanche";
                        }
                        else if (license_type === "ale") {
                            license_type = "arme légère";
                        }
                        else {
                            //licence_type === "alo"
    
                            license_type = "arme lourde";
                        }

                        let deletedLicenceEmbed = {
                            title: "Permis supprimé",
                            description: `Permis de port d'arme pour ${licence_type} a bien été supprimé`,
                            color: 0x84E8DE
                        };

                        await interaction.reply({ embeds: [deletedLicenceEmbed] });
                    }
                    else {
                        let licences = RPplayer.inventory.filter(item => item.name === "Permis de port d'arme");

                        if (licences.length === 1) {
                            let current_licence = licences[0];
                            let license_typeP = current_licence.type;
        
                            if (license_typeP === "ab") {
                                license_typeP = "arme blanche";
                            }
                            else if (license_typeP === "ale") {
                                license_typeP = "arme légère";
                            }
                            else {
                                //licence_type === "alo"
        
                                license_typeP = "arme lourde";
                            }

                            if (license_type === "ab") {
                                license_typeP = "arme blanche";
                            }
                            else if (license_type === "ale") {
                                license_type = "arme légère";
                            }
                            else {
                                //licence_type === "alo"
        
                                license_type = "arme lourde";
                            }
        
                            let licenceEmbed = {
                                title: "Permis de port d'arme",
                                description: `Il semblerait que cette personne ne possède pas de permis de port d'${license_type}. Voici le permi de port d'armes que possède <@${RPplayer.userID}>`,
                                fields: [
                                    {
                                        name: "Permis de port d'arme",
                                        value: `${license_typeP}`
                                    }
                                ],
                                color: 0x84E8DE
                            };
        
                            await interaction.reply({ embeds: [licenceEmbed] });
                        }
                        else if (licences.length > 1) {
                            let licenceFields = [];
        
                            for (let i = 0; i < licences.length; i ++) {
                                let current_licence = licences[i];
                                let license_type = current_licence.type;
        
                                if (license_type === "ab") {
                                    license_type = "arme blanche";
                                }
                                else if (license_type === "ale") {
                                    license_type = "arme légère";
                                }
                                else {
                                    //licence_type === "alo"
            
                                    license_type = "arme lourde";
                                }
        
                                licenceFields.push({ 'name': "Permis de port d'arme", 'value': `${license_type}` });
                            }
        
                            let licencesEmbed = {
                                title: "Permis de port d'arme",
                                description: `Il semblerait que cette personne ne possède pas de permis de port d'${license_type}. Voici les permis de port d'armes que possède <@${RPplayer.userID}>`,
                                color: 0x84E8DE,
                                fields: licenceFields
                            };
        
                            await interaction.reply({ embeds: [licencesEmbed] });
                        }
                        else {
                            await interaction.reply("Cette personne n'a aucuns permis de port d'arme, il est donc impossible de les supprimer");
                        }
                    }
                }
                else {
                    await interaction.reply("Cette personne n'a pas créer de personnage RP, elle n'a donc aucuns permis de port d'armes");
                }
            }
            else {
                await interaction.reply("Vous n'avez pas la permission de supprimer un permis de port d'arme");
            }
        }
    }
}