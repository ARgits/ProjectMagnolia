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
          $doc.actorData[type][subtype].value === max || $doc.actorData[type][subtype].value === min || $doc.actorData.advancement.xp.get < cost;
        break;
      case "skills":
        disabled =
          $doc.actorData[type][subtype].level === max || $doc.actorData[type][subtype].level === min || $doc.actorData.advancement.xp.get < cost;
        break;
    }
  }
  function increase(type, subtype) {
    doc.update((store) => {
      switch (type) {
        case "attributes":
          store.actorData.attributes[subtype].value += 1;
          break;
        case "skills":
          store.actorData.skills[subtype].level += 1;
          break;
      }
      store.actorData.advancement.xp.used += cost;
      store.actorData.advancement.xp.get -= cost;
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
          store.actorData.attributes[subtype].value -= 1;
          break;
        case "skills":
          store.actorData.skills[subtype].level -= 1;
          break;
      }
      let index = -1;
      $changes.forEach((change, key) => {
        index = change.type === type && change.subtype === subtype && key > index ? key : index;
      });
      if (index >= 0) {
        store.actorData.advancement.xp.used -= $changes[index].value;
        store.actorData.advancement.xp.get += $changes[index].value;
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
