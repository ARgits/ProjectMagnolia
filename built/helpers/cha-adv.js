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
        const startingData = {
            isReady: duplicate(this.object.data.data.isReady),
            attributes: duplicate(this.object.data.data.attributes),
            skills: duplicate(this.object.data.data.skills),
            xp: duplicate(this.object.data.data.advancement.xp),
            profs: duplicate(this.object.data.data.proficiencies),
            health: duplicate(this.object.data.data.health),
            races: { list: await this.getRacesList(), chosen: null },
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
                learned: [],
                awail: [], // array of feats that are available to learn
            },
            allow: {
                attribute: false,
                race: false,
                final: false,
            },
            hover: {
                attribute: "",
                skill: "",
                race: "",
                feat: "",
            },
        };
        startingData.xp.get = startingData.isReady || startingData.xp.used !== 0 ? startingData.xp.get : 10000;
        const pack_list = (await this.getPacks()).pack_list;
        const pack_name = (await this.getPacks()).pack_name;
        const folder_list = this.getFolders().folder_list;
        const folder_name = this.getFolders().folder_name;
        /*
         * Create final list of features
         */
        let feat_pack_list = pack_list.filter((item) => {
            return item.type === "feature";
        });
        let feat_folder_list = folder_list.filter((item) => {
            return item.type === "feature";
        });
        let temp_feat_list = feat_pack_list.concat(feat_folder_list.filter((item) => !pack_name.includes(item.name)));
        let arr = pack_list.map((item) => {
            if (item.type === "feature")
                return item;
        });
        startingData.feats.learned = this.object.itemTypes.feature.map((item) => item.data);
        let name_array = [];
        for (let i of startingData.feats.learned) {
            name_array.push(i.name);
        }
        temp_feat_list.forEach((v, k) => {
            if (name_array.includes(v.name)) {
                console.log("this item is already learned", temp_feat_list[k]);
                temp_feat_list[k].data = foundry.utils.deepClone(startingData.feats.learned.filter((item) => item.name === v.name)[0].data);
            }
        });
        temp_feat_list = temp_feat_list.filter((item) => {
            if (item.type === "feature")
                return !name_array.includes(item.name) || item.data.level.current !== item.data.level.max;
        });
        startingData.feats.awail = temp_feat_list;
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
    getFoldersAndPacks() {
        let packs = this.getPacks();
        let folders = this.getFolders();
        return { packs, folders };
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
                        if (doc instanceof ARd20Item && doc.data.type === "feature") {
                            let item = doc.toObject();
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
                        let item = feat.toObject();
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
    async getRacesList() {
        const pack_list = (await this.getPacks()).pack_list;
        const pack_name = (await this.getPacks()).pack_name;
        const folder_list = this.getFolders().folder_list;
        let race_pack_list = pack_list.filter((item) => item.type === "race");
        let race_folder_list = folder_list.filter((item) => item.type === "race");
        return race_pack_list.concat(race_folder_list.filter((item) => !pack_name.includes(item.name)));
    }
    async getData() {
        this.options.data = !this.form ? (await this.InitilizeData()) : this.options.data;
        const templateData = this.options.data;
        templateData.count.feats.all = 0;
        templateData.count.feats.all = Object.values(templateData.count.feats).reduce(function (a, b) {
            return a + b;
        }, 0);
        /*
         * Calculate attributes' modifiers and xp cost
         */
        for (let [k, v] of obj_entries(CONFIG.ARd20.Attributes)) {
            templateData.attributes[k].mod = Math.floor((templateData.attributes[k].value - 10) / 2);
            templateData.attributes[k].xp = CONFIG.ARd20.AbilXP[templateData.attributes[k].value - 5];
            templateData.attributes[k].isEq = templateData.attributes[k].value === this.object.data.data.attributes[k].value;
            templateData.attributes[k].isXP = templateData.xp.get < templateData.attributes[k].xp;
            let race_abil = templateData.races.list.filter((race) => race.chosen === true)?.[0]?.data.bonus.attributes[k].value ?? 0;
            templateData.attributes[k].final = templateData.isReady ? templateData.attributes[k].value : templateData.attributes[k].value + race_abil;
            templateData.attributes[k].mod = Math.floor((templateData.attributes[k].final - 10) / 2);
        }
        /*
         * Calculate skills' xp cost
         */
        for (let [k, v] of obj_entries(CONFIG.ARd20.Skills)) {
            templateData.skills[k].rankName = game.i18n.localize(CONFIG.ARd20.Rank[templateData.skills[k].level]) ?? templateData.skills[k].level;
            templateData.skills[k].xp = templateData.skills[k].level < 2 ? CONFIG.ARd20.SkillXP[templateData.skills[k].level][templateData.count.skills[templateData.skills[k].level + 1]] : false;
            templateData.skills[k].isEq = templateData.skills[k].level === this.object.data.data.skills[k].level;
            templateData.skills[k].isXP = templateData.xp.get < templateData.skills[k].xp || templateData.skills[k].level > 1;
        }
        for (let v of templateData.profs.weapon) {
            //@ts-expect-error
            v.value_hover = game.i18n.localize(CONFIG.ARd20.Rank[v.value]) ?? CONFIG.ARd20.Rank[v.value];
        }
        /*
         * Calculate features cost and their availattribute
         */
        for (let object of templateData.feats.awail) {
            if (object.type === "feature") {
                //@ts-expect-error
                let pass = [];
                let allCount = templateData.count.feats.all;
                let featCount = 0;
                object.data.source.value.forEach((val) => (featCount += templateData.count.feats[val]));
                for (let i = object.data.level.initial; i < object.data.level.max; i++) {
                    //@ts-expect-error
                    object.data.xp.AdvancedCost[i] = object.data.xp.basicCost[i] ? Math.ceil((object.data.xp.basicCost[i] * (1 + 0.01 * (allCount - featCount))) / 5) * 5 : 0;
                }
                //@ts-expect-error
                object.data.current_xp = object.data.level.xp[object.data.level.initial];
                //@ts-expect-error
                object.isEq = object.data.level.initial === object.data.level.current || object.data.level.initial === 0;
                //@ts-expect-error
                object.isXP = object.data.level.initial === object.data.level.max || object.data.level.xp[object.data.level.initial] > templateData.xp.get;
                for (let [key, r] of obj_entries(object.data.req.values)) {
                    switch (r.type) {
                        case "attribute": //check if character's attribute is equal or higher than value entered in feature requirements
                            //@ts-expect-error
                            r.pass.forEach((item, index) => (r.pass[index] = r.input[index] <= templateData.attributes[r.value].final));
                            break;
                        case "skill": //check if character's skill rank is equal or higher than value entered in feature requirements
                            //@ts-expect-error
                            r.pass.forEach((item, index) => (r.pass[index] = r.input[index] <= templateData.skills[r.value].rank));
                            break;
                        case "feat": //check if character has features (and their level is equal or higher) that listed in feature requirements
                            if (templateData.feats.awail.filter((item) => item.name === r.name)?.[0] !== undefined) {
                                //@ts-expect-error
                                r.pass.forEach((item, index) => (r.pass[index] = r.input[index] <= templateData.feats.awail.filter((item) => item.name === r.name)[0].data.level.initial));
                            }
                            else if (templateData.feats.learned.filter((item) => item.name === r.name)?.[0] !== undefined) {
                                //@ts-expect-error
                                r.pass = r.pass.forEach((item, index) => (r.pass[index] = r.input[index] <= templateData.feats.learned.filter((item) => item.name === r.name)[0].data.data.level.initial));
                            }
                            break;
                    }
                    pass.push(r.pass);
                    //@ts-expect-error
                    object.pass = [];
                    /*
                     * Check the custom logic in feature requirements. For example "Strength 15 OR Arcana Basic"
                     */
                    for (let i = 0; i <= object.data.level.initial; i++) {
                        if (i === object.data.level.max || pass.length === 0)
                            break;
                        let exp = object.data.req.logic[i];
                        //@ts-expect-error
                        let lev_array = exp.match(/\d*/g).filter((item) => item !== "");
                        let f = {};
                        //@ts-expect-error
                        lev_array.forEach((item, index) => {
                            exp = exp.replace(item, `c${item}`);
                            //@ts-expect-error
                            f["c" + item] = pass[item - 1][i];
                        });
                        //@ts-expect-error
                        let filter = filtrex.compileExpression(exp);
                        //@ts-expect-error
                        object.pass[i] = Boolean(filter(f));
                    }
                    //@ts-expect-error
                    object.isXP = object.pass[object.data.level.initial] || object.pass.length === 0 ? object.isXP : true;
                }
            }
        }
        /*
         * Calculate starting HP based on character's CON and race
         */
        for (let [key, race] of obj_entries(templateData.races.list)) {
            race.chosen = templateData.races.chosen === race._id ? true : false;
        }
        //@ts-expect-error
        const raceHP = templateData.races.chosen ? game.items?.get(templateData.races.chosen)?.data.data.health : 0;
        templateData.health.max = templateData.attributes.con.value + raceHP;
        // At character creation, check all conditions
        //@ts-expect-error
        if (!this.object.data.isReady) {
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
    //@ts-expect-error
    activateListeners(html) {
        super.activateListeners(html);
        html.find(".change").click(this._onChange.bind(this));
        html.find("td:not(.description)").hover(this._onHover.bind(this));
    }
    //@ts-expect-error
    _onChange(event) {
        const button = event.currentTarget;
        //@ts-expect-error
        const data = this.data;
        switch (button.dataset.type) {
            case "attribute":
                switch (button.dataset.action) {
                    case "plus":
                        data.attributes[button.dataset.key].value += 1;
                        data.xp.get -= data.attributes[button.dataset.key].xp;
                        data.xp.used += data.attributes[button.dataset.key].xp;
                        break;
                    case "minus":
                        data.attributes[button.dataset.key].value -= 1;
                        data.xp.get += CONFIG.ARd20.AbilXP[data.attributes[button.dataset.key].value - 5] ?? CONFIG.ARd20.AbilXP[data.attributes[button.dataset.key].value - 5];
                        data.xp.used -= CONFIG.ARd20.AbilXP[data.attributes[button.dataset.key].value - 5] ?? CONFIG.ARd20.AbilXP[data.attributes[button.dataset.key].value - 5];
                        break;
                }
                break;
            case "skill":
                switch (button.dataset.action) {
                    case "plus":
                        data.skills[button.dataset.key].rank += 1;
                        data.xp.get -= data.skills[button.dataset.key].xp;
                        data.xp.used += data.skills[button.dataset.key].xp;
                        //@ts-expect-error
                        this.data.count.skills[this.data.skills[button.dataset.key].rank] += 1;
                        break;
                    case "minus":
                        data.skills[button.dataset.key].rank -= 1;
                        //@ts-expect-error
                        this.data.count.skills[this.data.skills[button.dataset.key].rank + 1] -= 1;
                        //@ts-expect-error
                        data.xp.get += CONFIG.ARd20.SkillXP[data.skills[button.dataset.key].rank][this.data.count.skills[this.data.skills[button.dataset.key].rank + 1]];
                        //@ts-expect-error
                        data.xp.used -= CONFIG.ARd20.SkillXP[data.skills[button.dataset.key].rank][this.data.count.skills[this.data.skills[button.dataset.key].rank + 1]];
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
                        //@ts-expect-error
                        data.feats.awail[button.dataset.key].data.source.value.forEach((val) => (data.count.feats[val] += data.feats.awail[button.dataset.key].data.level.initial === 0 ? 1 : 0));
                        data.xp.get -= data.feats.awail[button.dataset.key].data.level.xp[data.feats.awail[button.dataset.key].data.level.initial];
                        data.xp.used += data.feats.awail[button.dataset.key].data.level.xp[data.feats.awail[button.dataset.key].data.level.initial];
                        data.feats.awail[button.dataset.key].data.level.initial += 1;
                        break;
                    case "minus":
                        data.feats.awail[button.dataset.key].data.level.initial -= 1;
                        //@ts-expect-error
                        data.feats.awail[button.dataset.key].data.source.value.forEach((val) => (data.count.feats[val] -= data.feats.awail[button.dataset.key].data.level.initial === 0 ? 1 : 0));
                        data.xp.get += data.feats.awail[button.dataset.key].data.level.xp[data.feats.awail[button.dataset.key].data.level.initial];
                        data.xp.used -= data.feats.awail[button.dataset.key].data.level.xp[data.feats.awail[button.dataset.key].data.level.initial];
                        break;
                }
                break;
        }
        this.render();
    }
    //@ts-expect-error
    _onChangeInput(event) {
        super._onChangeInput(event);
        const button = event.currentTarget.id;
        const k = event.currentTarget.dataset.key;
        //@ts-expect-error
        for (let [key, race] of obj_entries(this.data.races.list)) {
            //@ts-expect-error
            this.data.races.list[key].chosen = key === k ? true : false;
            //@ts-expect-error
            this.data.races.chosen = this.data.races.list[key].chosen ? race._id : this.data.races.chosen;
        }
        this.render();
    }
    //@ts-expect-error
    _onHover(event) {
        event.preventDefault();
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
        //@ts-expect-error
        tr.nextElementSibling?.querySelectorAll("td:not(.description)").forEach((td) => td.classList.toggle("under-chosen", event.type == "mouseenter"));
        //@ts-expect-error
        tr.previousElementSibling?.querySelectorAll("th:not(.description)").forEach((th) => th.classList.toggle("over-chosen", event.type == "mouseenter"));
        //@ts-expect-error
        tr.previousElementSibling?.querySelectorAll("td:not(.description)").forEach((td) => td.classList.toggle("over-chosen", event.type == "mouseenter"));
        const type = table.dataset.tab;
        if (type !== "feats")
            return;
        const key = tr.dataset.key;
        //@ts-expect-error
        const hover_desc = TextEditor.enrichHTML(this.data.feats.awail[key].data.description);
        //@ts-expect-error
        if (hover_desc === this.data.hover.feat)
            return;
        //@ts-expect-error
        this.data.hover.feat = hover_desc;
        this.render();
    }
    //@ts-expect-error
    async _updateObject(event, formData) {
        let updateData = expandObject(formData);
        const actor = this.object;
        this.render();
        const obj = {};
        //@ts-expect-error
        for (let [key, abil] of obj_entries(this.data.attributes)) {
            //@ts-expect-error
            obj[`data.attributes.${key}.value`] = this.data.attributes[key].final;
        }
        //@ts-expect-error
        obj["data.health.max"] = this.data.health.max;
        //@ts-expect-error
        if (this.data.isReady) {
            obj["data.attributes.xp"] = updateData.xp;
        }
        obj["data.skills"] = updateData.skills;
        obj["data.profs"] = updateData.profs;
        //@ts-expect-error
        obj["data.isReady"] = this.data.allow.final;
        console.log(obj);
        const feats_data = {
            new: [],
            exist: [],
        };
        //@ts-expect-error
        const feats = this.data.feats.awail.filter((item) => item.data.level.initial > item.data.level.current);
        for (let [k, v] of obj_entries(feats)) {
            //@ts-expect-error
            if (this.data.feats.learned.length > 0) {
                //@ts-expect-error
                for (let [n, m] of obj_entries(this.data.feats.learned)) {
                    if (v._id === m.id) {
                        //@ts-expect-error
                        feats_data.exist.push(v);
                    }
                    else {
                        //@ts-expect-error
                        feats_data.new.push(v);
                    }
                }
            }
            else {
                //@ts-expect-error
                feats_data.new.push(v);
            }
        }
        let pass = [];
        for (let [k, v] of obj_entries(feats_data.exist)) {
            //@ts-expect-error
            pass.push(v.pass.slice(0, v.pass.length - 1));
        }
        for (let [k, v] of obj_entries(feats_data.new)) {
            //@ts-expect-error
            pass.push(v.pass.slice(0, v.pass.length - 1));
        }
        pass = pass.flat();
        console.log(pass);
        //@ts-expect-error
        if (!this.data.isReady && !this.data.allow.final) {
            ui.notifications.error(`Something not ready for your character to be created. Check the list`);
        }
        else if (pass.includes(false)) {
            ui.notifications.error(`Some changes in your features do not comply with the requirements`);
        }
        else {
            await actor.update(obj);
            if (actor.itemTypes.race.length === 0) {
                //@ts-expect-error
                let race_list = this.data.races.list.filter((race) => race.chosen === true);
                await actor.createEmbeddedDocuments("Item", race_list);
            }
            if (feats_data.exist.length > 0) {
                await actor.updateEmbeddedDocuments("Item", feats_data.exist.map((item) => ({
                    //@ts-expect-error
                    _id: item._id,
                    //@ts-expect-error
                    "data.level.initial": item.data.level.initial,
                })));
            }
            if (feats_data.new.length > 0) {
                await actor.createEmbeddedDocuments("Item", feats_data.new);
            }
            this.close();
        }
    }
}
function arr_keys(temp_feat_list) {
    throw new Error("Function not implemented.");
}
