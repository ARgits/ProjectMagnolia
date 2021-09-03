export class FeatRequirements extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ard20"],
      title: "Feature Requirements",
      template: "systems/ard20/templates/app/feat_req.html",
      id: "feat_req",
      width: 500,
      height: "auto",
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "core",
        },
      ],
    });
  }
  async getData(options) {
    if (!this.data) {
      console.log("ПЕРВЫЙ ЗАПУСК");
      this.formApp = null;
      this.data = [];
      this.req = foundry.utils.deepClone(this.object.data.data.req);
      let pack_list = [];
      let folder_list = [];
      this.type_list = ["ability", "skill", "feat"];
      /*get items from Compendiums. In settings 'feat'.packs you input name of needed Compendiums*/
      for (let key of game.settings.get("ard20", "feat").packs) {
        if (game.packs.filter((pack) => pack.metadata.label === key).length !== 0) {
          let feat_list = [];
          feat_list.push(Array.from(game.packs.filter((pack) => pack.metadata.label === key && pack.metadata.entity === "Item")[0].index));
          feat_list = feat_list.flat();
          for (let feat of feat_list) {
            let new_key = game.packs.filter((pack) => pack.metadata.label === key)[0].metadata.package + "." + key;
            let doc = await game.packs.get(new_key).getDocument(feat._id);
            let item = {
              name: duplicate(feat.name),
              maxLevel: duplicate(doc.data.data.level.max),
            };
            pack_list.push(item);
          }
        }
      }
      /* same as above, but for folders*/
      for (let key of game.settings.get("ard20", "feat").folders) {
        if (game.folders.filter((folder) => folder.data.name === key).length !== 0) {
          let feat_list = [];
          feat_list.push(game.folders.filter((folder) => folder.data.name === key && folder.data.type === "Item")[0].content);
          feat_list = feat_list.flat();
          for (let feat of feat_list) {
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
        current: Object.values(foundry.utils.deepClone(this.object.data.data.req.values.filter((item) => item.type === "feat"))),
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
          console.log(v.name, "имя совпадает", k);
          this.feat.awail.splice(k, 1);
        } else if (name_array.includes(v.name)) {
          console.log(v.name, "эта фича уже есть", k);
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
            input: v.level ?? 0,
            maxLevel: v.maxLevel,
          });
        }
      }
    }
    console.log("ДАТА СОЗДАНА");
    let name_array = [];
    for (let i of this.data) {
      name_array.push(i.name);
    }
    for (let [k, value] of Object.entries(this.req.values)) {
      console.log(k, value);
      this.req.values[k].type = this.formApp?.values?.[k]?.type ? this.formApp?.values?.[k]?.type : this.req.values[k].type || "ability";
      let subtype_list = this.data.filter((item) => item.type === this.req.values[k].type);
      console.log(subtype_list);
      this.req.values[k].name =
        subtype_list.filter((item) => item.name === this.formApp?.values?.[k]?.name).length > 0
          ? this.formApp?.values?.[k]?.name || this.req.values[k].name
          : subtype_list[0].name;
      this.req.values[k].subtype_list = [];
      subtype_list.forEach((item) => this.req.values[k].subtype_list.push(item.name));
      this.req.values[k].input = this.formApp?.values?.[k]?.input ? this.formApp?.values?.[k]?.input : this.req.values[k].input || "";
      if (this.req.values[k].type === "feat")
        this.req.values[k].maxLevel = this.data.filter((item) => item.name === this.req.values[k].name)[0].maxLevel;
    }
    for (let [k, value] of Object.entries(this.req.logic)) {
      this.req.logic[k] = this.formApp?.logic?.[k] ? this.formApp.logic[k] : this.req.logic[k];
    }
    this.formApp = this.req;
    const FormData = {
      data: this.data,
      type: this.type_list,
      config: CONFIG.ARd20,
      req: this.req,
      formApp: this.formApp,
    };
    console.log(FormData);
    console.log(this.form);
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
    req.values.push({
      type: "ability",
      name: "Strength",
      input: "",
    });
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
    console.log(foundry.utils.expandObject(this._getSubmitData()));
    const req = foundry.utils.expandObject(this._getSubmitData()).req;
    switch (event.currentTarget.dataset.type) {
      case "value":
        this.formApp.values[k].type = req.values[k].type;
        this.formApp.values[k].name = req.values[k].name;
        this.formApp.values[k].input = req.values[k].input;
        break;
      case "logic":
        this.formApp.logic[k] = req.logic[k];
    }
    this.getData();
    this.render();
  }
  _getLvlReq(req, maxLevel) {
    let level = req.type !== "skill" ? req.input.match(/\d*/g) : req.input.match(/(basic)|(master)/g);
    if (!level) return;
    if (req.type === "skill") {
      let list = level;
      level = [];
      for (let [key, item] of Object.entries(list)) {
        if (item === "basic") level.push(list[key].replace(/basic/g, 1));
        if (item === "master") level.push(list[key].replace(/master/g, 2));
      }
    }
    level = level.filter((item) => item !== "");
    for (let i = level.length; maxLevel > level.length; i++) {
      level.push(level[i - 1]);
    }
    for (let i = level.length; maxLevel < level.length; i--) {
      level.splice(level.length - 1, 1);
    }
    return level;
  }
  async _updateObject(event, formData) {
    let updateData = expandObject(formData);
    console.log(updateData);
    const item = this.object;
    this.render();
    const obj = {};
    for (let [key, req] of Object.entries(updateData.req.values)) {
      req.level = this._getLvlReq(req, item.data.data.level.max);
      req.level?.forEach((r, index) => (req.level[index] = parseInt(r) ?? 0));
      switch (req.type) {
        case "ability":
          for (let [key, v] of Object.entries(CONFIG.ARd20.abilities)) {
            if (req.name === game.i18n.localize(CONFIG.ARd20.abilities[key])) req.value = key;
          }
          break;
        case "skill":
          for (let [key, v] of Object.entries(CONFIG.ARd20.skills)) {
            if (req.name === game.i18n.localize(CONFIG.ARd20.skills[key])) req.value = key;
          }
          break;
      }
    }
    for (let i = updateData?.req.logic.length; item.data.data.level.max > updateData?.req.logic.length; i++) {
      updateData?.req.logic.push(level[i - 1]);
    }
    for (let i = updateData?.req.logic.length; item.data.data.level.max < updateData?.req.logic.length; i--) {
      updateData?.req.logic.splice(updateData?.req.logic.length - 1, 1);
    }
    obj["data.req.values"] = Object.values(updateData?.req.values);
    obj["data.req.logic"] = Object.values(updateData?.req.logic);
    console.log(obj);
    await item.update(obj);
  }
}
