// Import document classes.
import { ARd20Actor } from "./documents/actor.mjs";
import { ARd20Item } from "./documents/item.mjs";
// Import sheet classes.
import { ARd20ActorSheet } from "./sheets/actor-sheet.mjs";
import { ARd20ItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { ARd20 } from "./helpers/config.mjs";
import ARd20SocketHandler from "./helpers/socket.js";
import { registerSystemSettings } from "./helpers/settings.mjs";
import * as dice from "./dice/dice.js"
import * as chat from "./helpers/chat.js"

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once("init", async function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.ard20 = {
    ARd20Actor,
    ARd20Item,
    rollItemMacro,
    config:ARd20,
    dice:dice
  };

  // Add custom constants for configuration.
  CONFIG.ARd20 = ARd20;
  CONFIG.Dice.DamageRoll = dice.DamageRoll
  CONFIG.Dice.D20Roll = dice.D20Roll
  CONFIG.Dice.rolls.push(dice.D20Roll)
  CONFIG.Dice.rolls.push(dice.DamageRoll)
  game.socket.on("system.ard20", (data) => {
    if (data.operation === "updateActorData") ARd20SocketHandler.updateActorData(data);
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

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("ard20", ARd20ActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("ard20", ARd20ItemSheet, { makeDefault: true });
  registerSystemSettings();

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
  if (data.type !== "Item") return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  // Create the macro command
  const command = `game.ard20.rollItemMacro("${item.name}");`;
  let macro = game.macros.entities.find((m) => m.name === item.name && m.command === command);
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "ard20.itemMacro": true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find((i) => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}
Hooks.on("renderChatMessage", (app, html, data) => {

  // Display action buttons
  chat.displayChatActionButtons(app, html, data);

  // Highlight critical success or failure die
  chat.highlightCriticalSuccessFailure(app, html, data);

  // Optionally collapse the content
  if (game.settings.get("dnd5e", "autoCollapseItemCards")) html.find(".card-content").hide();
});
Hooks.on("getChatLogEntryContext", chat.addChatMessageContextOptions);
Hooks.on("renderChatLog", (app, html, data) => ARd20Item.chatListeners(html));
Hooks.on("renderChatPopout", (app, html, data) => ARd20Item.chatListeners(html));
Hooks.on('getActorDirectoryEntryContext', ARd20Actor.addDirectoryContextOptions);

// FIXME: This helper is needed for the vehicle sheet. It should probably be refactored.
Handlebars.registerHelper('getProperty', function (data, property) {
  return getProperty(data, property);
});

