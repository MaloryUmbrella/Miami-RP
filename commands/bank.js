const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { PermissionFlagsBits } = require('discord-api-types/v10');
const { writeFileSync } = require('fs');
//file
const fichier = './data.json';
//functions
const { pagination, absolute, handleUndefined } = require('../functions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bank')
        .setDescription("Commandes pour les banques")
        .addSubcommand(
            subcommand => subcommand
                .setName('create')
                .setDescription("Créer un compte bancaire")
                .addUserOption( option => option.setName('player').setDescription("Selectionner un joueur").setRequired(false) )
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('deposit')
                .setDescription("Déposer de l'argent dans votre compte bancaire")
                .addIntegerOption( option => option.setName('amount').setDescription("Montant à déposer").setRequired(true) )
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('withdraw')
                .setDescription("Retirer de l'argent de votre compte bancaire")
                .addIntegerOption( option => option.setName('amount').setDescription("Montant à retirer").setRequired(true) )
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('info')
                .setDescription("Consulter votre compte bancaire")
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('config-account-create')
                .setDescription("Configurer le montant de départ lors de la création d'un compte bancaire")
                .addIntegerOption( option => option.setName('amount').setDescription("Montant de départ").setRequired(true) )
        ),
    async execute(interaction, miami_rp, Bank, emojis) {
        let subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            let player = interaction.options.getUser('player');

            if (player == undefined || player == null) {
                let bank_account = miami_rp.banks.filter(b => b.owner === interaction.member.id)[0];

                if (bank_account == undefined || bank_account == null || bank_account == "") {
                    bank_account = new Bank(interaction.member.id, miami_rp.bank_account_start);

                    bank_account.history.push(`${emojis.plus_icon} ${miami_rp.bank_account_start} $ (Création de votre compte bancaire)`);

                    miami_rp.banks.push(bank_account);

                    writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                    await interaction.reply("Votre compte bancaire a bien été créer");
                }
                else {
                    await interaction.reply("Vous avez déjà un compte bancaire, impossible d'en créer un nouveau");
                }
            }
            else {
                player = miami_rp.players.filter(p => p.userID === player.id)[0];

                player = handleUndefined(player);

                if (player != undefined) {
                    let bank_account = miami_rp.banks.filter(b => b.owner === interaction.member.id)[0];

                    if (bank_account == undefined || bank_account == null || bank_account == "") {
                        bank_account = new Bank(player.userID, miami_rp.bank_account_start);

                        miami_rp.banks.push(bank_account);

                        writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                        await interaction.reply(`Le compte bancaire de \`${player.subname} ${player.name}\` a bien été créer`);
                    }
                    else {
                        await interaction.reply("Vous avez déjà un compte bancaire, impossible d'en créer un nouveau");
                    }
                }
                else {
                    await interaction.reply("Vous ne pouvez pas créer de compte bancaire à ce nom; la personne n'a pas créer de joueur pour le moment");
                }
            }
        }
        else if (subcommand === 'deposit') {
            let amount = interaction.options.getInteger('amount');

            amount = absolute(amount);

            let player = miami_rp.players.filter(p => p.userID === interaction.member.id)[0];
            let bank_account = miami_rp.banks.filter(b => b.owner === interaction.member.id)[0];

            player = handleUndefined(player);
            bank_account = handleUndefined(bank_account);

            if (bank_account != undefined) {
                if (player != undefined) {
                    if (player.argent - amount >= 0) {
                        player.argent -= amount;

                        bank_account.argent += amount;

                        bank_account.history.push(`${emojis.plus_icon} ${amount} $ (Dépôt)`);

                        writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                        let depositEmbed = {
                            description: `Vous avez déposé.e \`${amount} $\` sur votre compte bancaire`,
                            color: 0x31E2D7
                        }

                        await interaction.reply({ embeds: [depositEmbed] });
                    }
                    else {
                        await interaction.reply(`Vous n'avez pas assez d'argent, il vous manque \`${(amount - player.argent)} $\``);
                    }
                }
                else {
                    await interaction.reply("Il semblerait que vous n'ayez pas créer votre joueur, il est donc impossible de faire cela");
                }
            }
            else {
                await interaction.reply("Vous ne pouvez pas faire ça, vous n'avez pas créer de compte bancaire");
            }
        }
        else if (subcommand === 'withdraw') {
            let amount = interaction.options.getInteger('amount');

            amount = absolute(amount);

            let player = miami_rp.players.filter(p => p.userID === interaction.member.id)[0];
            let bank_account = miami_rp.banks.filter(b => b.owner === interaction.member.id)[0];

            player = handleUndefined(player);
            bank_account = handleUndefined(player);

            if (bank_account != undefined && bank_account != null && bank_account != "") {
                if (player != undefined && player != null && player != "") {
                    if (bank_account.argent - amount >= 0) {
                        bank_account.argent -= amount;

                        player.argent += amount;

                        bank_account.history.push(`${emojis.minus_icon} ${amount} $ (Retrait)`);

                        writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                        let withdrawEmbed = {
                            description: `Vous avez retiré.e \`${amount} $\` de votre compte bancaire`,
                            color: 0x31E2D7
                        }

                        await interaction.reply({ embeds: [withdrawEmbed] });
                    }
                    else {
                        await interaction.reply(`Vous n'avez pas assez d'argent sur votre compte bancaire, il vous manque \`${(amount - bank_account.argent)} $\``);
                    }
                }
                else {
                    await interaction.reply("Il semblerait que vous n'ayez pas créer votre joueur, il est donc impossible de faire cela");
                }
            }
            else {
                await interaction.reply("Vous ne pouvez pas faire ça, vous n'avez pas créer de compte bancaire");
            }
        }
        else if (subcommand === 'info') {
            let bank_account = miami_rp.banks.filter(b => b.owner === interaction.member.id)[0];

            bank_account = handleUndefined(bank_account);

            if (bank_account != undefined) {
                let bank_history = pagination(bank_account.history, 30);

                let firstHistory = bank_history[0];

                if (bank_history.length > 1) {
                    let description = "**Historique de votre compte | Page 1 :** \n \n";

                    for (let i = 0; i < firstHistory.length; i ++) {
                        if (i < (firstHistory.length - 1)) {
                            description += `${firstHistory[i]}\n`;
                        }
                        else {
                            description += `${firstHistory[i]}`;
                        }
                    }

                    let firstHistoryEmbed = {
                        title: `Solde actuel : ${bank_account.argent} $`,
                        description: description,
                        color: 0x31E2D7
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
                    let max = bank_history.length - 1;

                    let lastEmbed = firstHistoryEmbed;

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

                                let currentHistory = bank_history[i];

                                let description = `**Historique de votre compte | Page ${(i + 1)} :** \n \n`;

                                for (let i = 0; i < currentHistory.length; i ++) {
                                    if (i < (currentHistory.length - 1)) {
                                        description += `${currentHistory[i]}\n`;
                                    }
                                    else {
                                        description += `${currentHistory[i]}`;
                                    }
                                }

                                let previousHistoryEmbed = {
                                    title: `Solde actuel : ${bank_account.argent} $`,
                                    description: description,
                                    color: 0x31E2D7
                                }

                                lastEmbed = previousHistoryEmbed;

                                await interaction.update({ embeds: [previousHistoryEmbed] });
                            }
                            else if (customID === 'next') {
                                i += 1;
                                if (i > max) {
                                    i = 0;
                                }

                                let currentHistory = bank_history[i];

                                let description = `**Historique de votre compte | Page ${(i + 1)} :** \n \n`;

                                for (let i = 0; i < currentHistory.length; i ++) {
                                    if (i < (currentHistory.length - 1)) {
                                        description += `${currentHistory[i]}\n`;
                                    }
                                    else {
                                        description += `${currentHistory[i]}`;
                                    }
                                }

                                let nextHistoryEmbed = {
                                    title: `Solde actuel : ${bank_account.argent} $`,
                                    description: description,
                                    color: 0x31E2D7
                                }

                                lastEmbed = nextHistoryEmbed;

                                await interaction.update({ embeds: [nextHistoryEmbed] });
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

                    await interaction.reply({ embeds: [firstHistoryEmbed], components: [buttons] });
                }
                else {
                    let description = "**Historique de votre compte :** \n \n";

                    for (let i = 0; i < firstHistory.length; i ++) {
                        if (i < (firstHistory.length - 1)) {
                            description += `${firstHistory[i]}\n`;
                        }
                        else {
                            description += `${firstHistory[i]}`;
                        }
                    }

                    let firstHistoryEmbed = {
                        title: `Solde actuel : ${bank_account.argent} $`,
                        description: description,
                        color: 0x31E2D7
                    }

                    await interaction.reply({ embeds: [firstHistoryEmbed] });
                }
            }
            else {
                await interaction.reply("Vous ne pouvez pas faire ça, vous n'avez pas créer de compte bancaire");
            }
        }
        else if (subcommand === 'config-account-create') {
            if (interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
                let amount = interaction.options.getInteger('amount');

                miami_rp.bank_account_start = amount;

                writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                await interaction.reply(`Le montant de création des comptes bancaires à été mis à \`${amount} $\``);
            }
            else {
                await interaction.reply("Vous n'avez pas les permissions de faire cette commande");
            }
        }
    }
}