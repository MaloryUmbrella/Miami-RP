const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { PermissionFlagsBits } = require('discord-api-types/v10');
const { writeFileSync } = require('fs');
//file
const fichier = './data.json';
//functions
const { pagination, findShopName, findPosByName, handleExistantItemInInventory, handleUndefined } = require('../functions.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription("Commandes pour les boutiques")
        .addSubcommand(
            subcommand => subcommand
                .setName('create')
                .setDescription("Créer une nouvelle boutique")
                .addStringOption( option => option.setName('name').setDescription("Nom de la boutique").setRequired(true) )
                .addStringOption( option => option.setName('type').setDescription("Type de la boutique").addChoices({ name: 'vêtement', value: 'vêtement' }, { name: 'voiture', value: 'voiture' }, { name: 'superette', value: 'superette' }, { name: 'bricolage', value: 'bricolage' }).setRequired(true) )
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('add-item')
                .setDescription("Ajouter un objet à vendre dans une boutique")
                .addStringOption( option => option.setName('shop_name').setDescription("Nom de la boutique à laquelle vous souhaitez ajouter un objet").setRequired(true) )
                .addStringOption( option => option.setName('item_name').setDescription("Nom de l'objet que vous souhaitez ajouter").setRequired(true) )
                .addIntegerOption( option => option.setName('price').setDescription("Prix de l'objet").setRequired(true) )
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('remove-item')
                .setDescription("Retirer un objet dans une boutique")
                .addStringOption( option => option.setName('shop_name').setDescription("Nom de la boutique à laquelle vous souhaitez retirer l'objet").setRequired(true) )
                .addStringOption( option => option.setName('item_name').setDescription("Nom de l'objet que vous souhaitez retirer").setRequired(true) )
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('info')
                .setDescription("Afficher les boutiques")
        )
        .addSubcommand(
            subcommand => subcommand
                .setName('delete')
                .setDescription("Supprimer une boutique")
                .addStringOption( option => option.setName('shop_name').setDescription("Nom de la boutique que vous souhaitez supprimer").setRequired(false) )
        ),
    async execute(interaction, miami_rp, Shop, Item) {
        let subcommand = interaction.options.getSubcommand();

        if (subcommand === "create") {
            let modoFilter = interaction.memberPermissions.has(PermissionFlagsBits.ViewAuditLog);

            if (modoFilter) {
                let shop_name = String(interaction.options.getString('name'));
                let shop_type = String(interaction.options.getString('type'));

                let argent = Math.round(Math.random() * 250);

                let shopNameExistant = findShopName(miami_rp.shops, shop_name);

                if (shopNameExistant) {
                    await interaction.reply(`Désolé mais le nom \`${shop_name}\` est déjà pris pour une boutique. Pour consulter les boutiques afin de vérifié si le nom est déjà pris, vous pouvez taper \`/shop info\``);
                }
                else {
                    let shop = new Shop(shop_name, shop_type, argent);

                    miami_rp.shops.push(shop);

                    writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                    await interaction.reply({ content: `La boutique \`${shop_name}\` a correctement été crée` });
                }
            }
            else {
                await interaction.reply({ content: "Désolé, vous n'avez pas les permissions de créer une boutique", ephemeral: true });
            }
        }
        else if (subcommand === "add-item") {
            let modoFilter = interaction.memberPermissions.has(PermissionFlagsBits.ViewAuditLog);

            if (modoFilter) {
                let shop_name = String(interaction.options.getString('shop_name'));
                let item_name = String(interaction.options.getString('item_name'));
                let item_price = parseInt(interaction.options.getInteger('price'));

                let shop = miami_rp.shops.filter(s => s.name === shop_name)[0];

                shop = handleUndefined(shop);

                let item = shop.items.filter(i => i.name === item_name)[0];

                item = handleUndefined(item);

                if (shop != undefined) {
                    if (item == undefined) {
                        let item = new Item(shop, item_name, item_price);

                        shop.items.push(item);

                        writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                        await interaction.reply(`L'objet \`${item_name}\` a bien été ajouter au prix de \`${item_price}\` $`);
                    }
                    else {
                        await interaction.reply(`Désolé, cet objet est déjà dans votre boutique`);
                    }
                }
                else {
                    await interaction.reply(`Désolée, aucunes boutiques ne s'appelle \`${shop_name}\``);
                }
            }
            else {
                await interaction.reply({ content: "Désolé, vous n'avez pas les permissions d'ajouter des objets dans une boutique", ephemeral: true });
            }
        }
        else if (subcommand === "remove-item") {
            let modoFilter = interaction.memberPermissions.has(PermissionFlagsBits.ViewAuditLog);

            if (modoFilter) {
                let shop_name = String(interaction.options.getString('shop_name'));
                let item_name = String(interaction.options.getString('item_name'));

                let shop = miami_rp.shops.filter(s => s.name === shop_name)[0];

                shop = handleUndefined(shop);

                if (shop != undefined) {
                    let item_pos = findPosByName(shop.items, item_name);

                    if (item_pos != -1) {
                        shop.items.splice(item_pos, 1);

                        writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                        await interaction.reply(`L'objet \`${item_name}\` a correctement été supprimer`);
                    }
                    else {
                        await interaction.reply(`Désolé, aucuns objets ne s'appelle \`${item_name}\``);
                    }
                }
                else {
                    await interaction.reply(`Désolé, aucunes boutiques ne s'appelle \`${shop_name}\``);
                }
            }
            else {
                await interaction.reply({ content: "Désolé, vous n'avez pas les permissions de retirer des objets d'une boutique", ephemeral: true });
            }
        }
        else if (subcommand === "info") {
            let firstShop = miami_rp.shops[0];

            if (firstShop != undefined && firstShop != null && firstShop != "") {
                let shopEmbed = {};
                let buttonRule = "";
                let selectRule = "";
                let select = 0;
    
                if (firstShop.type != "superette") {
                    if (firstShop.items.length === 0) {
                        shopEmbed = {
                            title: `${firstShop.name}`,
                            description: `Boutique de ${firstShop.type} \n Aucuns objets actuellement en vente dans cette boutique` 
                        }
                    }
                    else {
                        let items_pagined = pagination(firstShop.items, 15);

                        let lesFields = [];

                        for (let i = 0; i < firstShop.items.length; i ++) {
                            let current_item = firstShop.items[i];

                            lesFields.push(
                                {
                                    'name': `${current_item.name}`,
                                    'value': `${current_item.price} $`
                                }
                            );
                        }

                        if (items_pagined.length === 1) {
                            buttonRule = "sans items";
                            shopEmbed = {
                                title: `${firstShop.name}`,
                                description: `Boutique de ${firstShop.type}`,
                                fields: lesFields
                            }
                        }
                        else {
                            buttonRule = "avec items";
                            shopEmbed = {
                                title: `${firstShop.name}`,
                                description: `Boutique de ${firstShop.type} | Objets page 1`,
                                fields: lesFields
                            }
                        }
                    }
                }
                else {
                    if (firstShop.items.length === 0) {
                        shopEmbed = {
                            title: `${firstShop.name}`,
                            description: `Superette \n Aucuns objets actuellement en vente dans cette boutique`
                        }
                    }
                    else {
                        let items_pagined = pagination(firstShop.items, 15);

                        let lesFields = [];

                        for (let i = 0; i < firstShop.items.length; i ++) {
                            let current_item = firstShop.items[i];

                            lesFields.push(
                                {
                                    'name': `${current_item.name}`,
                                    'value': `${current_item.price} $`
                                }
                            );
                        }

                        shopEmbed = {
                            title: `${firstShop.name}`,
                            description: 'Superette',
                            fields: lesFields
                        }

                        if (items_pagined.length === 1) {
                            buttonRule = "sans items";
                            shopEmbed = {
                                title: `${firstShop.name}`,
                                description: 'Superette',
                                fields: lesFields
                            }
                        }
                        else {
                            buttonRule = "avec items";
                            shopEmbed = {
                                title: `${firstShop.name}`,
                                description: 'Superette | Objets page 1',
                                fields: lesFields
                            }
                        }

                        selectRule = "avec items";
                    }
                }

                if (miami_rp.shops.length > 1 && buttonRule === "avec items") {
                    const buttons = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder({
                                custom_id: 'previous_shop',
                                label: 'Boutique précédente',
                                style: ButtonStyle.Primary,
                                emoji: '◀️'
                            }),
                            new ButtonBuilder({
                                custom_id: 'previous_item',
                                label: 'Objet précédent',
                                style: ButtonStyle.Secondary,
                                emoji: '◀️'
                            }),
                            new ButtonBuilder({
                                custom_id: 'next_item',
                                label: 'Objet suivant',
                                style: ButtonStyle.Secondary,
                                emoji: '▶️'
                            }),
                            new ButtonBuilder({
                                custom_id: 'next_shop',
                                label: 'Boutique suivante',
                                style: ButtonStyle.Primary,
                                emoji: '▶️'
                            }),
                            new ButtonBuilder({
                                custom_id: 'stop',
                                label: 'Achats terminés',
                                style: ButtonStyle.Danger,
                                emoji: '🛒'
                            })
                        );

                    const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button });

                    let author = interaction.member;
                    let lastEmbed = shopEmbed;
                    let i = 0;
                    let item_page = 0;
                    let max = miami_rp.shops.length - 1;

                    let options = [];
                    let current_shop = miami_rp.shops[0];
                        
                    for (let i = 0; i < current_shop.items.length; i ++) {
                        let current_item = current_shop.items[i];
                        options.push({ label: `${current_item.name}`, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                    }

                    let select = new ActionRowBuilder()
                        .addComponents(new StringSelectMenuBuilder({
                            custom_id: 'select-item',
                            placeholder: 'Selectionnez un objet',
                            options: options
                        }));

                    collector.on('collect', async interaction => {
                        if (interaction.member.id != author.id) {
                            await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                        }
                        else {
                            let customID = interaction.customId;

                            if (customID === "previous_shop") {
                                i += 1;
                                if (i > max) {
                                    i = 0;
                                }

                                let previousShopEmbed = {};
                                let currentShop = miami_rp.shops[i];
                                let newButtonRule = "";

                                if (currentShop.type != "superette") {
                                    if (currentShop.items.length === 0) {
                                        previousShopEmbed = {
                                            title: `${currentShop.name}`,
                                            description: `Boutique de ${currentShop.type} \n Aucuns objets actuellement en vente dans cette boutique`
                                        }

                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: [{ label: 'choice1', description: 'choice', value: 'choice1' }],
                                                disabled: true
                                            }));
                                    }
                                    else {
                                        let items_pagined = pagination(currentShop.items, 15);
                    
                                        let lesFields = [];
                                        let options = [];
                    
                                        for (let i = 0; i < currentShop.items.length; i ++) {
                                            let current_item = currentShop.items[i];
                    
                                            lesFields.push(
                                                {
                                                    'name': `${current_item.name}`,
                                                    'value': `${current_item.price} $`
                                                }
                                            );

                                            options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                        }

                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: options
                                            }));
                    
                                        if (items_pagined.length === 1) {
                                            newButtonRule = "sans items";
                                            previousShopEmbed = {
                                                title: `${currentShop.name}`,
                                                description: `Boutique de ${currentShop.type}`,
                                                fields: lesFields
                                            }
                                        }
                                        else {
                                            newButtonRule = "avec items";
                                            previousShopEmbed = {
                                                title: `${currentShop.name}`,
                                                description: `Boutique de ${currentShop.type} | Objets page 1`,
                                                fields: lesFields
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (currentShop.items.length === 0) {
                                        previousShopEmbed = {
                                            title: `${currentShop.name}`,
                                            description: `Superette \n Aucuns objets actuellement en vente dans cette boutique`
                                        }

                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: [{ label: 'choice1', description: 'choice', value: 'choice1' }],
                                                disabled: true
                                            }));
                                    }
                                    else {
                                        let items_pagined = pagination(currentShop.items, 15);
                    
                                        let lesFields = [];
                                        let options = [];
                    
                                        for (let i = 0; i < currentShop.items.length; i ++) {
                                            let current_item = currentShop.items[i];
                    
                                            lesFields.push(
                                                {
                                                    'name': `${current_item.name}`,
                                                    'value': `${current_item.price} $`
                                                }
                                            );

                                            options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                        }

                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: options
                                            }));
                    
                                        previousShopEmbed = {
                                            title: `${currentShop.name}`,
                                            description: 'Superette',
                                            fields: lesFields
                                        }
                    
                                        if (items_pagined.length === 1) {
                                            newButtonRule = "sans items";
                                            previousShopEmbed = {
                                                title: `${currentShop.name}`,
                                                description: 'Superette',
                                                fields: lesFields
                                            }
                                        }
                                        else {
                                            newButtonRule = "avec items";
                                            previousShopEmbed = {
                                                title: `${currentShop.name}`,
                                                description: 'Superette | Objets page 1',
                                                fields: lesFields
                                            }
                                        }
                                    }
                                }

                                lastEmbed = previousShopEmbed;

                                let collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect });

                                let author = interaction.member;
                                let current_player = miami_rp.players.filter(p => p.userID === author.id)[0];

                                current_player = handleUndefined(current_player);
                            
                                collector.on('collect', async interaction => {
                                    let choice = interaction.values[0];
                                    if (author.id != interaction.member.id) {
                                        await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                                    }
                                    else if (current_player == undefined) {
                                        await interaction.reply({ content: "Vous ne pouvez pas acheter ceci car vous n'avez pas de personnage RP", ephemeral: true });
                                    }
                                    else {
                                        let itemName = "";
                                        let itemPrice = 0;
                                        let itemID = "";

                                        let options = [];
                                        let current_shop = miami_rp.shops[0];
                            
                                        for (let i = 0; i < current_shop.items.length; i ++) {
                                            let current_item = current_shop.items[i];
                                            options.push({ label: `${current_item.name}`, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                        }

                                        for (let option of options) {
                                            if (option.value === choice) {
                                                itemName = option.label;
                                                itemPrice = parseInt(option.description.substring(0, (option.description.indexOf("$") - 1)));
                                                itemID = option.value;
                                            }
                                        }

                                        if (itemPrice > current_player.argent) {
                                            await interaction.reply({ content: `Vous n'avez pas assez d'argent pour acheter cet objet, il vous manque \`${current_player.argent - itemPrice}\` $`, ephemeral: true });
                                        }
                                        else {
                                            current_player.argent -= itemPrice;

                                            let indexOfItem = handleExistantItemInInventory(current_player.inventory, itemName);

                                            if (indexOfItem != -1) {
                                                current_player.inventory[indexOfItem].stock += 1;
                                            }
                                            else {
                                                current_player.inventory.push({ "name": itemName, "stock": 1 });
                                            }

                                            writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                                            await interaction.reply({ content: `L'objet \`${itemName}\` a bien été acheté; il vous reste \`${current_player.argent}\` $`, ephemeral: true });
                                        }
                                    }
                                });

                                if (buttonRule != newButtonRule) {
                                    let newButtons = new ActionRowBuilder();

                                    if (newButtonRule === "avec items") {
                                        newButtons.addComponents(
                                            new ButtonBuilder({ 
                                                custom_id: 'previous_shop',
                                                label: 'Boutique précédente',
                                                style: ButtonStyle.Primary,
                                                emoji: '◀️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'previous_item',
                                                label: 'Objet précédent',
                                                style: ButtonStyle.Secondary,
                                                emoji: '◀️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'next_item',
                                                label: 'Objet suivant',
                                                style: ButtonStyle.Secondary,
                                                emoji: '▶️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'next_shop',
                                                label: 'Boutique suivante',
                                                style: ButtonStyle.Primary,
                                                emoji: '▶️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'stop',
                                                label: 'Achats terminés',
                                                style: ButtonStyle.Danger,
                                                emoji: '🛒'
                                            })
                                        );

                                        if (select === 0) {
                                            await interaction.update({ embeds: [previousShopEmbed], components: [newButtons] });
                                        }
                                        else {
                                            await interaction.update({ embeds: [previousShopEmbed], components: [newButtons, select] });
                                        }
                                    }
                                    else {
                                        newButtons.addComponents(
                                            new ButtonBuilder({
                                                custom_id: 'previous_shop',
                                                label: 'Boutique précédente',
                                                style: ButtonStyle.Primary,
                                                emoji: '◀️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'next_shop',
                                                label: 'Boutique suivante',
                                                style: ButtonStyle.Primary,
                                                emoji: '▶️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'stop',
                                                label: 'Achats terminés',
                                                style: ButtonStyle.Danger,
                                                emoji: '🛒'
                                            })
                                        );

                                        if (select === 0) {
                                            await interaction.update({ embeds: [previousShopEmbed], components: [newButtons] });
                                        }
                                        else {
                                            await interaction.update({ embeds: [previousShopEmbed], components: [newButtons, select] });
                                        }
                                    }
                                }
                                else {
                                    if (select === 0) {
                                        await interaction.update({ embeds: [previousShopEmbed] });
                                    }
                                    else {
                                        await interaction.update({ embeds: [previousShopEmbed], components: [buttons, select] });
                                    }
                                }
                            }
                            else if (customID === "previous_item") {
                                let current_shop = miami_rp.shops[i];

                                if (current_shop.type != "superette") {
                                    if (current_shop.items.length === 0) {
                                        shopEmbed = {
                                            title: `${current_shop.name}`,
                                            description: `Boutique de ${current_shop.type} \n Aucuns objets actuellement en vente dans cette boutique` 
                                        }
                                    }
                                    else {
                                        let items_pagined = pagination(current_shop.items, 15);
    
                                        item_page -= 1;
    
                                        if (item_page < 0) {
                                            item_page = items_pagined.length - 1;
                                        }

                                        items_pagined = items_pagined[item_page];
                    
                                        let lesFields = [];
                                        let options = [];
                    
                                        for (let i = 0; i < items_pagined.length; i ++) {
                                            let current_item = items_pagined[i];
                    
                                            lesFields.push(
                                                {
                                                    'name': `${current_item.name}`,
                                                    'value': `${current_item.price} $`
                                                }
                                            );

                                            options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                        }

                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: options
                                            }));
                    
                                        if (items_pagined.length === 1) {
                                            shopEmbed = {
                                                title: `${current_shop.name}`,
                                                description: `Boutique de ${current_shop.type}`,
                                                fields: lesFields
                                            }
                                        }
                                        else {
                                            shopEmbed = {
                                                title: `${firstShop.name}`,
                                                description: `Boutique de ${firstShop.type} | Objets page ${(item_page + 1)}`,
                                                fields: lesFields
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (current_shop.items.length === 0) {
                                        shopEmbed = {
                                            title: `${current_shop.name}`,
                                            description: 'Superette \n Aucuns objets actuellement en vente dans cette boutique'
                                        }
                                    }
                                    else {
                                        let items_pagined = pagination(current_shop.items, 15);
    
                                        item_page -= 1;
    
                                        if (item_page < 0) {
                                            item_page = current_shop.items.length - 1;
                                        }
    
                                        items_pagined = items_pagined[item_page];
                    
                                        let lesFields = [];
                                        let options = [];
                    
                                        for (let i = 0; i < items_pagined.length; i ++) {
                                            let current_item = items_pagined[i];
                    
                                            lesFields.push(
                                                {
                                                    'name': `${current_item.name}`,
                                                    'value': `${current_item.price} $`
                                                }
                                            );

                                            options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                        }

                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: options
                                            }));
                    
                                        if (items_pagined.length === 1) {
                                            shopEmbed = {
                                                title: `${current_shop.name}`,
                                                description: 'Superette',
                                                fields: lesFields
                                            }
                                        }
                                        else {
                                            shopEmbed = {
                                                title: `${firstShop.name}`,
                                                description: `Superette | Objets page ${(item_page + 1)}`,
                                                fields: lesFields
                                            }
                                        }
                                    }
                                }

                                let collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect });

                                let author = interaction.member;
                                let current_player = miami_rp.players.filter(p => p.userID === author.id)[0];

                                current_player = handleUndefined(current_player);
                        
                                collector.on('collect', async interaction => {
                                    let choice = interaction.values[0];
                                    if (author.id != interaction.member.id) {
                                        await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                                    }
                                    else if (current_player == undefined) {
                                        await interaction.reply({ content: "Vous ne pouvez pas acheter ceci car vous n'avez pas de personnage RP", ephemeral: true });
                                    }
                                    else {
                                        let itemName = "";
                                        let itemPrice = 0;
                                        let itemID = "";

                                        for (let option of options) {
                                            if (option.value === choice) {
                                                itemName = option.label;
                                                itemPrice = parseInt(option.description.substring(0, (option.description.indexOf("$") - 1)));
                                                itemID = option.value;
                                            }
                                        }

                                        if (itemPrice > current_player.argent) {
                                            await interaction.reply({ content: `Vous n'avez pas assez d'argent pour acheter cet objet, il vous manque \`${current_player.argent - itemPrice}\` $`, ephemeral: true });
                                        }
                                        else {
                                            current_player.argent -= itemPrice;

                                            let indexOfItem = handleExistantItemInInventory(current_player.inventory, itemName);
                                            
                                            if (indexOfItem != -1) {
                                                current_player.inventory[indexOfItem].stock += 1;
                                            }
                                            else {
                                                current_player.inventory.push({ "name": itemName, "stock": 1 });
                                            }

                                            writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                                            await interaction.reply({ content: `L'objet \`${itemName}\` a bien été acheté; il vous reste \`${current_player.argent}\` $`, ephemeral: true });
                                        }
                                    }
                                });

                                if (select === 0) {
                                    await interaction.update({ embeds: [shopEmbed] });
                                }
                                else {
                                    await interaction.update({ embeds: [shopEmbed], components: [buttons, select] });
                                }
                            }
                            else if (customID === "next_item") {
                                let current_shop = miami_rp.shops[i];

                                if (current_shop.type != "superette") {
                                    if (current_shop.items.length === 0) {
                                        shopEmbed = {
                                            title: `${current_shop.name}`,
                                            description: `Boutique de ${current_shop.type} \n Aucuns objets actuellement en vente dans cette boutique` 
                                        }
                                    }
                                    else {
                                        let items_pagined = pagination(current_shop.items, 15);

                                        item_page += 1;

                                        if (item_page > (items_pagined.length - 1)) {
                                            item_page = 0;
                                        }
    
                                        items_pagined = items_pagined[item_page];
                    
                                        let lesFields = [];
                                        let options = [];
                    
                                        for (let i = 0; i < items_pagined.length; i ++) {
                                            let current_item = items_pagined[i];
                    
                                            lesFields.push(
                                                {
                                                    'name': `${current_item.name}`,
                                                    'value': `${current_item.price} $`
                                                }
                                            );

                                            options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                        }
                    
                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: options
                                            }));

                                        if (items_pagined.length === 1) {
                                            shopEmbed = {
                                                title: `${current_shop.name}`,
                                                description: `Boutique de ${current_shop.type}`,
                                                fields: lesFields
                                            }
                                        }
                                        else {
                                            shopEmbed = {
                                                title: `${firstShop.name}`,
                                                description: `Boutique de ${firstShop.type} | Objets page ${(item_page + 1)}`,
                                                fields: lesFields
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (current_shop.items.length === 0) {
                                        shopEmbed = {
                                            title: `${current_shop.name}`,
                                            description: `Superette \n Aucuns objets actuellement en vente dans cette boutique` 
                                        }
                                    }
                                    else {
                                        let items_pagined = pagination(current_shop.items, 15);
    
                                        item_page += 1;
    
                                        if (item_page > (current_shop.items.length - 1)) {
                                            item_page = 0;
                                        }
    
                                        items_pagined = items_pagined[item_page];
                    
                                        let lesFields = [];
                                        let options = [];
                    
                                        for (let i = 0; i < items_pagined.length; i ++) {
                                            let current_item = items_pagined[i];
                    
                                            lesFields.push(
                                                {
                                                    'name': `${current_item.name}`,
                                                    'value': `${current_item.price} $`
                                                }
                                            );

                                            options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                        }

                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: options
                                            }));
                    
                                        if (items_pagined.length === 1) {
                                            shopEmbed = {
                                                title: `${current_shop.name}`,
                                                description: 'Superette',
                                                fields: lesFields
                                            }
                                        }
                                        else {
                                            shopEmbed = {
                                                title: `${firstShop.name}`,
                                                description: `Superette | Objets page ${(item_page + 1)}`,
                                                fields: lesFields
                                            }
                                        }
                                    }
                                }

                                let collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect });

                                let author = interaction.member;
                                let current_player = miami_rp.players.filter(p => p.userID === author.id)[0];
                            
                                current_player = handleUndefined(current_player);

                                collector.on('collect', async interaction => {
                                    let choice = interaction.values[0];
                                    if (author.id != interaction.member.id) {
                                        await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                                    }
                                    else if (current_player == undefined) {
                                        await interaction.reply({ content: "Vous ne pouvez pas acheter ceci car vous n'avez pas de personnage RP", ephemeral: true });
                                    }
                                    else {
                                        let itemName = "";
                                        let itemPrice = 0;
                                        let itemID = "";

                                        let options = [];
                                        let current_shop = miami_rp.shops[0];
                                                
                                        for (let i = 0; i < current_shop.items.length; i ++) {
                                            let current_item = current_shop.items[i];
                                            options.push({ label: `${current_item.name}`, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                        }

                                        for (let option of options) {
                                            if (option.value === choice) {
                                                itemName = option.label;
                                                itemPrice = parseInt(option.description.substring(0, (option.description.indexOf("$") - 1)));
                                                itemID = option.value;
                                            }
                                        }

                                        if (itemPrice > current_player.argent) {
                                            await interaction.reply({ content: `Vous n'avez pas assez d'argent pour acheter cet objet, il vous manque \`${current_player.argent - itemPrice}\` $`, ephemeral: true });
                                        }
                                        else {
                                            current_player.argent -= itemPrice;

                                            let indexOfItem = handleExistantItemInInventory(current_player.inventory, itemName);
                                            
                                            if (indexOfItem != -1) {
                                                current_player.inventory[indexOfItem].stock += 1;
                                            }
                                            else {
                                                current_player.inventory.push({ "name": itemName, "stock": 1 });
                                            }

                                            writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                                            await interaction.reply({ content: `L'objet \`${itemName}\` a bien été acheté; il vous reste \`${current_player.argent}\` $`, ephemeral: true });
                                        }
                                    }
                                });

                                if (select === 0) {
                                    await interaction.update({ embeds: [shopEmbed] });
                                }
                                else {
                                    await interaction.update({ embeds: [shopEmbed], components: [buttons, select] });
                                }
                            }
                            else if (customID === "next_shop") {
                                i -= 1;
                                if (i < 0) {
                                    i = max;
                                }

                                let nextShopEmbed = {};
                                let currentShop = miami_rp.shops[i];
                                let newButtonRule = "";

                                if (currentShop.type != "superette") {
                                    if (currentShop.items.length === 0) {
                                        nextShopEmbed = {
                                            title: `${currentShop.name}`,
                                            description: `Boutique de ${currentShop.type} \n Aucuns objets actuellement en vente dans cette boutique`
                                        }

                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: [{ label: 'choice1', description: 'choice', value: 'choice1' }],
                                                disabled: true
                                            }));
                                    }
                                    else {
                                        let items_pagined = pagination(currentShop.items, 15);
                    
                                        let lesFields = [];
                                        let options = [];
                    
                                        for (let i = 0; i < currentShop.items.length; i ++) {
                                            let current_item = currentShop.items[i];
                    
                                            lesFields.push(
                                                {
                                                    'name': `${current_item.name}`,
                                                    'value': `${current_item.price} $`
                                                }
                                            );

                                            options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                        }

                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: options
                                            }));
                    
                                        if (items_pagined.length === 1) {
                                            newButtonRule = "sans items";
                                            nextShopEmbed = {
                                                title: `${currentShop.name}`,
                                                description: `Boutique de ${currentShop.type}`,
                                                fields: lesFields
                                            }
                                        }
                                        else {
                                            newButtonRule = "avec items";
                                            nextShopEmbed = {
                                                title: `${currentShop.name}`,
                                                description: `Boutique de ${currentShop.type} | Objets page 1`,
                                                fields: lesFields
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (currentShop.items.length === 0) {
                                        nextShopEmbed = {
                                            title: `${currentShop.name}`,
                                            description: `Superette \n Aucuns objets actuellement en vente dans cette boutique`
                                        }

                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: [{ label: 'choice1', description: 'choice', value: 'choice1' }],
                                                disabled: true
                                            }));
                                    }
                                    else {
                                        let items_pagined = pagination(currentShop.items, 15);
                    
                                        let lesFields = [];
                                        let options = [];
                    
                                        for (let i = 0; i < currentShop.items.length; i ++) {
                                            let current_item = currentShop.items[i];
                    
                                            lesFields.push(
                                                {
                                                    'name': `${current_item.name}`,
                                                    'value': `${current_item.price} $`
                                                }
                                            );

                                            options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                        }
                    
                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: options
                                            }));

                                        nextShopEmbed = {
                                            title: `${currentShop.name}`,
                                            description: 'Superette',
                                            fields: lesFields
                                        }
                    
                                        if (items_pagined.length === 1) {
                                            newButtonRule = "sans items";
                                            nextShopEmbed = {
                                                title: `${currentShop.name}`,
                                                description: 'Superette',
                                                fields: lesFields
                                            }
                                        }
                                        else {
                                            newButtonRule = "avec items";
                                            nextShopEmbed = {
                                                title: `${currentShop.name}`,
                                                description: `Superette | Objets page 1`,
                                                fields: lesFields
                                            }
                                        }
                                    }
                                }

                                lastEmbed = nextShopEmbed;

                                let collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect });

                                let author = interaction.member;
                                let current_player = miami_rp.players.filter(p => p.userID === author.id)[0];

                                current_player = handleUndefined(current_player);
                            
                                collector.on('collect', async interaction => {
                                    let choice = interaction.values[0];
                                    if (author.id != interaction.member.id) {
                                        await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                                    }
                                    else if (current_player == undefined) {
                                        await interaction.reply({ content: "Vous ne pouvez pas acheter ceci car vous n'avez pas de personnage RP", ephemeral: true });
                                    }
                                    else {
                                        let itemName = "";
                                        let itemPrice = 0;
                                        let itemID = "";

                                        let options = [];
                                        let current_shop = miami_rp.shops[0];
                                                
                                        for (let i = 0; i < current_shop.items.length; i ++) {
                                            let current_item = current_shop.items[i];
                                            options.push({ label: `${current_item.name}`, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                        }

                                        for (let option of options) {
                                            if (option.value === choice) {
                                                itemName = option.label;
                                                itemPrice = parseInt(option.description.substring(0, (option.description.indexOf("$") - 1)));
                                                itemID = option.value;
                                            }
                                        }

                                        if (itemPrice > current_player.argent) {
                                            await interaction.reply({ content: `Vous n'avez pas assez d'argent pour acheter cet objet, il vous manque \`${current_player.argent - itemPrice}\` $`, ephemeral: true });
                                        }
                                        else {
                                            current_player.argent -= itemPrice;

                                            let indexOfItem = handleExistantItemInInventory(current_player.inventory, itemName);
                                            
                                            if (indexOfItem != -1) {
                                                current_player.inventory[indexOfItem].stock += 1;
                                            }
                                            else {
                                                current_player.inventory.push({ "name": itemName, "stock": 1 });
                                            }

                                            writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                                            await interaction.reply({ content: `L'objet \`${itemName}\` a bien été acheté; il vous reste \`${current_player.argent}\` $`, ephemeral: true });
                                        }
                                    }
                                });

                                if (buttonRule != newButtonRule) {
                                    let newButtons = new ActionRowBuilder();

                                    if (newButtonRule === "avec items") {
                                        newButtons.addComponents(
                                            new ButtonBuilder({ 
                                                custom_id: 'previous_shop',
                                                label: 'Boutique précédente',
                                                style: ButtonStyle.Primary,
                                                emoji: '◀️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'previous_item',
                                                label: 'Objet précédent',
                                                style: ButtonStyle.Secondary,
                                                emoji: '◀️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'next_item',
                                                label: 'Objet suivant',
                                                style: ButtonStyle.Secondary,
                                                emoji: '▶️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'next_shop',
                                                label: 'Boutique suivante',
                                                style: ButtonStyle.Primary,
                                                emoji: '▶️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'stop',
                                                label: 'Achats terminés',
                                                style: ButtonStyle.Danger,
                                                emoji: '🛒'
                                            })
                                        );
                                    }
                                    else {
                                        newButtons.addComponents(
                                            new ButtonBuilder({
                                                custom_id: 'previous_shop',
                                                label: 'Boutique précédente',
                                                style: ButtonStyle.Primary,
                                                emoji: '◀️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'next_shop',
                                                label: 'Boutique suivante',
                                                style: ButtonStyle.Primary,
                                                emoji: '▶️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'stop',
                                                label: 'Achats terminés',
                                                style: ButtonStyle.Danger,
                                                emoji: '🛒'
                                            })
                                        );
                                    }

                                    if (select === 0) {
                                        await interaction.update({ embeds: [nextShopEmbed], components: [newButtons] });
                                    }
                                    else {
                                        await interaction.update({ embeds: [nextShopEmbed], components: [newButtons, select] });
                                    }
                                }
                                else {
                                    if (select === 0) {
                                        await interaction.update({ embeds: [nextShopEmbed] });
                                    }
                                    else {
                                        await interaction.update({ embeds: [nextShopEmbed], components: [buttons, select] });
                                    }
                                }
                            }
                            else if (customID === "stop") {
                                let currentShop = miami_rp.shops[i];

                                let updatedButtons = new ActionRowBuilder();

                                if (currentShop.items.length > 15) {
                                    updatedButtons.addComponents(
                                        new ButtonBuilder({
                                            custom_id: 'previous_shop',
                                            label: 'Boutique précédente',
                                            style: ButtonStyle.Primary,
                                            emoji: '◀️',
                                            disabled: true
                                        }),
                                        new ButtonBuilder({
                                            custom_id: 'previous_item',
                                            label: 'Objet précédent',
                                            style: ButtonStyle.Secondary,
                                            emoji: '◀️',
                                            disabled: true
                                        }),
                                        new ButtonBuilder({
                                            custom_id: 'next_item',
                                            label: 'Objet suivant',
                                            style: ButtonStyle.Secondary,
                                            emoji: '▶️',
                                            disabled: true
                                        }),
                                        new ButtonBuilder({
                                            custom_id: 'next_shop',
                                            label: 'Boutique suivante',
                                            style: ButtonStyle.Primary,
                                            emoji: '▶️',
                                            disabled: true
                                        }),
                                        new ButtonBuilder({
                                            custom_id: 'stop',
                                            label: 'Achats terminés',
                                            style: ButtonStyle.Danger,
                                            emoji: '🛒',
                                            disabled: true
                                        })
                                    )

                                    select = new ActionRowBuilder()
                                        .addComponents(new StringSelectMenuBuilder({
                                            custom_id: 'select-item',
                                            placeholder: 'Selectionnez un objet',
                                            options: [{ label: 'choice1', description: 'choice1', value: 'choice1' }],
                                            disabled: true
                                        }));
                                }
                                else {
                                    updatedButtons.addComponents(
                                        new ButtonBuilder({
                                            custom_id: 'previous_shop',
                                            label: 'Boutique précédente',
                                            style: ButtonStyle.Primary,
                                            emoji: '◀️',
                                            disabled: true
                                        }),
                                        new ButtonBuilder({
                                            custom_id: 'next_shop',
                                            label: 'Boutique suivante',
                                            style: ButtonStyle.Primary,
                                            emoji: '▶️',
                                            disabled: true
                                        }),
                                        new ButtonBuilder({
                                            custom_id: 'stop',
                                            label: 'Achats terminés',
                                            style: ButtonStyle.Danger,
                                            emoji: '🛒',
                                            disabled: true
                                        })
                                    );

                                    select = new ActionRowBuilder()
                                        .addComponents(new StringSelectMenuBuilder({
                                            custom_id: 'select-item',
                                            placeholder: 'Selectionnez un objet',
                                            options: [{ label: 'choice1', description: 'choice1', value: 'choice1' }],
                                            disabled: true
                                        }));
                                }

                                collector.stop("Fin d'interaction");

                                await interaction.update({ embeds: [lastEmbed], components: [updatedButtons, select] });
                            }
                        }
                    });

                    if (select === 0) {
                        await interaction.reply({ embeds: [shopEmbed], components: [buttons] });
                    }
                    else {
                        await interaction.reply({ embeds: [shopEmbed], components: [buttons, select] });
                    }
                }
                else if (miami_rp.shops.length > 1 && buttonRule === "sans items") {
                    const buttons = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder({
                                custom_id: 'previous_shop',
                                label: 'Boutique précédente',
                                style: ButtonStyle.Primary,
                                emoji: '◀️'
                            }),
                            new ButtonBuilder({
                                custom_id: 'next_shop',
                                label: 'Boutique suivante',
                                style: ButtonStyle.Primary,
                                emoji: '▶️'
                            })
                        );

                    let options = [];
                    let current_shop = miami_rp.shops[0];

                    for (let i = 0; i < current_shop.items.length; i ++) {
                        let current_item = current_shop.items[i];
                        options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                    }

                    let select = new ActionRowBuilder()
                        .addComponents(new StringSelectMenuBuilder({
                            custom_id: 'select-item',
                            placeholder: 'Selectionnez un objet',
                            options: options
                        }));

                    const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button });

                    let author = interaction.member;
                    let lastEmbed = shopEmbed;
                    let i = 0;
                    let item_page = 0;
                    let max = miami_rp.shops.length - 1;

                    collector.on('collect', async interaction => {
                        if (interaction.member.id != author.id) {
                            await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                        }
                        else {
                            let customID = interaction.customId;

                            if (customID === "previous_shop") {
                                i += 1;
                                if (i > max) {
                                    i = 0;
                                }

                                let previousShopEmbed = {};
                                let currentShop = miami_rp.shops[i];
                                let newButtonRule = "";

                                if (currentShop.type != "superette") {
                                    if (currentShop.items.length === 0) {
                                        previousShopEmbed = {
                                            title: `${currentShop.name}`,
                                            description: `Boutique de ${currentShop.type} \n Aucuns objets actuellement en vente dans cette boutique`
                                        }

                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: [{ label: 'choice1', description: 'choice', value: 'choice1' }],
                                                disabled: true
                                            }));
                                    }
                                    else {
                                        let items_pagined = pagination(currentShop.items, 15);
                    
                                        let lesFields = [];
                                        let options = [];
                    
                                        for (let i = 0; i < currentShop.items.length; i ++) {
                                            let current_item = currentShop.items[i];
                    
                                            lesFields.push(
                                                {
                                                    'name': `${current_item.name}`,
                                                    'value': `${current_item.price} $`
                                                }
                                            );

                                            options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                        }

                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: options
                                            }));
                    
                                        if (items_pagined.length === 1) {
                                            newButtonRule = "sans items";
                                            previousShopEmbed = {
                                                title: `${currentShop.name}`,
                                                description: `Boutique de ${currentShop.type}`,
                                                fields: lesFields
                                            }
                                        }
                                        else {
                                            newButtonRule = "avec items";
                                            previousShopEmbed = {
                                                title: `${currentShop.name}`,
                                                description: `Boutique de ${currentShop.type} | Objets page 1`,
                                                fields: lesFields
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (currentShop.items.length === 0) {
                                        previousShopEmbed = {
                                            title: `${currentShop.name}`,
                                            description: `Superette \n Aucuns objets actuellement en vente dans cette boutique`
                                        }

                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: [{ label: 'choice1', description: 'choice', value: 'choice1' }],
                                                disabled: true
                                            }));
                                    }
                                    else {
                                        let items_pagined = pagination(currentShop.items, 15);
                    
                                        let lesFields = [];
                                        let options = [];
                    
                                        for (let i = 0; i < currentShop.items.length; i ++) {
                                            let current_item = currentShop.items[i];
                    
                                            lesFields.push(
                                                {
                                                    'name': `${current_item.name}`,
                                                    'value': `${current_item.price} $`
                                                }
                                            );

                                            options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                        }

                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: options
                                            }));
                    
                                        previousShopEmbed = {
                                            title: `${currentShop.name}`,
                                            description: `Superette`,
                                            fields: lesFields
                                        }
                    
                                        if (items_pagined.length === 1) {
                                            newButtonRule = "sans items";
                                            previousShopEmbed = {
                                                title: `${currentShop.name}`,
                                                description: `Superette`,
                                                fields: lesFields
                                            }
                                        }
                                        else {
                                            newButtonRule = "avec items";
                                            previousShopEmbed = {
                                                title: `${currentShop.name}`,
                                                description: `Superette | Objets page 1`,
                                                fields: lesFields
                                            }
                                        }
                                    }
                                }

                                lastEmbed = previousShopEmbed;

                                let collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect });

                                let author = interaction.member;
                                let current_player = miami_rp.players.filter(p => p.userID === author.id)[0];

                                current_player = handleUndefined(current_player);
                        
                                collector.on('collect', async interaction => {
                                    let choice = interaction.values[0];
                                    if (author.id != interaction.member.id) {
                                        await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                                    }
                                    else if (current_player == undefined) {
                                        await interaction.reply({ content: "Vous ne pouvez pas acheter ceci car vous n'avez pas de personnage RP", ephemeral: true });
                                    }
                                    else {
                                        let itemName = "";
                                        let itemPrice = 0;
                                        let itemID = "";

                                        for (let option of options) {
                                            if (option.value === choice) {
                                                itemName = option.label;
                                                itemPrice = parseInt(option.description.substring(0, (option.description.indexOf("$") - 1)));
                                                itemID = option.value;
                                            }
                                        }

                                        if (itemPrice > current_player.argent) {
                                            await interaction.reply({ content: `Vous n'avez pas assez d'argent pour acheter cet objet, il vous manque \`${current_player.argent - itemPrice}\` $`, ephemeral: true });
                                        }
                                        else {
                                            current_player.argent -= itemPrice;

                                            let indexOfItem = handleExistantItemInInventory(current_player.inventory, itemName);
                                            
                                            if (indexOfItem != -1) {
                                                current_player.inventory[indexOfItem].stock += 1;
                                            }
                                            else {
                                                current_player.inventory.push({ "name": itemName, "stock": 1 });
                                            }

                                            writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                                            await interaction.reply({ content: `L'objet \`${itemName}\` a bien été acheté; il vous reste \`${current_player.argent}\` $`, ephemeral: true });
                                        }
                                    }
                                });

                                if (buttonRule != newButtonRule) {
                                    let newButtons = new ActionRowBuilder();

                                    if (newButtonRule === "avec items") {
                                        newButtons.addComponents(
                                            new ButtonBuilder({ 
                                                custom_id: 'previous_shop',
                                                label: 'Boutique précédente',
                                                style: ButtonStyle.Primary,
                                                emoji: '◀️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'previous_item',
                                                label: 'Objet précédent',
                                                style: ButtonStyle.Secondary,
                                                emoji: '◀️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'next_item',
                                                label: 'Objet suivant',
                                                style: ButtonStyle.Secondary,
                                                emoji: '▶️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'next_shop',
                                                label: 'Boutique suivante',
                                                style: ButtonStyle.Primary,
                                                emoji: '▶️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'stop',
                                                label: 'Achats terminés',
                                                style: ButtonStyle.Danger,
                                                emoji: '🛒'
                                            })
                                        );
                                    }
                                    else {
                                        newButtons.addComponents(
                                            new ButtonBuilder({
                                                custom_id: 'previous_shop',
                                                label: 'Boutique précédente',
                                                style: ButtonStyle.Primary,
                                                emoji: '◀️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'next_shop',
                                                label: 'Boutique suivante',
                                                style: ButtonStyle.Primary,
                                                emoji: '▶️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'stop',
                                                label: 'Achats terminés',
                                                style: ButtonStyle.Danger,
                                                emoji: '🛒'
                                            })
                                        );
                                    }

                                    if (select === 0) {
                                        await interaction.update({ embeds: [previousShopEmbed], components: [newButtons] });
                                    }
                                    else {
                                        await interaction.update({ embeds: [previousShopEmbed], components: [newButtons, select] });
                                    }
                                }
                                else {
                                    if (select === 0) {
                                        await interaction.update({ embeds: [previousShopEmbed]});
                                    }
                                    else {
                                        await interaction.update({ embeds: [previousShopEmbed], components: [buttons, select] });
                                    }
                                }
                            }
                            else if (customID === "previous_item") {
                                let current_shop = miami_rp.shops[i];

                                if (current_shop.type != "superette") {
                                    if (current_shop.items.length === 0) {
                                        shopEmbed = {
                                            title: `${current_shop.name}`,
                                            description: `Boutique de ${current_shop.type} \n Aucuns objets actuellement en vente dans cette boutique` 
                                        }
                                    }
                                    else {
                                        let items_pagined = pagination(current_shop.items, 15);
    
                                        item_page -= 1;
    
                                        if (item_page < 0) {
                                            item_page = items_pagined.length - 1;
                                        }
    
                                        items_pagined = items_pagined[item_page];
                    
                                        let lesFields = [];
                                        let options = [];
                    
                                        for (let i = 0; i < items_pagined.length; i ++) {
                                            let current_item = items_pagined[i];
                    
                                            lesFields.push(
                                                {
                                                    'name': `${current_item.name}`,
                                                    'value': `${current_item.price} $`
                                                }
                                            );

                                            options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                        }

                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: options
                                            }));
                    
                                        if (items_pagined.length === 1) {
                                            shopEmbed = {
                                                title: `${current_shop.name}`,
                                                description: `Boutique de ${current_shop.type}`,
                                                fields: lesFields
                                            }
                                        }
                                        else {
                                            shopEmbed = {
                                                title: `${firstShop.name}`,
                                                description: `Boutique de ${firstShop.type} | Objets page ${(item_page + 1)}`,
                                                fields: lesFields
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (current_shop.items.length === 0) {
                                        shopEmbed = {
                                            title: `${current_shop.name}`,
                                            description: `Superette \n Aucuns objets actuellement en vente dans cette boutique` 
                                        }
                                    }
                                    else {
                                        let items_pagined = pagination(current_shop.items, 15);
    
                                        item_page -= 1;
    
                                        if (item_page < 0) {
                                            item_page = current_shop.items.length - 1;
                                        }
    
                                        items_pagined = items_pagined[item_page];
                    
                                        let lesFields = [];
                                        let options = [];
                    
                                        for (let i = 0; i < items_pagined.length; i ++) {
                                            let current_item = items_pagined[i];
                    
                                            lesFields.push(
                                                {
                                                    'name': `${current_item.name}`,
                                                    'value': `${current_item.price} $`
                                                }
                                            );

                                            options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                        }

                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: options
                                            }));
                    
                                        if (items_pagined.length === 1) {
                                            shopEmbed = {
                                                title: `${current_shop.name}`,
                                                description: `Superette`,
                                                fields: lesFields
                                            }
                                        }
                                        else {
                                            shopEmbed = {
                                                title: `${firstShop.name}`,
                                                description: `Superette | Objets page ${(item_page + 1)}`,
                                                fields: lesFields
                                            }
                                        }
                                    }
                                }

                                let collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect });

                                let author = interaction.member;
                                let current_player = miami_rp.players.filter(p => p.userID === author.id)[0];

                                current_player = handleUndefined(current_player);
                        
                                collector.on('collect', async interaction => {
                                    let choice = interaction.values[0];
                                    if (author.id != interaction.member.id) {
                                        await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                                    }
                                    else if (current_player == undefined) {
                                        await interaction.reply({ content: "Vous ne pouvez pas acheter ceci car vous n'avez pas de personnage RP", ephemeral: true });
                                    }
                                    else {
                                        let itemName = "";
                                        let itemPrice = 0;
                                        let itemID = "";

                                        for (let option of options) {
                                            if (option.value === choice) {
                                                itemName = option.label;
                                                itemPrice = parseInt(option.description.substring(0, (option.description.indexOf("$") - 1)));
                                                itemID = option.value;
                                            }
                                        }

                                        if (itemPrice > current_player.argent) {
                                            await interaction.reply({ content: `Vous n'avez pas assez d'argent pour acheter cet objet, il vous manque \`${current_player.argent - itemPrice}\` $`, ephemeral: true });
                                        }
                                        else {
                                            current_player.argent -= itemPrice;

                                            let indexOfItem = handleExistantItemInInventory(current_player.inventory, itemName);
                                            
                                            if (indexOfItem != -1) {
                                                current_player.inventory[indexOfItem].stock += 1;
                                            }
                                            else {
                                                current_player.inventory.push({ "name": itemName, "stock": 1 });
                                            }

                                            writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                                            await interaction.reply({ content: `L'objet \`${itemName}\` a bien été acheté; il vous reste \`${current_player.argent}\` $`, ephemeral: true });
                                        }
                                    }
                                });

                                if (select === 0) {
                                    await interaction.update({ embeds: [shopEmbed] });
                                }
                                else {
                                    await interaction.update({ embeds: [shopEmbed], components: [buttons, select] });
                                }
                            }
                            else if (customID === "next_item") {
                                let current_shop = miami_rp.shops[i];

                                if (current_shop.type != "superette") {
                                    if (current_shop.items.length === 0) {
                                        shopEmbed = {
                                            title: `${current_shop.name}`,
                                            description: `Boutique de ${current_shop.type} \n Aucuns objets actuellement en vente dans cette boutique` 
                                        }
                                    }
                                    else {
                                        let items_pagined = pagination(current_shop.items, 15);
    
                                        item_page += 1;
    
                                        if (item_page > (items_pagined.length - 1)) {
                                            item_page = 0;
                                        }
    
                                        items_pagined = items_pagined[item_page];
                    
                                        let lesFields = [];
                                        let options = [];
                    
                                        for (let i = 0; i < items_pagined.length; i ++) {
                                            let current_item = items_pagined[i];
                    
                                            lesFields.push(
                                                {
                                                    'name': `${current_item.name}`,
                                                    'value': `${current_item.price} $`
                                                }
                                            );

                                            options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                        }
                    
                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: options
                                            }));

                                        if (items_pagined.length === 1) {
                                            shopEmbed = {
                                                title: `${current_shop.name}`,
                                                description: `Boutique de ${current_shop.type}`,
                                                fields: lesFields
                                            }
                                        }
                                        else {
                                            shopEmbed = {
                                                title: `${firstShop.name}`,
                                                description: `Boutique de ${firstShop.type} | Objets page ${(item_page + 1)}`,
                                                fields: lesFields
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (current_shop.items.length === 0) {
                                        shopEmbed = {
                                            title: `${current_shop.name}`,
                                            description: `Superette \n Aucuns objets actuellement en vente dans cette boutique` 
                                        }
                                    }
                                    else {
                                        let items_pagined = pagination(current_shop.items, 15);
    
                                        item_page += 1;
    
                                        if (item_page > (current_shop.items.length - 1)) {
                                            item_page = 0;
                                        }
    
                                        items_pagined = items_pagined[item_page];
                    
                                        let lesFields = [];
                                        let options = [];
                    
                                        for (let i = 0; i < items_pagined.length; i ++) {
                                            let current_item = items_pagined[i];
                    
                                            lesFields.push(
                                                {
                                                    'name': `${current_item.name}`,
                                                    'value': `${current_item.price} $`
                                                }
                                            );

                                            options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                        }

                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: options
                                            }));
                    
                                        if (items_pagined.length === 1) {
                                            shopEmbed = {
                                                title: `${current_shop.name}`,
                                                description: `Superette`,
                                                fields: lesFields
                                            }
                                        }
                                        else {
                                            shopEmbed = {
                                                title: `${firstShop.name}`,
                                                description: `Superette | Objets page ${(item_page + 1)}`,
                                                fields: lesFields
                                            }
                                        }
                                    }
                                }

                                let collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect });

                                let author = interaction.member;
                                let current_player = miami_rp.players.filter(p => p.userID === author.id)[0];

                                current_player = handleUndefined(current_player);
                        
                                collector.on('collect', async interaction => {
                                    let choice = interaction.values[0];
                                    if (author.id != interaction.member.id) {
                                        await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                                    }
                                    else if (current_player == undefined) {
                                        await interaction.reply({ content: "Vous ne pouvez pas acheter ceci car vous n'avez pas de personnage RP", ephemeral: true });
                                    }
                                    else {
                                        let itemName = "";
                                        let itemPrice = 0;
                                        let itemID = "";

                                        for (let option of options) {
                                            if (option.value === choice) {
                                                itemName = option.label;
                                                itemPrice = parseInt(option.description.substring(0, (option.description.indexOf("$") - 1)));
                                                itemID = option.value;
                                            }
                                        }

                                        if (itemPrice > current_player.argent) {
                                            await interaction.reply({ content: `Vous n'avez pas assez d'argent pour acheter cet objet, il vous manque \`${current_player.argent - itemPrice}\` $`, ephemeral: true });
                                        }
                                        else {
                                            current_player.argent -= itemPrice;

                                            let indexOfItem = handleExistantItemInInventory(current_player.inventory, itemName);
                                            
                                            if (indexOfItem != -1) {
                                                current_player.inventory[indexOfItem].stock += 1;
                                            }
                                            else {
                                                current_player.inventory.push({ "name": itemName, "stock": 1 });
                                            }

                                            writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                                            await interaction.reply({ content: `L'objet \`${itemName}\` a bien été acheté; il vous reste \`${current_player.argent}\` $`, ephemeral: true });
                                        }
                                    }
                                });

                                if (select === 0) {
                                    await interaction.update({ embeds: [shopEmbed] });
                                }
                                else {
                                    await interaction.update({ embeds: [shopEmbed], components: [buttons, select] });
                                }
                            }
                            else if (customID === "next_shop") {
                                i -= 1;
                                if (i < 0) {
                                    i = max;
                                }

                                let nextShopEmbed = {};
                                let currentShop = miami_rp.shops[i];
                                let newButtonRule = "";

                                if (currentShop.type != "superette") {
                                    if (currentShop.items.length === 0) {
                                        nextShopEmbed = {
                                            title: `${currentShop.name}`,
                                            description: `Boutique de ${currentShop.type} \n Aucuns objets actuellement en vente dans cette boutique`
                                        }

                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: [{ label: 'choice1', description: 'choice', value: 'choice1' }],
                                                disabled: true
                                            }));
                                    }
                                    else {
                                        let items_pagined = pagination(currentShop.items, 15);
                    
                                        let lesFields = [];
                                        let options = [];
                    
                                        for (let i = 0; i < currentShop.items.length; i ++) {
                                            let current_item = currentShop.items[i];
                    
                                            lesFields.push(
                                                {
                                                    'name': `${current_item.name}`,
                                                    'value': `${current_item.price} $`
                                                }
                                            );

                                            options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                        }

                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: options
                                            }));
                    
                                        if (items_pagined.length === 1) {
                                            newButtonRule = "sans items";
                                            nextShopEmbed = {
                                                title: `${currentShop.name}`,
                                                description: `Boutique de ${currentShop.type}`,
                                                fields: lesFields
                                            }
                                        }
                                        else {
                                            newButtonRule = "avec items";
                                            nextShopEmbed = {
                                                title: `${currentShop.name}`,
                                                description: `Boutique de ${currentShop.type} | Objets page 1`,
                                                fields: lesFields
                                            }
                                        }
                                    }
                                }
                                else {
                                    if (currentShop.items.length === 0) {
                                        nextShopEmbed = {
                                            title: `${currentShop.name}`,
                                            description: `Superette  \n Aucuns objets actuellement en vente dans cette boutique`
                                        }

                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: [{ label: 'choice1', description: 'choice', value: 'choice1' }],
                                                disabled: true
                                            }));
                                    }
                                    else {
                                        let items_pagined = pagination(currentShop.items, 15);
                    
                                        let lesFields = [];
                                        let options = [];
                    
                                        for (let i = 0; i < currentShop.items.length; i ++) {
                                            let current_item = currentShop.items[i];
                    
                                            lesFields.push(
                                                {
                                                    'name': `${current_item.name}`,
                                                    'value': `${current_item.price} $`
                                                }
                                            );

                                            options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                        }
                    
                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: options
                                            }));

                                        nextShopEmbed = {
                                            title: `${currentShop.name}`,
                                            description: `Superette`,
                                            fields: lesFields
                                        }
                    
                                        if (items_pagined.length === 1) {
                                            newButtonRule = "sans items";
                                            nextShopEmbed = {
                                                title: `${currentShop.name}`,
                                                description: `Superette`,
                                                fields: lesFields
                                            }
                                        }
                                        else {
                                            newButtonRule = "avec items";
                                            nextShopEmbed = {
                                                title: `${currentShop.name}`,
                                                description: `Superette | Objets page 1`,
                                                fields: lesFields
                                            }
                                        }
                                    }
                                }

                                lastEmbed = nextShopEmbed;

                                if (buttonRule != newButtonRule) {
                                    let newButtons = new ActionRowBuilder();

                                    if (newButtonRule === "avec items") {
                                        newButtons.addComponents(
                                            new ButtonBuilder({ 
                                                custom_id: 'previous_shop',
                                                label: 'Boutique précédente',
                                                style: ButtonStyle.Primary,
                                                emoji: '◀️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'previous_item',
                                                label: 'Objet précédent',
                                                style: ButtonStyle.Secondary,
                                                emoji: '◀️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'next_item',
                                                label: 'Objet suivant',
                                                style: ButtonStyle.Secondary,
                                                emoji: '▶️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'next_shop',
                                                label: 'Boutique suivante',
                                                style: ButtonStyle.Primary,
                                                emoji: '▶️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'stop',
                                                label: 'Achats terminés',
                                                style: ButtonStyle.Danger,
                                                emoji: '🛒'
                                            })
                                        );
                                    }
                                    else {
                                        newButtons.addComponents(
                                            new ButtonBuilder({
                                                custom_id: 'previous_shop',
                                                label: 'Boutique précédente',
                                                style: ButtonStyle.Primary,
                                                emoji: '◀️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'next_shop',
                                                label: 'Boutique suivante',
                                                style: ButtonStyle.Primary,
                                                emoji: '▶️'
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'stop',
                                                label: 'Achats terminés',
                                                style: ButtonStyle.Danger,
                                                emoji: '🛒'
                                            })
                                        );
                                    }

                                    let collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect });

                                    let author = interaction.member;
                                    let current_player = miami_rp.players.filter(p => p.userID === author.id)[0];

                                    current_player = handleUndefined(current_player);
                            
                                    collector.on('collect', async interaction => {
                                        let choice = interaction.values[0];
                                        if (author.id != interaction.member.id) {
                                            await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                                        }
                                        else if (current_player == undefined) {
                                            await interaction.reply({ content: "Vous ne pouvez pas acheter ceci car vous n'avez pas de personnage RP", ephemeral: true });
                                        }
                                        else {
                                            let itemName = "";
                                            let itemPrice = 0;
                                            let itemID = "";

                                            for (let option of options) {
                                                if (option.value === choice) {
                                                    itemName = option.label;
                                                    itemPrice = parseInt(option.description.substring(0, (option.description.indexOf("$") - 1)));
                                                    itemID = option.value;
                                                }
                                            }

                                            if (itemPrice > current_player.argent) {
                                                await interaction.reply({ content: `Vous n'avez pas assez d'argent pour acheter cet objet, il vous manque \`${current_player.argent - itemPrice}\` $`, ephemeral: true });
                                            }
                                            else {
                                                current_player.argent -= itemPrice;

                                                let indexOfItem = handleExistantItemInInventory(current_player.inventory, itemName);
                                            
                                                if (indexOfItem != -1) {
                                                    current_player.inventory[indexOfItem].stock += 1;
                                                }
                                                else {
                                                    current_player.inventory.push({ "name": itemName, "stock": 1 });
                                                }

                                                writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                                                await interaction.reply({ content: `L'objet \`${itemName}\` a bien été acheté; il vous reste \`${current_player.argent}\` $`, ephemeral: true });
                                            }
                                        }
                                    });

                                    if (select === 0) {
                                        await interaction.update({ embeds: [nextShopEmbed], components: [newButtons] });
                                    }
                                    else {
                                        await interaction.update({ embeds: [nextShopEmbed], components: [newButtons, select] });
                                    }
                                }
                                else {
                                    if (select === 0) {
                                        await interaction.update({ embeds: [nextShopEmbed] });
                                    }
                                    else {
                                        await interaction.update({ embeds: [nextShopEmbed], components: [buttons, select] });
                                    }
                                }
                            }
                            else if (customID === "stop") {
                                let currentShop = miami_rp.shops[i];

                                let updatedButtons = new ActionRowBuilder();
                                    
                                select = 0;

                                if (currentShop.items.length > 15) {
                                    updatedButtons.addComponents(
                                        new ButtonBuilder({
                                            custom_id: 'previous_shop',
                                            label: 'Boutique précédente',
                                            style: ButtonStyle.Primary,
                                            emoji: '◀️',
                                            disabled: true
                                        }),
                                        new ButtonBuilder({
                                            custom_id: 'previous_item',
                                            label: 'Objet précédent',
                                            style: ButtonStyle.Secondary,
                                            emoji: '◀️',
                                            disabled: true
                                        }),
                                        new ButtonBuilder({
                                            custom_id: 'next_item',
                                            label: 'Objet suivant',
                                            style: ButtonStyle.Secondary,
                                            emoji: '▶️',
                                            disabled: true
                                        }),
                                        new ButtonBuilder({
                                            custom_id: 'next_shop',
                                            label: 'Boutique suivante',
                                            style: ButtonStyle.Primary,
                                            emoji: '▶️',
                                            disabled: true
                                        }),
                                        new ButtonBuilder({
                                            custom_id: 'stop',
                                            label: 'Achats terminés',
                                            style: ButtonStyle.Danger,
                                            emoji: '🛒',
                                            disabled: true
                                        })
                                    );

                                    select = new ActionRowBuilder()
                                        .addComponents(new StringSelectMenuBuilder({
                                            custom_id: 'select-item',
                                            placeholder: 'Selectionnez un objet',
                                            options: [{ label: 'choice1', description: 'choice', value: 'choice1' }],
                                            disabled: true
                                        }));
                                }
                                else {
                                    updatedButtons.addComponents(
                                        new ButtonBuilder({
                                            custom_id: 'previous_shop',
                                            label: 'Boutique précédente',
                                            style: ButtonStyle.Primary,
                                            emoji: '◀️',
                                            disabled: true
                                        }),
                                        new ButtonBuilder({
                                            custom_id: 'next_shop',
                                            label: 'Boutique suivante',
                                            style: ButtonStyle.Primary,
                                            emoji: '▶️',
                                            disabled: true
                                        }),
                                        new ButtonBuilder({
                                            custom_id: 'stop',
                                            label: 'Achats terminés',
                                            style: ButtonStyle.Danger,
                                            emoji: '🛒',
                                            disabled: true
                                        })
                                    );

                                    select = new ActionRowBuilder()
                                        .addComponents(new StringSelectMenuBuilder({
                                            custom_id: 'select-item',
                                            placeholder: 'Selectionnez un objet',
                                            options: [{ label: 'choice1', description: 'choice', value: 'choice1' }],
                                            disabled: true
                                        }));
                                }

                                collector.stop("Fin d'interaction");

                                if (select === 0) {
                                    await interaction.update({ embeds: [lastEmbed], components: [updatedButtons] });
                                }
                                else {
                                    await interaction.update({ embeds: [lastEmbed], components: [updatedButtons, select] });
                                }
                            }
                        }
                    });

                    await interaction.reply({ embeds: [shopEmbed], components: [buttons, select] });
                }
                else if (miami_rp.shops.length === 1 && buttonRule === "avec items") {
                    const buttons = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder({
                                custom_id: 'previous_item',
                                label: 'Objet précédent',
                                style: ButtonStyle.Secondary,
                                emoji: '◀️'
                            }),
                            new ButtonBuilder({
                                custom_id: 'next_item',
                                label: 'Objet suivant',
                                style: ButtonStyle.Secondary,
                                emoji: '▶️'
                            }),
                            new ButtonBuilder({
                                custom_id: 'stop',
                                label: 'Achats terminés',
                                style: ButtonStyle.Danger,
                                emoji: '🛒',
                            })
                        );

                        let collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button });

                        let author = interaction.member;
                        let lastEmbed = shopEmbed;
                        let i = 0;
                        let item_page = 0;
                        let max = miami_rp.shops.length - 1;
                        let select = 0;

                        collector.on('collect', async interaction => {
                            if (interaction.member.id != author.id) {
                                await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                            }
                            else {
                                let customID = interaction.customId;

                                if (customID === "previous_shop") {
                                    i += 1;
                                    if (i > max) {
                                        i = 0;
                                    }

                                    let previousShopEmbed = {};
                                    let currentShop = miami_rp.shops[i];
                                    let newButtonRule = "";

                                    if (currentShop.type != "superette") {
                                        if (currentShop.items.length === 0) {
                                            previousShopEmbed = {
                                                title: `${currentShop.name}`,
                                                description: `Boutique de ${currentShop.type} \n Aucuns objets actuellement en vente dans cette boutique`
                                            }

                                            select = new ActionRowBuilder()
                                                .addComponents(new StringSelectMenuBuilder({
                                                    custom_id: 'select-item',
                                                    placeholder: 'Selectionnez un objet',
                                                    options: [{ label: 'choice1', description: 'choice', value: 'choice1' }],
                                                    disabled: true
                                                }));
                                        }
                                        else {
                                            let items_pagined = pagination(currentShop.items, 15);
                    
                                            let lesFields = [];
                                            let options = [];
                    
                                            for (let i = 0; i < currentShop.items.length; i ++) {
                                                let current_item = currentShop.items[i];
                    
                                                lesFields.push(
                                                    {
                                                        'name': `${current_item.name}`,
                                                        'value': `${current_item.price} $`
                                                    }
                                                );

                                                options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                            }

                                            select = new ActionRowBuilder()
                                                .addComponents(new StringSelectMenuBuilder({
                                                    custom_id: 'select-item',
                                                    placeholder: 'Selectionnez un objet',
                                                    options: options
                                                }));
                    
                                            if (items_pagined.length === 1) {
                                                newButtonRule = "sans items";
                                                previousShopEmbed = {
                                                    title: `${currentShop.name}`,
                                                    description: `Boutique de ${currentShop.type}`,
                                                    fields: lesFields
                                                }
                                            }
                                            else {
                                                newButtonRule = "avec items";
                                                previousShopEmbed = {
                                                    title: `${currentShop.name}`,
                                                    description: `Boutique de ${currentShop.type} | Objets page 1`,
                                                    fields: lesFields
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (currentShop.items.length === 0) {
                                            previousShopEmbed = {
                                                title: `${currentShop.name}`,
                                                description: `Superette \n Aucuns objets actuellement en vente dans cette boutique`
                                            }

                                            select = new ActionRowBuilder()
                                                .addComponents(new StringSelectMenuBuilder({
                                                    custom_id: 'select-item',
                                                    placeholder: 'Selectionnez un objet',
                                                    options: [{ label: 'choice1', description: 'choice', value: 'choice1' }],
                                                    disabled: true
                                                }));
                                        }
                                        else {
                                            let items_pagined = pagination(currentShop.items, 15);
                    
                                            let lesFields = [];
                                            let options = [];
                    
                                            for (let i = 0; i < currentShop.items.length; i ++) {
                                                let current_item = currentShop.items[i];
                    
                                                lesFields.push(
                                                    {
                                                        'name': `${current_item.name}`,
                                                        'value': `${current_item.price} $`
                                                    }
                                                );

                                                options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                            }

                                            select = new ActionRowBuilder()
                                                .addComponents(new StringSelectMenuBuilder({
                                                    custom_id: 'select-item',
                                                    placeholder: 'Selectionnez un objet',
                                                    options: options
                                                }));
                    
                                            previousShopEmbed = {
                                                title: `${currentShop.name}`,
                                                description: 'Superette',
                                                fields: lesFields
                                            }
                    
                                            if (items_pagined.length === 1) {
                                                newButtonRule = "sans items";
                                                previousShopEmbed = {
                                                    title: `${currentShop.name}`,
                                                    description: 'Superette',
                                                    fields: lesFields
                                                }
                                            }
                                            else {
                                                newButtonRule = "avec items";
                                                previousShopEmbed = {
                                                    title: `${currentShop.name}`,
                                                    description: 'Superette | Objets page 1',
                                                    fields: lesFields
                                                }
                                            }
                                        }
                                    }

                                    lastEmbed = previousShopEmbed;

                                    let collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect });

                                    let author = interaction.member;
                                    let current_player = miami_rp.players.filter(p => p.userID === author.id)[0];

                                    current_player = handleUndefined(current_player);
                            
                                    collector.on('collect', async interaction => {
                                        let choice = interaction.values[0];
                                        if (author.id != interaction.member.id) {
                                            await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                                        }
                                        else if (current_player == undefined) {
                                            await interaction.reply({ content: "Vous ne pouvez pas acheter ceci car vous n'avez pas de personnage RP", ephemeral: true });
                                        }
                                        else {
                                            let itemName = "";
                                            let itemPrice = 0;
                                            let itemID = "";

                                            for (let option of options) {
                                                if (option.value === choice) {
                                                    itemName = option.label;
                                                    itemPrice = parseInt(option.description.substring(0, (option.description.indexOf("$") - 1)));
                                                    itemID = option.value;
                                                }
                                            }

                                            if (itemPrice > current_player.argent) {
                                                await interaction.reply({ content: `Vous n'avez pas assez d'argent pour acheter cet objet, il vous manque \`${current_player.argent - itemPrice}\` $`, ephemeral: true });
                                            }
                                            else {
                                                current_player.argent -= itemPrice;

                                                let indexOfItem = handleExistantItemInInventory(current_player.inventory, itemName);
                                            
                                                if (indexOfItem != -1) {
                                                    current_player.inventory[indexOfItem].stock += 1;
                                                }
                                                else {
                                                    current_player.inventory.push({ "name": itemName, "stock": 1 });
                                                }

                                                writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                                                await interaction.reply({ content: `L'objet \`${itemName}\` a bien été acheté; il vous reste \`${current_player.argent}\` $`, ephemeral: true });
                                            }
                                        }
                                    });

                                    if (buttonRule != newButtonRule) {
                                        let newButtons = new ActionRowBuilder();

                                        if (newButtonRule === "avec items") {
                                            newButtons.addComponents(
                                                new ButtonBuilder({ 
                                                    custom_id: 'previous_shop',
                                                    label: 'Boutique précédente',
                                                    style: ButtonStyle.Primary,
                                                    emoji: '◀️'
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'previous_item',
                                                    label: 'Objet précédent',
                                                    style: ButtonStyle.Secondary,
                                                    emoji: '◀️'
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'next_item',
                                                    label: 'Objet suivant',
                                                    style: ButtonStyle.Secondary,
                                                    emoji: '▶️'
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'next_shop',
                                                    label: 'Boutique suivante',
                                                    style: ButtonStyle.Primary,
                                                    emoji: '▶️'
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'stop',
                                                    label: 'Achats terminés',
                                                    style: ButtonStyle.Danger,
                                                    emoji: '🛒'
                                                })
                                            );

                                            if (select === 0) {
                                                await interaction.update({ embeds: [previousShopEmbed], components: [newButtons] });
                                            }
                                            else {
                                                await interaction.update({ embeds: [previousShopEmbed], components: [newButtons, select] });
                                            }
                                        }
                                        else {
                                            newButtons.addComponents(
                                                new ButtonBuilder({
                                                    custom_id: 'previous_shop',
                                                    label: 'Boutique précédente',
                                                    style: ButtonStyle.Primary,
                                                    emoji: '◀️'
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'next_shop',
                                                    label: 'Boutique suivante',
                                                    style: ButtonStyle.Primary,
                                                    emoji: '▶️'
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'stop',
                                                    label: 'Achats terminés',
                                                    style: ButtonStyle.Danger,
                                                    emoji: '🛒'
                                                })
                                            );

                                            if (select === 0) {
                                                await interaction.update({ embeds: [previousShopEmbed], components: [newButtons] });
                                            }
                                            else {
                                                await interaction.update({ embeds: [previousShopEmbed], components: [newButtons, select] });
                                            }
                                        }
                                    }
                                    else {
                                        if (select === 0) {
                                            await interaction.update({ embeds: [previousShopEmbed] });
                                        }
                                        else {
                                            await interaction.update({ embeds: [previousShopEmbed], components: [buttons, select] });
                                        }
                                    }
                                }
                                else if (customID === "previous_item") {
                                    let current_shop = miami_rp.shops[i];

                                    if (current_shop.type != "superette") {
                                        if (current_shop.items.length === 0) {
                                            shopEmbed = {
                                                title: `${current_shop.name}`,
                                                description: `Boutique de ${current_shop.type} \n Aucuns objets actuellement en vente dans cette boutique` 
                                            }
                                        }
                                        else {
                                            let items_pagined = pagination(current_shop.items, 15);
    
                                            item_page -= 1;
    
                                            if (item_page < 0) {
                                                item_page = items_pagined.length - 1;
                                            }
    
                                            items_pagined = items_pagined[item_page];
                    
                                            let lesFields = [];
                                            let options = [];
                    
                                            for (let i = 0; i < items_pagined.length; i ++) {
                                                let current_item = items_pagined[i];
                    
                                                lesFields.push(
                                                    {
                                                        'name': `${current_item.name}`,
                                                        'value': `${current_item.price} $`
                                                    }
                                                );

                                                options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                            }

                                            select = new ActionRowBuilder()
                                                .addComponents(new StringSelectMenuBuilder({
                                                    custom_id: 'select-item',
                                                    placeholder: 'Selectionnez un objet',
                                                    options: options
                                                }));
                    
                                            if (items_pagined.length === 1) {
                                                shopEmbed = {
                                                    title: `${current_shop.name}`,
                                                    description: `Boutique de ${current_shop.type}`,
                                                    fields: lesFields
                                                }
                                            }
                                            else {
                                                shopEmbed = {
                                                    title: `${firstShop.name}`,
                                                    description: `Boutique de ${firstShop.type} | Objets page ${(item_page + 1)}`,
                                                    fields: lesFields
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (current_shop.items.length === 0) {
                                            shopEmbed = {
                                                title: `${current_shop.name}`,
                                                description: 'Superette \n Aucuns objets actuellement en vente dans cette boutique'
                                            }
                                        }
                                        else {
                                            let items_pagined = pagination(current_shop.items, 15);
    
                                            item_page -= 1;
    
                                            if (item_page < 0) {
                                                item_page = current_shop.items.length - 1;
                                            }
    
                                            items_pagined = items_pagined[item_page];
                    
                                            let lesFields = [];
                                            let options = [];
                    
                                            for (let i = 0; i < items_pagined.length; i ++) {
                                                let current_item = items_pagined[i];
                    
                                                lesFields.push(
                                                    {
                                                        'name': `${current_item.name}`,
                                                        'value': `${current_item.price} $`
                                                    }
                                                );

                                                options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                            }

                                            select = new ActionRowBuilder()
                                                .addComponents(new StringSelectMenuBuilder({
                                                    custom_id: 'select-item',
                                                    placeholder: 'Selectionnez un objet',
                                                    options: options
                                                }));
                    
                                            if (items_pagined.length === 1) {
                                                shopEmbed = {
                                                    title: `${current_shop.name}`,
                                                    description: 'Superette',
                                                    fields: lesFields
                                                }
                                            }
                                            else {
                                                shopEmbed = {
                                                    title: `${firstShop.name}`,
                                                    description: `Superette | Objets page ${(item_page + 1)}`,
                                                    fields: lesFields
                                                }
                                            }
                                        }
                                    }

                                    let collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect });

                                    let author = interaction.member;
                                    let current_player = miami_rp.players.filter(p => p.userID === author.id)[0];

                                    current_player = handleUndefined(current_player);
                            
                                    collector.on('collect', async interaction => {
                                        let choice = interaction.values[0];
                                        if (author.id != interaction.member.id) {
                                            await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                                        }
                                        else if (current_player == undefined) {
                                            await interaction.reply({ content: "Vous ne pouvez pas acheter ceci car vous n'avez pas de personnage RP", ephemeral: true });
                                        }
                                        else {
                                            let itemName = "";
                                            let itemPrice = 0;
                                            let itemID = "";

                                            for (let option of options) {
                                                if (option.value === choice) {
                                                    itemName = option.label;
                                                    itemPrice = parseInt(option.description.substring(0, (option.description.indexOf("$") - 1)));
                                                    itemID = option.value;
                                                }
                                            }

                                            if (itemPrice > current_player.argent) {
                                                await interaction.reply({ content: `Vous n'avez pas assez d'argent pour acheter cet objet, il vous manque \`${current_player.argent - itemPrice}\` $`, ephemeral: true });
                                            }
                                            else {
                                                current_player.argent -= itemPrice;

                                                let indexOfItem = handleExistantItemInInventory(current_player.inventory, itemName);
                                            
                                                if (indexOfItem != -1) {
                                                    current_player.inventory[indexOfItem].stock += 1;
                                                }
                                                else {
                                                    current_player.inventory.push({ "name": itemName, "stock": 1 });
                                                }

                                                writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                                                await interaction.reply({ content: `L'objet \`${itemName}\` a bien été acheté; il vous reste \`${current_player.argent}\` $`, ephemeral: true });
                                            }
                                        }
                                    });

                                    if (select === 0) {
                                        await interaction.update({ embeds: [shopEmbed] });
                                    }
                                    else {
                                        await interaction.update({ embeds: [shopEmbed], components: [buttons, select] });
                                    }
                                }
                                else if (customID === "next_item") {
                                    let current_shop = miami_rp.shops[i];

                                    if (current_shop.type != "superette") {
                                        if (current_shop.items.length === 0) {
                                            shopEmbed = {
                                                title: `${current_shop.name}`,
                                                description: `Boutique de ${current_shop.type} \n Aucuns objets actuellement en vente dans cette boutique` 
                                            }
                                        }
                                        else {
                                            let items_pagined = pagination(current_shop.items, 15);
    
                                            item_page += 1;
    
                                            if (item_page > (items_pagined.length - 1)) {
                                                item_page = 0;
                                            }
    
                                            items_pagined = items_pagined[item_page];
                    
                                            let lesFields = [];
                                            let options = [];
                    
                                            for (let i = 0; i < items_pagined.length; i ++) {
                                                let current_item = items_pagined[i];
                    
                                                lesFields.push(
                                                    {
                                                        'name': `${current_item.name}`,
                                                        'value': `${current_item.price} $`
                                                    }
                                                );

                                                options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                            }
                    
                                            select = new ActionRowBuilder()
                                                .addComponents(new StringSelectMenuBuilder({
                                                    custom_id: 'select-item',
                                                    placeholder: 'Selectionnez un objet',
                                                    options: options
                                                }));

                                            if (items_pagined.length === 1) {
                                                shopEmbed = {
                                                    title: `${current_shop.name}`,
                                                    description: `Boutique de ${current_shop.type}`,
                                                    fields: lesFields
                                                }
                                            }
                                            else {
                                                shopEmbed = {
                                                    title: `${firstShop.name}`,
                                                    description: `Boutique de ${firstShop.type} | Objets page ${(item_page + 1)}`,
                                                    fields: lesFields
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (current_shop.items.length === 0) {
                                            shopEmbed = {
                                                title: `${current_shop.name}`,
                                                description: `Superette \n Aucuns objets actuellement en vente dans cette boutique` 
                                            }
                                        }
                                        else {
                                            let items_pagined = pagination(current_shop.items, 15);
    
                                            item_page += 1;
    
                                            if (item_page > (current_shop.items.length - 1)) {
                                                item_page = 0;
                                            }
    
                                            items_pagined = items_pagined[item_page];
                    
                                            let lesFields = [];
                                            let options = [];
                    
                                            for (let i = 0; i < items_pagined.length; i ++) {
                                                let current_item = items_pagined[i];
                    
                                                lesFields.push(
                                                    {
                                                        'name': `${current_item.name}`,
                                                        'value': `${current_item.price} $`
                                                    }
                                                );

                                                options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                            }

                                            select = new ActionRowBuilder()
                                                .addComponents(new StringSelectMenuBuilder({
                                                    custom_id: 'select-item',
                                                    placeholder: 'Selectionnez un objet',
                                                    options: options
                                                }));
                    
                                            if (items_pagined.length === 1) {
                                                shopEmbed = {
                                                    title: `${current_shop.name}`,
                                                    description: 'Superette',
                                                    fields: lesFields
                                                }
                                            }
                                            else {
                                                shopEmbed = {
                                                    title: `${firstShop.name}`,
                                                    description: `Superette | Objets page ${(item_page + 1)}`,
                                                    fields: lesFields
                                                }
                                            }
                                        }
                                    }

                                    let collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect });

                                    let author = interaction.member;
                                    let current_player = miami_rp.players.filter(p => p.userID === author.id)[0];

                                    current_player = handleUndefined(current_player);
                            
                                    collector.on('collect', async interaction => {
                                        let choice = interaction.values[0];
                                        if (author.id != interaction.member.id) {
                                            await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                                        }
                                        else if (current_player == undefined) {
                                            await interaction.reply({ content: "Vous ne pouvez pas acheter ceci car vous n'avez pas de personnage RP", ephemeral: true });
                                        }
                                        else {
                                            let itemName = "";
                                            let itemPrice = 0;
                                            let itemID = "";

                                            for (let option of options) {
                                                if (option.value === choice) {
                                                    itemName = option.label;
                                                    itemPrice = parseInt(option.description.substring(0, (option.description.indexOf("$") - 1)));
                                                    itemID = option.value;
                                                }
                                            }

                                            if (itemPrice > current_player.argent) {
                                                await interaction.reply({ content: `Vous n'avez pas assez d'argent pour acheter cet objet, il vous manque \`${current_player.argent - itemPrice}\` $`, ephemeral: true });
                                            }
                                            else {
                                                current_player.argent -= itemPrice;

                                                let indexOfItem = handleExistantItemInInventory(current_player.inventory, itemName);
                                            
                                                if (indexOfItem != -1) {
                                                    current_player.inventory[indexOfItem].stock += 1;
                                                }
                                                else {
                                                    current_player.inventory.push({ "name": itemName, "stock": 1 });
                                                }

                                                writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                                                await interaction.reply({ content: `L'objet \`${itemName}\` a bien été acheté; il vous reste \`${current_player.argent}\` $`, ephemeral: true });
                                            }
                                        }
                                    });

                                    if (select === 0) {
                                        await interaction.update({ embeds: [shopEmbed] });
                                    }
                                    else {
                                        await interaction.update({ embeds: [shopEmbed], components: [buttons, select] });
                                    }
                                }
                                else if (customID === "next_shop") {
                                    i -= 1;
                                    if (i < 0) {
                                        i = max;
                                    }

                                    let nextShopEmbed = {};
                                    let currentShop = miami_rp.shops[i];
                                    let newButtonRule = "";

                                    if (currentShop.type != "superette") {
                                        if (currentShop.items.length === 0) {
                                            nextShopEmbed = {
                                                title: `${currentShop.name}`,
                                                description: `Boutique de ${currentShop.type} \n Aucuns objets actuellement en vente dans cette boutique`
                                            }

                                            select = new ActionRowBuilder()
                                                .addComponents(new StringSelectMenuBuilder({
                                                    custom_id: 'select-item',
                                                    placeholder: 'Selectionnez un objet',
                                                    options: [{ label: 'choice1', description: 'choice', value: 'choice1' }],
                                                    disabled: true
                                                }));
                                        }
                                        else {
                                            let items_pagined = pagination(currentShop.items, 15);
                    
                                            let lesFields = [];
                                            let options = [];
                    
                                            for (let i = 0; i < currentShop.items.length; i ++) {
                                                let current_item = currentShop.items[i];
                    
                                                lesFields.push(
                                                    {
                                                        'name': `${current_item.name}`,
                                                        'value': `${current_item.price} $`
                                                    }
                                                );

                                                options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                            }

                                            select = new ActionRowBuilder()
                                                .addComponents(new StringSelectMenuBuilder({
                                                    custom_id: 'select-item',
                                                    placeholder: 'Selectionnez un objet',
                                                    options: options
                                                }));
                    
                                            if (items_pagined.length === 1) {
                                                newButtonRule = "sans items";
                                                nextShopEmbed = {
                                                    title: `${currentShop.name}`,
                                                    description: `Boutique de ${currentShop.type}`,
                                                    fields: lesFields
                                                }
                                            }
                                            else {
                                                newButtonRule = "avec items";
                                                nextShopEmbed = {
                                                    title: `${currentShop.name}`,
                                                    description: `Boutique de ${currentShop.type} | Objets page 1`,
                                                    fields: lesFields
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (currentShop.items.length === 0) {
                                            nextShopEmbed = {
                                                title: `${currentShop.name}`,
                                                description: `Superette \n Aucuns objets actuellement en vente dans cette boutique`
                                            }

                                            select = new ActionRowBuilder()
                                                .addComponents(new StringSelectMenuBuilder({
                                                    custom_id: 'select-item',
                                                    placeholder: 'Selectionnez un objet',
                                                    options: [{ label: 'choice1', description: 'choice', value: 'choice1' }],
                                                    disabled: true
                                                }));
                                        }
                                        else {
                                            let items_pagined = pagination(currentShop.items, 15);
                    
                                            let lesFields = [];
                                            let options = [];
                    
                                            for (let i = 0; i < currentShop.items.length; i ++) {
                                                let current_item = currentShop.items[i];
                    
                                                lesFields.push(
                                                    {
                                                        'name': `${current_item.name}`,
                                                        'value': `${current_item.price} $`
                                                    }
                                                );

                                                options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                                            }
                    
                                            select = new ActionRowBuilder()
                                                .addComponents(new StringSelectMenuBuilder({
                                                    custom_id: 'select-item',
                                                    placeholder: 'Selectionnez un objet',
                                                    options: options
                                                }));

                                            nextShopEmbed = {
                                                title: `${currentShop.name}`,
                                                description: 'Superette',
                                                fields: lesFields
                                            }
                    
                                            if (items_pagined.length === 1) {
                                                newButtonRule = "sans items";
                                                nextShopEmbed = {
                                                    title: `${currentShop.name}`,
                                                    description: 'Superette',
                                                    fields: lesFields
                                                }
                                            }
                                            else {
                                                newButtonRule = "avec items";
                                                nextShopEmbed = {
                                                    title: `${currentShop.name}`,
                                                    description: 'Superette | Objets page 1',
                                                    fields: lesFields
                                                }
                                            }
                                        }
                                    }

                                    lastEmbed = nextShopEmbed;

                                    let collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect });

                                    let author = interaction.member;
                                    let current_player = miami_rp.players.filter(p => p.userID === author.id)[0];

                                    current_player = handleUndefined(current_player);
                            
                                    collector.on('collect', async interaction => {
                                        let choice = interaction.values[0];
                                        if (author.id != interaction.member.id) {
                                            await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                                        }
                                        else if (current_player == undefined) {
                                            await interaction.reply({ content: "Vous ne pouvez pas acheter ceci car vous n'avez pas de personnage RP", ephemeral: true });
                                        }
                                        else {
                                            let itemName = "";
                                            let itemPrice = 0;
                                            let itemID = "";

                                            for (let option of options) {
                                                if (option.value === choice) {
                                                    itemName = option.label;
                                                    itemPrice = parseInt(option.description.substring(0, (option.description.indexOf("$") - 1)));
                                                    itemID = option.value;
                                                }
                                            }

                                            if (itemPrice > current_player.argent) {
                                                await interaction.reply({ content: `Vous n'avez pas assez d'argent pour acheter cet objet, il vous manque \`${current_player.argent - itemPrice}\` $`, ephemeral: true });
                                            }
                                            else {
                                                current_player.argent -= itemPrice;

                                                let indexOfItem = handleExistantItemInInventory(current_player.inventory, itemName);
                                            
                                                if (indexOfItem != -1) {
                                                    current_player.inventory[indexOfItem].stock += 1;
                                                }
                                                else {
                                                    current_player.inventory.push({ "name": itemName, "stock": 1 });
                                                }

                                                writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                                                await interaction.reply({ content: `L'objet \`${itemName}\` a bien été acheté; il vous reste \`${current_player.argent}\` $`, ephemeral: true });
                                            }
                                        }
                                    });

                                    if (buttonRule != newButtonRule) {
                                        let newButtons = new ActionRowBuilder();

                                        if (newButtonRule === "avec items") {
                                            newButtons.addComponents(
                                                new ButtonBuilder({ 
                                                    custom_id: 'previous_shop',
                                                    label: 'Boutique précédente',
                                                    style: ButtonStyle.Primary,
                                                    emoji: '◀️'
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'previous_item',
                                                    label: 'Objet précédent',
                                                    style: ButtonStyle.Secondary,
                                                    emoji: '◀️'
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'next_item',
                                                    label: 'Objet suivant',
                                                    style: ButtonStyle.Secondary,
                                                    emoji: '▶️'
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'next_shop',
                                                    label: 'Boutique suivante',
                                                    style: ButtonStyle.Primary,
                                                    emoji: '▶️'
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'stop',
                                                    label: 'Achats terminés',
                                                    style: ButtonStyle.Danger,
                                                    emoji: '🛒'
                                                })
                                            );
                                        }
                                        else {
                                            newButtons.addComponents(
                                                new ButtonBuilder({
                                                    custom_id: 'previous_shop',
                                                    label: 'Boutique précédente',
                                                    style: ButtonStyle.Primary,
                                                    emoji: '◀️'
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'next_shop',
                                                    label: 'Boutique suivante',
                                                    style: ButtonStyle.Primary,
                                                    emoji: '▶️'
                                                }),
                                                new ButtonBuilder({
                                                    custom_id: 'stop',
                                                    label: 'Achats terminés',
                                                    style: ButtonStyle.Danger,
                                                    emoji: '🛒'
                                                })
                                            );
                                        }

                                        if (select === 0) {
                                            await interaction.update({ embeds: [nextShopEmbed], components: [newButtons] });
                                        }
                                        else {
                                            await interaction.update({ embeds: [nextShopEmbed], components: [newButtons, select] });
                                        }
                                    }
                                    else {
                                        if (select === 0) {
                                            await interaction.update({ embeds: [nextShopEmbed] });
                                        }
                                        else {
                                            await interaction.update({ embeds: [nextShopEmbed], components: [buttons, select] });
                                        }
                                    }
                                }
                                else if (customID === "stop") {
                                    let currentShop = miami_rp.shops[i];

                                    let updatedButtons = new ActionRowBuilder();
                                    
                                    select = 0;

                                    if (currentShop.items.length > 15) {
                                        updatedButtons.addComponents(
                                            new ButtonBuilder({
                                                custom_id: 'previous_shop',
                                                label: 'Boutique précédente',
                                                style: ButtonStyle.Primary,
                                                emoji: '◀️',
                                                disabled: true
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'previous_item',
                                                label: 'Objet précédent',
                                                style: ButtonStyle.Secondary,
                                                emoji: '◀️',
                                                disabled: true
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'next_item',
                                                label: 'Objet suivant',
                                                style: ButtonStyle.Secondary,
                                                emoji: '▶️',
                                                disabled: true
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'next_shop',
                                                label: 'Boutique suivante',
                                                style: ButtonStyle.Primary,
                                                emoji: '▶️',
                                                disabled: true
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'stop',
                                                label: 'Achats terminés',
                                                style: ButtonStyle.Danger,
                                                emoji: '🛒',
                                                disabled: true
                                            })
                                        );

                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: [{ label: 'choice1', description: 'choice1', value: 'choice1' }],
                                                disabled: true
                                            }));
                                    }
                                    else {
                                        updatedButtons.addComponents(
                                            new ButtonBuilder({
                                                custom_id: 'previous_shop',
                                                label: 'Boutique précédente',
                                                style: ButtonStyle.Primary,
                                                emoji: '◀️',
                                                disabled: true
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'next_shop',
                                                label: 'Boutique suivante',
                                                style: ButtonStyle.Primary,
                                                emoji: '▶️',
                                                disabled: true
                                            }),
                                            new ButtonBuilder({
                                                custom_id: 'stop',
                                                label: 'Achats terminés',
                                                style: ButtonStyle.Danger,
                                                emoji: '🛒',
                                                disabled: true
                                            })
                                        );

                                        select = new ActionRowBuilder()
                                            .addComponents(new StringSelectMenuBuilder({
                                                custom_id: 'select-item',
                                                placeholder: 'Selectionnez un objet',
                                                options: [{ label: 'choice1', description: 'choice1', value: 'choice1' }],
                                                disabled: true
                                            }));
                                        }

                                    collector.stop("Fin d'interaction");

                                    if (select === 0) {
                                        await interaction.update({ embeds: [lastEmbed], components: [updatedButtons] });
                                    }
                                    else {
                                        await interaction.update({ embeds: [lastEmbed], components: [updatedButtons, select] });
                                    }
                                }
                            }
                        });

                    let options = [];
                    let current_shop = miami_rp.shops[0];
    
                    for (let i = 0; i < current_shop.items.length; i ++) {
                        let current_item = current_shop.items[i];
                        options.push({ label: `${current_item.name}`, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                    }
    
                    select = new ActionRowBuilder()
                        .addComponents(new StringSelectMenuBuilder({
                            custom_id: 'select-item',
                            placeholder: 'Selectionnez un objet',
                            options: options
                        }));

                    collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect });
                    
                    let current_player = miami_rp.players.filter(p => p.userID === author.id)[0];

                    current_player = handleUndefined(current_player);
            
                    collector.on('collect', async interaction => {
                        let choice = interaction.values[0];
                        if (author.id != interaction.member.id) {
                            await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                        }
                        else if (current_player == undefined) {
                            await interaction.reply({ content: "Vous ne pouvez pas acheter ceci car vous n'avez pas de personnage RP", ephemeral: true });
                        }
                        else {
                            let itemName = "";
                            let itemPrice = 0;
                            let itemID = "";

                            for (let option of options) {
                                if (option.value === choice) {
                                    itemName = option.label;
                                    itemPrice = parseInt(option.description.substring(0, (option.description.indexOf("$") - 1)));
                                    itemID = option.value;
                                }
                            }

                            if (itemPrice > current_player.argent) {
                                await interaction.reply({ content: `Vous n'avez pas assez d'argent pour acheter cet objet, il vous manque \`${current_player.argent - itemPrice}\` $`, ephemeral: true });
                            }
                            else {
                                current_player.argent -= itemPrice;

                                let indexOfItem = handleExistantItemInInventory(current_player.inventory, itemName);
                                            
                                if (indexOfItem != -1) {
                                    current_player.inventory[indexOfItem].stock += 1;
                                }
                                else {
                                    current_player.inventory.push({ "name": itemName, "stock": 1 });
                                }

                                writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                                await interaction.reply({ content: `L'objet \`${itemName}\` a bien été acheté; il vous reste \`${current_player.argent}\` $`, ephemeral: true });
                            }
                        }
                    });

                    await interaction.reply({ embeds: [shopEmbed], components: [buttons, select] });
                }
                else {
                    if (selectRule === "avec items" && buttonRule === "sans items") {
                        let currentShop = miami_rp.shops[0];
                    
                        let lesFields = [];
                        let options = [];

                        for (let i = 0; i < currentShop.items.length; i ++) {
                            let current_item = currentShop.items[i];

                            lesFields.push(
                                {
                                    'name': `${current_item.name}`,
                                    'value': `${current_item.price} $`
                                }
                            );

                            options.push({ label: current_item.name, description: `${current_item.price} $`, value: `${current_item.itemID}` });
                        }

                        let select = new ActionRowBuilder()
                            .addComponents(new StringSelectMenuBuilder({
                                custom_id: 'select-item',
                                placeholder: 'Selectionnez un objet',
                                options: options
                            }));

                        let author = interaction.member;
                        let current_player = miami_rp.players.filter(p => p.userID === author.id)[0];

                        const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect });
                            
                        collector.on('collect', async interaction => {
                            let choice = interaction.values[0];
                            if (author.id != interaction.member.id) {
                                await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                            }
                            else {
                                let itemName = "";
                                let itemPrice = 0;
                                let itemID = "";

                                for (let option of options) {
                                    if (option.value === choice) {
                                        itemName = option.label;
                                        itemPrice = parseInt(option.description.substring(0, (option.description.indexOf("$") - 1)));
                                        itemID = option.value;
                                    }
                                }

                                if (itemPrice > current_player.argent) {
                                    await interaction.reply({ content: `Vous n'avez pas assez d'argent pour acheter cet objet, il vous manque \`${current_player.argent - itemPrice}\` $`, ephemeral: true });
                                }
                                else {
                                    current_player.argent -= itemPrice;

                                    let indexOfItem = handleExistantItemInInventory(current_player.inventory, itemName);
                                        
                                    if (indexOfItem != -1) {
                                        current_player.inventory[indexOfItem].stock += 1;
                                    }
                                    else {
                                        current_player.inventory.push({ "name": itemName, "stock": 1 });
                                    }

                                    writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                                    await interaction.reply({ content: `L'objet \`${itemName}\` a bien été acheté; il vous reste \`${current_player.argent}\` $`, ephemeral: true });
                                }
                            }
                        });

                        let buttons = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder({
                                    custom_id: 'stop',
                                    label: 'Consultation terminée',
                                    style: ButtonStyle.Danger,
                                    emoji: '<:Unvalid:991360425281204265>',
                                })
                            );

                        author = interaction.member;

                        const buttonCollector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button });

                        buttonCollector.on('collect', async interaction => {
                            if (author.id != interaction.member.id) {
                                await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                            }
                            else {
                                if (interaction.customId === "stop") {
                                    let updatedSelect = new ActionRowBuilder()
                                    .addComponents(new StringSelectMenuBuilder({
                                        custom_id: 'select-item',
                                        placeholder: 'Selectionnez un objet',
                                        options: [ { 'label': 'default', 'value': 'value' } ],
                                        disabled: true
                                    }));

                                    let updatedButtons = new ActionRowBuilder()
                                        .addComponents(
                                            new ButtonBuilder({
                                                custom_id: 'stop',
                                                label: 'Consultation terminée',
                                                style: ButtonStyle.Danger,
                                                emoji: '<:Unvalid:991360425281204265>',
                                                disabled: true
                                            })
                                        );

                                    await interaction.update({ embeds: [shopEmbed], components: [updatedSelect, updatedButtons] });
                                }
                            }
                        });

                        await interaction.reply({ embeds: [shopEmbed], components: [select, buttons] });
                    }
                    else {
                        await interaction.reply({ embeds: [shopEmbed] });
                    }
                }
            }
            else {
                await interaction.reply("Aucunes boutiques n'a été crée");
            }
        }
        else if (subcommand === "delete") {
            let shop_name = interaction.options.getString("shop_name");

            let current_shop = miami_rp.shops.filter(s => s.name === shop_name)[0];

            current_shop = handleUndefined(current_shop);

            if (current_shop != undefined) {
                let shop_pos = findPosByName(miami_rp.shops, shop_name);

                miami_rp.shops.splice(shop_pos, 1);

                writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                await interaction.reply(`La boutique \`${shop_name}\` a bien été supprimée`);
            }
            else if (shop_name == undefined || shop_name == null || shop_name == "") {
                let firstShop = miami_rp.shops[0];

                let shopEmbed = {};

                if (firstShop.type != "superette") {
                    if (firstShop.items.length === 0) {
                        shopEmbed = {
                            title: `${firstShop.name}`,
                            description: `Boutique de ${firstShop.type} \n Aucuns objets actuellement en vente dans cette boutique` 
                        }
                    }
                    else {
                        let items_pagined = pagination(firstShop.items, 15);

                        let lesFields = [];

                        for (let i = 0; i < firstShop.items.length; i ++) {
                            let current_item = firstShop.items[i];

                            lesFields.push(
                                {
                                    'name': `${current_item.name}`,
                                    'value': `${current_item.price} $`
                                }
                            );
                        }

                        if (items_pagined.length === 1) {
                            shopEmbed = {
                                title: `${firstShop.name}`,
                                description: `Boutique de ${firstShop.type}`,
                                fields: lesFields
                            }
                        }
                        else {
                            shopEmbed = {
                                title: `${firstShop.name}`,
                                description: `Boutique de ${firstShop.type} | Objets page 1`,
                                fields: lesFields
                            }
                        }
                    }
                }
                else {
                    if (firstShop.items.length === 0) {
                        shopEmbed = {
                            title: `${firstShop.name}`,
                            description: `Superette \n Aucuns objets actuellement en vente dans cette boutique`
                        }
                    }
                    else {
                        let items_pagined = pagination(firstShop.items, 15);

                        let lesFields = [];

                        for (let i = 0; i < firstShop.items.length; i ++) {
                            let current_item = firstShop.items[i];

                            lesFields.push(
                                {
                                    'name': `${current_item.name}`,
                                    'value': `${current_item.price} $`
                                }
                            );
                        }

                        shopEmbed = {
                            title: `${firstShop.name}`,
                            description: 'Superette',
                            fields: lesFields
                        }

                        if (items_pagined.length === 1) {
                            shopEmbed = {
                                title: `${firstShop.name}`,
                                description: 'Superette',
                                fields: lesFields
                            }
                        }
                        else {
                            shopEmbed = {
                                title: `${firstShop.name}`,
                                description: 'Superette | Objets page 1',
                                fields: lesFields
                            }
                        }
                    }
                }

                let buttons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder({
                            custom_id: 'previous_shop',
                            label: 'Boutique précédente',
                            style: ButtonStyle.Primary,
                            emoji: '◀️',
                        }),
                        new ButtonBuilder({
                            custom_id: 'next_shop',
                            label: 'Boutique suivante',
                            style: ButtonStyle.Primary,
                            emoji: '▶️',
                        }),
                        new ButtonBuilder({
                            custom_id: 'delete',
                            label: 'Supprimer la boutique',
                            style: ButtonStyle.Danger,
                            emoji: '🗑',
                        })
                    );

                const collector = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.Button });

                let author = interaction.member;

                let i = 0;
                let max = miami_rp.shops.length - 1;
                
                let lastEmbed = shopEmbed;

                collector.on('collect', async interaction => {
                    let customID = interaction.customId;

                    if (author.id != interaction.member.id) {
                        await interaction.reply({ content: "Vous ne pouvez pas intéragir avec un menu d'une autre personne", ephemeral: true });
                    }
                    else if (customID === "previous_shop") {
                        i -= 1;
                        if (i < 0) {
                            i = max;
                        }
                        
                        let previousShop = miami_rp.shops[i];

                        let previousShopEmbed = {};

                        if (previousShop.type != "superette") {
                            if (previousShop.items.length === 0) {
                                previousShopEmbed = {
                                    title: `${previousShop.name}`,
                                    description: `Boutique de ${previousShop.type} \n Aucuns objets actuellement en vente dans cette boutique` 
                                }
                            }
                            else {
                                let lesFields = [];

                                for (let i = 0; i < previousShop.items.length; i ++) {
                                    let current_item = previousShop.items[i];

                                    lesFields.push(
                                        {
                                            'name': `${current_item.name}`,
                                            'value': `${current_item.price} $`
                                        }
                                    );
                                }

                                previousShopEmbed = {
                                    title: `${previousShop.name}`,
                                    description: `Boutique de ${previousShop.type}`,
                                    fields: lesFields
                                }
                            }
                        }
                        else {
                            if (previousShop.items.length === 0) {
                                previousShopEmbed = {
                                    title: `${previousShop.name}`,
                                    description: `Superette \n Aucuns objets actuellement en vente dans cette boutique`
                                }
                            }
                            else {
                                let lesFields = [];

                                for (let i = 0; i < previousShop.items.length; i ++) {
                                    let current_item = previousShop.items[i];

                                    lesFields.push(
                                        {
                                            'name': `${current_item.name}`,
                                            'value': `${current_item.price} $`
                                        }
                                    );
                                }

                                previousShopEmbed = {
                                    title: `${previousShop.name}`,
                                    description: 'Superette',
                                    fields: lesFields
                                }
                            }
                        }

                        lastEmbed = previousShopEmbed;

                        await interaction.update({ embeds: [previousShopEmbed] });
                    }
                    else if (customID === "next_shop") {
                        i += 1;
                        if (i > max) {
                            i = 0;
                        }
                    
                        let nextShop = miami_rp.shops[i];

                        let nextShopEmbed = {};

                        if (nextShop.type != "superette") {
                            if (nextShop.items.length === 0) {
                                nextShopEmbed = {
                                    title: `${nextShop.name}`,
                                    description: `Boutique de ${nextShop.type} \n Aucuns objets actuellement en vente dans cette boutique` 
                                }
                            }
                            else {
                                let lesFields = [];

                                for (let i = 0; i < nextShop.items.length; i ++) {
                                    let current_item = nextShop.items[i];

                                    lesFields.push(
                                        {
                                            'name': `${current_item.name}`,
                                            'value': `${current_item.price} $`
                                        }
                                    );
                                }

                                nextShopEmbed = {
                                    title: `${nextShop.name}`,
                                    description: `Boutique de ${nextShop.type}`,
                                    fields: lesFields
                                }
                            }
                        }
                        else {
                            if (nextShop.items.length === 0) {
                                nextShopEmbed = {
                                    title: `${nextShop.name}`,
                                    description: `Superette \n Aucuns objets actuellement en vente dans cette boutique`
                                }
                            }
                            else {
                                let lesFields = [];

                                for (let i = 0; i < nextShop.items.length; i ++) {
                                    let current_item = nextShop.items[i];

                                    lesFields.push(
                                        {
                                            'name': `${current_item.name}`,
                                            'value': `${current_item.price} $`
                                        }
                                    );
                                }

                                nextShopEmbed = {
                                    title: `${nextShop.name}`,
                                    description: 'Superette',
                                    fields: lesFields
                                }
                            }
                        }

                        lastEmbed = nextShopEmbed;

                        await interaction.update({ embeds: [nextShopEmbed] });
                    }
                    else if (customID === "delete") {
                        let current_shop_name = miami_rp.shops[i].name;

                        miami_rp.shops.splice(i, 1);

                        writeFileSync(fichier, JSON.stringify(miami_rp, null, 2));

                        let updatedButtons = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder({
                                    custom_id: 'previous_shop',
                                    label: 'Boutique précédente',
                                    style: ButtonStyle.Primary,
                                    emoji: '◀️',
                                    disabled: true
                                }),
                                new ButtonBuilder({
                                    custom_id: 'next_shop',
                                    label: 'Boutique suivante',
                                    style: ButtonStyle.Primary,
                                    emoji: '▶️',
                                    disabled: true
                                }),
                                new ButtonBuilder({
                                    custom_id: 'delete',
                                    label: 'Supprimer la boutique',
                                    style: ButtonStyle.Danger,
                                    emoji: '🗑',
                                    disabled: true
                                })
                            );

                        await interaction.update({ embeds: [lastEmbed], components: [updatedButtons] });

                        await interaction.followUp(`La boutique \`${current_shop_name}\` a bien été supprimée`);
                    }
                });

                await interaction.reply({ embeds: [shopEmbed], components: [buttons] });
            }
            else {
                await interaction.reply(`Désolé mais aucunes boutiques ne porte le nom \`${shop_name}\`. Vous pouvez réessayer la commande sans préciser le nom de la boutique, cela va afficher toutes les boutiques existantes`);
            }
        }
    }
}