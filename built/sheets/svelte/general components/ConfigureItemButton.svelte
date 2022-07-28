<svelte:options accessors={true} />

<script>
  import { getContext } from "svelte";

  export let item = null;
  export let action;
  const buttons = getContext("ConfigButtons");
  const func = buttons[action].function;
  const className = buttons[action].class;
  const tooltip = action === "create" && item ? buttons[action].tooltip(item) : buttons[action].tooltip;
</script>

<i
  on:click={() => {
    func(item);
  }}
  class={className}
  data-tooltip={tooltip}
/>

<style lang="scss">
  i:hover {
    cursor: pointer;
    text-shadow: 0px 0px 10px blue;
  }
</style>
