export class CharacterAdvancement extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ard20"],
      title: "Character Advancement",
      template: "systems/ard20/templates/actor/parts/actor-adv.html",
      id: "actor-adv",
      width: 1000,
      height: "auto",
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "stats",
        },
      ],
      closeOnSubmit: false,
    });
  }
  async getData(options) {
    if (!this.data) {
      this.data = {
        isReady: duplicate(this.object.data.data.isReady), // check, if the character is ready
        abilities: duplicate(this.object.data.data.abilities),
        skills: duplicate(this.object.data.data.skills),
        xp: duplicate(this.object.data.data.attributes.xp),
        profs: duplicate(this.object.data.data.profs),
        health: duplicate(this.object.data.data.health),
        races: { list: [], chosen: null },
        count: {
          // counter for skills and feats
          skills: {
            // count skills by their level
            0: 0,
            1: 0,
            2: 0,
          },
          feats: {
            // count feats by their source
            mar: 0,
            mag: 0,
            div: 0,
            pri: 0,
            psy: 0,
          },
        },
        content: {
          // descriptions for skills and feats
          skills: {},
          feats: {},
        },
        feats: {
          learned: [], // array of feats that have been learned
          awail: [], // array of feats that are available to learn
        },
        allow: {
          ability: false,
          race: false,
          final: false,
        },
        hover: {
          ability: null,
          skill: null,
          race: null,
          feat: null,
        },
      };
      let pack_list = []; // array of feats from Compendium
      let pack_name = [];
      let folder_list = []; // array of feats from game folders
      let folder_name = [];
      let temp_feat_list = []; // final array of feats
      this.data.xp.get = this.data.isReady || this.data.xp.used !== 0 ? this.data.xp.get : 10000;
      for (let key of game.settings.get("ard20", "feat").packs) {
        if (game.packs.filter((pack) => pack.metadata.label === key).length !== 0) {
          let feat_list = [];
          feat_list.push(Array.from(game.packs.filter((pack) => pack.metadata.label === key && pack.metadata.type === "Item")[0].index));
          feat_list = feat_list.flat();
          for (let feat of feat_list) {
            let new_key = game.packs.filter((pack) => pack.metadata.label === key)[0].metadata.package + "." + key;
            let doc = await game.packs.get(new_key).getDocument(feat._id);
            let item = doc.toObject();
            item.data = foundry.utils.deepClone(doc.data.data);
            pack_list.push(item);
            pack_name.push(item.name);
          }
          pack_list = pack_list.flat();
        }
      }
      /*
       * Same as above, but for folders
       */
      for (let key of game.settings.get("ard20", "feat").folders) {
        if (game.folders.filter((folder) => folder.data.name === key).length !== 0) {
          let feat_list = [];
          feat_list.push(game.folders.filter((folder) => folder.data.name === key && folder.data.type === "Item")[0].content);
          feat_list = feat_list.flat();
          for (let feat of feat_list) {
            console.log("item added from folder ", feat);
            let item = feat.toObject();
            item.data = foundry.utils.deepClone(feat.data.data);
            folder_list.push(item);
            folder_name.push(item.name);
          }
          folder_list = folder_list.flat();
        }
      }
      /*
       *Create a list of races
       */
      let race_pack_list = pack_list.filter((item) => item.type === "race");
      let race_folder_list = folder_list.filter((item) => item.type === "race");
      this.data.races.list = race_pack_list.concat(race_folder_list.filter((item) => !pack_name.includes(item.name)));
      /*
       * Create final list of features
       */
      let feat_pack_list = pack_list.filter((item) => item.type === "feature");
      let feat_folder_list = folder_list.filter((item) => item.type === "feature");
      temp_feat_list = feat_pack_list.concat(feat_folder_list.filter((item) => !pack_name.includes(item.name)));
      this.data.feats.learned = foundry.utils.deepClone(this.object.data.items).filter((item) => item.data.type === "feature");
      let name_array = [];
      for (let i of this.data.feats.learned) {
        name_array.push(i.data.name);
      }
      for (let [k, v] of Object.entries(temp_feat_list)) {
        if (name_array.includes(v.name)) {
          temp_feat_list[k] = this.data.feats.learned.filter((item) => item.name === v.name)[0].data.toObject();
          console.log("this item is already learned", temp_feat_list[k]);
          temp_feat_list[k].data = foundry.utils.deepClone(this.data.feats.learned.filter((item) => item.name === v.name)[0].data.data);
        }
      }
      temp_feat_list = temp_feat_list.filter((item) => (item.type === "feature" && !name_array.includes(item.name)) || item.data.level.current !== item.data.level.max);
      this.data.feats.awail = temp_feat_list;
      // count skills by rank
      for (let [k, v] of Object.entries(CONFIG.ARd20.skills)) {
        if (this.data.skills[k].rank === 0) {
          this.data.count.skills[0] += 1;
        } else if (this.data.skills[k].rank === 1) {
          this.data.count.skills[1] += 1;
        } else if (this.data.skills[k].rank === 2) {
          this.data.count.skills[2] += 1;
        }
      }
      // count feats by source
      for (let [k, v] of Object.entries(this.data.feats.learned)) {
        console.log(v);
        v.data.data.source.value.forEach((val) => {
          console.log(val);
          this.data.count.feats[val] += 1;
        });
      }
      this.data.hover.feat = TextEditor.enrichHTML(this.data.feats.awail[0]?.data.description);
    }
    this.data.count.feats.all = 0;
    this.data.count.feats.all = Object.values(this.data.count.feats).reduce(function (a, b) {
      return a + b;
    }, 0);
    /*
     * Calculate abilities' modifiers and xp cost
     */
    for (let [k, v] of Object.entries(CONFIG.ARd20.abilities)) {
      this.data.abilities[k].mod = Math.floor((this.data.abilities[k].value - 10) / 2);
      this.data.abilities[k].xp = CONFIG.ARd20.abil_xp[this.data.abilities[k].value - 5];
      this.data.abilities[k].isEq = this.data.abilities[k].value === this.object.data.data.abilities[k].value;
      this.data.abilities[k].isXP = this.data.xp.get < this.data.abilities[k].xp;
      let race_abil = this.data.races.list.filter((race) => race.chosen === true)?.[0]?.data.bonus.abil[k].value ?? 0;
      let race_sign = this.data.races.list.filter((race) => race.chosen === true)?.[0]?.data.bonus.abil[k].sign ? 1 : -1;
      this.data.abilities[k].final = this.data.isReady ? this.data.abilities[k].value : this.data.abilities[k].value + race_abil * race_sign;
      this.data.abilities[k].mod = Math.floor((this.data.abilities[k].final - 10) / 2);
    }
    /*
     * Calculate Character's hp
     */
    this.data.health.max = this.data.races.list.filter((race) => race.chosen === true)?.[0]?.data.startHP;
    /*
     * Calculate skills' xp cost
     */
    for (let [k, v] of Object.entries(CONFIG.ARd20.skills)) {
      this.data.skills[k].rank_name = game.i18n.localize(CONFIG.ARd20.prof[this.data.skills[k].rank]) ?? this.data.skills[k].rank;
      this.data.skills[k].xp = this.data.skills[k].rank < 2 ? CONFIG.ARd20.skill_xp[this.data.skills[k].rank][this.data.count.skills[this.data.skills[k].rank + 1]] : false;
      this.data.skills[k].isEq = this.data.skills[k].rank === this.object.data.data.skills[k].rank;
      this.data.skills[k].isXP = this.data.xp.get < this.data.skills[k].xp || this.data.skills[k].rank > 1;
    }
    for (let [k, v] of Object.entries(this.data.profs.weapon)) {
      v.value_hover = game.i18n.localize(CONFIG.ARd20.prof[v.value]) ?? CONFIG.ARd20.prof[v.value];
    }
    /*
     * Calculate features cost and their availability
     */
    for (let [k, object] of Object.entries(this.data.feats.awail)) {
      let pass = [];
      let allCount = this.data.count.feats.all;
      let featCount = 0;
      object.data.source?.value.forEach((val) => (featCount += this.data.count.feats[val]));
      object.data.level.xp = object.data.level.xp || {};
      for (let i = object.data.level.initial; i < object.data.level.max; i++) {
        object.data.level.xp[i] = object.data.xp?.[i] ? Math.ceil((object.data.xp[i] * (1 + 0.01 * (allCount - featCount))) / 5) * 5 : 0;
      }
      object.data.current_xp = object.data.level.xp[object.data.level.initial];
      object.isEq = object.data.level.initial === object.data.level.current || object.data.level.initial === 0;
      object.isXP = object.data.level.initial === object.data.level.max || object.data.level.xp[object.data.level.initial] > this.data.xp.get;
      for (let [key, r] of Object.entries(object.data.req.values)) {
        switch (r.type) {
          case "ability": //check if character's ability is equal or higher than value entered in feature requirements
            r.pass.forEach((item, index) => (r.pass[index] = r.input[index] <= this.data.abilities[r.value].final));
            break;
          case "skill": //check if character's skill rank is equal or higher than value entered in feature requirements
            r.pass.forEach((item, index) => (r.pass[index] = r.input[index] <= this.data.skills[r.value].rank));
            break;
          case "feat": //check if character has features (and their level is equal or higher) that listed in feature requirements
            if (this.data.feats.awail.filter((item) => item.name === r.name)?.[0] !== undefined) {
              r.pass.forEach((item, index) => (r.pass[index] = r.input[index] <= this.data.feats.awail.filter((item) => item.name === r.name)[0].data.level.initial));
            } else if (this.data.feats.learned.filter((item) => item.name === r.name)?.[0] !== undefined) {
              r.pass = r.pass.forEach((item, index) => (r.pass[index] = r.input[index] <= this.data.feats.learned.filter((item) => item.name === r.name)[0].data.data.level.initial));
            }
            break;
        }
        pass.push(r.pass);
      }
      object.pass = [];
      /*
       * Check the custom logic in feature requirements. For example "Strength 15 OR Arcana Basic"
       */
      for (let i = 0; i <= object.data.level.initial; i++) {
        if (i === object.data.level.max || pass.length === 0) break;
        let exp = object.data.req.logic[i];
        let lev_array = exp.match(/\d*/g).filter((item) => item !== "");
        let f = {};
        lev_array.forEach((item, index) => {
          exp = exp.replace(item, `c${item}`);
          f["c" + item] = pass[item - 1][i];
        });
        let filter = filtrex.compileExpression(exp);
        object.pass[i] = Boolean(filter(f));
      }
      object.isXP = object.pass[object.data.level.initial] || object.pass.length === 0 ? object.isXP : true;
    }
    /*
     * Calculate starting HP based on character's CON and race
     */
    for (let [key, race] of Object.entries(this.data.races.list)) {
      let dieNumber = Math.ceil(Math.max(this.data.abilities.con.value + race.data.bonus.abil.con.value - 7, 0) / 4);
      let firstDie = CONFIG.ARd20.HPdice.slice(CONFIG.ARd20.HPdice.indexOf(race.data.FhpDie));
      let race_mod = Math.floor((this.data.abilities.con.value + race.data.bonus.abil.con.value - 10) / 2);
      race.data.startHP = new Roll(firstDie[dieNumber]).evaluate({ maximize: true }).total + race_mod;
      race.chosen = this.data.races.chosen === race._id ? true : false;
    }
    // At character creation, check all conditions
    if (!this.object.data.isReady) {
      let abil_sum = null;
      for (let [key, abil] of Object.entries(this.data.abilities)) {
        abil_sum += abil.value;
      }
      this.data.allow.ability = abil_sum >= 60 && abil_sum <= 80 ? true : false;
      this.data.allow.race = Boolean(this.data.races.chosen) ? true : false;
      let allow_list = [];
      for (let [key, item] of Object.entries(this.data.allow)) {
        if (key === "final") {
          continue;
        }
        allow_list.push(item);
      }
      this.data.allow.final = !allow_list.includes(false) || this.data.isReady ? true : false;
    }
    /*
     * Final Template Data
     */
    const templateData = {
      abilities: this.data.abilities,
      xp: this.data.xp,
      skills: this.data.skills,
      count: this.data.count,
      content: this.data.content,
      hover: this.data.hover,
      profs: this.data.profs,
      feats: this.data.feats,
      races: this.data.races,
      health: this.data.health,
      allow: this.data.allow,
      isReady: this.data.isReady,
    };
    console.log(this.form);
    console.log(templateData);
    return templateData;
  }
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".change").click(this._onChange.bind(this));
    html.find("td:not(.description)").hover(this._onHover.bind(this));
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
            data.xp.get += CONFIG.ARd20.abil_xp[data.abilities[button.dataset.key].value - 5] ?? CONFIG.ARd20.abil_xp[data.abilities[button.dataset.key].value - 5];
            data.xp.used -= CONFIG.ARd20.abil_xp[data.abilities[button.dataset.key].value - 5] ?? CONFIG.ARd20.abil_xp[data.abilities[button.dataset.key].value - 5];
            break;
        }
        break;
      case "skill":
        switch (button.dataset.action) {
          case "plus":
            data.skills[button.dataset.key].rank += 1;
            data.xp.get -= data.skills[button.dataset.key].xp;
            data.xp.used += data.skills[button.dataset.key].xp;
            this.data.count.skills[this.data.skills[button.dataset.key].rank] += 1;
            break;
          case "minus":
            data.skills[button.dataset.key].rank -= 1;
            this.data.count.skills[this.data.skills[button.dataset.key].rank + 1] -= 1;
            data.xp.get += CONFIG.ARd20.skill_xp[data.skills[button.dataset.key].rank][this.data.count.skills[this.data.skills[button.dataset.key].rank + 1]];
            data.xp.used -= CONFIG.ARd20.skill_xp[data.skills[button.dataset.key].rank][this.data.count.skills[this.data.skills[button.dataset.key].rank + 1]];
            break;
        }
        break;
      case "prof":
        switch (button.dataset.action) {
          case "plus":
            data.profs.weapon[button.dataset.key].value += 1;
            data.count.feats.mar += 1;
            break;
          case "minus":
            data.profs.weapon[button.dataset.key].value -= 1;
            data.count.feats.mar -= 1;
            break;
        }
        break;
      case "feat":
        switch (button.dataset.action) {
          case "plus":
            data.feats.awail[button.dataset.key].data.source.value.forEach((val) => (data.count.feats[val] += data.feats.awail[button.dataset.key].data.level.initial === 0 ? 1 : 0));
            data.xp.get -= data.feats.awail[button.dataset.key].data.level.xp[data.feats.awail[button.dataset.key].data.level.initial];
            data.xp.used += data.feats.awail[button.dataset.key].data.level.xp[data.feats.awail[button.dataset.key].data.level.initial];
            data.feats.awail[button.dataset.key].data.level.initial += 1;
            break;
          case "minus":
            data.feats.awail[button.dataset.key].data.level.initial -= 1;
            data.feats.awail[button.dataset.key].data.source.value.forEach((val) => (data.count.feats[val] -= data.feats.awail[button.dataset.key].data.level.initial === 0 ? 1 : 0));
            data.xp.get += data.feats.awail[button.dataset.key].data.level.xp[data.feats.awail[button.dataset.key].data.level.initial];
            data.xp.used -= data.feats.awail[button.dataset.key].data.level.xp[data.feats.awail[button.dataset.key].data.level.initial];
            break;
        }
        break;
    }
    this.render();
  }
  _onChangeInput(event) {
    super._onChangeInput(event);
    const button = event.currentTarget.id;
    const k = event.currentTarget.dataset.key;
    for (let [key, race] of Object.entries(this.data.races.list)) {
      this.data.races.list[key].chosen = key === k ? true : false;
      this.data.races.chosen = this.data.races.list[key].chosen ? race._id : this.data.races.chosen;
    }
    this.render();
  }
  _onHover(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const table = element.closest("div.tab");
    const tr = element.closest("tr");
    const trDOM = tr.querySelectorAll("td:not(.description)");
    const tdDesc = table.querySelector("td.description");
    const bColor = window.getComputedStyle(element).getPropertyValue("background-color");
    tdDesc.style["background-color"] = bColor;
    trDOM?.forEach((td) => {
      td.classList.toggle("chosen", event.type == "mouseenter");
      if (td.nextElementSibling === null || td.nextElementSibling.classList[0] === "description") {
        td.classList.toggle("last", event.type == "mouseenter");
      }
    });
    tr.nextElementSibling?.querySelectorAll("td:not(.description)").forEach((td) => td.classList.toggle("under-chosen", event.type == "mouseenter"));
    tr.previousElementSibling?.querySelectorAll("th:not(.description)").forEach((th) => th.classList.toggle("over-chosen", event.type == "mouseenter"));
    tr.previousElementSibling?.querySelectorAll("td:not(.description)").forEach((td) => td.classList.toggle("over-chosen", event.type == "mouseenter"));
    const type = table.dataset.tab;
    if (type !== "feats") return;
    const key = tr.dataset.key;
    const hover_desc = TextEditor.enrichHTML(this.data.feats.awail[key].data.description);
    if (hover_desc === this.data.hover.feat) return;
    this.data.hover.feat = hover_desc;
    this.render();
  }
  async _updateObject(event, formData) {
    let updateData = expandObject(formData);
    const actor = this.object;
    this.render();
    const obj = {};
    for (let [key, abil] of Object.entries(this.data.abilities)) {
      obj[`data.abilities.${key}.value`] = this.data.abilities[key].final;
    }
    obj["data.health.max"] = this.data.health.max;
    if (this.data.isReady) {
      obj["data.attributes.xp"] = updateData.xp;
    }
    obj["data.skills"] = updateData.skills;
    obj["data.profs"] = updateData.profs;
    obj["data.isReady"] = this.data.allow.final;
    console.log(obj);
    const feats_data = {
      new: [],
      exist: [],
    };
    const feats = this.data.feats.awail.filter((item) => item.data.level.initial > item.data.level.current);
    for (let [k, v] of Object.entries(feats)) {
      if (this.data.feats.learned.length > 0) {
        for (let [n, m] of Object.entries(this.data.feats.learned)) {
          if (v._id === m.id) {
            feats_data.exist.push(v);
          } else {
            feats_data.new.push(v);
          }
        }
      } else {
        feats_data.new.push(v);
      }
    }
    let pass = [];
    for (let [k, v] of Object.entries(feats_data.exist)) {
      pass.push(v.pass.slice(0, v.pass.length - 1));
    }
    for (let [k, v] of Object.entries(feats_data.new)) {
      pass.push(v.pass.slice(0, v.pass.length - 1));
    }
    pass = pass.flat();
    console.log(pass);
    if (!this.data.isReady && !this.data.allow.final) {
      ui.notifications.error(`Something not ready for your character to be created. Check the list`);
    } else if (pass.includes(false)) {
      ui.notifications.error(`Some changes in your features do not comply with the requirements`);
    } else {
      await actor.update(obj);
      if (actor.itemTypes.race.length === 0) {
        let race_list = this.data.races.list.filter((race) => race.chosen === true);
        await actor.createEmbeddedDocuments("Item", race_list);
      }
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
      this.close();
    }
  }
}