/**
 * Manage Active Effect instances through the Actor Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning entity which manages this effect
 */
 export function onManageActiveEffect(event:MouseEvent, owner:Actor|Item) {
  event.preventDefault();
  const a = event.currentTarget;
  //@ts-expect-error
  const li = a!.closest("li");
  const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
  //@ts-expect-error
  switch ( a.dataset.action ) {
    case "create":
      return owner.createEmbeddedDocuments("ActiveEffect", [{
        label: "New Effect",
        icon: "icons/svg/aura.svg",
        origin: owner.uuid,
        "duration.rounds": li.dataset.effectType === "temporary" ? 1 : undefined,
        disabled: li.dataset.effectType === "inactive"
      }]);
    case "edit":
      return effect!.sheet.render(true);
    case "delete":
      return effect!.delete();
    case "toggle":
      return effect!.update({disabled: !effect!.data.disabled});
  }
}

/**
 * Prepare the data structure for Active Effects which are currently applied to an Actor or Item.
 * @param {ActiveEffect[]} effects    The array of Active Effect instances to prepare sheet data for
 * @return {object}                   Data for rendering
 */
export function prepareActiveEffectCategories(effects:ActiveEffect[]) {

    // Define effect header categories
    const categories = {
      temporary: {
        type: "temporary",
        label: "Temporary Effects",
        effects: []
      },
      passive: {
        type: "passive",
        label: "Passive Effects",
        effects: []
      },
      inactive: {
        type: "inactive",
        label: "Inactive Effects",
        effects: []
      }
    };

    // Iterate over active effects, classifying them into categories
    for ( let e of effects ) {
      //@ts-expect-error
      e._getSourceName(); // Trigger a lookup for the source name
      //@ts-expect-error
      if ( e.data.disabled ) categories.inactive.effects.push(e);
      //@ts-expect-error
      else if ( e.isTemporary ) categories.temporary.effects.push(e);
      //@ts-expect-error
      else categories.passive.effects.push(e);
    }
    return categories;
}
