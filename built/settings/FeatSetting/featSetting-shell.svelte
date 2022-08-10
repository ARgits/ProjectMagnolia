<svelte:options accessors={true} />

<script>
  import SettingsSubmitButton from "../../general svelte components and dialogs/SettingsSubmitButton.svelte";
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import { uuidv4 } from "@typhonjs-fvtt/runtime/svelte/util";
  export let elementRoot;
  const setting="feat"
  export let data = game.settings.get("ard20", "feat");
  console.log(data);

  function addEntry(type) {
    const name = `New ${type}`.slice(0, -1);
    const id = uuidv4();
    data[type] = [...data[type], { name: name, id: id }];
    console.log(data);
    data = data;
  }
  function deleteEntry(type, id) {
    console.log(type);
    const index = data[type].findIndex((entry) => entry.id === id);
    if (index >= 0) {
      console.log(data[type]);
      data[type].splice(index, 1);
      data = data;
    }
  }

  async function Submit() {
    await game.settings.set("ard20", "feat", data);
  }
</script>

<ApplicationShell bind:elementRoot>
  <section class="sheet-body">
    <div class="flexcol">
      packs
      {#each data.packs as pack (pack.id)}
        <div class="grid grid-2col">
          <input type="text" bind:value={pack.name} />
          <button on:click={() => deleteEntry("packs", pack.id)} class="minus far fa-minus-square" />
        </div>
      {/each}
      <button on:click={() => addEntry("packs")} class="add far fa-plus-square" />
      <hr />
      folders
      {#each data.folders as folder (folder.id)}
        <div class="grid grid-2col">
          <input type="text" bind:value={folder.name} />
          <button on:click={() => deleteEntry("folders", folder.id)} class="minus far fa-minus-square" />
        </div>
      {/each}
      <button on:click={() => addEntry("folders")} class="add far fa-plus-square" />
    </div>
  </section>
  <SettingsSubmitButton {setting} {data} />
</ApplicationShell>
