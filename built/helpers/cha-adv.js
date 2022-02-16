import { obj_entries } from "../ard20.js";
import { ARd20Item } from "../documents/item.js";
//@ts-expect-error
export class CharacterAdvancement extends FormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ard20"],
            title: "Character Advancement",
            template: "systems/ard20/templates/actor/parts/actor-adv.html",
            id: "actor-adv",
            width: 1000,
            height: "auto",
            tabs: [
                {
                    navSelector: ".sheet-tabs",
                    contentSelector: ".sheet-body",
                    initial: "stats",
                },
            ],
            closeOnSubmit: false,
        });
    }
    async InitilizeData() {
        if (this.form)
            return;
        const pack = await this.getPacks();
        const folder = this.getFolders();
        const rList = await this.getRacesList(pack, folder);
        const fList = await this.getFeaturesList(pack, folder);
        const actorData = this.object.data.data;
        const startingData = {
            isReady: duplicate(actorData.isReady),
            attributes: duplicate(actorData.attributes),
            skills: duplicate(actorData.skills),
            xp: duplicate(actorData.advancement.xp),
            profs: duplicate(actorData.proficiencies),
            health: duplicate(actorData.health),
            races: { list: rList, chosen: "" },
            count: {
                // counter for skills and feats
                skills: {
                    // count skills by their level
                    0: 0,
                    1: 0,
                    2: 0,
                    3: 0,
                    4: 0,
                },
                feats: {
                    // count feats by their source
                    mar: 0,
                    mag: 0,
                    div: 0,
                    pri: 0,
                    psy: 0,
                },
            },
            content: {
                // descriptions for skills and feats
                skills: {},
                feats: {},
            },
            feats: {
                learned: fList.learnedFeatures,
                awail: fList.temp_feat_list, // array of feats that are available to learn
            },
            allow: {
                attribute: actorData.isReady,
                race: actorData.isReady,
                final: actorData.isReady,
            },
            hover: {
                attribute: "",
                skill: "",
                race: "",
                feat: "",
            },
        };
        startingData.xp.get = startingData.isReady || startingData.xp.used !== 0 ? startingData.xp.get : 10000;
        let awailFeats = startingData.feats.awail;
        let name_array = [];
        for (let i of startingData.feats.learned) {
            name_array.push(i.name);
        }
        awailFeats.forEach((v, k) => {
            if (name_array.includes(v.name)) {
                console.log("this item is already learned", awailFeats[k]);
                awailFeats[k] = foundry.utils.deepClone(startingData.feats.learned.filter((item) => item.name === v.name)[0]);
            }
        });
        awailFeats = awailFeats.filter((item) => {
            if (item.type === "feature")
                return !name_array.includes(item.name) || item.data.level.current !== item.data.level.max;
        });
        startingData.feats.awail = awailFeats;
        // count skills by rank
        for (let [k, v] of obj_entries(CONFIG.ARd20.Skills)) {
            if (startingData.skills[k].level === 0) {
                startingData.count.skills[0] += 1;
            }
            else if (startingData.skills[k].level === 1) {
                startingData.count.skills[1] += 1;
            }
            else if (startingData.skills[k].level === 2) {
                startingData.count.skills[2] += 1;
            }
        }
        // count feats by source
        for (let v of startingData.feats.learned) {
            console.log(v);
            if (v.type === "feature")
                v.data.source.value.forEach((val) => {
                    console.log(val);
                    startingData.count.feats[val] += 1;
                });
        }
        startingData.hover.feat = TextEditor.enrichHTML(startingData.feats.awail[0]?.data.description);
        return startingData;
    }
    async getPacks() {
        let pack_list = []; // array of feats from Compendium
        let pack_name = [];
        for (const key of game.settings.get("ard20", "feat").packs) {
            if (game.packs.filter((pack) => pack.metadata.label === key).length !== 0) {
                let feat_list = [];
                feat_list.push(Array.from(game.packs.filter((pack) => pack.metadata.label === key && pack.documentName === "Item")[0].index));
                feat_list = feat_list.flat();
                for (const feat of feat_list) {
                    if (feat instanceof ARd20Item) {
                        const new_key = game.packs.filter((pack) => pack.metadata.label === key)[0].metadata.package + "." + key;
                        const doc = await game.packs.get(new_key).getDocument(feat.id);
                        if (doc instanceof ARd20Item) {
                            const item = doc.toObject();
                            item.data = foundry.utils.deepClone(doc.data.data);
                            pack_list.push(item);
                            pack_name.push(item.name);
                        }
                    }
                }
                pack_list = pack_list.flat();
            }
        }
        return {
            pack_list,
            pack_name,
        };
    }
    getFolders() {
        let folder_list = []; // array of feats from game folders
        let folder_name = [];
        for (let key of game.settings.get("ard20", "feat").folders) {
            if (game.folders.filter((folder) => folder.data.name === key).length !== 0) {
                let feat_list = [];
                feat_list.push(game.folders.filter((folder) => folder.data.name === key && folder.data.type === "Item")[0].contents);
                feat_list = feat_list.flat();
                for (let feat of feat_list) {
                    if (feat instanceof ARd20Item) {
                        console.log("item added from folder ", feat);
                        const item = feat.toObject();
                        item.data = foundry.utils.deepClone(feat.data.data);
                        folder_list.push(item);
                        folder_name.push(item.name);
                    }
                }
                folder_list = folder_list.flat();
            }
        }
        return {
            folder_list,
            folder_name,
        };
    }
    async getRacesList(pack, folder) {
        const pack_list = pack.pack_list;
        const pack_name = pack.pack_name;
        const folder_list = folder.folder_list;
        let race_pack_list = [];
        let race_folder_list = [];
        pack_list.forEach((item) => {
            if (item.type === "race") {
                let raceItem = { ...item, chosen: false };
                race_pack_list.push(raceItem);
            }
        });
        folder_list.forEach((item) => {
            if (item.type === "race") {
                let raceItem = { ...item, chosen: false };
                race_folder_list.push(raceItem);
            }
        });
        return race_pack_list.concat(race_folder_list.filter((item) => !pack_name.includes(item.name)));
    }
    async getFeaturesList(pack, folder) {
        const pack_list = pack.pack_list;
        const pack_name = pack.pack_name;
        const folder_list = folder.folder_list;
        let feat_pack_list = [];
        pack_list.forEach((item) => {
            if (item.type === "feature") {
                let FeatureItem = { ...item, currentXP: 0, isEq: false, isXP: false };
                feat_pack_list.push(FeatureItem);
            }
        });
        let feat_folder_list = [];
        folder_list.forEach((item) => {
            if (item.type === "feature") {
                let FeatureItem = { ...item, currentXP: 0, isEq: false, isXP: false };
                feat_folder_list.push(FeatureItem);
            }
        });
        let temp_feat_list = feat_pack_list.concat(feat_folder_list.filter((item) => !pack_name.includes(item.name)));
        let learnedFeatures = [];
        this.object.itemTypes.feature.forEach((item) => {
            if (item.data.type === "feature") {
                let FeatureItem = { ...item.data, currentXP: 0, isEq: false };
                learnedFeatures.push(FeatureItem);
            }
        });
        return { temp_feat_list, learnedFeatures };
    }
    async getData() {
        this.options.data = !this.form ? (await this.InitilizeData()) : this.options.data;
        const templateData = this.options.data;
        const count = templateData.count;
        const attributes = templateData.attributes;
        const xp = templateData.xp;
        const raceList = templateData.races.list;
        const raceChosen = templateData.races.chosen;
        const isReady = templateData.isReady;
        const skills = templateData.skills;
        const featsAwail = templateData.feats.awail;
        const featsLearned = templateData.feats.learned;
        const health = templateData.health;
        count.feats.all = 0;
        count.feats.all = Object.values(count.feats).reduce(function (a, b) {
            return a + b;
        }, 0);
        /*
         * Calculate attributes' modifiers and xp cost
         */
        for (let [k, v] of obj_entries(CONFIG.ARd20.Attributes)) {
            const race_abil = raceList.filter((race) => race.chosen === true)?.[0]?.data.bonus.attributes[k].value ?? 0;
            attributes[k].mod = Math.floor((attributes[k].value - 10) / 2);
            attributes[k].xp = CONFIG.ARd20.AbilXP[attributes[k].value - 5];
            attributes[k].isEq = attributes[k].value === this.object.data.data.attributes[k].value;
            attributes[k].isXP = xp.get < attributes[k].xp;
            attributes[k].total = isReady ? attributes[k].value : attributes[k].value + race_abil;
            attributes[k].mod = Math.floor((attributes[k].total - 10) / 2);
        }
        /*
         * Calculate skills' xp cost
         */
        for (let [k, v] of obj_entries(CONFIG.ARd20.Skills)) {
            templateData.skills[k].rankName =
                game.i18n.localize(CONFIG.ARd20.Rank[templateData.skills[k].level]) ?? CONFIG.ARd20.Rank[templateData.skills[k].level];
            templateData.skills[k].xp =
                templateData.skills[k].level < 2
                    ? CONFIG.ARd20.SkillXP[templateData.skills[k].level][templateData.count.skills[templateData.skills[k].level + 1]]
                    : false;
            templateData.skills[k].isEq = templateData.skills[k].level === this.object.data.data.skills[k].level;
            templateData.skills[k].isXP =
                templateData.xp.get < templateData.skills[k].xp || templateData.skills[k].level > 1;
        }
        for (let v of templateData.profs.weapon) {
            //@ts-expect-error
            v.value_hover = game.i18n.localize(CONFIG.ARd20.Rank[v.value]) ?? CONFIG.ARd20.Rank[v.value];
        }
        /*
         * Calculate features cost and their availattribute
         */
        featsAwail.forEach((object) => {
            if (object.type === "feature") {
                let pass = [];
                object.pass = [];
                let allCount = templateData.count.feats.all;
                let featCount = 0;
                object.data.source.value.forEach((val) => (featCount += templateData.count.feats[val]));
                for (let i = object.data.level.initial; i < object.data.level.max; i++) {
                    object.data.xp.AdvancedCost[i] = object.data.xp.basicCost[i]
                        ? Math.ceil((object.data.xp.basicCost[i] * (1 + 0.01 * (allCount - featCount))) / 5) * 5
                        : 0;
                }
                object.currentXP = object.data.xp.AdvancedCost[object.data.level.initial];
                object.isEq = object.data.level.initial === object.data.level.current || object.data.level.initial === 0;
                object.isXP =
                    object.data.level.initial === object.data.level.max ||
                        object.data.xp.AdvancedCost[object.data.level.initial] > templateData.xp.get;
                object.data.req.values.forEach((r, key) => {
                    switch (r.type) {
                        case "attribute": //check if character's attribute is equal or higher than value entered in feature requirements
                            //@ts-expect-error
                            r.pass.forEach((item, index) => (r.pass[index] = r.input[index] <= attributes[r.value].total));
                            break;
                        case "skill": //check if character's skill rank is equal or higher than value entered in feature requirements
                            //@ts-expect-error
                            r.pass.forEach((item, index) => (r.pass[index] = r.input <= skills[r.value].level));
                            break;
                        case "feat": //check if character has features (and their level is equal or higher) that listed in feature requirements
                            if (featsAwail.filter((item) => item.name === r.name)?.[0] !== undefined) {
                                const featLevel = featsAwail.filter((item) => item.name === r.name)[0].data.level.initial;
                                r.pass.forEach((item, index) => (r.pass[index] = r.input[index] <= featLevel));
                            }
                            else if (featsLearned.filter((item) => item.name === r.name)?.[0] !== undefined) {
                                const featLevel = featsLearned.filter((item) => item.name === r.name)[0].data.level.initial;
                                //@ts-expect-error
                                r.pass = r.pass.forEach((item, index) => (r.pass[index] = r.input[index] <= featLevel));
                            }
                            break;
                    }
                    pass.push(r.pass);
                    object.pass = [];
                    /*
                     * Check the custom logic in feature requirements. For example "Strength 15 OR Arcana Basic"
                     */
                    for (let i = 0; i <= object.data.level.initial; i++) {
                        if (i === object.data.level.max || pass.length === 0)
                            break;
                        let exp = object.data.req.logic[i];
                        let lev_array = exp.match(/\d*/g).filter((item) => item !== "");
                        console.log(lev_array);
                        let f = {};
                        lev_array.forEach((item) => {
                            exp = exp.replace(item, `c${item}`);
                            f["c" + item] = pass[parseInt(item) - 1][i];
                        });
                        //@ts-expect-error
                        let filter = filtrex.compileExpression(exp);
                        object.pass[i] = Boolean(filter(f));
                    }
                    object.isXP = object.pass[object.data.level.initial] || object.pass.length === 0 ? object.isXP : true;
                });
            }
        });
        /*
         * Calculate starting HP based on character's CON and race
         */
        raceList.forEach((race) => {
            race.chosen = raceChosen === race._id ? true : false;
        });
        let raceHP = 0;
        raceList.forEach((race) => {
            if (race._id === raceChosen) {
                raceHP = race.data.health;
            }
        });
        health.max = attributes.con.value + raceHP;
        // At character creation, check all conditions
        if (!this.object.data.data.isReady) {
            let abil_sum = 0;
            for (let [key, abil] of obj_entries(templateData.attributes)) {
                abil_sum += abil.value;
            }
            templateData.allow.attribute = abil_sum >= 60 && abil_sum <= 80 ? true : false;
            templateData.allow.race = Boolean(templateData.races.chosen) ? true : false;
            let allow_list = [];
            for (let [key, item] of obj_entries(templateData.allow)) {
                if (key === "final") {
                    continue;
                }
                allow_list.push(item);
            }
            templateData.allow.final = !allow_list.includes(false) || templateData.isReady ? true : false;
        }
        /*
         * Final Template Data
         */
        console.log(this.form);
        console.log(templateData);
        return templateData;
    }
    activateListeners(html) {
        super.activateListeners(html);
        html.find(".change").on("click", this._onChange.bind(this));
        html.find("td:not(.description)").on("mouseover", this._onHover.bind(this));
    }
    //@ts-expect-error
    _onChange(event) {
        const button = event.currentTarget;
        const data = this.options.data;
        switch (button.dataset.type) {
            case "attribute":
                switch (button.dataset.action) {
                    case "plus":
                        //@ts-expect-error
                        data.attributes[button.dataset.key].value += 1;
                        //@ts-expect-error
                        data.xp.get -= data.attributes[button.dataset.key].xp;
                        //@ts-expect-error
                        data.xp.used += data.attributes[button.dataset.key].xp;
                        break;
                    case "minus":
                        //@ts-expect-error
                        data.attributes[button.dataset.key].value -= 1;
                        data.xp.get +=
                            //@ts-expect-error
                            CONFIG.ARd20.AbilXP[data.attributes[button.dataset.key].value - 5] ??
                                //@ts-expect-error
                                CONFIG.ARd20.AbilXP[data.attributes[button.dataset.key].value - 5];
                        data.xp.used -=
                            //@ts-expect-error
                            CONFIG.ARd20.AbilXP[data.attributes[button.dataset.key].value - 5] ??
                                //@ts-expect-error
                                CONFIG.ARd20.AbilXP[data.attributes[button.dataset.key].value - 5];
                        break;
                }
                break;
            case "skill":
                switch (button.dataset.action) {
                    case "plus":
                        //@ts-expect-error
                        data.skills[button.dataset.key].level += 1;
                        //@ts-expect-error
                        data.xp.get -= data.skills[button.dataset.key].xp;
                        //@ts-expect-error
                        data.xp.used += data.skills[button.dataset.key].xp;
                        //@ts-expect-error
                        data.count.skills[data.skills[button.dataset.key].level] += 1;
                        break;
                    case "minus":
                        //@ts-expect-error
                        data.skills[button.dataset.key].level -= 1;
                        //@ts-expect-error
                        data.count.skills[data.skills[button.dataset.key].level + 1] -= 1;
                        data.xp.get +=
                            //@ts-expect-error
                            CONFIG.ARd20.SkillXP[data.skills[button.dataset.key].level][
                            //@ts-expect-error
                            data.count.skills[data.skills[button.dataset.key].level + 1]];
                        data.xp.used -=
                            //@ts-expect-error
                            CONFIG.ARd20.SkillXP[data.skills[button.dataset.key].level][
                            //@ts-expect-error
                            data.count.skills[data.skills[button.dataset.key].level + 1]];
                        break;
                }
                break;
            case "prof":
                switch (button.dataset.action) {
                    case "plus":
                        data.profs.weapon[button.dataset.key].value += 1;
                        data.count.feats.mar += 1;
                        break;
                    case "minus":
                        data.profs.weapon[button.dataset.key].value -= 1;
                        data.count.feats.mar -= 1;
                        break;
                }
                break;
            case "feat":
                switch (button.dataset.action) {
                    case "plus":
                        data.feats.awail[button.dataset.key].data.source.value.forEach((val) => (data.count.feats[val] += data.feats.awail[button.dataset.key].data.level.initial === 0 ? 1 : 0));
                        data.xp.get -=
                            data.feats.awail[button.dataset.key].data.xp.AdvancedCost[data.feats.awail[button.dataset.key].data.level.initial];
                        data.xp.used +=
                            data.feats.awail[button.dataset.key].data.xp.AdvancedCost[data.feats.awail[button.dataset.key].data.level.initial];
                        data.feats.awail[button.dataset.key].data.level.initial += 1;
                        break;
                    case "minus":
                        data.feats.awail[button.dataset.key].data.level.initial -= 1;
                        data.feats.awail[button.dataset.key].data.source.value.forEach((val) => (data.count.feats[val] -= data.feats.awail[button.dataset.key].data.level.initial === 0 ? 1 : 0));
                        data.xp.get +=
                            data.feats.awail[button.dataset.key].data.xp.AdvancedCost[data.feats.awail[button.dataset.key].data.level.initial];
                        data.xp.used -=
                            data.feats.awail[button.dataset.key].data.xp.AdvancedCost[data.feats.awail[button.dataset.key].data.level.initial];
                        break;
                }
                break;
        }
        this.render();
    }
    //@ts-expect-error
    _onChangeInput(event) {
        super._onChangeInput(event);
        const data = this.options.data;
        const k = parseInt(event.currentTarget.dataset.key);
        data.races.list.forEach((race, key) => {
            data.races.list[key].chosen = key === k ? true : false;
            data.races.chosen = data.races.list[key].chosen ? race._id : data.races.chosen;
        });
        this.render();
    }
    //@ts-expect-error
    _onHover(event) {
        event.preventDefault();
        const data = this.options.data;
        const element = event.currentTarget;
        const table = element.closest("div.tab");
        const tr = element.closest("tr");
        const trDOM = tr.querySelectorAll("td:not(.description)");
        const tdDesc = table.querySelector("td.description");
        const bColor = window.getComputedStyle(element).getPropertyValue("background-color");
        tdDesc.style["background-color"] = bColor;
        //@ts-expect-error
        trDOM?.forEach((td) => {
            td.classList.toggle("chosen", event.type == "mouseenter");
            if (td.nextElementSibling === null || td.nextElementSibling.classList[0] === "description") {
                td.classList.toggle("last", event.type == "mouseenter");
            }
        });
        tr.nextElementSibling
            ?.querySelectorAll("td:not(.description)")
            //@ts-expect-error
            .forEach((td) => td.classList.toggle("under-chosen", event.type == "mouseenter"));
        tr.previousElementSibling
            ?.querySelectorAll("th:not(.description)")
            //@ts-expect-error
            .forEach((th) => th.classList.toggle("over-chosen", event.type == "mouseenter"));
        tr.previousElementSibling
            ?.querySelectorAll("td:not(.description)")
            //@ts-expect-error
            .forEach((td) => td.classList.toggle("over-chosen", event.type == "mouseenter"));
        const type = table.dataset.tab;
        if (type !== "feats")
            return;
        const key = tr.dataset.key;
        const hover_desc = TextEditor.enrichHTML(data.feats.awail[key].data.description);
        if (hover_desc === data.hover.feat)
            return;
        data.hover.feat = hover_desc;
        this.render();
    }
    async _updateObject(event, formData) {
        let updateData = expandObject(formData);
        const actor = this.object;
        const data = this.options.data;
        this.render();
        const obj = {};
        for (let [key, abil] of obj_entries(data.attributes)) {
            obj[`data.attributes.${key}.value`] = data.attributes[key].total;
        }
        obj["data.health.max"] = data.health.max;
        if (data.isReady) {
            obj["data.advancement.xp"] = updateData.xp;
        }
        obj["data.skills"] = updateData.skills;
        obj["data.profs"] = updateData.profs;
        obj["data.isReady"] = data.allow.final;
        console.log(obj);
        const feats_data = {
            new: [],
            exist: [],
        };
        const feats = data.feats.awail.filter((item) => item.data.level.initial > item.data.level.current);
        feats.forEach((awItem, index) => {
            if (data.feats.learned.length > 0) {
                data.feats.learned.forEach((learnedItem, index) => {
                    if (awItem._id === learnedItem._id) {
                        feats_data.exist.push(awItem);
                    }
                    else {
                        feats_data.new.push(awItem);
                    }
                });
            }
            else {
                feats_data.new.push(awItem);
            }
        });
        let pass = [];
        feats_data.exist.forEach((item) => {
            //@ts-expect-error
            pass.push(item.pass.slice(0, item.pass.length - 1));
        });
        feats_data.new.forEach((item) => {
            //@ts-expect-error
            pass.push(item.pass.slice(0, item.pass.length - 1));
        });
        pass = pass.flat();
        console.log(pass);
        if (!data.isReady && !data.allow.final) {
            ui.notifications.error(`Something not ready for your character to be created. Check the list`);
        }
        else if (pass.includes(false)) {
            ui.notifications.error(`Some changes in your features do not comply with the requirements`);
        }
        else {
            await actor.update(obj);
            if (actor.itemTypes.race.length === 0) {
                let race_list = this.options.data.races.list.filter((race) => race.chosen === true);
                //@ts-expect-error
                await actor.createEmbeddedDocuments("Item", race_list);
            }
            if (feats_data.exist.length > 0) {
                await actor.updateEmbeddedDocuments("Item", feats_data.exist.map((item) => ({
                    _id: item._id,
                    "data.level.initial": item.data.level.initial,
                })));
            }
            if (feats_data.new.length > 0) {
                //@ts-expect-error
                await actor.createEmbeddedDocuments("Item", feats_data.new);
            }
            this.close();
        }
    }
}
