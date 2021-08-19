/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class ARd20Item extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }
  prepareBaseData() {}
  prepareDerivedData() {
    super.prepareDerivedData();
    const itemData = this.data;
    const actorData = this.actor ? this.actor.data : {};
    const labels = (this.labels = {});
    this._prepareSpellData(itemData, labels); // подготовка спеллов
    this._prepareWeaponData(itemData, labels); // подготовка оружия
    this._prepareFeatureData(itemData); // подготовка способностей
  }
  /*
  Prepare data for Spells
  Данные для спеллов
  */
  _prepareSpellData(itemData, labels) {
    if (itemData.type !== "spell") return;
    const data = itemData.data;
    labels.school = CONFIG.ARd20.SpellSchool[data.school];
    if (!this.isOwned) this.prepareFinalAttributes();
  }
  /*
  Prepare data for weapons
  Данные для оружия
  */
  _prepareWeaponData(itemData, labels) {
    if (itemData.type !== "weapon") return;
    const data = itemData.data;
    this._SetProperties(data);
    this._setDeflect(data);
    this._setTypeAndSubtype(data, labels);
    if (!this.isOwned) this.prepareFinalAttributes();
  }
  _SetProperties(data) {
    for (let [k, v] of Object.entries(data.property.untrained)) {
      v = CONFIG.ARd20.Prop[k] ?? k;
    }
    for (let [k, v] of Object.entries(data.property.basic)) {
      v = CONFIG.ARd20.Prop[k] ?? k;
      if (data.property.untrained[k] === true && k != "awk") {
        data.property.basic[k] = true;
      }
    }
    for (let [k, v] of Object.entries(data.property.master)) {
      v = CONFIG.ARd20.Prop[k] ?? k;
      if (data.property.basic[k] === true && k != "awk") {
        data.property.master[k] = true;
      }
    }
  }
  _setDeflect(data) {
    for (let [k, v] of Object.entries(CONFIG.ARd20.prof)) {
      v = game.i18n.localize(CONFIG.ARd20.prof[k]) ?? k;
      v = v.toLowerCase();
      data.deflect[v] = data.deflect[v] || data.damage.common[v];
    }
  }
  _setTypeAndSubtype(data, labels) {
    data.type.value = data.type.value || "amb";
    data.settings = game.settings
      .get("ard20", "profs")
      .weapon.filter((prof) => prof.type === data.type.value);
    if (this.isOwned && itemData.flags.core?.sourceId) {
      let id = this.isOwned ? /Item.(.+)/.exec(itemData.flags.core.sourceId)[1] : null;
      console.log(id);
      data.proto =
        this.isOwned && data.proto === undefined ? game.items.get(id).data.data.proto : data.proto;
    }
    data.proto =
      data.settings.filter((prof) => prof.name === data.proto)[0] === undefined
        ? data.settings[0].name
        : data.proto;
    labels.type =
      game.i18n.localize(CONFIG.ARd20.WeaponType[data.type.value]) ??
      CONFIG.ARd20.WeaponType[data.type.value];
    labels.prof =
      game.i18n.localize(CONFIG.ARd20.prof[data.prof.value]) ?? CONFIG.ARd20.prof[data.prof.value];
    data.prof.label = labels.prof;
    data.type.label = labels.type;
  }
  /*
  Prepare data for features
  */
  _prepareFeatureData(itemData) {
    if (itemData.type !== "feature") return;
    const data = itemData.data;
    data.isLearned = this.isOwned ? true : false;
    data.source.value = data.source.value || "mar";
    data.keys = [];
    //define levels
    data.level.has = data.level.has !== undefined ? data.level.has : false;
    data.level.max = data.level.has ? data.level.max || 4 : 1;
    if (this.isOwned) {
      console.log(data.level.initial);
    }
    data.level.current = this.isOwned ? Math.max(data.level.initial, 1) : 0;
    //define exp cost
    data.xp.length = data.level.has ? data.level.max : 1;
    if (data.xp.length > 1) {
      let n = (10 - data.level.max) / data.level.max;
      let k = 1.7 + (Math.round(Number((Math.abs(n) * 100).toPrecision(15))) / 100) * Math.sign(n);
      for (let i = 1; i < data.level.max; i++) {
        data.xp[i] = Math.round((data.xp[i - 1] * k) / 5) * 5;
      }
    }
    if (!this.isOwned) this.prepareFinalAttributes();
  }
  /*
  Prepare Data that uses actor's data
  */
  prepareFinalAttributes() {
    const data = this.data.data;
    const abil = (data.abil = {});
    for (let [k, v] of Object.entries(CONFIG.ARd20.abilities)) {
      v = this.isOwned ? getProperty(this.actor.data, `data.abilities.${k}.mod`) : null;
      abil[k] = v;
    }
    data.isEquiped = data.isEquiped || false;
    this._prepareWeaponAttr(data, abil);
  }

  _prepareWeaponAttr(data, abil) {
    if (this.data.type === "weapon") {
      data.prof.value = this.isOwned
        ? Object.values(this.actor?.data.data.profs.weapon).filter(
            (pr) => pr.name === data.proto
          )[0].value
        : 0;
      this.labels.prof =
        game.i18n.localize(CONFIG.ARd20.prof[data.prof.value]) ??
        CONFIG.ARd20.prof[data.prof.value];
      data.prof.label = this.labels.prof;
      let prof_bonus = 0;
      if (data.prof.value === 0) {
        prof_bonus = 0;
      } else if (data.prof.value === 1) {
        prof_bonus = this.actor.data.data.attributes.prof_die;
      } else if (data.prof.value === 2) {
        prof_bonus =
          this.actor.data.data.attributes.prof_die +
          "+" +
          this.actor.data.data.attributes.prof_bonus;
      }
      this.data.data.damage.common.current =
        this.data.data.damage.common[this.labels.prof.toLowerCase()] + "+" + abil.str;
      this.data.data.attack = "1d20+" + prof_bonus + "+" + abil.dex;
    }
  }
  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
  getRollData() {
    // If present, return the actor's roll data.
    if (!this.actor) return null;
    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.data.data);
    return rollData;
  }
  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */

  async roll() {
    const item = this.data;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get("core", "rollMode");
    const label = `[${item.type}] ${item.name}`;

    // Otherwise, create a roll and send a chat message from it.
    if (item.type === "weapon") {
      const rollData = this.getRollData();
      const targets = game.user.targets;
      const ts = targets.size;
      const attackRoll = new Roll(rollData.item.attack, rollData).roll();
      attackRoll._total = attackRoll._total >= 0 ? attackRoll._total : 0;
      attackRoll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        emote: true,
      });

      const damageRoll = new Roll(rollData.item.damage.common.current, rollData).roll();
      damageRoll._total = damageRoll._total >= 0 ? damageRoll._total : 0;
      damageRoll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });

      console.log(ts);
      if (ts >= 1) {
        for (let target of targets) {
          target.data.attack = attackRoll.total;
          target.data.damage = damageRoll.total;
        }
        this.AttackCheck();
      } else if (ts === 0) {
        console.log("нет целей");
      }
      const attack = [attackRoll, damageRoll];
      return attack;
    }
    // If there's no roll data, send a chat message.
    else if (!this.data.data.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.data.description ?? "",
      });
    } else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.item.formula, rollData).roll();
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });
      return roll;
    }
  }
  async AttackCheck() {
    const targets = game.user.targets;
    for (let target of targets) {
      let actor = target.actor;
      const reflex = actor.data.data.defences.reflex.value;
      let { value } = actor.data.data.health;
      let obj = {};
      value -= target.data.damage;
      obj["data.health.value"] = value;
      if (target.data.attack >= reflex) {
        console.log("HIT!");
        if (game.user.isGM) {
          console.log("GM");
          await actor.update(obj);
        } else {
          console.log("not GM");
          game.socket.emit("system.ard20", {
            operation: "updateActorData",
            actor: actor,
            update: obj,
            value: value,
          });
        }
      } else console.log("miss");
    }
  }
}
