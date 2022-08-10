<svelte:options accessors={true} />

<script>
  import SettingsSubmitButton from "../../general svelte components and dialogs/SettingsSubmitButton.svelte";
  import { uuidv4 } from "@typhonjs-fvtt/runtime/svelte/util";
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
  import { ARd20 } from "../../helpers/config.js";
  const setting = "proficiencies"
  let data = game.settings.get("ard20", "proficiencies");
  console.log(data);
  function removeAllAll() {
    for (const item of Object.values(data)) {
      item.value = [];
    }
    console.log(data);
    data = data;
  }
  function removeAll(type) {
    data[type].value = [];
    data = data;
  }
  function add(type) {
    data[type].value = [
      ...data[type].value,
      { id: uuidv4(), name: `New ${type}`, type: Object.keys(selectArr[type])[0] },
    ];
    data = data;
  }
  function setDefaultGroup(type) {
    console.log([...game.settings.settings].filter((set) => set[0] === "ard20.proficiencies")[0][1].default);
    data[type].value = [
      ...[...game.settings.settings].filter((set) => set[0] === "ard20.proficiencies")[0][1].default[type].value,
    ];
    data = data;
  }
  function setDefaultAll() {
    console.log([...game.settings.settings].filter((set) => set[0] === "ard20.proficiencies")[0][1].default);
    data = duplicate([...game.settings.settings].filter((set) => set[0] === "ard20.proficiencies")[0][1].default);
  }
  function remove(key, type) {
    const index = data[type].value.findIndex((entry) => entry.id === key);
    if (index >= 0) {
      data[type].value.splice(index, 1);
      data = data;
    }
  }
  export let elementRoot;
  let activeTabValue = "weapon";
  const handleClick = (tabValue) => () => (activeTabValue = tabValue);
  let selectArr = {
    weapon: ARd20.WeaponType,
    armor: { light: "light", medium: "medium", heavy: "heavy" },
    tool: {},
  };
  async function Submit() {
    await game.settings.set("ard20", "proficiencies", data);
  }
</script>

<ApplicationShell bind:elementRoot>
  <div class="flexrow">
    <button on:click={() => removeAllAll()}>Remove All</button>
    <button on:click={() => setDefaultAll()}>Reset All</button>
  </div>
  <ul>
    {#each Object.values(data) as item}
      <li class={activeTabValue === item.id ? "active" : ""}>
        <span on:click={handleClick(item.id)}>{item.label}</span>
      </li>
    {/each}
  </ul>

  <div class="box">
    {#each Object.values(data) as item (item)}
      {#if activeTabValue === item.id}
        <div class="flexrow">
          <button on:click={() => add(item.id)}>Add {item.label}</button>
          <button on:click={() => setDefaultGroup(item.id)}>Reset to default</button>
          <button on:click={() => removeAll(item.id)}>Remove All {item.label}</button>
        </div>
        <hr />
        <div>
          {#each item.value as entry (entry.id)}
            <div class="flexrow">
              <input bind:value={entry.name} />
              <select bind:value={entry.type}>
                {#each Object.entries(selectArr[item.id]) as opt}
                  <option value={opt[0]}>{localize(opt[1])}</option>
                {/each}
              </select>
              <button on:click={() => remove(entry.id, item.id)} class="minus far fa-minus-square" />
            </div>
          {/each}
        </div>
      {/if}
    {/each}
  </div>
  <SettingsSubmitButton {setting} {data}/>
</ApplicationShell>

<style lang="scss">
  button {
    max-height: 2em;
  }
  .box {
    background-color: #c9c7b8;
    margin-bottom: 10px;
    padding: 10px;
    border: 2px solid #dee2e6;
    border-radius: 0 0 0.5rem 0.5rem;
    border-top: 0;
  }
  ul {
    display: flex;
    flex-wrap: wrap;
    padding-left: 0;
    margin-bottom: 0;
    list-style: none;
    border-bottom: 1px solid #dee2e6;
    justify-content: space-evenly;
    align-content: space-around;
    max-height: 3em;
  }
  li {
    margin-bottom: -0.5em;
  }

  span {
    border: 1px solid transparent;
    border-top-left-radius: 0.25rem;
    border-top-right-radius: 0.25rem;
    display: block;
    padding: 0.5rem 1rem;
    cursor: pointer;
  }

  span:hover {
    border-color: #b5b3a4 #b5b3a4 #dee2e6;
    background-color: #c9c7b8;
  }

  li.active > span {
    color: rgb(0, 0, 0);
    background-color: #c9c7b8;
    border-left: 2px solid;
    border-top: 2px solid;
    border-right: 2px solid;
    border-color: #dee2e6 #dee2e6 #c9c7b8;
  }
</style>
