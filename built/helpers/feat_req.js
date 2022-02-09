import { getValues, obj_entries } from "../ard20";
export class FeatRequirements extends FormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["ard20"],
            title: "Feature Requirements",
            template: "systems/ard20/templates/app/feat_req.html",
            id: "feat_req",
            width: 800,
            height: "auto",
        });
    }
    //@ts-expect-error
    async getData() {
        //@ts-expect-error
        if (!this.data) {
            console.log("First launch");
            //@ts-expect-error
            this.formApp = null;
            //@ts-expect-error
            this.data = [];
            //@ts-expect-error
            this.req = foundry.utils.deepClone(this.object.data.data.req);
            //@ts-expect-error
            let pack_list = [];
            let folder_list = [];
            //@ts-expect-error
            this.type_list = ["ability", "skill", "feat"];
            //@ts-expect-error
            if (this.req.logic)
                /*Get items from Compendiums. In settings 'feat'.packs you input name of needed Compendiums*/
                for (let key of game.settings.get("ard20", "feat").packs) {
                    if (game.packs.filter((pack) => pack.metadata.label === key).length !== 0) {
                        let feat_list = [];
                        feat_list.push(Array.from(game.packs.filter((pack) => pack.metadata.label === key && pack.metadata.entity === "Item")[0].index));
                        feat_list = feat_list.flat();
                        for (let feat of feat_list) {
                            let new_key = game.packs.filter((pack) => pack.metadata.label === key)[0].metadata.package + "." + key;
                            //@ts-expect-error
                            let doc = await game.packs.get(new_key).getDocument(feat._id);
                            if (doc.data.type === "feature") {
                                let item = {
                                    //@ts-expect-error
                                    name: duplicate(feat.name),
                                    maxLevel: duplicate(doc.data.data.level.max),
                                };
                                pack_list.push(item);
                            }
                        }
                    }
                }
            /* Same as above, but for folders*/
            for (let key of game.settings.get("ard20", "feat").folders) {
                if (game.folders.filter((folder) => folder.data.name === key).length !== 0) {
                    let feat_list = [];
                    feat_list.push(game.folders.filter((folder) => folder.data.name === key && folder.data.type === "Item")[0].contents);
                    feat_list = feat_list.flat();
                    //@ts-expect-error
                    for (let feat of feat_list.filter((item) => item.type === "feature")) {
                        let doc = {
                            name: duplicate(feat.name),
                            maxLevel: duplicate(feat.data.data.level.max),
                        };
                        folder_list.push(doc);
                    }
                }
            }
            //@ts-expect-error
            this.feat = {
                //@ts-expect-error
                awail: pack_list.concat(folder_list.filter((item) => pack_list.indexOf(item) < 0)),
                //@ts-expect-error
                current: Object.values(foundry.utils.deepClone(this.object.data.data.req.values.filter((item) => item.type === "feature"))),
            };
            for (let [k, v] of Object.entries(CONFIG.ARd20.Attributes)) {
                //@ts-expect-error
                this.data.push({
                    name: game.i18n.localize(getValues(CONFIG.ARd20.Attributes, k)) ?? k,
                    value: k,
                    type: "ability",
                });
            }
            for (let [k, v] of obj_entries(CONFIG.ARd20.Skills)) {
                //@ts-expect-error
                this.data.push({
                    name: game.i18n.localize(getValues(CONFIG.ARd20.Skills, k)) ?? k,
                    value: k,
                    type: "skill",
                });
            }
            let name_array = [];
            //@ts-expect-error
            for (let i of this.feat.current) {
                name_array.push(i.name);
            }
            //@ts-expect-error
            console.log(this.feat.awail);
            //@ts-expect-error
            for (let [k, v] of obj_entries(this.feat.awail)) {
                //@ts-expect-error
                if (v.name === this.object.name) {
                    console.log(v.name, " matches name of the feat");
                    //@ts-expect-error
                    this.feat.awail.splice(k, 1);
                }
                else if (name_array.includes(v.name)) {
                    console.log(v.name, "this feat is already included", k);
                    //@ts-expect-error
                    v.input = this.feat.current[this.feat.current.indexOf(this.feat.current.filter((item) => item.name === v.name)[0])].input;
                    //@ts-expect-error
                    this.feat.awail.splice(k, 1);
                }
                //@ts-expect-error
                console.log(this.feat.awail);
                //@ts-expect-error
                if (this.feat.awail.filter((item) => item.name === v.name).length !== 0) {
                    //@ts-expect-error
                    console.log(this.feat.awail.filter((item) => item.name === v.name));
                    console.log(v.name);
                    //@ts-expect-error
                    this.data.push({
                        name: v.name,
                        type: "feat",
                        maxLevel: v.maxLevel,
                    });
                }
            }
        }
        console.log("data created");
        let name_array = [];
        //@ts-expect-error
        for (let i of this.data) {
            name_array.push(i.name);
        }
        /**
         * Data created
         */
        //@ts-expect-error
        for (let [k, value] of obj_entries(this.req.values)) {
            //@ts-expect-error
            this.req.values[k].type = this.formApp?.values?.[k]?.type ? this.formApp?.values?.[k]?.type : this.req.values[k].type || "ability";
            //@ts-expect-error
            let subtype_list = this.data.filter((item) => item.type === this.req.values[k].type);
            //@ts-expect-error
            this.req.values[k].name =
                //@ts-expect-error
                subtype_list.filter((item) => item.name === this.formApp?.values?.[k]?.name).length > 0
                    ? //@ts-expect-error
                        this.formApp?.values?.[k]?.name || this.req.values[k].name
                    : //@ts-expect-error
                        this.req.values[k].name || subtype_list[0].name;
            //@ts-expect-error
            this.req.values[k].subtype_list = [];
            //@ts-expect-error
            subtype_list.forEach((item) => this.req.values[k].subtype_list.push(item.name));
            //@ts-expect-error
            this.req.values[k].input = this.formApp?.values?.[k]?.input ? this.formApp?.values?.[k]?.input : this.req.values[k].input || "";
            //@ts-expect-error
            if (this.req.values[k].type === "feat") {
                //@ts-expect-error
                this.req.values[k].maxLevel = this.data.filter((item) => item.name === this.req.values[k].name)[0].maxLevel;
            }
            //@ts-expect-error
            this.req.values[k].input = this.req.values[k].input || [];
            //@ts-expect-error
            for (let i = 0; i < this.object.data.data.level.max; i++) {
                //@ts-expect-error
                console.log(this.req.values[k].input[i], this.formApp?.values?.[k]?.input[i]);
                //@ts-expect-error
                this.req.values[k].input[i] =
                    //@ts-expect-error
                    this.req.values[k].type !== "skill"
                        ? //@ts-expect-error
                            Number(this.req.values[k].input[i]) || 10
                        : //@ts-expect-error
                            this.req.values[k].input[i] > 2
                                ? 1
                                : //@ts-expect-error
                                    this.req.values[k].input[i] || 1;
                //@ts-expect-error
                if (this.req.values[k].input[i + 1] < this.req.values[k].input[i]) {
                    //@ts-expect-error
                    this.req.values[k].input[i + 1] = this.req.values[k].input[i];
                }
            }
        }
        //@ts-expect-error
        for (let [k, value] of obj_entries(this.req.logic)) {
            //@ts-expect-error
            this.req.logic[k] = this.formApp?.logic?.[k] ? this.formApp.logic[k] : this.req.logic[k];
        }
        //@ts-expect-error
        this.formApp = this.req;
        //@ts-expect-error
        this.prof = Object.values(CONFIG.ARd20.prof)
            .slice(1)
            .reduce((result, item, index, array) => {
            //@ts-expect-error
            result[index + 1] = item;
            return result;
        }, {});
        const FormData = {
            //@ts-expect-error
            data: this.data,
            //@ts-expect-error
            type: this.type_list,
            config: CONFIG.ARd20,
            //@ts-expect-error
            req: this.req,
            //@ts-expect-error
            formApp: this.formApp,
            //@ts-expect-error
            prof: this.prof,
        };
        console.log("FormData", FormData);
        console.log("Form html", this.form);
        return FormData;
    }
    //@ts-expect-error
    activateListeners(html) {
        super.activateListeners(html);
        html.find(".item-create").click(this._onAdd.bind(this));
        html.find(".item-delete").click(this._Delete.bind(this));
    }
    //@ts-expect-error
    async _onAdd(event) {
        event.preventDefault();
        //@ts-expect-error
        const req = this.req;
        req.values.push({});
        this.render();
    }
    //@ts-expect-error
    async _Delete(event) {
        event.preventDefault();
        //@ts-expect-error
        const req = this.req;
        req.values.splice(event.currentTarget.dataset.key, 1);
        this.render();
    }
    //@ts-expect-error
    _onChangeInput(event) {
        super._onChangeInput(event);
        const k = event.currentTarget.dataset.key;
        const i = event.currentTarget.dataset.order;
        console.log(foundry.utils.expandObject(this._getSubmitData()));
        const req = foundry.utils.expandObject(this._getSubmitData()).req;
        switch (event.currentTarget.dataset.type) {
            case "value":
                //@ts-expect-error
                this.formApp.values[k].type = req.values[k].type;
                //@ts-expect-error
                this.formApp.values[k].name = req.values[k].name;
                //@ts-expect-error
                this.formApp.values[k].input[i] = req.values[k].input[i];
                break;
            case "logic":
                //@ts-expect-error
                this.formApp.logic[k] = req.logic[k];
                break;
        }
        this.getData();
        this.render();
    }
    //@ts-expect-error
    async _updateObject(event, formData) {
        const item = this.object;
        this.render();
        const obj = {};
        //@ts-expect-error
        obj["data.req.values"] = this.req.values;
        //@ts-expect-error
        obj["data.req.logic"] = this.req.logic;
        console.log(obj);
        //@ts-expect-error
        await item.update(obj);
    }
}
