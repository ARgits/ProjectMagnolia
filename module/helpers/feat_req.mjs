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
      this.data.abilities = duplicate(this.object.data.data.req.abilities);
      this.data.skills = duplicate(this.object.data.data.req.skills);
      let pack_list = [];
      let folder_list = [];
      /*get items from Compendiums. In settings 'feat'.packs you input name of needed Compendiums*/
      for (let key of game.settings.get("ard20", "feat").packs) {
        if (game.packs.filter((pack) => pack.metadata.label === key).length !== 0) {
          let feat_list = [];
          feat_list.push(Array.from(game.packs.filter((pack) => pack.metadata.label === key && pack.metadata.entity === "Item")[0].index));
          feat_list = feat_list.flat();
          for (let feat of feat_list) {
            pack_list.push(feat.name);
          }
        }
      }
      console.log("packs", pack_list);
      /* same as above, but for folders*/
      for (let key of game.settings.get("ard20", "feat").folders) {
        if (game.folders.filter((folder) => folder.data.name === key).length !== 0) {
          let feat_list = [];
          feat_list.push(game.folders.filter((folder) => folder.data.name === key && folder.data.type === "Item")[0].content);
          feat_list = feat_list.flat();
          for (let feat of feat_list) {
            folder_list.push(feat.name);
          }
        }
      }
      console.log("folders", folder_list);
      this.data.feats = pack_list.concat(folder_list.filter((item) => pack_list.indexOf(item) < 0));
    }
    const FormData = {
      abilities: this.data.abilities,
      skills: this.data.skills,
      feats: this.data.skills,
    };
    console.log(FormData);
  }
  activateListeners(html) {}
  async _updateObject(event, formData) {}
}
