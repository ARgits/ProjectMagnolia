export { default as D20Roll } from "./d20-roll.js";
export { default as DamageRoll } from "./damage-roll.js";
/**
 * A standardized helper function for simplifying the constant parts of a multipart roll formula
 *
 * @param {string} formula                 The original Roll formula
 * @param {Object} data                    Actor or item data against which to parse the roll
 * @param {Object} options                 Formatting options
 * @param {boolean} options.constantFirst   Puts the constants before the dice terms in the resulting formula
 *
 * @return {string}                        The resulting simplified formula
 */
export function simplifyRollFormula(formula, data, { constantFirst = false }) {
    const roll = new Roll(formula, data); // Parses the formula and replaces any @properties
    const terms = roll.terms;
    // Some terms are "too complicated" for this algorithm to simplify
    // In this case, the original formula is returned.
    if (terms.some(_isUnsupportedTerm))
        return roll.formula;
    const rollableTerms = []; // Terms that are non-constant, and their associated operators
    const constantTerms = []; // Terms that are constant, and their associated operators
    let operators = []; // Temporary storage for operators before they are moved to one of the above
    for (let term of terms) {
        // For each term
        if (term instanceof OperatorTerm)
            operators.push(term);
        // If the term is an addition/subtraction operator, push the term into the operators array
        else {
            // Otherwise the term is not an operator
            if (term instanceof DiceTerm) {
                // If the term is something rollable
                rollableTerms.push(...operators); // Place all the operators into the rollableTerms array
                rollableTerms.push(term); // Then place this rollable term into it as well
            } //
            else {
                // Otherwise, this must be a constant
                constantTerms.push(...operators); // Place the operators into the constantTerms array
                constantTerms.push(term); // Then also add this constant term to that array.
            } //
            operators = []; // Finally, the operators have now all been assigend to one of the arrays, so empty this before the next iteration.
        }
    }
    const constantFormula = Roll.getFormula(constantTerms); // Cleans up the constant terms and produces a new formula string
    const rollableFormula = Roll.getFormula(rollableTerms); // Cleans up the non-constant terms and produces a new formula string
    // Mathematically evaluate the constant formula to produce a single constant term
    let constantPart = undefined;
    if (constantFormula) {
        try {
            constantPart = Roll.safeEval(constantFormula);
        }
        catch (err) {
            console.warn(`Unable to evaluate constant term ${constantFormula} in simplifyRollFormula`);
        }
    }
    // Order the rollable and constant terms, either constant first or second depending on the optional argument
    const parts = constantFirst ? [constantPart, rollableFormula] : [rollableFormula, constantPart];
    // Join the parts with a + sign, pass them to `Roll` once again to clean up the formula
    return new Roll(parts.filterJoin(" + ")).formula;
}
/* -------------------------------------------- */
/**
 * Only some terms are supported by simplifyRollFormula, this method returns true when the term is not supported.
 * @param {*} term - A single Dice term to check support on
 * @return {Boolean} True when unsupported, false if supported
 */
function _isUnsupportedTerm(term) {
    const diceTerm = term instanceof DiceTerm;
    const operator = term instanceof OperatorTerm && ["+", "-"].includes(term.operator);
    const number = term instanceof NumericTerm;
    return !(diceTerm || operator || number);
}
/* -------------------------------------------- */
/* D20 Roll                                     */
/* -------------------------------------------- */
/**
 * A standardized helper function for managing core 5e d20 rolls.
 * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
 * This chooses the default options of a normal attack with no bonus, Advantage, or Disadvantage respectively
 *
 * @param {string[]} parts          The dice roll component parts, excluding the initial d20
 * @param {object} data             Actor or item data against which to parse the roll
 *
 * @param {boolean} [advantage]       Apply advantage to the roll (unless otherwise specified)
 * @param {boolean} [disadvantage]    Apply disadvantage to the roll (unless otherwise specified)
 * @param {number} [critical]         The value of d20 result which represents a critical success
 * @param {number} [fumble]           The value of d20 result which represents a critical failure
 * @param {number} [targetValue]      Assign a target value against which the result of this roll should be compared

 * @param {boolean} [chooseModifier=false] Choose the ability modifier that should be used when the roll is made
 * @param {boolean} [fastForward=false] Allow fast-forward advantage selection
 * @param {Event} [event]             The triggering event which initiated the roll
 * @param {string} [rollMode]         A specific roll mode to apply as the default for the resulting roll
 * @param {string} [template]         The HTML template used to render the roll dialog
 * @param {string} [title]            The dialog window title
 * @param {Object} [dialogOptions]    Modal dialog options
 *
 * @param {boolean} [chatMessage=true] Automatically create a Chat Message for the result of this roll
 * @param {object} [messageData={}] Additional data which is applied to the created Chat Message, if any
 * @param {string} [rollMode]       A specific roll mode to apply as the default for the resulting roll
 * @param {object} [speaker]        The ChatMessage speaker to pass when creating the chat
 * @param {string} [flavor]         Flavor text to use in the posted chat message
 *
 * @return {Promise<D20Roll|null>}  The evaluated D20Roll, or null if the workflow was cancelled
 */
//@ts-expect-error
export async function d20Roll({ 
//@ts-expect-error
parts = [], 
//@ts-expect-error
data = {}, 
//@ts-expect-error
advantage, 
//@ts-expect-error
disadvantage, 
//@ts-expect-error
fumble = 1, 
//@ts-expect-error
critical = 20, 
//@ts-expect-error
targetValue, 
//@ts-expect-error
chooseModifier = false, 
//@ts-expect-error
fastForward = false, 
//@ts-expect-error
event, 
//@ts-expect-error
template, 
//@ts-expect-error
title, 
//@ts-expect-error
dialogOptions, 
//@ts-expect-error
chatMessage = true, 
//@ts-expect-error
messageData = {}, 
//@ts-expect-error
rollMode, 
//@ts-expect-error
speaker, 
//@ts-expect-error
options, 
//@ts-expect-error
flavor, 
//@ts-expect-error
canMult, 
//@ts-expect-error
mRoll,
//@ts-expect-error
 } = {}) {
    // Handle input arguments
    const formula = ["1d20"].concat(parts).join(" + ");
    const { advantageMode, isFF } = _determineAdvantageMode({ advantage, disadvantage, fastForward, event });
    const defaultRollMode = rollMode || game.settings.get("core", "rollMode");
    if (chooseModifier && !isFF) {
        data["mod"] = "@mod";
    }
    // Construct the D20Roll instance
    //@ts-expect-error
    const roll = new CONFIG.Dice.D20Roll(formula, data, {
        flavor: flavor || title,
        advantageMode,
        defaultRollMode,
        critical,
        fumble,
        targetValue,
        mRoll,
    });
    // Prompt a Dialog to further configure the D20Roll
    if (!isFF) {
        const configured = await roll.configureDialog({
            title,
            chooseModifier,
            defaultRollMode: defaultRollMode,
            defaultAction: advantageMode,
            defaultAbility: data?.item?.ability,
            template,
            canMult,
            mRoll,
        }, dialogOptions);
        if (configured === null)
            return null;
    }
    // Evaluate the configured roll
    await roll.evaluate({ async: true });
    // Create a Chat Message
    if (speaker) {
        console.warn(`You are passing the speaker argument to the d20Roll function directly which should instead be passed as an internal key of messageData`);
        messageData.speaker = speaker;
    }
    if (roll && chatMessage)
        await roll.toMessage(messageData, options);
    return roll;
}
/* -------------------------------------------- */
/**
 * Determines whether this d20 roll should be fast-forwarded, and whether advantage or disadvantage should be applied
 * @returns {{isFF: boolean, advantageMode: number}}  Whether the roll is fast-forward, and its advantage mode
 */
//@ts-expect-error
function _determineAdvantageMode({ event, advantage = false, disadvantage = false, fastForward = false } = {}) {
    const isFF = fastForward || (event && (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey));
    //@ts-expect-error
    let advantageMode = CONFIG.Dice.D20Roll.ADV_MODE.NORMAL;
    //@ts-expect-error
    if (advantage || event?.altKey)
        advantageMode = CONFIG.Dice.D20Roll.ADV_MODE.ADVANTAGE;
    //@ts-expect-error
    else if (disadvantage || event?.ctrlKey || event?.metaKey)
        advantageMode = CONFIG.Dice.D20Roll.ADV_MODE.DISADVANTAGE;
    return { isFF, advantageMode };
}
/* -------------------------------------------- */
/* Damage Roll                                  */
/* -------------------------------------------- */
/**
 * A standardized helper function for managing core 5e damage rolls.
 * Holding SHIFT, ALT, or CTRL when the attack is rolled will "fast-forward".
 * This chooses the default options of a normal attack with no bonus, Critical, or no bonus respectively
 *
 * @param {string[]} parts          The dice roll component parts, excluding the initial d20
 * @param {object} [data]           Actor or item data against which to parse the roll
 *
 * @param {boolean} [critical=false] Flag this roll as a critical hit for the purposes of fast-forward or default dialog action
 * @param {number} [criticalBonusDice=0] A number of bonus damage dice that are added for critical hits
 * @param {number} [criticalMultiplier=2] A critical hit multiplier which is applied to critical hits
 * @param {boolean} [multiplyNumeric=false] Multiply numeric terms by the critical multiplier
 * @param {boolean} [powerfulCritical=false] Apply the "powerful criticals" house rule to critical hits

 * @param {boolean} [fastForward=false] Allow fast-forward advantage selection
 * @param {Event}[event]            The triggering event which initiated the roll
 * @param {boolean} [allowCritical=true] Allow the opportunity for a critical hit to be rolled
 * @param {string} [template]       The HTML template used to render the roll dialog
 * @param {string} [title]          The dice roll UI window title
 * @param {object} [dialogOptions]  Configuration dialog options
 *
 * @param {boolean} [chatMessage=true] Automatically create a Chat Message for the result of this roll
 * @param {object} [messageData={}] Additional data which is applied to the created Chat Message, if any
 * @param {string} [rollMode]       A specific roll mode to apply as the default for the resulting roll
 * @param {object} [speaker]        The ChatMessage speaker to pass when creating the chat
 * @param {string} [flavor]         Flavor text to use in the posted chat message
 *
 * @return {Promise<DamageRoll|null>} The evaluated DamageRoll, or null if the workflow was canceled
 */
//@ts-expect-error
export async function damageRoll({ 
//@ts-expect-error
parts = [], 
//@ts-expect-error
data, // Roll creation
//@ts-expect-error
critical = false, 
//@ts-expect-error
damType, 
//@ts-expect-error
damageType, 
//@ts-expect-error
criticalBonusDice, 
//@ts-expect-error
criticalMultiplier, 
//@ts-expect-error
multiplyNumeric, // Damage customization
//@ts-expect-error
fastForward = false, 
//@ts-expect-error
event, 
//@ts-expect-error
allowCritical = true, 
//@ts-expect-error
template, 
//@ts-expect-error
title, 
//@ts-expect-error
dialogOptions, // Dialog configuration
//@ts-expect-error
chatMessage = false, 
//@ts-expect-error
messageData = {}, 
//@ts-expect-error
rollMode, 
//@ts-expect-error
speaker, 
//@ts-expect-error
canMult, 
//@ts-expect-error
flavor, 
//@ts-expect-error
mRoll
//@ts-expect-error
 } = {}) {
    console.log(canMult);
    // Handle input arguments
    const defaultRollMode = rollMode || game.settings.get("core", "rollMode");
    // Construct the DamageRoll instance
    const formula = parts.join(" + ");
    const { isCritical, isFF } = _determineCriticalMode({ critical, fastForward, event });
    //@ts-expect-error
    const roll = new CONFIG.Dice.DamageRoll(formula, data, {
        flavor: flavor || title,
        critical: isCritical,
        criticalBonusDice,
        criticalMultiplier,
        multiplyNumeric,
        damType,
        mRoll,
        damageType
    });
    // Prompt a Dialog to further configure the DamageRoll
    if (!isFF) {
        const configured = await roll.configureDialog({
            title,
            defaultRollMode: defaultRollMode,
            defaultCritical: isCritical,
            template,
            allowCritical,
            mRoll,
            canMult,
            damType
        }, dialogOptions);
        if (configured === null)
            return null;
    }
    // Evaluate the configured roll
    await roll.evaluate({ async: true });
    // Create a Chat Message
    if (speaker) {
        console.warn(`You are passing the speaker argument to the damageRoll function directly which should instead be passed as an internal key of messageData`);
        messageData.speaker = speaker;
    }
    if (roll && chatMessage)
        await roll.toMessage(messageData);
    return roll;
}
/* -------------------------------------------- */
/**
 * Determines whether this d20 roll should be fast-forwarded, and whether advantage or disadvantage should be applied
 * @returns {{isFF: boolean, isCritical: boolean}}  Whether the roll is fast-forward, and whether it is a critical hit
 */
//@ts-expect-error
function _determineCriticalMode({ event, critical = false, fastForward = false } = {}) {
    const isFF = fastForward || (event && (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey));
    if (event?.altKey)
        critical = true;
    return { isFF, isCritical: critical };
}
