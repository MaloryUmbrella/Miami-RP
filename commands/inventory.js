const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, PermissionFlagsBits } = require("discord.js");
const { writeFileSync } = require('fs');
//file
const fichier = './data.json';
//functions
const { handleUndefined, pagination } = require('../functions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription("Commandes d'inventaire")
        .addSubcommand(subcommand => subcommand
            .setName('info')
            .setDescription("Afficher les objets dans votre inventaire")   
        )
        .addSubcommand(subcommand => subcommand
            .setName('delete-item')
            .setDescription("Supprimer un objet de l'inventaire de quelqu'un")
            .addUserOption( option => option.setName('player').setDescription("Personne dont vous souhaitez supprimer l'objet").setRequired(true) )
            .addStringOption( option => option.setName('item_name').setDescription("Nom de l'objet à retirer").setRequired(true) )
        ),
    async execute(interaction, miami_rp) {
        let subcommand = interaction.options.getSubcommand();

        if (subcommand === "info") {
            let player = miami_rp.players.filter(p => p.userID === interaction.user.id)[0];

            player = handleUndefined(player);

            if (player != undefined) {
                let items = pagination(player.inventory, 20);

                let inventoryEmbed = {};

                if (items.length === 0) {
                    inventoryEmbed = {
                        title: "Inventaire",
                        color: 0x4B4B4B,
                        description: `Argent liquide : \`${player.argent} $\``,
                        fields: [{ name: 'Inventaire vide', value: "Vous n'avez aucuns objets dans votre inventaire" }]
                    }

                    await interaction.reply({ embeds: [inventoryEmbed] });
                }
                else if (items.length === 1) {
                    let lesFields = [];
                    items = items[0];

                    for (let item of items) {
                        if (item.type === "drug") {
                            lesFields.push({ name: `${item.name}`, value: `${item.stock} g` });
                        }
                        else if (item.name === "Permis de conduire") {
                            lesFields.push({ name: `${item.name}`, value: `pour ${item.type}` });
                        }
                        else {
                            lesFields.push({ name: `${item.name}`, value: `x ${item.stock}` });
                        }
                    }

                    inventoryEmbed = {
                        title: "Inventaire",
                        color: 0x4B4B4B,
                        description: `Argent liquide : \`${player.argent} $\``,
                        fields: lesFields
                    }

                    await interaction.reply({ embeds: [inventoryEmbed] });
                }
                else {
                    let lesFields = [];

                    for (let item of items) {
                        if (item.type === "drug") {
                            lesFields.push({ name: `${item.name}`, value: `${item.stock} g` });
                        }
                        else if (item.name === "Permis de conduire") {
                            lesFields.push({ name: `${item.name}`, value: `pour ${item.type}` });
                        }
                        else {
                            lesFields.push({ name: `${item.name}`, value: `x ${item.stock}` });
                        }
                    }

                    inventoryEmbed = {
                        title: "Inventaire | Page 1",
                        color: 0x4B4B4B,
                        description: `Argent liquide : \`${player.argent} $\``,
                        fields: lesFields
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

                    let author = interaction.user;

                    let i = 0;
                    let max = items.length - 1;

                    let lastEmbed = inventoryEmbed;

                    collector.on('collect', async interaction => {
                        if (author.id != interaction.member.id) {
                            await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                        }
                        else {
                            let custom_id = interaction.customId;

                            if (custom_id === 'previous') {
                                i -= 1;
                                if (i < 0) {
                                    i = max;
                                }

                                let lesFields = [];

                                let current_items = items[i];

                                for (let item of current_items) {
                                    if (item.type === "drug") {
                                        lesFields.push({ name: `${item.name}`, value: `${item.stock} g` });
                                    }
                                    else if (item.name === "Permis de conduire") {
                                        lesFields.push({ name: `${item.name}`, value: `pour ${item.type}` });
                                    }
                                    else {
                                        lesFields.push({ name: `${item.name}`, value: `x ${item.stock}` });
                                    }
                                }

                                let currentInventoryEmbed = {
                                    title: `Inventaire | Page ${i + 1}`,
                                    color: 0x4B4B4B,
                                    description: `Argent liquide : \`${player.argent} $\``,
                                    fields: lesFields
                                }

                                lastEmbed = currentInventoryEmbed;

                                await interaction.update({ embeds: [currentInventoryEmbed] });
                            }
                            else if (custom_id === 'next') {
                                i += 1;
                                if (i > max) {
                                    i = 0;
                                }

                                let lesFields = [];

                                let current_items = items[i];

                                for (let item of current_items) {
                                    if (item.type === "drug") {
                                        lesFields.push({ name: `${item.name}`, value: `${item.stock} g` });
                                    }
                                    else if (item.name === "Permis de conduire") {
                                        lesFields.push({ name: `${item.name}`, value: `pour ${item.type}` });
                                    }
                                    else {
                                        lesFields.push({ name: `${item.name}`, value: `x ${item.stock}` });
                                    }
                                }

                                let currentInventoryEmbed = {
                                    title: `Inventaire | Page ${i + 1}`,
                                    color: 0x4B4B4B,
                                    description: `Argent liquide : \`${player.argent} $\``,
                                    fields: lesFields
                                }

                                lastEmbed = currentInventoryEmbed;

                                await interaction.update({ embeds: [currentInventoryEmbed] });
                            }
                            else if (custom_id === 'stop') {
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

                    await interaction.reply({ embeds: [inventoryEmbed], components: [buttons] });
                }
            }
            else {
                await interaction.reply("Vous n'avez pas créer votre personnage RP, vous ne pouvez pas faire ça");
            }
        }
        else if (subcommand === "delete-item") {
            let player = interaction.options.getUser("player");
            let item_name = interaction.options.getString("item_name");

            let modoFilter = interaction.memberPermissions.has(PermissionFlagsBits.ViewAuditLog);

            if (modoFilter) {
                let playerExist = miami_rp.players.filter(p => p.userID === player.id)[0];

                if (playerExist) {
                    let itemExist = playerExist.inventory.indexOf(item_name);

                    if (itemExist != -1) {
                        playerExist.inventory.splice(itemExist, 1);

                        writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                        await interaction.reply(`Vous avez bien retirer \`1 ${item_name}\` de l'inventaire de <@${player.id}>`);
                    }
                    else {
                        let items = pagination(playerExist.inventory, 20);

                        let inventoryEmbed = {};
                        let buttons = 0;

                        if (items.length === 0) {
                            inventoryEmbed = {
                                title: `Inventaire de <@${player.id}>`,
                                color: 0x4B4B4B,
                                description: "Aucuns objets dans l'inventaire"
                            };
                        }
                        else if (items.length === 1) {
                            items = items[0];

                            let lesFields = [];

                            for (let i = 0; i < items.length; i ++) {
                                let current_item = items[i];

                                if (current_item.type === "drug") {
                                    lesFields.push({ name: `${current_item.name}`, value: `${current_item.stock} g` });
                                }
                                else if (current_item.name === "Permis de conduire") {
                                    lesFields.push({ name: `${current_item.name}`, value: `pour ${current_item.type}` });
                                }
                                else {
                                    lesFields.push({ name: `${current_item.name}`, value: `x ${current_item.stock}` });
                                }
                            }

                            inventoryEmbed = {
                                title: `Inventaire de <@${player.id}>`,
                                color: 0x4B4B4B,
                                fields: lesFields
                            };
                        }
                        else {
                            let firstItems = items[0];

                            let lesFields = [];

                            for (let i = 0; i < firstItems.length; i ++) {
                                let current_item = firstItems[i];

                                if (current_item.type === "drug") {
                                    lesFields.push({ name: `${current_item.name}`, value: `${current_item.stock} g` });
                                }
                                else if (current_item.name === "Permis de conduire") {
                                    lesFields.push({ name: `${current_item.name}`, value: `pour ${current_item.type}` });
                                }
                                else {
                                    lesFields.push({ name: `${current_item.name}`, value: `x ${current_item.stock}` });
                                }
                            }

                            buttons = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder({
                                        custom_id: 'previous',
                                        label: 'Page précédente',
                                        style: ButtonStyle.Primary,
                                        emoji: '◀️',
                                    }),
                                    new ButtonBuilder({
                                        custom_id: 'next',
                                        label: 'Page suivante',
                                        style: ButtonStyle.Primary,
                                        emoji: '▶️',
                                    }),
                                    new ButtonBuilder({
                                        custom_id: 'stop',
                                        label: 'Consultation terminée',
                                        style: ButtonStyle.Danger,
                                        emoji: '<:Unvalid:991360425281204265>',
                                    })
                                );

                            inventoryEmbed = {
                                title: `Inventaire de <@${player.id}>`,
                                color: 0x4B4B4B,
                                fields: lesFields
                            };

                            const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button });

                            let author = interaction.user;

                            let i = 0;
                            let max = items.length - 1;

                            let lastEmbed = inventoryEmbed;

                            collector.on('collect', async interaction => {
                                if (author.id != interaction.member.id) {
                                    await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                                }
                                else {
                                    let custom_id = interaction.customId;

                                    if (custom_id === 'previous') {
                                        i -= 1;
                                        if (i < 0) {
                                            i = max;
                                        }

                                        let lesFields = [];

                                        let current_items = items[i];

                                        for (let item of current_items) {
                                            if (item.type === "drug") {
                                                lesFields.push({ name: `${item.name}`, value: `${item.stock} g` });
                                            }
                                            else if (item.name === "Permis de conduire") {
                                                lesFields.push({ name: `${item.name}`, value: `pour ${item.type}` });
                                            }
                                            else {
                                                lesFields.push({ name: `${item.name}`, value: `x ${item.stock}` });
                                            }
                                        }

                                        let currentInventoryEmbed = {
                                            title: `Inventaire | Page ${i + 1}`,
                                            color: 0x4B4B4B,
                                            description: `Argent liquide : \`${player.argent} $\``,
                                            fields: lesFields
                                        }

                                        lastEmbed = currentInventoryEmbed;

                                        await interaction.update({ embeds: [currentInventoryEmbed] });
                                    }
                                    else if (custom_id === 'next') {
                                        i += 1;
                                        if (i > max) {
                                            i = 0;
                                        }

                                        let lesFields = [];

                                        let current_items = items[i];

                                        for (let item of current_items) {
                                            if (item.type === "drug") {
                                                lesFields.push({ name: `${item.name}`, value: `${item.stock} g` });
                                            }
                                            else if (item.name === "Permis de conduire") {
                                                lesFields.push({ name: `${item.name}`, value: `pour ${item.type}` });
                                            }
                                            else {
                                                lesFields.push({ name: `${item.name}`, value: `x ${item.stock}` });
                                            }
                                        }

                                        let currentInventoryEmbed = {
                                            title: `Inventaire | Page ${i + 1}`,
                                            color: 0x4B4B4B,
                                            description: `Argent liquide : \`${player.argent} $\``,
                                            fields: lesFields
                                        }

                                        lastEmbed = currentInventoryEmbed;

                                        await interaction.update({ embeds: [currentInventoryEmbed] });
                                    }
                                    else if (custom_id === 'stop') {
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
                        }

                        if (buttons === 0) {
                            await interaction.reply({ embeds: [inventoryEmbed] });
                        }
                        else {
                            await interaction.reply({ embeds: [inventoryEmbed], components: [buttons] });
                        }
                    }
                }
                else {
                    await interaction.reply("Désolé, cette personne n'a pas de personnage RP et n'a donc pas d'inventaire");
                }
            }
            else {
                await interaction.reply("Désolé, vous n'avez pas les permissions de retirer un objet d'un inventaire");
            }
        }
    }
}