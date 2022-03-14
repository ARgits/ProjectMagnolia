<script>
  import { deleteEntry, changeSetting } from "./featSetting-shell.svelte";
  let pack
  let type
</script>

<div class="grid grid-2col">
    <input type="text" bind:value={pack.name} on:change={changeSetting} />
    <button on:click={() => deleteEntry(type, pack.id)} class="minus far fa-minus-square" />
</div>

