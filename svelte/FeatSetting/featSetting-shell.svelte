<svelte:options accessors={true} />

<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  export let elementRoot;
  //export let form;
  export let setting = game.settings.get("ard20", "feat");
  console.log(setting);

  function Add(type) {
    console.log(type);
    setting[type] = [...setting[type], { name: `new ${type}`, id: setting[type].length + 1 }];
    console.log(setting[type]);
    game.settings.set("ard20", "feat", setting);
  }
  function Delete(type, index) {
    setting[type] = setting[type].splice(index, 1);
    game.settings.set("ard20", "feat", setting);
  }
</script>

<ApplicationShell bind:elementRoot>
  <section class="sheet-body">
    <div class="flexcol">
      packs
      {#each setting.packs as pack (pack.id)}
        <div class="grid grid-2col">
          <input type="text" bind:value={pack.name} />
          <button on:click={Delete("packs", pack.id)} class="minus far fa-minus-square" />
        </div>
      {/each}
      <button on:click={Add("packs")} class="add far fa-plus-square" />
      <hr />
      folders
      {#each setting.folders as folder (folder.id)}
        <div class="grid grid-2col">
          <input type="text" bind:value={folder.name} />
          <button on:click={Delete("packs", folder.id)} class="minus far fa-minus-square" />
        </div>
      {/each}
      <button on:click={Add("folders")} class="add far fa-plus-square" />
    </div>
  </section>
</ApplicationShell>
