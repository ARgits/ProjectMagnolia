<svelte:options accessors={true} />

<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  export let elementRoot;
  let featSetting = game.settings.get("ard20", "feat");
  console.log(featSetting);

  async function AddNew(type) {
    console.log(type);
    featSetting[type] = [...featSetting[type], { name: `new ${type}`, id: featSetting[type].length-1 }];
    featSetting = featSetting;
    console.log(featSetting);
    await game.settings.set("ard20", "feat", featSetting);
  }
  async function Delete(type, index) {
    console.log(type);
    featSetting[type].splice(index, 1);
    featSetting = featSetting;
    console.log(featSetting[type]);
    await game.settings.set("ard20", "feat", featSetting);
  }
  async function changeSetting(){
    await game.settings.set('ard20','feat',featSetting)
    console.log(featSetting)
  }
</script>

<ApplicationShell bind:elementRoot>
    <section class="sheet-body">
      <div class="flexcol">
        packs
        {#each featSetting.packs as pack (pack.id)}
          <div class="grid grid-2col">
            <input type="text" bind:value={pack.name} on:change={changeSetting} />
            <button on:click={() => Delete("packs", pack.id)} class="minus far fa-minus-square" />
          </div>
        {/each}
        <button on:click={() => AddNew("packs")} class="add far fa-plus-square" />
        <hr />
        folders
        {#each featSetting.folders as folder (folder.id)}
          <div class="grid grid-2col">
            <input type="text" bind:value={folder.name} on:change={changeSetting} />
            <button on:click={() => Delete("folders", folder.id)} class="minus far fa-minus-square" />
          </div>
        {/each}
        <button on:click={() => AddNew("folders")} class="add far fa-plus-square" />
      </div>
    </section>
</ApplicationShell>
