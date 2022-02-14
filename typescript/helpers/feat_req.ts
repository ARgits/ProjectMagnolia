import { ItemDataSource } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData";
import { getValues, obj_entries } from "../ard20.js";
import { ARd20Item } from "../documents/item";

//@ts-expect-error
export class FeatRequirements extends FormApplication<FeatRequirementsFormAppOptions, FeatRequirementsFormAppData, FeatRequirementsFormObject> {
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
  async getData(): Promise<FeatRequirementsFormAppData> {
    this.options.data = !this.form ? (await this.InitializeData())! : this.options.data;
    const templateData = this.options.data;
    const req = templateData.req;
    const reqValues = req.values;
    const reqLogic = req.logic;
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
      this.req.values[k].type = this.formApp?.values?.[k]?.type ? this.formApp?.values?.[k]?.type : this.req.values[k].type || "attribute";
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
    //@ts-expect-error
    return FormData;
  }
  /**
   * Initialize Data for FormApplication
   * Data structure looks like this:
   * @param {Array} req - already existing requirements
   * @param {Array} type_list - list of types for requirements, can be attribute, skill or feat
   * @param feat.awail - array of Items with type feat from Folders and Compendium Packs
   * @param feat.current - array of Items that was already used
   * @returns
   */
  async InitializeData() {
    if (this.form) return;
    console.log("First launch");
    const featList = await this.getFeats();
    const pack_list = featList.pack_list;
    const folder_list = featList.folder_list;
    const folder_name = featList.folder_name;
    const data: FeatReqData[] = []; //list of attributes, skills and feats that user can use as requirement
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
    const templateData:FeatRequirementsFormAppData = {
      formApp: {},
      req: foundry.utils.deepClone(this.object.data.data.req), //copy existing requirements
      type_list: ["attribute", "skill", "feat"],
      feat: {
        awail: pack_list.concat(folder_list.filter((item) => pack_list.indexOf(item) < 0)),
        current: this.object.data.data.req.values.filter((item) => item.type === "feature"),
      },
      data: data,
    };
    const formApp = templateData.formApp;
    const req = templateData.req;
    const type_list = templateData.type_list;
    const featAwail = templateData.feat.awail;
    const featCurrent = templateData.feat.current;
    //@ts-expect-error
    formApp = null;
    /*Get items from Compendiums. In settings 'feat'.packs you input name of needed Compendiums*/
    /* Same as above, but for folders*/

    let name_array: string[] = [];
    for (let i of featCurrent) {
      name_array.push(i.name);
    }
    console.log(featAwail);
    featAwail.forEach((item, index) => {
      if (item.name === this.object.name) {
        console.log(item.name, " matches name of the feat");
        featAwail.splice(index, 1);
      } else if (name_array.includes(item.name)) {
        console.log(item.name, "this feat is already included", index);
        item.input = featCurrent[featCurrent.indexOf(featCurrent.filter((feat) => feat.name === item.name)[0])].input;
        featAwail.splice(index, 1);
      }
      if (featAwail.filter((feat) => feat.name === item.name).length !== 0) {
        data.push({ name: item.name, type: "feat", value: item.data.level.max });
      }
    });
    return templateData;
  }
  /**
   * Get features from folders and packs that were configured in settings
   * @returns
   */
  async getFeats() {
    let pack_list: FeatureType[] = [];
    let folder_list: FeatureType[] = [];
    let folder_name: string[] = [];
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
            const doc = await game.packs.get(new_key)!.getDocument(feat.id!);
            if (doc instanceof ARd20Item) {
              if (doc!.data.type === "feature") {
                let item = doc.toObject();
                item.data = doc.data.data;
                const feature = <FeatureType>{ ...item };
                feature.data.req.values[0]
                pack_list.push(feature);
              }
            }
          }
        }
      }
    }
    for (let key of folders) {
      if (game.folders!.filter((folder) => folder.data.name === key).length !== 0) {
        let feat_list = [];
        feat_list.push(game.folders!.filter((folder) => folder.data.name === key && folder.data.type === "Item")[0].contents);
        feat_list = feat_list.flat();
        for (let feat of feat_list) {
          if (feat instanceof ARd20Item) {
            console.log("item added from folder ", feat);
            const item = feat.toObject();
            item.data = foundry.utils.deepClone(feat.data.data);
            const feature = <FeatureType>{ ...item };
            folder_list.push(feature);
            folder_name.push(item.name);
          }
        }
      }
    }
    return { pack_list, folder_list, folder_name };
  }
  activateListeners(html: JQuery) {
    super.activateListeners(html);
    html.find(".item-create").on("click", this._onAdd.bind(this));
    html.find(".item-delete").on("click", this._Delete.bind(this));
  }
  async _onAdd(event: any) {
    event.preventDefault();
    const req = this.options.data.req;
    req.values.push({
      
    });
    this.render();
  }
  async _Delete(event: any) {
    event.preventDefault();
    const req = this.options.data.req;
    req.values.splice(event.currentTarget.dataset.key, 1);
    this.render();
  }
  _onChangeInput(event: any) {
    super._onChangeInput(event);
    const data = this.options.data;
    const formApp = data.formApp;
    const k = event.currentTarget.dataset.key;
    const i = event.currentTarget.dataset.order;
    console.log(foundry.utils.expandObject(this._getSubmitData()));
    const req = foundry.utils.expandObject(this._getSubmitData()).req;
    switch (event.currentTarget.dataset.type) {
      case "value":
        //@ts-expect-error
        formApp.values[k].type = req.values[k].type;
        //@ts-expect-error
        formApp.values[k].name = req.values[k].name;
        //@ts-expect-error
        formApp.values[k].input[i] = req.values[k].input[i];
        break;
      case "logic":
        //@ts-expect-error
        formApp.logic[k] = req.logic[k];
        break;
    }
    this.getData();
    this.render();
  }

  //@ts-expect-error
  async _updateObject(event, formData) {
    const item = this.object;
    this.render();
    const req = this.options.data.req;
    const obj: { [index: string]: any[] } = {};
    obj["data.req.values"] = req.values;
    obj["data.req.logic"] = req.logic;
    console.log(obj);
    await item.update(obj);
  }
}
