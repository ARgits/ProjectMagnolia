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
                  name:duplicate(feat.name),
              }
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
                name:duplicate(feat.name),
            }
            folder_list.push(doc);
          }
        }
      }
      this.data.feats = pack_list.concat(folder_list.filter((item) => pack_list.indexOf(item) < 0));
      for (let [k, v] of Object.entries(this.data.abilities)) {
        v.label = game.i18n.localize(CONFIG.ARd20.abilities[k]) ?? k;
      }
      for (let [k, v] of Object.entries(this.data.skills)) {
          if(v.label===undefined){
              console.log(v)
              delete v
          }else {v.label = game.i18n.localize(CONFIG.ARd20.skills[k]) ?? k;}
        
      }
    }
    const FormData = {
      abilities: this.data.abilities,
      skills: this.data.skills,
      feats: this.data.feats,
      config: CONFIG.ARd20
    };
    console.log(FormData);
    return FormData;
  }
  activateListeners(html) {}
  async _updateObject(event, formData) {
    let updateData = expandObject(formData);
    console.log(updateData);
    const item = this.object
    this.render();
    const obj = {};
    obj["data.req.abilities"] = updateData?.abilities;
    obj["data.req.skills"] = updateData?.skills;
    obj["data.req.feats"] = updateData?.feats;
    console.log(obj);
    await item.update(obj);
  }
}
