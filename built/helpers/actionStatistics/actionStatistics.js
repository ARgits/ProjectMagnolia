import { SvelteApplication } from "@typhonjs-fvtt/runtime/svelte/application";
import ActionStatisticsShell from "./ActionStatisticsShell.svelte";

export default class ActionStatistics extends SvelteApplication {
    constructor(object) {
        super(object);
        this.prepareData(object);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: "Action Statistics",
            width: 800,
            height: 600,
            resizable: true,
            minimizable: true,
            svelte: {
                class: ActionStatisticsShell,
                target: document.body,
            },
        });
    }

    prepareData(object) {
        console.log(object);
        this.statistics = object;
        this.actions = [];
        for (const target of object) {
            const newObj = [...target.stats];
            const mainAct = newObj.filter(t => t.level === 0)[0];
            const index = newObj.findIndex((t) => t.level === 0 && t.parentID === null);
            if (index) {
                newObj.splice(index, 1);
            }
            console.log(mainAct);
            mainAct.subAct = createTree(newObj, 1, mainAct.id);

            function createTree(obj, level, parentId) {

                console.log(level, parentId);
                let act = obj.filter((t) => t.level === level && t.parentID === parentId);
                for (let ac of act) {
                    const index = obj.findIndex(
                        (t) => t.level === level && t.parentID === parentId
                    );
                    console.log(index);
                    if (index) {
                        obj.splice(index, 1);
                    }
                }
                if (obj.length !== 0) {
                    for (let ac of act) {
                        ac.subAct = createTree(obj, ac.level + 1, ac.id);
                    }
                }
                return act;
            }

            console.log(mainAct);
            this.actions.push([target.token, mainAct]);
        }
    }
}