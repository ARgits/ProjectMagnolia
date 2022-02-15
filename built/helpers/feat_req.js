import { getValues, obj_entries } from "../ard20.js";
import { ARd20Item } from "../documents/item";
//@ts-expect-error
export class FeatRequirements extends FormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ard20"],
            title: "Feature Requirements",
            template: "systems/ard20/templates/app/feat_req.hbs",
            id: "feat_req",
            width: 800,
            height: "auto",
        });
    }
    async getData() {
        this.options.data = !this.form ? (await this.InitializeData()) : this.options.data;
        const templateData = this.options.data;
        const req = templateData.req;
        const reqValues = req.values;
        const reqLogic = req.logic;
        const data = templateData.data;
        let formApp = templateData.formApp;
        console.log("data created");
        let name_array = [];
        for (let i of data) {
            name_array.push(i.name);
        }
        /**
         * Data created
         */
        reqValues.forEach((value, index) => {
            reqValues[index].type = formApp?.values?.[index]?.type ?? (reqValues[index].type || "attribute");
            let subtype_list = data.filter((item) => (item.type = reqValues[index].type));
            reqValues[index].name =
                subtype_list.filter((item) => {
                    item.name === formApp.values?.[index]?.name;
                }).length > 0
                    ? formApp.values?.[index].name || reqValues[index].name
                    : reqValues[index].name || subtype_list[0].name;
            subtype_list.forEach((item) => reqValues[index].subtype_list.push(item.name));
            reqValues[index].input = formApp.values[index].input ?? (reqValues[index].input || []);
            if (reqValues[index].type === "feat") {
                reqValues[index].value = data.filter((item) => item.name === reqValues[index].name)[0].value;
            }
            for (let i = 0; i < this.object.data.data.level.max; i++) {
                let inputElement = reqValues[index].input[i];
                let nextElement = reqValues[index].input[i + 1];
                inputElement =
                    reqValues[index].type !== "skill" ? Number(inputElement) || 10 : inputElement > 4 ? 1 : inputElement || 1;
                if (nextElement < inputElement) {
                    nextElement = inputElement;
                }
                reqValues[index].input[i] = inputElement;
                reqValues[index].input[i + 1] = nextElement;
            }
        });
        reqLogic.forEach((value, index) => {
            reqLogic[index] = formApp.logic?.[index] ?? reqLogic[index];
        });
        formApp = req;
        return templateData;
    }
    /**
     * Initialize Data for FormApplication
     * Data structure looks like this:
     * @param {Array} req - already existing requirements
     * @param {Array} type_list - list of types for requirements, can be attribute, skill or feat
     * @param feat.awail - array of Items with type feat from Folders and Compendium Packs
     * @param feat.current - array of Items that was already used
     * @returns {object} templateData
     */
    async InitializeData() {
        if (this.form)
            return;
        console.log("First launch");
        const featList = await this.getFeats();
        const pack_list = featList.pack_list;
        const folder_list = featList.folder_list;
        const folder_name = featList.folder_name;
        const data = []; //list of attributes, skills and feats that user can use as requirement
        for (let [k, v] of Object.entries(CONFIG.ARd20.Attributes)) {
            data.push({
                name: game.i18n.localize(getValues(CONFIG.ARd20.Attributes, k)) ?? k,
                value: k,
                type: "attribute",
            });
        }
        for (let [k, v] of obj_entries(CONFIG.ARd20.Skills)) {
            data.push({
                name: game.i18n.localize(getValues(CONFIG.ARd20.Skills, k)) ?? k,
                value: k,
                type: "skill",
            });
        }
        const arr = Object.values(CONFIG.ARd20.Rank).filter((value, index) => {
            if (index === 0)
                return CONFIG.ARd20.Rank[index];
        });
        const rank = Object.assign({}, arr);
        const templateData = {
            formApp: {
                values: [],
                logic: [],
            },
            req: foundry.utils.deepClone(this.object.data.data.req),
            type_list: ["attribute", "skill", "feat"],
            feat: {
                awail: pack_list.concat(folder_list.filter((item) => pack_list.indexOf(item) < 0)),
                current: this.object.data.data.req.values.filter((item) => item.type === "feature"),
            },
            data: data,
            rank: rank,
        };
        const formApp = templateData.formApp;
        const req = templateData.req;
        const type_list = templateData.type_list;
        const featAwail = templateData.feat.awail;
        const featCurrent = templateData.feat.current;
        let name_array = [];
        for (let i of featCurrent) {
            name_array.push(i.name);
        }
        featAwail.forEach((item, index) => {
            if (item.name === this.object.name) {
                console.log(item.name, " matches name of the feat");
                featAwail.splice(index, 1);
            }
            else if (name_array.includes(item.name)) {
                console.log(item.name, "this feat is already included", index);
                item.input = featCurrent[featCurrent.indexOf(featCurrent.filter((feat) => feat.name === item.name)[0])].input;
                featAwail.splice(index, 1);
            }
            if (featAwail.filter((feat) => feat.name === item.name).length !== 0) {
                data.push({ name: item.name, type: "feat", value: item.value });
            }
        });
        return templateData;
    }
    /**
     * Get features from folders and packs that were configured in settings
     * @returns {} {pack_list, folder_list, folder_name}
     */
    async getFeats() {
        let pack_list = [];
        let folder_list = [];
        let folder_name = [];
        const packs = game.settings.get("ard20", "feat").packs;
        const folders = game.settings.get("ard20", "feat").folders;
        for (let key of packs) {
            if (game.packs.filter((pack) => pack.metadata.label === key).length !== 0) {
                let feat_list = [];
                feat_list.push(Array.from(game.packs.filter((pack) => pack.metadata.label === key && pack.metadata.entity === "Item")[0].index));
                feat_list = feat_list.flat();
                for (let feat of feat_list) {
                    if (feat instanceof ARd20Item) {
                        const new_key = game.packs.filter((pack) => pack.metadata.label === key)[0].metadata.package + "." + key;
                        const doc = await game.packs.get(new_key).getDocument(feat.id);
                        if (doc instanceof ARd20Item) {
                            if (doc.data.type === "feature") {
                                let item = doc.toObject();
                                item.data = doc.data.data;
                                const feature = {
                                    name: item.name,
                                    type: "feature",
                                    input: [],
                                    pass: [],
                                    subtype_list: [],
                                    value: item.data.level.max,
                                };
                                pack_list.push(feature);
                            }
                        }
                    }
                }
            }
        }
        for (let key of folders) {
            if (game.folders.filter((folder) => folder.data.name === key).length !== 0) {
                let feat_list = [];
                feat_list.push(game.folders.filter((folder) => folder.data.name === key && folder.data.type === "Item")[0].contents);
                feat_list = feat_list.flat();
                for (let feat of feat_list) {
                    if (feat instanceof ARd20Item && feat.data.type === "feature") {
                        console.log("item added from folder ", feat);
                        const item = feat.toObject();
                        item.data = foundry.utils.deepClone(feat.data.data);
                        const feature = {
                            name: item.name,
                            type: "feature",
                            input: [],
                            pass: [],
                            subtype_list: [],
                            value: item.data.level.max,
                        };
                        folder_list.push(feature);
                        folder_name.push(item.name);
                    }
                }
            }
        }
        return { pack_list, folder_list, folder_name };
    }
    activateListeners(html) {
        super.activateListeners(html);
        html.find(".item-create").on("click", this._onAdd.bind(this));
        html.find(".item-delete").on("click", this._Delete.bind(this));
    }
    /**
     * Add new requirement. By default it "Strength>=10" for every feat's level.
     * @param event
     */
    async _onAdd(event) {
        event.preventDefault();
        const req = this.options.data.req;
        let sub_list = []; //temporary list with attributes
        for (let [k, i] of obj_entries(CONFIG.ARd20.Attributes)) {
            sub_list.push(k);
        }
        //create default value object
        const defaultValue = {
            name: "Strength",
            type: "attribute",
            pass: Array.from({ length: this.object.data.data.level.max }, (i) => (i = false)),
            subtype_list: sub_list,
            value: "str",
            input: Array.from({ length: this.object.data.data.level.max }, (i) => (i = 10)),
        };
        req.values.push(defaultValue);
        this.render();
    }
    /**
     * Delete existing requirement
     * @param event
     */
    async _Delete(event) {
        event.preventDefault();
        const req = this.options.data.req;
        req.values.splice(event.currentTarget.dataset.key, 1);
        this.render();
    }
    /**
     * Save typed-in values
     * @param event
     */
    _onChangeInput(event) {
        super._onChangeInput(event);
        const data = this.options.data;
        const formApp = data.formApp;
        const k = event.currentTarget.dataset.key;
        const i = event.currentTarget.dataset.order;
        console.log(foundry.utils.expandObject(this._getSubmitData()));
        const req = foundry.utils.expandObject(this._getSubmitData()).req;
        switch (event.currentTarget.dataset.type) {
            case "value":
                formApp.values[k].type = req.values[k].type;
                formApp.values[k].name = req.values[k].name;
                formApp.values[k].input[i] = req.values[k].input[i];
                break;
            case "logic":
                formApp.logic[k] = req.logic[k];
                break;
        }
        this.getData();
        this.render();
    }
    async _updateObject(event, formData) {
        const item = this.object;
        this.render();
        const req = this.options.data.req;
        const obj = {};
        obj["data.req.values"] = req.values;
        obj["data.req.logic"] = req.logic;
        console.log(obj);
        await item.update(obj);
    }
}
