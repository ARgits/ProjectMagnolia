export class FeatRequirements extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ard20"],
      title: "Feature Requirements",
      template: "systems/ard20/templates/app/feat_req.html",
      id: "feat_req",
      width: 500,
      height: "auto",
    });
  }
  async getData(options) {
    if (!this.data) {
      this.data = [];
      this.req = foundry.utils.deepClone(this.object.data.data.req);
      let pack_list = [];
      let folder_list = [];
      let type_list = ["ability", "skill", "feat"];
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
          k: {
            name: game.i18n.localize(CONFIG.ARd20.abilities[k]) ?? k,
            value: k,
            type: "ability",
          },
        });
      }
      for (let [k, v] of Object.entries(CONFIG.ARd20.skills)) {
        this.data.push({
          k: {
            name: game.i18n.localize(CONFIG.ARd20.skills[k]) ?? k,
            value: k,
            type: "skill",
          },
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
            level: v.level,
          });
        }
      }
    }
    let name_array = [];
    for (let i of this.data) {
      name_array.push(i.name);
    }
    for (let [k, v] of Object.entries(this.data)) {
      let subtype_list = this.data.filter((item) => item.type === v.type);
      v.subtype_list = subtype_list.forEach(item=>subtype_list[item]=item.name)
      if (!v.subtype_list.includes(v.name)) {
        v.subtype_list.push(v.name);
      }
    }

    const FormData = {
      type: type_list,
      config: CONFIG.ARd20,
      req: this.req,
    };
    console.log(FormData);
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
      name: "str",
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
  _getLvlReq(input, maxLevel) {
    let level = re.type !== "skill" ? req.input.match(/\d*/g) : req.input.match(/(basic)|(master)/g);
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
      req.level.forEach((r, index) => (req.level[index] = parseInt(r)));
    }
    obj["reqs"] = updateData?.req;
    console.log(obj);
    await item.update(obj);
  }
}
