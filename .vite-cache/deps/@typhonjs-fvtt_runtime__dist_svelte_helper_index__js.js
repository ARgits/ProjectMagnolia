import "./chunk-S5KM4IGW.js";

// node_modules/@typhonjs-fvtt/runtime/_dist/svelte/helper/index.js
function radioBoxes(name, choices, options) {
    const checked = options["checked"] || null;
    const localize2 = options["localize"] || false;
    let html = "";
    for (let [key, label] of Object.entries(choices)) {
        if (localize2) {
            label = game.i18n.localize(label);
        }
        const isChecked = checked === key;
        html += `<label class="checkbox"><input type="radio" name="${name}" value="${key}" ${isChecked ? "checked" : ""}> ${label}</label>`;
    }
    return html;
}

function selectOptions(choices, options) {
    var _a, _b, _c;
    const localize2 = (_a = options["localize"]) != null ? _a : false;
    let selected = (_b = options["selected"]) != null ? _b : null;
    const blank = (_c = options["blank"]) != null ? _c : null;
    const nameAttr = options["nameAttr"];
    const labelAttr = options["labelAttr"];
    const inverted = !!options["inverted"];
    selected = selected instanceof Array ? selected.map(String) : [String(selected)];
    const option = (name, label) => {
        if (localize2) {
            label = game.i18n.localize(label);
        }
        const isSelected = selected.includes(String(name));
        html += `<option value="${name}" ${isSelected ? "selected" : ""}>${label}</option>`;
    };
    let html = "";
    if (blank !== null) {
        option("", blank);
    }
    if (choices instanceof Array) {
        for (const choice of choices) {
            option(choice[nameAttr], choice[labelAttr]);
        }
    }
    else {
        for (const choice of Object.entries(choices)) {
            let [key, value] = inverted ? choice.reverse() : choice;
            if (nameAttr) {
                key = value[nameAttr];
            }
            if (labelAttr) {
                value = value[labelAttr];
            }
            option(key, value);
        }
    }
    return html;
}

function localize(stringId, data) {
    const result = typeof data !== "object" ? game.i18n.localize(stringId) : game.i18n.format(stringId, data);
    return result !== void 0 ? result : "";
}

export {
    localize,
    radioBoxes,
    selectOptions
};
//# sourceMappingURL=@typhonjs-fvtt_runtime__dist_svelte_helper_index__js.js.map
