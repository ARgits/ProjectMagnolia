export class CharacterAdvancement extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ard20"],
      title: "Character Advancement",
      template: "systems/ard20/templates/app/cha-adv.html",
      id: "cha-adv",
      width: 800,
      height: "auto",
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "stats",
        },
      ],
    });
  }
  async getData(options) {
    if (!this.data) {
      this.data = {};
      this.data.abilities = duplicate(this.object.data.data.abilities);
      this.data.skills = duplicate(this.object.data.data.skills);
      this.data.xp = duplicate(this.object.data.data.attributes.xp);
      this.data.profs = duplicate(this.object.data.data.profs);
      this.data.count = {
        skills: {
          0: 0,
          1: 0,
          2: 0,
        },
        feats: {
          mar: 0,
          mag: 0,
          div: 0,
          pri: 0,
          psy: 0,
        },
      };
      this.data.content = {
        skills: {},
        feats: {},
      };
      this.data.feats = {
        learned: [], //items that character already has
        awail: [], //items that character can purchase
      };
      let feat_list = [];
      let temp_feat_list = [];
      /*get items from Compendiums. In settings 'feat'.packs you input name of needed Compendiums*/
      for (let key of game.settings.get("ard20", "feat").packs) {
        if (game.packs.filter((pack) => pack.metadata.label === key).length !== 0) {
          feat_list.push(Array.from(game.packs.filter((pack) => pack.metadata.label === key && pack.metadata.entity === "Item")[0].index));
          feat_list = feat_list.flat();
          for (let feat of feat_list) {
            let new_key = game.packs.filter((pack) => pack.metadata.label === key)[0].metadata.package + "." + key;
            let doc = await game.packs.get(new_key).getDocument(feat._id);
            let item = doc.toObject();
            temp_feat_list.push(item);
            temp_feat_list = temp_feat_list.flat();
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
            console.log("item added from folder ", feat);
            let item = feat.toObject();
            console.log(item);
            temp_feat_list.push(item);
          }
          temp_feat_list = temp_feat_list.flat();
        }
      }
      temp_feat_list = temp_feat_list.filter((item) => item.type === "feature" || item.type === "spell");
      this.data.feats.learned = foundry.utils.deepClone(this.object.data.items);
      this.data.feats.learned = this.data.feats.learned.filter((item) => item.data.type === "feature" || item.data.type === "spell");
      let name_array = [];
      for (let i of this.data.feats.learned) {
        name_array.push(i.data.name);
      }
      for (let [k, v] of Object.entries(temp_feat_list)) {
        if (name_array.includes(v.name)) {
          temp_feat_list[k] = this.data.feats.learned.filter((item) => item.name === v.name)[0].data.toObject();
          console.log("this item is already learned", temp_feat_list[k]);
        }
        temp_feat_list[k].data.level.max = temp_feat_list[k].data.level.has ? temp_feat_list[k].data.level.max || 4 : 1;
        temp_feat_list[k].data.level.current = temp_feat_list[k].data.level.initial;
        if (temp_feat_list[k].data.level.max > 1) {
          let n = (10 - temp_feat_list[k].data.level.max) / temp_feat_list[k].data.level.max;
          let m = 1.7 + (Math.round(Number((Math.abs(n) * 100).toPrecision(15))) / 100) * Math.sign(n);
          if (temp_feat_list[k].data.xp.length < temp_feat_list[k].data.level.max) {
            for (let i = 1; i < temp_feat_list[k].data.level.max; i++) {
              temp_feat_list[k].data.xp.push(Math.round((temp_feat_list[k].data.xp[i - 1] * m) / 5) * 5);
            }
          } else {
            for (let i = 1; i < temp_feat_list[k].data.level.max; i++) {
              temp_feat_list[k].data.xp[i] = Math.round((temp_feat_list[k].data.xp[i - 1] * m) / 5) * 5;
            }
          }
        } else temp_feat_list[k].data.level.xp = temp_feat_list[k].data.xp[0];
        temp_feat_list[k].data.source.label = game.i18n.localize(CONFIG.ARd20.source[temp_feat_list[k].data.source.value]);
      }
      temp_feat_list = temp_feat_list.filter(
        (item) =>
          ((item.type === "feature" || item.type === "spell") && !name_array.includes(item.name)) || item.data.level.current !== item.data.level.max
      );
      this.data.feats.awail = temp_feat_list;
      for (let [k, v] of Object.entries(CONFIG.ARd20.skills)) {
        if (this.data.skills[k].prof === 0) {
          this.data.count.skills[0] += 1;
        } else if (this.data.skills[k].prof === 1) {
          this.data.count.skills[1] += 1;
        } else if (this.data.skills[k].prof === 2) {
          this.data.count.skills[2] += 1;
        }
      }
      for (let [k, v] of Object.entries(this.data.feats.learned)) {
        if (v.data.data.source?.value === "mar") {
          this.data.count.feats.mar += 1;
        } else if (v.data.data.source?.value === "div") {
          this.data.count.feats.div += 1;
        } else if (v.data.data.source?.value === "mag") {
          this.data.count.feats.mag += 1;
        } else if (v.data.data.source?.value === "pri") {
          this.data.count.feats.pri += 1;
        } else if (v.data.data.source?.value === "psy") {
          this.data.count.feats.psy += 1;
        }
      }
      this.data.hover = {
        value: "",
        name: "",
      };
      console.log(this.data.feats.learned);
      console.log(this.data.feats.awail);
    }
    this.data.count.feats.all = 0;
    this.data.count.feats.all = Object.values(this.data.count.feats).reduce(function (a, b) {
      return a + b;
    }, 0);
    for (let [k, v] of Object.entries(CONFIG.ARd20.abilities)) {
      this.data.abilities[k].mod = Math.floor((this.data.abilities[k].value - 10) / 2);
      this.data.abilities[k].xp = CONFIG.ARd20.abil_xp[this.data.abilities[k].value - 5];
      this.data.abilities[k].isEq = this.data.abilities[k].value === this.object.data.data.abilities[k].value ? true : false;
      this.data.abilities[k].isXP = this.data.xp.get >= this.data.abilities[k].xp ? false : true;
    }
    for (let [k, v] of Object.entries(CONFIG.ARd20.skills)) {
      this.data.skills[k].hover = game.i18n.localize(CONFIG.ARd20.prof[this.data.skills[k].prof]) ?? this.data.skills[k].prof;
      this.data.skills[k].xp =
        this.data.skills[k].prof < 2 ? CONFIG.ARd20.skill_xp[this.data.skills[k].prof][this.data.count.skills[this.data.skills[k].prof + 1]] : false;
      this.data.skills[k].isEq = this.data.skills[k].prof === this.object.data.data.skills[k].prof ? true : false;
      this.data.skills[k].isXP = this.data.xp.get >= this.data.skills[k].xp && this.data.skills[k].prof < 2 ? false : true;
      for (let [k, v] of Object.entries(this.data.profs.weapon)) {
        v.value_hover = game.i18n.localize(CONFIG.ARd20.prof[v.value]) ?? CONFIG.ARd20.prof[v.value];
      }
    }
    for (let [key, object] of Object.entries(this.data.feats.awail)) {
      let allCount = this.data.count.feats.all;
      let featCount = this.data.count.feats[object.data.source.value];
      object.data.level.xp = object.data.xp[object.data.level.initial]
        ? Math.ceil((object.data.xp[object.data.level.initial] * (1 + 0.01 * (allCount - featCount))) / 5) * 5
        : 0;
      object.isEq = object.data.level.initial === object.data.level.current || object.data.level.initial === 0 ? true : false;
      object.isXP = object.data.level.initial === object.data.level.max || object.data.level.xp > this.data.xp.get ? true : false;
      for (let [key, ability] of Object.entries(object.data.req.abilities)) {
        ability.pass = ability.value <= this.data.abilities[key].value ? true : false;
        object.pass = ability.pass ? object.pass ?? true : false;
        object.isXP = ability.pass ? object.isXP : true;
      }
      for (let [key, skill] of Object.entries(object.data.req.skills)) {
        skill.pass = skill.prof <= this.data.skills[key].prof ? true : false;
        object.pass = skill.pass ? object.pass ?? true : false;
        object.isXP = skill.pass ? object.isXP : true;
      }
      for (let [key, feat] of Object.entries(object.data.req.feats)) {
        if (this.data.feats.awail.filter((item) => item.name === feat.name)?.[0] !== undefined) {
          feat.pass = feat.level <= this.data.feats.awail.filter((item) => item.name === feat.name)[0].data.level.initial ? true : false;
        } else if (this.data.feats.learned.filter((item) => item.name === feat.name)?.[0] !== undefined) {
          feat.pass = feat.level <= this.data.feats.learned.filter((item) => item.name === feat.name)[0].data.data.level.initial ? true : false;
        }
        object.pass = feat.pass ? object.pass ?? true : false;
        object.isXP = feat.pass ? object.isXP : true;
      }
    }

    const templateData = {
      abilities: this.data.abilities,
      xp: this.data.xp,
      skills: this.data.skills,
      count: this.data.count,
      content: this.data.content,
      hover: this.data.hover,
      profs: this.data.profs,
      feats: this.data.feats,
    };
    console.log(templateData);
    return templateData;
  }
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".change").click(this._onChange.bind(this));
    html.find(".skill").mouseover(this._onHover.bind(this));
  }
  _onChange(event) {
    const button = event.currentTarget;
    const data = this.data;
    switch (button.dataset.type) {
      case "ability":
        switch (button.dataset.action) {
          case "plus":
            data.abilities[button.dataset.key].value += 1;
            data.xp.get -= data.abilities[button.dataset.key].xp;
            data.xp.used += data.abilities[button.dataset.key].xp;
            break;
          case "minus":
            data.abilities[button.dataset.key].value -= 1;
            data.xp.get +=
              CONFIG.ARd20.abil_xp[data.abilities[button.dataset.key].value - 5] ??
              CONFIG.ARd20.abil_xp[data.abilities[button.dataset.key].value - 5];
            data.xp.used -=
              CONFIG.ARd20.abil_xp[data.abilities[button.dataset.key].value - 5] ??
              CONFIG.ARd20.abil_xp[data.abilities[button.dataset.key].value - 5];
            break;
        }
        break;
      case "skill":
        switch (button.dataset.action) {
          case "plus":
            data.skills[button.dataset.key].prof += 1;
            data.xp.get -= data.skills[button.dataset.key].xp;
            data.xp.used += data.skills[button.dataset.key].xp;
            this.data.count.skills[this.data.skills[button.dataset.key].prof] += 1;
            break;
          case "minus":
            data.skills[button.dataset.key].prof -= 1;
            this.data.count.skills[this.data.skills[button.dataset.key].prof + 1] -= 1;
            data.xp.get +=
              CONFIG.ARd20.skill_xp[data.skills[button.dataset.key].prof][this.data.count.skills[this.data.skills[button.dataset.key].prof + 1]];
            data.xp.used -=
              CONFIG.ARd20.skill_xp[data.skills[button.dataset.key].prof][this.data.count.skills[this.data.skills[button.dataset.key].prof + 1]];
            break;
        }
        break;
      case "prof":
        switch (button.dataset.action) {
          case "plus":
            data.profs.weapon[button.dataset.key].value += 1;
            break;
          case "minus":
            data.profs.weapon[button.dataset.key].value -= 1;
            break;
        }
        break;
      case "feat":
        switch (button.dataset.action) {
          case "plus":
            data.count.feats[data.feats.awail[button.dataset.key].data.source.value] +=
              data.feats.awail[button.dataset.key].data.level.initial === 0 ? 1 : 0;
            data.feats.awail[button.dataset.key].data.level.initial += 1;
            data.xp.get -= data.feats.awail[button.dataset.key].data.level.xp;
            data.xp.used += data.feats.awail[button.dataset.key].data.level.xp;
            break;
          case "minus":
            data.feats.awail[button.dataset.key].data.level.initial -= 1;
            data.count.feats[data.feats.awail[button.dataset.key].data.source.value] -=
              data.feats.awail[button.dataset.key].data.level.initial === 0 ? 1 : 0;
            data.xp.get += data.feats.awail[button.dataset.key].data.xp[data.feats.awail[button.dataset.key].data.level.initial];
            data.xp.used -= data.feats.awail[button.dataset.key].data.xp[data.feats.awail[button.dataset.key].data.level.initial];
            break;
        }
    }
    this.render();
  }
  _onHover(event) {
    const button = event.currentTarget;
    const content = this.data.content;
    switch (button.dataset.type) {
      case "skill":
        this.data.hover.value = TextEditor.enrichHTML(
          content.skills.value?.content.filter((skill) => skill.data.name === button.dataset.label)[0].data.content
        );
        this.data.hover.name = button.dataset.label;
        break;
    }
    this.render();
  }
  async _updateObject(event, formData) {
    let updateData = expandObject(formData);
    console.log(updateData);
    const actor = this.object;
    this.render();
    const obj = {};
    obj["data.abilities"] = updateData.abilities;
    obj["data.attributes.xp"] = updateData.xp;
    obj["data.skills"] = updateData.skills;
    obj["data.profs"] = updateData.profs;
    console.log(obj);
    const feats_data = {
      new: [],
      exist: [],
    };
    const feats = this.data.feats.awail.filter((item) => item.data.level.initial > item.data.level.current);
    for (let [k, v] of Object.entries(feats)) {
      v.data.level.current = v.data.level.initial;
      if (this.data.feats.learned.length > 0) {
        for (let [n, m] of Object.entries(this.data.feats.learned)) {
          if (v._id === m.id) {
            feats_data.exist.push(v); //{_id:v.id,data:v.ItemData}
          } else {
            feats_data.new.push(v);
          }
        }
      } else {
        feats_data.new.push(v);
      }
    }
    console.log("update", feats_data.new);
    let pass = [];
    for (let [k, v] of Object.entries(feats_data.exist)) {
      pass.push(v.pass);
    }
    for (let [k, v] of Object.entries(feats_data.new)) {
      pass.push(v.pass);
    }
    if (pass.includes(false)) {
      ui.notifications.error(`Some changes do not comply with the requirements`);
    } else {
      await actor.update(obj);
      if (feats_data.exist.length > 0) {
        await actor.updateEmbeddedDocuments(
          "Item",
          feats_data.exist.map((item) => ({
            _id: item._id,
            "data.level.initial": item.data.level.initial,
          }))
        );
      }
      if (feats_data.new.length > 0) {
        await actor.createEmbeddedDocuments("Item", feats_data.new);
      }
    }
  }
}
