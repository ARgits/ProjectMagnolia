"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareActiveEffectCategories = exports.onManageActiveEffect = void 0;
/**
 * Manage Active Effect instances through the Actor Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning entity which manages this effect
 */
function onManageActiveEffect(event, owner) {
    event.preventDefault();
    var a = event.currentTarget;
    var li = a.closest("li");
    var effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
    switch (a.dataset.action) {
        case "create":
            return owner.createEmbeddedDocuments("ActiveEffect", [{
                    label: "New Effect",
                    icon: "icons/svg/aura.svg",
                    origin: owner.uuid,
                    "duration.rounds": li.dataset.effectType === "temporary" ? 1 : undefined,
                    disabled: li.dataset.effectType === "inactive"
                }]);
        case "edit":
            return effect.sheet.render(true);
        case "delete":
            return effect.delete();
        case "toggle":
            return effect.update({ disabled: !effect.data.disabled });
    }
}
exports.onManageActiveEffect = onManageActiveEffect;
/**
 * Prepare the data structure for Active Effects which are currently applied to an Actor or Item.
 * @param {ActiveEffect[]} effects    The array of Active Effect instances to prepare sheet data for
 * @return {object}                   Data for rendering
 */
function prepareActiveEffectCategories(effects) {
    // Define effect header categories
    var categories = {
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
    for (var _i = 0, effects_1 = effects; _i < effects_1.length; _i++) {
        var e = effects_1[_i];
        e._getSourceName(); // Trigger a lookup for the source name
        if (e.data.disabled)
            categories.inactive.effects.push(e);
        else if (e.isTemporary)
            categories.temporary.effects.push(e);
        else
            categories.passive.effects.push(e);
    }
    return categories;
}
exports.prepareActiveEffectCategories = prepareActiveEffectCategories;
