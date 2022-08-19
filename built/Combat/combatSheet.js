import { SvelteApplication } from "@typhonjs-fvtt/runtime/svelte/application";
import CombatShell from "./CombatShell.svelte";

export default class ARd20CombatEncounterSheet extends SvelteApplication {
    constructor(object) {
        super(object);
        console.log(object);
        if (!this.popOut) {
            game.combats.apps.push(this);
        }
        /**
         * The base name of this sidebar tab
         * @type {string}
         */
        this.tabName = this.constructor.defaultOptions.id;

        /**
         * A reference to the pop-out variant of this SidebarTab, if one exists
         * @type {SidebarTab}
         * @protected
         */
        this._popout = null;

        /**
         * Denote whether this is the original version of the sidebar tab, or a pop-out variant
         * @type {SidebarTab}
         */
        this._original = null;

        // Adjust options
        if (this.options.popOut) {
            this.options.classes.push("sidebar-popout");
        }
        this.options.classes.push(`${this.options.id}-sidebar`);

        // Register the tab as the sidebar singleton
        if (!this.popOut && ui.sidebar) {
            ui.sidebar.tabs[this.tabName] = this;
        }
        this.initialize({ render: false });
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            title: "Combat tracker",
            width: 800,
            height: 600,
            resizable: true,
            minimizable: true,
            svelte: {
                class: CombatShell,
                target: document.body,
                props: {},
            },
        });
    }

    initialize({ combat = null, render = true } = {}) {
        // Retrieve a default encounter if none was provided
        if (combat === null) {
            const combats = this.combats;
            combat = combats.length ? combats.find(c => c.active) || combats[0] : null;
        }

        // Set flags
        this.viewed = combat;
        this._highlighted = null;

        // Trigger data computation
        if (combat && !combat.turns) {
            combat.turns = combat.setupTurns();
        }

        // Also initialize the popout
        if (this._popout) {
            this._popout.initialize({ combat, render: false });
        }

        // Render the tracker
        if (render) {
            this.render();
        }
    }
}