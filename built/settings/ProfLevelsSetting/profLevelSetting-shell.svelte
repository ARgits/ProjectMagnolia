<svelte:options accessors={true} />

<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import { uuidv4 } from "@typhonjs-fvtt/runtime/svelte/util";
  export let elementRoot;
  let settings = game.settings.get("ard20", "profLevel");
  async function addEntry() {
    const key = "newKey";
    const label = `New level`;
    const id = uuidv4();
    settings = [...settings, { key: key, label: label, id: id }];
    console.log(settings);
    await game.settings.set("ard20", "profLevel", settings);
    settings = settings;
  }
  async function deleteEntry(id) {
    const index = settings.findIndex((entry) => entry.id === id);
    if (index >= 0) {
      settings.splice(index, 1);
      await game.settings.set("ard20", "profLevel", settings);
      settings = settings;
    }
  }
  async function changeSetting() {
    await game.settings.set("ard20", "profLevel", settings);
    
    console.log(settings);
  }
</script>

<ApplicationShell bind:elementRoot>
  {#each settings as setting}
    <div class="grid grid-5col">
      <label for="setting.key">Key:</label>
      <input bind:value={setting.key} on:change={changeSetting} type="text" />
      <label for="setting.label">Name</label>
      <input bind:value={setting.label} on:change={changeSetting} type="text" />
      <button
        class="minus far fa-minus-square"
        on:click={() => {
          deleteEntry(setting.id);
        }}
      />
    </div>
  {/each}
  <button on:click={addEntry} class="add far fa-plus-square" />
</ApplicationShell>
