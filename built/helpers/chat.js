"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addChatMessageContextOptions = exports.displayChatActionButtons = exports.highlightCriticalSuccessFailure = void 0;
/**
 * Highlight critical success or failure on d20 rolls
 */
var highlightCriticalSuccessFailure = function (message, html, data) {
    if (!message.isRoll || !message.isContentVisible)
        return;
    // Highlight rolls where the first part is a d20 roll
    var roll = message.roll;
    if (!roll.dice.length)
        return;
    var d = roll.dice[0];
    // Ensure it is an un-modified d20 roll
    var isD20 = (d.faces === 20) && (d.values.length === 1);
    if (!isD20)
        return;
    var isModifiedRoll = ("success" in d.results[0]) || d.options.marginSuccess || d.options.marginFailure;
    if (isModifiedRoll)
        return;
    // Highlight successes and failures
    var critical = d.options.critical || 20;
    var fumble = d.options.fumble || 1;
    if (d.total >= critical)
        html.find(".dice-total").addClass("critical");
    else if (d.total <= fumble)
        html.find(".dice-total").addClass("fumble");
    else if (d.options.target) {
        if (roll.total >= d.options.target)
            html.find(".dice-total").addClass("success");
        else
            html.find(".dice-total").addClass("failure");
    }
};
exports.highlightCriticalSuccessFailure = highlightCriticalSuccessFailure;
/* -------------------------------------------- */
/**
 * Optionally hide the display of chat card action buttons which cannot be performed by the user
 */
var displayChatActionButtons = function (message, html, data) {
    var chatCard = html.find(".ard20.chat-card");
    if (chatCard.length > 0) {
        var flavor = html.find(".flavor-text");
        if (flavor.text() === html.find(".item-name").text())
            flavor.remove();
        // If the user is the message author or the actor owner, proceed
        var actor = game.actors.get(data.message.speaker.actor);
        if (actor && actor.isOwner)
            return;
        else if (game.user.isGM || (data.author.id === game.user.id))
            return;
        // Otherwise conceal action buttons except for saving throw
        var buttons = chatCard.find("button[data-action]");
        buttons.each(function (i, btn) {
            if (btn.dataset.action === "save")
                return;
            btn.style.display = "none";
        });
    }
};
exports.displayChatActionButtons = displayChatActionButtons;
/* -------------------------------------------- */
/**
 * This function is used to hook into the Chat Log context menu to add additional options to each message
 * These options make it easy to conveniently apply damage to controlled tokens based on the value of a Roll
 *
 * @param {HTMLElement} html    The Chat Message being rendered
 * @param {Array} options       The Array of Context Menu options
 *
 * @return {Array}              The extended options Array including new context choices
 */
var addChatMessageContextOptions = function (html, options) {
    var canApply = function (li) {
        var _a;
        var message = game.messages.get(li.data("messageId"));
        return (message === null || message === void 0 ? void 0 : message.isRoll) && (message === null || message === void 0 ? void 0 : message.isContentVisible) && ((_a = canvas.tokens) === null || _a === void 0 ? void 0 : _a.controlled.length);
    };
    options.push({
        name: game.i18n.localize("ARd20.ChatContextDamage"),
        icon: '<i class="fas fa-user-minus"></i>',
        condition: canApply,
        callback: function (li) { return applyChatCardDamage(li, 1); }
    }, {
        name: game.i18n.localize("ARd20.ChatContextHealing"),
        icon: '<i class="fas fa-user-plus"></i>',
        condition: canApply,
        callback: function (li) { return applyChatCardDamage(li, -1); }
    }, {
        name: game.i18n.localize("ARd20.ChatContextDoubleDamage"),
        icon: '<i class="fas fa-user-injured"></i>',
        condition: canApply,
        callback: function (li) { return applyChatCardDamage(li, 2); }
    }, {
        name: game.i18n.localize("ARd20.ChatContextHalfDamage"),
        icon: '<i class="fas fa-user-shield"></i>',
        condition: canApply,
        callback: function (li) { return applyChatCardDamage(li, 0.5); }
    });
    return options;
};
exports.addChatMessageContextOptions = addChatMessageContextOptions;
/* -------------------------------------------- */
/**
 * Apply rolled dice damage to the token or tokens which are currently controlled.
 * This allows for damage to be scaled by a multiplier to account for healing, critical hits, or resistance
 *
 * @param {HTMLElement} li      The chat entry which contains the roll data
 * @param {Number} multiplier   A damage multiplier to apply to the rolled damage.
 * @return {Promise}
 */
function applyChatCardDamage(li, multiplier) {
    var message = game.messages.get(li.data("messageId"));
    var roll = message.roll;
    return Promise.all(canvas.tokens.controlled.map(function (t) {
        var a = t.actor;
        return a.applyDamage(roll.total, multiplier);
    }));
}
/* -------------------------------------------- */
