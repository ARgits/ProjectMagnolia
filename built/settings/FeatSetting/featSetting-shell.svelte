<svelte:options accessors={true} />

<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import { uuidv4 } from "@typhonjs-fvtt/runtime/svelte/util";
  export let elementRoot;
  export let featSetting = game.settings.get("ard20", "feat");
  console.log(featSetting);

  function addEntry(type) {
    const name = `New ${type}`.slice(0, -1);
    const id = uuidv4();
    featSetting[type] = [...featSetting[type], { name: name, id: id }];
    console.log(featSetting);
    featSetting = featSetting;
  }
  function deleteEntry(type, id) {
    console.log(type);
    const index = featSetting[type].findIndex((entry) => entry.id === id);
    if (index >= 0) {
      console.log(featSetting[type]);
      featSetting[type].splice(index, 1);
      featSetting = featSetting;
    }
  }

  async function Submit() {
    await game.settings.set("ard20", "feat", featSetting);
  }
</script>

<ApplicationShell bind:elementRoot>
  <section class="sheet-body">
    <div class="flexcol">
      packs
      {#each featSetting.packs as pack (pack.id)}
        <div class="grid grid-2col">
          <input type="text" bind:value={pack.name} />
          <button on:click={() => deleteEntry("packs", pack.id)} class="minus far fa-minus-square" />
        </div>
      {/each}
      <button on:click={() => addEntry("packs")} class="add far fa-plus-square" />
      <hr />
      folders
      {#each featSetting.folders as folder (folder.id)}
        <div class="grid grid-2col">
          <input type="text" bind:value={folder.name} />
          <button on:click={() => deleteEntry("folders", folder.id)} class="minus far fa-minus-square" />
        </div>
      {/each}
      <button on:click={() => addEntry("folders")} class="add far fa-plus-square" />
    </div>
  </section>
  <button on:click={Submit}>Submit</button>
</ApplicationShell>
