<script>
  export let feat

</script>

<div class="grid grid-2col">
  <input type="text" bind:value={feat.name} />
  <button on:click={Delete("packs", feat.id)} class="minus far fa-minus-square" />
</div>
