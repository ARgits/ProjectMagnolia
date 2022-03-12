<svelte:options accessors={true} />

<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  export let elementRoot;
  let setting = game.settings.get("ard20", "feat");
  function Delete(type, index) {
    setting[type] = setting[type].splice(index, 1);
    game.settings.set("ard20", "feat", setting);
  }
  function Add(type) {
    setting[type] = setting[type].push(`new ${type}`);
    game.settings.set("ard20", "feat", setting);
  }
</script>

<ApplicationShell bind:elementRoot>
  <section class="sheet-body">
    <div class="flexcol">
      packs
      {#each setting.packs as pack, i}
        <div class="grid grid-2col">
          <input type="text" bind:value={pack} />
          <button on:click={Delete("packs", i)} class="minus far fa-minus-square" />
        </div>
      {/each}
      <button on:click={Add("packs")} class="add far fa-plus-square" />
      <hr />
      folders
      {#each setting.folders as folder, i}
        <div class="grid grid-2col">
          <input type="text" bind:value={folder} />
          <button on:click={Delete("folders", i)} class="minus far fa-minus-square" />
        </div>
      {/each}
      <button on:click={Add("folders")} class="add far fa-plus-square" />
    </div>
  </section>
</ApplicationShell>
