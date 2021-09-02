export class FeatRequirements extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ard20"],
      title: "Feature Requirements",
      template: "systems/ard20/templates/app/feat_req.html",
      id: "feat_req",
      width: 500,
      height: "auto",
      submitOnChange:true,
      closeOnSubmit:false
    });
  }
  async getData(options) {
    if (!this.data) {
      console.log('ПЕРВЫЙ ЗАПУСК')
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
        current: Object.values(foundry.utils.deepClone(this.object.data.data.req.filter((item) => item.type === "feat"))),
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
      for (let [k, v] of Object.entries(this.feat.awail)) {
        if (v.name === this.object.name) {
          this.feat.awail.splice(k, 1);
        } else if (name_array.includes(v.name)) {
          console.log(v.name, "эта фича уже есть");
          v.level = this.feat.current[this.feat.current.indexOf(this.feat.current.filter((item) => item.name === v.name)[0])].level;
          this.feat.awail.splice(k, 1);
        }
        if (this.feat.awail[k]) {
          this.data.push({
            name: v.name,
            type: "feat",
            level: v.level ?? 0,
          });
        }
      }
    }
    console.log('ДАТА СОЗДАНА')
    let name_array = [];
    for (let i of this.data) {
      name_array.push(i.name);
    }
    for (let [k, v] of Object.entries(this.req)) {
      console.log(k, v);
      this.req[k].type = v.type || "ability";
      let subtype_list = this.data.filter((item) => item.type === v.type);
      this.req[k].name = subtype_list.filter((item) => item.name === v.name) ? v.name : subtype_list[0];
      console.log(subtype_list);
      this.req[k].subtype_list = [];
      subtype_list.forEach((item) => this.req[k].subtype_list.push(item.name));
      if (!this.req[k].subtype_list.includes(v.name)) {
        this.req[k].subtype_list.push(v.name);
      }
    }
    const FormData = {
      data: this.data,
      type: this.type_list,
      config: CONFIG.ARd20,
      req: this.req,
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
    req.push({
      type: "ability",
      name: "Strength",
      level: 0,
    });
    this.render();
  }
  async _Delete(event) {
    event.preventDefault();
    const req = this.req;
    req.splice(event.currentTarget.dataset.key, 1);
    this.render();
  }
 /* _onChangeInput(event) {
    super._onChangeInput(event);
    const k = event.currentTarget.dataset.key;
    console.log(foundry.utils.expandObject(this._getSubmitData()));
    const req = foundry.utils.expandObject(this._getSubmitData()).req[k];
    this.req[k].type = req.type;
    this.form.querySelector(`select[data-type='type'][data-key='${k}']`).value = this.req[k].type;
    console.log(this.form.querySelector(`select[data-type='type'][data-key='${k}']`).value);
  }*/
  _getLvlReq(req, maxLevel) {
    let level = req.type !== "skill" ? req.input.match(/\d*/g) : req.input.match(/(basic)|(master)/g);
    if(!level) return
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
    for (let [key, req] of Object.entries(updateData.req)) {
      req.level = this._getLvlReq(req, item.data.data.level.max);
      req.level?.forEach((r, index) => (req.level[index] = parseInt(r)));
    }
    obj["reqs"] = updateData?.req;
    console.log(obj);
  }
}
