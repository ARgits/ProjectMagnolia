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
  async getData(options) {
    if (!this.data) {
      console.log("First launch");
      this.formApp = null;
      this.data = [];
      this.req = foundry.utils.deepClone(this.object.data.data.req);
      let pack_list = [];
      let folder_list = [];
      this.type_list = ["ability", "skill", "feat"];
      if (this.req.logic)
        /*Get items from Compendiums. In settings 'feat'.packs you input name of needed Compendiums*/
        for (let key of game.settings.get("ard20", "feat").packs) {
          if (game.packs.filter((pack) => pack.metadata.label === key).length !== 0) {
            let feat_list = [];
            feat_list.push(Array.from(game.packs.filter((pack) => pack.metadata.label === key && pack.metadata.entity === "Item")[0].index));
            feat_list = feat_list.flat();
            for (let feat of feat_list) {
              let new_key = game.packs.filter((pack) => pack.metadata.label === key)[0].metadata.package + "." + key;
              let doc = await game.packs.get(new_key).getDocument(feat._id);
              if(doc.data.type==='feature'){
              let item = {
                name: duplicate(feat.name),
                maxLevel: duplicate(doc.data.data.level.max),
              };
              pack_list.push(item);}
            }
          }
        }
      /* Same as above, but for folders*/
      for (let key of game.settings.get("ard20", "feat").folders) {
        if (game.folders.filter((folder) => folder.data.name === key).length !== 0) {
          let feat_list = [];
          feat_list.push(game.folders.filter((folder) => folder.data.name === key && folder.data.type === "Item")[0].content);
          feat_list = feat_list.flat();
          for (let feat of feat_list.filter((item) => item.type === "feature")) {
            let doc = {
              name: duplicate(feat.name),
              maxLevel: duplicate(feat.data.data.level.max),
            };
            folder_list.push(doc);
          }
        }
      }
      this.feat = {
        awail: pack_list.concat(folder_list.filter((item) => pack_list.indexOf(item) < 0)),
        current: Object.values(foundry.utils.deepClone(this.object.data.data.req.values.filter((item) => item.type === "feature"))),
      };
      for (let [k, v] of Object.entries(CONFIG.ARd20.abilities)) {
        this.data.push({
          name: game.i18n.localize(CONFIG.ARd20.abilities[k]) ?? k,
          value: k,
          type: "ability",
        });
      }
      for (let [k, v] of Object.entries(CONFIG.ARd20.skills)) {
        this.data.push({
          name: game.i18n.localize(CONFIG.ARd20.skills[k]) ?? k,
          value: k,
          type: "skill",
        });
      }
      let name_array = [];
      for (let i of this.feat.current) {
        name_array.push(i.name);
      }
      console.log(this.feat.awail);
      for (let [k, v] of Object.entries(this.feat.awail)) {
        if (v.name === this.object.name) {
          console.log(v.name, " matches name of the feat");
          this.feat.awail.splice(k, 1);
        } else if (name_array.includes(v.name)) {
          console.log(v.name, "this feat is already included", k);
          v.input = this.feat.current[this.feat.current.indexOf(this.feat.current.filter((item) => item.name === v.name)[0])].input;
          this.feat.awail.splice(k, 1);
        }
        console.log(this.feat.awail);
        if (this.feat.awail.filter((item) => item.name === v.name).length !== 0) {
          console.log(this.feat.awail.filter((item) => item.name === v.name));
          console.log(v.name);
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
    for (let i of this.data) {
      name_array.push(i.name);
    }
    /**
     * Data created
     */
    for (let [k, value] of Object.entries(this.req.values)) {
      this.req.values[k].type = this.formApp?.values?.[k]?.type ? this.formApp?.values?.[k]?.type : this.req.values[k].type || "ability";

      let subtype_list = this.data.filter((item) => item.type === this.req.values[k].type);
      this.req.values[k].name =
        subtype_list.filter((item) => item.name === this.formApp?.values?.[k]?.name).length > 0
          ? this.formApp?.values?.[k]?.name || this.req.values[k].name
          : this.req.values[k].name || subtype_list[0].name;
      this.req.values[k].subtype_list = [];
      subtype_list.forEach((item) => this.req.values[k].subtype_list.push(item.name));
      this.req.values[k].input = this.formApp?.values?.[k]?.input ? this.formApp?.values?.[k]?.input : this.req.values[k].input || "";
      if (this.req.values[k].type === "feat") {
        this.req.values[k].maxLevel = this.data.filter((item) => item.name === this.req.values[k].name)[0].maxLevel;
      }
      this.req.values[k].input = this.req.values[k].input || [];

      for (let i = 0; i < this.object.data.data.level.max; i++) {
        console.log(this.req.values[k].input[i], this.formApp?.values?.[k]?.input[i]);
        this.req.values[k].input[i] = this.req.values[k].type !== "skill"
          ? Number(this.req.values[k].input[i]) || 10
          : this.req.values[k].input[i] > 2
          ? 1
          : this.req.values[k].input[i] || 1;

        if (this.req.values[k].input[i + 1] < this.req.values[k].input[i]) {
          this.req.values[k].input[i + 1] = this.req.values[k].input[i];
        }
      }
    }
    for (let [k, value] of Object.entries(this.req.logic)) {
      this.req.logic[k] = this.formApp?.logic?.[k] ? this.formApp.logic[k] : this.req.logic[k];
    }
    this.formApp = this.req;
    this.prof = Object.values(CONFIG.ARd20.prof)
      .slice(1)
      .reduce((result, item, index, array) => {
        result[index + 1] = item;
        return result;
      }, {});
    const FormData = {
      data: this.data,
      type: this.type_list,
      config: CONFIG.ARd20,
      req: this.req,
      formApp: this.formApp,
      prof: this.prof,
    };
    console.log("FormData", FormData);
    console.log("Form html", this.form);
    return FormData;
  }
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".item-create").click(this._onAdd.bind(this));
    html.find(".item-delete").click(this._Delete.bind(this));
  }
  async _onAdd(event) {
    event.preventDefault();
    const req = this.req;
    req.values.push({});
    this.render();
  }
  async _Delete(event) {
    event.preventDefault();
    const req = this.req;
    req.values.splice(event.currentTarget.dataset.key, 1);
    this.render();
  }
  _onChangeInput(event) {
    super._onChangeInput(event);
    const k = event.currentTarget.dataset.key;
    const i = event.currentTarget.dataset.order;
    console.log(foundry.utils.expandObject(this._getSubmitData()));
    const req = foundry.utils.expandObject(this._getSubmitData()).req;
    switch (event.currentTarget.dataset.type) {
      case "value":
        this.formApp.values[k].type = req.values[k].type;
        this.formApp.values[k].name = req.values[k].name;
        this.formApp.values[k].input[i] = req.values[k].input[i];
        break;
      case "logic":
        this.formApp.logic[k] = req.logic[k];
        break;
    }
    this.getData();
    this.render();
  }

  async _updateObject(event, formData) {
    const item = this.object;
    this.render();
    const obj = {};
    obj["data.req.values"] = this.req.values
    obj["data.req.logic"] = this.req.logic;
    console.log(obj);
    await item.update(obj);
  }
}
