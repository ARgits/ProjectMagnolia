import { obj_entries } from "../ard20.js";
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
    //@ts-expect-error
    async getData() {
        //@ts-expect-error
        if (!this.data) {
            //@ts-expect-error
            this.data = {
                //@ts-expect-error
                isReady: duplicate(this.object.data.data.isReady),
                //@ts-expect-error
                attributes: duplicate(this.object.data.data.attributes),
                //@ts-expect-error
                skills: duplicate(this.object.data.data.skills),
                //@ts-expect-error
                xp: duplicate(this.object.data.data.advancement.xp),
                //@ts-expect-error
                profs: duplicate(this.object.data.data.proficiencies),
                //@ts-expect-error
                health: duplicate(this.object.data.data.health),
                races: { list: [], chosen: null },
                count: {
                    // counter for skills and feats
                    skills: {
                        // count skills by their level
                        0: 0,
                        1: 0,
                        2: 0,
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
                    attribute: null,
                    skill: null,
                    race: null,
                    feat: null,
                },
            };
            let pack_list = []; // array of feats from Compendium
            let pack_name = [];
            let folder_list = []; // array of feats from game folders
            let folder_name = [];
            let temp_feat_list = []; // final array of feats
            //@ts-expect-error
            this.data.xp.get = this.data.isReady || this.data.xp.used !== 0 ? this.data.xp.get : 10000;
            for (let key of game.settings.get("ard20", "feat").packs) {
                if (game.packs.filter((pack) => pack.metadata.label === key).length !== 0) {
                    let feat_list = [];
                    //@ts-expect-error
                    feat_list.push(Array.from(game.packs.filter((pack) => pack.metadata.label === key && pack.metadata.type === "Item")[0].index));
                    feat_list = feat_list.flat();
                    for (let feat of feat_list) {
                        let new_key = game.packs.filter((pack) => pack.metadata.label === key)[0].metadata.package + "." + key;
                        //@ts-expect-error
                        let doc = await game.packs.get(new_key).getDocument(feat._id);
                        if (doc !== null || doc !== undefined) {
                            let item = doc.toObject();
                            item.data = foundry.utils.deepClone(doc.data.data);
                            pack_list.push(item);
                            pack_name.push(item.name);
                        }
                    }
                    pack_list = pack_list.flat();
                }
            }
            /*
             * Same as above, but for folders
             */
            for (let key of game.settings.get("ard20", "feat").folders) {
                if (game.folders.filter((folder) => folder.data.name === key).length !== 0) {
                    let feat_list = [];
                    feat_list.push(game.folders.filter((folder) => folder.data.name === key && folder.data.type === "Item")[0].contents);
                    feat_list = feat_list.flat();
                    for (let feat of feat_list) {
                        console.log("item added from folder ", feat);
                        let item = feat.toObject();
                        item.data = foundry.utils.deepClone(feat.data.data);
                        folder_list.push(item);
                        folder_name.push(item.name);
                    }
                    folder_list = folder_list.flat();
                }
            }
            /*
             *Create a list of races
             */
            let race_pack_list = pack_list.filter((item) => item.type === "race");
            let race_folder_list = folder_list.filter((item) => item.type === "race");
            //@ts-expect-error
            this.data.races.list = race_pack_list.concat(race_folder_list.filter((item) => !pack_name.includes(item.name)));
            /*
             * Create final list of features
             */
            let feat_pack_list = pack_list.filter((item) => item.type === "feature");
            let feat_folder_list = folder_list.filter((item) => item.type === "feature");
            temp_feat_list = feat_pack_list.concat(feat_folder_list.filter((item) => !pack_name.includes(item.name)));
            //@ts-expect-error
            this.data.feats.learned = foundry.utils.deepClone(this.object.data.items).filter((item) => item.data.type === "feature");
            let name_array = [];
            //@ts-expect-error
            for (let i of this.data.feats.learned) {
                name_array.push(i.data.name);
            }
            for (let [k, v] of obj_entries(temp_feat_list)) {
                if (name_array.includes(v.name)) {
                    //@ts-expect-error
                    temp_feat_list[k] = this.data.feats.learned.filter((item) => item.name === v.name)[0].data.toObject();
                    console.log("this item is already learned", temp_feat_list[k]);
                    //@ts-expect-error
                    temp_feat_list[k].data = foundry.utils.deepClone(this.data.feats.learned.filter((item) => item.name === v.name)[0].data.data);
                }
            }
            temp_feat_list = temp_feat_list.filter((item) => (item.type === "feature" && !name_array.includes(item.name)) || item.data.level.current !== item.data.level.max);
            //@ts-expect-error
            this.data.feats.awail = temp_feat_list;
            // count skills by rank
            for (let [k, v] of obj_entries(CONFIG.ARd20.Skills)) {
                //@ts-expect-error
                if (this.data.skills[k].rank === 0) {
                    //@ts-expect-error
                    this.data.count.skills[0] += 1;
                    //@ts-expect-error
                }
                else if (this.data.skills[k].rank === 1) {
                    //@ts-expect-error
                    this.data.count.skills[1] += 1;
                    //@ts-expect-error
                }
                else if (this.data.skills[k].rank === 2) {
                    //@ts-expect-error
                    this.data.count.skills[2] += 1;
                }
            }
            // count feats by source
            //@ts-expect-error
            for (let [k, v] of obj_entries(this.data.feats.learned)) {
                console.log(v);
                v.data.data.source.value.forEach((val) => {
                    console.log(val);
                    //@ts-expect-error
                    this.data.count.feats[val] += 1;
                });
            }
            //@ts-expect-error
            this.data.hover.feat = TextEditor.enrichHTML(this.data.feats.awail[0]?.data.description);
        }
        //@ts-expect-error
        this.data.count.feats.all = 0;
        //@ts-expect-error
        this.data.count.feats.all = Object.values(this.data.count.feats).reduce(function (a, b) {
            return a + b;
        }, 0);
        /*
         * Calculate attributes' modifiers and xp cost
         */
        for (let [k, v] of obj_entries(CONFIG.ARd20.Attributes)) {
            //@ts-expect-error
            this.data.attributes[k].mod = Math.floor((this.data.attributes[k].value - 10) / 2);
            //@ts-expect-error
            this.data.attributes[k].xp = CONFIG.ARd20.AbilXP[this.data.attributes[k].value - 5];
            //@ts-expect-error
            this.data.attributes[k].isEq = this.data.attributes[k].value === this.object.data.data.attributes[k].value;
            //@ts-expect-error
            this.data.attributes[k].isXP = this.data.xp.get < this.data.attributes[k].xp;
            //@ts-expect-error
            let race_abil = this.data.races.list.filter((race) => race.chosen === true)?.[0]?.data.bonus.abil[k].value ?? 0;
            //@ts-expect-error
            let race_sign = this.data.races.list.filter((race) => race.chosen === true)?.[0]?.data.bonus.abil[k].sign ? 1 : -1;
            //@ts-expect-error
            this.data.attributes[k].final = this.data.isReady ? this.data.attributes[k].value : this.data.attributes[k].value + race_abil * race_sign;
            //@ts-expect-error
            this.data.attributes[k].mod = Math.floor((this.data.attributes[k].final - 10) / 2);
        }
        /*
         * Calculate Character's hp
         */
        //@ts-expect-error
        this.data.health.max = this.data.races.list.filter((race) => race.chosen === true)?.[0]?.data.startHP;
        /*
         * Calculate skills' xp cost
         */
        for (let [k, v] of obj_entries(CONFIG.ARd20.Skills)) {
            //@ts-expect-error
            this.data.skills[k].rank_name = game.i18n.localize(CONFIG.ARd20.Rank[this.data.skills[k].rank]) ?? this.data.skills[k].rank;
            //@ts-expect-error
            this.data.skills[k].xp = this.data.skills[k].rank < 2 ? CONFIG.ARd20.SkillXp[this.data.skills[k].rank][this.data.count.skills[this.data.skills[k].rank + 1]] : false;
            //@ts-expect-error
            this.data.skills[k].isEq = this.data.skills[k].rank === this.object.data.data.skills[k].rank;
            //@ts-expect-error
            this.data.skills[k].isXP = this.data.xp.get < this.data.skills[k].xp || this.data.skills[k].rank > 1;
        }
        //@ts-expect-error
        for (let [k, v] of obj_entries(this.data.profs.weapon)) {
            v.value_hover = game.i18n.localize(CONFIG.ARd20.Rank[v.value]) ?? CONFIG.ARd20.Rank[v.value];
        }
        /*
         * Calculate features cost and their availattribute
         */
        //@ts-expect-error
        for (let [k, object] of obj_entries(this.data.feats.awail)) {
            //@ts-expect-error
            let pass = [];
            //@ts-expect-error
            let allCount = this.data.count.feats.all;
            let featCount = 0;
            //@ts-expect-error
            object.data.source?.value.forEach((val) => (featCount += this.data.count.feats[val]));
            object.data.level.xp = object.data.level.xp || {};
            for (let i = object.data.level.initial; i < object.data.level.max; i++) {
                object.data.level.xp[i] = object.data.xp?.[i] ? Math.ceil((object.data.xp[i] * (1 + 0.01 * (allCount - featCount))) / 5) * 5 : 0;
            }
            object.data.current_xp = object.data.level.xp[object.data.level.initial];
            object.isEq = object.data.level.initial === object.data.level.current || object.data.level.initial === 0;
            //@ts-expect-error
            object.isXP = object.data.level.initial === object.data.level.max || object.data.level.xp[object.data.level.initial] > this.data.xp.get;
            for (let [key, r] of obj_entries(object.data.req.values)) {
                switch (r.type) {
                    case "attribute": //check if character's attribute is equal or higher than value entered in feature requirements
                        //@ts-expect-error
                        r.pass.forEach((item, index) => (r.pass[index] = r.input[index] <= this.data.attributes[r.value].final));
                        break;
                    case "skill": //check if character's skill rank is equal or higher than value entered in feature requirements
                        //@ts-expect-error
                        r.pass.forEach((item, index) => (r.pass[index] = r.input[index] <= this.data.skills[r.value].rank));
                        break;
                    case "feat": //check if character has features (and their level is equal or higher) that listed in feature requirements
                        //@ts-expect-error
                        if (this.data.feats.awail.filter((item) => item.name === r.name)?.[0] !== undefined) {
                            //@ts-expect-error
                            r.pass.forEach((item, index) => (r.pass[index] = r.input[index] <= this.data.feats.awail.filter((item) => item.name === r.name)[0].data.level.initial));
                            //@ts-expect-error
                        }
                        else if (this.data.feats.learned.filter((item) => item.name === r.name)?.[0] !== undefined) {
                            //@ts-expect-error
                            r.pass = r.pass.forEach((item, index) => (r.pass[index] = r.input[index] <= this.data.feats.learned.filter((item) => item.name === r.name)[0].data.data.level.initial));
                        }
                        break;
                }
                pass.push(r.pass);
            }
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
                object.pass[i] = Boolean(filter(f));
            }
            object.isXP = object.pass[object.data.level.initial] || object.pass.length === 0 ? object.isXP : true;
        }
        /*
         * Calculate starting HP based on character's CON and race
         */
        //@ts-expect-error
        for (let [key, race] of obj_entries(this.data.races.list)) {
            //@ts-expect-error
            let dieNumber = Math.ceil(Math.max(this.data.attributes.con.value + race.data.bonus.abil.con.value - 7, 0) / 4);
            let firstDie = CONFIG.ARd20.HPDice.slice(CONFIG.ARd20.HPDice.indexOf(race.data.FhpDie));
            //@ts-expect-error
            let race_mod = Math.floor((this.data.attributes.con.value + race.data.bonus.abil.con.value - 10) / 2);
            //@ts-expect-error
            race.data.startHP = new Roll(firstDie[dieNumber]).evaluate({ maximize: true }).total + race_mod;
            //@ts-expect-error
            race.chosen = this.data.races.chosen === race._id ? true : false;
        }
        // At character creation, check all conditions
        //@ts-expect-error
        if (!this.object.data.isReady) {
            let abil_sum = null;
            //@ts-expect-error
            for (let [key, abil] of obj_entries(this.data.attributes)) {
                abil_sum += abil.value;
            }
            //@ts-expect-error
            this.data.allow.attribute = abil_sum >= 60 && abil_sum <= 80 ? true : false;
            //@ts-expect-error
            this.data.allow.race = Boolean(this.data.races.chosen) ? true : false;
            let allow_list = [];
            //@ts-expect-error
            for (let [key, item] of obj_entries(this.data.allow)) {
                if (key === "final") {
                    continue;
                }
                allow_list.push(item);
            }
            //@ts-expect-error
            this.data.allow.final = !allow_list.includes(false) || this.data.isReady ? true : false;
        }
        /*
         * Final Template Data
         */
        const templateData = {
            //@ts-expect-error
            attributes: this.data.attributes,
            //@ts-expect-error
            xp: this.data.xp,
            //@ts-expect-error
            skills: this.data.skills,
            //@ts-expect-error
            count: this.data.count,
            //@ts-expect-error
            content: this.data.content,
            //@ts-expect-error
            hover: this.data.hover,
            //@ts-expect-error
            profs: this.data.profs,
            //@ts-expect-error
            feats: this.data.feats,
            //@ts-expect-error
            races: this.data.races,
            //@ts-expect-error
            health: this.data.health,
            //@ts-expect-error
            allow: this.data.allow,
            //@ts-expect-error
            isReady: this.data.isReady,
        };
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
            //@ts-expect-error
            await actor.update(obj);
            //@ts-expect-error
            if (actor.itemTypes.race.length === 0) {
                //@ts-expect-error
                let race_list = this.data.races.list.filter((race) => race.chosen === true);
                //@ts-expect-error
                await actor.createEmbeddedDocuments("Item", race_list);
            }
            if (feats_data.exist.length > 0) {
                //@ts-expect-error
                await actor.updateEmbeddedDocuments("Item", feats_data.exist.map((item) => ({
                    //@ts-expect-error
                    _id: item._id,
                    //@ts-expect-error
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
