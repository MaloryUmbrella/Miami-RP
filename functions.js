module.exports = {
    hasIDCard (userID, miami_rp) {
        let IDfind = -1;
        let nb_players = miami_rp.players.length;
        let i = 0;
        let find = false;

        while ((!find) && (i < nb_players)) {
            if (miami_rp.players[i].userID === userID) {
                IDfind = miami_rp.players[i].userID;
                find = true;
            }
            else {
                i += 1;
            }
        }

        return IDfind
    },
    dateFormatCorrect (date) {
        let isCorrect = false;

        let date_splitted = date.split("/");

        if (date_splitted.length === 2) {
            isCorrect = true;
        }

        if (date.length === 10) {
            isCorrect = true;
        }
        else {
            isCorrect = false;
        }

        for (let i = 0; i < date_splitted.length; i ++) {
            if (date_splitted[i].length === 2 && i < 2) {
                isCorrect = true;
            }
            else if (date_splitted[i].length === 4 && i === 2) {
                isCorrect = true;
            }
            else {
                isCorrect = false;
            }
        }

        return isCorrect
    },
    lastShopID (shops) {
        if (shops === undefined) {
            return -1
        }
        else {
            if (shops.length === 0) {
                return 0
            }
            else {
                let shopID = 0;

                for (let i = 0; i < shops.length; i ++) {
                    shopID = shops[i].shopID;
                }

                return shopID
            }
        }
    },
    lastItemID (items) {
        if (items.length === undefined) {
            return -1;
        }
        else {
            if (items.lenght === 0) {
                return 0;
            }
            else {
                let itemID = 0;

                for (let i = 0; i < items.length; i ++) {
                    itemID = items[i].itemID;
                }

                return itemID
            }
        }
    },
    pagination(liste, espaces) {
        let count_espace = 0;
        let historiques = [];
        let sous_historique = [];
      
        for (let i = 0; i < liste.length; i++) {
            sous_liste = liste[i];
            sous_historique.push(sous_liste);
            count_espace += 1;
    
            if (count_espace % espaces === 0) {
                historiques.push(sous_historique);
                sous_historique = [];
            }
        }
    
        if (count_espace % espaces != 0) {
            historiques.push(sous_historique);
        }
    
        return historiques
    },
    findShopName(shops, shop_name) {
        let i = 0;
        let finded = false;

        while ((!finded) && (i < shops.length)) {
            if (shops[i].name === shop_name) {
                finded = true;
            }
            else {
                i += 1;
            }
        }

        return finded
    },
    findPosByName(liste, element_name) {
        let i = 0;
        let finded = false;
        let pos = -1;

        while ((!finded) && (i < liste.length)) {
            if (liste[i].name === element_name) {
                pos = i;
                finded = true;
            }
            else {
                i += 1;
            }
        }

        return pos
    },
    findCompanyName(companies, company_name) {
        let i = 0;
        let finded = false;

        while ((!finded) && (i < companies.length)) {
            if (companies[i].name === company_name) {
                finded = true;
            }
            else {
                i += 1;
            }
        }

        return finded
    },
    firstLetterToUpperCase(text) {
        let new_text = text[0].toUpperCase() + text.substring(1, text.lenght);
      
        return new_text
    },
    findElementPos(liste, element) {
        let i = 0;
        let finded = false;
        let pos = -1;

        while ((!finded) && (i < liste.length)) {
            if (liste[i] === element) {
                pos = i;
                finded = true;
            }
            else {
                i += 1;
            }
        }

        return pos
    },
    absolute(number) {
        if (number >= 0) {
            return number
        }
        else {
            return -number
        }
    },
    toPercent(refund, total) {
        return Math.round(((refund * 100) / total))
    },
    generateID (num) {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        const charactersLength = characters.length - 1;
        for (let i = 0; i < num; i++) {
          result += characters[Math.floor(Math.random() * charactersLength)];
        }
      
        return result;
    },
    handleMuchAccount(amount, refund, total) {
        if ((amount + refund) > total) {
          return (amount + refund) - total
        }
        else {
          return 0
        }
    },
    handleExistantItemInInventory(inventory, itemName) {
        let finded = false;
        let i = 0;
        let pos = -1;
    
        while ((!finded) && (i < inventory.length)) {
            if (inventory[i].name === itemName) {
                pos = i;
                finded = true;
            }
            else {
                i += 1;
            }
        }
    
        return pos;
    },
    countLicenses(licenses, license_type) {
        let license_count = licenses.length;
        let license_type_check = licenses.filter((license) => license.type === license_type)[0];
      
        return license_count === 4 || license_type_check != undefined
    },
    handleUndefined(data) {
        if (data != undefined && data != null && data != "") {
            return data
        }
        else {
            return undefined
        }
    },
    splitByNumber(num) {
        let values = [];
      
        if (num <= 10) {
            values.push(1);
            values.push(num);
        } 
        else {
            if (num <= 1000) {
                for (let i = 1; i < 5; i++) {
                    if (i != 3) {
                        values.push(Math.round(num / i));
                    }
                }
            
                values.push(10);
            } 
            else {
                for (let i = 1; i < 11; i++) {
                    if (i != 3 && i != 6 && i != 7 && i != 9) {
                        values.push(Math.round(num / i));
                    }
                }
      
                values.push(50);
            }
        }
      
        return values;
    },
    pagination(liste, espaces) {
        let count_espace = 0;
        let historiques = [];
        let sous_historique = [];
      
        for (let i = 0; i < liste.length; i++) {
            sous_liste = liste[i];
            sous_historique.push(sous_liste);
            count_espace += 1;
    
            if (count_espace % espaces === 0) {
                historiques.push(sous_historique);
                sous_historique = [];
            }
        }
    
        if (count_espace % espaces != 0) {
            historiques.push(sous_historique);
        }
    
        return historiques
    }
}