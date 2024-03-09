const { SlashCommandBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { PermissionFlagsBits } = require('discord-api-types/v10');
const { writeFileSync } = require('fs');
//file
const fichier = './data.json';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('salary')
        .setDescription("Demander un salaire")
        .addIntegerOption( option => option.setName('amount').setDescription("Montant du salaire").setRequired(true) ),
    async execute(interaction, miami_rp) {
        let amount = interaction.options.getInteger('amount');
        let player = miami_rp.players.filter(p => p.userID === interaction.user.id)[0];

        let salaryEmbed = {
            title: "Demande de salaire",
            color: 0x3148D9,
            description: `<@${interaction.user.id}> à demander un salaire de ${amount} $`,
        }

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder({
                    custom_id: 'accept',
                    style: ButtonStyle.Success,
                    label: 'Accepter',
                    emoji: '<:Valid:991360426774384760>',
                }),
                new ButtonBuilder({
                    custom_id: 'deny',
                    style: ButtonStyle.Danger,
                    label: 'Refuser',
                    emoji: '<:Unvalid:991360425281204265>',
                })
            );

        const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button });

        collector.on('collect', async interaction => {
            let customID = interaction.customId;

            if (!interaction.memberPermissions.has(PermissionFlagsBits.ViewAuditLog)) {
                await interaction.reply({ content: "Vous n'avez pas la permission d'accepter cette demande", ephemeral: true });
            }
            else {
                if (customID === 'accept') {
                    const updatedButtons = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder({
                                custom_id: 'accept',
                                style: ButtonStyle.Success,
                                label: 'Accepter',
                                emoji: '<:Valid:991360426774384760>',
                                disabled: true
                            }),
                            new ButtonBuilder({
                                custom_id: 'deny',
                                style: ButtonStyle.Danger,
                                label: 'Refuser',
                                emoji: '<:Unvalid:991360425281204265>',
                                disabled: true
                            })
                        );

                    salaryEmbed = {
                        title: "Demande de salaire",
                        color: 0x62EE86,
                        description: `✅ <@${interaction.user.id}> a obtenu un salaire de ${amount} $`,
                        fields: [
                            {
                                'name': '❓ Qui a accepté ?',
                                'value': `<@${interaction.user.id}>`
                            }
                        ]
                    }

                    player.argent += amount;

                    writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                    collector.stop("Fin d'interaction");

                    await interaction.update({ embeds: [salaryEmbed], components: [updatedButtons] });
                }
                else if (customID === 'deny') {
                    const updatedButtons = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder({
                                custom_id: 'accept',
                                style: ButtonStyle.Success,
                                label: 'Accepter',
                                emoji: '<:Valid:991360426774384760>',
                                disabled: true
                            }),
                            new ButtonBuilder({
                                custom_id: 'deny',
                                style: ButtonStyle.Danger,
                                label: 'Refuser',
                                emoji: '<:Unvalid:991360425281204265>',
                                disabled: true
                            })
                        );

                    collector.stop("Fin d'interaction");

                    salaryEmbed = {
                        title: "Demande de salaire",
                        color: 0xDA4432,
                        description: `<:Unvalid:991360425281204265> La demande de <@${interaction.user.id}> à été refusée`,
                        fields: [
                            {
                                'name': '❓ Qui a refuser ?',
                                'value': `<@${interaction.user.id}>`
                            }
                        ]
                    }

                    await interaction.update({ embeds: [salaryEmbed], components: [updatedButtons] });
                }
            }
        });

        await interaction.reply({ embeds: [salaryEmbed], components: [buttons] });
    }
}