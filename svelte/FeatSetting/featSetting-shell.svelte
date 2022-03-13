<svelte:options accessors={true} />

<script>
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  export let elementRoot;
  let featSetting = game.settings.get("ard20", "feat");
  console.log(featSetting);

  async function AddNew(type) {
    console.log(type);
    let name = `new ${type}`.slice(0, -1);
    let id = name + featSetting[type].length;
    featSetting[type] = [...featSetting[type], { name: name, id: id }];
    console.log(featSetting);
    await game.settings.set("ard20", "feat", featSetting);
  }
  async function Delete(type, name) {
    console.log(type);
    featSetting[type] = featSetting[type].filter((item) => item !== name);
    console.log(featSetting[type]);
    await game.settings.set("ard20", "feat", featSetting);
  }
  async function changeSetting() {
    
    await game.settings.set("ard20", "feat", featSetting);
    console.log(featSetting);
  }
</script>

<ApplicationShell bind:elementRoot>
  <section class="sheet-body">
    <div class="flexcol">
      packs
      {#each featSetting.packs as pack (pack)}
        <div class="grid grid-2col">
          <input type="text" bind:value={pack} on:change={changeSetting} />
          <button on:click={() => Delete("packs", pack)} class="minus far fa-minus-square" />
        </div>
      {/each}
      <button on:click={() => AddNew("packs")} class="add far fa-plus-square" />
      <hr />
      folders
      {#each featSetting.folders as folder (folder)}
        <div class="grid grid-2col">
          <input type="text" bind:value={folder} on:change={changeSetting} />
          <button on:click={() => Delete("folders", folder)} class="minus far fa-minus-square" />
        </div>
      {/each}
      <button on:click={() => AddNew("folders")} class="add far fa-plus-square" />
    </div>
  </section>
</ApplicationShell>
