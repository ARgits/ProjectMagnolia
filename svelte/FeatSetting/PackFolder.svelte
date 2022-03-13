<script>
  export let name;
  export let id;
  import setting from "./featSetting-shell.svelte";
  function Delete(type, index) {
    setting[type] = setting[type].splice(index, 1);
    game.settings.set("ard20", "feat", setting);
  }
</script>

<div class="grid grid-2col">
  <input type="text" bind:value={name} />
  <button on:click={Delete("packs", id)} class="minus far fa-minus-square" />
</div>
