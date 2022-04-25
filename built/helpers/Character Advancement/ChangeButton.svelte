<script>
  import { getContext } from "svelte";
  export let max;
  export let min;
  export let type;
  export let subtype;
  export let cost;
  const doc = getContext("chaAdvActorData");
  const changes = getContext("chaAdvXpChanges");
  let disabled;
  $: {
    switch (type) {
      case "attributes":
        disabled =
          $doc[type][subtype].value === max || $doc[type][subtype].value === min || $doc.advancement.xp.get < cost;
        break;
      case "skills":
        disabled =
          $doc[type][subtype].level === max || $doc[type][subtype].level === min || $doc.advancement.xp.get < cost;
        break;
      case "features":
        console.log(max,min)
        disabled =
          $doc[type][subtype].data.level.initial === max ||
          $doc[type][subtype].data.level.initial === min ||
          $doc.advancement.xp.get < cost;
        break;
    }
  }
  function increase(type, subtype) {
    doc.update((store) => {
      switch (type) {
        case "attributes":
          store.attributes[subtype].value += 1;
          break;
        case "skills":
          store.skills[subtype].level += 1;
          break;
        case "features":
          store.features[subtype].data.level.initial += 1;
          break;
      }
      store.advancement.xp.used += cost;
      store.advancement.xp.get -= cost;
      return store;
    });
    changes.update((changeArr) => {
      changeArr.push({ type: type, subtype: subtype, value: cost });
      return changeArr;
    });
  }
  function decrease(type, subtype) {
    doc.update((store) => {
      switch (type) {
        case "attributes":
          store.attributes[subtype].value -= 1;
          break;
        case "skills":
          store.skills[subtype].level -= 1;
          break;
        case "features":
          store.features[subtype].data.level.initial -= 1;
          break;
      }
      let index = -1;
      $changes.forEach((change, key) => {
        index = change.type === type && change.subtype === subtype && key > index ? key : index;
      });
      if (index >= 0) {
        store.advancement.xp.used -= $changes[index].value;
        store.advancement.xp.get += $changes[index].value;
        return store;
      }
    });
    changes.update((changeArr) => {
      let index = -1;
      changeArr.forEach((change, key) => {
        index = change.type === type && change.subtype === subtype && key > index ? key : index;
      });
      if (index >= 0) {
        changeArr.splice(index, 1);
        changeArr = changeArr;
      }
      return changeArr;
    });
  }
</script>

{#if max !== undefined}
  <button class="change" {disabled} on:click={() => increase(type, subtype)}> + </button>
{/if}
{#if min !== undefined}
  <button class="change" {disabled} on:click={() => decrease(type, subtype)}> - </button>
{/if}

<style>
  button:active {
    transform: translateY(0.1em);
  }
</style>
