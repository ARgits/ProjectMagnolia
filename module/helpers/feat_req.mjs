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
          initial: "abilities",
        },
      ],
    });
  }
  async getData(options) {
    if (!this.data) {
      this.data = {};
      this.data.abilities = foundry.utils.deepClone(this.object.data.data.req.abilities);
      this.data.skills = foundry.utils.deepClone(this.object.data.data.req.skills);
      let pack_list = [];
      let folder_list = [];
      /*get items from Compendiums. In settings 'feat'.packs you input name of needed Compendiums*/
      for (let key of game.settings.get("ard20", "feat").packs) {
        if (game.packs.filter((pack) => pack.metadata.label === key).length !== 0) {
          let feat_list = [];
          feat_list.push(Array.from(game.packs.filter((pack) => pack.metadata.label === key && pack.metadata.entity === "Item")[0].index));
          feat_list = feat_list.flat();
          for (let feat of feat_list) {
            let doc = {
              name: duplicate(feat.name),
              maxLevel: duplicate(feat.data.data.level.max),
            };
            pack_list.push(doc);
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
      this.data.feats = {
        awail: pack_list.concat(folder_list.filter((item) => pack_list.indexOf(item) < 0)),
        current: Object.values(foundry.utils.deepClone(this.object.data.data.req.feats)),
      };
      for (let [k, v] of Object.entries(this.data.abilities)) {
        v.label = game.i18n.localize(CONFIG.ARd20.abilities[k]) ?? k;
      }
      for (let [k, v] of Object.entries(this.data.skills)) {
        if (v.label === undefined) {
          console.log(v);
          this.data.skills[k] = null;
        } else {
          v.label = game.i18n.localize(CONFIG.ARd20.skills[k]) ?? k;
        }
      }
      let name_array = [];
      for (let i of this.data.feats.current) {
        name_array.push(i.name);
      }
      for (let [k, v] of Object.entries(this.data.feats.awail)) {
        if (v.name === this.object.name) {
          this.data.feats.awail.splice(k, 1);
        } 
      }
    }
    const FormData = {
      abilities: this.data.abilities,
      skills: this.data.skills,
      feats: this.data.feats,
      config: CONFIG.ARd20,
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
    const feats = this.data.feats;
    if (feats.awail.length !== feats.current.length) {
      feats.current.push(feats.awail[0]);
    } else ui.notifications.warn("There is no more feats awailable", { permanent: true });
    this.render();
  }
  async _Delete(event) {
    event.preventDefault();
    const feats = this.data.feats;
    feats.current.splice(event.currentTarget.dataset.key, 1);
    this.render();
  }

  async _updateObject(event, formData) {
    let updateData = expandObject(formData);
    console.log(updateData);
    const item = this.object;
    this.render();
    const obj = {};
    obj["data.req.abilities"] = updateData?.abilities;
    obj["data.req.skills"] = updateData?.skills;
    obj["data.req.feats"] = updateData?.feats.current;
    console.log(obj);
    await item.update(obj);
  }
}
