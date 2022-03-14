<svelte:options accessors={true} />

<script context="module">
  export async function deleteEntry(type, id) {
    console.log(type);
    const index = featSetting[type].findIndex((entry) => entry.id === id);
    if (index >= 0) {
      console.log(featSetting[type]);
      featSetting[type].splice(index, 1);
      await game.settings.set("ard20", "feat", featSetting);
      featSetting = featSetting;
    }
  }
  export async function changeSetting() {
    await game.settings.set("ard20", "feat", featSetting);
    console.log(featSetting);
  }
</script>

<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import { uuidv4 } from "@typhonjs-fvtt/runtime/svelte/util";
  import FeatPack from "./FeatPack.svelte";
  export let elementRoot;
  let featSetting = game.settings.get("ard20", "feat");
  async function addEntry(type) {
    const name = `New ${type}`.slice(0, -1);
    const id = uuidv4();
    featSetting[type] = [...featSetting[type], { name: name, id: id }];
    console.log(featSetting);
    await game.settings.set("ard20", "feat", featSetting);
    featSetting = featSetting;
  }
</script>

<ApplicationShell bind:elementRoot>
  <section class="sheet-body">
    <div class="flexcol">
      packs
      {#each featSetting.packs as pack (pack.id)}
        <FeatPack {pack} type={"packs"} />
      {/each}
      <button on:click={() => addEntry("packs")} class="add far fa-plus-square" />
      <hr />
      folders
      {#each featSetting.folders as folder (folder.id)}
        <FeatPack {folder} type={"folders"} />
      {/each}
      <button on:click={() => addEntry("folders")} class="add far fa-plus-square" />
    </div>
  </section>
</ApplicationShell>
