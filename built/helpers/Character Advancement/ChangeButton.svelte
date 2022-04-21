<script>
  import { getContext } from "svelte";
  export let max;
  export let min;
  export let type;
  export let subtype;
  const formulas = getContext("chaAdvXpFormulas").formulas;
  let variables = {};
  Object.values(getContext("chaAdvXpFormulas").variables).forEach((val) => {
    variables[`${val.shortName}`] = val.value;
  });
  const doc = getContext("chaAdvActorData");
  let disabled;
  $: disabled = $doc[`${type}`][`${subtype}`].value === max || $doc[`${type}`][`${subtype}`].value === min;
  function increase(type, subtype) {
    doc.update((store) => {
      switch (type) {
        case "attributes":
          variables.AS = store.attributes[`${subtype}`].value + 1;
          store.attributes[`${subtype}`].value += 1;
          store.advancement.xp.get += math.evaluate(formulas[type], variables);
          break;
        case "skills":
          store.skills[`${subtype}`].level += 1;
          break;
      }
      return store;
    });
  }
  function decrease(type, subtype) {
    doc.update((store) => {
      store[`${type}`][`${subtype}`].value -= 1;
      return store;
    });
  }
</script>

{#if max !== undefined}
  <button class="change" {disabled} on:click={() => increase(type, subtype)}>+ </button>
{/if}
{#if min !== undefined}
  <button class="change" {disabled} on:click={() => decrease(type, subtype)}>- </button>
{/if}

<style>
  button:active {
    transform: translateY(0.1em);
  }
</style>
