/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class ARd20Item extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData () {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData()
  }
  prepareBaseData () {}
  prepareDerivedData () {
    super.prepareDerivedData()
    const itemData = this.data
    const actorData = this.actor ? this.actor.data : {}
    const data = itemData.data
    const labels = (this.labels = {})
    if (itemData.type === "spell") {
      labels.school = CONFIG.ARd20.SpellSchool[data.school]
    }
    if (itemData.type === "weapon") {
      data.settings = Object.fromEntries(Object.entries(game.settings.get('ard20', 'profs')).filter((prof) => prof[1].type === data.type.value))
      data.proto = data.proto ?? ""
      for (let [k, v] of Object.entries(data.property.untrained)) {
        v = CONFIG.ARd20.Prop[k] ?? k
      }
      for (let [k, v] of Object.entries(data.property.basic)) {
        v = CONFIG.ARd20.Prop[k] ?? k
        if (data.property.untrained[k] === true && k != "awk") {
          data.property.basic[k] = true
        }
      }
      for (let [k, v] of Object.entries(data.property.master)) {
        v = CONFIG.ARd20.Prop[k] ?? k
        if (data.property.basic[k] === true && k != "awk") {
          data.property.master[k] = true
        }
      }
      for (let [k, v] of Object.entries(CONFIG.ARd20.prof)) {
        v = game.i18n.localize(CONFIG.ARd20.prof[k]) ?? k
        v = v.toLowerCase()
        data.deflect[v] = data.deflect[v] || data.damage.common[v]
      }
      data.type.value = data.type.value || "amb"
      labels.type =
        game.i18n.localize(CONFIG.ARd20.WeaponType[data.type.value]) ??
        CONFIG.ARd20.WeaponType[data.type.value]
      labels.prof =
        game.i18n.localize(CONFIG.ARd20.prof[data.prof.value]) ??
        CONFIG.ARd20.prof[data.prof.value]
      data.prof.label = labels.prof
      data.type.label = labels.type
    }
    if (itemData.type === "feature") {
      data.source.value = data.source.value || "mar"
    }
    if (!this.isOwned) this.prepareFinalAttributes()
  }
  prepareFinalAttributes () {
    const data = this.data.data
    const abil = (data.abil = {})
    for (let [k, v] of Object.entries(CONFIG.ARd20.abilities)) {
      v = this.isOwned
        ? getProperty(this.actor.data, `data.abilities.${k}.mod`)
        : null
      abil[k] = v
    }
    if (this.data.type === "weapon") {
      console.log('Владелец',this.actor)
      data.prof.value = this.isOwned ? Object.values(this.actor.data.data.profs).filter(pr => pr.name === data.proto).value : 0
      let prof = data.prof.value
      let prof_bonus = 0
      if (prof == 0) {
        prof_bonus = 0
      } else if (prof == 1) {
        prof_bonus = this.actor.data.data.attributes.prof_die
      } else if (prof == 2) {
        prof_bonus =
          this.actor.data.data.attributes.prof_die +
          "+" +
          this.actor.data.data.attributes.prof_bonus
      }
      this.data.data.damage.common.current =
        this.data.data.damage.common[this.labels.prof.toLowerCase()] +
        "+" +
        abil.str
      this.data.data.attack = "1d20+" + prof_bonus + "+" + abil.dex
    }
  }
  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
  getRollData () {
    // If present, return the actor's roll data.
    if (!this.actor) return null
    const rollData = this.actor.getRollData()
    rollData.item = foundry.utils.deepClone(this.data.data)
    return rollData
  }
  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */

  async roll () {
    const item = this.data

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({actor: this.actor})
    const rollMode = game.settings.get("core", "rollMode")
    const label = `[${item.type}] ${item.name}`

    // Otherwise, create a roll and send a chat message from it.
    if (item.type === "weapon") {
      const rollData = this.getRollData()
      const targets = game.user.targets
      const ts = targets.size
      const attackRoll = new Roll(rollData.item.attack, rollData).roll()
      attackRoll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      })
      const damageRoll = new Roll(
        rollData.item.damage.common.current,
        rollData
      ).roll()
      damageRoll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      })
      console.log(ts)
      if (ts >= 1) {
        for (let target of targets) {
          target.data.attack = attackRoll.total
          target.data.damage = damageRoll.total
        }
        this.AttackCheck()
      } else if (ts === 0) {
        console.log("нет целей")
      }
      const attack = [attackRoll, damageRoll]
      return attack
    }
    // If there's no roll data, send a chat message.
    else if (!this.data.data.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.data.description ?? "",
      })
    } else {
      // Retrieve roll data.
      const rollData = this.getRollData()

      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.item.formula, rollData).roll()
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      })
      return roll
    }
  }
  async AttackCheck () {
    const targets = game.user.targets
    for (let target of targets) {
      let actor = target.actor
      const reflex = actor.data.data.defences.reflex.value
      let {value} = actor.data.data.health
      let obj = {}
      value -= target.data.damage
      obj["data.health.value"] = value
      if (target.data.attack >= reflex) {
        console.log("HIT!")
        if (game.user.isGM) {
          console.log("GM")
          await actor.update(obj)
        } else {
          console.log("not GM")
          game.socket.emit("system.ard20", {
            operation: "updateActorData",
            actor: actor,
            update: obj,
            value: value,
          })
        }
      } else console.log("miss")
    }
  }
}
