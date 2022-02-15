/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
    return loadTemplates([
        // Actor partials.
        "systems/ard20/templates/actor/parts/actor-features.html",
        "systems/ard20/templates/actor/parts/actor-items.html",
        "systems/ard20/templates/actor/parts/actor-spells.html",
        "systems/ard20/templates/actor/parts/actor-effects.html",
        "systems/ard20/templates/actor/parts/actor-equip.html",
        // Character Advancement
        "systems/ard20/templates/actor/parts/actor-adv.html",
        // Settings
        "systems/ard20/templates/app/prof-settings.html",
        "systems/ard20/templates/app/feat-settings.html",
        // Requirements for features
        "systems/ard20/templates/app/feat_req.hbs",
    ]);
};
