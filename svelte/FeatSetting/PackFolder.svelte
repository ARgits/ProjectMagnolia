<script>
  export let feat
  import setting from "./featSetting-shell.svelte";
  function Delete(type, index) {
    setting[type] = setting[type].splice(index, 1);
    game.settings.set("ard20", "feat", setting);
  }
</script>

<div class="grid grid-2col">
  <input type="text" bind:value={feat.name} />
  <button on:click={Delete("packs", feat.id)} class="minus far fa-minus-square" />
</div>
