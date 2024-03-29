// Import document classes.
import { ARd20Actor } from "./documents/actor.js";
import { ARd20Item } from "./documents/item.js";
import { RaceDataModel } from "./documents/DataModels/Items/RaceDataModel.js";
// Import sheet classes.
import { ARd20ActorSheet } from "./sheets/legacy/actor-sheet.js";
import { ARd20ItemSheet } from "./sheets/legacy/item-sheet.js";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates, setSvelteComponents } from "./helpers/templates.js";
import { ARd20 } from "./helpers/config.js";
import ARd20SocketHandler from "./helpers/socket.js";
import { registerSystemSettings } from "./settings/settings.js";
import * as dice from "./dice/dice.js";
import { SvelteDocumentSheet } from "./sheets/svelte/documentSheet.js";
import ARd20Action from "../built/documents/action.js";
import ARd20Token from "../built/documents/token.js";
import ARd20TokenDocument from "./documents/tokenDoc.js";
import MyChatMessage from "./chat/MyChatMessage.svelte";
import ARd20DamageRoll from "./dice/DamageRoll.js";
import ARd20CombatEncounterSheet from "./Combat/combatSheet.js";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */
Hooks.once("init", function () {
    // Add utility classes to the global game object so that they're more easily
    // accessible in global contexts.
    game.ard20 = {
        documents: {
            ARd20Actor,
            ARd20Item,
            ARd20Action,
        },
        rollItemMacro,
        config: ARd20,
        dice: { dice, ARd20DamageRoll },
        prepareAndRollDamage,
    };
    // Add custom constants for configuration.
    CONFIG.ARd20 = ARd20;
    CONFIG.Dice.DamageRoll = dice.DamageRoll;
    CONFIG.Dice.D20Roll = dice.D20Roll;
    CONFIG.Dice.Roll = Roll;
    CONFIG.Dice.ARd20DamageRoll = ARd20DamageRoll;
    CONFIG.Dice.rolls.push(dice.D20Roll);
    CONFIG.Dice.rolls.push(dice.DamageRoll);
    CONFIG.Dice.rolls.push(ARd20DamageRoll);
    game.socket.on("system.ard20", (data) => {
        if (data.operation === "updateActorData") {
            ARd20SocketHandler.updateActorData(data);
        }
    });

    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    CONFIG.Combat.initiative = {
        formula: "1d20 + @abilities.dex.mod",
        decimals: 2,
    };
    // Define custom Document classes
    CONFIG.Actor.documentClass = ARd20Actor;
    CONFIG.Item.documentClass = ARd20Item;
    CONFIG.Token.documentClass = ARd20TokenDocument;
    CONFIG.Token.objectClass = ARd20Token;
    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("ard20", ARd20ActorSheet, { makeDefault: false });
    Actors.registerSheet("ard20", SvelteDocumentSheet, { makeDefault: true });
    Items.unregisterSheet("core", ItemSheet);
    //@ts-expect-error
    Items.registerSheet("ard20", ARd20ItemSheet, { makeDefault: false });
    Items.registerSheet("ard20", SvelteDocumentSheet, { makeDefault: true });
    //CombatEncounters.registerSheet("ard20", ARd20CombatEncounterSheet, {makeDefault:true})
    //CONFIG.ui.combat = ARd20CombatEncounterSheet;

    CONFIG.Item.systemDataModels["race"] = RaceDataModel;
    //register settings
    registerSystemSettings();
    game.settings.set('ard20', 'actionMouseRewrite', false);

    //register Svelte components for Actor/Item types
    setSvelteComponents();
    // Preload Handlebars templates.
    return preloadHandlebarsTemplates();
});
/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */
// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper("concat", function () {
    var outStr = "";
    for (var arg in arguments) {
        if (typeof arguments[arg] != "object") {
            outStr += arguments[arg];
        }
    }
    return outStr;
});
Handlebars.registerHelper("toLowerCase", function (str) {
    return str.toLowerCase();
});
Handlebars.registerHelper("add", function (value1, value2) {
    return Number(value1) + Number(value2);
});
/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */
Hooks.once("ready", async function () {
    //check if typhonjs module is installed and activated
    /*if (!game.modules.get("typhonjs")) {
      ui.notifications.error("typhonjs module is not install, please install it!");
    } else if (!game.modules.get("typhonjs").active) {
      ui.notifications.error("typhonjs module is not active!");
      const moduleSettings = game.settings.get("core", "moduleConfiguration");
      moduleSettings["typhonjs"] = true;
      await game.settings.set("core", "moduleConfiguration", moduleSettings);
    }*/
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
});
/* -------------------------------------------- */
/*  Hotbar Macros                               */

/* -------------------------------------------- */
/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
    if (game instanceof Game) {
        if (data.type !== "Item") {
            return;
        }
        if (!("data" in data) && ui.notifications instanceof Notifications) {
            return ui.notifications.warn("You can only create macro buttons for owned Items");
        }
        const item = data.data;
        // Create the macro command
        const command = `game.ard20.rollItemMacro("${item.name}");`;
        let macroList = game.macros.contents.filter((m) => m.name === item.name && m?.command === command);
        let macroCheck = macroList.length !== 0 ? macroList[0] : null;
        if (macroCheck !== null) {
            let macro = await Macro.create({
                name: item.name,
                type: "script",
                img: item.img,
                command: command,
                flags: { "ard20.itemMacro": true },
            });
            if (macro instanceof Macro) {
                game.user?.assignHotbarMacro(macro, slot);
            }
        }
        return false;
    }
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
export function rollItemMacro(itemName) {
    if (game instanceof Game) {
        const speaker = ChatMessage.getSpeaker();
        let actor;
        if (speaker.token) {
            actor = game.actors.tokens[speaker.token];
        }
        if (!actor && typeof speaker.actor === "string") {
            actor = game.actors.get(speaker.actor);
        }
        const item = actor ? actor.items.find((i) => i.name === itemName) : null;
        if (!item) {
            return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);
        }
        return item.roll();
    }
}

Hooks.on("renderChatMessage", (app, html, data) => {
    // Display action buttons
    //chat.displayChatActionButtons(app, html, data);
    // Highlight critical success or failure die
    //chat.highlightCriticalSuccessFailure(app, html, data);
    // Optionally collapse the content
    const flagData = app.getFlag('world', 'svelte');
    if (typeof flagData === 'object') {
        new MyChatMessage({ target: html[0], props: flagData });
    }

});
Hooks.on('preDeleteChatMessage', (message) => {
    const flagData = message.getFlag('world', 'svelte');

    if (typeof flagData === 'object' && typeof message?._svelteComponent?.$destroy === 'function') {
        message._svelteComponent.$destroy();
    }
});
//Hooks.on("getChatLogEntryContext", chat.addChatMessageContextOptions);
Hooks.on("renderChatLog", (app, html, data) => ARd20Item.chatListeners(html));
Hooks.on("renderChatPopout", (app, html, data) => ARd20Item.chatListeners(html));

/*
* Prepare array of damage fields with its types to Roll class, then roll it
*
* @param damage {Array} - damageArray
*  */
export function prepareAndRollDamage(damage) {
    const damageValue = damage.map(dam => `{${dam[0]}}`);
    const damageType = damage.map(dam => dam[1]);
    const damageFormula = damageValue.join(' + ');
    return new ARd20DamageRoll(damageFormula, {}, { damageType });

}
