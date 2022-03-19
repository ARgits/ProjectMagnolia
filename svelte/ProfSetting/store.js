import { readable } from "svelte/store";
import { uuidv4 } from "@typhonjs-fvtt/runtime/svelte/util";
let store;
Hooks.once("ready", async function () {
  let cntr = 0;
  let id;
  const set = game.settings.get("ard20", "proficiencies");
  store = readable(set)

  store.add = (type) => {
    store.update((st) => {
      cntr++;
      id = uuidv4();
      if (type === "weapon") {
        st[type].value.push({ id: id, name: "New weapon", type: "amb" });
      } else if (type === "armor") {
        st[type].value.push({ id: id, name: "New armor", type: "light" });
      } else if (type === "tool") {
        st[type].value.push({ id: id, name: "New Tool" });
      }
      return st;
    });
  };

  store.remove = (id, type) => {
    store.update((array) => {
      const index = array[type].value.findIndex((entry) => entry.id === id);
      if (index >= 0) {
        array[type].value.splice(index, 1);
      }
      return array;
    });
  };

  store.remove3 = (type) => {
    store.update((array) => {
      array[type].value.splice(0, 3);
      return array;
    });
  };
  store.removeAll = (type) => {
    store.update((st) => {
      st[type].value = [];
      return st;
    });
  };
  store.removeAllAll = () => {
    store.set({
      weapon: { label: "weapon", value: [], id: "weapon" },
      armor: { label: "armor", value: [], id: "armor" },
      tool: { label: "tool", value: [], id: "tool" },
    });
  };
  store.setDefaultAll = () => {
    const defaultValue = [...game.settings.settings].filter((set) => set[0] === "ard20.proficiencies")[0][1].default;
    console.log(defaultValue);
    store.set(defaultValue);
  };
  store.setDefaultGroup = (type) => {
    store.update((st) => {
      const defaultValue = [...game.settings.settings].filter((set) => set[0] === "ard20.proficiencies")[0][1].default[type];
      console.log(defaultValue);
      st[type] = defaultValue;
      return st
    });
  };
});
export { store };
