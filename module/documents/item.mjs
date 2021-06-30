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
  prepareBaseData() {
  }
  prepareDerivedData() {
    super.prepareDerivedData();
    const itemData = this.data;
    const actorData = this.actor ? this.actor.data : {};
    const data = itemData.data;
    const labels = this.labels = {};

    if (itemData.type === "spell") {
      labels.school = CONFIG.ARd20.SpellSchool[data.school];
    }
    if (itemData.type === "weapon") {
      for (let [k, v] of Object.entries(data.property.untrained)) {
        v = CONFIG.ARd20.Prop[k] ?? k;
      }
      for (let [k, v] of Object.entries(data.property.basic)) {
        v = CONFIG.ARd20.Prop[k] ?? k;
        if (data.property.untrained[v]===true){
          data.property.basic[v]=true
        }
      }
      for (let [k, v] of Object.entries(data.property.master)) {
        v = CONFIG.ARd20.Prop[k] ?? k;
        if (data.property.basic[v]===true){
          data.property.master[v]=true
        }
      }
      labels.type = CONFIG.ARd20.WeaponType[data.type];
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
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.type}] ${item.name}`;

    // If there's no roll data, send a chat message.
    if (!this.data.data.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.data.description ?? ''
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
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
}
