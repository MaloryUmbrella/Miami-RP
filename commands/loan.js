const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, SlashCommandStringOption } = require("discord.js");
const { PermissionFlagsBits } = require('discord-api-types/v10');
const { writeFileSync } = require('fs');
//file
const fichier = './data.json';
//functions
const { pagination, toPercent, generateID, handleMuchAccount, handleUndefined } = require('../functions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loan')
        .setDescription("Commandes pour les prêts")
        .addSubcommand(
            subcommand => subcommand
                .setName('create')
                .setDescription("Créer un nouveau prêt")
                .addIntegerOption( option => option.setName('amount').setDescription("Montant du prêt").setRequired(true) )
                .addStringOption( option => option.setName('reason').setDescription("Raison du prêt").setRequired(true) )
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('info')
                .setDescription("Afficher vos prêts")
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('refund')
                .setDescription("Rembourser un prêt")
                .addStringOption( option => option.setName('loan_id').setDescription("ID du prêt").setRequired(true) )
                .addIntegerOption( option => option.setName('amount').setDescription("Montant que vous souhaitez rembourser").setRequired(true) )
        ),
    async execute(interaction, miami_rp, Loan, emojis) {
        let subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            let amount = interaction.options.getInteger('amount');
            let reason = interaction.options.getString('reason');

            let bank_account = miami_rp.banks.filter(b => b.owner === interaction.member.id)[0];

            bank_account = handleUndefined(bank_account);

            if (bank_account != undefined) {
                let loanRequestEmbed = {
                    title: "Prêt demandé",
                    description: `<@${interaction.member.id}> a demandé.e un prêt de \`${amount} $\``,
                    color: 0xB634DF
                }

                const buttons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder({
                            custom_id: 'accept',
                            label: 'Accorder le prêt',
                            style: ButtonStyle.Success,
                            emoji: '<:Valid:991360426774384760>'
                        }),
                        new ButtonBuilder({
                            custom_id: 'deny',
                            label: 'Refuser le prêt',
                            style: ButtonStyle.Danger,
                            emoji: '<:Unvalid:991360425281204265>'
                        })
                    );

                const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button });

                let author = interaction.member;

                collector.on('collect', async interaction => {
                    if (!(interaction.memberPermissions.has(PermissionFlagsBits.ViewAuditLog) || interaction.member.roles.cache.some(role => role.id === "1135186780648382555"))) {
                        await interaction.reply({ content: "Vous n'avez pas les droits d'accepter le prêt", ephemeral: true });
                    }
                    else {
                        let customID = interaction.customId;

                        if (customID === 'accept') {
                            let loanID = generateID(6);

                            while (bank_account.loans.filter(l => l.loanID === loanID)[0] != undefined && bank_account.loans.filter(l => l.loanID === loanID)[0] != null) {
                                loanID = generateID(6);
                            }

                            let loan = new Loan(amount, reason, loanID);

                            bank_account.argent += amount;

                            bank_account.history.push(`${emojis.plus_icon} ${amount} $ (Prêt pour ${reason})`);

                            bank_account.loans.push(loan);

                            writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                            let loanAcceptedEmbed = {
                                title: "Prêt accordé",
                                description: `<@${author.id}>, un prêt de \`${amount} $\` vous a été accordé par <@${interaction.member.id}>`,
                                color: 0x31E2D7
                            }

                            const updatedButtons = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder({
                                        custom_id: 'accept',
                                        label: 'Accorder le prêt',
                                        style: ButtonStyle.Success,
                                        emoji: '<:Valid:991360426774384760>',
                                        disabled: true
                                    }),
                                    new ButtonBuilder({
                                        custom_id: 'deny',
                                        label: 'Refuser le prêt',
                                        style: ButtonStyle.Danger,
                                        emoji: '<:Unvalid:991360425281204265>',
                                        disabled: true
                                    })
                                );

                            collector.stop("Fin d'interaction");

                            await interaction.update({ components: [updatedButtons] });

                            await interaction.followUp({ embeds: [loanAcceptedEmbed] });
                        }
                        else if (customID === 'deny') {
                            let loanRefusedEmbed = {
                                title: "Prêt refusé",
                                description: `<@${author.id}>, un prêt de \`${amount} $\` vous a été refusé par <@${interaction.member.id}>`,
                                color: 0xE83D29
                            }

                            const updatedButtons = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder({
                                        custom_id: 'accept',
                                        label: 'Accorder le prêt',
                                        style: ButtonStyle.Success,
                                        emoji: '<:Valid:991360426774384760>',
                                        disabled: true
                                    }),
                                    new ButtonBuilder({
                                        custom_id: 'deny',
                                        label: 'Refuser le prêt',
                                        style: ButtonStyle.Danger,
                                        emoji: '<:Unvalid:991360425281204265>',
                                        disabled: true
                                    })
                                );

                            collector.stop("Fin d'interaction");

                            await interaction.update({ components: [updatedButtons] });

                            await interaction.followUp({ embeds: [loanRefusedEmbed] });
                        }
                    }
                });

                await interaction.reply({ embeds: [loanRequestEmbed], components: [buttons] });
            }
            else {
                await interaction.reply("Cette personne n'a pas créer de compte bancaire; il est alors impossible d'ouvrir un prêt");
            }
        }
        else if (subcommand === 'info') {
            let bank_account = miami_rp.banks.filter(b => b.owner)[0];

            bank_account = handleUndefined(bank_account);

            if (bank_account != undefined) {
                let loans = pagination(bank_account.loans, 5);

                let firstLoanEmbed = {};
                let firstLoan = loans[0];

                if (loans.length > 1) {
                    let description = "";

                    for (let i = 0; i < firstLoan.length; i ++) {
                        let current_loan = firstLoan[i];

                        description += `Prêt de **${current_loan.amount} $**\n`;
                        description += `Remboursement : ${current_loan.refund} / ${current_loan.amount} (${toPercent(current_loan.refund, current_loan.amount)} %) \n`;
                        description += `ID du prêt : \`${current_loan.loanID}\` \n \n`;
                    }

                    firstLoanEmbed = {
                        title: "Prêts | Page 1",
                        description: description,
                        color: 0xB634DF
                    }

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
                                emoji: '<:Unvalid:991360425281204265>'
                            })
                        );

                    const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button });

                    let author = interaction.member;

                    let i = 0;
                    let max = loans.length - 1;

                    let lastEmbed = firstLoanEmbed;

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

                                let current_loan = loans[i];

                                let description = "";

                                for (let i = 0; i < current_loan.length; i ++) {
                                    let current_loan = current_loan[i];

                                    description += `Prêt de **${current_loan.amount} $**\n`;
                                    description += `Remboursement : ${current_loan.refund} / ${current_loan.amount} (${toPercent(current_loan.refund, current_loan.amount)} %) \n`;
                                    description += `ID du prêt : \`${current_loan.loanID}\` \n \n`;
                                }

                                let previousLoanEmbed = {
                                    title: `Prêts | Page ${(i + 1)}`,
                                    description: description,
                                    color: 0xB634DF
                                }

                                lastEmbed = previousLoanEmbed;

                                await interaction.update({ embeds: [previousLoanEmbed] });
                            }
                            else if (customID === 'next') {
                                i += 1;
                                if (i > max) {
                                    i = 0;
                                }

                                let current_loan = loans[i];

                                let description = "";

                                for (let i = 0; i < current_loan.length; i ++) {
                                    let current_loan = current_loan[i];

                                    description += `Prêt de **${current_loan.amount} $**\n`;
                                    description += `Remboursement : ${current_loan.refund} / ${current_loan.amount} (${toPercent(current_loan.refund, current_loan.amount)} %) \n`;
                                    description += `ID du prêt : \`${current_loan.loanID}\` \n \n`;
                                }

                                let nextLoanEmbed = {
                                    title: `Prêts | Page ${(i + 1)}`,
                                    description: description,
                                    color: 0xB634DF
                                }

                                lastEmbed = nextLoanEmbed;

                                await interaction.update({ embeds: [nextLoanEmbed] });
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

                                await interaction.update({ embeds: [lastEmbed], components: [updatedButtons] });
                            }
                        }
                    });

                    await interaction.reply({ embeds: [firstLoanEmbed], components: [buttons] });
                }
                else {
                    let description = "";

                    for (let i = 0; i < firstLoan.length; i ++) {
                        let current_loan = firstLoan[i];

                        description += `Prêt de **${current_loan.amount} $**\n`;
                        description += `Remboursement : ${current_loan.refund} / ${current_loan.amount} (${toPercent(current_loan.refund, current_loan.amount)} %) \n`;
                        description += `ID du prêt : \`${current_loan.loanID}\` \n \n`;
                    }

                    firstLoanEmbed = {
                        title: "Prêts",
                        description: description,
                        color: 0xB634DF
                    }

                    await interaction.reply({ embeds: [firstLoanEmbed] });
                }
            }
            else {
                await interaction.reply("Vous n'avez pas créer de compte bancaire; il est donc impossible de consulter vos prêts");
            }
        }
        else if (subcommand === 'refund') {
            let loanID = interaction.options.getString('loan_id');
            let amount = interaction.options.getInteger('amount');

            let bank_account = miami_rp.banks.filter(b => b.owner === interaction.member.id)[0];

            bank_account = handleUndefined(bank_account);

            if (bank_account != undefined) {
                let loan = bank_account.loans.filter(l => l.loanID === loanID)[0];

                loan = handleUndefined(loan);

                if (loan != undefined) {
                    if (loan.refund === loan.amount) {
                        await interaction.reply(`Vous avez déjà reboursé le prêt avec l'ID \`${loanID}\``);
                    }
                    else {
                        let loanEmbed = {
                            title: "Prêt",
                            description: `Montant restant à rembourser : \`${(loan.amount - loan.refund)} $\` \n Montant du remboursement en cours : \`${amount} $\``,
                            color: 0xB634DF
                        }
    
                        const buttons = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder({
                                    custom_id: 'pay',
                                    label: 'Payer le montant choisis',
                                    style: ButtonStyle.Success,
                                    emoji: '<:Valid:991360426774384760>'
                                }),
                                new ButtonBuilder({
                                    custom_id: 'deny',
                                    label: 'Annuler',
                                    style: ButtonStyle.Danger,
                                    emoji: '<:Unvalid:991360425281204265>'
                                })
                            );
    
                        const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button });
    
                        let author = interaction.member;
    
                        collector.on('collect', async interaction => {
                            if (author.id != interaction.member.id) {
                                await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                            }
                            else if (interaction.customId === 'pay') {
                                let player = miami_rp.players.filter(p => p.userID === interaction.member.id)[0];
    
                                if ((player.argent - amount) < 0) {
                                    if ((bank_account.argent - amount) < 0) {
                                        const updatedButtons = new ActionRowBuilder()
                                            .addComponents(
                                                new ButtonBuilder({
                                                    custom_id: 'pay',
                                                    label: 'Payer le montant choisis',
                                                    style: ButtonStyle.Success,
                                                    emoji: '<:Valid:991360426774384760>',
                                                    disabled: true
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'deny',
                                                    label: 'Annuler',
                                                    style: ButtonStyle.Danger,
                                                    emoji: '<:Unvalid:991360425281204265>',
                                                    disabled: true
                                                })
                                            );
    
                                        let mostRestant = 0;
    
                                        if (bank_account.argent > player.argent) {
                                            mostRestant = bank_account.argent;
                                        }
                                        else {
                                            mostRestant = player.argent;
                                        }

                                        collector.stop("Fin d'interaction");
    
                                        await interaction.update({ components: [updatedButtons] });
    
                                        await interaction.followUp(`Vous n'avez pas assez pour faire ça, il vous manque \`${mostRestant} $\``);
                                    }
                                    else {
                                        let account = handleMuchAccount(loan.refund, amount, loan.amount);
    
                                        let loanEmbed = {};
                                        let loanRefundEmbed = {};
    
                                        if (account === 0) {
                                            bank_account.argent -= amount;
                                            loan.refund += amount;
    
                                            loanEmbed = {
                                                title: "Prêt",
                                                description: `Montant restant à rembourser : \`${(loan.amount - loan.refund)} $\``,
                                                color: 0xB634DF
                                            }
    
                                            loanRefundEmbed = {
                                                title: "Prêt",
                                                description: `✅ Vous avez bien rembourser \`${amount} $\` de votre prêt pour \`${loan.reason}\``,
                                                color: 0x30DF88
                                            }
                                        }
                                        else {
                                            bank_account.argent -= (amount - account);
                                            loan.refund += (amount - account);
    
                                            loanEmbed = {
                                                title: "Prêt",
                                                description: `Montant restant à rembourser : \`0 $\``,
                                                color: 0xB634DF
                                            }
    
                                            loanRefundEmbed = {
                                                title: "Prêt",
                                                description: `✅ Vous avez bien rembourser \`${(amount - account)} $\` de votre prêt pour \`${loan.reason}\``,
                                                color: 0x30DF88
                                            }
                                        }

                                        if (loan.amount === loan.refund) {
                                            let loanIndex = bank_account.loans.indexOf(loanID);

                                            bank_account.loans.splice(loanIndex, 1)
                                        }
    
                                        writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));
    
                                        const updatedButtons = new ActionRowBuilder()
                                            .addComponents(
                                                new ButtonBuilder({
                                                    custom_id: 'pay',
                                                    label: 'Payer le montant choisis',
                                                    style: ButtonStyle.Success,
                                                    emoji: '<:Valid:991360426774384760>',
                                                    disabled: true
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'deny',
                                                    label: 'Annuler',
                                                    style: ButtonStyle.Danger,
                                                    emoji: '<:Unvalid:991360425281204265>',
                                                    disabled: true
                                                })
                                            );

                                        collector.stop("Fin d'interaction");
    
                                        await interaction.update({ embeds: [loanEmbed], components: [updatedButtons] });
    
                                        await interaction.followUp({ embeds: [loanRefundEmbed] });
                                    }
                                }
                                else {
                                    let account = handleMuchAccount(loan.refund, amount, loan.amount);
    
                                    let loanEmbed = {};
                                    let loanRefundEmbed = {};
    
                                    if (account === 0) {
                                        player.argent -= amount;
                                        loan.refund += amount;
    
                                        loanEmbed = {
                                            title: "Prêt",
                                            description: `Montant restant à rembourser : \`${(loan.amount - loan.refund)} $\``,
                                            color: 0xB634DF
                                        }
    
                                        loanRefundEmbed = {
                                            title: "Prêt",
                                            description: `✅ Vous avez bien rembourser \`${amount} $\` de votre prêt pour \`${loan.reason}\``,
                                            color: 0x30DF88
                                        }
                                    }
                                    else {
                                        player.argent -= (amount - account);
                                        loan.refund += (amount - account);
    
                                        loanEmbed = {
                                            title: "Prêt",
                                            description: `Montant restant à rembourser : \`0 $\``,
                                            color: 0xB634DF
                                        }
    
                                        loanRefundEmbed = {
                                            title: "Prêt",
                                            description: `✅ Vous avez bien rembourser \`${(amount - account)} $\` de votre prêt pour \`${loan.reason}\``,
                                            color: 0x30DF88
                                        }
                                    }
    
                                    writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));
    
                                    const updatedButtons = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder({
                                                custom_id: 'pay',
                                                label: 'Payer le montant choisis',
                                                style: ButtonStyle.Success,
                                                emoji: '<:Valid:991360426774384760>',
                                                disabled: true
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'deny',
                                                label: 'Annuler',
                                                style: ButtonStyle.Danger,
                                                emoji: '<:Unvalid:991360425281204265>',
                                                disabled: true
                                            })
                                        );

                                    collector.stop("Fin d'interaction");
    
                                    await interaction.update({ embeds: [loanEmbed], components: [updatedButtons] });
    
                                    await interaction.reply({ embeds: [loanRefundEmbed] });
                                }
                            }
                            else if (interaction.customId === 'deny') {
                                const updatedButtons = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder({
                                                custom_id: 'pay',
                                                label: 'Payer le montant choisis',
                                                style: ButtonStyle.Success,
                                                emoji: '<:Valid:991360426774384760>',
                                                disabled: true
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'deny',
                                                label: 'Annuler',
                                                style: ButtonStyle.Danger,
                                                emoji: '<:Unvalid:991360425281204265>',
                                                disabled: true
                                            })
                                        );

                                collector.stop("Fin d'interaction");
    
                                await interaction.update({ components: [updatedButtons] });
                            }
                        });
    
                        await interaction.reply({ embeds: [loanEmbed], components: [buttons] });
                    }
                }
                else {
                    await interaction.reply(`Aucuns prêts ne possède l'ID \`${loanID}\``);
                }
            }
            else {
                await interaction.reply("Vous n'avez pas créer de compte bancaire; il est donc impossible de rembourser un prêt");
            }
        }
    }
}