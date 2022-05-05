<svelte:options accessors={true} />

<script>
  import SettingsSubmitButton from "../../general svelte components/SettingsSubmitButton.svelte";
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import { uuidv4 } from "@typhonjs-fvtt/runtime/svelte/util";
  export let elementRoot;
  const setting = "profLevel";
  let data = game.settings.get("ard20", "profLevel");
  function addEntry() {
    const key = "newKey";
    const label = `New level`;
    const id = uuidv4();
    data = [...data, { key: key, label: label, id: id }];
    console.log(data);
    data = data;
  }
  function deleteEntry(id) {
    const index = data.findIndex((entry) => entry.id === id);
    if (index >= 0) {
      data.splice(index, 1);
      data = data;
    }
  }
  async function Submit() {
    await game.settings.set("ard20", "profLevel", data);
    game.actors.forEach((actor) => {
      actor.prepareData();
      actor._sheet.render(true);
    });
  }
</script>

<ApplicationShell bind:elementRoot>
  <button on:click={addEntry}>Add level</button>
  {#each data as setting}
    <div class="grid grid-5col">
      <label for="setting.key">Key:</label>
      <input bind:value={setting.key} type="text" />
      <label for="setting.label">Name</label>
      <input bind:value={setting.label} type="text" />
      <button
        class="minus far fa-minus-square"
        on:click={() => {
          deleteEntry(setting.id);
        }}
      />
    </div>
  {/each}
  <SettingsSubmitButton {setting} {data} />
</ApplicationShell>
