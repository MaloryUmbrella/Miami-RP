const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { PermissionFlagsBits } = require('discord-api-types/v10');
const { writeFileSync } = require('fs');
//file
const fichier = './data.json';

const { handleUndefined } = require('../functions.js');

module.exports= {
    data: new SlashCommandBuilder()
        .setName('bill')
        .setDescription("Créer une facture")
        .addUserOption( option => option.setName('player').setDescription("Personne à qui est désignée la facture").setRequired(true) )
        .addIntegerOption( option => option.setName('amount').setDescription("Montant de la facture").setRequired(true) )
        .addStringOption( option => option.setName('company_name').setDescription("Nom de l'entreprise à laquelle est reliée la facture").setRequired(true) )
        .addStringOption( option => option.setName('reason').setDescription("Raison de la création de la facture").setRequired(true) ),
    async execute(interaction, miami_rp) {
        try {
            let player = interaction.options.getUser('player');
            let amount = interaction.options.getInteger('amount');
            let company_name = interaction.options.getString('company_name');
            let reason = interaction.options.getString('reason');

            let company = miami_rp.compagnies.filter(c => c.name === company_name)[0];

            company = handleUndefined(company);

            if (company != undefined) {
                if (company.employees.includes(interaction.member.id)) {
                    let billEmbed = {
                        title: "Facture",
                        description: `Vous avez reçu une facture de \`${amount} $\` de l'entreprise \`${company_name}\` \nRaison : **${reason}**`,
                        color: 0x30DF88
                    }

                    const buttons = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder({
                                custom_id: 'pay',
                                label: 'Payer la facture',
                                style: ButtonStyle.Success,
                                emoji: '<:Valid:991360426774384760>'
                            })
                        );

                    const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button });

                    collector.on('collect', async interaction => {
                        if (interaction.member.id != player.id) {
                            await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                        }
                        else {
                            player = miami_rp.players.filter(p => p.userID === player.id)[0];

                            if (player.argent - amount < 0) {
                                await interaction.reply({ content: "Vous n'avez pas assez d'argent pour faire ça, réessayer plus tard", ephemeral: true });
                            }
                            else {
                                player.argent -= amount;

                                company.argent += amount;

                                writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                                let payedBillEmbed = {
                                    description: `✅ Vous avez payé la facture de \`${amount} $\` de l'entreprise \`${company_name}\``,
                                    color: 0x30DF88
                                }
                
                                const updatedButtons = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder({
                                            custom_id: 'pay',
                                            label: 'Payer la facture',
                                            style: ButtonStyle.Success,
                                            emoji: '<:Valid:991360426774384760>',
                                            disabled: true
                                        })
                                    );


                                collector.stop("Fin d'interaction");

                                await interaction.update({ components: [updatedButtons] });

                                await interaction.followUp({ embeds: [payedBillEmbed] });
                            }
                        }
                    });

                    await interaction.reply({ content: `<@${player.id}>`, embeds: [billEmbed], components: [buttons] });
                }
                else {
                    await interaction.reply("Vous n'êtes pas employé.e de cette entreprise, vous ne pouvez pas créer de facture");
                }
            }
            else {
                await interaction.reply(`Aucunes entreprises ne porte le nom \`${company_name}\``);
            }
        }
        catch (Error) {
            await interaction.reply("Une erreur est survenue, possible que la personne qui dois payer la facture n'est pas créer son joueur");
        }
    }
}