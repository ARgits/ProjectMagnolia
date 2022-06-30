// Import document classes.
import { ARd20Actor } from "./documents/actor.js";
import { ARd20Item } from "./documents/item.js";
// Import sheet classes.
import { ARd20ActorSheet } from "./sheets/actor-sheet.js";
import { ARd20ItemSheet } from "./sheets/item-sheet.js";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.js";
import { ARd20 } from "./helpers/config.js";
import ARd20SocketHandler from "./helpers/socket.js";
import { registerSystemSettings } from "./helpers/settings.js";
import * as dice from "./dice/dice.js";
import * as chat from "./helpers/chat.js";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */
export function Object.entries<Obj extends object>(obj: Obj) {
  return Object.entries(obj) as [keyof Obj, Obj[keyof Obj]][];
}
export function arr_entries<Arr extends Array<any>>(arr: Arr) {
  return Object.entries(arr) as [keyof Arr, Arr[keyof Arr]][];
}
export function getValues<Obj extends object>(SourceObject: Obj, key: keyof Obj | string | number) {
  return SourceObject[key as keyof Obj];
}
export function Object.keys<Obj extends object>(obj: Obj) {
  return Object.keys(obj) as unknown as Array<keyof Obj>;
}
export function array_keys<Obj extends Array<any>>(obj: Obj) {
  return Object.keys(obj) as unknown as Array<Exclude<keyof Obj, keyof Array<any>>>;
}
Hooks.once("init", async function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  if (game instanceof Game) {
    game.ard20 = {
      documents: {
        ARd20Actor,
        ARd20Item,
      },
      rollItemMacro,
      config: ARd20,
      dice: dice,
    };

    // Add custom constants for configuration.
    CONFIG.ARd20 = ARd20;
    //@ts-expect-error
    CONFIG.Dice.DamageRoll = dice.DamageRoll;
    //@ts-expect-error
    CONFIG.Dice.D20Roll = dice.D20Roll;
    CONFIG.Dice.rolls.push(dice.D20Roll);
    CONFIG.Dice.rolls.push(dice.DamageRoll);
    if (game.socket instanceof io.Socket) {
      game.socket.on("system.ard20", (data) => {
        if (data.operation === "updateActorData") ARd20SocketHandler.updateActorData(data);
      });
    }

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

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("ard20", ARd20ActorSheet, { makeDefault: true });
    Items.unregisterSheet("core", ItemSheet);
    //@ts-expect-error
    Items.registerSheet("ard20", ARd20ItemSheet, { makeDefault: true });
    registerSystemSettings();

    // Preload Handlebars templates.
    return preloadHandlebarsTemplates();
  } else {
    throw new Error("game not initialized yet!");
  }
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
async function createItemMacro(data: {}, slot: number): Promise<any> {
  if (game instanceof Game) {
    //@ts-expect-error
    if (data.type !== "Item") return;
    if (!("data" in data) && ui.notifications instanceof Notifications) return ui.notifications.warn("You can only create macro buttons for owned Items");
    //@ts-expect-error
    const item = data.data;

    // Create the macro command
    const command = `game.ard20.rollItemMacro("${item.name}");`;
    let macroList = game.macros!.contents.filter((m) => m.name === item.name && m?.command === command);
    let macroCheck: Macro | null = macroList.length !== 0 ? macroList[0] : null;
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
export function rollItemMacro(itemName: string) {
  if (game instanceof Game) {
    const speaker = ChatMessage.getSpeaker();
    let actor;
    if (speaker.token) actor = game.actors!.tokens[speaker.token];
    if (!actor && typeof speaker.actor === "string") actor = game.actors!.get(speaker.actor);
    const item = actor ? actor.items.find((i) => i.name === itemName) : null;
    if (!item) return ui.notifications!.warn(`Your controlled Actor does not have an item named ${itemName}`);

    // Trigger the item roll
    //@ts-expect-error
    return item.roll();
  }
}
Hooks.on("renderChatMessage", (app, html, data) => {
  // Display action buttons
  chat.displayChatActionButtons(app, html, data);

  // Highlight critical success or failure die
  chat.highlightCriticalSuccessFailure(app, html, data);

  // Optionally collapse the content
});
Hooks.on("getChatLogEntryContext", chat.addChatMessageContextOptions);
//@ts-expect-error
Hooks.on("renderChatLog", (app, html, data) => ARd20Item.chatListeners(html));
//@ts-expect-error
Hooks.on("renderChatPopout", (app, html, data) => ARd20Item.chatListeners(html));
