<svelte:options accessors={true} />

<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import PackFolder from "./PackFolder.svelte";
  export let elementRoot;
  export let setting = game.settings.get("ard20", "feat");
  console.log(setting);

  async function Add(type) {
    console.log(type)
    setting[type] = setting[type].push({ name: `new ${type}`, id: setting[type].length });
    console.log(setting[type])
    await game.settings.set("ard20", "feat", setting);
  }
</script>

<ApplicationShell bind:elementRoot>
  <section class="sheet-body">
    <div class="flexcol">
      packs
      {#each setting.packs as pack (pack.id)}
        <PackFolder {pack} />
      {/each}
      <button on:click={Add("packs")} class="add far fa-plus-square" />
      <hr />
      folders
      {#each setting.folders as folder (folder.id)}
        <PackFolder {folder} />
      {/each}
      <button on:click={Add("folders")} class="add far fa-plus-square" />
    </div>
  </section>
</ApplicationShell>
